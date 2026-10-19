/* Bounded Samples scroll-layout checks. Local catalog/cart fixtures only;
 * external traffic and every write are blocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { getProductContent } from "../src/lib/product-content.ts";
import { translate } from "../src/lib/i18n/index.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.SAMPLES_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.SAMPLES_SCROLL_EVIDENCE ?? ".local/samples-scroll-0164/browser";
const filter = process.env.SAMPLES_SCROLL_FILTER;
const heroOnly = process.env.SAMPLES_SCROLL_HERO_ONLY === "1";
const browser = await chromium.launch({ channel: "chrome", headless: true });
await mkdir(evidence, { recursive: true });
let activePage;
let activeName;

async function eventually(check, message) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function setup({
  width,
  tone,
  locale = "en",
  reduced = false,
  javascript = true,
  retry = false,
}) {
  const context = await browser.newContext({
    viewport: { width, height: width < 500 ? 844 : 900 },
    hasTouch: width < 500,
    isMobile: width < 500,
    reducedMotion: reduced ? "reduce" : "no-preference",
    javaScriptEnabled: javascript,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: locale, url: baseURL },
  ]);
  const errors = [];
  let failed = retry;
  let reads = 0;
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      errors.push("Unexpected external request or write");
      return route.abort();
    }
    if (url.pathname === "/api/cart")
      return route.fulfill({ json: { kind: "empty", checkoutEnabled: false } });
    if (url.pathname === "/api/catalog") {
      reads++;
      return route.fulfill({
        status: failed ? 503 : 200,
        json: {
          status: failed ? "unavailable" : "ready",
          products: [],
          shopUrl: "https://example.invalid",
        },
      });
    }
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Unexpected API ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on("pageerror", (error) => errors.push(error.message));
  activePage = page;
  await page.goto(`${baseURL}/samples`);
  await page.locator("[data-samples-page]").waitFor();
  await page.evaluate(() => document.fonts.ready);
  if (retry) {
    const control = page.getByRole("button", {
      name: translate(locale, "Try again"),
      exact: false,
    });
    await control.waitFor();
    const before = reads;
    failed = false;
    await control.focus();
    await page.keyboard.press("Enter");
    await page.locator("[data-sample-unavailable]").waitFor();
    assert.ok(reads > before, "Retry fetches a fresh catalog");
    await eventually(
      () =>
        page
          .locator("#samples-purchase")
          .evaluate((node) => node === document.activeElement),
      "Retry returns keyboard focus to the purchase heading",
    );
  }
  return { context, page, errors };
}

async function scroll(page, top) {
  await page.evaluate(
    (value) => scrollTo({ top: value, behavior: "instant" }),
    Math.max(0, top),
  );
  await scrollSettled(page);
}

async function scrollSettled(page) {
  let previous = await page.evaluate(() => scrollY),
    steady = 0;
  await eventually(async () => {
    const current = await page.evaluate(() => scrollY);
    steady = Math.abs(previous - current) < 1 ? steady + 1 : 0;
    previous = current;
    return steady >= 4;
  }, "Native page scroll settles");
}
const topOf = (locator) =>
  locator.evaluate((node) => node.getBoundingClientRect().top + scrollY);

async function fit(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "Samples has no horizontal document overflow",
  );
  assert.equal(
    await page
      .locator("[data-samples-range-viewport]")
      .evaluate((node) => node.scrollLeft),
    0,
    "The range viewport does not accumulate horizontal scrolling",
  );
}

async function images(scope, masked = true) {
  for (const image of await scope.locator("img").all()) {
    assert.equal(
      await image.isVisible(),
      true,
      "The material has a visible reserved frame",
    );
    await eventually(
      () =>
        image.evaluate(
          (node) =>
            node.complete &&
            node.naturalWidth > 0 &&
            getComputedStyle(node).opacity === "1",
        ),
      "Material image loads and becomes visible",
    );
    if (masked)
      assert.equal(
        await image.evaluate(
          (node) => node.closest('[data-masked="true"]') !== null,
        ),
        true,
        "The prepared powder mask remains active",
      );
  }
}

async function content(page, locale, javascript) {
  const root = page.locator("[data-samples-page]");
  assert.equal(
    await root.locator("h1").innerText(),
    translate(locale, "Sample Set"),
  );
  assert.equal(await page.locator("html").getAttribute("lang"), locale);
  assert.ok((await root.textContent()).includes("3 × 20 g"));
  assert.ok(
    (await root.textContent()).includes(translate(locale, "60 g total")),
  );
  assert.equal(await root.locator("[data-sample-purchase]").count(), 1);
  assert.equal(
    await root.locator("[data-sample-order]").count(),
    0,
    "An unconfigured offer cannot expose an order",
  );
  assert.doesNotMatch(
    await root.innerText(),
    /¥|￥|JPY|\$\d/,
    "No invented set price is shown",
  );
  if (javascript) await root.locator("[data-sample-unavailable]").waitFor();
  else
    assert.ok(
      (await root.innerText()).includes(
        translate(locale, "Enable JavaScript to check availability and order."),
      ),
    );
  for (const item of SAMPLE_SET_CONTENTS) {
    const row = root.locator(`[data-sample-content="${item.key}"]`);
    const guidance = getProductContent(
      { title: item.name, handle: item.productHandle, description: "" },
      locale,
    );
    for (const source of [
      translate(locale, item.name),
      translate(locale, item.application),
      `${item.grams} g`,
      item.productCode,
      guidance.selectionNote,
    ])
      assert.ok(
        (await row.textContent()).includes(source),
        `${item.key} keeps its confirmed facts and localized guidance`,
      );
    assert.equal(
      await root
        .locator(`[data-sample-range-link="${item.key}"]`)
        .getAttribute("href"),
      `#sample-${item.key}`,
    );
  }
  await fit(page);
}

async function capture(page, name) {
  await fit(page);
  await page.screenshot({
    path: resolve(evidence, `${activeName}-${name}.png`),
    animations: "disabled",
  });
}

async function smoke(page, desktop, locale) {
  const root = page.locator("[data-samples-page]");
  await eventually(
    async () =>
      (await root.locator("main").getAttribute("data-samples-motion")) ===
      (desktop ? "ready" : "static"),
    "The viewport selects the right scroll presentation",
  );
  await content(page, locale, true);
  await scroll(page, 0);
  const gallery = root.locator("[data-sample-gallery]");
  const mounted = await gallery
    .locator("[data-sample-material]")
    .elementHandles();
  assert.equal(mounted.length, 3);
  assert.equal(await gallery.getAttribute("data-preview"), "all");
  assert.equal(await gallery.locator("button").count(), 0);
  await images(gallery);
  const purchase = root.locator("[data-sample-purchase]");
  const details = purchase.locator("details");
  const summary = details.locator("summary");
  const availability = purchase.getByText(
    translate(locale, "Ordering is not open yet."),
    { exact: true },
  );
  const contentsLink = purchase.locator('a[href="#samples-contents"]');
  assert.equal(await details.getAttribute("open"), null);
  assert.equal(await details.locator("p").isVisible(), false);
  assert.equal(await availability.isVisible(), true);
  assert.equal(await contentsLink.isVisible(), true);
  assert.equal(
    (await summary.innerText()).trim(),
    translate(locale, "Ordering information"),
  );
  await summary.focus();
  await page.keyboard.press("Enter");
  assert.notEqual(await details.getAttribute("open"), null);
  assert.equal(await details.locator("p").isVisible(), true);
  assert.equal(await availability.isVisible(), true);
  assert.equal(await contentsLink.isVisible(), true);
  await fit(page);
  await page.keyboard.press("Space");
  assert.equal(await details.getAttribute("open"), null);
  assert.equal(await details.locator("p").isVisible(), false);
  assert.equal(await gallery.getAttribute("data-preview"), "all");
  for (const [index, node] of mounted.entries())
    assert.equal(
      await gallery
        .locator("[data-sample-material]")
        .nth(index)
        .evaluate((element, original) => element === original, node),
      true,
      "Opening ordering information keeps every material mounted",
    );
  await scroll(page, 0);
  await root.locator("h1").click();
  await page.mouse.move(1, 1);
  await eventually(
    () =>
      page
        .locator("header [data-scramble-glyph]")
        .evaluateAll((glyphs) =>
          glyphs.every(
            (glyph) =>
              glyph.textContent === glyph.previousElementSibling?.textContent,
          ),
        ),
    "Header text settles before the opening capture",
  );
  if (desktop) {
    const purchase = await root.locator("#samples-order").boundingBox();
    assert.ok(
      purchase.y >= 0 &&
        purchase.y + purchase.height <= page.viewportSize().height + 1,
      "The actual purchase surface is visible in the desktop opening",
    );
  }
  await capture(page, "opening");
  if (heroOnly) return;
  const range = root.locator("[data-samples-range]");
  const track = range.locator("[data-samples-range-track]");
  const start = await topOf(range);
  const distance = await range.evaluate(
    (node) => node.getBoundingClientRect().height - innerHeight,
  );
  if (desktop) {
    await scroll(page, start);
    const initial = await track.evaluate(
      (node) => getComputedStyle(node).transform,
    );
    await scroll(page, start + distance * 0.5);
    assert.notEqual(
      await track.evaluate((node) => getComputedStyle(node).transform),
      initial,
      "Native vertical scroll advances the three material panels",
    );
    assert.ok(
      await range.evaluate(
        (node) =>
          Number.parseFloat(
            node.style.getPropertyValue("--sample-range-offset"),
          ) > 0,
      ),
    );
    await images(range);
    await capture(page, "range-mid");
  } else
    assert.equal(
      await track.evaluate((node) => getComputedStyle(node).transform),
      "none",
    );
  for (const item of SAMPLE_SET_CONTENTS) {
    const link = range.locator(`[data-sample-range-link="${item.key}"]`);
    if (desktop) {
      await link.focus();
      await page.keyboard.press("Enter");
    } else await link.tap();
    const row = range.locator(`[data-sample-content="${item.key}"]`);
    await eventually(
      () =>
        row.evaluate((node) => {
          const box = node.getBoundingClientRect();
          return (
            box.left >= -1 &&
            box.right <= innerWidth + 1 &&
            box.top < innerHeight &&
            box.bottom > 0
          );
        }),
      `${item.key} is visible after its range shortcut`,
    );
    if (!desktop)
      await eventually(
        () =>
          row.evaluate((node) => {
            const box = node.getBoundingClientRect();
            return box.top >= -1 && box.top < 100;
          }),
        `${item.key} reaches its native anchor position`,
      );
    await scrollSettled(page);
    if (desktop) {
      await eventually(
        () =>
          row.locator("h3").evaluate((node) => node === document.activeElement),
        "The shortcut focuses the corresponding heading",
      );
      assert.equal(await link.getAttribute("aria-current"), "step");
    } else assert.equal(new URL(page.url()).hash, `#sample-${item.key}`);
    await images(row);
    if (!desktop && item.key === "barista") await capture(page, "range-mid");
    await fit(page);
  }
  const returnLink = root.locator('a[href="#samples-order"]');
  await returnLink.scrollIntoViewIfNeeded();
  await returnLink.click();
  await eventually(
    () =>
      root.locator("#samples-order").evaluate((node) => {
        const box = node.getBoundingClientRect();
        return box.top >= -1 && box.top < innerHeight;
      }),
    "The final Order link returns to the purchase surface",
  );
  assert.equal(new URL(page.url()).hash, "#samples-order");
  assert.equal(
    await gallery.getAttribute("data-preview"),
    "all",
    "All three included materials remain visible throughout the journey",
  );
  for (const [index, node] of mounted.entries())
    assert.equal(
      await gallery
        .locator("[data-sample-material]")
        .nth(index)
        .evaluate((element, original) => element === original, node),
      true,
      "Material scenes remain mounted",
    );
  await content(page, locale, true);
}

async function fallback(page, javascript) {
  await content(page, "en", javascript);
  const root = page.locator("[data-samples-page]");
  if (javascript)
    await eventually(
      async () =>
        (await root.locator("main").getAttribute("data-samples-motion")) ===
        "static",
      "Reduced motion uses normal flow",
    );
  assert.notEqual(
    await root
      .locator("[data-samples-cover] > section")
      .evaluate((node) => getComputedStyle(node).position),
    "sticky",
  );
  const range = root.locator("[data-samples-range]");
  assert.notEqual(
    await range
      .locator("[data-samples-range-sticky]")
      .evaluate((node) => getComputedStyle(node).position),
    "sticky",
  );
  assert.equal(
    await range
      .locator("[data-samples-range-track]")
      .evaluate((node) => getComputedStyle(node).transform),
    "none",
  );
  let bottom = 0;
  for (const row of await range.locator("[data-sample-content]").all()) {
    const box = await row.evaluate((node) => {
      const box = node.getBoundingClientRect();
      return { top: box.top + scrollY, bottom: box.bottom + scrollY };
    });
    assert.ok(
      box.top >= bottom,
      "All three samples remain in natural reading order",
    );
    bottom = box.bottom;
    await scroll(page, box.top);
    await images(row, javascript);
  }
  await fit(page);
}

try {
  const cases = heroOnly
    ? [
        { name: "1440-light-hero", width: 1440, tone: "light" },
        { name: "390-dark-hero", width: 390, tone: "dark" },
      ]
    : [
        { name: "1440-light-motion", width: 1440, tone: "light" },
        {
          name: "390-dark-ja-motion",
          width: 390,
          tone: "dark",
          locale: "ja",
          retry: true,
        },
        { name: "1440-reduced", width: 1440, tone: "light", reduced: true },
        { name: "1440-no-js", width: 1440, tone: "light", javascript: false },
      ];
  for (const spec of cases) {
    if (filter && !spec.name.includes(filter)) continue;
    activeName = spec.name;
    const fixture = await setup(spec);
    if (spec.reduced || spec.javascript === false)
      await fallback(fixture.page, spec.javascript !== false);
    else await smoke(fixture.page, spec.width >= 900, spec.locale ?? "en");
    assert.deepEqual(
      fixture.errors,
      [],
      "No page errors, external traffic or writes",
    );
    await fixture.context.close();
    console.log(`${spec.name}: passed`);
  }
} catch (error) {
  if (activePage && !activePage.isClosed())
    await activePage.screenshot({
      path: resolve(evidence, `${activeName}-failure.png`),
      animations: "disabled",
    });
  throw error;
} finally {
  await browser.close();
}
