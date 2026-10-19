/* Sample-first selection panel: mocked reads; external requests and writes blocked. */
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
  process.env.SAMPLES_PANEL_STUDY_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.SAMPLES_PANEL_STUDY_EVIDENCE ?? ".local/samples-panel-0152";
const filter = process.env.SAMPLES_PANEL_STUDY_FILTER;
const layouts = ["lead", "equal", "feature", "split"];
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
  let cartReads = 0;
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      errors.push(`Unexpected external request or write: ${request.method()}`);
      return route.abort();
    }
    if (url.pathname === "/api/cart") {
      cartReads++;
      return route.fulfill({ json: { kind: "empty", checkoutEnabled: false } });
    }
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
    reads: () => ({ catalog: catalogReads, cart: cartReads }),
    cookieTone,
  };
}

async function fit(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "No page horizontal overflow",
  );
  for (const selector of [
    "[data-samples-panel-study]",
    "[data-stage-selectors]",
    "[data-sample-selection-panel]",
    "[data-sample-set-material]",
    "[data-sample-set-information]",
  ]) {
    const node = page.locator(selector);
    if (await node.isVisible())
      assert.equal(
        await node.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
        true,
        `${selector} fits without horizontal clipping`,
      );
  }
}

async function imageReady(image) {
  await eventually(
    () =>
      image.evaluate(
        (node) =>
          node.complete &&
          node.naturalWidth > 0 &&
          getComputedStyle(node).opacity === "1",
      ),
    "Material photograph loads and is visible",
  );
  assert.equal(await image.isVisible(), true);
  const box = await image.boundingBox();
  assert.ok(
    box && box.width > 0 && box.height > 0,
    "The photo has visible dimensions",
  );
}

async function teaNamesStayOnOneLine(page) {
  const choices = page.locator(
    "[data-stage-selectors] [data-homepage-product-choice]",
  );
  for (const choice of await choices.all()) {
    const glyphTops = await choice
      .locator("[data-scramble-glyph]")
      .evaluateAll((glyphs) =>
        glyphs
          .filter((glyph) => glyph.getClientRects().length > 0)
          .map((glyph) => glyph.getBoundingClientRect().top),
      );
    assert.ok(glyphTops.length > 0, "The tea name has visible letters");
    assert.ok(
      Math.max(...glyphTops) - Math.min(...glyphTops) <= 1,
      `${await choice.getAttribute("data-homepage-product-choice")} stays on one line in the desktop lead panel`,
    );
  }
}

async function hiddenInert(node, expected = true) {
  assert.equal(await node.isVisible(), !expected);
  assert.equal(await node.evaluate((element) => element.inert), expected);
}

