/* Homepage view integration checks. Commerce requests are fulfilled in memory. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);

const baseURL = process.env.HOMEPAGE_VIEWS_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const money = (amount) =>
  new Intl.NumberFormat("en", { style: "currency", currency: "JPY" }).format(
    amount,
  );
const variant = (letter, title, priceMinor, rule = {}) => ({
  id: `v1_${letter.repeat(43)}`,
  title,
  available: true,
  priceMinor,
  currency: "JPY",
  options: [{ name: "Format", value: title }],
  minimum: 1,
  maximum: 4,
  increment: 1,
  ...rule,
});
const products = [
  {
    id: "matcha-one",
    handle: "matcha-one",
    title: "Matcha One",
    description: "Product information supplied by the mocked catalog.",
    imageUrl: null,
    imageAlt: "",
    productUrl: null,
    isFixture: true,
    variants: [
      variant("a", "1 kg", 1200),
      variant("b", "5 × 1 kg", 6000, {
        minimum: 5,
        maximum: 15,
        increment: 5,
      }),
      variant("e", "100 g", 300, { available: false }),
    ],
  },
  {
    id: "matcha-two",
    handle: "matcha-two",
    title: "Matcha Two",
    description: "A second selectable product for browser regression checks.",
    imageUrl: null,
    imageAlt: "",
    productUrl: null,
    isFixture: true,
    variants: [variant("c", "1 kg", 2400)],
  },
  {
    id: "matcha-three",
    handle: "matcha-three",
    title: "Matcha Three",
    description: "An unavailable product for availability checks.",
    imageUrl: null,
    imageAlt: "",
    productUrl: null,
    isFixture: true,
    variants: [{ ...variant("d", "1 kg", 3600), available: false }],
  },
];
const catalog = {
  status: "ready",
  products,
  shopUrl: "https://example.invalid",
};
const productStories = products.map((product, index) => ({
  ...product,
  title: [
    "Japanese Culinary Matcha Powder for Cafés & Baking — 1 kg",
    "Japanese Barista Matcha Powder for Lattes — 1 kg",
    "Japanese Premium Matcha Powder for Tea Service — 1 kg",
  ][index],
}));

async function setup(browser, options = {}) {
  const {
    catalogProducts = products,
    initialTheme,
    ...browserOptions
  } = options;
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
    ...browserOptions,
  });
  if (initialTheme) {
    await context.addCookies([
      { name: "atoma-theme", value: initialTheme, url: origin },
    ]);
  }
  const state = {
    lines: [],
    actions: [],
    reads: 0,
    catalogReads: 0,
    catalogMode: "ready",
    nextMutation: "success",
    nextMutationGate: null,
    pageErrors: [],
    routeErrors: [],
  };
  function projection() {
    const subtotal = state.lines.reduce(
      (sum, line) => sum + line.quantity * line.priceMinor,
      0,
    );
    return {
      totalQuantity: state.lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotalLabel: money(subtotal),
      totalLabel: money(subtotal),
      lines: state.lines.map(({ priceMinor, ...line }) => ({
        ...line,
        unitPriceLabel: money(priceMinor),
        lineTotalLabel: money(priceMinor * line.quantity),
      })),
    };
  }
  function applyAction(action) {
    assert.ok(["add", "update", "remove"].includes(action.action));
    if (action.action === "add") {
      const product = catalogProducts.find(
        (item) => item.handle === action.productHandle,
      );
      assert.ok(product, "Add must send a catalog product handle");
      const format = product.variants.find(
        (item) => item.id === action.variantKey,
      );
      assert.ok(format?.available, "Add must send an available variant key");
      const existing = state.lines.find(
        (line) =>
          line.productHandle === product.handle &&
          line.variantTitle === format.title,
      );
      if (existing) {
        existing.quantity += action.quantity;
      } else {
        state.lines.push({
          lineKey: `line-${product.handle}-${format.id}`,
          productHandle: product.handle,
          productTitle: product.title,
          variantTitle: format.title,
          options: format.options,
          quantity: action.quantity,
          priceMinor: format.priceMinor,
          purchaseState: "purchasable",
          quantityRule: {
            minimum: format.minimum,
            maximum: format.maximum,
            increment: format.increment,
          },
          canUpdateQuantity: true,
          canRemove: true,
          image: null,
        });
      }
    } else {
      const index = state.lines.findIndex(
        (line) => line.lineKey === action.lineKey,
      );
      assert.notEqual(index, -1, "Cart actions must use the returned line key");
      if (action.action === "remove") state.lines.splice(index, 1);
      else state.lines[index].quantity = action.quantity;
    }
    for (const line of state.lines) {
      const { minimum, maximum, increment } = line.quantityRule;
      assert.ok(Number.isSafeInteger(line.quantity));
      assert.ok(line.quantity >= minimum);
      assert.ok(maximum === null || line.quantity <= maximum);
      assert.equal((line.quantity - minimum) % increment, 0);
    }
  }
  await context.route("**/*", async (route) => {
    if (!["GET", "HEAD"].includes(route.request().method())) {
      state.routeErrors.push(
        `An unmocked ${route.request().method()} to ${new URL(route.request().url()).pathname} was blocked`,
      );
      return route.abort("blockedbyclient");
    }
    return route.continue();
  });
  await context.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const respond = (json, status = 200) =>
      route.fulfill({ status, contentType: "application/json", json });
    try {
      assert.equal(url.origin, origin);
      if (url.pathname === "/api/catalog" && request.method() === "GET") {
        state.catalogReads++;
        if (state.catalogMode === "unavailable") {
          return respond(
            { ...catalog, status: "unavailable", products: [] },
            503,
          );
        }
        if (state.catalogMode === "empty") {
          return respond({ ...catalog, status: "empty", products: [] });
        }
        return respond({ ...catalog, products: catalogProducts });
      }
      if (url.pathname === "/api/cart" && request.method() === "GET") {
        state.reads++;
        return respond(
          state.lines.length
            ? { kind: "ready", cart: projection(), checkoutEnabled: false }
            : { kind: "empty", checkoutEnabled: false },
        );
      }
      if (url.pathname === "/api/cart" && request.method() === "POST") {
        assert.match(request.headers()["content-type"], /application\/json/);
        const action = request.postDataJSON();
        state.actions.push(action);
        const mode = state.nextMutation;
        state.nextMutation = "success";
        const gate = state.nextMutationGate;
        state.nextMutationGate = null;
        if (gate) await gate;
        if (mode === "rejected") {
          return respond({ kind: "rejected", checkoutEnabled: false });
        }
        if (mode === "rejected-review") {
          return respond({
            kind: "rejected",
            cart: projection(),
            reviewRequired: true,
            checkoutEnabled: false,
          });
        }
        applyAction(action);
        if (mode === "ambiguous") {
          // The write happened, but the client cannot know until it reads again.
          return respond({ kind: "ambiguous", checkoutEnabled: false }, 503);
        }
        return respond({
          kind: "success",
          cart: projection(),
          checkoutEnabled: false,
        });
      }
      throw new Error(
        `Unexpected API request: ${request.method()} ${url.pathname}`,
      );
    } catch (error) {
      state.routeErrors.push(error.message);
      return respond({ kind: "error", checkoutEnabled: false }, 500);
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  page.on("pageerror", (error) => state.pageErrors.push(error.message));
  return { context, page, state };
}

