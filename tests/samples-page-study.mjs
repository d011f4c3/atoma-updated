/* Sample page comparison: isolated catalog reads, no external traffic or writes. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { translate } from "../src/lib/i18n/index.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL =
  process.env.SAMPLES_PAGE_STUDY_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.SAMPLES_PAGE_STUDY_EVIDENCE ?? ".local/samples-0151/browser";
const filter = process.env.SAMPLES_PAGE_STUDY_FILTER;
const layouts = ["glance", "rows", "folio"];
const products = SAMPLE_SET_CONTENTS.map((item, index) => ({
  id: item.key,
  handle: item.productHandle,
  title: item.name,
  productCode: item.productCode,
  description: "Isolated sample-page study fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
      title: "1 kg",
      available: true,
      priceMinor: 6123,
      currency: "JPY",
      options: [{ name: "Size", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));

await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
let passed = 0;

async function eventually(check, message) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function setup(width, locale = "en", cookieTone = "light") {
  const context = await browser.newContext({
    viewport: { width, height: width < 500 ? 800 : 900 },
    reducedMotion: "reduce",
    hasTouch: width < 500,
    isMobile: width < 500,
  });
  await context.addCookies([
    { name: "atoma-theme", value: cookieTone, url: baseURL },
    { name: "atoma-locale", value: locale, url: baseURL },
  ]);
  const errors = [];
  let mode = "ready";
  let catalogReads = 0;
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      errors.push(`Unexpected external request or write: ${request.method()}`);
      return route.abort();
    }
    if (url.pathname === "/api/cart")
      return route.fulfill({ json: { kind: "empty", checkoutEnabled: false } });
    if (url.pathname === "/api/catalog") {
      catalogReads++;
      return mode === "failed"
        ? route.fulfill({
            status: 503,
            json: { status: "unavailable", products: [] },
          })
        : route.fulfill({
            json: {
              status: "ready",
              products,
              shopUrl: "https://example.invalid",
            },
          });
    }
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Unexpected API request: ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  return {
    context,
    page,
    errors,
    setMode: (next) => (mode = next),
    reads: () => catalogReads,
    cookieTone,
  };
}

async function fit(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "The page has no horizontal overflow",
  );
  assert.equal(
    await page
      .locator("[data-samples-page-study]")
      .evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    true,
    "The study fits its viewport",
  );
}

async function unavailable(page, locale = "en") {
  const study = page.locator("[data-samples-page-study]");
  await study.locator("[data-sample-unavailable]").waitFor();
  assert.equal(await study.locator("[data-sample-unavailable]").count(), 1);
  assert.equal(await study.locator("[data-sample-order]").count(), 0);
  assert.equal(await study.locator("#samples-purchase").count(), 1);
  const action = study.locator("[data-sample-unavailable] button");
  assert.equal(await action.count(), 1);
  assert.equal(await action.isDisabled(), true);
  assert.ok(
    (await study.innerText()).includes(
      translate(locale, "Ordering is not open yet."),
    ),
  );
  assert.doesNotMatch(
    await study.innerText(),
    /[¥￥$]|JPY|4,800|1,000|6,123/,
    "The study does not invent a set price or reuse an unrelated product price",
  );
}

async function unchangedCookie(context, cookieTone) {
  assert.equal(
    (await context.cookies()).find((item) => item.name === "atoma-theme")
      ?.value,
    cookieTone,
    "Study appearance does not change the canonical storefront preference",
  );
}

async function composition(fixture, width, tone, layout, locale = "en") {
  const { page, context, cookieTone } = fixture;
  const study = page.locator("[data-samples-page-study]");
  await eventually(
    async () => (await study.getAttribute("data-layout")) === layout,
    "The selected page layout renders",
  );
  assert.equal(await study.getAttribute("data-tone"), tone);
  assert.equal(await study.locator("[data-theme-switcher]").count(), 0);
  assert.equal(await study.getByRole("heading", { level: 1 }).count(), 1);
  assert.equal(await study.locator("[data-sample-content]").count(), 3);
  assert.ok((await study.textContent()).includes("3 × 20 g"));
  assert.ok(
    (await study.textContent()).includes(translate(locale, "60 g total")),
  );
  await unavailable(page, locale);
  const heading = study.getByRole("heading", { level: 1 });
  await heading.scrollIntoViewIfNeeded();
  assert.equal(await heading.isVisible(), true);
  assert.equal(
    await heading.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    true,
    "The title remains readable without clipping",
  );
  const headingSize = await heading.evaluate((node) =>
    parseFloat(getComputedStyle(node).fontSize),
  );
  assert.ok(headingSize >= 20, "The title remains readable");
  assert.ok(
    headingSize <= (width < 500 ? 25 : 31),
    "The title preserves the storefront type scale",
  );
  for (const item of SAMPLE_SET_CONTENTS) {
    const content = study.locator(`[data-sample-content="${item.key}"]`);
    for (const text of [
      translate(locale, item.name.replace(/ Matcha$/, "")),
      translate(locale, item.application),
      "20 g",
    ])
      assert.ok((await content.textContent()).includes(text), text);
    assert.equal(
      await content.evaluate(
        (node) => node.scrollWidth <= node.clientWidth + 1,
      ),
      true,
      `${item.key} content fits`,
    );
    const image = content.locator("img");
    assert.equal(await image.count(), 1);
    await image.scrollIntoViewIfNeeded();
    await eventually(
      () =>
        image.evaluate(
          (node) =>
            node.complete &&
            node.naturalWidth > 0 &&
            getComputedStyle(node).opacity === "1",
        ),
      `${item.key} material photograph loads and is visible`,
    );
    assert.equal(await image.isVisible(), true);
    assert.equal(
      await image.getAttribute("alt"),
      translate(locale, item.imageAlt),
    );
    const bounds = await image.boundingBox();
    assert.ok(bounds && bounds.width >= 60 && bounds.height >= 60);
  }
  await fit(page);
  await unchangedCookie(context, cookieTone);
  await page.screenshot({
    path: resolve(evidence, `${width}-${tone}-${layout}-${locale}.png`),
    fullPage: true,
    animations: "disabled",
  });
}

async function run(name, args, test) {
  if (filter && !name.includes(filter)) return;
  const fixture = await setup(...args);
  try {
    await test(fixture);
    assert.deepEqual(fixture.errors, []);
    passed++;
    console.log(`${name}: passed`);
  } catch (error) {
    await fixture.page.screenshot({
      path: resolve(evidence, `${name}-failure.png`),
      fullPage: true,
      animations: "disabled",
    });
    console.error(`Failed ${name}`);
    throw error;
  } finally {
    await fixture.context.close();
  }
}

try {
  for (const width of [1440, 768, 390, 320])
    await run(`${width}-matrix`, [width], async (fixture) => {
      const { page } = fixture;
      await page.goto(`${baseURL}/samples-page-study`);
      const layoutSelect = page.getByRole("combobox", {
        name: "Page layout",
        exact: true,
      });
      const appearance = page.getByRole("combobox", {
        name: "Study appearance",
        exact: true,
      });
      await layoutSelect.waitFor();
      const navigationCount = await page.evaluate(
        () => performance.getEntriesByType("navigation").length,
      );
      for (const tone of ["light", "dark"]) {
        await appearance.selectOption(tone);
        for (const layout of layouts) {
          await layoutSelect.selectOption(layout);
          await composition(fixture, width, tone, layout);
          if (layout !== "glance" || tone === "dark")
            assert.equal(
              new URL(page.url()).searchParams.get("layout"),
              layout,
            );
          assert.equal(
            await page.evaluate(
              () => performance.getEntriesByType("navigation").length,
            ),
            navigationCount,
            "Layout and appearance change in place",
          );
        }
      }
    });

  for (const locale of ["ja", "zh-Hans", "zh-Hant"])
    await run(`320-localized-${locale}`, [320, locale], async (fixture) => {
      const { page } = fixture;
      await page.goto(`${baseURL}/samples-page-study`);
      const layoutSelect = page.getByRole("combobox", {
        name: "Page layout",
        exact: true,
      });
      await layoutSelect.waitFor();
      const toolbarLanguage = await layoutSelect.evaluate((node) =>
        node.closest("[lang]")?.getAttribute("lang"),
      );
      assert.equal(
        toolbarLanguage,
        "en",
        "Study controls declare their language",
      );
      for (const layout of layouts) {
        await layoutSelect.selectOption(layout);
        await composition(fixture, 320, "light", layout, locale);
      }
    });

  await run("keyboard-and-theme", [390, "en", "dark"], async (fixture) => {
    const { page, context } = fixture;
    await page.goto(`${baseURL}/samples-page-study?layout=folio`);
    const study = page.locator("[data-samples-page-study]");
    await unavailable(page);
    assert.equal(await study.getAttribute("data-tone"), "dark");
    assert.equal(await study.getAttribute("data-layout"), "folio");
    const layout = page.getByRole("combobox", {
      name: "Page layout",
      exact: true,
    });
    await layout.focus();
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await eventually(
      async () => (await study.getAttribute("data-layout")) === "rows",
      "Page layout is keyboard operable",
    );
    assert.equal(
      await layout.evaluate((node) => node === document.activeElement),
      true,
      "Layout selection retains keyboard focus",
    );
    const appearance = page.getByRole("combobox", {
      name: "Study appearance",
      exact: true,
    });
    await appearance.focus();
    await page.keyboard.press("Home");
    await page.keyboard.press("Enter");
    await eventually(
      async () => (await study.getAttribute("data-tone")) === "light",
      "Study appearance is keyboard operable",
    );
    assert.equal(
      await appearance.evaluate((node) => node === document.activeElement),
      true,
    );
    await layout.selectOption("glance");
    assert.equal(await study.getAttribute("data-tone"), "light");
    await unchangedCookie(context, "dark");
    await unavailable(page);
    await fit(page);
  });

  await run("direct-routes", [320], async ({ page }) => {
    for (const layout of layouts) {
      await page.goto(`${baseURL}/samples-page-study?layout=${layout}`);
      await unavailable(page);
      assert.equal(
        await page
          .locator("[data-samples-page-study]")
          .getAttribute("data-layout"),
        layout,
      );
    }
    for (const query of [
      "",
      "?layout=unknown",
      "?layout=ROWS",
      "?layout=rows&layout=folio",
    ]) {
      await page.goto(`${baseURL}/samples-page-study${query}`);
      await unavailable(page);
      assert.equal(
        await page
          .locator("[data-samples-page-study]")
          .getAttribute("data-layout"),
        "glance",
        `Invalid or ambiguous query falls back safely: ${query}`,
      );
      await fit(page);
    }
  });

  await run("catalog-retry", [320], async (fixture) => {
    const { page } = fixture;
    fixture.setMode("failed");
    await page.goto(`${baseURL}/samples-page-study?layout=rows`);
    const retry = page.getByRole("button", { name: /Try again/ });
    await retry.waitFor();
    await retry.focus();
    const reads = fixture.reads();
    fixture.setMode("ready");
    await page.keyboard.press("Enter");
    await unavailable(page);
    assert.ok(fixture.reads() > reads, "Retry requests a fresh catalog");
    assert.equal(
      await page
        .locator("#samples-purchase")
        .evaluate((node) => node === document.activeElement),
      true,
      "Retry preserves focus at the purchase heading",
    );
    assert.equal(
      await page
        .locator("[data-samples-page-study]")
        .getAttribute("data-layout"),
      "rows",
    );
    await fit(page);
  });
} finally {
  await browser.close();
}
console.log(`${passed} sample-page study scenarios passed; all writes blocked`);
