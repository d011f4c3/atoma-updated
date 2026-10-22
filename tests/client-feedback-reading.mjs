/* Comparison and order continuity: public reads use isolated fixtures;
 * every external request and commerce mutation is blocked. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
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
const baseURL = process.env.CLIENT_READING_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.CLIENT_READING_EVIDENCE ?? ".local/client-feedback-0227/after";
const profiles = process.env.CLIENT_READING_PROFILES?.split(",") ?? [
  "1440-light-en",
  "1440-dark-ja",
  "768-light-zh-Hans",
  "768-dark-zh-Hant",
  "390-light-ja",
  "390-dark-en",
  "360-light-zh-Hans",
  "320-dark-zh-Hant",
];
const results = [];
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
async function setup(
  width = 1440,
  tone = "light",
  locale = "en",
  motion = "no-preference",
) {
  const context = await browser.newContext({
    viewport: { width, height: width <= 360 ? 740 : width < 500 ? 844 : 900 },
    reducedMotion: motion,
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
async function checkReading(page, scope, label, mobile) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    `${label}: page fits viewport`,
  );
  const report = await scope.evaluate((root) => {
    const visible = (node) =>
      node.getClientRects().length &&
      !node.closest("[hidden], [inert], dialog:not([open])") &&
      getComputedStyle(node).visibility !== "hidden" &&
      !node.closest("details:not([open])");
    const nodes = [
      ...root.querySelectorAll("p,dt,dd,a,button,input,select,textarea"),
    ].filter(visible);
    const clipped = nodes
      .filter(
        (node) =>
          node.scrollWidth > node.clientWidth + 1 &&
          !node.matches("[data-pouch]") &&
          !["TEXTAREA", "SELECT", "INPUT"].includes(node.tagName),
      )
      .map((node) => ({ text: node.textContent, tag: node.tagName }));
    const nested = [root, ...root.querySelectorAll("*")]
      .filter(
        (node) =>
          visible(node) &&
          !node.closest("dialog") &&
          !["TEXTAREA", "SELECT", "INPUT"].includes(node.tagName) &&
          /(auto|scroll)/.test(getComputedStyle(node).overflowY) &&
          node.scrollHeight > node.clientHeight + 1,
      )
      .map((node) => ({
        tag: node.tagName,
        className: node.className,
        height: node.clientHeight,
        scroll: node.scrollHeight,
      }));
    return { clipped, nested };
  });
  assert.deepEqual(
    report.clipped,
    [],
    `${label}: reading content does not clip`,
  );
  if (mobile)
    assert.deepEqual(
      report.nested,
      [],
      `${label}: page owns normal content scrolling`,
    );
  return report;
}
async function typeAtLeast(locator, size, label) {
  const sizes = await locator.evaluateAll((nodes) =>
    nodes
      .filter((node) => node.getClientRects().length)
      .map((node) => parseFloat(getComputedStyle(node).fontSize)),
  );
  assert.ok(
    sizes.length > 0 && sizes.every((value) => value >= size - 0.1),
    `${label}: expected at least ${size}px; received ${sizes}`,
  );
  return sizes;
}
async function stable(page, scope, control, touch = false) {
  await eventually(
    () =>
      scope
        .locator(
          "a [data-scramble-policy], button [data-scramble-policy], p [data-scramble-policy]",
        )
        .evaluateAll((nodes) =>
          nodes.every((node) => node.dataset.scramblePolicy === "stable"),
        ),
    "Canonical controls and paragraphs use settled text",
  );
  await scope.evaluate((root) => {
    window.__readingChanges = [];
    const nodes = [...root.querySelectorAll("p,a,button,label,dt,dd")].filter(
      (node) =>
        node.getClientRects().length &&
        !node.closest("dialog:not([open]),[hidden],[inert]"),
    );
    window.__readingObservers = nodes.map((node) => {
      const initial = node.textContent;
      const observer = new MutationObserver(() => {
        if (node.textContent !== initial)
          window.__readingChanges.push({ initial, current: node.textContent });
      });
      observer.observe(node, {
        subtree: true,
        childList: true,
        characterData: true,
      });
      return observer;
    });
  });
  await control.hover();
  await control.focus();
  if (touch)
    await control.dispatchEvent("pointerdown", {
      pointerType: "touch",
      bubbles: true,
    });
  await page.waitForTimeout(650);
  const changes = await page.evaluate(() => {
    window.__readingObservers.forEach((observer) => observer.disconnect());
    return window.__readingChanges;
  });
  assert.deepEqual(
    changes,
    [],
    "Controls and paragraphs retain their letters during hover/focus/touch",
  );
}
async function reachable(locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ trial: true });
}
async function tab(page, label, locale) {
  await page
    .locator("[data-shopping-mode]")
    .getByRole("button", { name: translate(locale, label), exact: true })
    .click();
}
async function capture(scope, name) {
  await scope.screenshot({ path: resolve(evidence, `${name}.png`) });
}
try {
  for (const [index, profile] of (process.env.CLIENT_READING_ONLY_COLD === "1"
    ? []
    : profiles
  ).entries()) {
    const [, rawWidth, tone, locale] =
      /^(\d+)-(light|dark)-(en|ja|zh-Hans|zh-Hant)$/.exec(profile) ?? [];
    assert.ok(rawWidth);
    const width = Number(rawWidth),
      mobile = width <= 760,
      motion = index % 2 ? "reduce" : "no-preference";
    const test = await setup(width, tone, locale, motion),
      { page } = test;
    let views = 0;
    try {
      await page.goto(baseURL, { waitUntil: "domcontentloaded" });
      const intro = page.locator("[data-homepage-application-introduction]");
      await intro.locator("h1").waitFor();
      const primary = page.locator("[data-homepage-samples-entry]");
      await reachable(primary);
      const hidden = await primary.evaluate((node) => {
        const reasons = [];
        for (let parent = node; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (
            Number(style.opacity) < 0.99 ||
            style.visibility === "hidden" ||
            parent.inert
          )
            reasons.push(parent.tagName);
        }
        return reasons;
      });
      assert.deepEqual(
        hidden,
        [],
        "Initial Sample Set action is not waiting behind entrance opacity/inert",
      );
      await checkReading(page, intro, "home", mobile);
      if (width <= 390) {
        const belowFold = await intro
          .locator("a, button")
          .evaluateAll((nodes) =>
            nodes
              .filter((node) => {
                const box = node.getBoundingClientRect();
                return box.top < -1 || box.bottom > innerHeight + 1;
              })
              .map((node) => node.textContent),
          );
        assert.deepEqual(
          belowFold,
          [],
          "Homepage actions fit the first phone screen",
        );
      }
      if (mobile) {
        await typeAtLeast(
          intro.locator("p").filter({
            hasText: translate(
              locale,
              "Japanese matcha for tea service, lattes and recipes.",
            ),
          }),
          16,
          "Homepage body",
        );
        await typeAtLeast(primary, 14, "Homepage action");
      }
      await stable(
        page,
        intro,
        page.locator("[data-homepage-application-explore]"),
        mobile,
      );
      await page.screenshot({
        path: resolve(evidence, `${profile}-homepage.png`),
      });
      views++;
      await page.locator("[data-homepage-application-explore]").click();
      const material = await page
        .locator("[data-embedded=true]")
        .elementHandle();
      for (const tea of products) {
        await page
          .locator(`[data-homepage-product-choice="${tea.id}"]`)
          .click();
        await tab(page, "Overview", locale);
        const panel = page.locator("[data-application-overview]");
        await panel.waitFor();
        await checkReading(page, panel, `${tea.id} Overview`, mobile);
        if (mobile) {
          await typeAtLeast(
            panel.locator("[data-product-application-copy]"),
            16,
            "Application body",
          );
          await typeAtLeast(
            panel.locator("[data-visible-product-profile] dd"),
            16,
            "Visible sensory values",
          );
          await typeAtLeast(
            panel.locator("[data-application-samples-entry]"),
            14,
            "Overview action",
          );
        }
        await reachable(panel.locator("[data-application-samples-entry]"));
        await stable(
          page,
          panel,
          panel.locator("[data-application-shop-entry]"),
          mobile,
        );
        await capture(panel, `${profile}-${tea.id}-overview`);
        views++;
        await tab(page, "Specifications", locale);
        const specs = page.locator("[data-focused-specifications]");
        await specs.waitFor();
        assert.equal(await specs.locator("[data-specification]").count(), 7);
        if (mobile)
          await typeAtLeast(
            specs.locator("[data-specification] span:nth-child(2)"),
            16,
            "Specification values",
          );
        await checkReading(page, specs, `${tea.id} Specifications`, mobile);
        await reachable(specs.locator("[data-specification]").last());
        await stable(
          page,
          specs,
          specs.locator("[data-specification]").first(),
          mobile,
        );
        if (tea.id === "barista") {
          const trigger = specs.locator("[data-specification]").first();
          await trigger.focus();
          await page.keyboard.press("Enter");
          const dialog = specs.locator("dialog[open]");
          await dialog.waitFor();
          await page.keyboard.press("Escape");
          await dialog.waitFor({ state: "hidden" });
          assert.equal(
            await trigger.evaluate((node) => node === document.activeElement),
            true,
            "Specification dismiss returns keyboard focus",
          );
        }
        await capture(specs, `${profile}-${tea.id}-specifications`);
        views++;
        assert.equal(await material.evaluate((node) => node.isConnected), true);
        assert.equal(
          await page
            .locator(`[data-homepage-product-choice="${tea.id}"]`)
            .getAttribute("aria-pressed"),
          "true",
        );
      }
      await page.goto(`${baseURL}/shop`, { waitUntil: "networkidle" });
      const comparison = page.locator("[data-product-comparison]");
      await comparison.waitFor();
      await checkReading(page, comparison, "Shop comparison", mobile);
      if (mobile) {
        await typeAtLeast(comparison.locator("dd"), 16, "Comparison body");
        await typeAtLeast(
          comparison.locator("[data-comparison-details]"),
          14,
          "Comparison action",
        );
      }
      await stable(
        page,
        comparison,
        comparison.locator("[data-comparison-details]").first(),
        mobile,
      );
      await capture(comparison, `${profile}-comparison`);
      views++;
      await page.goto(`${baseURL}/samples`, { waitUntil: "networkidle" });
      const samples = page.locator("[data-samples-page]");
      await samples.waitFor();
      await checkReading(page, samples, "Samples", mobile);
      const tasting = page.locator("[data-sample-tasting-tools]");
      await tasting.locator('[data-tasting-tea="barista"]').click();
      await tasting
        .locator('[name="notes"]')
        .fill("Reading fixture: unsaved tasting note.");
      const link = tasting.locator('[data-tasting-link-context="editor"]');
      await reachable(link);
      if (mobile) {
        await typeAtLeast(
          tasting.locator('[name="notes"]'),
          16,
          "Tasting field",
        );
        await typeAtLeast(link, 14, "Tasting1kg action");
      }
      await stable(page, tasting, link, mobile);
      await capture(tasting, `${profile}-tasting`);
      views++;
      await link.click();
      const retail = page.locator(`[data-retail-product="${barista.handle}"]`);
      await retail.locator("h1").waitFor();
      assert.equal(
        await retail
          .getByRole("button", { name: "1 kg", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      await checkReading(page, retail, "Retail1kg", mobile);
      if (mobile) {
        await typeAtLeast(
          retail.locator("[data-product-application-copy]"),
          16,
          "Retail body",
        );
        await typeAtLeast(
          retail.locator("[data-visible-product-profile] dd"),
          16,
          "Retail profile",
        );
      }
      await reachable(retail.locator("button[data-pending]"));
      await stable(
        page,
        retail,
        retail.locator("button[data-pending]"),
        mobile,
      );
      await capture(
        retail.getByRole("region", {
          name: translate(locale, "Purchase {name}", {
            name: translate(locale, barista.title),
          }),
          exact: true,
        }),
        `${profile}-retail-order`,
      );
      views++;
      await page.goBack();
      await tasting.waitFor();
      assert.equal(
        await tasting.locator('[name="notes"]').inputValue(),
        "Reading fixture: unsaved tasting note.",
      );
      assert.deepEqual(test.errors, []);
      assert.deepEqual(test.writes, []);
      results.push({ profile, motion, views, passed: true });
      console.log(
        `${profile} (${motion}): ${views} reading views, stable labels, reachability and continuity passed`,
      );
      await writeFile(
        resolve(evidence, "results.json"),
        JSON.stringify(results, null, 2),
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
  if (process.env.CLIENT_READING_SKIP_COLD !== "1") {
    const cold = await setup(390, "light", "en", "no-preference"),
      { page } = cold;
    try {
      const cdp = await cold.context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        downloadThroughput: 1600000 / 8,
        uploadThroughput: 750000 / 8,
        connectionType: "cellular3g",
      });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      const imageTransfers = new Map();
      cdp.on("Network.responseReceived", (event) => {
        if (event.type === "Image" && event.response.url.startsWith(origin))
          imageTransfers.set(event.requestId, {
            url: new URL(event.response.url).pathname,
            encodedBytes: 0,
            finished: false,
          });
      });
      cdp.on("Network.loadingFinished", (event) => {
        const image = imageTransfers.get(event.requestId);
        if (image) {
          image.encodedBytes = event.encodedDataLength;
          image.finished = true;
        }
      });
      await page.addInitScript(() => {
        window.__readingTiming = { firstCTA: null };
        function actionState() {
          const action = document.querySelector(
            "[data-homepage-samples-entry]",
          );
          if (!action) return { found: false };
          const box = action.getBoundingClientRect();
          const hit = document.elementFromPoint(
            box.x + box.width / 2,
            box.y + box.height / 2,
          );
          return {
            found: true,
            rect: box.toJSON(),
            opacity: getComputedStyle(action).opacity,
            hit: hit?.tagName,
            hitClass: hit?.className,
            inert: Boolean(action.closest("[inert]")),
          };
        }
        document.addEventListener("DOMContentLoaded", () => {
          window.__readingTiming.domContentLoaded = performance.now();
          window.__readingTiming.atDOMContentLoaded = actionState();
        });
        window.addEventListener("load", () => {
          window.__readingTiming.load = performance.now();
        });
        function check() {
          window.__readingTiming.firstFrame ??= performance.now();
          const action = document.querySelector(
            "[data-homepage-samples-entry]",
          );
          if (action) {
            window.__readingTiming.firstSeen ??= {
              time: performance.now(),
              ...actionState(),
            };
            const bounds = action.getBoundingClientRect();
            const style = getComputedStyle(action);
            const hit = document.elementFromPoint(
              bounds.x + bounds.width / 2,
              bounds.y + bounds.height / 2,
            );
            if (
              bounds.width > 0 &&
              bounds.top >= 0 &&
              bounds.bottom <= innerHeight &&
              style.visibility !== "hidden" &&
              Number(style.opacity) > 0.99 &&
              !action.closest("[inert]") &&
              action.contains(hit)
            ) {
              window.__readingTiming.firstCTA = performance.now();
              return;
            }
          }
          requestAnimationFrame(check);
        }
        requestAnimationFrame(check);
      });
      await page.goto(baseURL, { waitUntil: "commit", timeout: 120000 });
      await page.waitForFunction(
        () => window.__readingTiming?.firstCTA !== null,
        null,
        { timeout: 120000 },
      );
      await page
        .locator("[data-homepage-samples-entry]")
        .click({ trial: true, timeout: 120000 });
      await page.screenshot({
        path: resolve(evidence, "390-light-en-cold-mobile-data.png"),
        timeout: 120000,
      });
      await page.waitForTimeout(10000);
      const timing = await page.evaluate(() => ({
        ...window.__readingTiming,
        observedAt: performance.now(),
        images: [...document.images].map((image) => ({
          source: new URL(image.currentSrc || image.src, location.href)
            .pathname,
          loaded: image.complete && image.naturalWidth > 0,
        })),
      }));
      const measurement = {
        name: "Local dev cold mobile data",
        environment:
          "Next.js development server on127.0.0.1:3100; intercepted commerce fixtures; not production Lighthouse or physical-device data",
        viewport: { width: 390, height: 844 },
        downlinkMbps: 1.6,
        uplinkKbps: 750,
        latencyMs: 150,
        cpuSlowdown: 4,
        ...timing,
        imageTransfers: [...imageTransfers.values()],
      };
      await writeFile(
        resolve(evidence, "cold-mobile-data.json"),
        JSON.stringify(measurement, null, 2),
      );
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
      await page.locator("[data-homepage-samples-entry]").click();
      await page.locator("[data-samples-page]").waitFor();
      assert.deepEqual(cold.errors, []);
      assert.deepEqual(cold.writes, []);
      console.log(
        `Cold simulatedmobiledata: CTA ${Math.round(timing.firstCTA)}ms; observed ${Math.round(timing.observedAt)}ms; ${imageTransfers.size} image responses; fixture-only measurement saved`,
      );
    } finally {
      await cold.context.close();
    }
  }
} finally {
  await browser.close();
}
