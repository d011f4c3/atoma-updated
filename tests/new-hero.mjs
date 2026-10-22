/* Standalone B2B page checks. Catalog/cart are isolated browser fixtures;
 * purchase mutations are validated and fulfilled in memory, never sent live. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";
import { translate } from "../src/lib/i18n/index.ts";
import { getProductApplicationImage } from "../src/lib/product-application-imagery.ts";
import { createHeroStudyFixture } from "./hero-cx-fixtures.mjs";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.NEW_HERO_BASE_URL ?? "http://127.0.0.1:3100";
const evidence = process.env.NEW_HERO_EVIDENCE ?? ".local/new-hero-0234/after";
const money = (value) => `¥${value.toLocaleString("en")}`;
const products = SAMPLE_SET_CONTENTS.map((item, index) => ({
  id: item.key,
  handle: item.productHandle,
  title: item.name,
  productCode: item.productCode,
  description: "Isolated new hero browser fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [100, 1000].map((grams, pack) => ({
    id: `v1_${String.fromCharCode(97 + index * 2 + pack).repeat(43)}`,
    title: grams === 100 ? "100 g" : "1 kg",
    available: !(item.key === "culinary" && pack === 0),
    priceMinor: pack ? 6000 + index * 1000 : 1000 + index * 100,
    currency: "JPY",
    options: [{ name: "Size", value: grams === 100 ? "100 g" : "1 kg" }],
    minimum: item.key === "barista" && pack === 1 ? 2 : 1,
    maximum: item.key === "barista" && pack === 1 ? 6 : 4,
    increment: item.key === "barista" && pack === 1 ? 2 : 1,
  })),
}));
const sampleProduct = {
  ...products[0],
  id: "sample-set",
  handle: SAMPLE_SET_OFFER.productHandle,
  title: "Sample Set",
  productCode: null,
  variants: [
    {
      ...products[0].variants[0],
      id: `v1_${"s".repeat(43)}`,
      title: "3 × 20 g",
      options: SAMPLE_SET_OFFER.variants[0].options,
    },
  ],
};
const fixtureProducts = [sampleProduct, ...products];
function cartFromLines(lines) {
  return {
    totalQuantity: lines.reduce((total, line) => total + line.quantity, 0),
    subtotalLabel: money(
      lines.reduce((total, line) => total + line.priceMinor * line.quantity, 0),
    ),
    totalLabel: money(
      lines.reduce((total, line) => total + line.priceMinor * line.quantity, 0),
    ),
    lines: lines.map(({ product, variant, quantity, priceMinor }) => ({
      lineKey: `local-${variant.id}`,
      productHandle: product.handle,
      productTitle: product.title,
      variantTitle: variant.title,
      options: variant.options,
      quantity,
      unitPriceLabel: money(priceMinor),
      lineTotalLabel: money(priceMinor * quantity),
      purchaseState: "purchasable",
      quantityRule: {
        minimum: variant.minimum,
        maximum: variant.maximum,
        increment: variant.increment,
      },
      canUpdateQuantity: true,
      canRemove: true,
      image: null,
    })),
  };
}
async function setup(browser, width, tone, locale, options = {}) {
  const fixture = await createHeroStudyFixture(
    browser,
    baseURL,
    width,
    tone,
    locale,
    options,
  );
  const state = {
    products: structuredClone(fixtureProducts),
    catalogMode: "ready",
    catalogReads: 0,
    actions: [],
    gate: null,
    reject: false,
    lines: options.emptyCart
      ? []
      : [
          {
            product: products[1],
            variant: products[1].variants[1],
            quantity: 2,
            priceMinor: products[1].variants[1].priceMinor,
          },
        ],
  };
  await fixture.context.route(`${baseURL}/api/catalog*`, async (route) => {
    assert.equal(route.request().method(), "GET");
    state.catalogReads++;
    await route.fulfill({
      status: state.catalogMode === "unavailable" ? 503 : 200,
      json: {
        status: state.catalogMode,
        products: state.catalogMode === "ready" ? state.products : [],
        shopUrl: "https://example.invalid",
      },
    });
  });
  await fixture.context.route(`${baseURL}/api/cart`, async (route) => {
    const request = route.request();
    const cart = () => (state.lines.length ? cartFromLines(state.lines) : null);
    if (request.method() === "GET")
      return route.fulfill({
        json: {
          kind: state.lines.length ? "ready" : "empty",
          cart: cart(),
          checkoutEnabled: false,
        },
      });
    try {
      assert.equal(request.method(), "POST");
      const action = request.postDataJSON();
      state.actions.push(action);
      assert.equal(
        action.action,
        "add",
        "Only an explicit Add to cart is allowed in this fixture",
      );
      const product = state.products.find(
        (item) => item.handle === action.productHandle,
      );
      const variant = product?.variants.find(
        (item) => item.id === action.variantKey,
      );
      assert.ok(
        variant?.available,
        "The add action has an available exact catalog variant",
      );
      assert.ok(Number.isSafeInteger(action.quantity));
      assert.ok(
        action.quantity >= variant.minimum &&
          action.quantity <= variant.maximum,
      );
      assert.equal((action.quantity - variant.minimum) % variant.increment, 0);
      if (state.gate) await state.gate;
      if (state.reject)
        return route.fulfill({
          status: 409,
          json: { kind: "rejected", cart: cart(), checkoutEnabled: false },
        });
      const existing = state.lines.find(
        (line) => line.variant.id === variant.id,
      );
      if (existing) existing.quantity += action.quantity;
      else
        state.lines.push({
          product,
          variant,
          quantity: action.quantity,
          priceMinor: variant.priceMinor,
        });
      return route.fulfill({
        json: { kind: "success", cart: cart(), checkoutEnabled: false },
      });
    } catch (error) {
      fixture.errors.push(error.message);
      return route.abort();
    }
  });
  return { ...fixture, state };
}
async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}
function clean(test) {
  assert.deepEqual(test.errors, []);
  assert.deepEqual(test.writes, []);
}

const url = `${baseURL}/new-hero`;
const pageRoot = (page) => page.locator("[data-new-hero]");
const card = (page, key) => page.locator(`[data-new-hero-product="${key}"]`);
const add = (page, key) =>
  card(page, key).locator("[data-new-hero-add] button");
const format = (page, key, pack) =>
  card(page, key).locator(
    `[data-new-hero-format="${products.find((item) => item.id === key).variants[pack].id}"]`,
  );
const quantity = (page, key) =>
  card(page, key).locator("[data-new-hero-quantity]");
const increase = (page, key, locale = "en") =>
  card(page, key).getByRole("button", {
    name: translate(locale, "Increase quantity"),
    exact: true,
  });
const decrease = (page, key, locale = "en") =>
  card(page, key).getByRole("button", {
    name: translate(locale, "Decrease quantity"),
    exact: true,
  });
const profiles = process.env.NEW_HERO_PROFILES?.split(",").filter(Boolean) ?? [
  "1440-light-en",
  "1440-dark-ja",
  "768-light-zh-Hans",
  "768-dark-zh-Hant",
  "390-light-ja",
  "390-dark-en",
  "360-light-zh-Hans",
  "320-dark-zh-Hant",
];
const measurements = [];
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

async function ready(page) {
  await pageRoot(page).waitFor();
  await eventually(
    async () =>
      (await page
        .locator('[data-new-hero-product][data-catalog-state="ready"]')
        .count()) === 3 && (await add(page, "ceremonial").isEnabled()),
    "All three application products have current catalog controls",
  );
}

async function capture(page, name) {
  for (const region of await pageRoot(page).locator("main > section").all()) {
    await region.scrollIntoViewIfNeeded();
    await eventually(
      () =>
        region
          .locator("img")
          .evaluateAll((nodes) => nodes.every((node) => node.complete)),
      "Visible imagery has loaded before capture",
    );
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(evidence, `${name}-viewport.png`) });
  await page.screenshot({
    path: resolve(evidence, `${name}-page.png`),
    fullPage: true,
  });
}

async function assertNativeEntries(page, locale) {
  assert.equal(
    await page.locator("[data-new-hero-samples]").getAttribute("href"),
    "/samples",
  );
  assert.equal(
    await page.locator("[data-new-hero-explore]").getAttribute("href"),
    "#applications",
  );
  assert.ok(
    (await page.locator("[data-new-hero-samples]").textContent()).includes(
      translate(locale, "Start with the Sample Set"),
    ),
  );
  for (const identity of SAMPLE_SET_CONTENTS) {
    const product = card(page, identity.key);
    const link = product.locator("[data-new-hero-product-link]");
    assert.equal(
      await link.getAttribute("href"),
      `/shop/${identity.productHandle}`,
    );
    assert.ok(
      (await link.textContent()).includes(translate(locale, identity.name)),
    );
    assert.ok(
      (
        await product.locator("[data-new-hero-product-code]").textContent()
      ).includes(identity.productCode),
    );
    const jump = page.locator(`[data-new-hero-jump="${identity.key}"]`);
    const href = await jump.getAttribute("href");
    assert.equal(href, `#new-hero-${identity.key}`);
    assert.equal(
      await page.locator(href).count(),
      1,
      "Every application entrance has a real, unique fragment target",
    );
    assert.equal(await product.getAttribute("id"), href.slice(1));
    const reorder = page.locator(`[data-new-hero-reorder="${identity.key}"]`);
    assert.equal(
      await reorder.getAttribute("href"),
      `/shop/${identity.productHandle}?format=1kg`,
    );
    assert.ok(
      (await reorder.textContent()).includes(translate(locale, identity.name)),
    );
    assert.ok((await reorder.textContent()).includes(identity.productCode));
  }
}

async function assertLayout(page, locale, width) {
  assert.equal(
    await pageRoot(page).locator("h1").textContent(),
    translate(locale, "Matcha for the way you make it."),
  );
  assert.deepEqual(
    await page
      .locator("[data-new-hero-section]")
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.newHeroSection)),
    ["applications", "samples", "origin", "supply"],
    "The business flow follows applications, Sample Set, origin, then supply",
  );
  assert.equal(
    await page
      .locator(
        '[data-hero-cx-study],[aria-label="Study controls"],[data-cx-tone],[data-cx-choice],canvas',
      )
      .count(),
    0,
  );
  assert.equal(
    await pageRoot(page)
      .locator(
        "main a [data-scramble-glyph],main button [data-scramble-glyph],main p [data-scramble-glyph]",
      )
      .count(),
    0,
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "No horizontal page overflow",
  );
  assert.deepEqual(
    await pageRoot(page)
      .locator(
        "h1,h2,h3,[data-new-hero-product-name],[data-new-hero-product-code],[data-new-hero-price],[data-new-hero-total]",
      )
      .evaluateAll((nodes) =>
        nodes
          .filter(
            (node) =>
              node.getClientRects().length &&
              node.scrollWidth > node.clientWidth + 1,
          )
          .map((node) => node.textContent),
      ),
    [],
    "Product labels, headings and monetary values do not clip",
  );
  await assertNativeEntries(page, locale);
  const geometry = await page.evaluate(() => {
    const rect = (selector) => {
      const box = document.querySelector(selector).getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, height: box.height };
    };
    return {
      viewportHeight: innerHeight,
      sample: rect("[data-new-hero-samples]"),
      explore: rect("[data-new-hero-explore]"),
      material: rect("main > section:first-child figure"),
    };
  });
  assert.ok(
    geometry.sample.bottom <= geometry.viewportHeight,
    "Primary Sample Set entry fits the first viewport",
  );
  assert.ok(
    geometry.explore.bottom <= geometry.viewportHeight,
    "Application entry fits the first viewport",
  );
  assert.ok(
    geometry.material.height <= geometry.viewportHeight / 2,
    "The material image remains subordinate to commerce",
  );
  for (const identity of SAMPLE_SET_CONTENTS) {
    const product = card(page, identity.key);
    const reference = getProductApplicationImage(identity.productHandle);
    await product.scrollIntoViewIfNeeded();
    assert.equal(
      await product.locator("[data-product-application-caption]").textContent(),
      translate(locale, reference.caption),
    );
    assert.ok(
      (await product.locator("[data-new-hero-price]").textContent()).includes(
        money(
          identity.key === "culinary"
            ? 8000
            : identity.key === "barista"
              ? 1100
              : 1000,
        ),
      ),
    );
    assert.equal(await product.locator("[data-new-hero-format]").count(), 2);
    assert.equal(await add(page, identity.key).isVisible(), true);
    assert.equal(await add(page, identity.key).isEnabled(), true);
    assert.equal(
      await product.locator("[data-new-hero-product-link]").isVisible(),
      true,
    );
    if (width <= 760) {
      for (const control of await product
        .locator("[data-new-hero-format],[data-new-hero-add] button")
        .all()) {
        assert.ok(
          (await control.boundingBox()).height >= 44,
          "Commerce touch targets are at least 44px high",
        );
        assert.equal(
          await control.evaluate((node) => {
            const style = getComputedStyle(node);
            return (
              style.visibility === "visible" && parseFloat(style.opacity) > 0
            );
          }),
          true,
          "Touch controls are visible without a hover",
        );
      }
      assert.ok(
        await product
          .locator("p")
          .filter({ hasText: translate(locale, reference.usage) })
          .evaluate(
            (node) => parseFloat(getComputedStyle(node).fontSize) >= 16,
          ),
        "Mobile application prose remains readable at 16px",
      );
    }
  }
  const sampleSection = page.locator('[data-new-hero-section="samples"]');
  for (const identity of SAMPLE_SET_CONTENTS) {
    const item = sampleSection
      .locator("li")
      .filter({ hasText: translate(locale, identity.name) });
    assert.ok((await item.textContent()).includes(`${identity.grams} g`));
  }
  assert.equal(await sampleSection.locator('a[href="/samples"]').count(), 1);
  return geometry;
}

async function assertFragmentNavigation(page) {
  await page.locator("[data-new-hero-explore]").click();
  assert.equal(new URL(page.url()).hash, "#applications");
  await eventually(async () => {
    const bounds = await page.locator("#applications").boundingBox();
    return bounds.y >= 0 && bounds.y < 160;
  }, "Explore by Application scrolls to the product section");
  for (const identity of SAMPLE_SET_CONTENTS) {
    await page.locator(`[data-new-hero-jump="${identity.key}"]`).click();
    assert.equal(new URL(page.url()).hash, `#new-hero-${identity.key}`);
    await eventually(async () => {
      const bounds = await card(page, identity.key).boundingBox();
      return bounds.y >= 0 && bounds.y < 160;
    }, `${identity.key} entry scrolls to its exact product`);
  }
}

try {
  for (const profile of profiles) {
    const [rawWidth, tone, ...localeParts] = profile.split("-");
    const width = Number(rawWidth);
    const locale = localeParts.join("-");
    const test = await setup(browser, width, tone, locale);
    try {
      await test.page.goto(url, { waitUntil: "networkidle" });
      await ready(test.page);
      assert.equal(await pageRoot(test.page).getAttribute("data-tone"), tone);
      const bounds = await assertLayout(test.page, locale, width);
      await capture(test.page, profile);
      await assertFragmentNavigation(test.page);
      measurements.push({ profile, ...bounds });
      clean(test);
      console.log(`New hero layout and application jumps: ${profile}`);
    } finally {
      test.release();
      await test.context.close();
    }
  }

  const native = await setup(browser, 390, "light", "en", {
    holdScripts: true,
  });
  try {
    await native.page.goto(url, { waitUntil: "commit" });
    await pageRoot(native.page).waitFor();
    await eventually(
      () => native.scriptRequests() > 0,
      "Hydration scripts are held",
    );
    await assertNativeEntries(native.page, "en");
    assert.equal(
      native.state.catalogReads,
      0,
      "Native entry links are present before client catalog loading",
    );
    assert.equal(
      await native.page.locator("header details[open]").count(),
      0,
      "The mobile menu starts closed before hydration so native CTAs are clear",
    );
    await native.page.locator("[data-new-hero-explore]").click();
    assert.equal(new URL(native.page.url()).hash, "#applications");
    await native.page.locator('[data-new-hero-jump="culinary"]').click();
    assert.equal(new URL(native.page.url()).hash, "#new-hero-culinary");
    assert.ok((await card(native.page, "culinary").boundingBox()).y < 160);
    native.releaseScripts();
    await ready(native.page);
    clean(native);
  } finally {
    native.release();
    await native.context.close();
  }
  console.log("Native sample, product and application entry before hydration");

  const order = await setup(browser, 390, "light", "en", { emptyCart: true });
  let releaseOrder;
  try {
    const { page, state } = order;
    await page.goto(url, { waitUntil: "networkidle" });
    await ready(page);
    await format(page, "barista", 1).click();
    assert.equal(await quantity(page, "barista").textContent(), "2");
    assert.equal(await decrease(page, "barista").isDisabled(), true);
    assert.ok(
      (await card(page, "barista").textContent()).includes(
        "Minimum 2 · Increments of 2",
      ),
    );
    await increase(page, "barista").click();
    assert.equal(await quantity(page, "barista").textContent(), "4");
    await increase(page, "barista").click();
    assert.equal(await quantity(page, "barista").textContent(), "6");
    assert.equal(await increase(page, "barista").isDisabled(), true);
    assert.equal(
      await card(page, "barista")
        .locator("[data-new-hero-total]")
        .textContent(),
      money(42000),
    );
    await decrease(page, "barista").click();
    assert.equal(await quantity(page, "barista").textContent(), "4");
    assert.equal(
      await quantity(page, "ceremonial").textContent(),
      "1",
      "Each product has its own quantity",
    );
    await format(page, "culinary", 0).click();
    assert.equal(await add(page, "culinary").isDisabled(), true);
    assert.equal(await increase(page, "culinary").isDisabled(), true);
    assert.equal(
      await card(page, "culinary")
        .locator("[data-new-hero-product-status]")
        .textContent(),
      "Currently unavailable",
    );
    await format(page, "culinary", 1).click();
    assert.equal(await add(page, "culinary").isEnabled(), true);

    const reads = state.catalogReads;
    await page.locator("footer [data-theme-switcher]").click();
    assert.equal(await pageRoot(page).getAttribute("data-tone"), "dark");
    await page.locator("footer [data-language-switcher]").selectOption("ja");
    assert.equal(await page.locator("html").getAttribute("lang"), "ja");
    assert.equal(await quantity(page, "barista").textContent(), "4");
    assert.equal(
      await format(page, "barista", 1).getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      state.catalogReads,
      reads,
      "Theme and locale changes preserve catalog and order choices",
    );
    await page.locator("footer [data-language-switcher]").selectOption("en");

    state.gate = new Promise((done) => {
      releaseOrder = done;
    });
    await add(page, "barista").click();
    await eventually(
      () => state.actions.length === 1,
      "The explicit add reaches the isolated fixture once",
    );
    for (const identity of SAMPLE_SET_CONTENTS) {
      assert.equal(await add(page, identity.key).isDisabled(), true);
      assert.equal(await format(page, identity.key, 0).isDisabled(), true);
      assert.equal(await increase(page, identity.key).isDisabled(), true);
      assert.equal(
        await page
          .locator(`[data-new-hero-product-link="${identity.key}"]`)
          .getAttribute("aria-disabled"),
        "true",
      );
    }
    const heldURL = page.url();
    await page
      .locator("[data-new-hero-samples]")
      .evaluate((node) => node.click());
    await page
      .locator('[data-new-hero-product-link="ceremonial"]')
      .evaluate((node) => node.click());
    await page
      .locator("[data-new-hero-explore]")
      .evaluate((node) => node.click());
    await page
      .locator('[data-new-hero-jump="culinary"]')
      .evaluate((node) => node.click());
    await add(page, "barista").evaluate((node) => {
      node.click();
      node.click();
    });
    assert.equal(
      page.url(),
      heldURL,
      "Navigation remains locked while the order is pending",
    );
    assert.equal(state.actions.length, 1, "A pending add cannot be replayed");
    assert.deepEqual(state.actions[0], {
      action: "add",
      productHandle: products[1].handle,
      variantKey: products[1].variants[1].id,
      quantity: 4,
    });
    releaseOrder();
    state.gate = null;
    await page.locator("dialog[open]").waitFor();
    assert.equal(state.lines.length, 1);
    assert.equal(state.lines[0].quantity, 4);
    assert.ok(
      (await page.locator("dialog[open]").textContent()).includes(
        products[1].title,
      ),
    );
    await page.getByRole("button", { name: "Close cart", exact: true }).click();
    assert.equal(await add(page, "barista").isEnabled(), true);
    assert.equal(await quantity(page, "barista").textContent(), "4");

    state.reject = true;
    await add(page, "culinary").click();
    await eventually(
      async () =>
        (await page
          .locator("[data-new-hero-products] [role=alert]")
          .count()) === 1,
      "A rejected add exposes the cart error",
    );
    const purchaseError = card(page, "culinary").locator(
      "[data-new-hero-purchase-error]",
    );
    assert.equal(await purchaseError.isVisible(), true);
    assert.equal(
      await card(page, "ceremonial").locator("[role=alert]").count(),
      0,
    );
    assert.ok(
      (await purchaseError.boundingBox()).y >=
        (await add(page, "culinary").boundingBox()).y,
      "The last mobile card displays its error beside the attempted action",
    );
    assert.equal(state.actions.length, 2);
    assert.equal(
      state.lines.length,
      1,
      "Rejected writes do not change the cart fixture",
    );
    assert.equal(
      await add(page, "culinary").isEnabled(),
      true,
      "A settled rejection releases the operation lock",
    );
    await increase(page, "culinary").click();
    assert.equal(
      await purchaseError.count(),
      0,
      "An explicit quantity change dismisses the prior error",
    );
    await add(page, "culinary").click();
    await purchaseError.waitFor();
    assert.equal(state.actions.length, 3);
    state.gate = new Promise((done) => {
      releaseOrder = done;
    });
    await add(page, "culinary").click();
    await eventually(
      () => state.actions.length === 4,
      "Only the explicit retry submits again",
    );
    assert.equal(
      await purchaseError.count(),
      0,
      "A pending retry hides the stale error",
    );
    releaseOrder();
    state.gate = null;
    await purchaseError.waitFor();
    await format(page, "culinary", 0).click();
    assert.equal(
      await purchaseError.count(),
      0,
      "An explicit format change dismisses the prior error",
    );
    clean(order);
  } finally {
    releaseOrder?.();
    order.release();
    await order.context.close();
  }
  console.log(
    "Exact variants, independent quantities, availability, limits, cart, rejection and operation locks",
  );

  const unavailable = await setup(browser, 390, "light", "en");
  try {
    unavailable.state.catalogMode = "unavailable";
    const { page, state } = unavailable;
    await page.goto(url, { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "Try again", exact: true })
      .waitFor();
    for (const identity of SAMPLE_SET_CONTENTS) {
      assert.equal(
        await card(page, identity.key).getAttribute("data-catalog-state"),
        "unavailable",
      );
      assert.equal(await add(page, identity.key).isDisabled(), true);
      assert.equal(
        (
          await card(page, identity.key)
            .locator("[data-new-hero-price]")
            .textContent()
        ).trim(),
        "—",
      );
    }
    await assertNativeEntries(page, "en");
    const reads = state.catalogReads;
    state.catalogMode = "ready";
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await ready(page);
    assert.ok(state.catalogReads > reads, "Retry performs a new catalog read");
    clean(unavailable);
  } finally {
    unavailable.release();
    await unavailable.context.close();
  }

  for (const mode of ["missing", "duplicate", "sold-out", "no-formats"]) {
    const test = await setup(browser, 390, "light", "en");
    try {
      const tea = test.state.products.find((item) => item.id === "ceremonial");
      if (mode === "missing")
        test.state.products = test.state.products.filter(
          (item) => item.id !== "ceremonial",
        );
      if (mode === "duplicate")
        test.state.products.push({ ...tea, id: "duplicate-identity" });
      if (mode === "sold-out")
        tea.variants.forEach((variant) => {
          variant.available = false;
        });
      if (mode === "no-formats") tea.variants = [];
      await test.page.goto(url, { waitUntil: "networkidle" });
      await eventually(
        async () =>
          !["loading", "refreshing"].includes(
            await card(test.page, "ceremonial").getAttribute(
              "data-catalog-state",
            ),
          ),
        `${mode} settles`,
      );
      assert.equal(await add(test.page, "ceremonial").isDisabled(), true);
      assert.equal(await increase(test.page, "ceremonial").isDisabled(), true);
      assert.equal(
        await add(test.page, "barista").isEnabled(),
        true,
        "Another published product remains available",
      );
      assert.equal(test.state.actions.length, 0);
      await assertNativeEntries(test.page, "en");
      clean(test);
    } finally {
      test.release();
      await test.context.close();
    }
  }
  console.log(
    "Catalog unavailable/retry, missing/duplicate products, sold-out and empty formats",
  );

  const handoff = await setup(browser, 390, "light", "en");
  try {
    const { page } = handoff;
    await page.goto(url, { waitUntil: "networkidle" });
    await ready(page);
    await format(page, "barista", 1).click();
    await increase(page, "barista").click();
    await page.locator('[data-new-hero-product-link="barista"]').click();
    const retail = page.locator(
      `[data-retail-product="${products[1].handle}"]`,
    );
    await retail.waitFor();
    await eventually(
      async () =>
        (await retail
          .getByRole("button", { name: "1 kg", exact: true })
          .getAttribute("aria-pressed")) === "true" &&
        (await retail
          .locator('output[aria-label="Quantity"]')
          .textContent()) === "4",
      "The selected product format and quantity continue into its dedicated page",
    );
    await page.goBack();
    await ready(page);
    assert.equal(
      await format(page, "barista", 1).getAttribute("aria-pressed"),
      "true",
      "Browser Back keeps the selected product format",
    );
    assert.equal(
      await quantity(page, "barista").textContent(),
      "4",
      "Browser Back keeps the selected product quantity",
    );
    assert.equal(
      await format(page, "ceremonial", 0).getAttribute("aria-pressed"),
      "true",
      "Restoring Barista does not change another product's format",
    );
    assert.equal(await quantity(page, "ceremonial").textContent(), "1");
    await page.goto(url, { waitUntil: "networkidle" });
    await ready(page);
    await page.locator('[data-new-hero-reorder="culinary"]').click();
    const reorder = page.locator(
      `[data-retail-product="${products[2].handle}"]`,
    );
    await reorder.waitFor();
    assert.equal(new URL(page.url()).searchParams.get("format"), "1kg");
    await eventually(
      async () =>
        (await reorder
          .getByRole("button", { name: "1 kg", exact: true })
          .getAttribute("aria-pressed")) === "true",
      "The named reorder entrance selects its exact one-kilogram format",
    );
    assert.equal(
      handoff.state.actions.length,
      0,
      "Product and reorder navigation never adds to cart",
    );
    clean(handoff);
  } finally {
    handoff.release();
    await handoff.context.close();
  }
  console.log(
    "Selected order handoff and exact named one-kilogram reorder entry",
  );

  const keyboard = await setup(browser, 1440, "dark", "en");
  try {
    const { page } = keyboard;
    await page.goto(url, { waitUntil: "networkidle" });
    await ready(page);
    assert.equal(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      true,
    );
    const firstLink = page.locator('[data-new-hero-product-link="ceremonial"]');
    await firstLink.focus();
    assert.equal(
      await firstLink.evaluate(
        (node) =>
          document.activeElement === node &&
          parseFloat(getComputedStyle(node).outlineWidth) >= 2,
      ),
      true,
      "Native keyboard entry has a visible focus outline",
    );
    await page.keyboard.press("Enter");
    await page
      .locator(`[data-retail-product="${products[0].handle}"]`)
      .waitFor();
    assert.equal(new URL(page.url()).pathname, `/shop/${products[0].handle}`);
    assert.equal(
      new URL(page.url()).search,
      "",
      "Ordinary product entry does not silently select a pack",
    );
    await page.goBack();
    await ready(page);
    await page.locator("[data-new-hero-samples]").focus();
    await page.keyboard.press("Enter");
    await eventually(
      () => new URL(page.url()).pathname === "/samples",
      "Keyboard sample entry opens the existing sample flow",
    );
    clean(keyboard);
  } finally {
    keyboard.release();
    await keyboard.context.close();
  }

  const failedImages = await setup(browser, 390, "dark", "en", {
    failImages: true,
    reducedMotion: "no-preference",
  });
  try {
    const { page } = failedImages;
    await page.goto(url, { waitUntil: "networkidle" });
    await ready(page);
    for (const identity of SAMPLE_SET_CONTENTS) {
      await card(page, identity.key).scrollIntoViewIfNeeded();
      await eventually(
        async () =>
          (await card(page, identity.key)
            .locator("[data-product-application-fallback]")
            .count()) === 1,
        `${identity.key} has an honest image fallback`,
      );
      assert.equal(
        await add(page, identity.key).isEnabled(),
        true,
        "Failed imagery does not block commerce",
      );
    }
    await page
      .locator('[data-new-hero-section="origin"]')
      .scrollIntoViewIfNeeded();
    await eventually(
      async () =>
        (await pageRoot(page)
          .getByText("Image unavailable.", { exact: true })
          .count()) === 2,
      "Material and origin images show their fallback",
    );
    await assertNativeEntries(page, "en");
    await capture(page, "390-dark-en-image-fallback");
    clean(failedImages);
  } finally {
    failedImages.release();
    await failedImages.context.close();
  }
  console.log(
    "Keyboard product/sample entry, reduced motion and failed-image commerce fallback",
  );
  await writeFile(
    resolve(evidence, "measurements.json"),
    `${JSON.stringify(measurements, null, 2)}\n`,
  );
} finally {
  await browser.close();
}
