/* Existing product-record surfaces only; every commerce request is mocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL =
  process.env.PRODUCT_INFORMATION_BASE_URL ?? "http://127.0.0.1:3100";
const evidence = process.env.PRODUCT_INFORMATION_EVIDENCE;
const products = [
  ["culinary", "Culinary", "jmm-storefront-test-matcha", "UJI-01"],
  [
    "barista",
    "Barista",
    "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
    "UJI-00",
  ],
  [
    "ceremonial",
    "Premium",
    "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
    "WZKA-00",
  ],
].map(([id, name, handle, productCode], index) => ({
  id,
  title: `Japanese ${name} Matcha Powder — 1 kg`,
  handle,
  productCode,
  description: "Isolated product-information browser fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
      title: "1 kg",
      available: true,
      priceMinor: (index + 1) * 1200,
      currency: "JPY",
      options: [{ name: "Format", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));

async function setup(browser, width, tone) {
  const context = await browser.newContext({
    viewport: { width, height: width === 320 ? 740 : 900 },
    reducedMotion: "reduce",
    hasTouch: width === 320,
    isMobile: width === 320,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
  ]);
  const errors = [];
  const writes = [];
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    try {
      if (!["GET", "HEAD"].includes(request.method())) {
        writes.push(`${request.method()} ${url.pathname}`);
        assert.fail("Writes are forbidden in this browser fixture");
      }
      if (url.pathname.startsWith("/api/")) {
        assert.equal(url.origin, new URL(baseURL).origin);
        if (url.pathname === "/api/catalog")
          return route.fulfill({
            contentType: "application/json",
            json: {
              status: "ready",
              products,
              shopUrl: "https://example.invalid",
            },
          });
        if (url.pathname === "/api/cart")
          return route.fulfill({
            contentType: "application/json",
            json: { kind: "empty", checkoutEnabled: false },
          });
        assert.fail(`Unexpected API request: ${url.pathname}`);
      }
      return route.continue();
    } catch (error) {
      errors.push(error.message);
      return route.abort("blockedbyclient");
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  page.setDefaultNavigationTimeout(30_000);
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page, errors, writes };
}

async function assertRecord(page, details, code) {
  const record = details.locator("[data-product-record]");
  await record.waitFor({ state: "visible" });
  assert.equal(await record.locator("dl").count(), 1);
  assert.deepEqual(
    await record.locator("[data-published-fact] dt").allTextContents(),
    ["Product code"],
  );
  assert.deepEqual(
    await record.locator("[data-published-fact] dd").allTextContents(),
    [code],
  );
  assert.deepEqual(
    await record.locator("[data-provisional-detail] dt").allTextContents(),
    ["Ingredients", "Storage", "Shelf life"],
  );
  assert.deepEqual(
    await record.locator("[data-provisional-detail] dd").allTextContents(),
    Array(3).fill("To be confirmed (provisional)"),
  );
  assert.equal(
    await record.locator(":scope > p").textContent(),
    "Further product details are awaiting supplier confirmation.",
  );
  assert.doesNotMatch(
    await record.textContent(),
    /cultivar|harvest|lot|certification|best.before|months|°C|%/i,
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
  );
  assert.equal(
    await record.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
    true,
  );
  return record;
}

async function capture(page, record, name) {
  if (!evidence) return;
  await mkdir(evidence, { recursive: true });
  await record.scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(evidence, `${name}-context.png`) });
  await record.screenshot({ path: resolve(evidence, `${name}-record.png`) });
}

async function switchView(page, name) {
  await page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name, exact: true })
    .click();
}

async function runCase(browser, width, tone) {
  const { context, page, errors, writes } = await setup(browser, width, tone);
  try {
    await page.goto(`${baseURL}/?matcha=${products[0].handle}`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .locator("[data-homepage-product-choice]:not(:disabled)")
      .first()
      .waitFor();
    await page.locator("[data-scene-canvas]").waitFor({ state: "attached" });
    await page.evaluate(() => {
      window.__informationScene = document.querySelector("[data-scene-canvas]");
    });
    for (const product of products) {
      await page
        .locator(`[data-homepage-product-choice="${product.id}"]`)
        .click();
      await switchView(page, "Shop");
      const shop = page.locator("[data-shop-exploration]");
      await shop
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      const quantity = Number(
        await shop.getByLabel("Quantity", { exact: true }).textContent(),
      );
      assert.ok(quantity > 1);
      await switchView(page, "Overview");
      const overview = page.locator(
        '[data-homepage-view-panel="overview"] [data-overview-study="folded"]',
      );
      assert.deepEqual(
        await overview.locator("summary > span:first-child").allTextContents(),
        [
          "Formats & availability",
          "Application & preparation",
          "Product record",
        ],
        "The homepage exposes three compact disclosures with no nested Overview",
      );
      assert.equal(await overview.locator("details[open]").count(), 0);
      const recordDisclosure = overview.locator("details").filter({
        has: page.locator("summary", { hasText: "Product record" }),
      });
      await recordDisclosure.locator("summary").click();
      const record = await assertRecord(page, overview, product.productCode);
      if (product.id === "barista")
        await capture(page, record, `${width}-${tone}-home`);
      await recordDisclosure.locator("summary").click();
      assert.equal(await record.isVisible(), false);
      await switchView(page, "Specifications");
      assert.equal(
        await page
          .locator(
            '[data-homepage-view-panel="specifications"] [data-product-details]',
          )
          .count(),
        0,
        "Specifications retains its existing composition",
      );
      await switchView(page, "Shop");
      assert.equal(
        Number(
          await shop.getByLabel("Quantity", { exact: true }).textContent(),
        ),
        quantity,
      );
      assert.equal(
        await page
          .locator(`[data-homepage-product-choice="${product.id}"]`)
          .getAttribute("aria-pressed"),
        "true",
      );
      assert.equal(
        await page.evaluate(
          () =>
            document.querySelector("[data-scene-canvas]") ===
            window.__informationScene,
        ),
        true,
      );
    }
    for (const product of products) {
      await page.goto(`${baseURL}/shop/${product.handle}`, {
        waitUntil: "domcontentloaded",
      });
      const main = page.locator(
        `main[data-retail-product="${product.handle}"]`,
      );
      const details = main.locator("[data-product-details]");
      await details.waitFor();
      assert.equal(
        await details.evaluate(
          (element) => element.tagName === "DETAILS" && !element.open,
        ),
        true,
      );
      await details.locator("summary").click();
      assert.deepEqual(
        await details.getByRole("heading").allTextContents(),
        [
          "Formats & availability",
          "Application & preparation",
          "Product record",
        ],
        "The retail product-details section hierarchy is unchanged",
      );
      const record = await assertRecord(page, details, product.productCode);
      if (product.id === "barista")
        await capture(page, record, `${width}-${tone}-retail`);
      await details.locator("summary").click();
      assert.equal(await details.evaluate((element) => element.open), false);
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
  } catch (error) {
    if (evidence) {
      await mkdir(evidence, { recursive: true });
      await page.screenshot({
        path: resolve(evidence, `${width}-${tone}-failure.png`),
      });
    }
    throw error;
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  headless: true,
});
let passed = 0;
try {
  for (const width of [1366, 320]) {
    for (const tone of ["light", "dark"]) {
      await runCase(browser, width, tone);
      passed++;
      console.log(
        `PASS ${width}-${tone}: Folded homepage and retail records, all products, provisional rows, selection and quantity`,
      );
    }
  }
} finally {
  await browser.close();
}
console.log(`${passed}/4 product-information browser cases passed`);
