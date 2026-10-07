/* Retail collection and product-page checks. Every commerce request is mocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.RETAIL_SHOP_BASE_URL ?? "http://127.0.0.1:3100";
const screenshots = process.env.RETAIL_SHOP_SCREENSHOTS;
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
      variant("e", "500 g", 700),
      variant("f", "100 g", 300, { available: false }),
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
  handle: product.id,
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
    gate: null,
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

async function assertNoOverflow(page) {
  const sizes = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(
    Math.max(sizes.document, sizes.body) <= sizes.viewport + 1,
    `The retail page must fit horizontally: ${JSON.stringify(sizes)}`,
  );
}

async function assertReachable(control) {
  await control.scrollIntoViewIfNeeded();
  await eventually(
    () =>
      control.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return (
          box.width > 0 &&
          box.height > 0 &&
          box.left >= -1 &&
          box.right <= innerWidth + 1 &&
          box.top >= -1 &&
          box.bottom <= innerHeight + 1 &&
          element.contains(
            document.elementFromPoint(
              box.x + box.width / 2,
              box.y + box.height / 2,
            ),
          )
        );
      }),
    "The purchase control must be visible and receive pointer input",
  );
}

async function assertPhotoLoaded(photo) {
  await photo.scrollIntoViewIfNeeded();
  await eventually(
    () =>
      photo.evaluate(
        (image) =>
          image.complete &&
          image.naturalWidth > 0 &&
          image.parentElement.dataset.pending !== "true" &&
          Number(getComputedStyle(image).opacity) >= 0.99,
      ),
    "The material photograph must load before product navigation",
  );
}

function assertHealthy(state) {
  assert.deepEqual(
    state.errors,
    [],
    "The page must render without runtime errors and all commerce requests must be mocked",
  );
}

async function assertPalette(page, tone) {
  const expected =
    tone === "light"
      ? { surface: "#f1f5ef", ink: "#263b34", color: "rgb(38, 59, 52)" }
      : { surface: "#080b11", ink: "#e9eef2", color: "rgb(233, 238, 242)" };
  const actual = await page.locator("main").evaluate((main) => {
    const body = getComputedStyle(document.body);
    const style = getComputedStyle(main);
    return {
      marker: main.getAttribute("data-storefront-theme"),
      surface: body.getPropertyValue("--color-surface").trim(),
      ink: body.getPropertyValue("--color-ink").trim(),
      color: style.color,
      scheme: style.colorScheme,
      background: style.backgroundImage,
    };
  });
  assert.equal(actual.marker, tone);
  assert.equal(actual.surface, expected.surface);
  assert.equal(actual.ink, expected.ink);
  assert.equal(actual.color, expected.color);
  assert.equal(actual.scheme, tone);
  assert.notEqual(actual.background, "none");
  assert.equal(
    await page
      .locator("main > footer")
      .getByRole("switch", { name: "Dark mode", exact: true })
      .getAttribute("aria-checked"),
    String(tone === "dark"),
  );
  assert.equal(
    await page
      .getByRole("navigation", { name: "Appearance", exact: true })
      .count(),
    0,
    "The regular site uses one persistent footer switch",
  );
}

async function changeTheme(page, tone, keyboard = false) {
  const control = page
    .locator("main > footer")
    .getByRole("switch", { name: "Dark mode", exact: true });
  assert.equal(await control.isEnabled(), true);
  const checked = String(tone === "dark");
  if ((await control.getAttribute("aria-checked")) === checked) return;
  const beforeURL = page.url();
  const historyLength = await page.evaluate(() => history.length);
  const main = await page.locator("main").elementHandle();
  if (keyboard) {
    await control.focus();
    await page.keyboard.press("Space");
  } else await control.click();
  await page.locator(`main[data-tone="${tone}"]`).waitFor();
  await assertPalette(page, tone);
  assert.equal(page.url(), beforeURL, "Theme changes do not navigate");
  assert.equal(
    await page.evaluate(() => history.length),
    historyLength,
    "Theme changes do not add browser history entries",
  );
  assert.equal(
    await main.evaluate(
      (element) => element === document.querySelector("main"),
    ),
    true,
    "The same page remains mounted during theme changes",
  );
  assert.equal(
    (await page.context().cookies(baseURL)).find(
      (cookie) => cookie.name === "atoma-theme",
    )?.value,
    tone,
    "The chosen appearance persists in the site theme cookie",
  );
}

async function assertOverlayPalette(overlay, tone) {
  const actual = await overlay.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, scheme: style.colorScheme };
  });
  assert.deepEqual(actual, {
    color: tone === "light" ? "rgb(38, 59, 52)" : "rgb(233, 238, 242)",
    scheme: tone,
  });
}

async function openFromCollection(
  page,
  tone,
  gesture = "image",
  name = "Culinary",
) {
  const basePath = "/shop";
  await page.goto(`${baseURL}${basePath}`, { waitUntil: "domcontentloaded" });
  const collection = page.getByRole("region", {
    name: "Matcha collection",
    exact: true,
  });
  await collection.waitFor();
  await assertPalette(page, "light");
  await changeTheme(page, tone, true);
  await assertPalette(page, tone);
  assert.equal(await collection.getByRole("link").count(), products.length);
  for (const product of products) {
    const displayName = {
      culinary: "Culinary Matcha",
      barista: "Barista Matcha",
      premium: "Ceremonial Matcha",
    }[product.id];
    const card = collection.getByRole("link", {
      name: `View ${displayName}`,
      exact: true,
    });
    assert.equal(
      await card.getAttribute("href"),
      `${basePath}/${product.handle}`,
    );
    assert.equal(
      await card.locator("a, button, input, select").count(),
      0,
      "A collection card must remain one native link without nested controls",
    );
    await assertPhotoLoaded(card.locator("img").first());
  }
  assert.match(
    await collection
      .locator('[data-shop-product="culinary"] [data-shop-from-price]')
      .textContent(),
    /¥700/,
    "The starting price must exclude the cheaper unavailable format",
  );
  assert.equal(
    await collection
      .getByRole("button", { name: "Add to cart", exact: true })
      .count(),
    0,
  );
  assert.equal(
    await collection.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
    true,
    "The collection must use normal page flow without a horizontal carousel",
  );
  await assertNoOverflow(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await capture(page, `collection-${tone}-${page.viewportSize().width}`);
  const card = collection.getByRole("link", {
    name: `View ${name} Matcha`,
    exact: true,
  });
  if (gesture === "keyboard") {
    await card.focus();
    await page.keyboard.press("Enter");
  } else if (gesture === "name") {
    await card
      .getByRole("heading", { name: `${name} Matcha`, exact: true })
      .click();
  } else {
    const photo = card.locator("img").first();
    await photo.scrollIntoViewIfNeeded();
    const cardBox = await card.boundingBox();
    const photoBox = await photo.boundingBox();
    await card.click({
      position: {
        x: photoBox.x + photoBox.width / 2 - cardBox.x,
        y: photoBox.y + photoBox.height / 2 - cardBox.y,
      },
    });
  }
  await page.waitForURL(`${baseURL}${basePath}/${name.toLowerCase()}`);
  await page
    .getByRole("heading", { name: `${name} Matcha`, exact: true, level: 1 })
    .waitFor();
  return basePath;
}

const cases = [];
for (const tone of ["dark", "light"]) {
  cases.push([
    `retail ${tone}: linked cards, product content and canonical purchase`,
    async (browser) => {
      const { context, page, state } = await setup(browser, 1440, 900);
      try {
        const basePath = await openFromCollection(
          page,
          tone,
          tone === "dark" ? "image" : "name",
        );
        await page.reload({ waitUntil: "domcontentloaded" });
        await page
          .getByRole("heading", {
            name: "Culinary Matcha",
            level: 1,
            exact: true,
          })
          .waitFor();
        const main = page.locator('main[data-retail-product="culinary"]');
        const purchase = page.getByRole("region", {
          name: "Purchase Culinary Matcha",
          exact: true,
        });
        const formats = purchase.getByRole("group", {
          name: "Format",
          exact: true,
        });
        const quantity = purchase.getByLabel("Quantity", { exact: true });
        const increase = purchase.getByRole("button", {
          name: "Increase quantity",
          exact: true,
        });
        const decrease = purchase.getByRole("button", {
          name: "Decrease quantity",
          exact: true,
        });
        const bundle = formats.getByRole("button", {
          name: "5 × 1 kg",
          exact: true,
        });
        await assertPhotoLoaded(main.locator("figure img").first());
        assert.equal(await main.getAttribute("data-tone"), tone);
        await assertPalette(page, tone);
        assert.equal(Number(await quantity.textContent()), 1);
        await bundle.focus();
        await page.keyboard.press("Enter");
        assert.equal(Number(await quantity.textContent()), 5);
        assert.equal(await decrease.isDisabled(), true);
        await increase.click();
        await increase.click();
        assert.equal(Number(await quantity.textContent()), 15);
        assert.equal(await increase.isDisabled(), true);
        await decrease.click();
        assert.equal(Number(await quantity.textContent()), 10);
        assert.match(await purchase.textContent(), /¥60,000/);
        const unavailableFormat = formats.getByRole("button", {
          name: /100 g.*Unavailable/,
        });
        await unavailableFormat.click();
        assert.equal(
          await purchase
            .getByRole("button", { name: "Currently unavailable", exact: true })
            .isDisabled(),
          true,
        );
        assert.equal(await increase.isDisabled(), true);
        assert.equal(await decrease.isDisabled(), true);
        await bundle.click();
        await increase.click();
        const purchaseOptions = purchase.locator("details");
        await purchaseOptions.locator("summary").click();
        assert.equal(
          await purchase
            .getByRole("radio", { name: "One-time purchase", exact: true })
            .isChecked(),
          true,
        );
        assert.equal(
          await purchase
            .getByRole("radio", {
              name: "Subscribe — unavailable",
              exact: true,
            })
            .isDisabled(),
          true,
        );
        await purchaseOptions.locator("summary").click();

        const specifications = main.locator("[data-retail-specifications]");
        assert.equal(
          await specifications.locator("[data-retail-specification]").count(),
          7,
        );
        assert.deepEqual(
          await specifications
            .locator("[data-retail-specification] summary > span:first-child")
            .allTextContents(),
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
        const firstProperty = specifications
          .locator("[data-retail-specification]")
          .first();
        const propertyTrigger = firstProperty.locator("summary");
        await propertyTrigger.focus();
        await page.keyboard.press("Enter");
        assert.equal(
          await firstProperty.evaluate((element) => element.open),
          true,
        );
        assert.equal(await firstProperty.locator("p").isVisible(), true);
        await page.keyboard.press("Space");
        assert.equal(
          await firstProperty.evaluate((element) => element.open),
          false,
        );
        assert.equal(
          await propertyTrigger.evaluate(
            (element) => element === document.activeElement,
          ),
          true,
        );
        await page.keyboard.press("Enter");
        const material = main.locator("[data-retail-material-use]");
        await material.locator("summary").click();
        for (const heading of ["Use & preparation", "What to look for"])
          assert.equal(
            await material
              .getByRole("heading", { name: heading, exact: true })
              .isVisible(),
            true,
          );
        await material.locator("summary").click();
        const details = main.locator("[data-product-details]");
        assert.equal(
          await details.evaluate(
            (element) => element.tagName === "DETAILS" && !element.open,
          ),
          true,
          "The dedicated retail page must retain its initially closed product-details disclosure",
        );
        await details.locator("summary").click();
        for (const heading of [
          "Formats & availability",
          "Application & preparation",
          "Product record",
        ])
          assert.equal(
            await details
              .getByRole("heading", { name: heading, exact: true })
              .isVisible(),
            true,
          );
        assert.match(
          await details.textContent(),
          /Further product details are awaiting supplier confirmation/,
        );
        assert.equal(
          await details.locator("[data-provisional-detail]").count(),
          3,
        );
        await details.locator("summary").click();

        const otherTone = tone === "dark" ? "light" : "dark";
        await page.evaluate(() => {
          window.__retailPurchase = document.querySelector(
            '[aria-label="Purchase Culinary Matcha"]',
          );
        });
        const reads = state.catalogReads;
        await changeTheme(page, otherTone, true);
        assert.equal(new URL(page.url()).pathname, `${basePath}/culinary`);
        assert.equal(Number(await quantity.textContent()), 10);
        assert.equal(await bundle.getAttribute("aria-pressed"), "true");
        assert.equal(state.catalogReads, reads);
        assert.equal(
          await page.evaluate(
            () =>
              window.__retailPurchase ===
              document.querySelector('[aria-label="Purchase Culinary Matcha"]'),
          ),
          true,
          "Appearance changes must preserve the mounted order",
        );
        await changeTheme(page, tone);
        assert.equal(new URL(page.url()).pathname, `${basePath}/culinary`);
        assert.equal(Number(await quantity.textContent()), 10);

        const originSection = main.locator("[data-retail-origins]");
        await originSection.locator("summary").click();
        assert.match(
          await originSection.textContent(),
          /Origin details have not been published/,
        );
        const origins = originSection.getByRole("button", {
          name: "All origins",
          exact: true,
        });
        await origins.click();
        const reader = page.getByRole("dialog", {
          name: "ATOMA Origins",
          exact: true,
        });
        await reader.waitFor();
        await assertOverlayPalette(
          reader.locator("[data-origins-content]"),
          tone,
        );
        assert.equal(new URL(page.url()).hash, "#origins");
        await reader
          .getByRole("button", {
            name: "Return to Culinary Matcha",
            exact: true,
          })
          .first()
          .click();
        await reader.waitFor({ state: "hidden" });
        await eventually(
          () => new URL(page.url()).hash === "",
          "Returning from Origins must restore the product URL",
        );
        assert.equal(Number(await quantity.textContent()), 10);
        assert.equal(await bundle.getAttribute("aria-pressed"), "true");
        assert.equal(
          await firstProperty.evaluate((element) => element.open),
          true,
          "Appearance and Origins return must preserve open product information",
        );
        assert.equal(
          await originSection.evaluate((element) => element.open),
          true,
        );
        assert.equal(
          await origins.evaluate(
            (element) => element === document.activeElement,
          ),
          true,
        );
        await assertNoOverflow(page);
        await purchase.scrollIntoViewIfNeeded();
        await capture(page, `product-${tone}-1440`);

        const related = page.getByRole("region", {
          name: "Explore the collection.",
          exact: true,
        });
        assert.equal(
          await related
            .getByRole("link", { name: "View Barista Matcha", exact: true })
            .getAttribute("href"),
          `${basePath}/barista`,
        );
        const add = purchase.getByRole("button", {
          name: "Add to cart",
          exact: true,
        });
        await assertReachable(add);
        let release;
        state.gate = new Promise((done) => {
          release = done;
        });
        try {
          await add.click();
          await eventually(
            () => state.actions.length === 1,
            "The purchase must reach the mocked cart",
          );
          for (const control of await formats.getByRole("button").all())
            assert.equal(await control.isDisabled(), true);
          for (const control of [increase, decrease, origins])
            assert.equal(await control.isDisabled(), true);
          const adding = purchase.getByRole("button", {
            name: "Adding…",
            exact: true,
          });
          assert.equal(await adding.isDisabled(), true);
          assert.equal(await adding.getAttribute("aria-busy"), "true");
          await changeTheme(page, otherTone);
          assert.equal(Number(await quantity.textContent()), 10);
          assert.equal(await bundle.getAttribute("aria-pressed"), "true");
          assert.equal(await adding.isDisabled(), true);
          assert.equal(await increase.isDisabled(), true);
          assert.equal(state.actions.length, 1);
          await changeTheme(page, tone);
          assert.equal(
            await page.evaluate(
              () =>
                window.__retailPurchase ===
                document.querySelector(
                  '[aria-label="Purchase Culinary Matcha"]',
                ),
            ),
            true,
            "Changing color during submission preserves the pending purchase",
          );
          for (const link of await related
            .getByRole("link", { name: /^View / })
            .all())
            assert.equal(await link.getAttribute("aria-disabled"), "true");
        } finally {
          release();
        }
        const cart = page.getByRole("dialog", { name: /Your\s+selection\./ });
        await cart.waitFor();
        await assertOverlayPalette(cart, tone);
        assert.deepEqual(state.actions, [
          {
            action: "add",
            productHandle: "culinary",
            variantKey: products[0].variants[1].id,
            quantity: 10,
          },
        ]);
        assert.match(await cart.textContent(), /Culinary Matcha/);
        await page.keyboard.press("Escape");
        await cart.waitFor({ state: "hidden" });
        await related
          .getByRole("link", { name: "View Barista Matcha", exact: true })
          .click();
        await page
          .getByRole("heading", {
            name: "Barista Matcha",
            level: 1,
            exact: true,
          })
          .waitFor();
        assert.equal(new URL(page.url()).pathname, `${basePath}/barista`);
        await assertPalette(page, tone);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page
          .getByRole("heading", {
            name: "Barista Matcha",
            level: 1,
            exact: true,
          })
          .waitFor();
        await assertPalette(page, tone);
        assertHealthy(state);
      } catch (error) {
        await reportFailure(page, state, `desktop-${tone}`);
        throw error;
      } finally {
        await context.close();
      }
    },
  ]);
}

for (const [width, height, tone] of [
  [320, 700, "dark"],
  [390, 844, "light"],
]) {
  cases.push([
    `retail ${width}: keyboard card entry, direct refresh and mobile flow`,
    async (browser) => {
      const { context, page, state } = await setup(browser, width, height);
      try {
        const basePath = await openFromCollection(
          page,
          tone,
          "keyboard",
          "Barista",
        );
        await page.reload({ waitUntil: "domcontentloaded" });
        await page
          .getByRole("heading", {
            name: "Barista Matcha",
            level: 1,
            exact: true,
          })
          .waitFor();
        assert.equal(new URL(page.url()).pathname, `${basePath}/barista`);
        const purchase = page.getByRole("region", {
          name: "Purchase Barista Matcha",
          exact: true,
        });
        await assertPhotoLoaded(
          page.locator("main[data-retail-product] figure img").first(),
        );
        await purchase
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        assert.equal(
          Number(
            await purchase
              .getByLabel("Quantity", { exact: true })
              .textContent(),
          ),
          2,
        );
        await assertReachable(
          purchase.getByRole("button", { name: "Add to cart", exact: true }),
        );
        await assertNoOverflow(page);
        await capture(page, `product-${tone}-${width}-purchase`);
        const specifications = page.locator("[data-retail-specifications]");
        assert.equal(
          await specifications.locator("[data-retail-specification]").count(),
          7,
        );
        await specifications.scrollIntoViewIfNeeded();
        await assertNoOverflow(page);
        await capture(page, `product-${tone}-${width}-specifications`);
        const otherTone = tone === "dark" ? "light" : "dark";
        const reads = state.catalogReads;
        await page.evaluate(() => {
          window.__mobileRetailPurchase = document.querySelector(
            '[aria-label="Purchase Barista Matcha"]',
          );
        });
        await changeTheme(page, otherTone);
        assert.equal(new URL(page.url()).pathname, `${basePath}/barista`);
        assert.equal(
          Number(
            await purchase
              .getByLabel("Quantity", { exact: true })
              .textContent(),
          ),
          2,
        );
        assert.equal(state.catalogReads, reads);
        assert.equal(
          await page.evaluate(
            () =>
              window.__mobileRetailPurchase ===
              document.querySelector('[aria-label="Purchase Barista Matcha"]'),
          ),
          true,
        );
        const menu = page.locator('main > header summary[aria-label="Menu"]');
        await menu.click();
        await page
          .getByRole("button", { name: "About ATOMA", exact: true })
          .click();
        const about = page.getByRole("dialog", {
          name: /Matcha,\s+in detail\./,
        });
        await about.waitFor();
        await assertOverlayPalette(about, otherTone);
        await capture(page, `retail-${width}-${otherTone}-about`);
        await page.keyboard.press("Escape");
        await about.waitFor({ state: "hidden" });
        await page.getByRole("button", { name: /^Open cart,/ }).click();
        const cart = page.getByRole("dialog", { name: /Your\s+selection\./ });
        await cart.waitFor();
        await assertOverlayPalette(cart, otherTone);
        await capture(page, `retail-${width}-${otherTone}-cart`);
        await page.keyboard.press("Escape");
        await cart.waitFor({ state: "hidden" });
        const originSection = page.locator("[data-retail-origins]");
        await originSection.locator("summary").click();
        await originSection
          .getByRole("button", { name: "All origins", exact: true })
          .click();
        const reader = page.getByRole("dialog", {
          name: "ATOMA Origins",
          exact: true,
        });
        await reader.waitFor();
        await assertOverlayPalette(
          reader.locator("[data-origins-content]"),
          otherTone,
        );
        await capture(page, `retail-${width}-${otherTone}-origins`);
        await reader
          .getByRole("button", {
            name: "Return to Barista Matcha",
            exact: true,
          })
          .first()
          .click();
        await reader.waitFor({ state: "hidden" });
        assert.equal(
          Number(
            await purchase
              .getByLabel("Quantity", { exact: true })
              .textContent(),
          ),
          2,
        );
        await assertNoOverflow(page);
        await page.reload({ waitUntil: "domcontentloaded" });
        await page
          .getByRole("heading", {
            name: "Barista Matcha",
            level: 1,
            exact: true,
          })
          .waitFor();
        await assertPalette(page, otherTone);
        assert.deepEqual(state.actions, []);
        assertHealthy(state);
      } catch (error) {
        await reportFailure(page, state, `mobile-${width}`);
        throw error;
      } finally {
        await context.close();
      }
    },
  ]);
}

cases.push([
  "retail unknown and unavailable products never purchase a fallback",
  async (browser) => {
    const { context, page, state } = await setup(browser, 390, 844);
    try {
      for (const [tone, basePath] of [
        ["light", "/shop"],
        ["dark", "/shop/light"],
      ]) {
        await context.addCookies([
          { name: "atoma-theme", value: tone, url: baseURL },
        ]);
        await page.goto(
          `${baseURL}${basePath}/missing-matcha?source=retail&tag=one&tag=two`,
          {
            waitUntil: "domcontentloaded",
          },
        );
        await page.locator("[data-product-not-found]").waitFor();
        assert.equal(new URL(page.url()).pathname, "/shop/missing-matcha");
        assert.equal(new URL(page.url()).searchParams.get("source"), "retail");
        assert.deepEqual(new URL(page.url()).searchParams.getAll("tag"), [
          "one",
          "two",
        ]);
        await assertPalette(page, tone);
        assert.equal(
          await page
            .getByRole("button", { name: "Add to cart", exact: true })
            .count(),
          0,
        );
        assert.equal(
          await page.getByRole("region", { name: /^Purchase / }).count(),
          0,
        );
        assert.equal(
          await page
            .getByRole("link", { name: /^Back to the collection/ })
            .getAttribute("href"),
          "/shop",
        );
        await assertNoOverflow(page);
        await page.goto(`${baseURL}${basePath}/premium`, {
          waitUntil: "domcontentloaded",
        });
        const purchase = page.getByRole("region", {
          name: "Purchase Ceremonial Matcha",
          exact: true,
        });
        await purchase.waitFor();
        assert.equal(new URL(page.url()).pathname, "/shop/premium");
        await assertPalette(page, tone);
        assert.equal(
          await purchase
            .getByRole("button", { name: "Currently unavailable", exact: true })
            .isDisabled(),
          true,
        );
        assert.equal(
          await purchase
            .getByRole("button", { name: "Increase quantity", exact: true })
            .isDisabled(),
          true,
        );
        assert.equal(
          await purchase
            .getByRole("button", { name: "Decrease quantity", exact: true })
            .isDisabled(),
          true,
        );
        await assertNoOverflow(page);
      }
      assert.deepEqual(state.actions, []);
      assertHealthy(state);
    } catch (error) {
      await reportFailure(page, state, "unknown");
      throw error;
    } finally {
      await context.close();
    }
  },
]);

cases.push([
  "retail catalog failures retry the requested collection and product",
  async (browser) => {
    const { context, page, state } = await setup(browser, 390, 844);
    try {
      for (const path of ["/shop", "/shop/light/barista"]) {
        const tone = path === "/shop" ? "light" : "dark";
        await context.addCookies([
          { name: "atoma-theme", value: tone, url: baseURL },
        ]);
        state.catalogMode = "unavailable";
        await page.goto(`${baseURL}${path}`, { waitUntil: "domcontentloaded" });
        await page
          .getByRole("button", { name: "Try again", exact: true })
          .waitFor();
        assert.equal(
          await page
            .getByRole("button", { name: "Add to cart", exact: true })
            .count(),
          0,
        );
        state.catalogMode = "ready";
        await page
          .getByRole("button", { name: "Try again", exact: true })
          .click();
        if (path === "/shop")
          await page
            .getByRole("region", { name: "Matcha collection", exact: true })
            .waitFor();
        else
          await page
            .getByRole("heading", {
              name: "Barista Matcha",
              exact: true,
              level: 1,
            })
            .waitFor();
        assert.equal(new URL(page.url()).pathname, path.replace("/light", ""));
        await assertPalette(page, tone);
      }
      await page.goto(`${baseURL}/shop/light?source=legacy`, {
        waitUntil: "domcontentloaded",
      });
      await page
        .getByRole("region", { name: "Matcha collection", exact: true })
        .waitFor();
      assert.equal(new URL(page.url()).pathname, "/shop");
      assert.equal(new URL(page.url()).searchParams.get("source"), "legacy");
      await assertPalette(page, "dark");
      assert.deepEqual(state.actions, []);
      assertHealthy(state);
    } catch (error) {
      await reportFailure(page, state, "retry");
      throw error;
    } finally {
      await context.close();
    }
  },
]);

const selected = cases.filter(
  ([name]) =>
    !process.env.RETAIL_SHOP_FILTER ||
    new RegExp(process.env.RETAIL_SHOP_FILTER).test(name),
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
  `${selected.length - failed}/${selected.length} retail checks passed`,
);
if (failed) process.exitCode = 1;
