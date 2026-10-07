/* Observe real ScrambleText mutations; preserve native timing and reduced motion.
 * All commerce is mocked and writes are rejected. */
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
  process.env.LOCALIZED_GLITCH_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.LOCALIZED_GLITCH_EVIDENCE ?? ".local/localized-text-glitch";
const locales = ["en", "zh-Hans", "zh-Hant", "ja"];
const widths = process.env.LOCALIZED_GLITCH_WIDTHS?.split(",").map(Number) ?? [
  1366, 320,
];
assert.ok(
  widths.length && widths.every((width) => [1366, 320].includes(width)),
);
const products = [
  ["culinary", "jmm-storefront-test-matcha", "Culinary Matcha", "UJI-01"],
  [
    "barista",
    "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
    "Barista Matcha",
    "UJI-00",
  ],
  [
    "ceremonial",
    "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
    "Ceremonial Matcha",
    "WZKA-00",
  ],
].map(([id, handle, title, productCode], index) => ({
  id,
  handle,
  title,
  productCode,
  description: "Isolated glyph animation fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
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

async function eventually(check, message, timeout = 12000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 30));
  }
  assert.fail(message);
}
async function setup(browser, width) {
  const context = await browser.newContext({
    viewport: { width, height: width === 320 ? 740 : 900 },
    hasTouch: width === 320,
    isMobile: width === 320,
    reducedMotion: "no-preference",
  });
  const errors = [];
  const writes = [];
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!["GET", "HEAD"].includes(request.method())) {
      writes.push(`${request.method()} ${url.pathname}`);
      return route.abort("blockedbyclient");
    }
    if (url.pathname === "/api/catalog")
      return route.fulfill({
        contentType: "application/json",
        json: { status: "ready", products, shopUrl: "https://example.invalid" },
      });
    if (url.pathname === "/api/cart")
      return route.fulfill({
        contentType: "application/json",
        json: { kind: "empty", checkoutEnabled: false },
      });
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Unexpected API request ${url.pathname}`);
      return route.abort("blockedbyclient");
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(30000);
  page.on("pageerror", (error) => {
    errors.push({
      message: error.message,
      stack: error.stack,
      url: page.url(),
      stage: page.__glitchStage,
    });
    console.error(
      `PAGE ERROR ${width} ${page.__glitchStage} ${page.url()}\n${error.stack}`,
    );
  });
  return { context, page, errors, writes };
}
async function chooseLocale(page, locale) {
  const menu = page
    .locator('[data-brand-part="header"] [data-navigation-index]')
    .first();
  const summary = menu.locator("[data-nav-summary]");
  if (
    (await summary.isVisible()) &&
    !(await menu.evaluate((element) => element.open))
  )
    await summary.click();
  const control = page.locator("[data-language-switcher]:visible").first();
  await eventually(
    () =>
      control.evaluate(
        (element) =>
          !element
            .closest("[data-appearance-controls]")
            .querySelector("[data-theme-switcher]").disabled,
      ),
    "Language control hydrates",
  );
  await control.selectOption(locale);
  await eventually(
    async () => (await page.locator("html").getAttribute("lang")) === locale,
    `Language switches to ${locale}`,
  );
  if (await summary.isVisible()) await page.keyboard.press("Escape");
}
async function capture(page, label) {
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: resolve(evidence, `${label}.png`) });
}

// The scope is a stable control or paragraph; periodic hero keys may replace
// its ScrambleText child. Observe both replacements and the actual glyphs.
async function observe(scope) {
  return scope.evaluate((element) => {
    const roots = () =>
      Array.from(element.querySelectorAll('span[class*="accessible"]')).map(
        (accessible) => accessible.parentElement,
      );
    const describe = () =>
      roots().map((node) => ({
        source: node.firstElementChild?.textContent ?? "",
        glyphs: Array.from(node.querySelectorAll("[data-scramble-glyph]")).map(
          (glyph) => glyph.textContent,
        ),
        geometry: Array.from(node.getClientRects()).map((rect) => [
          rect.width,
          rect.height,
        ]),
      }));
    const current = describe();
    const initial = current.map((item, index) => ({
      ...item,
      glyphs: Array.from(
        roots()[index].querySelectorAll("[data-scramble-glyph]"),
      ).map((glyph) => glyph.previousElementSibling?.textContent ?? ""),
    }));
    const initialRect = element.getBoundingClientRect();
    const label = element.getAttribute("aria-label");
    const record = {
      initial,
      changes: [],
      geometryStable: true,
      accessibleStable: true,
      current,
      observer: null,
    };
    const update = () => {
      const current = describe();
      const rect = element.getBoundingClientRect();
      record.current = current;
      record.geometryStable &&=
        Math.abs(rect.width - initialRect.width) < 0.05 &&
        Math.abs(rect.height - initialRect.height) < 0.05;
      record.accessibleStable &&=
        element.getAttribute("aria-label") === label &&
        JSON.stringify(current.map((item) => item.source)) ===
          JSON.stringify(initial.map((item) => item.source));
      for (let index = 0; index < current.length; index++) {
        if (
          JSON.stringify(current[index].geometry) !==
          JSON.stringify(initial[index]?.geometry)
        )
          record.geometryStable = false;
        if (
          JSON.stringify(current[index].glyphs) !==
          JSON.stringify(initial[index]?.glyphs)
        )
          record.changes.push(current[index].glyphs.join(""));
      }
    };
    record.observer = new MutationObserver(update);
    record.observer.observe(element, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    window.__glyphProbe?.observer.disconnect();
    window.__glyphProbe = record;
    // Ensure the test exercises real glyph slots, not only static source text.
    return {
      initial,
      slotCount: element.querySelectorAll("[data-scramble-glyph]").length,
    };
  });
}
async function result(page) {
  return page.evaluate(() => {
    const record = window.__glyphProbe;
    return {
      initial: record.initial,
      changes: record.changes,
      geometryStable: record.geometryStable,
      accessibleStable: record.accessibleStable,
      current: record.current,
    };
  });
}
async function assertRestored(page, initial, label, animated = true) {
  if (animated)
    await eventually(
      async () => (await result(page)).changes.length > 0,
      `${label}: visible glyphs must actually change`,
      8000,
    );
  await eventually(
    async () => {
      const current = (await result(page)).current;
      return (
        JSON.stringify(current.map((item) => item.glyphs)) ===
        JSON.stringify(initial.map((item) => item.glyphs))
      );
    },
    `${label}: source glyphs must be restored`,
    2000,
  );
  const record = await result(page);
  assert.equal(
    record.geometryStable,
    true,
    `${label}: text and control dimensions must stay fixed during animation`,
  );
  assert.equal(
    record.accessibleStable,
    true,
    `${label}: accessible source text must remain stable`,
  );
  if (!animated)
    assert.deepEqual(
      record.changes,
      [],
      `${label}: reduced motion must keep the visual text unchanged`,
    );
  await page.evaluate(() => window.__glyphProbe.observer.disconnect());
}
async function interactivePass(page, width, locale, reduced) {
  page.__glitchStage = `${width}/${locale}/${reduced ? "reduced" : "normal"}/pointer`;
  const button = page.locator('[data-homepage-product-choice="ceremonial"]');
  await button.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  // Let the unchanged mount timing resolve before inspecting interaction.
  await page.waitForTimeout(1100);
  const sourceLabel = await button.getAttribute("aria-label");
  const probe = await observe(button);
  assert.ok(
    probe.slotCount > 0,
    `${locale}: labels need animatable glyph slots`,
  );
  if (locale !== "en")
    assert.ok(
      probe.initial.some((item) =>
        /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(
          item.source,
        ),
      ),
      "This case must exercise CJK source text",
    );
  if (width === 320) await button.tap();
  else await button.hover();
  if (reduced) await page.waitForTimeout(1100);
  await assertRestored(
    page,
    probe.initial,
    `${width}/${locale}/${reduced ? "reduced" : width === 320 ? "tap" : "hover"}`,
    !reduced,
  );
  if (width !== 320) await page.mouse.move(0, 0);
  await page.locator("[data-nav-brand]").focus();
  page.__glitchStage = `${width}/${locale}/${reduced ? "reduced" : "normal"}/focus`;
  const focused = await observe(button);
  await button.focus();
  if (reduced) await page.waitForTimeout(1100);
  await assertRestored(
    page,
    focused.initial,
    `${width}/${locale}/focus/${reduced}`,
    !reduced,
  );
  assert.equal(await button.getAttribute("aria-label"), sourceLabel);
  assert.equal(await button.getAttribute("aria-pressed"), "true");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
  );
  if (!reduced) await capture(page, `${width}-${locale}-selector`);
}

async function periodicPass(page, width, locale, reduced) {
  page.__glitchStage = `${width}/${locale}/${reduced ? "reduced" : "normal"}/hero`;
  await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
  assert.equal(await page.locator("html").getAttribute("lang"), locale);
  const paragraph = page
    .locator('[data-direction="specimen"] p:has([data-wrap="true"])')
    .first();
  await paragraph.waitFor();
  await paragraph.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  await eventually(
    () =>
      paragraph.evaluate(
        (element) =>
          !element.closest("[inert]") &&
          element.checkVisibility({
            checkOpacity: true,
            checkVisibilityCSS: true,
          }),
      ),
    "Hero copy must be visibly ready",
  );
  // The hero replays at 4.2s desktop/7s mobile. Observe real time, without
  // fake timers or changing the scheduler's cadence.
  await page.waitForTimeout(1400);
  const probe = await observe(paragraph);
  assert.ok(probe.slotCount > 0);
  if (locale !== "en")
    assert.equal(
      await paragraph
        .locator('[data-wrap="true"]')
        .evaluate((element) => getComputedStyle(element).whiteSpace),
      "normal",
      "CJK copy retains wrapping while it scrambles",
    );
  if (reduced) await page.waitForTimeout(width === 320 ? 7500 : 4700);
  await assertRestored(
    page,
    probe.initial,
    `${width}/${locale}/periodic/${reduced}`,
    !reduced,
  );
  assert.equal(
    await paragraph.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
    true,
    "Animated CJK paragraphs remain contained when wrapping",
  );
  if (width === 320 && locale !== "en") {
    const lineStarts = await paragraph.evaluate((element) => {
      const lines = new Map();
      for (const glyph of element.querySelectorAll("[data-scramble-glyph]")) {
        const slot = glyph.parentElement;
        const top = Math.round(slot.getBoundingClientRect().top);
        if (!lines.has(top))
          lines.set(top, glyph.previousElementSibling?.textContent ?? "");
      }
      return [...lines.values()];
    });
    assert.ok(lineStarts.length > 0);
    assert.ok(
      lineStarts.every(
        (text) =>
          !/^[、。，．！？：；）」』】〕〉》ー々ぁぃぅぇぉっゃゅょァィゥェォッャュョ]/u.test(
            text,
          ),
      ),
      "Narrow CJK lines must not begin with closing punctuation or small kana",
    );
  }
  if (!reduced) await capture(page, `${width}-${locale}-hero`);
}

const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  headless: true,
});
let passed = 0;
try {
  for (const width of widths) {
    const { context, page, errors, writes } = await setup(browser, width);
    try {
      for (const locale of locales) {
        page.__glitchStage = `${width}/${locale}/navigate-selection`;
        await page.goto(`${baseURL}/?matcha=${products[2].handle}`, {
          waitUntil: "domcontentloaded",
        });
        await page
          .locator('[data-homepage-product-choice="ceremonial"]:not(:disabled)')
          .waitFor();
        await chooseLocale(page, locale);
        await interactivePass(page, width, locale, false);
        await periodicPass(page, width, locale, false);
      }
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const locale of locales) {
        page.__glitchStage = `${width}/${locale}/navigate-selection`;
        await page.goto(`${baseURL}/?matcha=${products[2].handle}`, {
          waitUntil: "domcontentloaded",
        });
        await page
          .locator('[data-homepage-product-choice="ceremonial"]:not(:disabled)')
          .waitFor();
        await chooseLocale(page, locale);
        await interactivePass(page, width, locale, true);
      }
      await periodicPass(page, width, "ja", true);
      assert.deepEqual(errors, []);
      assert.deepEqual(writes, []);
      passed++;
      console.log(
        `PASS ${width}: four-language ${width === 320 ? "tap" : "hover"}/focus/periodic mutation and restoration; stable accessibility/geometry; reduced motion remains settled`,
      );
    } catch (error) {
      await capture(page, `${width}-failure`);
      throw error;
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
console.log(
  `${passed}/${widths.length} localized glitch browser profiles passed`,
);