async function eventually(check, message, timeout = 12_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  assert.fail(message);
}

async function assertFocused(control, message) {
  await eventually(
    () => control.evaluate((element) => element === document.activeElement),
    message,
  );
}

async function assertNoOverflow(page) {
  const measurements = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(
    Math.max(measurements.document, measurements.body) <=
      measurements.viewport + 1,
    `The concept must fit its viewport: ${JSON.stringify(measurements)}`,
  );
}

async function assertReachable(control) {
  await control.scrollIntoViewIfNeeded();
  await eventually(
    () =>
      control.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          bounds.x + bounds.width / 2,
          bounds.y + bounds.height / 2,
        );
        return (
          bounds.width > 0 &&
          bounds.height > 0 &&
          bounds.left >= -1 &&
          bounds.right <= window.innerWidth + 1 &&
          bounds.top >= -1 &&
          bounds.bottom <= window.innerHeight + 1 &&
          element.contains(hit)
        );
      }),
    "The control must be fully in view and receive pointer input",
  );
}

async function capture(page, filename) {
  const directory = process.env.HOMEPAGE_VIEWS_SCREENSHOTS;
  if (!directory) return;
  await eventually(
    () =>
      page
        .locator("[data-scramble-glyph]")
        .evaluateAll((glyphs) =>
          glyphs.every(
            (glyph) =>
              glyph.getClientRects().length === 0 ||
              glyph.textContent === glyph.previousElementSibling?.textContent,
          ),
        ),
    "Visible text must finish resolving before review captures",
  );
  await mkdir(directory, { recursive: true });
  await page.screenshot({
    path: resolve(directory, filename),
    fullPage: false,
  });
}

