/* Isolated homepage concept checks. Commerce requests are fulfilled in memory. */
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
  process.env.HOMEPAGE_CONCEPTS_BASE_URL ?? "http://127.0.0.1:3100";
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
  const { catalogProducts = products, ...browserOptions } = options;
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
    ...browserOptions,
  });
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
  const directory = process.env.HOMEPAGE_CONCEPTS_SCREENSHOTS;
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
const displayNames = ["Culinary Matcha", "Barista Matcha", "Ceremonial Matcha"];

for (const path of ["/concept-08", "/concept-09"]) {
  for (const width of [1440, 390, 320]) {
    cases.push([
      `${path} ${width}px: product information, rules and mocked purchase stay connected`,
      async (browser) => {
        const { context, page, state } = await setup(browser, {
          viewport: { width, height: 900 },
          reducedMotion: width === 1440 ? "no-preference" : "reduce",
          catalogProducts: productStories,
        });
        try {
          await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });
          await page.evaluate(() => document.fonts.ready);
          const choices = page.locator("button[data-concept-product]");
          await eventually(
            async () => (await choices.count()) === productStories.length,
            "The collection must be built from the returned catalog products",
          );
          assert.deepEqual(
            (
              await choices.evaluateAll((elements) =>
                elements.map((element) => element.dataset.conceptProduct),
              )
            ).sort(),
            productStories.map((product) => product.id).sort(),
          );
          const details = page.locator("[data-concept-product-details]");
          const purchase = page.locator("[data-concept-purchase]");
          assert.deepEqual(
            await page
              .locator('main a[href^="#"]')
              .evaluateAll((links) =>
                links
                  .filter(
                    (link) => !document.getElementById(link.hash.slice(1)),
                  )
                  .map((link) => link.hash),
              ),
            [],
            "Every chapter and purchase anchor must have a real destination",
          );
          for (const [index, product] of productStories.entries()) {
            const choice = page.locator(
              `button[data-concept-product="${product.id}"]`,
            );
            await assertReachable(choice);
            if (index === 1) {
              await choice.focus();
              await page.keyboard.press("Enter");
              await assertFocused(
                choice,
                "Keyboard selection must retain the selected product control",
              );
            } else await choice.click();
            await eventually(
              async () =>
                (await choice.getAttribute("aria-pressed")) === "true",
              "The active collection item must follow the chosen catalog product",
            );
            assert.equal(
              await page
                .locator('button[data-concept-product][aria-pressed="true"]')
                .count(),
              1,
            );
            await eventually(
              async () =>
                (
                  await details
                    .locator("[data-concept-product-name]")
                    .textContent()
                ).includes(displayNames[index]),
              "Specifications must follow the selected catalog identity",
            );
            assert.match(
              await details.textContent(),
              /Sample material profiles/i,
            );
            if (index === 2) {
              const unavailable = purchase.getByRole("button", {
                name: "Currently unavailable",
                exact: true,
              });
              await unavailable.waitFor();
              assert.equal(
                await unavailable.isDisabled(),
                true,
                "Published unavailability must prevent adding the product",
              );
              assert.equal(state.actions.length, 0);
            }
          }
          await page
            .locator('button[data-concept-product="matcha-one"]')
            .click();
          await page.locator('a[href="#specifications"]').first().click();
          const profile = details.locator("details").first();
          await profile.locator("summary").focus();
          await page.keyboard.press("Enter");
          assert.equal(
            await profile.evaluate((element) => element.open),
            true,
            "Specifications must expand through native keyboard interaction",
          );
          assert.equal(await profile.locator("p").isVisible(), true);
          await assertNoOverflow(page);
          await capture(page, `${path.slice(1)}-${width}-specifications.png`);
          const format = purchase.getByRole("combobox", {
            name: "Format",
            exact: true,
          });
          await format.selectOption(productStories[0].variants[2].id);
          assert.equal(
            await purchase
              .getByRole("button", {
                name: "Currently unavailable",
                exact: true,
              })
              .isDisabled(),
            true,
            "An unavailable format must stay blocked within an otherwise purchasable product",
          );
          await format.selectOption({ label: "5 × 1 kg" });
          const quantity = purchase.locator(
            'output[aria-label="Selected quantity"]',
          );
          const decrease = purchase.getByRole("button", {
            name: "Decrease quantity",
            exact: true,
          });
          const increase = purchase.getByRole("button", {
            name: "Increase quantity",
            exact: true,
          });
          await eventually(
            async () => Number(await quantity.textContent()) === 5,
            "Changing format must apply the published minimum quantity",
          );
          assert.equal(await decrease.isDisabled(), true);
          await assertReachable(increase);
          await increase.click();
          assert.equal(Number(await quantity.textContent()), 10);
          await increase.click();
          assert.equal(Number(await quantity.textContent()), 15);
          assert.equal(
            await increase.isDisabled(),
            true,
            "Published maximum must stop further increments",
          );
          await decrease.click();
          assert.equal(Number(await quantity.textContent()), 10);
          assert.match(
            await purchase.textContent(),
            /60,000/,
            "The displayed total must use the selected format price and quantity",
          );
          await assertNoOverflow(page);
          await capture(page, `${path.slice(1)}-${width}-purchase.png`);
          const add = purchase.getByRole("button", {
            name: "Add to cart",
            exact: true,
          });
          await assertReachable(add);
          await add.click();
          const cart = page.getByRole("dialog", { name: /Your selection/ });
          await cart.waitFor();
          await eventually(
            () => state.actions.length === 1,
            "Add must reach only the mocked cart route",
          );
          assert.deepEqual(state.actions[0], {
            action: "add",
            productHandle: productStories[0].handle,
            variantKey: productStories[0].variants[1].id,
            quantity: 10,
          });
          assert.match(await cart.textContent(), /Culinary Matcha/);
          assert.match(await cart.textContent(), /5 × 1 kg/);
          await assertNoOverflow(page);
          await capture(page, `${path.slice(1)}-${width}-cart.png`);
          await page.keyboard.press("Escape");
          await cart.waitFor({ state: "hidden" });
          await assertFocused(
            add,
            "Closing the cart must restore the purchase action",
          );

          for (const id of ["origins", "people"]) {
            const destination = page.locator(`#${id}`);
            await destination.waitFor();
            assert.match(
              await destination.textContent(),
              /not (?:yet )?published|unpublished/i,
              "Unverified origin and people chapters must state their publication status",
            );
            assert.doesNotMatch(
              await destination.textContent(),
              /\b(?:Wazuka|Kyoto|Uji|Kagoshima|certified|organic)\b/i,
              "Unpublished stories must not invent product provenance or certifications",
            );
            const anchor = page.locator(`a[href="#${id}"]`).first();
            await anchor.click();
            assert.equal(new URL(page.url()).hash, `#${id}`);
            await eventually(
              () =>
                destination.evaluate((element) => {
                  const bounds = element.getBoundingClientRect();
                  return bounds.top < window.innerHeight && bounds.bottom > 0;
                }),
              "Chapter links must scroll to their real destination",
            );
            await assertNoOverflow(page);
          }
          await capture(page, `${path.slice(1)}-${width}-provenance.png`);
          await page.evaluate(() =>
            window.scrollTo({ top: 0, behavior: "instant" }),
          );
          await capture(page, `${path.slice(1)}-${width}-hero.png`);
          assertHealthy(state);
        } finally {
          await context.close();
        }
      },
    ]);
  }
}

