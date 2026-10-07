/* Canonical localization in place; all commerce is fulfilled in memory.
 * Language selection must not configure countries, convert JPY or write remotely. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { translate } from "../src/lib/i18n/index.ts";
import { localizedMetadata } from "../src/lib/i18n/metadata.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL =
  process.env.STOREFRONT_LOCALIZATION_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.STOREFRONT_LOCALIZATION_EVIDENCE ?? ".local/localization-0117";
const locales = ["en", "zh-Hans", "zh-Hant", "ja"];
const profiles = process.env.STOREFRONT_LOCALIZATION_PROFILES?.split(",") ?? [
  "1366-light",
  "1366-dark",
  "320-light",
  "320-dark",
];
assert.ok(
  profiles.length &&
    profiles.every((profile) => /^(1366|320)-(light|dark)$/.test(profile)),
  "Unsupported localization profile",
);
const names = {
  en: ["Culinary Matcha", "Barista Matcha", "Ceremonial Matcha"],
  "zh-Hans": ["烘焙用抹茶", "拿铁用抹茶", "纯饮用抹茶"],
  "zh-Hant": ["烘焙用抹茶", "拿鐵用抹茶", "純飲用抹茶"],
  ja: ["製菓用抹茶", "ラテ用抹茶", "点てて飲む抹茶"],
};
const products = [
  ["culinary", "jmm-storefront-test-matcha", "UJI-01"],
  [
    "barista",
    "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
    "UJI-00",
  ],
  [
    "ceremonial",
    "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
    "WZKA-00",
  ],
].map(([id, handle, productCode], index) => ({
  id,
  handle,
  productCode,
  title: names.en[index],
  description: "Isolated four-language browser fixture.",
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
  ],
}));
const money = (value) =>
  new Intl.NumberFormat("en", { style: "currency", currency: "JPY" }).format(
    value,
  );

async function eventually(check, message) {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function setup(browser, width, tone) {
  const context = await browser.newContext({
    viewport: { width, height: width === 320 ? 740 : 900 },
    reducedMotion: "reduce",
    hasTouch: width === 320,
    isMobile: width === 320,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
  ]);
  const state = { reads: [], writes: [], errors: [] };
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    try {
      if (!["GET", "HEAD"].includes(request.method())) {
        state.writes.push(`${request.method()} ${url.pathname}`);
        assert.fail("No commerce writes are authorized in this regression");
      }
      if (url.pathname.startsWith("/api/")) {
        assert.equal(url.origin, new URL(baseURL).origin);
        state.reads.push(`${url.pathname}${url.search}`);
        assert.equal(
          url.search,
          "",
          "UI language must not invent country/currency commerce context",
        );
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
            json: {
              kind: "ready",
              checkoutEnabled: false,
              cart: {
                totalQuantity: 2,
                subtotalLabel: money(4800),
                totalLabel: money(4800),
                lines: [
                  {
                    lineKey: "line-barista",
                    productHandle: products[1].handle,
                    productTitle: products[1].title,
                    variantTitle: "1 kg",
                    options: products[1].variants[0].options,
                    quantity: 2,
                    unitPriceLabel: money(2400),
                    lineTotalLabel: money(4800),
                    purchaseState: "purchasable",
                    quantityRule: { minimum: 1, maximum: 4, increment: 1 },
                    canUpdateQuantity: true,
                    canRemove: true,
                    image: null,
                  },
                ],
              },
            },
          });
        assert.fail(`Unexpected API endpoint ${url.pathname}`);
      }
      return route.continue();
    } catch (error) {
      state.errors.push(error.message);
      return route.abort("blockedbyclient");
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  page.setDefaultNavigationTimeout(30_000);
  page.on("pageerror", (error) => state.errors.push(error.message));
  return { context, page, state };
}

async function capture(page, name) {
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: resolve(evidence, `${name}.png`) });
}
async function noOverflow(page) {
  await page.evaluate(() => document.fonts.ready);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "The localized page must not overflow horizontally",
  );
  const clipped = await page
    .locator(
      "[data-homepage-product-choice], [data-information-view], [data-appearance-controls], [data-shop-exploration], [data-focused-specifications], [data-origin-preview]",
    )
    .evaluateAll((elements) =>
      elements
        .filter(
          (element) =>
            element.getClientRects().length &&
            element.scrollWidth > element.clientWidth + 1,
        )
        .map((element) => ({
          tag: element.tagName,
          text: element.textContent?.slice(0, 80),
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
        })),
    );
  assert.deepEqual(
    clipped,
    [],
    "Localized product controls and panels must not clip horizontally",
  );
}
async function languageControl(page) {
  const menu = page
    .locator('[data-brand-part="header"] [data-navigation-index]')
    .first();
  const summary = menu.locator("[data-nav-summary]");
  if (
    (await summary.isVisible()) &&
    !(await menu.getAttribute("open")) &&
    (await menu.getAttribute("open")) !== ""
  )
    await summary.click();
  const select = page.locator("[data-language-switcher]:visible").first();
  await select.waitFor();
  await eventually(
    () =>
      select.evaluate((element) => {
        const theme = element
          .closest("[data-appearance-controls]")
          ?.querySelector("[data-theme-switcher]");
        return theme && !theme.disabled;
      }),
    "The language control must be hydrated before interaction",
  );
  return select;
}
async function chooseLocale(page, locale, pageKind, tone) {
  const select = await languageControl(page);
  const layout = await select.evaluate((element) => {
    const group = element.closest("[data-appearance-controls]");
    const theme = group?.querySelector("[data-theme-switcher]");
    const languageRect = element.getBoundingClientRect();
    const themeRect = theme?.getBoundingClientRect();
    return {
      themePresent: Boolean(theme),
      sameLine: themeRect && Math.abs(themeRect.y - languageRect.y) < 10,
      separation: themeRect && themeRect.x - languageRect.right,
    };
  });
  assert.equal(
    layout.themePresent,
    true,
    "Language and theme must share their existing control group",
  );
  assert.equal(
    layout.sameLine,
    true,
    "The language selector must sit beside the theme toggle",
  );
  assert.ok(layout.separation >= -1 && layout.separation < 24);
  assert.deepEqual(
    await select
      .locator("option")
      .evaluateAll((options) => options.map((option) => option.value)),
    locales,
  );
  await select.selectOption(locale);
  await eventually(
    async () => (await page.locator("html").getAttribute("lang")) === locale,
    "html.lang must update in place",
  );
  const metadata = localizedMetadata(pageKind, locale);
  await eventually(
    async () => (await page.title()) === metadata.title,
    "Document title must use the selected language",
  );
  assert.equal(
    await page.locator('meta[name="description"]').getAttribute("content"),
    metadata.description,
  );
  assert.equal(
    await page
      .locator("[data-theme-switcher]:visible")
      .first()
      .getAttribute("aria-checked"),
    String(tone === "dark"),
  );
  const cookie = (await page.context().cookies()).find(
    (item) => item.name === "atoma-locale",
  );
  assert.equal(cookie?.value, locale);
  assert.equal(cookie?.sameSite, "Lax");
  assert.equal(cookie?.path, "/");
  await select.focus();
  await page.keyboard.press("Tab");
  assert.equal(
    await page.locator("[data-theme-switcher]:focus").count(),
    1,
    "Keyboard navigation reaches the adjacent theme control",
  );
  const summary = page.locator("[data-nav-summary]:visible").first();
  if ((await summary.count()) && locale === "ja" && pageKind === "home") {
    await noOverflow(page);
    await capture(page, `${page.viewportSize().width}-${tone}-ja-controls`);
  }
  if (await summary.count()) await page.keyboard.press("Escape");
}
async function switchView(page, locale, view) {
  await page
    .getByRole("group", {
      name: translate(locale, "Shopping mode"),
      exact: true,
    })
    .getByRole("button", { name: translate(locale, view), exact: true })
    .click();
}
async function fontSnapshot(page, locale) {
  const size = (locator) =>
    locator.evaluate((element) =>
      parseFloat(getComputedStyle(element).fontSize),
    );
  const header = await size(
    page.locator('[data-brand-part="header"] [data-nav-action="shop"]').first(),
  );
  const button = await size(
    page.locator("[data-shop-exploration]").getByRole("button", {
      name: translate(locale, "Increase quantity"),
      exact: true,
    }),
  );
  await switchView(page, locale, "Overview");
  const body = await size(
    page.locator('[data-homepage-view-panel="overview"] p').first(),
  );
  await switchView(page, locale, "Shop");
  return { header, button, body };
}
async function assertNames(scope, locale, indices = [0, 1, 2]) {
  const text = await scope.textContent();
  for (const index of indices)
    assert.ok(
      text.includes(names[locale][index]),
      `${names[locale][index]} should be rendered`,
    );
}

async function checkHome(page, state, width, tone) {
  await page.goto(`${baseURL}/?matcha=${products[1].handle}`, {
    waitUntil: "domcontentloaded",
  });
  await page
    .locator('[data-homepage-product-choice="barista"]:not(:disabled)')
    .waitFor();
  await page.locator("[data-scene-canvas]").waitFor({ state: "attached" });
  await switchView(page, "en", "Shop");
  const shop = page.locator("[data-shop-exploration]");
  await shop
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  const quantity = await shop
    .getByLabel("Quantity", { exact: true })
    .textContent();
  assert.equal(quantity, "2");
  await page.evaluate(() => {
    window.__localeScene = document.querySelector("[data-scene-canvas]");
  });
  const reads = state.reads.length;
  let englishFonts;
  for (const locale of locales) {
    await chooseLocale(page, locale, "home", tone);
    const modes = page.getByRole("group", {
      name: translate(locale, "Shopping mode"),
      exact: true,
    });
    for (const [index, label] of [
      "Overview",
      "Specifications",
      "Shop",
      "Origin",
    ].entries()) {
      assert.equal(
        await modes
          .getByRole("button", { name: translate(locale, label), exact: true })
          .evaluate((element) =>
            Array.from(
              element.parentElement.querySelectorAll(":scope > button"),
            ).indexOf(element),
          ),
        index,
        "Product tabs must preserve the requested order",
      );
    }
    const fonts = await fontSnapshot(page, locale);
    if (locale === "en") englishFonts = fonts;
    else
      for (const [part, size] of Object.entries(fonts))
        assert.equal(
          size,
          englishFonts[part] + 1,
          `${locale} ${part} text must be exactly 1px larger than English`,
        );
    assert.equal(
      await page
        .locator('[data-homepage-product-choice="barista"]')
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      await shop
        .getByLabel(translate(locale, "Quantity"), { exact: true })
        .textContent(),
      quantity,
    );
    assert.ok(
      (
        await shop.locator("[data-shop-unit-price]").first().textContent()
      ).startsWith(money(2400)),
    );
    await assertNames(shop, locale, [1]);
    await switchView(page, locale, "Overview");
    await assertNames(
      page.locator('[data-homepage-view-panel="overview"]'),
      locale,
      [1],
    );
    await switchView(page, locale, "Specifications");
    await assertNames(
      page.locator("[data-focused-specifications]"),
      locale,
      [1],
    );
    await switchView(page, locale, "Origin");
    const origin = page.locator('[data-origin-preview="panorama"]');
    await assertNames(origin, locale, [1]);
    assert.equal(
      await origin.locator('[data-origin-designation="uji-tea"]').count(),
      1,
    );
    assert.ok(
      (await origin.textContent()).includes(
        translate(
          locale,
          "Specific growing and processing locations are not yet published.",
        ),
      ),
    );
    assert.deepEqual(
      await origin
        .getByRole("list", {
          name: translate(locale, "Geographic hierarchy"),
          exact: true,
        })
        .locator("li")
        .allTextContents(),
      [
        `${translate(locale, "Country")}${translate(locale, "Japan")}`,
        `${translate(locale, "Region")}${translate(locale, "Kyoto")}`,
        `${translate(locale, "Locality")}${translate(locale, "Uji City")}`,
      ],
    );
    await noOverflow(page);
    await capture(page, `${width}-${tone}-${locale}-home`);
    await switchView(page, locale, "Shop");
    assert.equal(
      await shop
        .getByLabel(translate(locale, "Quantity"), { exact: true })
        .textContent(),
      quantity,
    );
    assert.equal(
      await page.evaluate(
        () =>
          document.querySelector("[data-scene-canvas]") ===
          window.__localeScene,
      ),
      true,
      "Language changes must retain the mounted material scene",
    );
  }
  assert.equal(
    state.reads.length,
    reads,
    "Language changes must not refetch commerce or change market context",
  );
  await chooseLocale(page, "en", "home", tone);
  assert.deepEqual(
    await fontSnapshot(page, "en"),
    englishFonts,
    "Returning to English restores the approved text sizes",
  );
  await chooseLocale(page, "ja", "home", tone);
  const response = await page.reload({ waitUntil: "domcontentloaded" });
  const html = await response.text();
  assert.match(
    html,
    /<html[^>]*lang="ja"/,
    "The saved language must be server-rendered on reload",
  );
  assert.ok(html.includes(localizedMetadata("home", "ja").title));
  await page
    .locator('[data-homepage-product-choice="barista"]:not(:disabled)')
    .waitFor();
  assert.equal(await page.locator("html").getAttribute("lang"), "ja");
}

async function checkShop(page, width, tone) {
  await page.goto(`${baseURL}/shop`, { waitUntil: "domcontentloaded" });
  await page.locator('[data-shop-product="barista"]').waitFor();
  for (const locale of locales) {
    await chooseLocale(page, locale, "shop", tone);
    for (const [index, product] of products.entries()) {
      const card = page.locator(`[data-shop-product="${product.id}"]`);
      await assertNames(card, locale, [index]);
      assert.ok(
        (await card.textContent()).includes(`[${product.productCode}]`),
      );
      assert.equal(
        await card
          .getByRole("link", {
            name: translate(locale, "View {name}", {
              name: names[locale][index],
            }),
            exact: true,
          })
          .getAttribute("href"),
        `/shop/${product.handle}`,
      );
    }
    await noOverflow(page);
    await capture(page, `${width}-${tone}-${locale}-shop`);
  }
  await page.goto(`${baseURL}/shop/${products[1].handle}`, {
    waitUntil: "domcontentloaded",
  });
  const retail = page.locator("[data-retail-product]");
  for (const locale of locales) {
    await chooseLocale(page, locale, "product", tone);
    await retail
      .getByRole("heading", { name: names[locale][1], exact: true, level: 1 })
      .waitFor();
    assert.ok((await retail.textContent()).includes(money(2400)));
    await noOverflow(page);
    await page
      .getByRole("button", {
        name: translate(locale, "Open cart, {count} items", { count: 2 }),
        exact: true,
      })
      .click();
    const cart = page.locator("dialog[open]");
    await assertNames(cart, locale, [1]);
    assert.equal(
      await cart
        .getByLabel(
          translate(locale, "{name} quantity", { name: names[locale][1] }),
          { exact: true },
        )
        .textContent(),
      "2",
    );
    assert.ok((await cart.textContent()).includes(money(4800)));
    assert.equal(
      await cart
        .getByRole("button", {
          name: translate(locale, "Checkout"),
          exact: true,
        })
        .isDisabled(),
      true,
      "Localization must preserve the existing checkout gate",
    );
    await capture(page, `${width}-${tone}-${locale}-cart`);
    await page.keyboard.press("Escape");
    await cart.waitFor({ state: "hidden" });
    await eventually(
      () =>
        page
          .getByRole("button", {
            name: translate(locale, "Open cart, {count} items", { count: 2 }),
            exact: true,
          })
          .evaluate((element) => element === document.activeElement),
      "Cart dismissal restores trigger focus before further interaction",
    );
  }
}

async function checkOrigins(page, width, tone) {
  await page.goto(`${baseURL}/origins`, { waitUntil: "domcontentloaded" });
  const directory = page.locator('[data-origins-directory="all"]');
  await directory.locator('[data-origin-place="kyoto"]').waitFor();
  await chooseLocale(page, "zh-Hans", "home", tone);
  const search = directory.locator('input[type="search"]');
  await search.fill("和束");
  assert.equal(
    await directory.locator('[data-origin-place="wazuka"]').count(),
    1,
  );
  await search.fill("Wazuka");
  assert.equal(
    await directory.locator('[data-origin-place="wazuka"]').count(),
    1,
    "Latin place names remain searchable alongside CJK labels",
  );
  await search.fill("");
  await directory.locator('[data-origin-place="kyoto"]').click();
  const kyoto = page.locator('[data-origins-directory="kyoto"]');
  await eventually(
    async () => (await kyoto.locator('a[href*="matcha="]').count()) === 3,
    "Kyoto retains all three matchas",
  );
  for (const locale of locales) {
    await chooseLocale(page, locale, "home", tone);
    assert.equal(
      await kyoto.count(),
      1,
      "Language switches retain the selected origin",
    );
    await assertNames(kyoto, locale);
    assert.equal(await kyoto.locator('a[href*="matcha="]').count(), 3);
    await noOverflow(page);
    await capture(page, `${width}-${tone}-${locale}-origins`);
  }
  const filter = kyoto.locator("select");
  await filter.selectOption("barista");
  await chooseLocale(page, "zh-Hant", "home", tone);
  assert.equal(
    await filter.inputValue(),
    "barista",
    "Origin type filters persist across language changes",
  );
  assert.equal(await kyoto.locator('a[href*="matcha="]').count(), 1);
  await filter.selectOption("");
  await kyoto
    .getByRole("button", {
      name: translate("zh-Hant", "View photographs: {title}", {
        title: translate("zh-Hant", "In the fields."),
      }),
      exact: true,
    })
    .click();
  const reader = page.locator(
    '[data-origins-entry="kyoto-field-observations"]',
  );
  await reader.waitFor();
  await page.evaluate(() => {
    window.__localeReader = document.querySelector("[data-origins-entry]");
  });
  for (const locale of locales) {
    await chooseLocale(page, locale, "home", tone);
    assert.equal(
      await page.evaluate(
        () =>
          document.querySelector("[data-origins-entry]") ===
          window.__localeReader,
      ),
      true,
      "Language switches retain the open photographic story",
    );
    await reader
      .getByRole("heading", {
        name: translate(locale, "In the fields."),
        exact: true,
        level: 1,
      })
      .waitFor();
    assert.ok(
      (await reader.textContent()).includes(
        translate(locale, "Tea fields · Kyoto"),
      ),
    );
    await noOverflow(page);
  }
  await page
    .getByRole("button", {
      name: translate("ja", "Back to {place}", {
        place: translate("ja", "Kyoto"),
      }),
      exact: true,
    })
    .click();
  await kyoto.waitFor();
}

const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  headless: true,
});
let passed = 0;
try {
  for (const profile of profiles) {
    const [widthValue, tone] = profile.split("-");
    const width = Number(widthValue);
    const { context, page, state } = await setup(browser, width, tone);
    try {
      await checkHome(page, state, width, tone);
      await checkShop(page, width, tone);
      await checkOrigins(page, width, tone);
      assert.deepEqual(state.errors, []);
      assert.deepEqual(state.writes, []);
      passed++;
      console.log(
        `PASS ${width}-${tone}: four languages, adjacent controls, cookie/SSR metadata, stable scene/selection/cart/origins, JPY and overflow`,
      );
    } catch (error) {
      await capture(page, `${width}-${tone}-failure`);
      throw error;
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
console.log(`${passed}/${profiles.length} four-language browser cases passed`);