async function sampleState(page, locale = "en") {
  const config = page.locator("[data-embedded]");
  await eventually(
    async () => (await config.getAttribute("data-sample-focused")) === "true",
    "Sample Set is the active selection",
  );
  const button = page.locator("[data-sample-select]");
  assert.equal(await button.count(), 1);
  assert.equal(await button.getAttribute("aria-pressed"), "true");
  assert.equal(await button.isDisabled(), false);
  assert.equal(
    await button.getAttribute("aria-label"),
    translate(locale, "Select {name}", {
      name: translate(locale, "Sample Set"),
    }),
  );
  const teaChoices = page.locator(
    "[data-stage-selectors] [data-homepage-product-choice]",
  );
  await eventually(
    async () => (await teaChoices.count()) === 3,
    "The actual catalog supplies three tea choices",
  );
  assert.equal(
    await page
      .locator(
        '[data-stage-selectors] [data-homepage-product-choice][aria-pressed="true"]',
      )
      .count(),
    0,
    "Only Sample Set reads as selected",
  );
  for (const choice of await teaChoices.all())
    assert.equal(await choice.isVisible(), true);
  assert.equal(
    await page
      .locator("[data-stage-selectors]")
      .evaluate((node) =>
        node.firstElementChild?.hasAttribute("data-sample-selection-panel"),
      ),
    true,
    "The Sample Set is first beside the actual tea choices",
  );
  await hiddenInert(page.locator("[data-tea-material]"));
  await hiddenInert(page.locator("[data-selection-controls]"));
  await hiddenInert(page.locator("[data-sample-stage]"), false);
  await hiddenInert(page.locator("[data-sample-information]"), false);
  const figures = page.locator("[data-sample-set-material] figure");
  assert.equal(await figures.count(), 3);
  for (const [index, item] of SAMPLE_SET_CONTENTS.entries()) {
    const figure = figures.nth(index);
    assert.ok(
      (await figure.innerText()).includes(
        translate(locale, item.name.replace(/ Matcha$/, "")),
      ),
    );
    assert.ok((await figure.innerText()).includes("20 g"));
    await imageReady(figure.locator("img"));
  }
  assert.ok(
    (await page.locator("[data-sample-set-material]").innerText()).includes(
      translate(locale, "60 g total"),
    ),
  );
  const purchase = page.locator(
    "[data-sample-information] [data-sample-purchase]",
  );
  await purchase.locator("[data-sample-unavailable]").waitFor();
  assert.equal(await purchase.isVisible(), true);
  assert.equal(
    await purchase.locator("[data-sample-unavailable] button").isDisabled(),
    true,
  );
  assert.equal(await page.locator("[data-sample-purchase]:visible").count(), 1);
  assert.equal(await purchase.locator("[data-sample-order]").count(), 0);
  assert.doesNotMatch(
    await purchase.innerText(),
    /[¥￥$]|JPY|4,800|1,000|6,123/,
  );
  assert.equal(
    await page.evaluate(() =>
      Boolean(
        document.activeElement?.closest(
          "[data-tea-material], [data-selection-controls]",
        ),
      ),
    ),
    false,
    "Focus is never trapped in the inactive tea surface",
  );
  await fit(page);
}

async function teaState(page, id, quantity = 2) {
  const config = page.locator("[data-embedded]");
  await eventually(
    async () => (await config.getAttribute("data-sample-focused")) === "false",
    "The selected tea is active",
  );
  assert.equal(
    await page
      .locator(`[data-homepage-product-choice="${id}"]`)
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page.locator("[data-sample-select]").getAttribute("aria-pressed"),
    "false",
  );
  await hiddenInert(page.locator("[data-tea-material]"), false);
  await hiddenInert(page.locator("[data-selection-controls]"), false);
  await hiddenInert(page.locator("[data-sample-stage]"));
  await hiddenInert(page.locator("[data-sample-information]"));
  assert.equal(
    await config.getAttribute("data-mode"),
    "builder",
    "The remembered Shop view remains selected",
  );
  assert.equal(
    Number(await page.getByLabel("Quantity", { exact: true }).textContent()),
    quantity,
    "Tea quantity is preserved",
  );
  await fit(page);
}

async function appearanceCookie(fixture) {
  assert.equal(
    (await fixture.context.cookies()).find(
      (item) => item.name === "atoma-theme",
    )?.value,
    fixture.cookieTone,
    "Study appearance does not update the canonical preference",
  );
}

async function screenshot(page, name) {
  await page.screenshot({
    path: resolve(evidence, `${name}.png`),
    fullPage: true,
    animations: "disabled",
  });
}

async function run(name, args, check) {
  if (filter && !name.includes(filter)) return;
  const fixture = await setup(...args);
  try {
    await check(fixture);
    assert.deepEqual(fixture.errors, []);
    passed++;
    console.log(`${name}: passed`);
  } catch (error) {
    await screenshot(fixture.page, `${name}-failure`);
    throw error;
  } finally {
    await fixture.context.close();
  }
}

