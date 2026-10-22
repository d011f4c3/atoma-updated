/* Client-feedback baseline and flow audit. All commerce reads use isolated
 * fixtures. External requests, unknown APIs and every network write are blocked. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";
import { oneKilogramProductUrl } from "../src/lib/sample-journey.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.CLIENT_FEEDBACK_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.CLIENT_FEEDBACK_EVIDENCE ?? ".local/client-feedback-0223/before";
const widths = process.env.CLIENT_FEEDBACK_WIDTHS?.split(",").map(Number) ?? [
  1440, 390,
];
const destination = { countryCode: "US", currency: "USD" };
const variants = (letter, title, options, priceMinor) => [
  {
    id: `v1_${letter.repeat(43)}`,
    title,
    available: true,
    priceMinor,
    currency: destination.currency,
    options,
    minimum: 1,
    maximum: 4,
    increment: 1,
  },
];
const products = [
  {
    id: "isolated-sample-set",
    handle: SAMPLE_SET_OFFER.productHandle,
    title: "Sample Set",
    productCode: null,
    variants: variants(
      "s",
      "3 × 20 g",
      SAMPLE_SET_OFFER.variants[0].options,
      2900,
    ),
  },
  ...SAMPLE_SET_CONTENTS.map((item, index) => ({
    id: item.key,
    handle: item.productHandle,
    title: item.name,
    productCode: item.productCode,
    variants: variants(
      String.fromCharCode(97 + index),
      "1 kg",
      [{ name: "Format", value: "1 kg" }],
      6500 + index * 1000,
    ),
  })),
].map((product) => ({
  ...product,
  description: "Isolated browser fixture for the client-feedback baseline.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
}));
const manifest = {
  fixtureDisclosure:
    "Local Chromium emulation, not a live-commerce or physical-device audit. Prices, availability and quantity limits are synthetic fixture data. Product identities and handles use canonical repository references.",
  widths,
  screens: [],
  journeys: [],
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

async function setup(width) {
  const context = await browser.newContext({
    viewport: { width, height: width < 700 ? 844 : 900 },
    reducedMotion: "reduce",
    isMobile: width < 700,
    hasTouch: width < 700,
  });
  await context.addCookies([
    { name: "atoma-theme", value: "light", url: baseURL },
    { name: "atoma-locale", value: "en", url: baseURL },
  ]);
  const errors = [];
  const blocked = [];
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      blocked.push(`${request.method()} ${url.origin}${url.pathname}`);
      return route.abort();
    }
    if (url.pathname === "/api/catalog")
      return route.fulfill({
        json: {
          status: "ready",
          products,
          destination,
          shopUrl: "https://example.invalid",
        },
      });
    if (url.pathname === "/api/cart")
      return route.fulfill({
        json: {
          kind: "empty",
          destination,
          destinationReviewRequired: false,
          checkoutEnabled: false,
        },
      });
    if (url.pathname === "/api/destination")
      return route.fulfill({
        json: {
          kind: "ready",
          preference: { countryCode: "US", source: "manual" },
          destination,
          countries: ["US", "SG"],
          reviewRequired: false,
        },
      });
    if (url.pathname.startsWith("/api/")) {
      blocked.push(`Unknown API: ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page, errors, blocked, width };
}

async function capture(test, name, focus) {
  const { page, width } = test;
  await page.evaluate(() => document.fonts.ready);
  const prefix = `${width}-light-en-${name}`;
  await page.screenshot({ path: resolve(evidence, `${prefix}.png`) });
  const metrics = await page.evaluate(() => {
    const visible = (node) =>
      node.getClientRects().length &&
      getComputedStyle(node).visibility !== "hidden" &&
      !node.closest("[hidden]");
    const cleanText = (node) => {
      const clone = node.cloneNode(true);
      clone
        .querySelectorAll('[aria-hidden="true"]')
        .forEach((item) => item.remove());
      return clone.textContent?.replace(/\s+/g, " ").trim();
    };
    return {
      url: `${location.pathname}${location.search}${location.hash}`,
      documentOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      headings: [...document.querySelectorAll("main h1, main h2")]
        .filter(visible)
        .map(cleanText),
      selectedTea: document
        .querySelector('[data-homepage-product-choice][aria-pressed="true"]')
        ?.getAttribute("data-homepage-product-choice"),
      visibleImages: [...document.querySelectorAll("main img")]
        .filter(visible)
        .map((image) => ({
          src: image.getAttribute("src"),
          alt: image.getAttribute("alt"),
          loaded: image.complete && image.naturalWidth > 0,
          width: Math.round(image.getBoundingClientRect().width),
          height: Math.round(image.getBoundingClientRect().height),
        })),
    };
  });
  if (focus) {
    await focus.screenshot({
      path: resolve(evidence, `${prefix}-detail.png`),
    });
    metrics.focus = await focus.evaluate((node) => ({
      height: node.clientHeight,
      scrollHeight: node.scrollHeight,
      width: node.clientWidth,
      scrollWidth: node.scrollWidth,
      links: [...node.querySelectorAll("a")].map((link) => ({
        label: link.textContent?.replace(/\s+/g, " ").trim(),
        href: link.getAttribute("href"),
      })),
    }));
  }
  manifest.screens.push({
    width,
    name,
    screenshot: `${prefix}.png`,
    ...metrics,
  });
  await writeFile(
    resolve(evidence, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

try {
  for (const width of widths) {
    const test = await setup(width);
    const { page } = test;
    try {
      await page.goto(baseURL, { waitUntil: "networkidle" });
      await page.locator("main:not([data-hero-loading])").waitFor();
      await capture(test, "homepage");
      await page
        .getByRole("button", {
          name: "Explore matcha from the silver bag",
          exact: true,
        })
        .click();
      const configurator = page.locator("[data-embedded=true]");
      await eventually(
        async () =>
          (await configurator.getAttribute("data-entry-settled")) === "true",
        "The in-place selection has settled",
      );
      await capture(
        test,
        "homepage-sample-panel",
        page.locator("[data-sample-start-entry]"),
      );
      for (const tea of SAMPLE_SET_CONTENTS) {
        await page
          .locator(`[data-homepage-product-choice="${tea.key}"]`)
          .click();
        await eventually(
          async () =>
            (await page
              .locator(`[data-homepage-product-choice="${tea.key}"]`)
              .getAttribute("aria-pressed")) === "true",
          `The ${tea.key} selector updates the material and information`,
        );
        for (const view of ["overview", "specifications"]) {
          await configurator
            .locator("[data-shopping-mode]")
            .getByRole("button", {
              name: view === "overview" ? "Overview" : "Specifications",
              exact: true,
            })
            .click();
          const panel = page.locator(`[data-homepage-view-panel="${view}"]`);
          await panel.waitFor();
          await capture(test, `${tea.key}-${view}`, panel);
        }
      }
      await page.goto(`${baseURL}/shop`, { waitUntil: "networkidle" });
      await page.locator('[data-shop-product="barista"]').waitFor();
      await capture(test, "shop");
      await page.screenshot({
        path: resolve(evidence, `${width}-light-en-shop-full.png`),
        fullPage: true,
      });
      await page.goto(`${baseURL}/samples`, { waitUntil: "networkidle" });
      await page.locator("[data-sample-order]").waitFor();
      await capture(test, "samples");
      const tools = page.locator("[data-sample-tasting-tools]");
      await tools
        .getByRole("button", { name: "Tasting card", exact: true })
        .click();
      await tools.locator('[data-tasting-tea="barista"]').click();
      await tools
        .locator('[name="notes"]')
        .fill("Isolated fixture tasting note.");
      await tools
        .getByRole("button", { name: "Save tasting card", exact: true })
        .click();
      await tools
        .getByRole("status")
        .filter({ hasText: "Saved on this device." })
        .first()
        .waitFor();
      await tools.scrollIntoViewIfNeeded();
      await capture(test, "tasting-barista", tools);
      const editorOneKgLinks = await tools
        .locator('a[href*="format=1kg"]')
        .count();
      await tools
        .getByRole("button", { name: "Compare samples", exact: true })
        .click();
      const comparison = tools.locator("[data-tasting-comparison]");
      await comparison
        .getByRole("combobox", { name: "First matcha", exact: true })
        .selectOption("barista");
      await comparison
        .getByRole("combobox", { name: "Second matcha", exact: true })
        .selectOption("culinary");
      await capture(test, "tasting-comparison", comparison);
      const comparisonOneKgLinks = await comparison
        .locator('a[href*="format=1kg"]')
        .count();
      const nextOrder = page.locator("[data-sample-next-order]");
      const destinationBeforeExplicitChoice = await nextOrder
        .locator("[data-sample-one-kilogram]")
        .getAttribute("href");
      const barista = SAMPLE_SET_CONTENTS.find((tea) => tea.key === "barista");
      await nextOrder
        .locator(`input[value="${barista.productHandle}"]`)
        .check();
      await nextOrder.scrollIntoViewIfNeeded();
      const href = await nextOrder
        .locator("[data-sample-one-kilogram]")
        .getAttribute("href");
      assert.equal(href, oneKilogramProductUrl(barista.productHandle));
      await capture(test, "next-order-barista", nextOrder);
      manifest.journeys.push({
        width,
        tastingTea: "barista",
        comparisonTeas: ["barista", "culinary"],
        editorOneKgLinks,
        comparisonOneKgLinks,
        destinationBeforeExplicitChoice,
        destinationAfterExplicitChoice: href,
      });
      await nextOrder.locator("[data-sample-one-kilogram]").click();
      await page
        .locator(`[data-retail-product="${barista.productHandle}"]`)
        .waitFor();
      await page
        .getByRole("heading", { name: "Barista Matcha", exact: true })
        .waitFor();
      await capture(test, "barista-1kg");
      assert.deepEqual(test.errors, []);
      assert.deepEqual(test.blocked, []);
      console.log(
        `${width}: homepage, six product views, Shop, samples, tasting and 1 kg baseline captured`,
      );
    } finally {
      await test.context.close();
    }
  }
} finally {
  await writeFile(
    resolve(evidence, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await browser.close();
}
