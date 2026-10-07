/* Translated catalog titles must preserve the current English storefront.
 * Every API request is fulfilled in memory; commerce writes are blocked. */
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
  process.env.LOCALIZATION_IDENTITY_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.LOCALIZATION_IDENTITY_EVIDENCE ?? ".local/localization-0116";
const definitions = [
  {
    id: "culinary",
    name: "Culinary Matcha",
    handle: "jmm-storefront-test-matcha",
    title: "Japanese Culinary Matcha Powder for Cafés & Baking — 1 kg",
    translatedTitle: "調理用の抹茶粉末・一キログラム",
    code: "UJI-01",
    application: "Cafés & Baking",
    purpose: "Part of the recipe.",
    aroma: "Green leaf · dry grass",
    image: "/images/matcha/culinary.jpg",
  },
  {
    id: "barista",
    name: "Barista Matcha",
    handle: "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
    title: "Japanese Barista Matcha Powder for Lattes — 1 kg",
    translatedTitle: "ミルクに合わせる抹茶・一キログラム",
    code: "UJI-00",
    application: "Lattes",
    purpose: "For the drinks you serve.",
    aroma: "Fresh green",
    image: "/images/matcha/latte.jpg",
  },
  {
    id: "ceremonial",
    name: "Ceremonial Matcha",
    handle: "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
    title: "Japanese Premium Matcha Powder for Tea Service — 1 kg",
    translatedTitle: "点てて楽しむ抹茶・一キログラム",
    code: "WZKA-00",
    application: "Tea Service",
    purpose: "Meet the matcha itself.",
    aroma: "Delicate · fresh leaf",
    image: "/images/matcha/tea-service.jpg",
  },
];
const money = (value) =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency: "JPY",
  }).format(value);

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
  const state = { translated: false, catalogReads: 0, errors: [], writes: [] };
  const products = () =>
    definitions.map((product, index) => ({
      id: product.id,
      handle: product.handle,
      title: state.translated ? product.translatedTitle : product.title,
      productCode: product.code,
      description: "Isolated localization identity fixture.",
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
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    try {
      if (!["GET", "HEAD"].includes(request.method())) {
        state.writes.push(`${request.method()} ${url.pathname}`);
        assert.fail("Commerce writes are forbidden in this browser fixture");
      }
      if (url.pathname.startsWith("/api/")) {
        assert.equal(url.origin, new URL(baseURL).origin);
        if (url.pathname === "/api/catalog") {
          state.catalogReads++;
          return route.fulfill({
            contentType: "application/json",
            json: {
              status: "ready",
              products: products(),
              shopUrl: "https://example.invalid",
            },
          });
        }
        if (url.pathname === "/api/cart")
          return route.fulfill({
            contentType: "application/json",
            json: {
              kind: "ready",
              checkoutEnabled: false,
              cart: {
                totalQuantity: 6,
                subtotalLabel: money(14400),
                totalLabel: money(14400),
                lines: products().map((product) => ({
                  lineKey: `line-${product.id}`,
                  productHandle: product.handle,
                  productTitle: product.title,
                  variantTitle: "1 kg",
                  options: product.variants[0].options,
                  quantity: 2,
                  unitPriceLabel: money(product.variants[0].priceMinor),
                  lineTotalLabel: money(product.variants[0].priceMinor * 2),
                  purchaseState: "purchasable",
                  quantityRule: { minimum: 1, maximum: 4, increment: 1 },
                  canUpdateQuantity: true,
                  canRemove: true,
                  image: null,
                })),
              },
            },
          });
        assert.fail(`Unexpected API request: ${url.pathname}`);
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

async function capture(page, label) {
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: resolve(evidence, `${label}.png`) });
}

async function assertNoOverflow(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "Current English content must retain its mobile and desktop layout",
  );
}

async function assertImage(scope, product) {
  const image = scope.locator(`img[src="${product.image}"]`).first();
  await image.scrollIntoViewIfNeeded();
  await eventually(
    () =>
      image.evaluate((element) => element.complete && element.naturalWidth > 0),
    `The ${product.name} powder photograph must load`,
  );
}

async function switchView(page, name) {
  await page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name, exact: true })
    .click();
}