for (const [width, height] of [
  [1440, 900],
  [1366, 768],
  [390, 844],
  [320, 700],
]) {
  cases.push([
    `focused specifications ${width}x${height}: all seven properties fit and selection survives view changes`,
    async (browser) => {
      const { context, page, state } = await setup(browser, {
        viewport: { width, height },
        reducedMotion: width > 760 ? "no-preference" : "reduce",
        catalogProducts: productStories,
      });
      try {
        await page.goto(`${baseURL}/concept-08/focus`, {
          waitUntil: "networkidle",
        });
        await page.evaluate(() => document.fonts.ready);
        const main = page.locator('main[data-concept="08-focus"]');
        const views = page.getByRole("group", {
          name: "Product view",
          exact: true,
        });
        const specifications = page.locator("[data-focused-specifications]");
        const rows = specifications.locator("button[data-specification]");
        const purchase = page.locator("[data-concept-purchase]");
        const quantity = purchase.locator(
          'output[aria-label="Selected quantity"]',
        );
        await specifications.waitFor();
        assert.equal(
          await main.getAttribute("data-focus-view"),
          "specifications",
        );
        assert.equal(await rows.count(), 7);
        assert.deepEqual(
          await rows.evaluateAll((buttons) =>
            buttons.map(
              (button) => button.getAttribute("aria-label").split(":")[0],
            ),
          ),
          [
            "Aroma",
            "Flavour",
            "Umami",
            "Bitterness",
            "Texture",
            "Colour",
            "Finish",
          ],
        );

        async function allSpecificationsFit() {
          const layout = await specifications.evaluate((root) => {
            const viewport = {
              width: window.innerWidth,
              height: window.innerHeight,
            };
            const bounds = root.getBoundingClientRect();
            const clipped = [
              ...root.querySelectorAll("button[data-specification]"),
            ]
              .filter((button) => {
                const row = button.getBoundingClientRect();
                if (
                  row.left < -1 ||
                  row.top < -1 ||
                  row.right > viewport.width + 1 ||
                  row.bottom > viewport.height + 1 ||
                  button.scrollHeight > button.clientHeight + 1
                )
                  return true;
                for (
                  let parent = button.parentElement;
                  parent;
                  parent = parent.parentElement
                ) {
                  const style = getComputedStyle(parent);
                  if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
                    const limit = parent.getBoundingClientRect();
                    if (
                      row.top < limit.top - 1 ||
                      row.bottom > limit.bottom + 1
                    )
                      return true;
                  }
                }
                const hit = document.elementFromPoint(
                  row.x + row.width / 2,
                  row.y + row.height / 2,
                );
                return !button.contains(hit);
              })
              .map((button) => button.getAttribute("aria-label"));
            return {
              viewport,
              rootTop: bounds.top,
              rootBottom: bounds.bottom,
              documentHeight: Math.max(
                document.documentElement.scrollHeight,
                document.body.scrollHeight,
              ),
              scrollY: window.scrollY,
              clipped,
            };
          });
          assert.deepEqual(
            layout.clipped,
            [],
            `All seven rows must be visible together, without scrolling: ${JSON.stringify(layout)}`,
          );
          assert.ok(
            layout.rootTop >= -1 && layout.rootBottom <= height + 1,
            `The specification heading and seven rows must fit together: ${JSON.stringify(layout)}`,
          );
          assert.ok(
            layout.documentHeight <= height + 1 && layout.scrollY === 0,
            `Specifications must not require page scrolling: ${JSON.stringify(layout)}`,
          );
          await assertNoOverflow(page);
        }
        async function switchView(name, value) {
          await views.getByRole("button", { name, exact: true }).click();
          await eventually(
            async () => (await main.getAttribute("data-focus-view")) === value,
            "The selected view must open in the same stage",
          );
        }
        await allSpecificationsFit();
        const selected = page.locator(
          'button[data-concept-product="matcha-two"]',
        );
        await selected.focus();
        await page.keyboard.press("Enter");
        await eventually(
          async () => (await selected.getAttribute("aria-pressed")) === "true",
          "Keyboard product selection must update the current material",
        );
        assert.equal(
          await main.getAttribute("data-focus-view"),
          "specifications",
        );
        assert.equal(
          await specifications
            .locator("[data-focused-product-name]")
            .textContent(),
          "Barista Matcha",
        );
        await allSpecificationsFit();
        if (width > 760)
          await eventually(
            () =>
              main.locator("[data-masked] img").evaluate((image) => {
                if (
                  !image.complete ||
                  image.naturalWidth === 0 ||
                  image.parentElement.dataset.pending === "true" ||
                  image.parentElement.dataset.masked !== "true"
                )
                  return false;
                let opacity = 1;
                for (
                  let element = image;
                  element;
                  element = element.parentElement
                )
                  opacity *= Number(getComputedStyle(element).opacity);
                return opacity >= 0.99;
              }),
            "The selected material photograph must finish loading and appearing before review",
          );
        await capture(
          page,
          `concept-08-focus-${width}x${height}-specifications.png`,
        );

        const firstRow = rows.first();
        await firstRow.focus();
        await page.keyboard.press("Enter");
        const explanation = specifications.getByRole("dialog");
        await explanation.waitFor();
        const closeExplanation = explanation.getByRole("button", {
          name: "Close specification explanation",
          exact: true,
        });
        await assertFocused(
          closeExplanation,
          "A specification explanation must focus its close control",
        );
        assert.match(
          await explanation.textContent(),
          /A fresh leafy opening sets the direction for the drink/,
        );
        assert.equal(
          (await explanation.getByRole("heading").textContent()).trim(),
          "Fresh green",
        );
        await page.keyboard.press("Escape");
        await explanation.waitFor({ state: "hidden" });
        await assertFocused(
          firstRow,
          "Escape must restore focus to the property that opened the explanation",
        );
        await allSpecificationsFit();

        await switchView("Shop", "shop");
        const increase = purchase.getByRole("button", {
          name: "Increase quantity",
          exact: true,
        });
        await assertReachable(increase);
        await increase.click();
        assert.equal(Number(await quantity.textContent()), 2);
        const options = purchase.locator("details");
        await options.locator("summary").click();
        assert.equal(await options.evaluate((element) => element.open), true);
        await switchView("Overview", "overview");
        assert.equal(await selected.getAttribute("aria-pressed"), "true");
        await switchView("Specifications", "specifications");
        assert.equal(
          await specifications
            .locator("[data-focused-product-name]")
            .textContent(),
          "Barista Matcha",
        );
        await allSpecificationsFit();
        await switchView("Shop", "shop");
        assert.equal(await selected.getAttribute("aria-pressed"), "true");
        assert.equal(
          Number(await quantity.textContent()),
          2,
          "Changing views must retain the chosen quantity",
        );
        assert.equal(
          await options.evaluate((element) => element.open),
          true,
          "Switching panes must preserve the buyer's expanded purchase options",
        );
        await options.locator("summary").click();
        const add = purchase.getByRole("button", {
          name: "Add to cart",
          exact: true,
        });
        await assertReachable(add);
        await capture(page, `concept-08-focus-${width}x${height}-shop.png`);
        let releasePurchase;
        state.nextMutationGate = new Promise((resolve) => {
          releasePurchase = resolve;
        });
        try {
          await add.click();
          await eventually(
            () => state.actions.length === 1,
            "The purchase must reach the mocked pending response",
          );
          for (const control of [
            ...(await views.getByRole("button").all()),
            ...(await page.locator("button[data-concept-product]").all()),
            purchase.getByRole("combobox", { name: "Format", exact: true }),
          ])
            assert.equal(
              await control.isDisabled(),
              true,
              "Selection and view controls must stay stable while a purchase is being submitted",
            );
        } finally {
          releasePurchase();
        }
        const cart = page.getByRole("dialog", { name: /Your selection/ });
        await cart.waitFor();
        assert.deepEqual(state.actions, [
          {
            action: "add",
            productHandle: "matcha-two",
            variantKey: productStories[1].variants[0].id,
            quantity: 2,
          },
        ]);
        await page.keyboard.press("Escape");
        await cart.waitFor({ state: "hidden" });
        await assertFocused(
          add,
          "Cart must restore the focused purchase action",
        );
        await switchView("Specifications", "specifications");
        await allSpecificationsFit();
        assertHealthy(state);
      } finally {
        await context.close();
      }
    },
  ]);
}

