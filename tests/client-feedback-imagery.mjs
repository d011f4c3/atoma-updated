/* Client-feedback application imagery. Commerce reads are isolated fixtures;
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
const baseURL = process.env.CLIENT_IMAGERY_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.CLIENT_IMAGERY_EVIDENCE ?? ".local/client-feedback-0224/after";
const profiles = process.env.CLIENT_IMAGERY_PROFILES?.split(",") ?? [
  "1440-light-en",
  "390-dark-en",
  "390-light-ja",
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
const unknownProduct = {
  ...products[0],
  id: "unknown",
  handle: "unmapped-matcha-fixture",
  title: "Ceremonial Matcha",
  productCode: null,
  variants: [{ ...products[0].variants[0], id: `v1_${"u".repeat(43)}` }],
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

async function setup(
  width,
  tone,
  locale,
  photoMode = "ready",
  includeUnknown = false,
) {
  const context = await browser.newContext({
    viewport: { width, height: width === 360 ? 740 : width < 500 ? 844 : 900 },
    reducedMotion: "reduce",
    isMobile: width < 500,
    hasTouch: width < 500,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: locale, url: baseURL },
  ]);
  const errors = [];
  const writes = [];
  let photoRequests = 0;
  let releasePhotos;
  const photoGate = new Promise((done) => {
    releasePhotos = done;
  });
  if (photoMode !== "slow") releasePhotos();
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
          products: [
            sampleProduct,
            ...products,
            ...(includeUnknown ? [unknownProduct] : []),
          ],
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
    if (decodeURIComponent(url.href).includes("/images/applications/")) {
      photoRequests++;
      if (photoMode === "failed") return route.abort("failed");
      await photoGate;
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
    releasePhotos,
    photoRequests: () => photoRequests,
  };
}

const sources = {
  ceremonial: "/images/samples/prepared-matcha.webp",
  barista: "/images/applications/iced-matcha-latte-reference-v1.webp",
  culinary: "/images/applications/matcha-tea-cake-reference-v1.webp",
};
const usageCopy = {
  ceremonial: "For tea served with water.",
  barista: "For hot and iced matcha lattes.",
  culinary: "For baking, desserts and café recipes.",
};
const overview = (page) => page.locator("[data-application-overview]");
const photograph = (scope, key) =>
  scope.locator(`[data-product-application-image="${key}"]`);

async function assertPhoto(scope, key, locale) {
  const figure = photograph(scope, key);
  await figure.waitFor();
  await eventually(
    async () => (await figure.getAttribute("data-image-state")) === "ready",
    `${key} application photograph loads`,
  );
  const image = figure.locator("img");
  const url = new URL(await image.getAttribute("src"), baseURL);
  assert.equal(url.searchParams.get("url") ?? url.pathname, sources[key]);
  assert.ok((await image.getAttribute("alt")).trim().length > 12);
  assert.equal(
    await image.evaluate((node) => node.complete && node.naturalWidth > 0),
    true,
  );
  const caption = figure.locator("[data-product-application-caption]");
  assert.equal(
    (await caption.textContent()).trim(),
    translate(
      locale,
      key === "ceremonial"
        ? "Application reference · Product photography pending"
        : "AI application reference · Product photography pending",
    ),
  );
  assert.equal(await caption.isVisible(), true);
  return figure;
}

async function assertOverview(page, tea, locale) {
  const panel = overview(page);
  await panel.waitFor();
  assert.equal(
    await panel
      .getByRole("heading", { name: translate(locale, tea.name), exact: true })
      .isVisible(),
    true,
  );
  const figure = await assertPhoto(panel, tea.key, locale);
  assert.ok((await panel.textContent()).includes(tea.productCode));
  const copy = (
    await panel.locator("[data-product-application-copy]").textContent()
  ).trim();
  assert.equal(copy, translate(locale, usageCopy[tea.key]));
  assert.equal(
    await panel
      .locator("[data-application-samples-entry]")
      .getAttribute("href"),
    "/samples",
  );
  assert.equal(
    await panel.locator("[data-application-shop-entry]").isEnabled(),
    true,
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
  );
  const overflow = await panel
    .locator("h2, p, a, button")
    .evaluateAll((nodes) =>
      nodes
        .filter(
          (node) =>
            node.getClientRects().length &&
            node.scrollWidth > node.clientWidth + 1,
        )
        .map((node) => node.textContent),
    );
  assert.deepEqual(
    overflow,
    [],
    "Localized application copy and actions do not clip",
  );
  return { panel, figure, copy };
}

async function chooseTab(page, label, locale) {
  await page
    .locator("[data-shopping-mode]")
    .getByRole("button", {
      name: translate(locale, label),
      exact: true,
    })
    .click();
}

try {
  for (const profile of profiles) {
    const [, rawWidth, tone, locale] =
      /^(\d+)-(light|dark)-(en|ja|zh-Hans|zh-Hant)$/.exec(profile) ?? [];
    assert.ok(rawWidth);
    const test = await setup(Number(rawWidth), tone, locale);
    const { page } = test;
    try {
      await page.goto(baseURL, { waitUntil: "networkidle" });
      await page.locator("[data-homepage-application-explore]").click();
      const material = await page
        .locator("[data-embedded=true]")
        .elementHandle();
      const copies = new Set();
      for (const tea of SAMPLE_SET_CONTENTS) {
        await page
          .locator(`[data-homepage-product-choice="${tea.key}"]`)
          .click();
        await chooseTab(page, "Overview", locale);
        const { panel, copy } = await assertOverview(page, tea, locale);
        copies.add(copy);
        assert.equal(await material.evaluate((node) => node.isConnected), true);
        await panel.screenshot({
          path: resolve(evidence, `${profile}-${tea.key}-overview.png`),
        });
        await chooseTab(page, "Specifications", locale);
        const specifications = page.locator(
          '[data-homepage-view-panel="specifications"]',
        );
        await specifications.waitFor();
        assert.equal(
          await specifications
            .locator("[data-product-application-image]")
            .count(),
          0,
        );
        assert.equal(
          await page
            .locator(`[data-homepage-product-choice="${tea.key}"]`)
            .getAttribute("aria-pressed"),
          "true",
        );
        await chooseTab(page, "Overview", locale);
        await assertPhoto(overview(page), tea.key, locale);
        await overview(page).locator("[data-application-shop-entry]").click();
        await page.locator(`[data-shop-product="${tea.key}"]`).waitFor();
        assert.equal(
          await page
            .locator(`[data-homepage-product-choice="${tea.key}"]`)
            .getAttribute("aria-pressed"),
          "true",
        );
        await chooseTab(page, "Overview", locale);
      }
      assert.equal(
        copies.size,
        3,
        "The three products have distinct application copy",
      );
      const selected = SAMPLE_SET_CONTENTS.at(-1);
      await overview(page).locator("[data-application-samples-entry]").click();
      await page.locator("[data-samples-page]").waitFor();
      await page.goBack();
      await assertOverview(page, selected, locale);
      assert.equal(
        await page
          .locator(`[data-homepage-product-choice="${selected.key}"]`)
          .getAttribute("aria-pressed"),
        "true",
        "Sample Set visit and Back retain the selected tea and application photograph",
      );

      for (const tea of SAMPLE_SET_CONTENTS) {
        await page.goto(`${baseURL}/shop/${tea.productHandle}`, {
          waitUntil: "networkidle",
        });
        const retail = page.locator(
          `[data-retail-product="${tea.productHandle}"]`,
        );
        await retail
          .getByRole("heading", {
            name: translate(locale, tea.name),
            exact: true,
          })
          .waitFor();
        const figure = await assertPhoto(retail, tea.key, locale);
        await figure.screenshot({
          path: resolve(evidence, `${profile}-${tea.key}-retail-photo.png`),
        });
      }
      assert.deepEqual(test.errors, []);
      assert.deepEqual(test.writes, []);
      console.log(
        `${profile}: three application images/copy, next actions, Specifications, retail and Back passed`,
      );
    } catch (error) {
      await page.screenshot({
        path: resolve(evidence, `${profile}-failure.png`),
        fullPage: true,
      });
      throw error;
    } finally {
      test.releasePhotos();
      await test.context.close();
    }
  }

  const barista = SAMPLE_SET_CONTENTS.find((tea) => tea.key === "barista");
  const slow = await setup(390, "dark", "en", "slow");
  try {
    const { page } = slow;
    await page.goto(`${baseURL}/?matcha=${barista.productHandle}`, {
      waitUntil: "domcontentloaded",
    });
    const panel = overview(page);
    await panel.waitFor();
    const figure = photograph(panel, "barista");
    await figure.scrollIntoViewIfNeeded();
    await eventually(
      async () => slow.photoRequests() > 0,
      "Application image remains pending",
    );
    assert.equal(await figure.getAttribute("data-image-state"), "loading");
    const before = await figure.boundingBox();
    assert.equal(
      await panel.locator("[data-application-shop-entry]").isEnabled(),
      true,
    );
    await panel.locator("[data-application-shop-entry]").click();
    await page.locator('[data-shop-product="barista"]').waitFor();
    slow.releasePhotos();
    await chooseTab(page, "Overview", "en");
    await assertPhoto(overview(page), "barista", "en");
    const after = await figure.boundingBox();
    assert.ok(
      Math.abs(after.height - before.height) <= 1,
      "The image frame reserves its height while loading",
    );
    assert.deepEqual(slow.errors, []);
    assert.deepEqual(slow.writes, []);
    console.log(
      "Slow application image reserves space and leaves the next action usable",
    );
  } finally {
    slow.releasePhotos();
    await slow.context.close();
  }

  const failed = await setup(390, "light", "en", "failed");
  try {
    const { page } = failed;
    await page.goto(`${baseURL}/?matcha=${barista.productHandle}`, {
      waitUntil: "networkidle",
    });
    const panel = overview(page);
    const figure = photograph(panel, "barista");
    await eventually(
      async () => (await figure.getAttribute("data-image-state")) === "failed",
      "Failed photograph shows a fallback",
    );
    assert.equal(
      await figure.locator("[data-product-application-fallback]").isVisible(),
      true,
    );
    assert.equal(
      await panel
        .getByRole("heading", { name: "Barista Matcha", exact: true })
        .isVisible(),
      true,
    );
    await panel.screenshot({
      path: resolve(evidence, "390-light-en-failed-application.png"),
    });
    await panel.locator("[data-application-shop-entry]").click();
    await page.locator('[data-shop-product="barista"]').waitFor();
    assert.deepEqual(failed.errors, []);
    assert.deepEqual(failed.writes, []);
    console.log(
      "Failed application image retains the correct product and usable actions",
    );
  } finally {
    await failed.context.close();
  }

  const unknown = await setup(1440, "light", "en", "ready", true);
  try {
    const { page } = unknown;
    await page.goto(`${baseURL}/shop/${unknownProduct.handle}`, {
      waitUntil: "networkidle",
    });
    const figure = page.locator('[data-product-application-image="unknown"]');
    await figure.waitFor();
    assert.equal(await figure.getAttribute("data-image-state"), "unavailable");
    assert.equal(
      await figure.locator("img").count(),
      0,
      "An unmapped product never borrows an application photograph from a matching title",
    );
    assert.equal(
      await figure.locator("[data-product-application-fallback]").isVisible(),
      true,
    );
    await figure.screenshot({
      path: resolve(evidence, "1440-light-en-unknown-application.png"),
    });
    assert.deepEqual(unknown.errors, []);
    assert.deepEqual(unknown.writes, []);
    console.log(
      "Unknown product with a matching title receives neutral application imagery",
    );
  } finally {
    await unknown.context.close();
  }
} finally {
  await browser.close();
}
