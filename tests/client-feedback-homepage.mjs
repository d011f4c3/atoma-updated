/* Canonical client-feedback homepage entry. Commerce reads are isolated fixtures;
 * external requests and writes are blocked, including checkout and cart changes. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";
import { translate } from "../src/lib/i18n/index.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.CLIENT_HOMEPAGE_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.CLIENT_HOMEPAGE_EVIDENCE ?? ".local/client-feedback-0223/after";
const profiles = process.env.CLIENT_HOMEPAGE_PROFILES?.split(",") ?? [
  "1440-light-en",
  "768-light-en",
  "390-light-en",
  "360-dark-en",
  "320-light-en",
  "390-dark-ja",
  "390-light-zh-Hans",
  "390-dark-zh-Hant",
];
const products = SAMPLE_SET_CONTENTS.map((item, index) => ({
  id: item.key,
  handle: item.productHandle,
  title: item.name,
  productCode: item.productCode,
  description: "Isolated application-entry browser fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
      title: "1 kg",
      available: true,
      priceMinor: 6000 + index * 1000,
      currency: "JPY",
      options: [{ name: "Size", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
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
const cartProduct = products.find((item) => item.id === "barista");
const cart = {
  totalQuantity: 2,
  subtotalLabel: "¥14,000",
  totalLabel: "¥14,000",
  lines: [
    {
      lineKey: "retained-barista",
      productHandle: cartProduct.handle,
      productTitle: cartProduct.title,
      variantTitle: "1 kg",
      options: cartProduct.variants[0].options,
      quantity: 2,
      unitPriceLabel: "¥7,000",
      lineTotalLabel: "¥14,000",
      purchaseState: "purchasable",
      quantityRule: { minimum: 1, maximum: 4, increment: 1 },
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

async function setup(width, tone, locale, holdBag = false, failBag = false) {
  const context = await browser.newContext({
    viewport: { width, height: width === 360 ? 740 : width < 500 ? 844 : 900 },
    reducedMotion: holdBag ? "no-preference" : "reduce",
    isMobile: width < 500,
    hasTouch: width < 500,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: locale, url: baseURL },
  ]);
  const errors = [];
  const writes = [];
  let bagRequests = 0;
  let releaseBag;
  const bagGate = new Promise((done) => {
    releaseBag = done;
  });
  if (!holdBag) releaseBag();
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin) {
      errors.push(`Unexpected external request: ${url.origin}`);
      return route.abort();
    }
    if (!["GET", "HEAD"].includes(request.method())) {
      writes.push(`${request.method()} ${url.pathname}`);
      return route.abort();
    }
    if (url.pathname === "/api/catalog")
      return route.fulfill({
        json: {
          status: "ready",
          products: [sampleProduct, ...products],
          shopUrl: "https://example.invalid",
        },
      });
    if (url.pathname === "/api/cart")
      return route.fulfill({
        json: { kind: "ready", cart, checkoutEnabled: false },
      });
    if (url.pathname === "/api/destination")
      return route.fulfill({
        json: {
          kind: "ready",
          preference: { countryCode: "US", source: "default" },
          destination: { countryCode: "US", currency: "JPY" },
          countries: ["US", "SG"],
          reviewRequired: false,
        },
      });
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Unexpected API read: ${url.pathname}`);
      return route.abort();
    }
    if (decodeURIComponent(url.href).includes("foil-pouch-sticker-v3.png")) {
      bagRequests++;
      if (failBag) return route.abort("failed");
      await bagGate;
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  return {
    context,
    page,
    errors,
    writes,
    releaseBag,
    bagRequests: () => bagRequests,
  };
}

try {
  for (const profile of profiles) {
    const [, rawWidth, tone, locale] =
      /^(\d+)-(light|dark)-(en|ja|zh-Hans|zh-Hant)$/.exec(profile) ?? [];
    assert.ok(rawWidth, `Unsupported profile: ${profile}`);
    const test = await setup(Number(rawWidth), tone, locale);
    const { page } = test;
    try {
      await page.goto(baseURL, { waitUntil: "networkidle" });
      const intro = page.locator("[data-homepage-application-introduction]");
      await intro.locator("h1").waitFor();
      assert.equal(
        (await intro.locator("h1").textContent()).trim(),
        translate(locale, "Matcha for the way you make it."),
      );
      for (const source of [
        "Japanese matcha for tea service, lattes and recipes.",
        "Three matcha · 20 g each",
      ])
        assert.equal(
          await intro
            .getByText(translate(locale, source), { exact: true })
            .isVisible(),
          true,
        );
      assert.equal(
        await page
          .locator("[data-homepage-samples-entry]")
          .getAttribute("href"),
        "/samples",
      );
      assert.equal(await page.locator("main").getAttribute("inert"), null);
      assert.equal(await intro.locator("[data-scramble-glyph]").count(), 0);
      for (const tea of SAMPLE_SET_CONTENTS) {
        const application = intro.locator(
          `[data-homepage-application="${tea.key}"]`,
        );
        assert.equal(
          await application.getAttribute("href"),
          `/shop/${tea.productHandle}`,
        );
        assert.ok(
          (await application.getAttribute("aria-label")).includes(
            translate(locale, tea.name),
          ),
        );
      }
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
      );
      const invalidGeometry = await intro
        .locator("h1, p, a, button")
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => {
              const rect = node.getBoundingClientRect();
              return (
                rect.width > 0 &&
                (rect.left < -1 ||
                  rect.right > innerWidth + 1 ||
                  node.scrollWidth > node.clientWidth + 1 ||
                  (innerWidth <= 390 &&
                    (rect.top < -1 || rect.bottom > innerHeight + 1)))
              );
            })
            .map((node) => ({
              text: node.textContent,
              bounds: node.getBoundingClientRect().toJSON(),
              width: node.clientWidth,
              scrollWidth: node.scrollWidth,
            })),
        );
      assert.deepEqual(
        invalidGeometry,
        [],
        "Headline, copy and all entry actions fit the first screen",
      );
      await page.screenshot({
        path: resolve(evidence, `${profile}-homepage.png`),
      });
      await page.locator("[data-homepage-application-explore]").click();
      const configurator = page.locator("[data-embedded=true]");
      await eventually(
        async () =>
          (await configurator.getAttribute("data-entry-settled")) === "true",
        "Existing in-place explorer settles",
      );
      assert.equal(
        await page.locator("[data-sample-start-entry]").isVisible(),
        false,
        "Application exploration opens tea information",
      );
      assert.equal(
        await page.locator('[data-homepage-view-panel="overview"]').isVisible(),
        true,
      );
      await page.locator('[data-homepage-product-choice="barista"]').click();
      await eventually(
        async () =>
          (await page
            .locator('[data-homepage-product-choice="barista"]')
            .getAttribute("aria-pressed")) === "true",
        "Existing tea controls select Barista",
      );
      const mountedConfigurator = await configurator.elementHandle();
      await page
        .getByRole("button", {
          name: translate(locale, "Back to overview"),
          exact: true,
        })
        .click();
      await intro.locator("h1").waitFor();
      await eventually(
        () =>
          page
            .locator("[data-homepage-application-explore]")
            .evaluate((node) => node === document.activeElement),
        "Closing explorer returns focus to its original action",
      );
      await page.locator("[data-homepage-application-explore]").click();
      await eventually(
        async () =>
          (await configurator.getAttribute("data-entry-settled")) === "true",
        "Reopened explorer settles",
      );
      assert.equal(
        await mountedConfigurator.evaluate((node) => node.isConnected),
        true,
        "Explorer state remains mounted",
      );
      assert.equal(
        await page
          .locator('[data-homepage-product-choice="barista"]')
          .getAttribute("aria-pressed"),
        "true",
      );
      assert.deepEqual(test.errors, []);
      assert.deepEqual(test.writes, []);
      console.log(
        `${profile}: first screen, translated entries, mappings and in-place continuity passed`,
      );
    } catch (error) {
      await page.screenshot({
        path: resolve(evidence, `${profile}-failure.png`),
        fullPage: true,
      });
      throw error;
    } finally {
      test.releaseBag();
      await test.context.close();
    }
  }

  const slow = await setup(390, "light", "en", true);
  try {
    const { page } = slow;
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await page.locator("[data-homepage-samples-entry]").waitFor();
    await eventually(
      async () => slow.bagRequests() > 0,
      "Hero image is held pending",
    );
    await page.locator("[data-homepage-samples-entry]").click();
    await page.locator("[data-samples-page]").waitFor();
    assert.equal(new URL(page.url()).pathname, "/samples");
    assert.deepEqual(slow.errors, []);
    assert.deepEqual(slow.writes, []);
    console.log(
      "Slow hero: primary Sample Set action works before image readiness",
    );
  } finally {
    slow.releaseBag();
    await slow.context.close();
  }

  const routes = await setup(1440, "light", "en");
  try {
    const { page } = routes;
    for (const tea of SAMPLE_SET_CONTENTS) {
      await page.goto(baseURL, { waitUntil: "networkidle" });
      await page.locator(`[data-homepage-application="${tea.key}"]`).click();
      await page
        .locator(`[data-retail-product="${tea.productHandle}"]`)
        .waitFor();
      await page
        .getByRole("heading", { name: tea.name, exact: true })
        .waitFor();
      assert.equal(new URL(page.url()).pathname, `/shop/${tea.productHandle}`);
      await page
        .getByRole("button", { name: "Open cart, 2 items", exact: true })
        .click();
      const dialog = page.locator("dialog[open]");
      await dialog.waitFor();
      assert.ok((await dialog.innerText()).includes("¥14,000"));
      await dialog
        .getByRole("button", { name: "Close cart", exact: true })
        .click();
    }
    assert.deepEqual(routes.errors, []);
    assert.deepEqual(routes.writes, []);
    console.log(
      "All three application links open their correct product and retain the cart",
    );
  } finally {
    await routes.context.close();
  }
} finally {
  await browser.close();
}