async function overviewSnapshot(page, product) {
  await page.locator(`[data-homepage-product-choice="${product.id}"]`).click();
  await switchView(page, "Overview");
  const overview = page.locator('[data-homepage-view-panel="overview"]');
  await eventually(
    async () =>
      (await overview.locator("[data-homepage-product-name]").textContent()) ===
      product.name,
    `${product.name} must retain its English display name`,
  );
  assert.ok((await overview.textContent()).includes(product.application));
  assert.ok((await overview.textContent()).includes(product.purpose));
  assert.ok((await overview.textContent()).includes(product.code));
  await page.evaluate(() => document.fonts.ready);
  return overview.evaluate((element) => {
    const describe = (item) => {
      const style = getComputedStyle(item);
      const bounds = item.getBoundingClientRect();
      return {
        tag: item.tagName,
        className: item.className,
        text: item.textContent,
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        color: style.color,
        background: style.backgroundColor,
      };
    };
    return [
      describe(element),
      ...Array.from(
        element.querySelectorAll(":scope > header, :scope > p"),
      ).map(describe),
    ];
  });
}

async function runCase(browser, width, tone) {
  const { context, page, state } = await setup(browser, width, tone);
  const label = `${width}-${tone}`;
  try {
    const home = `${baseURL}/?matcha=${definitions[0].handle}`;
    const openHome = async () => {
      await page.goto(home, { waitUntil: "domcontentloaded" });
      await page
        .locator("[data-homepage-product-choice]:not(:disabled)")
        .first()
        .waitFor();
      await page.locator("[data-scene-canvas]").waitFor({ state: "attached" });
    };
    await openHome();
    const baseline = new Map();
    for (const product of definitions)
      baseline.set(product.id, await overviewSnapshot(page, product));
    state.translated = true;
    await openHome();
    const reads = state.catalogReads;
    await page.evaluate(() => {
      window.__localizationScene = document.querySelector(
        "[data-scene-canvas]",
      );
    });
    for (const product of definitions) {
      assert.deepEqual(
        await overviewSnapshot(page, product),
        baseline.get(product.id),
        "Translated upstream titles must preserve the original English Overview content, geometry and styling",
      );
      await switchView(page, "Specifications");
      const specifications = page.locator("[data-focused-specifications]");
      assert.equal(
        await specifications
          .locator("[data-focused-product-name]")
          .textContent(),
        product.name,
      );
      assert.equal(
        await specifications
          .getByRole("button", {
            name: `Aroma: ${product.aroma}. Read explanation`,
            exact: true,
          })
          .count(),
        1,
      );
      await switchView(page, "Shop");
      const shop = page.locator("[data-shop-exploration]");
      await shop
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      const quantity = Number(
        await shop.getByLabel("Quantity", { exact: true }).textContent(),
      );
      assert.ok(quantity > 1);
      const labelNames = await page
        .locator('[data-label-card] [data-label-field="name"]')
        .allTextContents();
      assert.ok(labelNames.length > 0);
      assert.ok(labelNames.every((name) => name === product.name));
      await switchView(page, "Origin");
      const origins = page.locator('[data-origin-preview="panorama"]');
      assert.equal(
        await origins.locator("[data-homepage-product-name]").textContent(),
        product.name,
      );
      assert.equal(
        await origins
          .locator(
            product.id === "ceremonial"
              ? '[data-origin-place="wazuka"]'
              : '[data-origin-designation="uji-tea"]',
          )
          .count(),
        1,
      );
      await switchView(page, "Shop");
      assert.equal(
        Number(
          await shop.getByLabel("Quantity", { exact: true }).textContent(),
        ),
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
            window.__localizationScene,
        ),
        true,
      );
      if (product.id === "barista") await capture(page, `${label}-home`);
    }
    assert.equal(
      state.catalogReads,
      reads,
      "View changes retain the existing catalog and selection",
    );
    await assertNoOverflow(page);

    await page.goto(`${baseURL}/shop`, { waitUntil: "domcontentloaded" });
    for (const product of definitions) {
      const card = page.locator(`[data-shop-product="${product.id}"]`);
      await card
        .getByRole("link", { name: `View ${product.name}`, exact: true })
        .waitFor();
      assert.ok((await card.textContent()).includes(product.application));
      assert.ok((await card.textContent()).includes(`[${product.code}]`));
      await assertImage(card, product);
    }
    await page
      .locator('[data-shop-product="culinary"]')
      .scrollIntoViewIfNeeded();
    await capture(page, `${label}-shop`);
    for (const product of definitions) {
      await page.goto(`${baseURL}/shop/${product.handle}`, {
        waitUntil: "domcontentloaded",
      });
      const main = page.locator("main[data-retail-product]");
      const purchase = main.getByRole("region", {
        name: `Purchase ${product.name}`,
        exact: true,
      });
      await purchase
        .getByRole("heading", { name: product.name, exact: true, level: 1 })
        .waitFor();
      assert.ok((await purchase.textContent()).includes(product.application));
      assert.ok((await purchase.textContent()).includes(product.purpose));
      await assertImage(main.locator("figure").first(), product);
      await assertNoOverflow(page);
      if (product.id === "barista") await capture(page, `${label}-retail`);
    }

    await page.goto(`${baseURL}/origins`, { waitUntil: "domcontentloaded" });
    const directory = page.locator('[data-origins-directory="all"]');
    await eventually(
      () =>
        directory
          .getByRole("heading", { name: "Growing places", exact: true })
          .evaluate((element) => element === document.activeElement),
      "The Origins directory must finish hydrating before navigation",
    );
    await directory.locator('[data-origin-place="kyoto"]').click();
    const kyoto = page.locator('[data-origins-directory="kyoto"]');
    const links = kyoto.locator('a[href*="matcha="]');
    await eventually(
      async () => (await links.count()) === 3,
      "Kyoto must retain all three matchas",
    );
    for (const product of definitions) {
      const link = links.filter({ hasText: product.name });
      assert.equal(await link.count(), 1);
      assert.ok((await link.textContent()).includes(product.application));
      assert.equal(
        new URL(await link.getAttribute("href"), baseURL).searchParams.get(
          "matcha",
        ),
        product.handle,
      );
      await assertImage(link, product);
    }
    await links.first().scrollIntoViewIfNeeded();
    await capture(page, `${label}-origins`);
    await assertNoOverflow(page);

    await page.getByRole("button", { name: /^Open cart,/ }).click();
    const cart = page.getByRole("dialog", { name: /Your\s+selection\./ });
    await cart.waitFor();
    for (const product of definitions) {
      await cart
        .getByRole("heading", { name: product.name, exact: true, level: 3 })
        .waitFor();
      assert.equal(
        await cart
          .getByLabel(`${product.name} quantity`, { exact: true })
          .textContent(),
        "2",
      );
      for (const name of [
        `Decrease ${product.name} quantity`,
        `Increase ${product.name} quantity`,
        `Remove ${product.name}`,
      ])
        assert.equal(
          await cart.getByRole("button", { name, exact: true }).isEnabled(),
          true,
        );
      assert.ok(!(await cart.textContent()).includes(product.translatedTitle));
    }
    assert.equal(
      await cart
        .getByRole("button", { name: "Checkout", exact: true })
        .isDisabled(),
      true,
    );
    await capture(page, `${label}-cart`);
    await page.keyboard.press("Escape");
    await cart.waitFor({ state: "hidden" });
    assert.deepEqual(state.errors, []);
    assert.deepEqual(state.writes, []);
  } catch (error) {
    await capture(page, `${label}-failure`);
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
      await runCase(browser, width, tone);
      passed++;
      console.log(
        `PASS ${width}-${tone}: translated titles, English layout, product identity, imagery, Origins, cart labels and state`,
      );
    }
  }
} finally {
  await browser.close();
}
console.log(`${passed}/4 localization identity browser cases passed`);
