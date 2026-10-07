/* Overview presentation checks; all commerce reads are mocked and writes blocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { translate } from "../src/lib/i18n/index.ts";
import { getProductContent } from "../src/lib/product-content.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.OVERVIEW_STUDY_BASE_URL ?? "http://127.0.0.1:3100";
const evidence = process.env.OVERVIEW_STUDY_EVIDENCE;
const filter = process.env.OVERVIEW_STUDY_FILTER;
const directions = ["digest", "index", "folded"];
const products = [
  ["culinary", "Culinary", "jmm-storefront-test-matcha", "UJI-01"],
  [
    "barista",
    "Barista",
    "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
    "UJI-00",
  ],
  [
    "ceremonial",
    "Premium",
    "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
    "WZKA-00",
  ],
].map(([id, name, handle, productCode], index) => ({
  id,
  title: `Japanese ${name} Matcha Powder — 1 kg`,
  handle,
  productCode,
  description: "Isolated overview-study browser fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
      title: "1 kg",
      available: true,
      priceMinor: (index + 1) * 1200,
      currency: "JPY",
      options: [{ name: "Format", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
    {
      id: `v1_${String.fromCharCode(100 + index).repeat(43)}`,
      title: "100 g",
      available: false,
      priceMinor: (index + 1) * 220,
      currency: "JPY",
      options: [{ name: "Format", value: "100 g" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));
const names = {
  culinary: "Culinary Matcha",
  barista: "Barista Matcha",
  ceremonial: "Ceremonial Matcha",
};
const overviewSelector = '[data-homepage-view-panel="overview"]';

async function setup(browser, width, tone, locale = "en") {
  const context = await browser.newContext({
    viewport: { width, height: width === 320 ? 740 : 900 },
    reducedMotion: "reduce",
    hasTouch: width === 320,
    isMobile: width === 320,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: locale, url: baseURL },
  ]);
  const errors = [];
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    try {
      assert.ok(
        ["GET", "HEAD"].includes(request.method()),
        `Writes are forbidden: ${request.method()} ${url.pathname}`,
      );
      if (url.pathname.startsWith("/api/")) {
        assert.equal(url.origin, new URL(baseURL).origin);
        if (url.pathname === "/api/catalog")
          return route.fulfill({
            contentType: "application/json",
            json: {
              status: "ready",
              products,
              shopUrl: "https://example.invalid",
            },
          });
        if (url.pathname === "/api/cart")
          return route.fulfill({
            contentType: "application/json",
            json: { kind: "empty", checkoutEnabled: false },
          });
        assert.fail(`Unexpected API request: ${url.pathname}`);
      }
      return route.continue();
    } catch (error) {
      errors.push(error.message);
      return route.abort("blockedbyclient");
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  page.setDefaultNavigationTimeout(40_000);
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page, errors };
}

async function ready(page, path = "/overview-study") {
  await page.goto(`${baseURL}${path}`, { waitUntil: "domcontentloaded" });
  await page
    .locator("[data-homepage-product-choice]:not(:disabled)")
    .first()
    .waitFor();
  await page.locator("[data-scene-canvas]").waitFor({ state: "attached" });
  await page.evaluate(() => document.fonts.ready);
}

async function direction(page, value) {
  const previous = await page
    .locator("[data-overview-study][data-direction]")
    .getAttribute("data-direction");
  const select = page.getByRole("combobox", {
    name: "Overview direction",
    exact: true,
  });
  if (await select.isVisible()) await select.selectOption(value);
  else {
    const button = page
      .getByRole("group", { name: "Overview direction", exact: true })
      .getByRole("button", {
        name:
          value === "current"
            ? "Original"
            : value[0].toUpperCase() + value.slice(1),
        exact: true,
      });
    await button.focus();
    await button.press("Enter");
  }
  await page
    .locator(`[data-overview-study][data-direction="${value}"]`)
    .waitFor();
  if (previous !== value)
    assert.equal(new URL(page.url()).searchParams.get("direction"), value);
}

async function view(page, name, locale = "en") {
  await page
    .getByRole("group", {
      name: translate(locale, "Shopping mode"),
      exact: true,
    })
    .getByRole("button", { name: translate(locale, name), exact: true })
    .click();
  if (name === "Shop") await page.locator("[data-shop-exploration]").waitFor();
  else
    await page
      .locator(`[data-homepage-view-panel="${name.toLowerCase()}"]`)
      .waitFor();
}

async function typography(locator) {
  return locator.evaluate((element) => {
    const css = getComputedStyle(element);
    return {
      size: css.fontSize,
      family: css.fontFamily,
      weight: css.fontWeight,
    };
  });
}

async function specificationsType(page, locale = "en") {
  await view(page, "Specifications", locale);
  const result = {
    heading: await typography(page.locator("[data-focused-product-name]")),
    body: await typography(
      page.locator("[data-specification]").first().locator("span").nth(1),
    ),
  };
  await view(page, "Overview", locale);
  return result;
}

async function fit(page, panel) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "The page has no horizontal overflow",
  );
  assert.equal(
    await panel.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
    true,
    JSON.stringify(
      await panel.evaluate((element) => ({
        reason: "The Overview has no horizontal overflow",
        client: element.clientWidth,
        scroll: element.scrollWidth,
        children: [...element.querySelectorAll("*")]
          .filter((child) => child.scrollWidth > child.clientWidth + 1)
          .map((child) => [
            child.tagName,
            child.className,
            child.clientWidth,
            child.scrollWidth,
          ])
          .slice(0, 10),
      })),
    ),
  );
}

async function openDetails(panel, mobile) {
  // Let section navigation's scheduled focus transfer settle before emulating
  // the next keyboard interaction; otherwise it can steal summary focus.
  await panel.evaluate(
    () =>
      new Promise((done) => {
        requestAnimationFrame(() => requestAnimationFrame(done));
      }),
  );
  const disclosures = panel.locator("details");
  assert.ok(
    (await disclosures.count()) > 0,
    "Long-form details remain accessible",
  );
  for (const details of await disclosures.all()) {
    const summary = details.locator(":scope > summary");
    if (mobile) {
      const box = await summary.boundingBox();
      assert.ok(
        box?.height >= 44,
        "Disclosure touch targets are at least 44 px",
      );
    }
    if (!(await details.evaluate((element) => element.open))) {
      await summary.focus();
      await summary.press("Enter");
      assert.equal(await details.evaluate((element) => element.open), true);
    }
  }
}

async function assertRecord(panel, product, locale = "en") {
  assert.equal(
    await panel
      .getByText(translate(locale, "Overview"), { exact: true })
      .count(),
    0,
    "Overview is the tab name, not another nested section",
  );
  const description = panel.getByText(
    getProductContent(product, locale).summary,
    {
      exact: true,
    },
  );
  assert.equal(
    await description.count(),
    1,
    "The full introduction appears once",
  );
  assert.equal(await description.isVisible(), true);
  const record = panel.locator("[data-product-record]");
  await record.waitFor();
  assert.deepEqual(
    await record.locator("[data-published-fact] dd").allTextContents(),
    [product.productCode],
    "Only the approved product code is published as a product fact",
  );
  assert.deepEqual(
    await record.locator("[data-provisional-detail] dt").allTextContents(),
    ["Ingredients", "Storage", "Shelf life"].map((text) =>
      translate(locale, text),
    ),
  );
  assert.deepEqual(
    await record.locator("[data-provisional-detail] dd").allTextContents(),
    Array(3).fill(
      translate(locale, "{value} (provisional)", {
        value: translate(locale, "To be confirmed"),
      }),
    ),
    "Unconfirmed ingredients, storage and shelf life retain their provisional label",
  );
  for (const variant of product.variants) {
    const price = new Intl.NumberFormat("en", {
      style: "currency",
      currency: variant.currency,
    }).format(variant.priceMinor);
    assert.ok(
      (await panel.textContent()).includes(price),
      `Actual price ${price} is retained`,
    );
    assert.ok(
      (await panel.textContent()).includes(variant.title),
      `Actual format ${variant.title} is retained`,
    );
  }
  assert.ok(
    (await panel.textContent()).includes(translate(locale, "Available")),
  );
  assert.ok(
    (await panel.textContent()).includes(
      translate(locale, "Currently unavailable"),
    ),
  );
}

async function capture(page, name) {
  if (!evidence) return;
  await mkdir(evidence, { recursive: true });
  const panel = page.locator(
    '[data-overview-study="digest"]:visible, [data-overview-study="index"]:visible, [data-overview-study="folded"]:visible',
  );
  if (await panel.count()) {
    await panel.scrollIntoViewIfNeeded();
    const viewport = page.viewportSize();
    const box = await panel.boundingBox();
    // A tall, expanded disclosure otherwise gets cropped by the study's
    // scrolling preview. Extend capture height only; preserve phone width.
    if (viewport && box && box.height > viewport.height - 200) {
      await page.setViewportSize({
        width: viewport.width,
        height: Math.ceil(box.height) + 240,
      });
      await panel.scrollIntoViewIfNeeded();
    }
    await panel.screenshot({ path: resolve(evidence, `${name}-panel.png`) });
    if (viewport) await page.setViewportSize(viewport);
    await panel.scrollIntoViewIfNeeded();
  }
  await page.screenshot({ path: resolve(evidence, `${name}.png`) });
}

async function adoptedOverview(page, width, tone, locale = "en") {
  const product = products[1];
  const content = getProductContent(product, locale);
  await ready(page, `/?matcha=${product.handle}`);
  const panel = page.locator(
    `${overviewSelector} [data-overview-study="folded"]`,
  );
  await panel.waitFor();
  assert.equal(
    await page.locator("[data-overview-study][data-direction]").count(),
    0,
  );
  assert.equal(await panel.locator("details").count(), 3);
  assert.equal(await panel.locator("details[open]").count(), 0);
  assert.deepEqual(
    await panel
      .locator("details > summary > span:first-child")
      .allTextContents(),
    [
      "Formats & availability",
      "Application & preparation",
      "Product record",
    ].map((label) => translate(locale, label)),
    "The adopted Overview has three closed disclosures",
  );
  assert.equal(
    await panel.getByText(content.summary, { exact: true }).count(),
    1,
  );
  assert.equal(
    await panel.getByText(content.summary, { exact: true }).isVisible(),
    true,
  );
  assert.equal(
    await panel.getByText(content.materialSummary, { exact: true }).count(),
    0,
  );
  assert.equal(
    (await panel.locator("[data-homepage-product-name]").textContent()).trim(),
    content.name,
  );
  assert.equal(
    await panel
      .locator("[data-code-placement='register']")
      .getAttribute("data-display-index"),
    `[${product.productCode}]`,
  );
  const reference = await specificationsType(page, locale);
  assert.deepEqual(
    await typography(panel.locator("[data-homepage-product-name]")),
    reference.heading,
  );
  assert.deepEqual(await typography(panel), reference.body);
  await fit(page, panel);
  await capture(page, `${width}-${tone}-${locale}-adopted`);
  await page.evaluate(() => {
    window.__adoptedOverviewScene = document.querySelector(
      "[data-scene-canvas]",
    );
    window.__adoptedOverviewHero = document.querySelector(
      'main[data-concept="01"]',
    );
  });
  await view(page, "Shop", locale);
  const shop = page.locator("[data-shop-exploration]");
  const quantityLabel = translate(locale, "Quantity");
  const initialQuantity = Number(
    await shop.getByLabel(quantityLabel, { exact: true }).textContent(),
  );
  await shop
    .getByRole("button", {
      name: translate(locale, "Increase quantity"),
      exact: true,
    })
    .click();
  const quantity = await shop
    .getByLabel(quantityLabel, { exact: true })
    .textContent();
  assert.equal(Number(quantity), initialQuantity + 1);
  await view(page, "Overview", locale);
  await openDetails(panel, width === 320);
  await assertRecord(panel, product, locale);
  await fit(page, panel);
  if (locale === "ja") await capture(page, "320-ja-adopted-expanded");
  await panel
    .getByRole("button", {
      name: translate(locale, "View specifications"),
      exact: false,
    })
    .click();
  await page.locator("[data-focused-specifications]").waitFor();
  await view(page, "Overview", locale);
  await panel
    .getByRole("button", {
      name: translate(locale, "Shop this matcha"),
      exact: false,
    })
    .click();
  await shop.waitFor();
  assert.equal(
    await shop.getByLabel(quantityLabel, { exact: true }).textContent(),
    quantity,
  );
  assert.equal(
    await page
      .locator(`[data-homepage-product-choice="${product.id}"]`)
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page.evaluate(
      () =>
        document.querySelector("[data-scene-canvas]") ===
          window.__adoptedOverviewScene &&
        document.querySelector('main[data-concept="01"]') ===
          window.__adoptedOverviewHero,
    ),
    true,
    "Canonical Overview preserves selection, quantity and the mounted material scene",
  );
}

async function runCase(browser, width, tone) {
  const { context, page, errors } = await setup(browser, width, tone);
  const caseName = `${width}-${tone}`;
  try {
    await ready(page);
    assert.equal(
      await page
        .locator("[data-overview-study][data-direction]")
        .getAttribute("data-direction"),
      "digest",
    );
    await page.evaluate(() => {
      window.__overviewScene = document.querySelector("[data-scene-canvas]");
      window.__overviewHero = document.querySelector('main[data-concept="01"]');
    });
    const reference = await specificationsType(page);
    await direction(page, "current");
    const currentTextLength = (await page.locator(overviewSelector).innerText())
      .length;
    assert.equal(
      await page
        .locator(`${overviewSelector} [data-product-details] summary`)
        .count(),
      0,
    );
    assert.equal(
      await page
        .locator(
          `${overviewSelector} [data-product-details][data-presentation="inline"]`,
        )
        .count(),
      1,
      "The Original study option retains its inline details",
    );
    await view(page, "Shop");
    const shop = page.locator("[data-shop-exploration]");
    await shop
      .getByRole("button", { name: "Increase quantity", exact: true })
      .click();
    const quantity = await shop
      .getByLabel("Quantity", { exact: true })
      .textContent();
    await view(page, "Overview");
    for (const value of directions) {
      await direction(page, value);
      const panel = page.locator(`[data-overview-study="${value}"]`);
      await panel.waitFor();
      assert.ok(
        (await panel.innerText()).length < currentTextLength,
        `${value} reduces the initially visible text`,
      );
      assert.deepEqual(
        await typography(panel.locator("[data-homepage-product-name]")),
        reference.heading,
      );
      await fit(page, panel);
      await capture(page, `${caseName}-${value}`);
      await openDetails(panel, width === 320);
      for (const product of products) {
        await page
          .locator(`[data-homepage-product-choice="${product.id}"]`)
          .click();
        await openDetails(panel, width === 320);
        assert.equal(
          (
            await panel.locator("[data-homepage-product-name]").textContent()
          ).trim(),
          names[product.id],
        );
        assert.equal(
          await panel
            .locator("[data-code-placement='register']")
            .getAttribute("data-display-index"),
          `[${product.productCode}]`,
        );
        await assertRecord(panel, product);
        await fit(page, panel);
      }
      assert.deepEqual(await typography(panel), reference.body);
      await panel
        .getByRole("button", { name: "View specifications", exact: false })
        .click();
      await page.locator("[data-focused-specifications]").waitFor();
      await view(page, "Overview");
      await panel
        .getByRole("button", { name: "Shop this matcha", exact: false })
        .click();
      await shop.waitFor();
      await view(page, "Overview");
      assert.equal(
        await page.evaluate(
          () =>
            document.querySelector("[data-scene-canvas]") ===
              window.__overviewScene &&
            document.querySelector('main[data-concept="01"]') ===
              window.__overviewHero,
        ),
        true,
        "Changing study directions and tabs retains the material scene and hero",
      );
    }
    // Product switching may select a different valid quantity; preserve a new
    // selection specifically through study and tab navigation.
    await view(page, "Shop");
    const before = await shop
      .getByLabel("Quantity", { exact: true })
      .textContent();
    assert.ok(Number(before) >= 1 && Number(quantity) === 2);
    await shop
      .getByRole("button", { name: "Increase quantity", exact: true })
      .click();
    const retainedQuantity = await shop
      .getByLabel("Quantity", { exact: true })
      .textContent();
    await view(page, "Overview");
    await direction(page, "digest");
    await direction(page, "index");
    await view(page, "Shop");
    assert.equal(
      await shop.getByLabel("Quantity", { exact: true }).textContent(),
      retainedQuantity,
    );
    assert.equal(
      await page
        .locator('[data-homepage-product-choice="ceremonial"]')
        .getAttribute("aria-pressed"),
      "true",
    );

    await adoptedOverview(page, width, tone);
    assert.deepEqual(errors, []);
  } catch (error) {
    await capture(page, `${caseName}-failure`);
    throw error;
  } finally {
    await context.close();
  }
}

async function localizedCase(browser, locale) {
  const { context, page, errors } = await setup(browser, 320, "light", locale);
  try {
    await ready(page);
    assert.equal(await page.locator("html").getAttribute("lang"), locale);
    const reference = await specificationsType(page, locale);
    const product = products[1];
    await page
      .locator(`[data-homepage-product-choice="${product.id}"]`)
      .click();
    for (const value of directions) {
      await direction(page, value);
      const panel = page.locator(`[data-overview-study="${value}"]`);
      await panel.waitFor();
      assert.equal(
        (
          await panel.locator("[data-homepage-product-name]").textContent()
        ).trim(),
        translate(locale, names[product.id]),
      );
      assert.deepEqual(
        await typography(panel.locator("[data-homepage-product-name]")),
        reference.heading,
      );
      await openDetails(panel, true);
      await assertRecord(panel, product, locale);
      await fit(page, panel);
      if (locale === "ja" && value === "folded")
        await capture(page, "320-ja-expanded");
    }
    await adoptedOverview(page, 320, "light", locale);
    assert.deepEqual(errors, []);
  } catch (error) {
    await capture(page, `320-${locale}-failure`);
    throw error;
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  headless: true,
});
let passed = 0;
try {
  for (const width of [1366, 320]) {
    for (const tone of ["light", "dark"]) {
      if (filter && !`${width}-${tone}`.includes(filter)) continue;
      await runCase(browser, width, tone);
      passed++;
      console.log(
        `PASS ${width}-${tone}: three layouts, facts, formats, type and selection continuity`,
      );
    }
  }
  for (const locale of ["zh-Hans", "zh-Hant", "ja"]) {
    if (filter && !`320-${locale}`.includes(filter)) continue;
    await localizedCase(browser, locale);
    passed++;
    console.log(
      `PASS 320-${locale}: localized study, disclosure access and type consistency`,
    );
  }
} finally {
  await browser.close();
}
console.log(`${passed} Overview study browser cases passed`);