for (const mode of ["empty", "unavailable"]) {
  cases.push([
    `catalog ${mode}: neither concept substitutes purchasable sample products`,
    async (browser) => {
      for (const path of ["/concept-08", "/concept-09"]) {
        const { context, page, state } = await setup(browser, {
          reducedMotion: "reduce",
        });
        state.catalogMode = mode;
        try {
          await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });
          assert.ok(state.catalogReads >= 1);
          assert.equal(
            await page.locator("button[data-concept-product]").count(),
            0,
          );
          assert.equal(
            await page
              .getByRole("button", { name: "Add to cart", exact: true })
              .count(),
            0,
          );
          assert.equal(state.actions.length, 0);
          const details = page.locator("[data-concept-product-details]");
          assert.match(
            await details.textContent(),
            mode === "empty"
              ? /selection is taking shape/i
              : /couldn’t be loaded/i,
          );
          if (mode === "unavailable") {
            state.catalogMode = "ready";
            await details.getByRole("button", { name: /Try again/ }).click();
            await eventually(
              async () =>
                (await page.locator("button[data-concept-product]").count()) ===
                products.length,
              "A failed catalog must recover through its real retry action",
            );
          }
          assertHealthy(state);
        } finally {
          await context.close();
        }
      }
    },
  ]);
}

