/* Fresh-homepage hero readiness. Every commerce request is mocked; no live writes. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.HERO_LOADING_BASE_URL ?? "http://127.0.0.1:3100";
const screenshots = process.env.HERO_LOADING_SCREENSHOTS;
const products = [
  {
    id: "culinary",
    title: "Japanese Culinary Matcha Powder for Cafés & Baking — 1 kg",
    handle: "jmm-storefront-test-matcha",
    letter: "a",
  },
  {
    id: "barista",
    title: "Japanese Barista Matcha Powder for Lattes — 1 kg",
    handle: "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
    letter: "b",
  },
].map(({ letter, ...product }) => ({
  ...product,
  description: "An isolated browser fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${letter.repeat(43)}`,
      title: "1 kg",
      available: true,
      priceMinor: 1200,
      currency: "JPY",
      options: [{ name: "Format", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));

function gate() {
  let release;
  const promise = new Promise((done) => {
    release = done;
  });
  return { promise, release };
}

async function setup(browser, options = {}) {
  const {
    imageGate,
    failImage = false,
    failFonts = false,
    dark = false,
    ...contextOptions
  } = options;
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
    colorScheme: "dark",
    ...contextOptions,
  });
  if (dark)
    await context.addCookies([
      { name: "atoma-theme", value: "dark", url: baseURL },
    ]);
  const state = {
    errors: [],
    imageRequests: 0,
    fontRequests: 0,
    catalogReads: 0,
  };
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    try {
      assert.ok(
        ["GET", "HEAD"].includes(request.method()),
        `Unexpected write: ${request.method()} ${url.pathname}`,
      );
      if (url.pathname.startsWith("/api/")) {
        assert.equal(url.origin, new URL(baseURL).origin);
        if (url.pathname === "/api/catalog") {
          state.catalogReads++;
          return route.fulfill({
            contentType: "application/json",
            json: {
              status: "ready",
              products,
              shopUrl: "https://example.invalid",
            },
          });
        }
        if (url.pathname === "/api/cart")
          return route.fulfill({
            contentType: "application/json",
            json: { kind: "empty", checkoutEnabled: false },
          });
        assert.fail(`Unexpected API request: ${url.pathname}`);
      }
      const asset = url.searchParams.get("url") ?? url.pathname;
      if (asset.endsWith("/product-exploration/silver-bag-hero-v3.png")) {
        state.imageRequests++;
        if (imageGate) await imageGate.promise;
        if (failImage) return route.abort("failed");
      }
      if (/\.(woff2?|otf|ttf)$/.test(url.pathname)) {
        state.fontRequests++;
        if (failFonts) return route.abort("failed");
      }
      return route.continue();
    } catch (error) {
      state.errors.push(error.message);
      return route.abort("blockedbyclient");
    }
  });
  await context.addInitScript(() => {
    window.__heroLoadingProgress = [];
    window.__heroLoadingTiming = { hydrated: null, released: null };
    const observe = () => {
      const progress = document.querySelector(
        "[data-hero-loader][role='progressbar']",
      );
      const timing = window.__heroLoadingTiming;
      if (
        progress &&
        document.querySelector("main[inert]") &&
        timing.hydrated === null
      )
        timing.hydrated = performance.now();
      if (!progress && timing.hydrated !== null && timing.released === null)
        timing.released = performance.now();
      if (!progress) return;
      const value = Number(progress.getAttribute("aria-valuenow"));
      const previous = window.__heroLoadingProgress.at(-1);
      if (Number.isFinite(value) && previous !== value)
        window.__heroLoadingProgress.push(value);
    };
    new MutationObserver(observe).observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-valuenow", "inert"],
    });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.setDefaultNavigationTimeout(30_000);
  page.on("pageerror", (error) => state.errors.push(error.message));
  return { context, page, state };
}

async function eventually(check, message, timeout = 12_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function capture(page, name) {
  if (!screenshots) return;
  await mkdir(screenshots, { recursive: true });
  await page.screenshot({
    path: resolve(screenshots, `${name}.png`),
    fullPage: true,
    animations: (await page.locator("[data-hero-loader]").count())
      ? "allow"
      : "disabled",
  });
}

async function noOverflow(page) {
  assert.equal(
    await page.evaluate(
      () =>
        Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
        ) <=
        innerWidth + 1,
    ),
    true,
    "The loader and released homepage fit the viewport",
  );
}

const cases = [];

const loader = (page) =>
  page.getByRole("progressbar", { name: "Loading ATOMA", exact: true });

async function released(page) {
  await page.locator("[data-hero-loader]").waitFor({ state: "detached" });
  assert.equal(
    await page.locator("main").evaluate((main) => main.inert),
    false,
  );
  assert.equal(await page.locator("main").getAttribute("aria-hidden"), null);
  await noOverflow(page);
}

async function assertProgress(page, completed) {
  const values = await page.evaluate(() => window.__heroLoadingProgress);
  assert.ok(values.length > 0, "The loader exposes its progress accessibly");
  assert.ok(values.every((value) => value >= 0 && value <= 100));
  assert.ok(
    values.every((value, index) => !index || value >= values[index - 1]),
    `Progress does not move backwards: ${values.join(", ")}`,
  );
  assert.equal(values.includes(100), completed);
}

cases.push([
  "slow hero waits below 100, then reveals the usable light homepage",
  async (browser) => {
    const imageGate = gate();
    const { context, page, state } = await setup(browser, { imageGate });
    try {
      await page.goto(baseURL, { waitUntil: "domcontentloaded" });
      await loader(page).waitFor();
      await page.locator("main[inert]").waitFor({ state: "attached" });
      assert.equal(
        await page.locator("main").getAttribute("data-storefront-theme"),
        "light",
        "Fresh visits default to Mist even with a dark system preference",
      );
      await eventually(
        async () =>
          state.imageRequests > 0 &&
          Number(await loader(page).getAttribute("aria-valuenow")) > 0,
        "The actual hero image is gated while progress advances",
      );
      const first = Number(await loader(page).getAttribute("aria-valuenow"));
      await page.waitForTimeout(1_250);
      const pending = Number(await loader(page).getAttribute("aria-valuenow"));
      assert.ok(pending >= first && pending < 100);
      assert.equal(await loader(page).getAttribute("data-state"), "loading");
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() =>
          Boolean(document.activeElement?.closest("main[inert]")),
        ),
        false,
        "Keyboard focus cannot enter obscured controls",
      );
      await noOverflow(page);
      await capture(page, "light-loading");
      imageGate.release();
      await released(page);
      await assertProgress(page, true);
      await page
        .locator('[data-silver-bag][data-appearance="hero"][data-ready="true"]')
        .first()
        .waitFor();
      await capture(page, "light-ready");
      await page
        .getByRole("button", {
          name: "Explore matcha from the silver bag",
          exact: true,
        })
        .click();
      await page.locator('main[data-handoff="complete"]').waitFor();
      await page
        .getByRole("button", { name: "Select Barista Matcha", exact: true })
        .click();
      assert.equal(
        await page.locator("[data-hero-loader]").count(),
        0,
        "In-place product exploration does not restart the loader",
      );
      assert.deepEqual(state.errors, []);
    } finally {
      imageGate.release();
      await context.close();
    }
  },
]);

cases.push([
  "fresh homepage loads briefly show progress despite a legacy session marker",
  async (browser) => {
    const { context, page, state } = await setup(browser);
    try {
      await context.addCookies([
        { name: "atoma-hero-seen", value: "1", url: baseURL },
      ]);
      const first = await page.goto(baseURL, {
        waitUntil: "domcontentloaded",
      });
      assert.match(
        await first.text(),
        /<[^>]+data-hero-loader/,
        "An old session marker does not suppress the new entrance",
      );
      await loader(page).waitFor();
      await released(page);
      await assertProgress(page, true);
      await page
        .getByRole("switch", { name: "Dark mode", exact: true })
        .click();
      assert.equal(
        await page.locator("[data-hero-loader]").count(),
        0,
        "An in-place theme switch does not restart the loader",
      );
      for (const visit of [
        () => page.reload({ waitUntil: "domcontentloaded" }),
        async () => {
          await page.goto(`${baseURL}/shop`, { waitUntil: "domcontentloaded" });
          return page.goto(baseURL, { waitUntil: "domcontentloaded" });
        },
      ]) {
        const response = await visit();
        assert.match(
          await response.text(),
          /<[^>]+data-hero-loader/,
          "Every fresh homepage response includes the loading overlay",
        );
        await loader(page).waitFor();
        await released(page);
        await page.locator('main[data-storefront-theme="dark"]').waitFor();
        await assertProgress(page, true);
        const timing = await page.evaluate(() => window.__heroLoadingTiming);
        assert.ok(timing.hydrated !== null && timing.released !== null);
        const duration = timing.released - timing.hydrated;
        assert.ok(
          duration > 350 && duration < 2_000,
          `A warmed hero gets a brief visible entrance after hydration (${Math.round(duration)}ms)`,
        );
      }
      assert.deepEqual(state.errors, []);
    } finally {
      await context.close();
    }
    const imageGate = gate();
    const fresh = await setup(browser, { imageGate });
    try {
      await fresh.page.goto(baseURL, { waitUntil: "domcontentloaded" });
      await loader(fresh.page).waitFor();
      assert.equal(
        await fresh.page.locator("main").getAttribute("data-storefront-theme"),
        "light",
      );
      imageGate.release();
      await released(fresh.page);
      assert.deepEqual(fresh.state.errors, []);
    } finally {
      imageGate.release();
      await fresh.context.close();
    }
  },
]);

cases.push([
  "320px dark entry respects reduced motion and saved appearance",
  async (browser) => {
    const imageGate = gate();
    const { context, page, state } = await setup(browser, {
      imageGate,
      dark: true,
      viewport: { width: 320, height: 700 },
      reducedMotion: "reduce",
    });
    try {
      await page.goto(baseURL, { waitUntil: "domcontentloaded" });
      await loader(page).waitFor();
      await page.locator("main[inert]").waitFor({ state: "attached" });
      assert.equal(
        await page.locator("main").getAttribute("data-storefront-theme"),
        "dark",
      );
      assert.equal(
        await loader(page).evaluate((element) =>
          element.getAnimations({ subtree: true }).some((animation) => {
            const timing = animation.effect?.getTiming();
            return (
              timing && (timing.duration > 0 || timing.iterations === Infinity)
            );
          }),
        ),
        false,
        "Reduced motion removes loader sweeps and transition movement",
      );
      await noOverflow(page);
      await capture(page, "mobile-dark-loading");
      const started = Date.now();
      imageGate.release();
      await released(page);
      assert.ok(
        Date.now() - started < 2_000,
        "No decorative minimum delays reduced motion",
      );
      await assertProgress(page, true);
      await capture(page, "mobile-dark-ready");
      assert.equal(
        await page
          .getByRole("switch", { name: "Dark mode", exact: true })
          .getAttribute("aria-checked"),
        "true",
      );
      const response = await page.reload({ waitUntil: "domcontentloaded" });
      assert.match(await response.text(), /<[^>]+data-hero-loader/);
      await released(page);
      await assertProgress(page, true);
      await page.locator('main[data-storefront-theme="dark"]').waitFor();
      assert.deepEqual(state.errors, []);
    } finally {
      imageGate.release();
      await context.close();
    }
  },
]);

cases.push([
  "failed photograph and fonts reveal existing fallbacks without a permanent block",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      failImage: true,
      failFonts: true,
    });
    try {
      await page.goto(baseURL, { waitUntil: "domcontentloaded" });
      await loader(page).waitFor();
      await released(page);
      assert.ok(state.imageRequests > 0 && state.fontRequests > 0);
      await assertProgress(page, true);
      await page
        .locator(
          '[data-silver-bag][data-appearance="hero"][data-image-failed="true"][data-ready="true"]',
        )
        .first()
        .waitFor();
      await capture(page, "fallback-ready");
      await page
        .getByRole("switch", { name: "Dark mode", exact: true })
        .click();
      await page.locator('main[data-storefront-theme="dark"]').waitFor();
      assert.deepEqual(state.errors, []);
    } finally {
      await context.close();
    }
  },
]);

cases.push([
  "stalled photograph fails open without claiming 100 percent readiness",
  async (browser) => {
    const imageGate = gate();
    const { context, page, state } = await setup(browser, { imageGate });
    try {
      await page.goto(baseURL, { waitUntil: "domcontentloaded" });
      await loader(page).waitFor();
      await eventually(
        () => state.imageRequests > 0,
        "Hero photograph is stalled",
      );
      await released(page);
      await assertProgress(page, false);
      await page
        .getByRole("switch", { name: "Dark mode", exact: true })
        .click();
      await page.locator('main[data-storefront-theme="dark"]').waitFor();
      imageGate.release();
      await page
        .locator('[data-silver-bag][data-appearance="hero"][data-ready="true"]')
        .first()
        .waitFor();
      assert.equal(await page.locator("[data-hero-loader]").count(), 0);
      assert.equal(
        await page.locator("main").evaluate((main) => main.inert),
        false,
      );
      assert.deepEqual(state.errors, []);
    } finally {
      imageGate.release();
      await context.close();
    }
  },
]);

cases.push([
  "product deep links and saved studies bypass the entrance without resetting state",
  async (browser) => {
    const { context, page, state } = await setup(browser);
    try {
      const response = await page.goto(
        `${baseURL}/?matcha=${products[1].handle}`,
        {
          waitUntil: "domcontentloaded",
        },
      );
      assert.doesNotMatch(await response.text(), /<[^>]+data-hero-loader/);
      assert.equal(await page.locator("[data-hero-loader]").count(), 0);
      const selected = page.getByRole("button", {
        name: "Select Barista Matcha",
        exact: true,
      });
      await eventually(
        async () => (await selected.getAttribute("aria-pressed")) === "true",
        "The direct link selects Barista",
      );
      await page.getByRole("button", { name: "Shop", exact: true }).click();
      await page
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await page
        .getByRole("switch", { name: "Dark mode", exact: true })
        .click();
      assert.equal(await selected.getAttribute("aria-pressed"), "true");
      assert.equal(
        Number(
          await page.getByLabel("Quantity", { exact: true }).textContent(),
        ),
        2,
      );
      assert.equal(
        new URL(page.url()).searchParams.get("matcha"),
        products[1].handle,
      );
      for (const path of [
        "/color-study?palette=blue-hour",
        "/origins-study",
        "/concept-03",
      ]) {
        const study = await page.goto(`${baseURL}${path}`, {
          waitUntil: "domcontentloaded",
        });
        assert.doesNotMatch(await study.text(), /<[^>]+data-hero-loader/);
        assert.equal(await page.locator("[data-hero-loader]").count(), 0);
      }
      assert.deepEqual(state.errors, []);
    } finally {
      await context.close();
    }
  },
]);

cases.push([
  "no-JavaScript first visit leaves the homepage visible",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      javaScriptEnabled: false,
    });
    try {
      await page.goto(baseURL, { waitUntil: "domcontentloaded" });
      await page.locator("[data-hero-loader]").waitFor({ state: "hidden" });
      assert.equal(await page.locator("main").getAttribute("inert"), null);
      assert.equal(
        await page.locator("main").getAttribute("aria-busy"),
        "false",
      );
      await page.getByRole("heading", { level: 1 }).waitFor();
      await capture(page, "no-javascript");
      assert.deepEqual(state.errors, []);
    } finally {
      await context.close();
    }
  },
]);

const selected = cases.filter(
  ([name]) =>
    !process.env.HERO_LOADING_FILTER ||
    new RegExp(process.env.HERO_LOADING_FILTER).test(name),
);
assert.ok(selected.length, "HERO_LOADING_FILTER must select a case");
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
  headless: true,
});
let failed = 0;
try {
  for (const [name, run] of selected) {
    try {
      await run(browser);
      console.log(`PASS ${name}`);
    } catch (error) {
      failed++;
      console.error(`FAIL ${name}\n${error.stack}`);
    }
  }
} finally {
  await browser.close();
}
console.log(
  `${selected.length - failed}/${selected.length} Hero loading checks passed`,
);
if (failed) process.exitCode = 1;
