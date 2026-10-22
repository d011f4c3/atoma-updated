/* Comparison and order continuity: public reads use isolated fixtures;
 * every external request and commerce mutation is blocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";
import { getProductContent } from "../src/lib/product-content.ts";
import { translate } from "../src/lib/i18n/index.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL =
  process.env.CLIENT_COMPARISON_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.CLIENT_COMPARISON_EVIDENCE ?? ".local/client-feedback-0225/after";
const profiles = process.env.CLIENT_COMPARISON_PROFILES?.split(",") ?? [
  "1440-light-en",
  "390-dark-en",
  "390-light-ja",
];
const products = SAMPLE_SET_CONTENTS.map((item, index) => ({
  id: item.key,
  handle: item.productHandle,
  title: item.name,
  productCode: item.productCode,
  description: "Isolated comparison fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [100, 1000].map((grams, pack) => ({
    id: `v1_${String.fromCharCode(97 + index * 2 + pack).repeat(43)}`,
    title: grams === 100 ? "100 g" : "1 kg",
    available: true,
    priceMinor: pack ? 6000 + index * 1000 : 1000 + index * 100,
    currency: "JPY",
    options: [{ name: "Size", value: grams === 100 ? "100 g" : "1 kg" }],
    minimum: 1,
    maximum: 5,
    increment: 1,
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
const barista = products.find((item) => item.id === "barista");
const cart = {
  totalQuantity: 2,
  subtotalLabel: "¥14,000",
  totalLabel: "¥14,000",
  lines: [
    {
      lineKey: "retained-barista",
      productHandle: barista.handle,
      productTitle: barista.title,
      variantTitle: "1 kg",
      options: barista.variants[1].options,
      quantity: 2,
      unitPriceLabel: "¥7,000",
      lineTotalLabel: "¥14,000",
      purchaseState: "purchasable",
      quantityRule: { minimum: 1, maximum: 5, increment: 1 },
      canUpdateQuantity: true,
      canRemove: true,
      image: null,
    },
  ],
};
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}
async function setup(width = 1440, tone = "light", locale = "en") {
  const context = await browser.newContext({
    viewport: { width, height: width < 500 ? 844 : 900 },
    reducedMotion: "reduce",
    isMobile: width < 500,
    hasTouch: width < 500,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: locale, url: baseURL },
  ]);
  const fixture = {
    products: structuredClone([sampleProduct, ...products]),
    country: "US",
    unavailable: false,
    hold: null,
    catalogReads: 0,
  };
  const errors = [],
    writes = [];
  await context.route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.origin !== origin) {
      errors.push(`External request: ${url.origin}`);
      return route.abort();
    }
    if (!["GET", "HEAD"].includes(request.method())) {
      writes.push(`${request.method()} ${url.pathname}`);
      return route.abort();
    }
    if (url.pathname === "/api/catalog") {
      fixture.catalogReads++;
      if (fixture.hold) await fixture.hold;
      return route.fulfill({
        json: fixture.unavailable
          ? {
              status: "unavailable",
              products: [],
              shopUrl: "https://example.invalid",
            }
          : {
              status: "ready",
              products: fixture.products,
              shopUrl: "https://example.invalid",
              destination: { countryCode: fixture.country, currency: "JPY" },
            },
      });
    }
    if (url.pathname === "/api/cart")
      return route.fulfill({
        json: { kind: "ready", cart, checkoutEnabled: false },
      });
    if (url.pathname === "/api/destination")
      return route.fulfill({
        json: {
          kind: "ready",
          preference: { countryCode: fixture.country, source: "default" },
          destination: { countryCode: fixture.country, currency: "JPY" },
          countries: ["US", "SG"],
          reviewRequired: false,
        },
      });
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Unexpected API read: ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page, fixture, errors, writes };
}
async function noOverflow(page, scope) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "No page overflow",
  );
  const clipped = await scope
    .locator("h1,h2,h3,p,dt,dd,a,button")
    .evaluateAll((nodes) =>
      nodes
        .filter(
          (node) =>
            node.getClientRects().length &&
            node.scrollWidth > node.clientWidth + 1,
        )
        .map((node) => node.textContent),
    );
  assert.deepEqual(clipped, [], "Visible content does not clip");
}
async function assertProfile(scope, product, locale) {
  const profile = scope.locator("[data-visible-product-profile]");
  await profile.waitFor();
  const content = getProductContent(product, locale);
  const interactive = profile.locator("[data-retail-profile-property]");
  if (await interactive.count()) {
    const values = await interactive.evaluateAll((nodes) =>
      nodes
        .map((node) => ({
          index: Number(node.dataset.retailProfileProperty),
          label: node.firstElementChild?.textContent?.trim(),
          value: node.lastElementChild?.textContent?.trim(),
        }))
        .sort((first, second) => first.index - second.index),
    );
    assert.equal(values.length, 7);
    assert.deepEqual(
      values.map((item) => item.label),
      content.materialProfile.map((item) => item.label),
    );
    assert.deepEqual(
      values.map((item) => item.value),
      content.materialProfile.map((item) => item.value),
    );
  } else {
    assert.equal(await profile.locator("dl > div").count(), 7);
    assert.deepEqual(
      (await profile.locator("dt").allTextContents()).map((value) =>
        value.trim(),
      ),
      content.materialProfile.map((property) => property.label),
    );
    assert.deepEqual(
      (await profile.locator("dd").allTextContents()).map((value) =>
        value.trim(),
      ),
      content.materialProfile.map((property) => property.value),
    );
  }
  assert.equal(
    await profile
      .getByText(
        translate(
          locale,
          "Illustrative profiles · Final specifications pending",
        ),
        { exact: true },
      )
      .count(),
    0,
    "Internal provenance captions do not return to customer-facing copy",
  );
  assert.equal(
    await profile.evaluate((node) => node.closest("details") === null),
    true,
    "Essential profile is not hidden in a disclosure",
  );
  return profile;
}
async function headerLink(page, action) {
  const link = page.locator(`[data-nav-action="${action}"]`).first();
  if (!(await link.isVisible()))
    await page.locator("[data-nav-summary]").click();
  await link.click();
}
async function chooseTab(page, label, locale) {
  await page
    .locator("[data-shopping-mode]")
    .getByRole("button", { name: translate(locale, label), exact: true })
    .click();
}
async function assertHomeOrder(page, locale) {
  const order = page.locator('[data-shop-product="barista"]');
  await order.waitFor();
  assert.equal(
    await order.locator("select[data-shop-format]").inputValue(),
    barista.variants[0].id,
  );
  assert.equal((await order.locator("output").textContent()).trim(), "3");
  assert.equal(
    await page
      .locator('[data-homepage-product-choice="barista"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page
      .locator("[data-shopping-mode]")
      .getByRole("button", { name: translate(locale, "Order"), exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
}
async function assertComparison(page, locale) {
  const comparison = page.locator("[data-product-comparison]");
  await comparison.waitFor();
  assert.equal(await comparison.getAttribute("id"), "product-comparison");
  assert.equal(
    await comparison.locator("[data-comparison-product]").count(),
    3,
  );
  for (const tea of products) {
    const entry = comparison.locator(`[data-comparison-product="${tea.id}"]`);
    assert.equal(await entry.isVisible(), true);
    assert.equal(await entry.getAttribute("data-comparison-offer"), "ready");
    const link = entry.locator("a[data-comparison-details]");
    assert.equal(await link.getAttribute("href"), `/shop/${tea.handle}`);
    assert.ok(
      (await link.textContent()).includes(translate(locale, tea.title)),
      "Details link names its tea",
    );
    const formats = await entry
      .locator("[data-comparison-formats]")
      .textContent();
    assert.ok(formats.includes("100 g") && formats.includes("1 kg"));
  }
  await noOverflow(page, comparison);
  return comparison;
}
try {
  for (const profile of profiles) {
    const [, rawWidth, tone, locale] =
      /^(\d+)-(light|dark)-(en|ja|zh-Hans|zh-Hant)$/.exec(profile) ?? [];
    assert.ok(rawWidth);
    const test = await setup(Number(rawWidth), tone, locale),
      { page } = test;
    try {
      await page.goto(baseURL, { waitUntil: "networkidle" });
      await page.locator("[data-homepage-application-explore]").click();
      const material = await page
        .locator("[data-embedded=true]")
        .elementHandle();
      for (const tea of products) {
        await page
          .locator(`[data-homepage-product-choice="${tea.id}"]`)
          .click();
        await chooseTab(page, "Overview", locale);
        const panel = page.locator("[data-application-overview]");
        await assertProfile(panel, tea, locale);
        const formats = await panel
          .locator("[data-visible-product-formats]")
          .textContent();
        assert.ok(formats.includes("100 g") && formats.includes("1 kg"));
        await noOverflow(page, panel);
        await panel.screenshot({
          path: resolve(evidence, `${profile}-${tea.id}-overview.png`),
        });
        assert.equal(await material.evaluate((node) => node.isConnected), true);
      }
      await page.locator('[data-homepage-product-choice="barista"]').click();
      await chooseTab(page, "Order", locale);
      assert.equal(
        await page
          .locator("[data-shopping-mode]")
          .getByRole("button", { name: translate(locale, "Shop"), exact: true })
          .count(),
        0,
        "Local Order is distinct from global Shop",
      );
      const homeOrder = page.locator('[data-shop-product="barista"]');
      await homeOrder
        .locator("select[data-shop-format]")
        .selectOption(barista.variants[0].id);
      await homeOrder
        .getByRole("button", {
          name: translate(locale, "Increase quantity"),
          exact: true,
        })
        .click({ clickCount: 2 });
      await assertHomeOrder(page, locale);
      await headerLink(page, "shop");
      const comparison = await assertComparison(page, locale);
      for (const tea of products) {
        const card = page.locator(`[data-shop-product="${tea.id}"]`);
        assert.ok(
          (await card.locator("[data-shop-description]").textContent()).trim(),
        );
        const formats = await card.locator("[data-shop-formats]").textContent();
        assert.ok(formats.includes("100 g") && formats.includes("1 kg"));
      }
      await comparison.screenshot({
        path: resolve(evidence, `${profile}-comparison.png`),
      });
      await page.locator("[data-shop-category-trigger]").click();
      await page.locator('[data-shop-category="barista"]').click();
      await eventually(
        async () =>
          new URL(page.url()).searchParams.get("category") === "barista",
        "Category URL updates",
      );
      await assertComparison(page, locale);
      assert.equal(
        await page.locator('[data-shop-product="ceremonial"]').isVisible(),
        false,
      );
      for (const tea of products) {
        const link = page.locator(
          `[data-comparison-product="${tea.id}"] a[data-comparison-details]`,
        );
        await link.focus();
        await page.keyboard.press("Enter");
        const retail = page.locator(`[data-retail-product="${tea.handle}"]`);
        await retail.locator("h1").waitFor();
        const profileSection = await assertProfile(retail, tea, locale);
        const formatFieldset = retail.getByRole("group", {
          name: translate(locale, "Format"),
          exact: true,
        });
        const addBounds = await retail
          .locator("button[data-pending]")
          .boundingBox();
        const viewport = page.viewportSize();
        assert.ok(
          addBounds &&
            viewport &&
            addBounds.y >= 0 &&
            addBounds.y + addBounds.height <= viewport.height + 1,
          "The complete purchase action is visible before scrolling into learning",
        );
        assert.equal(
          await formatFieldset
            .getByRole("button", { name: "100 g", exact: true })
            .getAttribute("aria-pressed"),
          "true",
        );
        assert.equal(
          (await retail.locator("output").textContent()).trim(),
          tea.id === "barista" ? "3" : "1",
        );
        await noOverflow(page, retail);
        await profileSection.screenshot({
          path: resolve(evidence, `${profile}-${tea.id}-retail-profile.png`),
        });
        if (tea.id === "barista")
          await retail
            .getByRole("button", {
              name: translate(locale, "Increase quantity"),
              exact: true,
            })
            .click();
        await page.goBack();
        await assertComparison(page, locale);
      }
      await headerLink(page, "samples");
      const next = page.locator("[data-sample-next-order]");
      await next.waitFor();
      await next.locator(`input[value="${barista.handle}"]`).check();
      const exactLink = next.locator("[data-sample-one-kilogram]");
      assert.equal(
        await exactLink.getAttribute("href"),
        `/shop/${barista.handle}?format=1kg`,
      );
      await exactLink.click();
      const exactRetail = page.locator(
        `[data-retail-product="${barista.handle}"]`,
      );
      await exactRetail.locator("h1").waitFor();
      assert.equal(
        await exactRetail
          .getByRole("button", { name: "1 kg", exact: true })
          .getAttribute("aria-pressed"),
        "true",
        "Explicit1kg overrides retained100g",
      );
      assert.equal(
        (await exactRetail.locator("output").textContent()).trim(),
        "1",
      );
      await page.goBack();
      await next.waitFor();
      await page.goBack();
      await assertComparison(page, locale);
      await page.goBack();
      await assertHomeOrder(page, locale);
      const cartButton = page.getByRole("button", {
        name: translate(locale, "Open cart, {count} items", { count: 2 }),
        exact: true,
      });
      await cartButton.click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      assert.ok(
        (await dialog.textContent()).includes(
          translate(locale, "Barista Matcha"),
        ),
      );
      assert.ok((await dialog.textContent()).includes("14,000"));
      await page
        .getByRole("button", {
          name: translate(locale, "Close cart"),
          exact: true,
        })
        .click();
      assert.deepEqual(test.errors, []);
      assert.deepEqual(test.writes, []);
      console.log(
        `${profile}: three visible profiles/comparison/cards, keyboard links, format precedence, Back and cart passed`,
      );
    } catch (error) {
      await page.screenshot({
        path: resolve(evidence, `${profile}-failure.png`),
        fullPage: true,
      });
      throw error;
    } finally {
      await test.context.close();
    }
  }
  const status = await setup(),
    { page, fixture } = status;
  try {
    fixture.products = fixture.products.filter(
      (item) => item.id !== "culinary",
    );
    fixture.products.push({
      ...structuredClone(barista),
      id: "duplicate-barista",
    });
    fixture.products.push({
      ...structuredClone(products[0]),
      id: "unknown",
      handle: "unmapped-fixture",
      title: "Culinary Matcha",
    });
    fixture.products
      .find((item) => item.id === "ceremonial")
      .variants.forEach((variant) => {
        variant.available = false;
      });
    await page.goto(`${baseURL}/shop`, { waitUntil: "networkidle" });
    const comparison = page.locator("[data-product-comparison]");
    await comparison.waitFor();
    for (const [key, offer] of [
      ["barista", "ambiguous"],
      ["culinary", "missing"],
    ]) {
      const entry = comparison.locator(`[data-comparison-product="${key}"]`);
      assert.equal(await entry.getAttribute("data-comparison-offer"), offer);
      assert.equal(
        await entry.locator("a[data-comparison-details]").count(),
        0,
      );
      assert.ok((await entry.textContent()).includes("Offer unavailable"));
    }
    assert.equal(
      await comparison.locator("[data-comparison-product]").count(),
      3,
    );
    const unavailable = comparison.locator(
      '[data-comparison-product="ceremonial"]',
    );
    assert.ok((await unavailable.textContent()).includes("Unavailable"));
    await comparison.screenshot({
      path: resolve(evidence, "1440-light-en-offer-statuses.png"),
    });
    fixture.products = structuredClone([sampleProduct, ...products]);
    fixture.products.find((item) => item.id === "barista").variants =
      fixture.products
        .find((item) => item.id === "barista")
        .variants.slice(0, 1);
    await page.goto(`${baseURL}/shop/${barista.handle}?format=1kg`, {
      waitUntil: "networkidle",
    });
    await page.locator("[data-requested-format-unavailable=true]").waitFor();
    assert.equal(
      await page
        .locator('[data-retail-product] fieldset button[aria-pressed="true"]')
        .count(),
      0,
    );
    assert.equal(
      await page
        .locator("[data-retail-product] button[data-pending]")
        .isDisabled(),
      true,
    );
    assert.ok(
      (await page.locator("[data-retail-product]").textContent()).includes(
        "1 kg selection unavailable",
      ),
    );
    await page.screenshot({
      path: resolve(evidence, "1440-light-en-missing-exact-format.png"),
      fullPage: true,
    });
    await page.goto(`${baseURL}/shop/not-a-product`, {
      waitUntil: "networkidle",
    });
    await page.locator("[data-product-not-found]").waitFor();
    assert.equal(
      await page.locator("[data-visible-product-profile]").count(),
      0,
      "Unknown URL does not borrow another profile",
    );
    fixture.products = structuredClone([sampleProduct, ...products]);
    await page.goto(`${baseURL}/shop`, { waitUntil: "networkidle" });
    await assertComparison(page, "en");
    fixture.country = "SG";
    let release;
    fixture.hold = new Promise((done) => {
      release = done;
    });
    await page.evaluate(() =>
      window.dispatchEvent(
        new PageTransitionEvent("pageshow", { persisted: true }),
      ),
    );
    await eventually(
      async () =>
        (await page.locator('[data-comparison-offer="refreshing"]').count()) ===
        3,
      "Return reconciles destination and refreshes every comparison offer",
    );
    assert.equal(
      await comparison.getByText("Updating prices…", { exact: true }).count(),
      3,
    );
    assert.equal(
      /[¥￥]/.test(await comparison.textContent()),
      false,
      "Refresh never exposes a stale currency amount",
    );
    for (const item of fixture.products)
      for (const variant of item.variants) variant.priceMinor += 500;
    release();
    fixture.hold = null;
    await assertComparison(page, "en");
    assert.ok((await comparison.textContent()).includes("1,500"));
    assert.deepEqual(status.errors, []);
    assert.deepEqual(status.writes, []);
    console.log(
      "Missing/ambiguous/unavailable/unknown offers, exact-format no fallback, and refresh stale-price guard passed",
    );
  } finally {
    await status.context.close();
  }
} finally {
  await browser.close();
}
