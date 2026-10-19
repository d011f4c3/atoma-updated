/* Mobile Sample Set study regression. Catalog, destination and cart requests are
 * isolated fixtures; external traffic and all other writes are blocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";
import { money } from "../src/lib/product-selection.ts";
import { translate } from "../src/lib/i18n/index.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.SAMPLES_MOBILE_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.SAMPLES_MOBILE_EVIDENCE ??
  ".local/samples-mobile-study-0201/browser";
const filter = process.env.SAMPLES_MOBILE_FILTER;
const layouts = [
  ["current", "Original"],
  ["tabs", "Tabs"],
  ["compact", "Compact"],
  ["reveal", "Reveal"],
];
assert.ok(SAMPLE_SET_OFFER, "The reviewed sample offer is configured");

function catalogFor(destination, available) {
  const singapore = destination.countryCode === "SG";
  const sample = {
    id: "isolated-sample-set",
    handle: SAMPLE_SET_OFFER.productHandle,
    title: "Sample Set",
    description: "Isolated ordering study fixture: three 20 g samples.",
    productCode: null,
    imageUrl: null,
    imageAlt: "",
    productUrl: null,
    isFixture: true,
    variants: [
      {
        id: `v1_${(singapore ? "t" : "s").repeat(43)}`,
        selectionId: "sample-set-20g",
        title: "3 × 20 g",
        options: SAMPLE_SET_OFFER.variants[0].options,
        available,
        priceMinor: singapore ? 3800 : 2900,
        currency: destination.currency,
        minimum: 1,
        maximum: 4,
        increment: 1,
      },
    ],
  };
  const teas = SAMPLE_SET_CONTENTS.map((item, index) => ({
    ...sample,
    id: item.key,
    handle: item.productHandle,
    title: item.name,
    productCode: item.productCode,
    variants: ["1 kg", "200 g"].map((title, format) => ({
      id: `v1_${String.fromCharCode(97 + index * 2 + format + (singapore ? 6 : 0)).repeat(43)}`,
      selectionId: `${item.key}-${format}`,
      title,
      options: [{ name: "Format", value: title }],
      available: true,
      priceMinor: format ? (singapore ? 1700 : 1100) : singapore ? 8500 : 6500,
      currency: destination.currency,
      minimum: 1,
      maximum: 4,
      increment: 1,
    })),
  }));
  // Putting the set first catches accidental fallback into tea selection.
  return { sample, teas, products: [sample, ...teas] };
}

function cartFor(sample, quantity) {
  const variant = sample.variants[0];
  const total = money(variant.priceMinor * quantity, variant.currency);
  return {
    totalQuantity: quantity,
    subtotalLabel: total,
    totalLabel: total,
    lines: [
      {
        lineKey: `v1_${"x".repeat(43)}`,
        productHandle: sample.handle,
        productTitle: sample.title,
        variantTitle: variant.title,
        options: variant.options,
        quantity,
        unitPriceLabel: money(variant.priceMinor, variant.currency),
        lineTotalLabel: total,
        purchaseState: "purchasable",
        quantityRule: {
          minimum: variant.minimum,
          maximum: variant.maximum,
          increment: variant.increment,
        },
        canUpdateQuantity: true,
        canRemove: true,
        image: null,
      },
    ],
  };
}

async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

async function setup({
  width,
  tone,
  countryCode = "US",
  available = true,
  locale = "en",
  failed = false,
  reducedMotion = "reduce",
}) {
  const destination = {
    countryCode,
    currency: countryCode === "SG" ? "SGD" : "USD",
  };
  const catalog = catalogFor(destination, available);
  const context = await browser.newContext({
    viewport: { width, height: width <= 760 ? 844 : 900 },
    reducedMotion,
    hasTouch: width <= 760,
    isMobile: width <= 760,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: locale, url: baseURL },
  ]);
  const errors = [],
    actions = [];
  let currentCart = null;
  let catalogFailed = failed;
  let catalogReads = 0;
  let catalogGate = null;
  let releaseCatalog = null;
  let releaseAdd = null;
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (url.origin !== origin) {
      errors.push("External traffic blocked");
      return route.abort();
    }
    if (url.pathname === "/api/destination" && method === "GET")
      return route.fulfill({
        json: {
          kind: "ready",
          preference: { countryCode, source: "manual" },
          destination,
          countries: ["US", "SG"],
          reviewRequired: false,
        },
      });
    if (url.pathname === "/api/catalog" && method === "GET") {
      catalogReads++;
      await catalogGate;
      return route.fulfill({
        status: catalogFailed ? 503 : 200,
        json: {
          status: catalogFailed ? "unavailable" : "ready",
          destination,
          products: catalogFailed ? [] : catalog.products,
          shopUrl: "https://example.invalid",
        },
      });
    }
    if (url.pathname === "/api/cart" && method === "GET")
      return route.fulfill({
        json: {
          kind: currentCart ? "ready" : "empty",
          ...(currentCart ? { cart: currentCart } : {}),
          destination,
          destinationReviewRequired: false,
          checkoutEnabled: false,
        },
      });
    if (url.pathname === "/api/cart" && method === "POST") {
      const action = request.postDataJSON();
      actions.push(action);
      if (
        !available ||
        action.action !== "add" ||
        action.productHandle !== catalog.sample.handle ||
        action.variantKey !== catalog.sample.variants[0].id ||
        !Number.isSafeInteger(action.quantity) ||
        action.quantity < 1 ||
        action.quantity > 4 ||
        Object.keys(action).sort().join() !==
          "action,productHandle,quantity,variantKey"
      ) {
        errors.push("Unexpected cart mutation blocked");
        return route.abort();
      }
      await new Promise((done) => {
        releaseAdd = done;
      });
      releaseAdd = null;
      currentCart = cartFor(catalog.sample, action.quantity);
      return route.fulfill({
        json: {
          kind: "success",
          cart: currentCart,
          destination,
          destinationReviewRequired: false,
          checkoutEnabled: false,
        },
      });
    }
    if (url.pathname.startsWith("/api/") || !["GET", "HEAD"].includes(method)) {
      errors.push(`Unexpected API or write blocked: ${method} ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  return {
    page,
    context,
    errors,
    actions,
    ...catalog,
    width,
    tone,
    locale,
    t: (source, values) => translate(locale, source, values),
    catalogReads: () => catalogReads,
    failCatalog: (value) => {
      catalogFailed = value;
    },
    holdCatalog: () => {
      assert.equal(catalogGate, null);
      catalogGate = new Promise((done) => {
        releaseCatalog = done;
      });
    },
    completeCatalog: () => {
      assert.ok(releaseCatalog);
      releaseCatalog();
      releaseCatalog = null;
      catalogGate = null;
    },
    pending: () => releaseAdd !== null,
    completeAdd: () => {
      assert.ok(releaseAdd, "An isolated add request is awaiting its response");
      releaseAdd();
    },
    cleanup: async () => {
      releaseAdd?.();
      releaseCatalog?.();
      await context.close();
    },
  };
}

const panelFor = (page) => page.locator("[data-sample-order-panel]");
const purchaseFor = (page) => panelFor(page).locator("[data-sample-purchase]");

async function enter(fixture, layout = "tabs") {
  const { page, tone } = fixture;
  await page.goto(
    `${baseURL}/samples-mobile-study?layout=${layout}&tone=${tone}`,
  );
  await page.locator("[data-samples-mobile-study]").waitFor();
  await panelFor(page).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await eventually(
    async () =>
      (await page
        .locator("[data-embedded]")
        .getAttribute("data-entry-settled")) === "true",
    "The actual homepage sample selection finishes its entrance",
  );
}

async function openOrder(fixture) {
  const { page, width } = fixture;
  if (width > 760) return;
  const panel = panelFor(page);
  const layout = await panel.getAttribute("data-sample-mobile-layout");
  if (layout === "tabs")
    await panel.locator('[data-sample-mobile-view="order"]').click();
  else if (layout === "reveal") {
    const reveal = panel.locator("[data-sample-mobile-reveal]");
    if ((await reveal.getAttribute("aria-expanded")) !== "true")
      await reveal.click();
  }
  await purchaseFor(page).waitFor();
}

async function checkFit(fixture) {
  const { page, width } = fixture;
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "The study has no horizontal document overflow",
  );
  const overflow = await panelFor(page).evaluate((panel) => {
    const bounds = panel.getBoundingClientRect();
    // The photographic pouches intentionally tilt into their surrounding gutter.
    // Check readable content and controls rather than decorative image transforms.
    return [...panel.querySelectorAll("h2,h3,p,button,select,output")]
      .filter(
        (node) => node.getClientRects().length && !node.closest("[hidden]"),
      )
      .filter((node) => {
        const r = node.getBoundingClientRect();
        return r.left < bounds.left - 1 || r.right > bounds.right + 1;
      })
      .map((node) => ({
        tag: node.tagName,
        text: node.textContent?.trim().slice(0, 80),
      }));
  });
  assert.deepEqual(
    overflow,
    [],
    "Readable sample content and controls fit the panel",
  );
  assert.equal(
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest("[hidden], [inert]")),
    ),
    false,
    "Focus never remains in hidden or inert content",
  );
  for (const control of await page
    .locator(
      "[data-sample-mobile-nav]:visible button, [data-sample-mobile-reveal]:visible",
    )
    .all()) {
    const box = await control.boundingBox();
    assert.ok(
      box.width >= 44 &&
        box.height >= 44 &&
        box.x >= -1 &&
        box.x + box.width <= width + 1,
      "Mobile exploration controls have usable targets within the viewport",
    );
  }
}

async function capture(fixture, name) {
  await checkFit(fixture);
  await panelFor(fixture.page).evaluate((node) =>
    node.scrollIntoView({ block: "start" }),
  );
  await fixture.page.screenshot({
    path: `${evidence}/${fixture.width}-${fixture.tone}-${fixture.locale}-${name}.png`,
  });
}

async function checkQuantity(fixture, quantity) {
  const { page, t, sample } = fixture;
  const purchase = purchaseFor(page);
  assert.equal(
    (
      await purchase
        .getByLabel(t("Set quantity"), { exact: true })
        .textContent()
    ).trim(),
    String(quantity),
  );
  assert.equal(
    (
      await purchase
        .getByLabel(t("Sample set total"), { exact: true })
        .textContent()
    ).trim(),
    money(
      sample.variants[0].priceMinor * quantity,
      sample.variants[0].currency,
    ),
  );
}

async function switchLayout(fixture, layout, label) {
  const { page } = fixture;
  const choice = page
    .getByRole("group", { name: "Mobile Sample Set layout", exact: true })
    .getByRole("button", { name: label, exact: true });
  await choice.focus();
  await choice.press("Enter");
  await eventually(
    async () =>
      (await page
        .locator("[data-samples-mobile-study]")
        .getAttribute("data-study-layout")) === layout,
    "The requested layout opens in place",
  );
  assert.equal(new URL(page.url()).searchParams.get("layout"), layout);
  assert.equal(await choice.getAttribute("aria-pressed"), "true");
  assert.equal(
    await choice.evaluate((node) => node === document.activeElement),
    true,
    "Changing layout retains keyboard focus on its study control",
  );
}

async function checkExploration(fixture, layout) {
  const { page, width } = fixture;
  const panel = panelFor(page);
  if (width > 760) {
    assert.equal(
      await panel.locator("[data-sample-mobile-nav]").isVisible(),
      false,
    );
    assert.equal(
      await panel.locator("[data-sample-mobile-reveal]").isVisible(),
      false,
    );
    assert.equal(await purchaseFor(page).isVisible(), true);
    return;
  }
  if (layout === "tabs") {
    const nav = panel.locator("[data-sample-mobile-nav]");
    assert.equal(await nav.isVisible(), true);
    for (const view of ["overview", "contents", "order"]) {
      const button = nav.locator(`[data-sample-mobile-view="${view}"]`);
      await button.focus();
      await button.press("Enter");
      assert.equal(await button.getAttribute("aria-pressed"), "true");
      assert.equal(await nav.locator('[aria-pressed="true"]').count(), 1);
      const targetId = await button.getAttribute("aria-controls");
      assert.ok(targetId, "Each view identifies its controlled content");
      assert.equal(await page.locator(`[id="${targetId}"]`).isVisible(), true);
      assert.equal(await purchaseFor(page).isVisible(), view === "order");
      if (view !== "order") {
        assert.equal(
          await panel
            .getByRole("button", {
              name: fixture.t("Add to cart"),
              exact: true,
            })
            .count(),
          0,
          "A hidden purchase action is absent from the accessible role tree",
        );
        assert.equal(
          await panel
            .locator("[data-sample-mobile-purchase]")
            .evaluate((node) => node.hidden && node.inert),
          true,
        );
      }
      await checkFit(fixture);
      await capture(fixture, `tabs-${view}`);
    }
    // Keyboard navigation must never reach the hidden order controls.
    await nav.locator('[data-sample-mobile-view="overview"]').click();
    for (let index = 0; index < 5; index++) {
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() =>
          Boolean(document.activeElement?.closest("[hidden], [inert]")),
        ),
        false,
      );
    }
  } else if (layout === "reveal") {
    const reveal = panel.locator("[data-sample-mobile-reveal]");
    assert.equal(await reveal.isVisible(), true);
    if ((await reveal.getAttribute("aria-expanded")) === "true")
      await reveal.click();
    assert.equal(await purchaseFor(page).isVisible(), false);
    assert.equal(
      await panel
        .getByRole("button", { name: fixture.t("Add to cart"), exact: true })
        .count(),
      0,
    );
    await reveal.focus();
    await reveal.press("Enter");
    assert.equal(await reveal.getAttribute("aria-expanded"), "true");
    assert.equal(await purchaseFor(page).isVisible(), true);
    await reveal.click();
    assert.equal(await purchaseFor(page).isVisible(), false);
    assert.equal(
      await reveal.evaluate((node) => node === document.activeElement),
      true,
    );
  } else assert.equal(await purchaseFor(page).isVisible(), true);
}

async function modalChecks(fixture) {
  const { page, width } = fixture;
  const panel = panelFor(page);
  const trigger = panel.locator("[data-sample-details-trigger]");
  // Details remain available in every design without duplicating commerce.
  await trigger.scrollIntoViewIfNeeded();
  const beforeURL = page.url();
  await trigger.focus();
  await trigger.press("Enter");
  const details = page.locator("[data-sample-set-details][open]");
  await details.waitFor();
  assert.equal(
    await details.evaluate((node) => node.contains(document.activeElement)),
    true,
  );
  assert.equal(
    await details.locator("[data-sample-purchase], [data-foil-trio]").count(),
    0,
  );
  assert.equal(page.url(), beforeURL);
  await page.screenshot({
    path: `${evidence}/${width}-${fixture.tone}-${fixture.locale}-details.png`,
  });
  await page.keyboard.press("Escape");
  await details.waitFor({ state: "hidden" });
  await eventually(
    async () => (await trigger.getAttribute("aria-expanded")) === "false",
    "The details close handler finishes before another modal opens",
  );
  assert.equal(
    await trigger.evaluate((node) => node === document.activeElement),
    true,
  );
  const pouch = page
    .locator("[data-foil-trio]:visible button[data-pouch]")
    .first();
  await pouch.focus();
  await pouch.press("Enter");
  const label = page.locator("[data-sample-label-dialog][open]");
  await label.waitFor();
  assert.equal(
    await label.evaluate((node) => node.contains(document.activeElement)),
    true,
  );
  await page.screenshot({
    path: `${evidence}/${width}-${fixture.tone}-${fixture.locale}-label.png`,
  });
  if (width <= 760) await page.touchscreen.tap(8, 8);
  else await page.mouse.click(8, 8);
  await label.waitFor({ state: "hidden" });
  await eventually(
    async () =>
      (await page.locator("[data-sample-label-dialog] > *").count()) === 0,
    "The label close handler releases its inspected state",
  );
  assert.equal(
    await pouch.evaluate((node) => node === document.activeElement),
    true,
  );
  assert.deepEqual(
    fixture.actions,
    [],
    "Reading details and labels never writes to the cart",
  );
}

async function identity(fixture, original) {
  const { page } = fixture;
  assert.equal(
    await purchaseFor(page).count(),
    1,
    "The study mounts only one purchase surface",
  );
  assert.equal(
    await purchaseFor(page).evaluate(
      (node, old) => node === old,
      original.purchase,
    ),
    true,
    "The original purchase surface survives navigation",
  );
  assert.equal(
    await page.locator("[data-foil-trio]:visible").count(),
    1,
    "The viewport shows one foil trio",
  );
  assert.equal(
    await page
      .locator("[data-foil-trio]:visible")
      .evaluate((node, old) => node === old, original.foil),
    true,
    "The same foil trio remains mounted",
  );
  assert.equal(
    await page
      .locator("[data-tea-material]")
      .evaluate((node, old) => node === old, original.material),
    true,
    "The tea renderer is not reset by the study",
  );
}

async function desktopGeometry(page) {
  return panelFor(page).evaluate((panel) => {
    const parent = panel.getBoundingClientRect();
    return [...panel.querySelectorAll("h2,h3,p,button,output")]
      .filter(
        (node) => node.getClientRects().length && !node.closest("[hidden]"),
      )
      .map((node) => {
        const r = node.getBoundingClientRect(),
          s = getComputedStyle(node),
          round = (v) => Math.round(v * 100) / 100;
        return {
          tag: node.tagName,
          width: round(r.width),
          height: round(r.height),
          left: round(r.left - parent.left),
          top: round(r.top - parent.top),
          size: s.fontSize,
          line: s.lineHeight,
        };
      });
  });
}

async function browseScenario(fixture) {
  const { page, width, t } = fixture;
  await enter(fixture);
  const add = purchaseFor(page).locator("button[data-available]");
  await eventually(
    async () => (await add.count()) === 1 && (await add.isEnabled()),
    "The reviewed sample offer becomes purchasable",
  );
  await page.screenshot({
    path: `${evidence}/${width}-${fixture.tone}-${fixture.locale}-toolbar-full.png`,
    fullPage: true,
  });
  await openOrder(fixture);
  await purchaseFor(page)
    .getByRole("button", { name: t("Increase quantity"), exact: true })
    .click();
  const original = {
    purchase: await purchaseFor(page).elementHandle(),
    foil: await page.locator("[data-foil-trio]:visible").elementHandle(),
    material: await page.locator("[data-tea-material]").elementHandle(),
  };
  let baseline;
  for (const [layout, label] of layouts) {
    await switchLayout(fixture, layout, label);
    await identity(fixture, original);
    await checkExploration(fixture, layout);
    await capture(fixture, layout);
    await openOrder(fixture);
    await checkQuantity(fixture, 2);
    if (width > 760) {
      const current = await desktopGeometry(page);
      if (baseline)
        assert.deepEqual(
          current,
          baseline,
          "Mobile study choices do not alter the desktop order layout",
        );
      else baseline = current;
    }
  }
  await modalChecks(fixture);
  const otherTone = fixture.tone === "light" ? "dark" : "light";
  await page
    .getByRole("combobox", { name: /^Study appearance/ })
    .selectOption(otherTone);
  assert.equal(new URL(page.url()).searchParams.get("tone"), otherTone);
  assert.equal(
    await page.locator('main[data-concept="01"]').getAttribute("data-tone"),
    otherTone,
  );
  await identity(fixture, original);
  await checkQuantity(fixture, 2);
  assert.equal(
    (await fixture.context.cookies()).find(
      (cookie) => cookie.name === "atoma-theme",
    )?.value,
    fixture.tone,
    "Study appearance does not overwrite the saved storefront theme",
  );
  await page
    .getByRole("combobox", { name: /^Study appearance/ })
    .selectOption(fixture.tone);

  const barista = page.locator('[data-homepage-product-choice="barista"]');
  await barista.click();
  const shop = page
    .getByRole("group", { name: t("Shopping mode"), exact: true })
    .getByRole("button", { name: t("Shop"), exact: true });
  await shop.click();
  const tea = page.locator("[data-shop-exploration]");
  const format = tea.getByRole("combobox", { name: t("Format"), exact: true });
  const variant = fixture.teas.find((item) => item.id === "barista")
    .variants[1];
  await format.selectOption(variant.id);
  await tea
    .getByRole("button", { name: t("Increase quantity"), exact: true })
    .click();
  await page.locator('button[data-sample-entry-point="selection"]').click();
  await panelFor(page).waitFor();
  await openOrder(fixture);
  await identity(fixture, original);
  await checkQuantity(fixture, 2);
  await page
    .locator("[data-sample-start-navigation]")
    .getByRole("button", { name: t("Explore individual matcha"), exact: true })
    .click();
  assert.equal(await barista.getAttribute("aria-pressed"), "true");
  assert.equal(await shop.getAttribute("aria-pressed"), "true");
  assert.equal(await format.inputValue(), variant.id);
  assert.equal(
    (await tea.getByLabel(t("Quantity"), { exact: true }).textContent()).trim(),
    "2",
  );
  await page.locator('button[data-sample-entry-point="selection"]').click();
  await openOrder(fixture);
  await checkQuantity(fixture, 2);
  await checkFit(fixture);
  assert.deepEqual(fixture.actions, []);
}

async function recoveryScenario(fixture) {
  const { page, t } = fixture;
  await enter(fixture, "reveal");
  await openOrder(fixture);
  const purchase = purchaseFor(page);
  const retry = purchase.getByRole("button", {
    name: new RegExp(`^${t("Try again")}`),
  });
  await eventually(
    async () => (await retry.count()) === 1 && (await retry.isEnabled()),
    "A failed catalog exposes a read-only retry",
  );
  assert.equal(
    await purchase.locator('button[data-available="true"]').count(),
    0,
  );
  fixture.failCatalog(false);
  fixture.holdCatalog();
  const reads = fixture.catalogReads();
  await retry.click();
  await eventually(
    () => fixture.catalogReads() > reads,
    "Retry starts a fresh catalog read",
  );
  const retryHeading = purchase.getByRole("heading", {
    name: t("Order the set"),
    exact: true,
  });
  assert.equal(
    await retryHeading.evaluate((node) => node === document.activeElement),
    true,
    "Retry directs focus into the persistent order surface",
  );
  const retryHeadingStyle = await retryHeading.evaluate((node) => ({
    clipPath: getComputedStyle(node).clipPath,
    width: node.getBoundingClientRect().width,
    height: node.getBoundingClientRect().height,
  }));
  assert.ok(
    retryHeadingStyle.width > 1 && retryHeadingStyle.height > 1,
    "Retry focus has a visible heading target while loading",
  );
  assert.equal(
    await purchase
      .getByRole("button", { name: t("Add to cart"), exact: true })
      .count(),
    0,
    "Pending reads withhold purchase actions",
  );
  assert.deepEqual(fixture.actions, []);
  fixture.completeCatalog();
  const add = purchase.locator('button[data-available="true"]');
  await eventually(
    () => add.isEnabled(),
    "Successful retry restores purchasing",
  );
  await purchase
    .getByRole("button", { name: t("Increase quantity"), exact: true })
    .click();
  await eventually(
    async () =>
      (
        await purchase
          .getByLabel(t("Set quantity"), { exact: true })
          .textContent()
      ).trim() === "2",
    "The first quantity click after retry increments without a focus-induced layout shift",
  );
  await add.evaluate((button) => {
    button.click();
    button.click();
  });
  await eventually(
    fixture.pending,
    "The single intentional add awaits confirmation",
  );
  assert.deepEqual(
    fixture.actions,
    [
      {
        action: "add",
        productHandle: fixture.sample.handle,
        variantKey: fixture.sample.variants[0].id,
        quantity: 2,
      },
    ],
    "Double activation sends exactly one real-shaped mutation",
  );
  assert.equal(
    await purchase.locator('button[data-pending="true"]').isDisabled(),
    true,
  );
  assert.equal(
    await purchase
      .getByRole("button", { name: t("Increase quantity"), exact: true })
      .isDisabled(),
    true,
  );
  assert.equal(
    await panelFor(page).locator("[data-sample-details-trigger]").isDisabled(),
    true,
  );
  assert.equal(
    await page.locator("[data-homepage-product-choice]:not(:disabled)").count(),
    0,
    "No tea selection is actionable during the pending sample add",
  );
  const pendingURL = page.url();
  const pendingLayout = await page
    .locator("[data-samples-mobile-study]")
    .getAttribute("data-study-layout");
  for (const choice of await page
    .getByRole("group", { name: "Mobile Sample Set layout", exact: true })
    .getByRole("button")
    .all()) {
    assert.equal(
      await choice.isDisabled(),
      true,
      "A pending write locks layout changes",
    );
    await choice.evaluate((button) => button.click());
  }
  assert.equal(
    await page
      .getByRole("combobox", { name: /^Study appearance/ })
      .isDisabled(),
    true,
  );
  assert.equal(
    page.url(),
    pendingURL,
    "Disabled layout controls cannot change the share URL during an add",
  );
  assert.equal(
    await page
      .locator("[data-samples-mobile-study]")
      .getAttribute("data-study-layout"),
    pendingLayout,
  );
  fixture.completeAdd();
  const cart = page.locator("dialog[open]");
  await cart
    .getByRole("button", { name: t("Close cart"), exact: true })
    .waitFor();
  await cart
    .getByRole("button", { name: t("Close cart"), exact: true })
    .click();
  await cart.waitFor({ state: "hidden" });
  await checkQuantity(fixture, 2);
  assert.equal(fixture.actions.length, 1);
}

async function unavailableScenario(fixture) {
  await enter(fixture, "current");
  const add = purchaseFor(fixture.page).locator(
    'button[data-available="false"]',
  );
  await add.waitFor();
  assert.equal(await add.isDisabled(), true);
  for (const [layout, label] of layouts) {
    await switchLayout(fixture, layout, label);
    await openOrder(fixture);
    assert.equal(
      await add.isDisabled(),
      true,
      "Exploration does not override real availability",
    );
    await checkFit(fixture);
  }
  assert.deepEqual(fixture.actions, []);
}

async function canonicalScenario(fixture) {
  const { page, width, t } = fixture;
  await page.goto(`${baseURL}/`);
  await page.locator("[data-hero-loader]").waitFor({ state: "detached" });
  await page
    .getByRole("button", {
      name: t("Explore matcha from the silver bag"),
      exact: true,
    })
    .click();
  const panel = panelFor(page);
  await panel.waitFor();
  const add = purchaseFor(page).locator('button[data-available="true"]');
  await eventually(
    async () => (await add.count()) === 1 && (await add.isEnabled()),
    "The canonical Sample Set is ready",
  );
  assert.equal(
    await page.locator("[data-samples-mobile-study]").count(),
    0,
    "The canonical homepage has no study controls",
  );
  assert.equal(
    await panel.getAttribute("data-sample-mobile-layout"),
    width <= 760 ? "compact" : null,
  );
  assert.equal(
    await purchaseFor(page).isVisible(),
    true,
    "Compact ordering is immediately available without a disclosure",
  );
  assert.equal(
    await panel.locator("[data-sample-mobile-nav]").isVisible(),
    false,
  );
  assert.equal(
    await panel.locator("[data-sample-mobile-reveal]").isVisible(),
    false,
  );
  const originalIntroduction = panel.getByText(
    t(
      "Compare flavour and texture in your own drinks and recipes. Your set includes ¥4,500 credit toward your first eligible wholesale order of 1 kg or more.",
    ),
    { exact: true },
  );
  assert.equal(
    await originalIntroduction.isVisible(),
    width > 760,
    "Only mobile uses the shorter introduction",
  );
  assert.equal(
    await panel.locator("[data-sample-mobile-contents]").isVisible(),
    width > 760,
  );
  assert.equal(await page.locator("[data-foil-trio]:visible").count(), 1);
  if (width > 760) {
    const title = panel.getByRole("heading", {
      name: t("Sample Set"),
      exact: true,
    });
    const orderTitle = purchaseFor(page).getByRole("heading", {
      name: t("Order the set"),
      exact: true,
    });
    const sizes = await Promise.all(
      [title, originalIntroduction, orderTitle].map((node) =>
        node.evaluate((element) => getComputedStyle(element).fontSize),
      ),
    );
    assert.deepEqual(
      sizes,
      ["14px", "11px", "10px"],
      "Desktop retains its recorded title/body/order type scale",
    );
    assert.equal(
      await panel.locator("[data-foil-trio]").isVisible(),
      false,
      "Desktop retains the original separate material stage",
    );
  }
  await checkFit(fixture);
  await page.screenshot({
    path: `${evidence}/canonical-${width}-${fixture.tone}.png`,
    fullPage: true,
  });
  await purchaseFor(page)
    .getByRole("button", { name: t("Increase quantity"), exact: true })
    .click();
  await checkQuantity(fixture, 2);
  await modalChecks(fixture);
  await checkQuantity(fixture, 2);
  assert.deepEqual(fixture.actions, []);
}

const scenarios = [
  {
    name: "canonical-320-light",
    width: 320,
    tone: "light",
    run: canonicalScenario,
  },
  {
    name: "canonical-320-dark",
    width: 320,
    tone: "dark",
    run: canonicalScenario,
  },
  {
    name: "canonical-1440",
    width: 1440,
    tone: "light",
    run: canonicalScenario,
  },
  ...[320, 390].flatMap((width) =>
    ["light", "dark"].map((tone) => ({
      name: `${width}-${tone}`,
      width,
      tone,
      reducedMotion:
        width === 390 && tone === "dark" ? "no-preference" : "reduce",
    })),
  ),
  { name: "440-ja", width: 440, tone: "light", locale: "ja" },
  { name: "1440-desktop", width: 1440, tone: "light" },
  {
    name: "recovery-pending",
    width: 390,
    tone: "light",
    failed: true,
    run: recoveryScenario,
  },
  {
    name: "unavailable",
    width: 320,
    tone: "dark",
    available: false,
    run: unavailableScenario,
  },
];
try {
  for (const spec of scenarios) {
    if (filter && !new RegExp(filter).test(spec.name)) continue;
    const fixture = await setup(spec);
    try {
      await (spec.run ?? browseScenario)(fixture);
      assert.deepEqual(fixture.errors, []);
      console.log(`PASS ${spec.name}`);
    } catch (error) {
      await fixture.page
        .screenshot({ path: `${evidence}/failure-${spec.name}.png` })
        .catch(() => {});
      throw error;
    } finally {
      await fixture.cleanup();
    }
  }
} finally {
  await browser.close();
}