cases.push([
  "homepage comparison: both concepts remain directly reachable",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      viewport: { width: 320, height: 844 },
      reducedMotion: "reduce",
    });
    try {
      for (const path of ["/concept-08", "/concept-09"]) {
        await page.goto(`${baseURL}/homepage-study`, {
          waitUntil: "networkidle",
        });
        const link = page.locator(`a[href="${path}"]`).first();
        await assertReachable(link);
        await assertNoOverflow(page);
        await link.click();
        await page.waitForURL(`${baseURL}${path}`);
        await page.locator("[data-concept-product-details]").waitFor();
      }
      assert.equal(state.actions.length, 0);
      assertHealthy(state);
    } finally {
      await context.close();
    }
  },
]);

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : { channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome" }),
  });
  const selectedCases = process.env.HOMEPAGE_CONCEPTS_FILTER
    ? cases.filter(([name]) =>
        new RegExp(process.env.HOMEPAGE_CONCEPTS_FILTER).test(name),
      )
    : cases;
  assert.ok(selectedCases.length, "The filter must select at least one check");
  let failed = 0;
  try {
    for (const [name, run] of selectedCases) {
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
    `${selectedCases.length - failed}/${selectedCases.length} homepage concept checks passed.`,
  );
  if (failed) process.exitCode = 1;
})();
