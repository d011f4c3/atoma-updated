/* Section navigation comparisons; catalog and cart requests are mocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.SELECTOR_STUDY_BASE_URL ?? "http://127.0.0.1:3100";
const screenshots = process.env.SELECTOR_STUDY_SCREENSHOTS;
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
  const state = { actions: [], errors: [], catalogReads: 0, gate: null };
  let cart = null;
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const respond = (json) =>
      route.fulfill({ contentType: "application/json", json });
    try {
      if (url.pathname.startsWith("/api/")) {
        assert.equal(url.origin, new URL(baseURL).origin);
        if (url.pathname === "/api/catalog" && request.method() === "GET") {
          state.catalogReads++;
          return respond({
            status: "ready",
            products,
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

async function assertHierarchy(page, requireInView = false) {
  const experience = page.locator('[data-embedded="true"]');
  const types = page.getByRole("group", {
    name: "Matcha to explore",
    exact: true,
  });
  const modes = page.getByRole("group", { name: "Shopping mode", exact: true });
  assert.equal(await types.count(), 1);
  assert.equal(await modes.count(), 1);
  const placement = await experience.getAttribute("data-selector-placement");
  assert.ok(["left", "right"].includes(placement));
  const productMenu = types.getByRole("combobox");
  if (await productMenu.count())
    assert.equal(await productMenu.locator("option").count(), products.length);
  else if (await types.getByRole("radio").count())
    assert.equal(await types.getByRole("radio").count(), products.length);
  else if (await types.locator("[data-homepage-selected-product]").count())
    assert.equal(await types.getByRole("button").count(), 2);
  else assert.equal(await types.getByRole("button").count(), products.length);
  const first = await types.boundingBox();
  const second = await modes.boundingBox();
  assert.ok(first && second, "Both selector groups must be visible");
  if (placement === "left") {
    assert.equal(
      await types.evaluate(
        (element) =>
          Boolean(element.closest("[data-stage-selectors]")) &&
          !element.closest("[data-selection-controls]"),
      ),
      true,
      "Left product choices must belong to the material workspace, outside the information panel",
    );
    assert.equal(await experience.locator("[data-stage-selectors]").count(), 1);
    if (page.viewportSize().width > 760) {
      const material = await experience
        .locator("[data-product-object]")
        .boundingBox();
      assert.ok(
        material &&
          first.x + first.width <= second.x + 1 &&
          first.y + first.height <= material.y + 1,
        "Desktop product choices must sit above the material in a separate left pane",
      );
    } else {
      assert.ok(
        first.y + first.height <= second.y + 1,
        "Mobile product choices must remain above the information navigation",
      );
    }
  } else {
    assert.equal(
      await types.evaluate((element) =>
        Boolean(element.closest("[data-selection-controls]")),
      ),
      true,
      "The right-side study must keep its product choices inside the information panel",
    );
    assert.equal(await experience.locator("[data-stage-selectors]").count(), 0);
    assert.ok(
      first.y + first.height <= second.y + 1,
      "Right-side product choices must remain above the information navigation",
    );
  }
  assert.equal(
    await modes.evaluate((element) =>
      Boolean(element.closest("[data-selection-controls]")),
    ),
    true,
    "Information navigation must remain in its content panel",
  );
  assert.equal(
    await types.evaluate((element) =>
      Boolean(
        element.compareDocumentPosition(
          element
            .closest('[data-embedded="true"]')
            .querySelector('[aria-label="Shopping mode"]'),
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ),
    true,
    "Keyboard order must match the visual hierarchy",
  );
  for (const control of await types
    .locator('button, select, label:has(input[type="radio"])')
    .all()) {
    const bounds = await control.boundingBox();
    assert.ok(
      bounds && bounds.height >= 43.5 && bounds.width >= 43.5,
      "Each product must retain a usable target",
    );
  }
  if (requireInView) {
    for (const group of [types, modes]) {
      for (const control of await group
        .locator('button, select, label:has(input[type="radio"])')
        .all()) {
        assert.equal(
          await control.evaluate((element) => {
            const box = element.getBoundingClientRect();
            return (
              box.top >= -1 &&
              box.bottom <= innerHeight + 1 &&
              box.left >= -1 &&
              box.right <= innerWidth + 1 &&
              element.contains(
                document.elementFromPoint(
                  box.x + box.width / 2,
                  box.y + box.height / 2,
                ),
              )
            );
          }),
          true,
          "Both selector groups must remain visible and reachable while specifications are open",
        );
      }
    }
  }
}

async function assertSpecificationsFit(page) {
  const specs = page.locator(
    '[data-homepage-view-panel="specifications"] [data-focused-specifications]',
  );
  assert.equal(await specs.locator("button[data-specification]").count(), 7);
  assert.deepEqual(
    await specs
      .locator("button[data-specification]")
      .evaluateAll((buttons) =>
        buttons.map(
          (button) => button.getAttribute("aria-label").split(":")[0],
        ),
      ),
    ["Aroma", "Flavour", "Umami", "Bitterness", "Texture", "Colour", "Finish"],
  );
  await specs.evaluate(async (root) => {
    for (let parent = root.parentElement; parent; parent = parent.parentElement)
      parent.scrollTop = 0;
    window.scrollTo(0, 0);
    await new Promise((done) => requestAnimationFrame(done));
  });
  await assertHierarchy(page, true);
  const problems = await specs.evaluate((root) => {
    const problems = [];
    for (const element of [
      root.querySelector(":scope > header"),
      ...root.querySelectorAll("button[data-specification]"),
    ]) {
      const box = element.getBoundingClientRect();
      const name =
        element.getAttribute("aria-label") ?? "Specification heading and rows";
      if (
        box.top < -1 ||
        box.bottom > innerHeight + 1 ||
        box.left < -1 ||
        box.right > innerWidth + 1
      )
        problems.push({
          name,
          top: box.top,
          bottom: box.bottom,
          height: innerHeight,
        });
      for (
        let parent = element.parentElement;
        parent;
        parent = parent.parentElement
      ) {
        if (
          /(auto|scroll|hidden|clip)/.test(getComputedStyle(parent).overflowY)
        ) {
          const boundary = parent.getBoundingClientRect();
          if (box.top < boundary.top - 1 || box.bottom > boundary.bottom + 1)
            problems.push({
              name,
              clippedBy: parent.tagName,
              bottom: box.bottom,
              boundary: boundary.bottom,
            });
        }
      }
    }
    if (document.documentElement.scrollWidth > innerWidth + 1)
      problems.push("Horizontal page overflow");
    return problems;
  });
  assert.deepEqual(
    problems,
    [],
    "The specification heading and all seven properties must fit without scrolling",
  );
}

const sectionDirections = [
  "text",
  "tabs",
  "segmented",
  "menu",
  "brackets",
  "track",
];

async function assertStudyDefaults(page) {
  const experience = page.locator('[data-embedded="true"]');
  assert.equal(
    await experience.getAttribute("data-selector-variant"),
    "slides",
  );
  assert.equal(
    await experience.getAttribute("data-selector-placement"),
    "left",
  );
  assert.equal(
    await experience.getAttribute("data-section-selector-variant"),
    "tabs",
  );
  assert.equal(
    await page
      .getByRole("combobox", { name: "Matcha selector", exact: true })
      .count(),
    0,
  );
  const style = page.getByRole("combobox", {
    name: "Section navigation",
    exact: true,
  });
  assert.equal(await style.inputValue(), "tabs");
  assert.deepEqual(
    await style
      .locator("option")
      .evaluateAll((options) => options.map((option) => option.value)),
    sectionDirections,
  );
  assert.deepEqual(await style.locator("option").allTextContents(), [
    "Text",
    "Tabs",
    "Segmented",
    "Menu",
    "Brackets",
    "Indicator",
  ]);
  await page
    .locator('main > header[data-navigation-variant="default"]')
    .waitFor();
}

async function assertHeaderWorks(page) {
  const header = page.locator(
    'main > header[data-navigation-variant="default"]',
  );
  await header.scrollIntoViewIfNeeded();
  const menu = header.locator('summary[aria-label="Menu"]');
  const mobile = page.viewportSize().width <= 760;
  const openMenu = async () => {
    if (!mobile) return;
    await menu.focus();
    await page.keyboard.press("Enter");
    await header.locator("[data-navigation-index][open]").waitFor();
  };
  await openMenu();
  for (const action of await header.locator("[data-nav-action]").all())
    assert.equal(
      await action.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return (
          bounds.left >= -1 &&
          bounds.right <= innerWidth + 1 &&
          bounds.top >= -1 &&
          bounds.bottom <= innerHeight + 1 &&
          element.contains(
            document.elementFromPoint(
              bounds.x + bounds.width / 2,
              bounds.y + bounds.height / 2,
            ),
          )
        );
      }),
      true,
      "Storefront navigation must be visible and pointer reachable",
    );
  if (mobile) {
    await page.keyboard.press("Escape");
    assert.equal(
      await header.locator("[data-navigation-index]").getAttribute("open"),
      null,
    );
    assert.equal(
      await menu.evaluate((element) => element === document.activeElement),
      true,
    );
    await openMenu();
  }
  await header
    .getByRole("button", { name: "Explore matcha", exact: true })
    .click();
  assert.equal(
    await page.locator("[data-embedded]").getAttribute("data-mode"),
    "builder",
  );
  await openMenu();
  const about = header.getByRole("button", {
    name: "About ATOMA",
    exact: true,
  });
  await about.click();
  const dialog = header.getByRole("dialog", {
    name: /A closer look\s+at matcha\./,
  });
  await dialog.waitFor();
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await eventually(
    () =>
      (mobile ? menu : about).evaluate(
        (element) => element === document.activeElement,
      ),
    "About must restore focus when its native close event completes",
  );
  await header
    .getByRole("button", { name: "Open cart, 0 items", exact: true })
    .click();
  const cart = page.getByRole("dialog", { name: /Your\s+selection\./ });
  await cart.waitFor();
  await cart.getByRole("button", { name: "Close cart", exact: true }).click();
  await cart.waitFor({ state: "hidden" });
  assert.equal(new URL(page.url()).pathname, "/selector-study");
  assert.equal(
    Number(await page.getByLabel("Quantity", { exact: true }).textContent()),
    10,
  );
}

const cases = [1440, 320].map((width) => [
  `selector study ${width}: six section styles preserve the storefront selection`,
  async (browser) => {
    const { context, page, state } = await setup(
      browser,
      width,
      width === 1440 ? 900 : 700,
    );
    try {
      await page.goto(`${baseURL}/selector-study`, {
        waitUntil: "domcontentloaded",
      });
      const experience = page.locator('[data-embedded="true"]');
      await experience
        .locator('[data-homepage-view-panel="overview"]')
        .waitFor();
      await assertStudyDefaults(page);
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
        "Initial selection focus must settle before the toolbar keyboard check",
      );
      const informationStyle = page.getByRole("combobox", {
        name: "Section navigation",
        exact: true,
      });
      const modes = page.getByRole("group", {
        name: "Shopping mode",
        exact: true,
      });
      const types = page.getByRole("group", {
        name: "Matcha to explore",
        exact: true,
      });
      const choice = (name) =>
        types.getByRole("button", {
          name: `Select ${name} Matcha`,
          exact: true,
        });
      const quantity = page.getByLabel("Quantity", { exact: true });
      const bundle = page.getByRole("button", {
        name: "5 × 1 kg",
        exact: true,
      });
      const increase = page.getByRole("button", {
        name: "Increase quantity",
        exact: true,
      });
      const informationMenu = modes.getByRole("combobox", {
        name: "Information view",
        exact: true,
      });
      const view = async (
        name,
        value = name.toLowerCase(),
        keyboard = false,
      ) => {
        const changed =
          (await experience.getAttribute("data-mode")) !== value ||
          (await experience.getAttribute("data-editing-reference")) === "true";
        if (await informationMenu.count()) {
          await informationMenu.focus();
          if (keyboard) await page.keyboard.press("s");
          else await informationMenu.selectOption(value);
          await eventually(
            () =>
              experience
                .getAttribute("data-mode")
                .then((mode) => mode === value),
            "A native information menu must update the selected view",
          );
          assert.equal(
            await informationMenu.evaluate(
              (element) =>
                new Promise((done) =>
                  requestAnimationFrame(() =>
                    done(element === document.activeElement),
                  ),
                ),
            ),
            true,
            "Changing a native information menu must preserve keyboard focus",
          );
        } else {
          await modes.getByRole("button", { name, exact: true }).click();
          if (changed)
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
              "View changes must finish heading focus before keyboard interactions",
            );
        }
        assert.equal(await experience.getAttribute("data-mode"), value);
        assert.equal(new URL(page.url()).pathname, "/selector-study");
        await assertHierarchy(page);
      };
      const about = page.getByLabel("About this direction", { exact: true });
      await about.focus();
      await page.keyboard.press("Enter");
      assert.equal(
        await about.evaluate((element) => element.parentElement.open),
        true,
      );
      await page.keyboard.press("Escape");
      assert.equal(
        await about.evaluate((element) => element.parentElement.open),
        false,
      );
      assert.equal(
        await about.evaluate((element) => element === document.activeElement),
        true,
      );
      const photos = types.locator("img");
      assert.equal(await photos.count(), products.length);
      await eventually(
        () =>
          photos.evaluateAll((images) =>
            images.every(
              (image) =>
                image.complete &&
                image.naturalWidth > 0 &&
                image.parentElement.dataset.pending === "false" &&
                Number(getComputedStyle(image).opacity) >= 0.99,
            ),
          ),
        "The fixed Slides choices must load all real product photographs",
      );
      await view("Shop", "builder");
      assert.equal(await experience.getAttribute("data-step"), "1");
      assert.equal(
        await page
          .getByRole("button", { name: "Continue to quantity", exact: true })
          .count(),
        0,
      );
      await bundle.click();
      await increase.click();
      await assertHeaderWorks(page);
      const reference = "SELECTOR STUDY / TASTING";
      if (width > 760) {
        await page
          .getByRole("button", { name: "Add label reference", exact: true })
          .click();
        await page
          .getByRole("textbox", { name: "Your reference", exact: true })
          .fill(reference);
        await view("Shop", "builder");
        assert.equal(
          await page
            .getByRole("textbox", { name: "Your reference", exact: true })
            .isVisible(),
          false,
          "Selecting active Shop must close the editor and preserve the reference",
        );
      }
      await page.evaluate(() => {
        window.__selectorScene = document.querySelector("[data-renderer]");
        window.__selectorCard = document.querySelector("[data-label-card]");
      });
      for (const secondary of sectionDirections) {
        const catalogReads = state.catalogReads;
        await informationStyle.selectOption(secondary);
        assert.equal(
          await experience.getAttribute("data-selector-variant"),
          "slides",
        );
        assert.equal(
          await experience.getAttribute("data-selector-placement"),
          "left",
        );
        assert.equal(
          await experience.getAttribute("data-section-selector-variant"),
          secondary,
        );
        assert.equal(await experience.getAttribute("data-mode"), "builder");
        assert.equal(
          Number(await quantity.textContent()),
          10,
          "Changing section style must retain quantity",
        );
        assert.equal(await bundle.getAttribute("aria-pressed"), "true");
        assert.equal(
          await choice("Culinary").getAttribute("aria-pressed"),
          "true",
        );
        await choice("Barista").click();
        assert.equal(
          Number(await quantity.textContent()),
          1,
          "The fixed Slides selector must still change the real product",
        );
        await choice("Culinary").click();
        await bundle.click();
        await increase.click();
        await choice("Culinary").focus();
        await page.keyboard.press("Enter");
        assert.equal(
          Number(await quantity.textContent()),
          10,
          "Reselecting a product must preserve its order",
        );
        for (const tone of ["light", "dark"]) {
          await page
            .getByRole("link", {
              name: `${tone === "light" ? "Light" : "Dark"} mode`,
              exact: true,
            })
            .click();
          await page
            .locator(`[data-selector-study][data-tone="${tone}"]`)
            .waitFor();
          const header = page.locator(
            'main > header[data-navigation-variant="default"]',
          );
          assert.equal(await header.getAttribute("data-tone"), tone);
          assert.equal(
            await header
              .locator('[data-nav-action="shop"]')
              .getAttribute("href"),
            "/shop",
          );
          await view("Overview");
          assert.match(
            await page
              .locator('[data-homepage-view-panel="overview"]')
              .textContent(),
            /Culinary Matcha/,
          );
          await capture(page, `${width}-${secondary}-${tone}-overview`);
          await view("Specifications", "specifications", secondary === "menu");
          await assertSpecificationsFit(page);
          await capture(page, `${width}-${secondary}-${tone}-specifications`);
        }
        assert.equal(
          state.catalogReads,
          catalogReads,
          "Changing section styles, views and themes must not reload the selected catalog",
        );
        await view("Origin");
        const origins = page.locator('[data-origin-preview="split"]');
        await origins.waitFor();
        assert.match(await origins.textContent(), /Uji City/);
        assert.match(await origins.textContent(), /tea designation/i);
        assert.doesNotMatch(await origins.textContent(), /Grown in/);
        if (secondary === "tabs") {
          const region = origins.getByRole("button", {
            name: "About Uji",
            exact: true,
          });
          await region.focus();
          await page.keyboard.press("Enter");
          const reader = page.getByRole("dialog", {
            name: "ATOMA Origins",
            exact: true,
          });
          await reader.waitFor();
          await reader
            .getByRole("button", {
              name: "Return to Culinary Matcha",
              exact: true,
            })
            .click();
          await reader.waitFor({ state: "hidden" });
          await eventually(
            () => new URL(page.url()).hash === "",
            "The reader must restore the section study URL",
          );
          await eventually(
            () =>
              region.evaluate((element) => element === document.activeElement),
            "The Origins reader must restore focus to its designation trigger",
          );
        }
        await view("Shop", "builder");
        assert.equal(
          Number(await quantity.textContent()),
          10,
          "All views and themes must retain quantity",
        );
        assert.equal(await bundle.getAttribute("aria-pressed"), "true");
        if (width > 760)
          assert.equal(
            await page.locator('[data-label-field="reference"]').textContent(),
            reference,
          );
        assert.equal(
          await page.evaluate(
            () =>
              window.__selectorScene ===
                document.querySelector("[data-renderer]") &&
              window.__selectorCard ===
                document.querySelector("[data-label-card]"),
          ),
          true,
          "Style and theme comparisons must preserve the live scene and label card",
        );
      }
      await choice("Ceremonial").click();
      assert.equal(
        await page
          .getByRole("button", { name: "Currently unavailable", exact: true })
          .isDisabled(),
        true,
      );
      await choice("Culinary").click();
      await bundle.click();
      await increase.click();
      let release;
      state.gate = new Promise((done) => {
        release = done;
      });
      try {
        await page
          .getByRole("button", { name: "Add to cart", exact: true })
          .click();
        await eventually(
          () => state.actions.length === 1,
          "The mocked purchase must start",
        );
        assert.equal(await informationStyle.isDisabled(), true);
        for (const group of [types, modes])
          for (const control of await group
            .locator("button, select, input")
            .all())
            assert.equal(
              await control.isDisabled(),
              true,
              "Pending cart writes must lock section, product and view choices",
            );
      } finally {
        release();
      }
      await page.getByRole("dialog", { name: /Your\s+selection\./ }).waitFor();
      assert.deepEqual(state.actions, [
        {
          action: "add",
          productHandle: products[0].handle,
          variantKey: products[0].variants[1].id,
          quantity: 10,
        },
      ]);
      await page.keyboard.press("Escape");
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
  "default isolation: adopted homepage selectors preserve state while studies retain their defaults",
  async (browser) => {
    for (const [width, height, tone] of [
      [1440, 900, "dark"],
      [320, 700, "light"],
    ]) {
      const path = "/";
      const { context, page, state } = await setup(browser, width, height);
      await context.addCookies([
        { name: "atoma-theme", value: tone, url: baseURL },
      ]);
      try {
        await page.goto(`${baseURL}${path}`, { waitUntil: "domcontentloaded" });
        await page.locator("[data-renderer]").waitFor({ state: "attached" });
        await page
          .getByRole("button", {
            name: "Explore matcha from the tray",
            exact: true,
          })
          .click();
        await page.locator('main[data-handoff="complete"]').waitFor();
        const experience = page.locator('[data-embedded="true"]');
        const types = page.getByRole("group", {
          name: "Matcha to explore",
          exact: true,
        });
        const modes = page.getByRole("group", {
          name: "Shopping mode",
          exact: true,
        });
        assert.equal(
          await experience.getAttribute("data-selector-variant"),
          "slides",
        );
        assert.equal(
          await experience.getAttribute("data-selector-placement"),
          "left",
        );
        assert.equal(
          await experience.getAttribute("data-section-selector-variant"),
          "tabs",
        );
        assert.equal(
          await page
            .getByRole("combobox", { name: "Section navigation", exact: true })
            .count(),
          0,
        );
        const photographs = types.locator("img");
        assert.equal(await photographs.count(), products.length);
        await eventually(
          () =>
            photographs.evaluateAll((images) =>
              images.every(
                (image) =>
                  image.complete &&
                  image.naturalWidth > 0 &&
                  image.parentElement.dataset.pending === "false" &&
                  Number(getComputedStyle(image).opacity) >= 0.99,
              ),
            ),
          "Every adopted slide must display its loaded matcha photograph",
        );
        await assertHierarchy(page);
        await types
          .getByRole("button", { name: "Select Barista Matcha", exact: true })
          .click();
        await modes.getByRole("button", { name: "Shop", exact: true }).click();
        assert.equal(await experience.getAttribute("data-step"), "1");
        await page
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        assert.equal(
          Number(
            await page.getByLabel("Quantity", { exact: true }).textContent(),
          ),
          2,
        );
        await modes
          .getByRole("button", { name: "Specifications", exact: true })
          .click();
        await assertSpecificationsFit(page);
        assert.equal(
          await page.locator("[data-focused-product-name]").textContent(),
          "Barista Matcha",
        );
        await page.evaluate(() => {
          window.__adoptionScene = document.querySelector("[data-renderer]");
        });
        await capture(page, `adopted-${width}-${tone}-specifications`);
        const otherTone = tone === "dark" ? "light" : "dark";
        const originalURL = page.url();
        const historyLength = await page.evaluate(() => window.history.length);
        await page
          .getByRole("switch", { name: "Dark mode", exact: true })
          .click();
        await page.locator(`main[data-tone="${otherTone}"]`).waitFor();
        assert.equal(page.url(), originalURL);
        assert.equal(
          await page.evaluate(() => window.history.length),
          historyLength,
        );
        assert.equal(
          await experience.getAttribute("data-mode"),
          "specifications",
        );
        assert.equal(
          await experience.getAttribute("data-selector-placement"),
          "left",
          "Appearance changes must retain the adopted left placement",
        );
        assert.equal(
          await types
            .getByRole("button", { name: "Select Barista Matcha", exact: true })
            .getAttribute("aria-pressed"),
          "true",
        );
        assert.equal(
          await page
            .locator('main[data-concept="01"]')
            .getAttribute("data-handoff"),
          "complete",
        );
        assert.equal(
          await page.evaluate(
            () =>
              window.__adoptionScene ===
              document.querySelector("[data-renderer]"),
          ),
          true,
        );
        await assertSpecificationsFit(page);
        await capture(page, `adopted-${width}-${otherTone}-specifications`);
        await modes.getByRole("button", { name: "Shop", exact: true }).click();
        assert.equal(
          Number(
            await page.getByLabel("Quantity", { exact: true }).textContent(),
          ),
          2,
          "Adopted selectors and appearance changes must retain the order",
        );
        await modes
          .getByRole("button", { name: "Overview", exact: true })
          .click();
        assert.match(
          await page
            .locator('[data-homepage-view-panel="overview"]')
            .textContent(),
          /Barista Matcha/,
        );
        assert.deepEqual(state.actions, []);
        assert.deepEqual(state.errors, []);
      } catch (error) {
        await reportFailure(page, state, `adopted-${width}`);
        throw error;
      } finally {
        await context.close();
      }
    }
    const { context, page, state } = await setup(browser, 1440, 900);
    try {
      await page.goto(`${baseURL}/selector-study`, {
        waitUntil: "domcontentloaded",
      });
      const experience = page.locator('[data-embedded="true"]');
      await experience
        .locator('[data-homepage-view-panel="overview"]')
        .waitFor();
      await assertStudyDefaults(page);
      await assertHierarchy(page);
      const homepageCatalogReads = state.catalogReads;
      await page.goto(`${baseURL}/concept-02`, {
        waitUntil: "domcontentloaded",
      });
      await page.locator("[data-renderer]").waitFor({ state: "attached" });
      await eventually(
        () => state.catalogReads > homepageCatalogReads,
        "Concept 02 must hydrate and read its catalog before interaction",
      );
      await page
        .getByRole("button", {
          name: "Explore with the interactive builder",
          exact: true,
        })
        .click();
      await page
        .locator('main[data-exploring="true"][data-mode="builder"]')
        .waitFor();
      assert.equal(
        await page.locator('[data-selector-variant="current"]').count(),
        1,
      );
      assert.equal(
        await page.locator('[data-section-selector-variant="current"]').count(),
        1,
      );
      assert.equal(
        await page
          .getByRole("group", { name: "Matcha to explore", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await page
          .getByRole("combobox", { name: "Section navigation", exact: true })
          .count(),
        0,
      );
      await page
        .getByRole("button", { name: "Continue to quantity", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "How much would you like?", exact: true })
        .waitFor();
      assert.deepEqual(state.actions, []);
      assert.deepEqual(state.errors, []);
    } catch (error) {
      await reportFailure(page, state, "defaults");
      throw error;
    } finally {
      await context.close();
    }
  },
]);

const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  headless: true,
});
let failed = 0;
const selected = cases.filter(
  ([name]) =>
    !process.env.SELECTOR_STUDY_FILTER ||
    new RegExp(process.env.SELECTOR_STUDY_FILTER).test(name),
);
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
  `${selected.length - failed}/${selected.length} selector checks passed`,
);
if (failed) process.exitCode = 1;
