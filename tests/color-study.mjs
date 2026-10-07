/* Current-site palette comparisons. Every catalog and cart request is mocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.COLOR_STUDY_BASE_URL ?? "http://127.0.0.1:3100";
const screenshots = process.env.COLOR_STUDY_SCREENSHOTS;
const money = (amount) => `¥${amount.toLocaleString("en")}`;
const variant = (letter, title, priceMinor, rules = {}) => ({
  id: `v1_${letter.repeat(43)}`,
  title,
  available: true,
  priceMinor,
  currency: "JPY",
  options: [{ name: "Format", value: title }],
  minimum: 1,
  maximum: 4,
  increment: 1,
  ...rules,
});
const products = [
  {
    id: "culinary",
    title: "Japanese Culinary Matcha Powder for Cafés & Baking — 1 kg",
    variants: [
      variant("a", "1 kg", 1200),
      variant("b", "5 × 1 kg", 6000, {
        minimum: 5,
        maximum: 15,
        increment: 5,
      }),
    ],
  },
  {
    id: "barista",
    title: "Japanese Barista Matcha Powder for Lattes — 1 kg",
    variants: [variant("c", "1 kg", 2400)],
  },
  {
    id: "premium",
    title: "Japanese Premium Matcha Powder for Tea Service — 1 kg",
    variants: [variant("d", "1 kg", 3600, { available: false })],
  },
].map((product) => ({
  ...product,
  handle: {
    culinary: "jmm-storefront-test-matcha",
    barista: "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
    premium: "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
  }[product.id],
  description: "Catalog content supplied by this isolated browser fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
}));

async function setup(browser, width, height, contextOptions = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: width > 760 ? "no-preference" : "reduce",
    colorScheme: "dark",
    ...contextOptions,
  });
  const state = {
    actions: [],
    errors: [],
    catalogReads: 0,
    catalogMode: "ready",
    catalogGate: null,
    gate: null,
    nextMutation: "success",
  };
  let cart = null;
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const respond = (json, status = 200) =>
      route.fulfill({ status, contentType: "application/json", json });
    try {
      if (url.pathname.startsWith("/api/")) {
        assert.equal(url.origin, new URL(baseURL).origin);
        if (url.pathname === "/api/catalog" && request.method() === "GET") {
          state.catalogReads++;
          if (state.catalogGate) await state.catalogGate;
          if (state.catalogMode === "unavailable")
            return respond(
              {
                status: "unavailable",
                products: [],
                shopUrl: "https://example.invalid",
              },
              503,
            );
          return respond({
            status: state.catalogMode === "empty" ? "empty" : "ready",
            products: state.catalogMode === "empty" ? [] : products,
            shopUrl: "https://example.invalid",
          });
        }
        if (url.pathname === "/api/cart" && request.method() === "GET")
          return respond(
            cart
              ? { kind: "ready", cart, checkoutEnabled: false }
              : { kind: "empty", checkoutEnabled: false },
          );
        if (url.pathname === "/api/cart" && request.method() === "POST") {
          const action = request.postDataJSON();
          state.actions.push(action);
          assert.equal(action.action, "add");
          const product = products.find(
            (item) => item.handle === action.productHandle,
          );
          const format = product?.variants.find(
            (item) => item.id === action.variantKey,
          );
          assert.ok(format?.available);
          assert.ok(Number.isSafeInteger(action.quantity));
          assert.ok(
            action.quantity >= format.minimum &&
              action.quantity <= format.maximum,
          );
          assert.equal(
            (action.quantity - format.minimum) % format.increment,
            0,
          );
          if (state.gate) await state.gate;
          if (state.nextMutation === "rejected") {
            state.nextMutation = "success";
            return respond({ kind: "rejected", checkoutEnabled: false });
          }
          cart = {
            totalQuantity: action.quantity,
            subtotalLabel: money(format.priceMinor * action.quantity),
            totalLabel: money(format.priceMinor * action.quantity),
            lines: [
              {
                lineKey: "mock-line",
                productHandle: product.handle,
                productTitle: product.title,
                variantTitle: format.title,
                options: format.options,
                quantity: action.quantity,
                unitPriceLabel: money(format.priceMinor),
                lineTotalLabel: money(format.priceMinor * action.quantity),
                purchaseState: "purchasable",
                quantityRule: {
                  minimum: format.minimum,
                  maximum: format.maximum,
                  increment: format.increment,
                },
                canUpdateQuantity: true,
                canRemove: true,
                image: null,
              },
            ],
          };
          return respond({ kind: "success", cart, checkoutEnabled: false });
        }
        assert.fail(
          `Unexpected API request: ${request.method()} ${url.pathname}`,
        );
      }
      assert.ok(
        ["GET", "HEAD"].includes(request.method()),
        "All writes must use the mocked cart",
      );
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

async function eventually(check, message) {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function capture(page, name) {
  if (!screenshots) return;
  await page.locator("dialog[open]").evaluateAll((dialogs) =>
    Promise.all(
      dialogs
        .flatMap((dialog) => dialog.getAnimations({ subtree: true }))
        .filter(
          (animation) => animation.effect?.getTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => {})),
    ),
  );
  await eventually(
    () =>
      page
        .locator("[data-scramble-glyph]")
        .evaluateAll((glyphs) =>
          glyphs.every(
            (glyph) =>
              !glyph.getClientRects().length ||
              glyph.textContent === glyph.previousElementSibling?.textContent,
          ),
        ),
    "Visible text must settle before screenshots",
  );
  await mkdir(screenshots, { recursive: true });
  await page.screenshot({ path: resolve(screenshots, `${name}.png`) });
}

async function selectView(page, name) {
  const mode = name === "Shop" ? "builder" : name.toLowerCase();
  await page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name, exact: true })
    .click();
  await page.locator(`[data-embedded][data-mode="${mode}"]`).waitFor();
  await eventually(
    () =>
      page
        .locator("[data-selection-controls] h2")
        .evaluateAll((headings) =>
          headings.some(
            (heading) =>
              heading.getClientRects().length &&
              heading === document.activeElement,
          ),
        ),
    "View navigation must finish its heading focus before keyboard interaction",
  );
}

async function chooseProduct(page, name) {
  const choice = page
    .getByRole("group", { name: "Matcha to explore", exact: true })
    .getByRole("button", { name: `Select ${name} Matcha`, exact: true });
  await choice.click();
  assert.equal(await choice.getAttribute("aria-pressed"), "true");
}

async function chooseFormat(page, index) {
  const format = products[0].variants[index];
  const menu = page.getByRole("combobox", { name: "Format", exact: true });
  const radio = page.locator(`[data-shop-format] input[value="${format.id}"]`);
  if (await menu.count()) await menu.selectOption(format.id);
  else if (await radio.count()) {
    await radio.locator("..").click();
    assert.equal(await radio.isChecked(), true);
  } else
    await page.getByRole("button", { name: format.title, exact: true }).click();
}

async function assertOrder(page, quantity, formatIndex = 1) {
  assert.equal(
    Number(await page.getByLabel("Quantity", { exact: true }).textContent()),
    quantity,
  );
  const format = products[0].variants[formatIndex];
  const menu = page.getByRole("combobox", { name: "Format", exact: true });
  const radio = page.locator(`[data-shop-format] input[value="${format.id}"]`);
  if (await menu.count()) assert.equal(await menu.inputValue(), format.id);
  else if (await radio.count()) assert.equal(await radio.isChecked(), true);
  else
    assert.equal(
      await page
        .getByRole("button", { name: format.title, exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
  const summary = page.locator("[data-shop-order-summary] p");
  if (await summary.count())
    assert.equal(await summary.textContent(), `${format.title} × ${quantity}`);
  const total = page.locator("[data-shop-total]");
  assert.equal(
    await total.count(),
    1,
    "Each purchase view exposes its actual order total",
  );
  assert.match(
    await total.textContent(),
    new RegExp(money(format.priceMinor * quantity)),
  );
}

async function assertNoOverflow(page) {
  const sizes = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(
    Math.max(sizes.document, sizes.body) <= sizes.viewport + 1,
    `The color study must fit horizontally: ${JSON.stringify(sizes)}`,
  );
}

async function assertEssentialsFit(page) {
  const controls = page.locator("[data-selection-controls]");
  await controls.evaluate((element) => {
    for (let parent = element; parent; parent = parent.parentElement)
      parent.scrollTop = 0;
    const scroller = element.querySelector("[data-selection-scroll]");
    if (scroller) scroller.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  const essentials = [
    controls.locator("h2:visible").first(),
    page.getByLabel("Quantity", { exact: true }),
    page.getByRole("button", { name: "Increase quantity", exact: true }),
    page.getByRole("button", { name: "Add to cart", exact: true }),
  ];
  const format = page.getByRole("combobox", { name: "Format", exact: true });
  if (await format.count()) essentials.push(format);
  else {
    const choices = page.getByRole("radiogroup", {
      name: "Format",
      exact: true,
    });
    essentials.push(
      (await choices.count())
        ? choices
        : page.getByRole("group", { name: "Format", exact: true }),
    );
  }
  const total = page.locator("[data-shop-total]");
  if (await total.count()) essentials.push(total);
  for (const element of essentials) {
    const bounds = await element.boundingBox();
    const viewport = page.viewportSize();
    assert.ok(
      bounds &&
        bounds.x >= -1 &&
        bounds.x + bounds.width <= viewport.width + 1 &&
        bounds.y >= -1 &&
        bounds.y + bounds.height <= viewport.height + 1,
      `Purchase essentials must fit without scrolling: ${JSON.stringify(bounds)}`,
    );
  }
  for (const control of [
    page.getByRole("button", { name: "Increase quantity", exact: true }),
    page.getByRole("button", { name: "Add to cart", exact: true }),
  ]) {
    assert.equal(
      await control.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return element.contains(
          document.elementFromPoint(
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2,
          ),
        );
      }),
      true,
      "Purchase controls must remain exposed to pointer interaction",
    );
  }
  await assertNoOverflow(page);
}

const palettes = [
  { value: "mist", name: "Mist", tone: "light" },
  { value: "blue-hour", name: "Blue hour", tone: "dark" },
];

async function selectPalette(page, palette) {
  const button = page.getByRole("button", {
    name: palette.name,
    exact: true,
  });
  await button.click();
  await page
    .locator(`[data-color-study][data-palette="${palette.value}"]`)
    .waitFor();
  assert.equal(await button.getAttribute("aria-pressed"), "true");
  assert.equal(new URL(page.url()).pathname, "/color-study");
  await page.locator(`main[data-tone="${palette.tone}"]`).waitFor();
}

async function appearance(element) {
  return element.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      color: style.color,
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      colorScheme: style.colorScheme,
    };
  });
}

async function showMenu(page) {
  const theme = page.getByRole("switch", { name: "Dark mode", exact: true });
  if (await theme.count())
    await eventually(
      () => theme.isEnabled(),
      "The storefront header must be hydrated",
    );
  const menu = page.locator('main > header summary[aria-label="Menu"]');
  if (!(await menu.isVisible())) return;
  if (
    !(await menu.evaluate((element) =>
      element.parentElement.hasAttribute("open"),
    ))
  ) {
    await menu.focus();
    await page.keyboard.press("Enter");
    await page.locator("main > header [data-navigation-index][open]").waitFor();
  }
}

async function setStorefrontTone(page, tone) {
  const control = page.getByRole("switch", { name: "Dark mode", exact: true });
  await control.waitFor();
  if ((await control.getAttribute("aria-checked")) !== String(tone === "dark"))
    await control.click();
  await page.locator(`main[data-storefront-theme="${tone}"]`).waitFor();
  assert.equal(
    await control.getAttribute("aria-checked"),
    String(tone === "dark"),
  );
}

async function overlays(page, palette, width, pathname = "/color-study") {
  await showMenu(page);
  await page.getByRole("button", { name: "About ATOMA", exact: true }).click();
  const about = page.getByRole("dialog", {
    name: /A closer look\s+at matcha\./,
  });
  await about.waitFor();
  const aboutAppearance = await appearance(about);
  await capture(page, `${width}-${palette.value}-about`);
  await page.keyboard.press("Escape");
  await about.waitFor({ state: "hidden" });

  await page.getByRole("button", { name: /^Open cart,/ }).click();
  const cart = page.getByRole("dialog", { name: /Your\s+selection\./ });
  await cart.waitFor();
  const cartAppearance = await appearance(cart);
  assert.equal(cartAppearance.colorScheme, palette.tone);
  await capture(page, `${width}-${palette.value}-cart`);
  await cart.getByRole("button", { name: "Close cart", exact: true }).click();
  await cart.waitFor({ state: "hidden" });

  await selectView(page, "Origin");
  const origin = page.locator(
    `[data-origin-preview="${pathname === "/" ? "panorama" : "split"}"]`,
  );
  await origin.waitFor();
  await capture(page, `${width}-${palette.value}-origins`);
  const trigger = origin.getByRole("button", {
    name: "About Uji",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const reader = page.getByRole("dialog", {
    name: "ATOMA Origins",
    exact: true,
  });
  await reader.waitFor();
  const readerAppearance = await appearance(
    reader.locator("[data-origins-content]"),
  );
  assert.equal(readerAppearance.colorScheme, palette.tone);
  await capture(page, `${width}-${palette.value}-reader`);
  await reader
    .getByRole("button", { name: "Return to Culinary Matcha", exact: true })
    .click();
  await reader.waitFor({ state: "hidden" });
  await eventually(
    () => new URL(page.url()).hash === "",
    "Reader return restores the palette study URL",
  );
  assert.equal(new URL(page.url()).pathname, pathname);
  if (pathname === "/color-study")
    assert.equal(
      await page.locator("[data-color-study]").getAttribute("data-palette"),
      palette.value,
      "Origins return preserves the chosen palette",
    );
  assert.equal(
    await page.locator("main").getAttribute("data-tone"),
    palette.tone,
  );
  assert.equal(
    await trigger.evaluate((element) => element === document.activeElement),
    true,
    "Origins return restores keyboard focus to its trigger",
  );
  await selectView(page, "Shop");
  await assertOrder(page, 10);
  return {
    about: aboutAppearance,
    cart: cartAppearance,
    reader: readerAppearance,
  };
}

async function reportFailure(page, state, name) {
  console.error(
    JSON.stringify({
      url: page.url(),
      errors: state.errors,
      catalogReads: state.catalogReads,
    }),
  );
  if (screenshots) {
    await mkdir(screenshots, { recursive: true });
    await page.screenshot({
      path: resolve(screenshots, `${name}-failure.png`),
    });
  }
}

const cases = [1366, 320].map((width) => [
  `color study ${width}: palettes retain the current flow, overlays and guarded order`,
  async (browser) => {
    const { context, page, state } = await setup(
      browser,
      width,
      width === 1366 ? 768 : 700,
    );
    try {
      await page.goto(`${baseURL}/color-study`, {
        waitUntil: "domcontentloaded",
      });
      await page.locator('[data-color-study][data-palette="mist"]').waitFor();
      // The hero prepares its material scene from an idle effect. Its arrival
      // confirms hydration before exercising the server-rendered toolbar.
      await page.locator("[data-renderer]").waitFor({ state: "attached" });
      assert.equal(
        await page.locator("main").getAttribute("data-exploring"),
        "false",
      );
      await page
        .locator('main > header[data-navigation-variant="default"]')
        .waitFor();
      const heroAppearances = [];
      for (const palette of palettes) {
        await selectPalette(page, palette);
        heroAppearances.push(await appearance(page.locator("main")));
        await assertNoOverflow(page);
        await capture(page, `${width}-${palette.value}-hero`);
      }
      assert.notDeepEqual(
        heroAppearances[0],
        heroAppearances[1],
        "The two palettes visibly differ",
      );
      await page
        .getByRole("button", {
          name: "Explore matcha from the tray",
          exact: true,
        })
        .click();
      await page.locator('main[data-handoff="complete"]').waitFor();
      const experience = page.locator("[data-embedded]");
      for (const [attribute, value] of Object.entries({
        "data-selector-placement": "left",
        "data-selector-variant": "slides",
        "data-section-selector-variant": "tabs",
        "data-shop-preview-variant": "refined",
      }))
        assert.equal(await experience.getAttribute(attribute), value);
      await chooseProduct(page, "Barista");
      await chooseProduct(page, "Culinary");
      await selectView(page, "Shop");
      await assertOrder(page, 1, 0);
      await chooseFormat(page, 1);
      const increase = page.getByRole("button", {
        name: "Increase quantity",
        exact: true,
      });
      const decrease = page.getByRole("button", {
        name: "Decrease quantity",
        exact: true,
      });
      assert.equal(await decrease.isDisabled(), true);
      await increase.click();
      await increase.click();
      await assertOrder(page, 15);
      assert.equal(await increase.isDisabled(), true);
      await decrease.click();
      await assertOrder(page, 10);
      const reference = "COLOR / TASTING";
      if (width > 760) {
        await page
          .getByRole("button", { name: "Add label reference", exact: true })
          .click();
        await page
          .getByRole("textbox", { name: "Your reference", exact: true })
          .fill(reference);
        await page.getByRole("button", { name: "Done", exact: true }).click();
        await page
          .getByRole("textbox", { name: "Your reference", exact: true })
          .waitFor({ state: "hidden" });
      }
      await page.locator("[data-renderer]").waitFor({ state: "attached" });
      await page.evaluate(() => {
        window.__colorHero = document.querySelector("main");
        window.__colorScene = document.querySelector("[data-renderer]");
        window.__colorLabel = document.querySelector("[data-label-card]");
      });
      const overlayAppearances = [];
      for (const palette of palettes) {
        const reads = state.catalogReads;
        await selectPalette(page, palette);
        await assertOrder(page, 10);
        assert.equal(
          await page
            .getByRole("button", {
              name: "Select Culinary Matcha",
              exact: true,
            })
            .getAttribute("aria-pressed"),
          "true",
        );
        await assertEssentialsFit(page);
        assert.notEqual(
          (await appearance(page.locator("main"))).backgroundImage,
          "none",
          "The selection palette must resolve to a valid background image",
        );
        await capture(page, `${width}-${palette.value}-shop`);
        await selectView(page, "Overview");
        await capture(page, `${width}-${palette.value}-overview`);
        await selectView(page, "Specifications");
        assert.equal(await page.locator("[data-specification]").count(), 7);
        await capture(page, `${width}-${palette.value}-specifications`);
        assert.equal(
          state.catalogReads,
          reads,
          "Palette and section changes must not reload the selected catalog",
        );
        overlayAppearances.push(await overlays(page, palette, width));
        if (width > 760)
          assert.equal(
            await page.locator('[data-label-field="reference"]').textContent(),
            reference,
          );
      }
      for (const overlay of ["about", "cart", "reader"]) {
        assert.notDeepEqual(
          overlayAppearances[0][overlay],
          overlayAppearances[1][overlay],
          `${overlay} follows the selected palette`,
        );
      }
      assert.equal(
        await page.evaluate(
          () =>
            window.__colorHero === document.querySelector("main") &&
            window.__colorScene === document.querySelector("[data-renderer]") &&
            window.__colorLabel === document.querySelector("[data-label-card]"),
        ),
        true,
        "The hero, material renderer and label remain mounted throughout comparison",
      );

      let release;
      state.gate = new Promise((done) => {
        release = done;
      });
      try {
        await page
          .getByRole("button", { name: "Add to cart", exact: true })
          .dblclick();
        await eventually(
          () => state.actions.length === 1,
          "Only one cart request starts",
        );
        for (const palette of palettes)
          assert.equal(
            await page
              .getByRole("button", { name: palette.name, exact: true })
              .isDisabled(),
            true,
          );
        for (const control of [increase, decrease])
          assert.equal(await control.isDisabled(), true);
        for (const group of ["Shopping mode", "Matcha to explore"]) {
          for (const control of await page
            .getByRole("group", { name: group, exact: true })
            .getByRole("button")
            .all())
            assert.equal(await control.isDisabled(), true);
        }
        assert.equal(
          await page
            .getByRole("button", { name: "Adding…", exact: true })
            .isDisabled(),
          true,
        );
        assert.equal(state.actions.length, 1);
        assert.deepEqual(state.actions[0], {
          action: "add",
          productHandle: products[0].handle,
          variantKey: products[0].variants[1].id,
          quantity: 10,
        });
      } finally {
        release();
        state.gate = null;
      }
      const cart = page.getByRole("dialog", { name: /Your\s+selection\./ });
      await cart.waitFor();
      await capture(page, `${width}-blue-hour-cart-added`);
      await cart
        .getByRole("button", { name: "Close cart", exact: true })
        .click();
      await cart.waitFor({ state: "hidden" });
      await eventually(
        () =>
          page.getByRole("button", { name: "Mist", exact: true }).isEnabled(),
        "Palette controls unlock after the cart request",
      );
      await selectPalette(page, palettes[0]);
      await assertOrder(page, 10);
      assert.deepEqual(state.errors, []);
    } catch (error) {
      await reportFailure(page, state, String(width));
      throw error;
    } finally {
      await context.close();
    }
  },
]);

cases.push([
  "color study: deep links, reload and saved study defaults stay isolated",
  async (browser) => {
    const { context, page, state } = await setup(browser, 1366, 768);
    try {
      const original = new Map();
      await page.goto(baseURL, { waitUntil: "domcontentloaded" });
      await page.locator("[data-renderer]").waitFor({ state: "attached" });
      for (const palette of palettes) {
        await setStorefrontTone(page, palette.tone);
        original.set(palette.tone, await appearance(page.locator("main")));
      }
      await page.goto(
        `${baseURL}/color-study?palette=blue-hour&matcha=${products[1].handle}`,
        { waitUntil: "domcontentloaded" },
      );
      await page
        .locator('[data-color-study][data-palette="blue-hour"]')
        .waitFor();
      await page.locator('main[data-handoff="complete"]').waitFor();
      await eventually(
        () =>
          page
            .getByRole("button", { name: "Select Barista Matcha", exact: true })
            .getAttribute("aria-pressed")
            .then((value) => value === "true"),
        "The matcha deep link selects its requested product",
      );
      await selectPalette(page, palettes[0]);
      assert.equal(
        new URL(page.url()).searchParams.get("matcha"),
        products[1].handle,
      );
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.locator('[data-color-study][data-palette="mist"]').waitFor();
      await eventually(
        () =>
          page
            .getByRole("button", { name: "Select Barista Matcha", exact: true })
            .getAttribute("aria-pressed")
            .then((value) => value === "true"),
        "Reloading preserves the matcha and selected palette deep link",
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Select Barista Matcha", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      await page.goto(baseURL, { waitUntil: "domcontentloaded" });
      await page.locator('[data-storefront-theme="dark"]').waitFor();
      for (const palette of palettes) {
        await page.goto(baseURL, { waitUntil: "domcontentloaded" });
        await page.locator("[data-renderer]").waitFor({ state: "attached" });
        await setStorefrontTone(page, palette.tone);
        assert.deepEqual(
          await appearance(page.locator("main")),
          original.get(palette.tone),
          "Visiting the color study does not change the adopted homepage palette",
        );
        assert.equal(await page.locator("[data-color-study]").count(), 0);
        await page.locator("[data-renderer]").waitFor({ state: "attached" });
        await page
          .getByRole("button", {
            name: "Explore matcha from the tray",
            exact: true,
          })
          .click();
        await page.locator('main[data-handoff="complete"]').waitFor();
        const experience = page.locator("[data-embedded]");
        assert.equal(
          await experience.getAttribute("data-shop-preview-variant"),
          "refined",
        );
        assert.equal(
          await experience.getAttribute("data-selector-placement"),
          "left",
        );
      }
      await page.goto(`${baseURL}/shop-study`, {
        waitUntil: "domcontentloaded",
      });
      await page.locator('[data-shop-preview="open"]').waitFor();
      assert.equal(
        await page
          .getByRole("combobox", { name: "Shop layout", exact: true })
          .inputValue(),
        "open",
      );
      await page.goto(`${baseURL}/origins-study`, {
        waitUntil: "domcontentloaded",
      });
      await page.locator('[data-origin-preview="panorama"]').waitFor();
      assert.equal(
        await page
          .getByRole("combobox", { name: "Origins layout", exact: true })
          .inputValue(),
        "panorama",
      );
      await page.goto(`${baseURL}/color-study?palette=unknown`, {
        waitUntil: "domcontentloaded",
      });
      await page.locator('[data-color-study][data-palette="mist"]').waitFor();
      assert.deepEqual(state.actions, []);
      assert.deepEqual(state.errors, []);
    } catch (error) {
      await reportFailure(page, state, "isolation");
      throw error;
    } finally {
      await context.close();
    }
  },
]);

for (const width of [1366, 320]) {
  cases.push([
    `adopted themes ${width}: approved palettes preserve the mounted storefront and order`,
    async (browser) => {
      const { context, page, state } = await setup(
        browser,
        width,
        width === 1366 ? 768 : 700,
      );
      try {
        const approved = new Map();
        for (const palette of palettes) {
          await page.goto(`${baseURL}/color-study?palette=${palette.value}`, {
            waitUntil: "domcontentloaded",
          });
          await page.locator("[data-renderer]").waitFor({ state: "attached" });
          const hero = await appearance(page.locator("main"));
          await page
            .getByRole("button", {
              name: "Explore matcha from the tray",
              exact: true,
            })
            .click();
          await page.locator('main[data-handoff="complete"]').waitFor();
          approved.set(palette.value, {
            hero,
            selection: await appearance(page.locator("main")),
          });
        }

        await page.goto(baseURL, { waitUntil: "domcontentloaded" });
        await page.locator("[data-renderer]").waitFor({ state: "attached" });
        for (const palette of [...palettes].reverse()) {
          await setStorefrontTone(page, palette.tone);
          assert.equal(new URL(page.url()).pathname, "/");
          assert.equal(
            await page.locator("main").getAttribute("data-storefront-theme"),
            palette.tone,
          );
          assert.deepEqual(
            await appearance(page.locator("main")),
            approved.get(palette.value).hero,
            `${palette.name} is the regular ${palette.tone} homepage`,
          );
          assert.equal(await page.locator("[data-color-study]").count(), 0);
          await assertNoOverflow(page);
          await capture(page, `adopted-${width}-${palette.value}-hero`);
        }
        await page
          .getByRole("button", {
            name: "Explore matcha from the tray",
            exact: true,
          })
          .click();
        await page.locator('main[data-handoff="complete"]').waitFor();
        await chooseProduct(page, "Barista");
        await chooseProduct(page, "Culinary");
        await selectView(page, "Shop");
        await chooseFormat(page, 1);
        await page
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        await assertOrder(page, 10);
        const reference = "Adopted / Spring 02";
        if (width > 760) {
          await page
            .getByRole("button", { name: "Add label reference", exact: true })
            .click();
          await page
            .getByRole("textbox", { name: "Your reference", exact: true })
            .fill(reference);
          await page.getByRole("button", { name: "Done", exact: true }).click();
          await page
            .getByRole("textbox", { name: "Your reference", exact: true })
            .waitFor({ state: "hidden" });
        }
        await page.evaluate(() => {
          window.__adoptedHero = document.querySelector("main");
          window.__adoptedScene = document.querySelector("[data-renderer]");
          window.__adoptedLabel = document.querySelector("[data-label-card]");
        });
        const overlayAppearances = [];
        for (const palette of [...palettes].reverse()) {
          const reads = state.catalogReads;
          const pathname = "/";
          await setStorefrontTone(page, palette.tone);
          assert.equal(new URL(page.url()).pathname, pathname);
          assert.deepEqual(
            await appearance(page.locator("main")),
            approved.get(palette.value).selection,
            "The adopted selection background matches its approved exploration",
          );
          await assertOrder(page, 10);
          assert.equal(
            await page
              .getByRole("button", {
                name: "Select Culinary Matcha",
                exact: true,
              })
              .getAttribute("aria-pressed"),
            "true",
          );
          if (width > 760) await assertEssentialsFit(page);
          await assertNoOverflow(page);
          await capture(page, `adopted-${width}-${palette.value}-shop`);
          assert.equal(
            state.catalogReads,
            reads,
            "Changing appearance must not reload the selected catalog",
          );
          overlayAppearances.push(
            await overlays(page, palette, `adopted-${width}`, pathname),
          );
          if (width > 760)
            assert.equal(
              await page
                .locator('[data-label-field="reference"]')
                .textContent(),
              reference,
            );
        }
        for (const overlay of ["about", "cart", "reader"])
          assert.notDeepEqual(
            overlayAppearances[0][overlay],
            overlayAppearances[1][overlay],
            `${overlay} follows the adopted light and dark themes`,
          );
        assert.equal(
          await page.evaluate(
            () =>
              window.__adoptedHero === document.querySelector("main") &&
              window.__adoptedScene ===
                document.querySelector("[data-renderer]") &&
              window.__adoptedLabel ===
                document.querySelector("[data-label-card]"),
          ),
          true,
          "Theme switching retains the live material scene and label",
        );
        await page
          .getByRole("button", { name: "Add to cart", exact: true })
          .click();
        const cart = page.getByRole("dialog", { name: /Your\s+selection\./ });
        await cart.waitFor();
        assert.equal((await appearance(cart)).colorScheme, "light");
        assert.deepEqual(state.actions, [
          {
            action: "add",
            productHandle: products[0].handle,
            variantKey: products[0].variants[1].id,
            quantity: 10,
          },
        ]);
        await page.keyboard.press("Escape");
        await cart.waitFor({ state: "hidden" });
        assert.deepEqual(state.errors, []);
      } catch (error) {
        await reportFailure(page, state, `adopted-${width}`);
        throw error;
      } finally {
        await context.close();
      }
    },
  ]);
}

cases.push([
  "adopted themes: Origins routes follow the palette and saved concepts stay independent",
  async (browser) => {
    const { context, page, state } = await setup(browser, 390, 844);
    try {
      const approved = new Map();
      for (const palette of palettes) {
        await page.goto(`${baseURL}/color-study?palette=${palette.value}`, {
          waitUntil: "domcontentloaded",
        });
        await page.locator(`main[data-tone="${palette.tone}"]`).waitFor();
        approved.set(
          palette.tone,
          await page.evaluate(() => {
            const style = getComputedStyle(document.body);
            return [
              "--color-surface",
              "--color-ink",
              "--color-muted",
              "--color-panel",
            ].map((property) => style.getPropertyValue(property).trim());
          }),
        );
      }
      for (const palette of palettes) {
        await page.goto(`${baseURL}/origins`, {
          waitUntil: "domcontentloaded",
        });
        await page.locator("[data-origins-content]").waitFor();
        await setStorefrontTone(page, palette.tone);
        assert.equal(
          await page.locator("main").getAttribute("data-storefront-theme"),
          palette.tone,
        );
        assert.deepEqual(
          await page.evaluate(() => {
            const style = getComputedStyle(document.body);
            return [
              "--color-surface",
              "--color-ink",
              "--color-muted",
              "--color-panel",
            ].map((property) => style.getPropertyValue(property).trim());
          }),
          approved.get(palette.tone),
          "Standalone Origins uses the approved storefront palette",
        );
        assert.equal(
          (await appearance(page.locator("[data-origins-content]")))
            .colorScheme,
          palette.tone,
        );
        await assertNoOverflow(page);
        await capture(page, `adopted-390-${palette.value}-origins-page`);
      }
      for (const pathname of [
        "/concept-02",
        "/concept-03",
        "/concept-03/light",
        "/concept-04",
        "/concept-08",
        "/concept-09",
        "/navigation-study",
        "/selector-study",
        "/shop-study",
        "/origins-study",
      ]) {
        await page.goto(`${baseURL}${pathname}`, {
          waitUntil: "domcontentloaded",
        });
        await page.locator("main").waitFor();
        assert.equal(
          await page.locator("[data-storefront-theme]").count(),
          0,
          `${pathname} retains its independent theme`,
        );
        assert.equal(
          await page
            .getByRole("switch", { name: "Dark mode", exact: true })
            .count(),
          0,
          "Saved concepts and studies retain their own appearance controls",
        );
        assert.deepEqual(
          await page.evaluate(() => {
            const style = getComputedStyle(document.body);
            return {
              palette: style.getPropertyValue("--color-surface").trim(),
              dark: style.getPropertyValue("--night-surface").trim(),
              light: style.getPropertyValue("--lab-surface").trim(),
            };
          }),
          { palette: "", dark: "#101213", light: "#e9eae3" },
          "Adopted palette tokens cannot leak into saved concepts or layout studies",
        );
      }
      assert.deepEqual(state.actions, []);
      assert.deepEqual(state.errors, []);
    } catch (error) {
      await reportFailure(page, state, "adopted-isolation");
      throw error;
    } finally {
      await context.close();
    }
  },
]);

for (const width of [1366, 320]) {
  cases.push([
    `regular theme ${width}: light default, keyboard switch, persistence and canonical routes`,
    async (browser) => {
      const height = width === 1366 ? 768 : 700;
      const { context, page, state } = await setup(browser, width, height);
      let savedState;
      try {
        const response = await page.goto(`${baseURL}/?ref=theme-check`, {
          waitUntil: "domcontentloaded",
        });
        assert.match(await response.text(), /data-storefront-theme="light"/);
        await page.locator('main[data-storefront-theme="light"]').waitFor();
        await page.locator("[data-renderer]").waitFor({ state: "attached" });
        const control = page.getByRole("switch", {
          name: "Dark mode",
          exact: true,
        });
        assert.equal(await control.count(), 1);
        assert.equal(
          await page
            .locator("main > footer")
            .getByRole("switch", { name: "Dark mode", exact: true })
            .count(),
          1,
          "The standard switch occupies the existing footer appearance area",
        );
        assert.equal(
          await page.locator('main > header [role="switch"]').count(),
          0,
        );
        const switchBounds = await control.boundingBox();
        assert.ok(
          switchBounds &&
            switchBounds.x >= width * 0.75 &&
            switchBounds.y >= height * 0.8 &&
            switchBounds.x + switchBounds.width <= width &&
            switchBounds.y + switchBounds.height <= height,
          "The homepage switch stays visible in the lower-right corner on desktop and mobile",
        );
        assert.equal(await control.getAttribute("aria-checked"), "false");
        assert.equal(
          await page.evaluate(
            () => matchMedia("(prefers-color-scheme: dark)").matches,
          ),
          true,
          "A fresh visit defaults to light even when the device prefers dark",
        );
        await capture(page, `theme-${width}-light-default`);
        const originalUrl = page.url();
        await page.evaluate(() => {
          window.__themeMain = document.querySelector("main");
          window.__themeRenderer = document.querySelector("[data-renderer]");
        });
        await eventually(
          () => control.isEnabled(),
          "The theme switch must be hydrated",
        );
        await control.focus();
        await page.keyboard.press("Space");
        await page.locator('main[data-storefront-theme="dark"]').waitFor();
        assert.equal(await control.getAttribute("aria-checked"), "true");
        await capture(page, `theme-${width}-dark-selected`);
        assert.equal(
          page.url(),
          originalUrl,
          "Switching theme retains the complete URL",
        );
        assert.equal(
          await control.evaluate(
            (element) => element === document.activeElement,
          ),
          true,
          "Keyboard theme switching preserves focus",
        );
        assert.equal(
          await page.evaluate(
            () =>
              window.__themeMain === document.querySelector("main") &&
              window.__themeRenderer ===
                document.querySelector("[data-renderer]"),
          ),
          true,
          "The theme switch keeps the current homepage and material renderer mounted",
        );
        const cookie = (await context.cookies()).find(
          (item) => item.name === "atoma-theme",
        );
        assert.equal(cookie?.value, "dark");
        assert.ok(
          cookie.expires > Date.now() / 1000,
          "Theme preference survives a browser session",
        );
        const reload = await page.reload({ waitUntil: "domcontentloaded" });
        assert.match(await reload.text(), /data-storefront-theme="dark"/);
        await page.locator('main[data-storefront-theme="dark"]').waitFor();
        assert.equal(await control.getAttribute("aria-checked"), "true");
        await showMenu(page);
        const shop = page.locator('main > header [data-nav-action="shop"]');
        assert.equal(await shop.getAttribute("href"), "/shop");
        await shop.click();
        await page.locator('[data-shop-product="culinary"]').waitFor();
        assert.equal(new URL(page.url()).pathname, "/shop");
        assert.equal(
          await page.locator("main").getAttribute("data-storefront-theme"),
          "dark",
        );
        const product = page
          .locator('[data-shop-product="culinary"] a[href]')
          .first();
        assert.equal(
          await product.getAttribute("href"),
          `/shop/${products[0].handle}`,
        );
        await product.click();
        await page
          .locator(`[data-retail-product="${products[0].handle}"]`)
          .waitFor();
        assert.equal(
          new URL(page.url()).pathname,
          `/shop/${products[0].handle}`,
        );
        assert.equal(
          await page.locator("main").getAttribute("data-storefront-theme"),
          "dark",
        );
        const legacyLinks = await page
          .locator("main a[href]")
          .evaluateAll(
            (links) =>
              links.filter((link) =>
                /^\/(?:light(?:[/?#]|$)|shop\/light(?:[/?#]|$)|origins\/light(?:[/?#]|$))/.test(
                  link.getAttribute("href"),
                ),
              ).length,
          );
        assert.equal(
          legacyLinks,
          0,
          "Regular storefront navigation uses canonical routes",
        );
        await assertNoOverflow(page);

        const query = new URLSearchParams([
          ["matcha", products[1].handle],
          ["reference", "Spring & summer"],
          ["tag", "first"],
          ["tag", "second"],
        ]);
        for (const [legacy, canonical] of [
          ["/light", "/"],
          ["/shop/light", "/shop"],
          [`/shop/light/${products[1].handle}`, `/shop/${products[1].handle}`],
          ["/origins/light", "/origins"],
        ]) {
          await page.goto(`${baseURL}${legacy}?${query}`, {
            waitUntil: "domcontentloaded",
          });
          const destination = new URL(page.url());
          assert.equal(destination.pathname, canonical);
          assert.deepEqual([...destination.searchParams], [...query]);
          await page.locator('main[data-storefront-theme="dark"]').waitFor();
          assert.equal(
            (await context.cookies()).find(
              (item) => item.name === "atoma-theme",
            )?.value,
            "dark",
            "Legacy light URLs preserve the user's stored appearance",
          );
          if (canonical === "/") {
            await page.locator('main[data-handoff="complete"]').waitFor();
            assert.equal(
              await page
                .getByRole("button", {
                  name: "Select Barista Matcha",
                  exact: true,
                })
                .getAttribute("aria-pressed"),
              "true",
              "The legacy homepage preserves the selected-product query",
            );
          }
        }
        await setStorefrontTone(page, "light");
        assert.equal(new URL(page.url()).pathname, "/origins");
        const lightReload = await page.reload({
          waitUntil: "domcontentloaded",
        });
        assert.match(await lightReload.text(), /data-storefront-theme="light"/);
        await page.locator('main[data-storefront-theme="light"]').waitFor();
        await assertNoOverflow(page);
        await setStorefrontTone(page, "dark");
        savedState = await context.storageState();
        assert.deepEqual(state.actions, []);
        assert.deepEqual(state.errors, []);
      } catch (error) {
        await reportFailure(page, state, `theme-${width}`);
        throw error;
      } finally {
        await context.close();
      }

      const restored = await setup(browser, width, height, {
        storageState: savedState,
      });
      try {
        const response = await restored.page.goto(`${baseURL}/shop`, {
          waitUntil: "domcontentloaded",
        });
        assert.match(await response.text(), /data-storefront-theme="dark"/);
        await restored.page
          .locator('main[data-storefront-theme="dark"]')
          .waitFor();
        assert.equal(
          await restored.page
            .getByRole("switch", { name: "Dark mode", exact: true })
            .getAttribute("aria-checked"),
          "true",
          "The chosen dark appearance persists in a new browser session",
        );
        assert.deepEqual(restored.state.actions, []);
        assert.deepEqual(restored.state.errors, []);
      } finally {
        await restored.context.close();
      }
    },
  ]);
}

const selected = cases.filter(
  ([name]) =>
    !process.env.COLOR_STUDY_FILTER ||
    new RegExp(process.env.COLOR_STUDY_FILTER).test(name),
);
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
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
  `${selected.length - failed}/${selected.length} Color checks passed`,
);
if (failed) process.exitCode = 1;