try {
  for (const width of [1440, 768, 390, 320])
    await run(`matrix-${width}`, [width], async (fixture) => {
      const { page } = fixture;
      await page.goto(`${baseURL}/samples-panel-study`);
      await sampleState(page);
      const config = page.locator("[data-embedded]");
      const root = page.locator("[data-samples-panel-study]");
      const panelLayout = page.getByRole("combobox", {
        name: "Sample panel layout",
        exact: true,
      });
      const appearance = page.getByRole("combobox", {
        name: "Study appearance",
        exact: true,
      });
      assert.equal(await root.getAttribute("data-layout"), "lead");
      const handles = {};
      for (const selector of [
        "[data-embedded]",
        "[data-tea-material]",
        "[data-selection-controls]",
        "[data-sample-purchase]",
      ])
        handles[selector] = await page.locator(selector).elementHandle();
      const reads = fixture.reads();
      const navigations = await page.evaluate(
        () => performance.getEntriesByType("navigation").length,
      );
      for (const tone of ["light", "dark"]) {
        await appearance.selectOption(tone);
        for (const layout of layouts) {
          await panelLayout.selectOption(layout);
          assert.equal(await root.getAttribute("data-layout"), layout);
          assert.equal(await root.getAttribute("data-tone"), tone);
          assert.equal(
            await config.getAttribute("data-sample-panel-layout"),
            layout,
          );
          await sampleState(page);
          if (width === 1440 && layout === "lead")
            await teaNamesStayOnOneLine(page);
          for (const [selector, handle] of Object.entries(handles))
            assert.equal(
              await page
                .locator(selector)
                .evaluate((node, original) => node === original, handle),
              true,
              `${selector} stays mounted`,
            );
          assert.deepEqual(
            fixture.reads(),
            reads,
            "Changing layout/appearance does not fetch catalog or cart again",
          );
          assert.equal(
            await page.evaluate(
              () => performance.getEntriesByType("navigation").length,
            ),
            navigations,
          );
          await appearanceCookie(fixture);
          for (const image of await page
            .locator("[data-sample-selection-image] img")
            .all())
            await imageReady(image);
          await screenshot(page, `${width}-${tone}-${layout}`);
        }
      }
    });

  for (const width of [1440, 320])
    await run(`continuity-${width}`, [width], async (fixture) => {
      const { page } = fixture;
      await page.goto(`${baseURL}/samples-panel-study`);
      await sampleState(page);
      const root = page.locator("[data-samples-panel-study]");
      const config = page.locator("[data-embedded]");
      const barista = page.locator('[data-homepage-product-choice="barista"]');
      await barista.click();
      await page
        .locator("[data-selection-controls]")
        .getByRole("group", { name: "Shopping mode", exact: true })
        .getByRole("button", { name: "Shop", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await teaState(page, "barista");
      const mode = await config.getAttribute("data-mode");
      const configHandle = await config.elementHandle();
      const materialHandle = await page
        .locator("[data-tea-material]")
        .elementHandle();
      const purchaseHandle = await page
        .locator("[data-sample-purchase]")
        .elementHandle();
      const reads = fixture.reads();
      const setButton = page.locator("[data-sample-select]");
      const layoutSelect = page.getByRole("combobox", {
        name: "Sample panel layout",
        exact: true,
      });
      const appearance = page.getByRole("combobox", {
        name: "Study appearance",
        exact: true,
      });
      for (const layout of layouts) {
        await setButton.click();
        await sampleState(page);
        assert.equal(
          await setButton.evaluate((node) => node === document.activeElement),
          true,
          "Selecting Sample Set keeps focus on its button",
        );
        await layoutSelect.selectOption(layout);
        await appearance.selectOption(
          layout === "lead" || layout === "feature" ? "dark" : "light",
        );
        await sampleState(page);
        assert.equal(
          await config.getAttribute("data-mode"),
          mode,
          "Sample Set never overwrites the remembered tea view",
        );
        await barista.click();
        await teaState(page, "barista");
        assert.equal(
          await barista.evaluate((node) => node === document.activeElement),
          true,
          "Returning to the tea keeps focus on its button",
        );
        assert.equal(
          await config.evaluate(
            (node, original) => node === original,
            configHandle,
          ),
          true,
        );
        assert.equal(
          await page
            .locator("[data-tea-material]")
            .evaluate((node, original) => node === original, materialHandle),
          true,
        );
        assert.equal(
          await page
            .locator("[data-sample-purchase]")
            .evaluate((node, original) => node === original, purchaseHandle),
          true,
        );
        assert.deepEqual(
          fixture.reads(),
          reads,
          "Set-to-tea switching does not fetch catalog again",
        );
        await appearanceCookie(fixture);
      }
      await page.bringToFront();
      await setButton.focus();
      await page.keyboard.press("Enter");
      await sampleState(page);
      await barista.focus();
      await page.keyboard.press("Enter");
      await teaState(page, "barista");
      await page.locator('[data-homepage-product-choice="culinary"]').click();
      await teaState(page, "culinary", 1);
      assert.equal(await root.getAttribute("data-layout"), "split");
    });

  for (const locale of ["ja", "zh-Hant"])
    await run(`localized-${locale}`, [320, locale], async (fixture) => {
      const { page } = fixture;
      await page.goto(`${baseURL}/samples-panel-study`);
      const layoutSelect = page.getByRole("combobox", {
        name: "Sample panel layout",
        exact: true,
      });
      for (const layout of layouts) {
        await layoutSelect.selectOption(layout);
        await sampleState(page, locale);
        await screenshot(page, `320-${locale}-${layout}`);
      }
    });

  await run("retry-focus", [320], async (fixture) => {
    const { page } = fixture;
    fixture.setMode("failed");
    await page.goto(`${baseURL}/samples-panel-study?layout=feature`);
    const sampleInfo = page.locator("[data-sample-information]");
    const retry = sampleInfo.getByRole("button", { name: /Try again/ });
    await retry.waitFor();
    await page
      .getByRole("combobox", { name: "Sample panel layout", exact: true })
      .selectOption("equal");
    await retry.focus();
    const reads = fixture.reads().catalog;
    fixture.setMode("ready");
    await page.keyboard.press("Enter");
    await sampleInfo.locator("[data-sample-unavailable]").waitFor();
    assert.ok(fixture.reads().catalog > reads);
    assert.equal(
      await page
        .locator("#samples-purchase")
        .evaluate((node) => node === document.activeElement),
      true,
      "Retry retains focus in the Sample Set purchase",
    );
    assert.equal(
      await page.locator("[data-embedded]").getAttribute("data-sample-focused"),
      "true",
    );
    assert.equal(
      await page
        .locator("[data-samples-panel-study]")
        .getAttribute("data-layout"),
      "equal",
    );
    await fit(page);
  });

  await run("query-fallbacks", [320], async ({ page }) => {
    for (const layout of layouts) {
      await page.goto(`${baseURL}/samples-panel-study?layout=${layout}`);
      await sampleState(page);
      assert.equal(
        await page
          .locator("[data-samples-panel-study]")
          .getAttribute("data-layout"),
        layout,
      );
    }
    for (const query of [
      "",
      "layout=unknown",
      "layout=__proto__",
      "layout=constructor",
      "layout=LEAD",
      "layout=equal&layout=split",
    ]) {
      await page.goto(
        `${baseURL}/samples-panel-study${query ? `?${query}` : ""}`,
      );
      await sampleState(page);
      assert.equal(
        await page
          .locator("[data-samples-panel-study]")
          .getAttribute("data-layout"),
        "lead",
      );
    }
  });

  await run("canonical-not-adopted", [1440], async ({ page }) => {
    await page.goto(`${baseURL}/samples-panel-study?layout=equal`);
    await sampleState(page);
    await page.locator('[data-homepage-product-choice="barista"]').click();
    await page.goto(`${baseURL}/`);
    await page
      .locator('main[data-exploring="false"]')
      .waitFor({ state: "visible" });
    assert.equal(
      await page.locator("[data-sample-selection-panel]").count(),
      0,
    );
    assert.equal(await page.locator("[data-sample-information]").count(), 0);
    await page
      .locator('[data-brand-part="introduction"]')
      .getByRole("button", { name: "EXPLORE MATCHA", exact: true })
      .click();
    await page
      .locator('[data-sample-entrance="selector"]')
      .waitFor({ state: "visible" });
    assert.equal(
      await page.locator("[data-sample-selection-panel]").count(),
      0,
      "Canonical homepage keeps its prior sample entry",
    );
    await page.goto(`${baseURL}/samples`);
    await page
      .locator("[data-samples-page] [data-sample-unavailable]")
      .waitFor();
    assert.equal(
      await page.locator("[data-sample-selection-panel]").count(),
      0,
    );
    const tags = await page
      .locator("[data-sample-purchase]")
      .evaluate((node) =>
        [...node.children].slice(0, 3).map((child) => child.tagName),
      );
    assert.deepEqual(
      tags,
      ["P", "H2", "P"],
      "Canonical samples purchase heading is unchanged",
    );
  });
} finally {
  await browser.close();
}
console.log(`${passed} samples-panel scenarios passed; all writes blocked`);
