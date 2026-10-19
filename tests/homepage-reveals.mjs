/* Canonical homepage motion. Commerce reads use isolated fixtures; every write
 * and external request is blocked. Run against the local development server. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";

const playwright = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL =
  process.env.HOMEPAGE_REVEALS_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.HOMEPAGE_REVEALS_EVIDENCE ?? ".local/page-reveals-0210/home";
const filter = process.env.HOMEPAGE_REVEALS_FILTER;
const engineFilter = process.env.HOMEPAGE_REVEALS_BROWSER;
const destination = { countryCode: "US", currency: "USD" };
assert.ok(SAMPLE_SET_OFFER);
const products = [
  {
    id: "isolated-sample-set",
    handle: SAMPLE_SET_OFFER.productHandle,
    title: "Sample Set",
    variants: [
      {
        id: `v1_${"s".repeat(43)}`,
        title: "3 × 20 g",
        options: SAMPLE_SET_OFFER.variants[0].options,
      },
    ],
  },
  ...SAMPLE_SET_CONTENTS.map((item, index) => ({
    id: item.key,
    handle: item.productHandle,
    title: item.name,
    productCode: item.productCode,
    variants: [
      {
        id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
        title: "1 kg",
        options: [{ name: "Format", value: "1 kg" }],
      },
    ],
  })),
].map((product) => ({
  ...product,
  description: "Isolated homepage motion fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: product.variants.map((variant) => ({
    ...variant,
    available: true,
    priceMinor: 2900,
    currency: "USD",
    minimum: 1,
    maximum: 4,
    increment: 1,
  })),
}));

async function setup(browser, width, tone, options = {}) {
  const context = await browser.newContext({
    viewport: { width, height: width <= 760 ? 844 : 900 },
    isMobile: width <= 760,
    hasTouch: width <= 760,
    reducedMotion: "no-preference",
    ...options,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: "en", url: baseURL },
  ]);
  const errors = [];
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (
      url.origin !== new URL(baseURL).origin ||
      !["GET", "HEAD"].includes(request.method())
    ) {
      errors.push(
        `Blocked unexpected request: ${request.method()} ${url.pathname}`,
      );
      return route.abort();
    }
    if (url.pathname === "/api/destination")
      return route.fulfill({
        json: {
          kind: "ready",
          preference: { countryCode: "US", source: "manual" },
          destination,
          countries: ["US"],
          reviewRequired: false,
        },
      });
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
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Blocked unexpected API: ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page, errors };
}

async function monitorHero(page) {
  await page.addInitScript(() => {
    window.__homepageMotion = { frames: [], starts: [] };
    let started;
    document.addEventListener("animationstart", (event) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.hasAttribute("data-page-enter")
      )
        window.__homepageMotion.starts.push(
          event.target.getAttribute("data-page-enter"),
        );
    });
    function tick() {
      const main = document.querySelector(
        '[data-concept="01"][data-page-entrance]',
      );
      const heading = main?.querySelector('h1[data-page-enter="hero"]');
      const stage = main?.querySelector('[data-brand-part="image-stage"]');
      if (heading && stage) {
        started ??= performance.now();
        const type = getComputedStyle(heading),
          visual = getComputedStyle(stage);
        window.__homepageMotion.frames.push({
          phase: main.getAttribute("data-hero-loading") ?? "done",
          opacity: Number(type.opacity),
          translate: type.translate,
          visual: Number(visual.opacity),
          animation: type.animationName,
        });
      }
      if (started === undefined || performance.now() - started < 6000)
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

async function checkSettled(page) {
  const heading = page.locator('h1[data-page-enter="hero"]');
  await page
    .locator('h1[data-page-enter="hero"][data-page-enter-done]')
    .waitFor();
  await page
    .locator('[data-brand-part="image-stage"][data-page-enter-done]')
    .waitFor();
  assert.deepEqual(
    await heading.evaluate((node) => ({
      opacity: getComputedStyle(node).opacity,
      translate: getComputedStyle(node).translate,
      animation: getComputedStyle(node).animationName,
      childAnimation: getComputedStyle(node.querySelector("span"))
        .animationName,
    })),
    {
      opacity: "1",
      translate: "none",
      animation: "none",
      childAnimation: "none",
    },
  );
}

async function normalCase(browser, name, width, tone) {
  const { page, context, errors } = await setup(browser, width, tone);
  try {
    await monitorHero(page);
    await page.goto(baseURL);
    await checkSettled(page);
    await page.locator("[data-hero-loader]").waitFor({ state: "detached" });
    const initial = await page.evaluate(() => window.__homepageMotion);
    assert.ok(
      initial.frames.some(
        (frame) =>
          ["leaving", "done"].includes(frame.phase) &&
          frame.opacity > 0 &&
          frame.opacity < 0.98,
      ),
      "Heading has visible intermediate frames after loader release",
    );
    assert.ok(
      initial.frames.some(
        (frame) =>
          ["leaving", "done"].includes(frame.phase) &&
          frame.visual > 0 &&
          frame.visual < 0.98,
      ),
      "Bag has visible intermediate frames after loader release",
    );
    assert.ok(
      initial.frames
        .filter((frame) => ["loading", "complete"].includes(frame.phase))
        .every((frame) => frame.animation === "none"),
      "Entrance does not play behind the waiting loader",
    );
    await page.screenshot({
      path: `${evidence}/${name}-hero.png`,
      fullPage: false,
    });
    await page
      .getByRole("button", {
        name: "Explore matcha from the silver bag",
        exact: true,
      })
      .click();
    const purchase = page.locator(
      "[data-sample-order-panel] [data-sample-purchase]",
    );
    await page.waitForFunction(() =>
      document.querySelector('[data-entry-settled="true"]'),
    );
    await page.waitForFunction(() => {
      const add = document.querySelector(
        '[data-sample-order-panel] [data-sample-purchase] button[data-available="true"]',
      );
      return add && !add.disabled;
    });
    await page
      .locator('[data-brand-part="selection-workspace"][data-page-reveal-root]')
      .waitFor();
    const pending = page
      .locator('main [data-page-reveal-state="pending"]')
      .last();
    let scrollFrames = [];
    let revealedGroup = null;
    if (width <= 760) {
      assert.ok(
        await pending.count(),
        `Opened mobile Sample Set has an offscreen reveal group: ${JSON.stringify(await page.locator("main [data-page-reveal]").evaluateAll((nodes) => nodes.map((node) => ({ state: node.dataset.pageRevealState, top: Math.round(node.getBoundingClientRect().top), hidden: Boolean(node.closest("[inert],[hidden]")), root: node.closest("[data-page-reveal-root]")?.getAttribute("data-brand-part") }))))}`,
      );
      revealedGroup = await pending.elementHandle();
      scrollFrames = await revealedGroup.evaluate(async (node) => {
        const frames = [];
        node.scrollIntoView({ block: "center", behavior: "instant" });
        await new Promise((done) => {
          const started = performance.now();
          function frame() {
            frames.push({
              state: node.getAttribute("data-page-reveal-state"),
              opacity: Number(getComputedStyle(node).opacity),
            });
            if (performance.now() - started < 1300)
              requestAnimationFrame(frame);
            else done();
          }
          requestAnimationFrame(frame);
        });
        return frames;
      });
      assert.ok(
        scrollFrames.some(
          (frame) =>
            frame.state === "entering" &&
            frame.opacity > 0 &&
            frame.opacity < 0.98,
        ),
        "Scroll reveals visibly progress",
      );
      assert.equal(scrollFrames.at(-1).state, "complete");
    }
    const originals = {
      purchase: await purchase.elementHandle(),
      foil: await page.locator("[data-foil-trio]:visible").elementHandle(),
      material: await page.locator("[data-tea-material]").elementHandle(),
    };
    await purchase
      .getByRole("button", { name: "Increase quantity", exact: true })
      .click();
    assert.equal(
      (
        await purchase.getByLabel("Set quantity", { exact: true }).textContent()
      ).trim(),
      "2",
    );
    await page.getByRole("switch", { name: "Dark mode", exact: true }).click();
    await page
      .getByRole("button", { name: "Explore individual matcha", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Explore the sample set", exact: true })
      .click();
    assert.equal(
      (
        await purchase.getByLabel("Set quantity", { exact: true }).textContent()
      ).trim(),
      "2",
    );
    for (const [key, selector] of [
      ["purchase", "[data-sample-order-panel] [data-sample-purchase]"],
      ["foil", "[data-foil-trio]:visible"],
      ["material", "[data-tea-material]"],
    ])
      assert.equal(
        await page
          .locator(selector)
          .evaluate((node, original) => node === original, originals[key]),
        true,
        `${key} remains mounted`,
      );
    assert.equal(
      await page.evaluate(() => window.__homepageMotion.starts.length),
      initial.starts.length,
      "Theme and set/tea changes do not replay the opening entrance",
    );
    if (revealedGroup)
      assert.deepEqual(
        await revealedGroup.evaluate((node) => ({
          state: node.dataset.pageRevealState,
          animation: getComputedStyle(node).animationName,
          translate: getComputedStyle(node).translate,
        })),
        { state: "complete", animation: "none", translate: "none" },
        "A revealed group stays settled across theme and set/tea changes",
      );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({
      path: `${evidence}/${name}-selection.png`,
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    return {
      name,
      intermediateHeadingFrames: initial.frames.filter(
        (frame) => frame.opacity > 0 && frame.opacity < 0.98,
      ).length,
      intermediateVisualFrames: initial.frames.filter(
        (frame) => frame.visual > 0 && frame.visual < 0.98,
      ).length,
      scrollFrames,
    };
  } finally {
    await context.close();
  }
}

async function fallbackCase(browser, name) {
  for (const options of [
    { reducedMotion: "reduce" },
    { javaScriptEnabled: false },
  ]) {
    const { page, context, errors } = await setup(
      browser,
      390,
      "light",
      options,
    );
    try {
      await page.goto(baseURL);
      if (options.reducedMotion) await checkSettled(page);
      const heading = page.locator('h1[data-page-enter="hero"]');
      assert.deepEqual(
        await heading.evaluate((node) => ({
          opacity: getComputedStyle(node).opacity,
          translate: getComputedStyle(node).translate,
          animation: getComputedStyle(node).animationName,
        })),
        { opacity: "1", translate: "none", animation: "none" },
      );
      assert.equal(
        await page
          .locator('[data-brand-part="image-stage"]')
          .evaluate((node) => getComputedStyle(node).opacity),
        "1",
      );
      assert.equal(
        await page
          .getByRole("button", {
            name: "Explore matcha from the silver bag",
            exact: true,
          })
          .isVisible(),
        true,
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.screenshot({
        path: `${evidence}/${name}-${options.reducedMotion ? "reduced" : "no-js"}.png`,
        fullPage: true,
      });
      if (options.reducedMotion) {
        await page.goto(
          `${baseURL}/samples-mobile-study?layout=compact&tone=dark`,
        );
        assert.equal(
          await page.locator("[data-page-enter], [data-page-reveal]").count(),
          0,
          "Historical study keeps its previous motion",
        );
      }
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  }
  return {
    name,
    reducedMotion: "passed",
    noJavaScript: "passed",
    studyIsolation: "passed",
  };
}

await mkdir(evidence, { recursive: true });
const results = [];
for (const engine of ["chromium", "webkit"]) {
  if (engineFilter && engine !== engineFilter) continue;
  const browser = await playwright[engine].launch(
    engine === "chromium"
      ? { channel: "chrome", headless: true }
      : { headless: true },
  );
  try {
    for (const [width, tone] of [
      [390, "light"],
      [390, "dark"],
      [1440, "light"],
      [1440, "dark"],
    ]) {
      const name = `${engine}-${width}-${tone}`;
      if (filter && !name.includes(filter)) continue;
      results.push(await normalCase(browser, name, width, tone));
      console.log(`PASS ${name}`);
    }
    const name = `${engine}-fallbacks`;
    if (!filter || name.includes(filter)) {
      results.push(await fallbackCase(browser, name));
      console.log(`PASS ${name}`);
    }
  } finally {
    await browser.close();
  }
}
assert.ok(results.length, "At least one scenario matched");
await writeFile(
  `${evidence}/results${engineFilter ? `-${engineFilter}` : ""}.json`,
  `${JSON.stringify(results, null, 2)}\n`,
);
console.log(`${results.length} homepage reveal scenarios passed.`);
