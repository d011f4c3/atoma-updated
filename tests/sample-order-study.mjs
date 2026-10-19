/* Sample ordering study regression. Catalog, destination and cart requests are
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

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.SAMPLE_ORDER_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.SAMPLE_ORDER_EVIDENCE ?? ".local/sample-order-study/browser";
const filter = process.env.SAMPLE_ORDER_FILTER;
const layouts = [
  ["essentials", "01 Essentials"],
  ["index", "02 Set index"],
  ["purchase", "03 Purchase first"],
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

async function setup({ width, tone, countryCode, available = true }) {
  const destination = {
    countryCode,
    currency: countryCode === "SG" ? "SGD" : "USD",
  };
  const catalog = catalogFor(destination, available);
  const context = await browser.newContext({
    viewport: { width, height: width <= 760 ? 844 : 900 },
    reducedMotion: "reduce",
    hasTouch: width <= 760,
    isMobile: width <= 760,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: "en", url: baseURL },
  ]);
  const errors = [],
    actions = [];
  let currentCart = null;
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
    if (url.pathname === "/api/catalog" && method === "GET")
      return route.fulfill({
        json: {
          status: "ready",
          destination,
          products: catalog.products,
          shopUrl: "https://example.invalid",
        },
      });
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
    pending: () => releaseAdd !== null,
    completeAdd: () => {
      assert.ok(releaseAdd, "An isolated add request is awaiting its response");
      releaseAdd();
    },
    cleanup: async () => {
      releaseAdd?.();
      await context.close();
    },
  };
}

async function ready(page, layout) {
  await page.goto(`${baseURL}/samples-order-study?layout=${layout}`);
  const root = page.locator("[data-samples-order-study]");
  await root.waitFor();
  assert.equal(await root.getAttribute("data-study-layout"), layout);
  await eventually(
    async () =>
      (await page
        .locator("[data-embedded]")
        .getAttribute("data-entry-settled")) === "true",
    "The material handoff finishes",
  );
  await page
    .locator('[data-homepage-product-choice="barista"]:not(:disabled)')
    .waitFor();
  await page.locator("[data-sample-order]").waitFor();
  await page
    .locator('[data-sample-purchase] button[aria-busy="false"]')
    .waitFor();
  await page.evaluate(() => document.fonts.ready);
}

async function inspectPanel(page, width, sample, quantity, available) {
  const entry = page.locator("[data-sample-start-entry]");
  const panel = page.locator("[data-sample-order-panel]");
  assert.equal(await entry.isVisible(), true);
  assert.equal(await panel.count(), 1);
  assert.equal(
    await page.locator("[data-sample-purchase]").count(),
    1,
    "All study layouts share one purchase surface",
  );
  const variant = sample.variants[0];
  assert.ok(
    (await panel.innerText()).includes(
      money(variant.priceMinor, variant.currency),
    ),
  );
  assert.equal(
    await panel.getByLabel("Set quantity", { exact: true }).innerText(),
    String(quantity),
  );
  assert.equal(
    await panel.getByLabel("Sample set total", { exact: true }).innerText(),
    money(variant.priceMinor * quantity, variant.currency),
  );
  assert.equal(
    await page.locator("[data-foil-trio]:visible").count(),
    1,
    "Exactly one foil trio is shown at this viewport",
  );
  assert.equal(
    await page.locator("[data-foil-trio]:visible button[data-pouch]").count(),
    3,
  );
  if (width > 760) {
    assert.equal(
      await page
        .locator("[data-sample-imagery-stage] [data-foil-trio]")
        .isVisible(),
      true,
      "The original left foil trio remains visible on desktop",
    );
    assert.equal(
      await panel.locator("img:visible").count(),
      0,
      "The desktop order panel does not repeat product imagery",
    );
    const action = panel.getByRole("button", {
      name: available ? "Add to cart" : "Currently unavailable",
      exact: true,
    });
    assert.equal(
      await action.evaluate((node) => {
        const box = node.getBoundingClientRect();
        if (
          box.top < 0 ||
          box.bottom > innerHeight ||
          box.left < 0 ||
          box.right > innerWidth
        )
          return false;
        for (
          let parent = node.parentElement;
          parent;
          parent = parent.parentElement
        ) {
          if (
            ["auto", "scroll", "hidden", "clip"].includes(
              getComputedStyle(parent).overflowY,
            )
          ) {
            const bounds = parent.getBoundingClientRect();
            if (box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1)
              return false;
          }
        }
        return box.width > 0 && box.height > 0;
      }),
      true,
      "Desktop ordering is visible without scrolling the panel",
    );
  }
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "The study fits without horizontal page scrolling",
  );
  assert.equal(
    await panel.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    true,
    "The sample controls fit their panel",
  );
  assert.equal(
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest("[inert], [hidden]")),
    ),
    false,
    "Focus stays in the active context",
  );
}

async function switchLayouts(fixture, width, quantity, available) {
  const { page, sample } = fixture;
  const root = page.locator("[data-samples-order-study]");
  const purchase = await page.locator("[data-sample-purchase]").elementHandle();
  const foil = await page
    .locator("[data-sample-imagery-stage] [data-foil-trio]")
    .elementHandle();
  const controls = root.getByRole("group", {
    name: "Sample ordering layout",
    exact: true,
  });
  for (const [layout, label] of layouts) {
    const choice = controls.getByRole("button", { name: label, exact: true });
    await choice.focus();
    await choice.press("Enter");
    await eventually(
      async () => (await root.getAttribute("data-study-layout")) === layout,
      "The requested study layout is shown",
    );
    assert.equal(new URL(page.url()).searchParams.get("layout"), layout);
    assert.equal(await choice.getAttribute("aria-pressed"), "true");
    assert.equal(await controls.locator('[aria-pressed="true"]').count(), 1);
    assert.equal(
      await choice.evaluate((node) => node === document.activeElement),
      true,
      "Changing layout keeps keyboard focus on the study control",
    );
    assert.equal(
      await page
        .locator("[data-sample-purchase]")
        .evaluate((node, original) => node === original, purchase),
      true,
      "Changing layout retains the mounted purchase controls",
    );
    assert.equal(
      await page
        .locator("[data-sample-imagery-stage] [data-foil-trio]")
        .evaluate((node, original) => node === original, foil),
      true,
      "Changing layout retains the left foil trio",
    );
    await inspectPanel(page, width, sample, quantity, available);
  }
}

async function teaRoundTrip(fixture, width) {
  const { page, teas, sample } = fixture;
  const material = await page.locator("[data-tea-material]").elementHandle();
  const barista = page.locator('[data-homepage-product-choice="barista"]');
  await barista.click();
  const shop = page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name: "Shop", exact: true });
  await shop.click();
  const order = page.locator("[data-shop-exploration]");
  const format = order.getByRole("combobox", { name: "Format", exact: true });
  const teaVariant = teas.find((item) => item.id === "barista").variants[1];
  await format.selectOption(teaVariant.id);
  await order
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  await page.locator('button[data-sample-entry-point="selection"]').click();
  await eventually(
    async () => await page.locator("[data-sample-start-entry]").isVisible(),
    "The sample context opens in place",
  );
  await switchLayouts(fixture, width, 2, true);
  await sampleDetailsPopup(fixture, width);
  await page
    .locator("[data-sample-start-navigation]")
    .getByRole("button", { name: "Explore individual matcha", exact: true })
    .click();
  assert.equal(await barista.getAttribute("aria-pressed"), "true");
  assert.equal(await shop.getAttribute("aria-pressed"), "true");
  assert.equal(await format.inputValue(), teaVariant.id);
  assert.equal(
    (await order.getByLabel("Quantity", { exact: true }).textContent()).trim(),
    "2",
    "Tea quantity survives sample and layout changes",
  );
  assert.equal(
    await page
      .locator("[data-tea-material]")
      .evaluate((node, original) => node === original, material),
    true,
    "The tea renderer remains mounted",
  );
  await page.locator('button[data-sample-entry-point="selection"]').click();
  await inspectPanel(page, width, sample, 2, true);
}

async function sampleDetailsPopup(fixture, width) {
  const { page, actions } = fixture;
  const panel = page.locator("[data-sample-order-panel]");
  const trigger = panel.getByRole("button", {
    name: "Sample Set details",
    exact: true,
  });
  assert.equal(await trigger.getAttribute("href"), null);
  assert.equal(await trigger.getAttribute("aria-haspopup"), "dialog");
  assert.equal(
    await panel
      .getByRole("link", { name: "Sample Set details", exact: true })
      .count(),
    0,
    "Details are an in-place action, never a navigation link",
  );
  assert.equal(
    await page
      .locator('header a[data-nav-action="samples"]')
      .first()
      .getAttribute("href"),
    "/samples",
    "The separate Samples navigation link remains shareable",
  );

  const state = () =>
    page.evaluate(() => ({
      url: location.href,
      x: scrollX,
      y: scrollY,
      panelScroll: document.querySelector("#sample-set-information")?.scrollTop,
      quantity: document.querySelector(
        '[data-sample-order-panel] output[aria-label="Set quantity"]',
      )?.textContent,
      total: document.querySelector(
        '[data-sample-order-panel] output[aria-label="Sample set total"]',
      )?.textContent,
      mode: document
        .querySelector("[data-embedded]")
        ?.getAttribute("data-mode"),
      tea:
        document
          .querySelector('[data-homepage-product-choice][aria-pressed="true"]')
          ?.getAttribute("data-homepage-product-choice") ?? null,
      format: document.querySelector("[data-shop-exploration] select")?.value,
      teaQuantity: document.querySelector(
        '[data-shop-exploration] [aria-label="Quantity"]',
      )?.textContent,
    }));

  for (const via of ["escape", "close", "back", "backdrop"]) {
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    const before = await state();
    const beforeActions = actions.length;
    await trigger.press("Enter");
    const dialog = page.locator("[data-sample-set-details][open]");
    await dialog.waitFor();
    assert.equal(
      page.url(),
      before.url,
      "Opening details does not change the URL",
    );
    assert.equal(await trigger.getAttribute("aria-expanded"), "true");
    assert.equal(
      await dialog.evaluate((node) => node.contains(document.activeElement)),
      true,
      "Opening details places focus inside the native modal",
    );
    assert.equal(
      await dialog.locator("[data-sample-purchase], img").count(),
      0,
      "The reader has no duplicated order controls or imagery",
    );
    for (const item of SAMPLE_SET_CONTENTS) {
      assert.equal(
        await dialog.getByText(item.name, { exact: true }).count(),
        1,
      );
      assert.equal(
        await dialog.getByText(item.application, { exact: true }).count(),
        1,
      );
    }
    assert.ok((await dialog.innerText()).includes("60 g total"));
    assert.ok(
      (await dialog.innerText()).includes(
        "Keep the recipe consistent while comparing flavour and texture.",
      ),
    );
    assert.ok((await dialog.innerText()).includes("¥4,500"));
    assert.ok(
      (await dialog.innerText()).includes(
        "Use the same email as your Sample Set order.",
      ),
    );
    const close = dialog.getByRole("button", {
      name: "Close details",
      exact: true,
    });
    const back = dialog.getByRole("button", {
      name: "Back to order",
      exact: true,
    });
    assert.equal(
      await close.evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        return bounds.width >= 44 && bounds.height >= 44;
      }),
      true,
      "The persistent close control has a usable touch target",
    );
    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    assert.ok(
      box.x >= 15 && box.x + box.width <= viewport.width - 15,
      "Details retain at least 16px side gutters, allowing subpixel rounding",
    );
    if (width <= 760)
      assert.ok(
        box.height <= viewport.height * 0.82 + 1,
        "Mobile details remain an inset popup with a height limit",
      );
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).overflow,
      ),
      "hidden",
      "The underlying page cannot scroll during reading",
    );
    await close.focus();
    await close.press("Shift+Tab");
    assert.equal(
      await back.evaluate((node) => node === document.activeElement),
      true,
      "Native modal focus wraps to Back to order",
    );
    await back.press("Tab");
    assert.equal(
      await close.evaluate((node) => node === document.activeElement),
      true,
      "Native modal focus stays inside the popup",
    );
    await dialog
      .getByRole("heading", { name: "Sample Set details", exact: true })
      .click();
    assert.equal(
      await dialog.isVisible(),
      true,
      "Clicking inside does not dismiss details",
    );
    if (via === "escape") await page.keyboard.press("Escape");
    else if (via === "close") await close.click();
    else if (via === "back") await back.click();
    else if (width <= 760) await page.touchscreen.tap(8, 8);
    else await page.mouse.click(8, 8);
    await dialog.waitFor({ state: "hidden" });
    await eventually(
      () => trigger.evaluate((node) => node === document.activeElement),
      `${via} returns focus to the details trigger`,
    );
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    assert.deepEqual(
      await state(),
      before,
      `${via} preserves the URL, page and panel scroll, sample order and selected tea`,
    );
    assert.equal(
      actions.length,
      beforeActions,
      "Reading details never submits a cart action",
    );
  }
}

async function addOnce(fixture) {
  const { page, sample, actions } = fixture;
  const panel = page.locator("[data-sample-order-panel]");
  const add = panel.getByRole("button", { name: "Add to cart", exact: true });
  await add.focus();
  await add.evaluate((button) => {
    button.click();
    button.click();
  });
  await eventually(
    fixture.pending,
    "The local add request awaits confirmation",
  );
  assert.deepEqual(
    actions,
    [
      {
        action: "add",
        productHandle: sample.handle,
        variantKey: sample.variants[0].id,
        quantity: 2,
      },
    ],
    "A double activation submits exactly one reviewed sample order",
  );
  const pending = panel.locator('button[data-pending="true"]');
  assert.equal(await pending.isDisabled(), true);
  assert.equal(await pending.getAttribute("aria-busy"), "true");
  for (const label of ["Increase quantity", "Decrease quantity"])
    assert.equal(
      await panel
        .getByRole("button", { name: label, exact: true })
        .isDisabled(),
      true,
    );
  for (const choice of await page
    .getByRole("group", { name: "Sample ordering layout", exact: true })
    .getByRole("button")
    .all())
    assert.equal(
      await choice.isDisabled(),
      true,
      "Layout changes cannot interrupt an add",
    );
  assert.equal(
    await page.locator('[data-homepage-product-choice="barista"]').isDisabled(),
    true,
  );
  assert.equal(
    await panel
      .getByRole("button", { name: "Sample Set details", exact: true })
      .isDisabled(),
    true,
    "Details cannot interrupt an order submission",
  );
  fixture.completeAdd();
  const drawer = page.locator("dialog[open]");
  await drawer
    .getByRole("heading", { name: "Sample Set", exact: true })
    .waitFor();
  assert.equal(
    await drawer.getByLabel("Sample Set quantity", { exact: true }).innerText(),
    "2",
  );
  assert.ok(
    (await drawer.innerText()).includes(
      money(sample.variants[0].priceMinor * 2, sample.variants[0].currency),
    ),
  );
  await drawer.getByRole("button", { name: "Close cart", exact: true }).click();
  await drawer.waitFor({ state: "hidden" });
  assert.equal(actions.length, 1, "Cart confirmation does not replay the add");
  assert.equal(
    await panel.getByLabel("Set quantity", { exact: true }).innerText(),
    "2",
  );
}

try {
  for (const scenario of [
    {
      width: 1440,
      tone: "light",
      countryCode: "US",
      layout: "essentials",
      available: true,
    },
    {
      width: 390,
      tone: "dark",
      countryCode: "SG",
      layout: "purchase",
      available: true,
    },
    {
      width: 1440,
      tone: "dark",
      countryCode: "US",
      layout: "index",
      available: false,
    },
  ]) {
    const name = `${scenario.width}-${scenario.countryCode}-${scenario.layout}-${scenario.available ? "available" : "unavailable"}`;
    if (filter && !name.includes(filter)) continue;
    const fixture = await setup(scenario);
    try {
      await ready(fixture.page, scenario.layout);
      await inspectPanel(
        fixture.page,
        scenario.width,
        fixture.sample,
        1,
        scenario.available,
      );
      if (scenario.available) {
        await fixture.page
          .locator("[data-sample-order-panel]")
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        await teaRoundTrip(fixture, scenario.width);
        await addOnce(fixture);
      } else {
        await switchLayouts(fixture, scenario.width, 1, false);
        await sampleDetailsPopup(fixture, scenario.width);
        const panel = fixture.page.locator("[data-sample-order-panel]");
        const unavailable = panel.getByRole("button", {
          name: "Currently unavailable",
          exact: true,
        });
        assert.equal(await unavailable.isDisabled(), true);
        for (const label of ["Increase quantity", "Decrease quantity"])
          assert.equal(
            await panel
              .getByRole("button", { name: label, exact: true })
              .isDisabled(),
            true,
          );
        await unavailable.evaluate((button) => button.click());
        assert.deepEqual(
          fixture.actions,
          [],
          "Unavailable samples cannot submit a cart action",
        );
      }
      assert.deepEqual(fixture.errors, []);
      await fixture.page.screenshot({
        path: resolve(evidence, `${name}.png`),
        fullPage: true,
        animations: "disabled",
      });
      console.log(`${name}: passed`);
    } catch (error) {
      await fixture.page
        .screenshot({
          path: resolve(evidence, `${name}-failure.png`),
          fullPage: true,
        })
        .catch(() => {});
      throw error;
    } finally {
      await fixture.cleanup();
    }
  }
} finally {
  await browser.close();
}
