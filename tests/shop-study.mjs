/* Shop layout comparisons. Every catalog and cart request is mocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.SHOP_STUDY_BASE_URL ?? "http://127.0.0.1:3100";
const screenshots = process.env.SHOP_STUDY_SCREENSHOTS;
const layouts = [
  "current",
  "sheet",
  "counter",
  "card",
  "refined",
  "line",
  "split",
  "ledger",
  "open",
  "list",
  "price",
];
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

async function setup(browser, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: width > 760 ? "no-preference" : "reduce",
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

async function reportFailure(page, state, name) {
  console.error(
    JSON.stringify({
      url: page.url(),
      errors: state.errors,
      catalogReads: state.catalogReads,
      ui: await page
        .locator('main, [data-embedded], [role="group"]')
        .evaluateAll((elements) =>
          elements.map((element) => ({
            tag: element.tagName,
            label: element.getAttribute("aria-label"),
            ...element.dataset,
          })),
        ),
    }),
  );
  if (screenshots) {
    await mkdir(screenshots, { recursive: true });
    await page.screenshot({
      path: resolve(screenshots, `${name}-failure.png`),
    });
  }
}

async function assertNoOverflow(page) {
  const sizes = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(
    Math.max(sizes.document, sizes.body) <= sizes.viewport + 1,
    `The Shop study must fit horizontally: ${JSON.stringify(sizes)}`,
  );
}

async function assertStudyPlacement(page) {
  const experience = page.locator("[data-embedded]");
  assert.equal(
    await experience.getAttribute("data-selector-placement"),
    "left",
  );
  assert.equal(
    await experience.getAttribute("data-selector-variant"),
    "slides",
  );
  assert.equal(
    await experience.getAttribute("data-section-selector-variant"),
    "tabs",
  );
  const products = page.getByRole("group", {
    name: "Matcha to explore",
    exact: true,
  });
  assert.equal(
    await products.evaluate((element) =>
      Boolean(element.closest("[data-selection-controls]")),
    ),
    false,
    "Matcha choices must live outside the purchase column",
  );
  const productBounds = await products.boundingBox();
  const controls = await (
    page.viewportSize().width > 760
      ? page.locator("[data-selection-controls]")
      : page.getByRole("group", { name: "Shopping mode", exact: true })
  ).boundingBox();
  assert.ok(productBounds && controls);
  if (page.viewportSize().width > 760)
    assert.ok(
      productBounds.x + productBounds.width <= controls.x + 1,
      "Desktop matcha choices must be left of the purchase controls",
    );
  else
    assert.ok(
      productBounds.y + productBounds.height <= controls.y + 1,
      "Phone matcha choices must precede the purchase controls",
    );
}

async function assertStorefrontNavigation(page) {
  const header = page.locator(
    'main > header[data-navigation-variant="default"]',
  );
  await header.waitFor();
  await header.scrollIntoViewIfNeeded();
  const menu = header.locator('summary[aria-label="Menu"]');
  const mobile = page.viewportSize().width <= 760;
  async function revealLinks() {
    if (!mobile) return;
    await menu.focus();
    await page.keyboard.press("Enter");
    await header.locator("[data-navigation-index][open]").waitFor();
  }
  await revealLinks();
  for (const control of await header.locator("[data-nav-action]").all()) {
    const bounds = await control.boundingBox();
    const viewport = page.viewportSize();
    assert.ok(
      bounds &&
        bounds.x >= -1 &&
        bounds.x + bounds.width <= viewport.width + 1 &&
        bounds.y >= -1 &&
        bounds.y + bounds.height <= viewport.height + 1,
      "Storefront navigation actions must remain within the viewport",
    );
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
      "Open navigation actions must accept pointer input",
    );
  }
  if (mobile) {
    await page.keyboard.press("Escape");
    assert.equal(
      await menu.evaluate((element) => element === document.activeElement),
      true,
    );
    assert.equal(
      await header.locator("[data-navigation-index]").getAttribute("open"),
      null,
    );
    await revealLinks();
  }
  await header
    .getByRole("button", { name: "Explore matcha", exact: true })
    .click();
  await assertOrder(page, 10);
  assert.equal(new URL(page.url()).pathname, "/shop-study");
  if (mobile) {
    assert.equal(
      await menu.evaluate((element) => element === document.activeElement),
      true,
    );
    await revealLinks();
  }
  const about = header.getByRole("button", {
    name: "About ATOMA",
    exact: true,
  });
  await about.click();
  const aboutDialog = header.getByRole("dialog", {
    name: /A closer look\s+at matcha\./,
  });
  await aboutDialog.waitFor();
  await page.keyboard.press("Escape");
  await aboutDialog.waitFor({ state: "hidden" });
  await eventually(
    () =>
      (mobile ? menu : about).evaluate(
        (element) => element === document.activeElement,
      ),
    "About must return focus to visible storefront navigation",
  );
  await revealLinks();
  await header.locator('[data-nav-action="origins"]').click();
  const origins = page.getByRole("dialog", {
    name: "ATOMA Origins",
    exact: true,
  });
  await origins.waitFor();
  await origins
    .getByRole("button", { name: "Return to Culinary Matcha", exact: true })
    .click();
  await origins.waitFor({ state: "hidden" });
  await eventually(
    () => new URL(page.url()).hash === "",
    "Header Origins restores the study URL",
  );
  await assertOrder(page, 10);
  const cart = header.getByRole("button", {
    name: "Open cart, 0 items",
    exact: true,
  });
  await cart.click();
  const cartDialog = page.getByRole("dialog", { name: /Your\s+selection\./ });
  await cartDialog.waitFor();
  await cartDialog
    .getByRole("button", { name: "Close cart", exact: true })
    .click();
  await cartDialog.waitFor({ state: "hidden" });
  await assertOrder(page, 10);
}

async function selectView(page, name) {
  const mode = name === "Shop" ? "builder" : name.toLowerCase();
  const control = page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name, exact: true });
  await control.click();
  await page.locator(`[data-embedded][data-mode="${mode}"]`).waitFor();
  if (
    (await page
      .locator("[data-embedded]")
      .getAttribute("data-material-object")) === "silver-bag"
  ) {
    await eventually(
      () => control.evaluate((element) => element === document.activeElement),
      "The silver bag homepage keeps section navigation focused during its in-place transition",
    );
    return;
  }
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

async function setLayout(page, value) {
  await page
    .getByRole("combobox", { name: "Shop layout", exact: true })
    .selectOption(value);
  await page
    .locator(`[data-embedded][data-shop-preview-variant="${value}"]`)
    .waitFor();
  if (value === "current" || value === "refined")
    assert.equal(await page.locator("[data-shop-preview]").count(), 0);
  else await page.locator(`[data-shop-preview="${value}"]`).waitFor();
}

async function assertLayoutStructure(page, layout) {
  if (layout === "list") {
    const choices = page.getByRole("radiogroup", {
      name: "Format",
      exact: true,
    });
    assert.equal(await choices.getByRole("radio").count(), 2);
    const rows = await choices.getByRole("radio").evaluateAll((radios) =>
      radios.map((radio) => {
        const bounds = radio.closest("label").getBoundingClientRect();
        return {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        };
      }),
    );
    assert.ok(rows[0].height >= 44 && rows[1].height >= 44);
    assert.ok(rows[0].y + rows[0].height <= rows[1].y + 1);
    assert.ok(Math.abs(rows[0].width - rows[1].width) <= 1);
  }
  if (layout === "price") {
    assert.equal(await page.locator("[data-shop-total]").count(), 1);
    assert.equal(
      await page.locator('[data-shop-preview="price"]').evaluate((panel) => {
        const total = panel.querySelector("[data-shop-total]");
        const format = panel.querySelector("[data-shop-format]");
        return Boolean(
          total &&
          format &&
          total.compareDocumentPosition(format) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
      }),
      true,
      "Price first puts the one live total before configuration in reading order",
    );
    const total = await page.locator("[data-shop-total]").boundingBox();
    const format = await page.locator("[data-shop-format]").boundingBox();
    assert.ok(total && format && total.y + total.height <= format.y + 1);
  }
}

async function assertEssentialsFit(page, { scrollControls = false } = {}) {
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
    if (scrollControls) await element.scrollIntoViewIfNeeded();
    const bounds = await element.boundingBox();
    const viewport = page.viewportSize();
    assert.ok(
      bounds &&
        bounds.x >= -1 &&
        bounds.x + bounds.width <= viewport.width + 1 &&
        bounds.y >= -1 &&
        bounds.y + bounds.height <= viewport.height + 1,
      `Purchase essentials must ${scrollControls ? "remain reachable by scrolling" : "fit without scrolling"}: ${JSON.stringify(bounds)}`,
    );
  }
  for (const control of [
    page.getByRole("button", { name: "Increase quantity", exact: true }),
    page.getByRole("button", { name: "Add to cart", exact: true }),
  ]) {
    if (scrollControls) await control.scrollIntoViewIfNeeded();
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

const cases = [
  [
    "shop study desktop: shared order, reference, reader and guarded cart",
    async (browser) => {
      const { context, page, state } = await setup(browser, 1366, 768);
      try {
        await page.goto(`${baseURL}/shop-study`, {
          waitUntil: "domcontentloaded",
        });
        await page
          .locator('[data-embedded][data-shop-preview-variant="open"]')
          .waitFor();
        await page
          .getByRole("button", { name: "Add to cart", exact: true })
          .waitFor();
        const layout = page.getByRole("combobox", {
          name: "Shop layout",
          exact: true,
        });
        assert.equal(await layout.inputValue(), "open");
        assert.deepEqual(
          await layout
            .locator("option")
            .evaluateAll((options) => options.map((option) => option.value)),
          layouts,
        );
        const experience = page.locator("[data-embedded]");
        assert.equal(await experience.getAttribute("data-mode"), "builder");
        await assertStudyPlacement(page);
        for (const style of ["open", "list"]) {
          await setLayout(page, style);
          await chooseFormat(page, 0);
          const formatRadios = page
            .getByRole("radiogroup", { name: "Format", exact: true })
            .getByRole("radio");
          await formatRadios.first().focus();
          await page.keyboard.press("ArrowRight");
          assert.equal(
            await formatRadios.nth(1).isChecked(),
            true,
            `${style} format choices must support native radio keyboard movement`,
          );
          await assertOrder(page, 5);
        }
        await chooseFormat(page, 0);
        await chooseFormat(page, 1);
        const increase = page.getByRole("button", {
          name: "Increase quantity",
          exact: true,
        });
        const decrease = page.getByRole("button", {
          name: "Decrease quantity",
          exact: true,
        });
        await assertOrder(page, 5);
        assert.equal(await decrease.isDisabled(), true);
        await increase.click();
        await increase.click();
        await assertOrder(page, 15);
        assert.equal(await increase.isDisabled(), true);
        await decrease.click();
        await assertOrder(page, 10);
        await assertStorefrontNavigation(page);
        await setLayout(page, "sheet");
        const purchaseOptions = page
          .locator('[data-shop-preview="sheet"] summary')
          .filter({ hasText: "One-time purchase" });
        await purchaseOptions.click();
        assert.equal(
          await page
            .getByRole("radio", { name: "One-time purchase", exact: true })
            .isChecked(),
          true,
        );
        assert.equal(
          await page
            .getByRole("radio", {
              name: "Subscribe — unavailable",
              exact: true,
            })
            .isDisabled(),
          true,
        );
        await purchaseOptions.click();
        await setLayout(page, "refined");
        await assertOrder(page, 10);
        const reference = "SHOP STUDY / TASTING";
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
        await page.locator("[data-renderer]").waitFor({ state: "attached" });
        await page.evaluate(() => {
          window.__shopScene = document.querySelector("[data-renderer]");
          window.__shopLabel = document.querySelector("[data-label-card]");
        });
        const reads = state.catalogReads;
        for (const style of layouts) {
          await setLayout(page, style);
          for (const tone of ["dark", "light"]) {
            await page
              .getByRole("link", {
                name: `${tone === "light" ? "Light" : "Dark"} mode`,
                exact: true,
              })
              .click();
            await page
              .locator(`[data-shop-study][data-tone="${tone}"]`)
              .waitFor();
            assert.equal(new URL(page.url()).pathname, "/shop-study");
            await assertOrder(page, 10);
            assert.equal(
              await page
                .locator('[data-label-field="reference"]')
                .textContent(),
              reference,
            );
            if (style === "current") await assertNoOverflow(page);
            else await assertEssentialsFit(page);
            await assertLayoutStructure(page, style);
            await capture(page, `1366-${style}-${tone}`);
          }
        }
        assert.equal(state.catalogReads, reads);
        assert.equal(
          await page.evaluate(
            () =>
              window.__shopScene ===
                document.querySelector("[data-renderer]") &&
              window.__shopLabel ===
                document.querySelector("[data-label-card]"),
          ),
          true,
          "Layouts and themes must preserve the mounted material scene and reference card",
        );
        await setLayout(page, "open");
        await selectView(page, "Specifications");
        assert.equal(await page.locator("[data-specification]").count(), 7);
        await selectView(page, "Origin");
        const preview = page.locator('[data-origin-preview="split"]');
        await preview.waitFor();
        await preview
          .getByRole("button", { name: "About Uji", exact: true })
          .click();
        const origins = page.getByRole("dialog", {
          name: "ATOMA Origins",
          exact: true,
        });
        await origins.waitFor();
        await origins
          .getByRole("button", {
            name: "Return to Culinary Matcha",
            exact: true,
          })
          .click();
        await origins.waitFor({ state: "hidden" });
        await eventually(
          () => new URL(page.url()).hash === "",
          "Reader return restores the study URL",
        );
        await selectView(page, "Shop");
        await assertOrder(page, 10);
        assert.equal(
          await page.locator('[data-label-field="reference"]').textContent(),
          reference,
        );
        await chooseProduct(page, "Barista");
        assert.equal(
          await page
            .getByRole("combobox", { name: "Format", exact: true })
            .count(),
          0,
          "A single format is a fact, not an unnecessary selector",
        );
        assert.equal(
          await page.locator("[data-shop-format]").textContent(),
          "1 kg",
        );
        assert.equal(
          Number(
            await page.getByLabel("Quantity", { exact: true }).textContent(),
          ),
          1,
        );
        assert.equal(
          await page.locator("[data-shop-total]").textContent(),
          money(products[1].variants[0].priceMinor),
        );
        await chooseProduct(page, "Ceremonial");
        assert.equal(
          await page
            .getByRole("button", { name: "Currently unavailable", exact: true })
            .isDisabled(),
          true,
        );
        assert.equal(await increase.isDisabled(), true);
        assert.equal(await decrease.isDisabled(), true);
        await chooseProduct(page, "Culinary");
        await chooseFormat(page, 1);
        await increase.click();
        await assertOrder(page, 10);
        let release;
        state.gate = new Promise((done) => {
          release = done;
        });
        state.nextMutation = "rejected";
        try {
          await page
            .getByRole("button", { name: "Add to cart", exact: true })
            .dblclick();
          await eventually(
            () => state.actions.length === 1,
            "Only one gated cart request starts",
          );
          for (const control of [
            layout,
            increase,
            decrease,
            ...(await page.locator("[data-shop-format] input").all()),
          ])
            assert.equal(await control.isDisabled(), true);
          for (const groupName of ["Shopping mode", "Matcha to explore"])
            for (const button of await page
              .getByRole("group", { name: groupName, exact: true })
              .getByRole("button")
              .all())
              assert.equal(await button.isDisabled(), true);
          assert.equal(
            await page
              .getByRole("button", { name: "Adding…", exact: true })
              .isDisabled(),
            true,
          );
          const toolbar = page.locator("[data-shop-study] > header");
          const home = toolbar.getByRole("link", {
            name: "Current homepage",
            exact: true,
          });
          await toolbar
            .locator('summary[aria-label="About this layout"]')
            .click();
          for (const link of [
            home,
            ...(await toolbar.locator("details a").all()),
          ]) {
            assert.equal(await link.getAttribute("aria-disabled"), "true");
            assert.equal(
              await link.evaluate((element) =>
                element.dispatchEvent(
                  new MouseEvent("click", { bubbles: true, cancelable: true }),
                ),
              ),
              false,
              "Study navigation must cancel departure while a cart write is pending",
            );
          }
          assert.equal(new URL(page.url()).pathname, "/shop-study");
          await page.keyboard.press("Escape");
          assert.equal(
            state.actions.length,
            1,
            "A double click cannot submit the order twice",
          );
        } finally {
          release();
          state.gate = null;
        }
        await page
          .getByRole("alert")
          .filter({ hasText: /couldn’t be updated/ })
          .waitFor();
        await assertOrder(page, 10);
        assert.equal(
          state.actions.length,
          1,
          "A rejected write must wait for an explicit retry",
        );
        await page
          .getByRole("button", { name: "Add to cart", exact: true })
          .click();
        await page
          .getByRole("dialog", { name: /Your\s+selection\./ })
          .waitFor();
        const expected = {
          action: "add",
          productHandle: products[0].handle,
          variantKey: products[0].variants[1].id,
          quantity: 10,
        };
        assert.deepEqual(
          state.actions,
          [expected, expected],
          "Reference text stays local and is not sent with the exact canonical cart payload",
        );
        await page.keyboard.press("Escape");
        assert.deepEqual(state.errors, []);
      } catch (error) {
        await reportFailure(page, state, "desktop");
        throw error;
      } finally {
        await context.close();
      }
    },
  ],
  [
    "shop study mobile: new layouts keep purchase essentials visible across themes",
    async (browser) => {
      const { context, page, state } = await setup(browser, 320, 700);
      try {
        await page.goto(`${baseURL}/shop-study`, {
          waitUntil: "domcontentloaded",
        });
        await page
          .locator('[data-embedded][data-shop-preview-variant="open"]')
          .waitFor();
        await page
          .getByRole("button", { name: "Add to cart", exact: true })
          .waitFor();
        await chooseFormat(page, 1);
        await page
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        await assertStudyPlacement(page);
        await assertStorefrontNavigation(page);
        for (const style of layouts) {
          await setLayout(page, style);
          for (const tone of ["light", "dark"]) {
            await page
              .getByRole("link", {
                name: `${tone === "light" ? "Light" : "Dark"} mode`,
                exact: true,
              })
              .click();
            await page
              .locator(`[data-shop-study][data-tone="${tone}"]`)
              .waitFor();
            await assertOrder(page, 10);
            if (style === "current") await assertNoOverflow(page);
            else await assertEssentialsFit(page);
            await assertLayoutStructure(page, style);
            await capture(page, `320-${style}-${tone}`);
          }
        }
        await selectView(page, "Specifications");
        assert.equal(await page.locator("[data-specification]").count(), 7);
        await selectView(page, "Shop");
        await assertOrder(page, 10);
        const header = page.locator(
          'main > header[data-navigation-variant="default"]',
        );
        await header.scrollIntoViewIfNeeded();
        await header.locator('summary[aria-label="Menu"]').click();
        await header.locator('[data-nav-action="shop"]').click();
        await page.waitForURL(`${baseURL}/shop`);
        await page.locator('[data-shop-product="culinary"]').waitFor();
        await assertNoOverflow(page);
        assert.deepEqual(state.actions, []);
        assert.deepEqual(state.errors, []);
      } catch (error) {
        await reportFailure(page, state, "mobile");
        throw error;
      } finally {
        await context.close();
      }
    },
  ],
  [
    "shop study new layouts: quantity rules, availability and pending cart locks",
    async (browser) => {
      const { context, page, state } = await setup(browser, 1366, 768);
      try {
        await page.goto(`${baseURL}/shop-study`, {
          waitUntil: "domcontentloaded",
        });
        await page
          .getByRole("button", { name: "Add to cart", exact: true })
          .waitFor();
        for (const style of ["list", "price"]) {
          await setLayout(page, style);
          await chooseProduct(page, "Barista");
          assert.equal(
            await page.locator("[data-shop-format]").textContent(),
            "1 kg",
          );
          assert.equal(
            await page
              .getByRole("combobox", { name: "Format", exact: true })
              .count(),
            0,
          );
          assert.equal(
            await page
              .getByRole("radiogroup", { name: "Format", exact: true })
              .count(),
            0,
          );
          await chooseProduct(page, "Ceremonial");
          assert.equal(
            await page
              .getByRole("button", {
                name: "Currently unavailable",
                exact: true,
              })
              .isDisabled(),
            true,
          );
          for (const name of ["Decrease quantity", "Increase quantity"])
            assert.equal(
              await page
                .getByRole("button", { name, exact: true })
                .isDisabled(),
              true,
            );
          await chooseProduct(page, "Culinary");
          await chooseFormat(page, 1);
          const increase = page.getByRole("button", {
            name: "Increase quantity",
            exact: true,
          });
          const decrease = page.getByRole("button", {
            name: "Decrease quantity",
            exact: true,
          });
          await assertOrder(page, 5);
          assert.equal(await decrease.isDisabled(), true);
          await increase.click();
          await increase.click();
          await assertOrder(page, 15);
          assert.equal(await increase.isDisabled(), true);
          await decrease.click();
          await assertOrder(page, 10);
          const before = state.actions.length;
          let release;
          state.gate = new Promise((done) => {
            release = done;
          });
          try {
            await page
              .getByRole("button", { name: "Add to cart", exact: true })
              .dblclick();
            await eventually(
              () => state.actions.length === before + 1,
              `${style} starts exactly one cart mutation`,
            );
            const format = page.locator("[data-shop-format]");
            const formatControls = (await format.evaluate(
              (element) => element.tagName === "SELECT",
            ))
              ? [format]
              : await format.locator("input").all();
            for (const control of [
              page.getByRole("combobox", { name: "Shop layout", exact: true }),
              increase,
              decrease,
              ...formatControls,
              page.getByRole("button", { name: "Adding…", exact: true }),
            ])
              assert.equal(await control.isDisabled(), true);
            for (const name of ["Shopping mode", "Matcha to explore"])
              for (const control of await page
                .getByRole("group", { name, exact: true })
                .getByRole("button")
                .all())
                assert.equal(await control.isDisabled(), true);
            assert.equal(
              await page
                .locator(`[data-shop-preview="${style}"] summary`)
                .filter({ hasText: "One-time purchase" })
                .getAttribute("aria-disabled"),
              "true",
            );
            assert.deepEqual(state.actions[before], {
              action: "add",
              productHandle: products[0].handle,
              variantKey: products[0].variants[1].id,
              quantity: 10,
            });
            assert.equal(state.actions.length, before + 1);
          } finally {
            release();
            state.gate = null;
          }
          const cart = page.getByRole("dialog", { name: /Your\s+selection\./ });
          await cart.waitFor();
          await cart
            .getByRole("button", { name: "Close cart", exact: true })
            .click();
          await cart.waitFor({ state: "hidden" });
          await assertOrder(page, 10);
          await eventually(
            () => increase.isEnabled(),
            "Purchase controls unlock after the mocked cart response",
          );
        }
        assert.equal(state.actions.length, 2);
        assert.deepEqual(state.errors, []);
      } catch (error) {
        await reportFailure(page, state, "new-layouts");
        throw error;
      } finally {
        await context.close();
      }
    },
  ],
  [
    "shop study catalog states recover without exposing a fallback purchase or changing defaults",
    async (browser) => {
      const { context, page, state } = await setup(browser, 320, 700);
      let release;
      state.catalogGate = new Promise((done) => {
        release = done;
      });
      try {
        await page.goto(`${baseURL}/shop-study`, {
          waitUntil: "domcontentloaded",
        });
        const panel = page.locator("[data-selection-controls]");
        await panel
          .getByRole("status")
          .filter({ hasText: /Opening/ })
          .waitFor();
        assert.equal(
          await page
            .getByRole("button", { name: "Add to cart", exact: true })
            .count(),
          0,
        );
        release();
        state.catalogGate = null;
        await page
          .getByRole("button", { name: "Add to cart", exact: true })
          .waitFor();
        for (const mode of ["unavailable", "empty"]) {
          state.catalogMode = mode;
          await page.reload({ waitUntil: "domcontentloaded" });
          await panel
            .getByRole("button", { name: "Try again", exact: true })
            .waitFor();
          assert.equal(
            await page
              .getByRole("button", { name: "Add to cart", exact: true })
              .count(),
            0,
          );
          assert.equal(
            await page.getByLabel("Quantity", { exact: true }).count(),
            0,
          );
          state.catalogMode = "ready";
          await panel
            .getByRole("button", { name: "Try again", exact: true })
            .click();
          await page
            .getByRole("button", { name: "Add to cart", exact: true })
            .waitFor();
          await assertOrder(page, 1, 0);
        }
        for (const [width, height, initialTone] of [
          [1366, 768, "light"],
          [320, 700, "dark"],
        ]) {
          await page.setViewportSize({ width, height });
          await context.addCookies([
            { name: "atoma-theme", value: initialTone, url: baseURL },
          ]);
          await page.goto(`${baseURL}/`, {
            waitUntil: "domcontentloaded",
          });
          await page
            .locator("[data-hero-loader]")
            .waitFor({ state: "detached" });
          await page.locator("[data-renderer]").waitFor({ state: "attached" });
          await page
            .getByRole("button", {
              name: "Explore matcha from the silver bag",
              exact: true,
            })
            .click();
          await page.locator('main[data-handoff="complete"]').waitFor();
          await selectView(page, "Shop");
          const homepage = page.locator('[data-embedded="true"]');
          await page.locator('[data-shop-refined="true"]').waitFor();
          assert.equal(
            await homepage.getAttribute("data-selector-placement"),
            "left",
          );
          assert.equal(
            await homepage.getAttribute("data-shop-preview-variant"),
            "refined",
          );
          assert.equal(
            await homepage.getAttribute("data-selector-variant"),
            "slides",
          );
          assert.equal(
            await homepage.getAttribute("data-section-selector-variant"),
            "tabs",
          );
          assert.equal(await page.locator("[data-shop-preview]").count(), 0);
          assert.equal(
            await page
              .getByRole("combobox", { name: "Shop layout", exact: true })
              .count(),
            0,
          );
          await assertOrder(page, 1, 0);
          await chooseFormat(page, 1);
          await page
            .getByRole("button", { name: "Increase quantity", exact: true })
            .click();
          await assertOrder(page, 10);
          assert.equal(
            await page
              .getByRole("button", { name: "Add label reference", exact: true })
              .count(),
            0,
          );
          assert.equal(
            await page
              .getByRole("textbox", { name: "Your reference", exact: true })
              .count(),
            0,
          );
          await page
            .locator("[data-product-bag] [data-silver-bag]")
            .waitFor({ state: "attached" });
          await page.evaluate(() => {
            window.__adoptedScene = document.querySelector("[data-renderer]");
            window.__adoptedBag = document.querySelector(
              "[data-product-bag] [data-silver-bag]",
            );
          });
          const reads = state.catalogReads;
          for (const tone of [
            initialTone,
            initialTone === "light" ? "dark" : "light",
          ]) {
            const themeSwitch = page.getByRole("switch", {
              name: "Dark mode",
              exact: true,
            });
            if (
              (await themeSwitch.getAttribute("aria-checked")) !==
              String(tone === "dark")
            )
              await themeSwitch.click();
            await page.locator(`main[data-tone="${tone}"]`).waitFor();
            assert.equal(new URL(page.url()).pathname, "/");
            assert.equal(await homepage.getAttribute("data-mode"), "builder");
            assert.equal(
              await homepage.getAttribute("data-shop-preview-variant"),
              "refined",
            );
            await page.locator('[data-shop-refined="true"]').waitFor();
            await assertOrder(page, 10);
            await assertEssentialsFit(page, { scrollControls: width <= 760 });
            await capture(page, `adopted-${width}-${tone}`);
          }
          assert.equal(
            state.catalogReads,
            reads,
            "Theme changes must not reload the adopted selection",
          );
          assert.equal(
            await page.evaluate(
              () =>
                window.__adoptedScene ===
                  document.querySelector("[data-renderer]") &&
                window.__adoptedBag ===
                  document.querySelector(
                    "[data-product-bag] [data-silver-bag]",
                  ),
            ),
            true,
            "Theme changes preserve the original material renderer and silver bag",
          );
          await selectView(page, "Overview");
          await selectView(page, "Shop");
          await assertOrder(page, 10);
        }
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
        await selectView(page, "Shop");
        assert.equal(
          await page
            .locator("[data-embedded]")
            .getAttribute("data-shop-preview-variant"),
          "current",
        );
        assert.equal(await page.locator("[data-shop-preview]").count(), 0);
        assert.deepEqual(state.actions, []);
        assert.deepEqual(state.errors, []);
      } catch (error) {
        await reportFailure(page, state, "catalog");
        throw error;
      } finally {
        release?.();
        await context.close();
      }
    },
  ],
];

const selected = cases.filter(
  ([name]) =>
    !process.env.SHOP_STUDY_FILTER ||
    new RegExp(process.env.SHOP_STUDY_FILTER).test(name),
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
  `${selected.length - failed}/${selected.length} Shop checks passed`,
);
if (failed) process.exitCode = 1;