function assertHealthy(state) {
  assert.deepEqual(
    state.pageErrors,
    [],
    "The page must not throw runtime errors",
  );
  assert.deepEqual(state.routeErrors, [], "Every API request must be mocked");
}

const cases = [];
for (const tone of ["light", "dark"]) {
  const path = "/";
  for (const [width, height] of [
    [1440, 900],
    [1366, 768],
    [390, 844],
    [320, 700],
  ]) {
    cases.push([
      `homepage views ${tone} ${width}x${height}: tray entry, specification fit and selection continuity`,
      async (browser) => {
        const { context, page, state } = await setup(browser, {
          viewport: { width, height },
          reducedMotion: width > 760 ? "no-preference" : "reduce",
          catalogProducts: productStories,
          initialTheme: tone,
        });
        try {
          await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });
          const originalURL = page.url();
          const main = page.locator('main[data-concept="01"]');
          const experience = page.locator('[data-embedded="true"]');
          const tray = page.getByRole("button", {
            name: "Explore matcha from the tray",
            exact: true,
          });
          assert.equal(await tray.isVisible(), true);
          await tray.click();
          await page.locator('main[data-handoff="complete"]').waitFor();
          assert.equal(page.url(), originalURL);
          assert.equal(await experience.getAttribute("data-mode"), "overview");
          assert.equal(await main.locator(":scope > header").count(), 1);
          const modes = page.getByRole("group", {
            name: "Shopping mode",
            exact: true,
          });
          assert.equal(await modes.getByRole("button").count(), 4);
          for (const name of ["Overview", "Specifications", "Origins", "Shop"])
            assert.equal(
              await modes
                .getByRole("button", { name, exact: true })
                .isVisible(),
              true,
            );
          const types = page.getByRole("group", {
            name: "Matcha to explore",
            exact: true,
          });
          const typeChoice = (name) =>
            types.getByRole("button", {
              name: `Select ${name}`,
              exact: true,
            });
          async function assertTypeHierarchy() {
            assert.equal(await types.count(), 1);
            assert.equal(
              await experience
                .locator("[data-homepage-product-choice]")
                .count(),
              3,
              "Every view must share one product chooser without hidden duplicates",
            );
            const typeBounds = await types.boundingBox();
            const modeBounds = await modes.boundingBox();
            const leftDesktop =
              width > 760 &&
              (await experience.getAttribute("data-selector-placement")) ===
                "left";
            assert.ok(
              typeBounds &&
                modeBounds &&
                (leftDesktop
                  ? typeBounds.x + typeBounds.width <= modeBounds.x + 1
                  : typeBounds.y + typeBounds.height <= modeBounds.y + 1),
              "Product type must remain before the product view navigation in the selected layout",
            );
            assert.equal(
              await types.evaluate((element) => {
                const views = element
                  .closest('[data-embedded="true"]')
                  .querySelector('[aria-label="Shopping mode"]');
                return Boolean(
                  element.compareDocumentPosition(views) &
                  Node.DOCUMENT_POSITION_FOLLOWING,
                );
              }),
              true,
              "Keyboard reading order must also place product type before views",
            );
            for (const control of await types.getByRole("button").all()) {
              assert.equal(await control.isVisible(), true);
              assert.ok((await control.boundingBox()).height >= 43.5);
            }
            assert.equal(
              await page
                .getByRole("group", { name: "Matcha grades", exact: true })
                .count(),
              0,
              "The material stage must not repeat the shared product chooser",
            );
          }
          await assertTypeHierarchy();
          const panel = (view) =>
            page.locator(`[data-homepage-view-panel="${view}"]`);
          async function assertOverviewDetails(productIndex) {
            const details = panel("overview").locator("[data-product-details]");
            assert.equal(await details.count(), 1);
            assert.equal(await details.isVisible(), true);
            assert.equal(
              await details.locator("summary").count(),
              0,
              "Overview product details must be readable without opening a disclosure",
            );
            for (const name of [
              "Formats & availability",
              "Application & preparation",
              "Product record",
            ])
              assert.equal(
                await details
                  .getByRole("heading", { name, exact: true })
                  .isVisible(),
                true,
              );
            const formats = details.getByRole("listitem");
            const expectedFormats = productStories[productIndex].variants;
            assert.equal(await formats.count(), expectedFormats.length);
            for (const [index, format] of expectedFormats.entries()) {
              const copy = await formats.nth(index).textContent();
              assert.ok(copy.includes(format.title));
              assert.ok(copy.includes(money(format.priceMinor)));
              assert.ok(
                copy.includes(
                  format.available ? "Available" : "Currently unavailable",
                ),
              );
            }
            assert.match(
              await details.textContent(),
              productIndex === 0
                ? /Keep the matcha dose, ingredients, method and serving size/
                : /Use your usual milk and sweetener/,
              "Preparation must follow the currently selected matcha",
            );
            assert.match(
              await details.textContent(),
              /have not yet been published/,
            );
            assert.equal(
              await panel("specifications")
                .locator("[data-product-details]")
                .count(),
              0,
              "Specifications must not retain a second product-details disclosure",
            );
          }
          await panel("overview").waitFor();
          assert.match(
            await panel("overview").textContent(),
            /Culinary Matcha/,
          );
          await assertOverviewDetails(0);
          assert.equal(
            await page
              .getByRole("button", { name: "Add to cart", exact: true })
              .count(),
            0,
          );
          await typeChoice("Barista Matcha").click();
          assert.match(await panel("overview").textContent(), /Barista Matcha/);
          await assertOverviewDetails(1);
          const initialReads = state.catalogReads;
          await page.evaluate(() => {
            window.__viewScene = document.querySelector("[data-renderer]");
            window.__viewChooser = document.querySelector(
              '[data-embedded="true"] [aria-label="Matcha to explore"]',
            );
          });
          async function switchView(name, mode) {
            await modes.getByRole("button", { name, exact: true }).click();
            await eventually(
              async () => (await experience.getAttribute("data-mode")) === mode,
              "The requested view must open inside the existing homepage",
            );
            assert.equal(page.url(), originalURL);
            assert.equal(await main.getAttribute("data-handoff"), "complete");
            await assertTypeHierarchy();
            assert.equal(
              await page.evaluate(
                () =>
                  document.querySelector(
                    '[data-embedded="true"] [aria-label="Matcha to explore"]',
                  ) === window.__viewChooser,
              ),
              true,
              "Changing views must retain the same product chooser",
            );
            assert.equal(
              await page.evaluate(
                () =>
                  document.querySelector("[data-renderer]") ===
                  window.__viewScene,
              ),
              true,
              "Changing views must retain the powder renderer",
            );
          }
          await switchView("Shop", "builder");
          assert.equal(await experience.getAttribute("data-step"), "1");
          assert.equal(
            await page
              .getByRole("navigation", { name: "Builder steps", exact: true })
              .count(),
            0,
          );
          assert.equal(
            await page
              .getByRole("button", {
                name: "Continue to quantity",
                exact: true,
              })
              .count(),
            0,
          );
          assert.equal(
            await page.getByRole("radio", { name: /Matcha/i }).count(),
            0,
          );
          await assertFocused(
            page.getByRole("heading", {
              name: "Format & quantity.",
              exact: true,
            }),
            "Shop must focus its immediately available purchase configuration",
          );
          const quantity = page.getByLabel("Quantity", { exact: true });
          await typeChoice("Culinary Matcha").click();
          const bundle = page.getByRole("button", {
            name: "5 × 1 kg",
            exact: true,
          });
          await bundle.click();
          await page
            .getByRole("button", { name: "Increase quantity", exact: true })
            .click();
          assert.equal(Number(await quantity.textContent()), 10);
          await typeChoice("Culinary Matcha").focus();
          await page.keyboard.press("Enter");
          await assertFocused(
            typeChoice("Culinary Matcha"),
            "Selecting a matcha must retain keyboard focus in the shared chooser",
          );
          assert.equal(await bundle.getAttribute("aria-pressed"), "true");
          assert.equal(
            Number(await quantity.textContent()),
            10,
            "Reselecting the active matcha must preserve its chosen format and quantity",
          );
          await typeChoice("Barista Matcha").click();
          assert.equal(await experience.getAttribute("data-mode"), "builder");
          assert.equal(Number(await quantity.textContent()), 1);
          await page
            .getByRole("button", { name: "Increase quantity", exact: true })
            .click();
          assert.equal(Number(await quantity.textContent()), 2);
          const reference = "STUDIO 04 / TASTING";
          if (width > 760) {
            await page
              .getByRole("button", { name: "Add label reference", exact: true })
              .click();
            const input = page.getByRole("textbox", {
              name: "Your reference",
              exact: true,
            });
            await assertFocused(
              input,
              "Opening personalization must focus the reference field",
            );
            for (const control of await types.getByRole("button").all())
              assert.equal(
                await control.isDisabled(),
                true,
                "The persistent chooser must preserve the active reference editing session",
              );
            await input.fill(reference);
            await page
              .getByRole("button", { name: "Done", exact: true })
              .click();
            for (const control of await types.getByRole("button").all())
              assert.equal(await control.isDisabled(), false);
          }
          await switchView("Overview", "overview");
          assert.match(await panel("overview").textContent(), /Barista Matcha/);
          await assertOverviewDetails(1);
          await switchView("Specifications", "specifications");
          const specifications = panel("specifications").locator(
            "[data-focused-specifications]",
          );
          const rows = specifications.locator("button[data-specification]");
          assert.equal(await rows.count(), 7);
          assert.equal(
            await specifications
              .locator("[data-focused-product-name]")
              .textContent(),
            "Barista Matcha",
          );
          const layout = await specifications.evaluate((root) => {
            const bounds = root.getBoundingClientRect();
            const clippedAncestors = [];
            for (
              let parent = root.parentElement;
              parent;
              parent = parent.parentElement
            ) {
              if (
                /(auto|scroll|hidden|clip)/.test(
                  getComputedStyle(parent).overflowY,
                )
              ) {
                const limit = parent.getBoundingClientRect();
                if (
                  bounds.top < limit.top - 1 ||
                  bounds.bottom > limit.bottom + 1
                )
                  clippedAncestors.push({
                    tag: parent.tagName,
                    top: limit.top,
                    bottom: limit.bottom,
                  });
              }
            }
            const clipped = [
              ...root.querySelectorAll("button[data-specification]"),
            ]
              .filter((button) => {
                const row = button.getBoundingClientRect();
                if (
                  row.top < -1 ||
                  row.bottom > window.innerHeight + 1 ||
                  row.left < -1 ||
                  row.right > window.innerWidth + 1 ||
                  button.scrollHeight > button.clientHeight + 1
                )
                  return true;
                for (
                  let parent = button.parentElement;
                  parent;
                  parent = parent.parentElement
                ) {
                  if (
                    /(auto|scroll|hidden|clip)/.test(
                      getComputedStyle(parent).overflowY,
                    )
                  ) {
                    const limit = parent.getBoundingClientRect();
                    if (
                      row.top < limit.top - 1 ||
                      row.bottom > limit.bottom + 1
                    )
                      return true;
                  }
                }
                return !button.contains(
                  document.elementFromPoint(
                    row.x + row.width / 2,
                    row.y + row.height / 2,
                  ),
                );
              })
              .map((button) => button.getAttribute("aria-label"));
            return {
              top: bounds.top,
              bottom: bounds.bottom,
              viewport: window.innerHeight,
              scrollY: window.scrollY,
              clipped,
              clippedAncestors,
            };
          });
          assert.deepEqual(
            layout.clipped,
            [],
            `All seven properties must fit together without scrolling: ${JSON.stringify(layout)}`,
          );
          assert.deepEqual(
            layout.clippedAncestors,
            [],
            `The specification heading must also remain visible: ${JSON.stringify(layout)}`,
          );
          assert.ok(
            layout.top >= -1 && layout.bottom <= height + 1,
            `The specification heading and seven rows must fit: ${JSON.stringify(layout)}`,
          );
          if (width <= 760)
            assert.equal(
              await experience.locator("[data-product-object]").isVisible(),
              false,
              "Phones must devote the Specifications view to its seven properties",
            );
          await assertNoOverflow(page);
          for (const control of await modes.getByRole("button").all()) {
            const bounds = await control.boundingBox();
            assert.ok(bounds.height >= 43.5 && bounds.width > 0);
          }
          await capture(
            page,
            `homepage-views-${tone}-${width}x${height}-specifications.png`,
          );
          const firstRow = rows.first();
          await firstRow.focus();
          await page.keyboard.press("Enter");
          const explanation = specifications.getByRole("dialog");
          await explanation.waitFor();
          await assertFocused(
            explanation.getByRole("button", {
              name: "Close specification explanation",
              exact: true,
            }),
            "Explanation must focus its close control",
          );
          const dialogTheme = await explanation.evaluate((element) => ({
            tone: element.dataset.tone,
            scheme: getComputedStyle(element).colorScheme,
          }));
          assert.ok(
            dialogTheme.tone === tone || dialogTheme.scheme === tone,
            `Specification explanation must follow the active theme: ${JSON.stringify(dialogTheme)}`,
          );
          await page.keyboard.press("Escape");
          await explanation.waitFor({ state: "hidden" });
          await assertFocused(
            firstRow,
            "Closing an explanation must restore its specification row",
          );
          await switchView("Origins", "origins");
          assert.match(await panel("origins").textContent(), /Barista Matcha/);
          assert.match(
            await panel("origins").textContent(),
            /Origin details have not been published/,
          );
          assert.equal(
            await panel("origins")
              .getByText("Not yet published", { exact: true })
              .count(),
            1,
            "Origins must expose one honest publication status without duplicate empty chapters",
          );
          assert.equal(
            await panel("origins")
              .getByRole("heading", { name: "People", exact: true })
              .count(),
            0,
          );
          assert.equal(
            await page
              .getByRole("button", { name: "Add to cart", exact: true })
              .count(),
            0,
          );
          await switchView("Specifications", "specifications");
          const otherTone = tone === "dark" ? "light" : "dark";
          const themeSwitch = page.getByRole("switch", {
            name: "Dark mode",
            exact: true,
          });
          const historyLength = await page.evaluate(
            () => window.history.length,
          );
          await themeSwitch.click();
          await page.locator(`main[data-tone="${otherTone}"]`).waitFor();
          assert.equal(
            await experience.getAttribute("data-mode"),
            "specifications",
          );
          assert.equal(
            await specifications
              .locator("[data-focused-product-name]")
              .textContent(),
            "Barista Matcha",
          );
          assert.equal(await main.getAttribute("data-handoff"), "complete");
          assert.equal(page.url(), originalURL);
          assert.equal(
            await page.evaluate(() => window.history.length),
            historyLength,
          );
          await themeSwitch.click();
          await page.locator(`main[data-tone="${tone}"]`).waitFor();
          assert.equal(page.url(), originalURL);
          assert.equal(
            await experience.getAttribute("data-mode"),
            "specifications",
          );
          await switchView("Shop", "builder");
          assert.equal(
            Number(await quantity.textContent()),
            2,
            "Product view and theme changes must preserve quantity",
          );
          assert.equal(
            await page
              .locator('[data-label-card] [data-label-field="name"]')
              .textContent(),
            "Barista Matcha",
          );
          if (width > 760)
            assert.equal(
              await page
                .locator('[data-label-card] [data-label-field="reference"]')
                .textContent(),
              reference,
            );
          assert.equal(
            state.catalogReads,
            initialReads,
            "Views and appearance changes must not reload the catalog",
          );
          const add = page.getByRole("button", {
            name: "Add to cart",
            exact: true,
          });
          await assertReachable(add);
          let release;
          state.nextMutationGate = new Promise((resolve) => {
            release = resolve;
          });
          try {
            await add.click();
            await eventually(
              () => state.actions.length === 1,
              "Purchase must reach only the mocked cart route",
            );
            for (const control of await modes.getByRole("button").all())
              assert.equal(
                await control.isDisabled(),
                true,
                "Views must not interrupt a pending purchase",
              );
            const productControls = experience.locator(
              "[data-homepage-product-choice]",
            );
            assert.equal(await productControls.count(), 3);
            for (const control of await productControls.all())
              assert.equal(
                await control.isDisabled(),
                true,
                "The shared product chooser must not interrupt a pending purchase",
              );
            await productControls
              .first()
              .evaluate((element) => element.click());
            assert.equal(
              await typeChoice("Barista Matcha").getAttribute("aria-pressed"),
              "true",
              "A disabled product action must retain the pending selection",
            );
            assert.equal(state.actions.length, 1);
            assert.equal(
              await page
                .getByRole("button", { name: "Increase quantity", exact: true })
                .isDisabled(),
              true,
            );
          } finally {
            release();
          }
          const cart = page.getByRole("dialog", { name: /Your selection/ });
          await cart.waitFor();
          assert.deepEqual(state.actions[0], {
            action: "add",
            productHandle: "matcha-two",
            variantKey: productStories[1].variants[0].id,
            quantity: 2,
          });
          assert.match(await cart.textContent(), /Barista Matcha/);
          await page.keyboard.press("Escape");
          await cart.waitFor({ state: "hidden" });
          await page
            .getByRole("button", { name: "Back to overview", exact: true })
            .click();
          await page.locator('main[data-exploring="false"]').waitFor();
          await assertFocused(
            tray,
            "Closing selection must restore the original tray entry",
          );
          assert.equal(page.url(), originalURL);
          await assertNoOverflow(page);
          assertHealthy(state);
        } finally {
          await context.close();
        }
      },
    ]);
  }
}

const browser = await chromium.launch({
  headless: true,
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
});
const selected = process.env.HOMEPAGE_VIEWS_FILTER
  ? cases.filter(([name]) =>
      new RegExp(process.env.HOMEPAGE_VIEWS_FILTER).test(name),
    )
  : cases;
assert.ok(selected.length, "The filter must select a check");
let failed = 0;
try {
  for (const [name, run] of selected) {
    try {
      await run(browser);
      console.log(`PASS ${name}`);
    } catch (error) {
      failed++;
      console.error(`FAIL ${name}\n${error.stack ?? error}`);
    }
  }
} finally {
  await browser.close();
}
console.log(
  `${selected.length - failed}/${selected.length} homepage view checks passed.`,
);
if (failed) process.exitCode = 1;
