/* Isolated right-panel purchase checks. Every catalog/cart request is mocked;
 * no request, price, quantity or cart mutation reaches Shopify. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";
import { money } from "../src/lib/product-selection.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.SAMPLE_PURCHASE_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.SAMPLE_PURCHASE_EVIDENCE ??
  ".local/sample-start-purchase-0168/available";
assert.ok(
  SAMPLE_SET_OFFER,
  "The exact reviewed sample reference is configured",
);
assert.equal(SAMPLE_SET_OFFER.variants.length, 1);

// Intentionally different from client reference ideas; these are isolated test
// values, never a proposed or published offer. Put the set first to catch a
// generic catalog fallback accidentally entering the ordinary tea selectors.
const setVariant = {
  id: `v1_${"s".repeat(43)}`,
  title: "3 × 20 g",
  available: true,
  priceMinor: 1379,
  currency: "JPY",
  options: SAMPLE_SET_OFFER.variants[0].options,
  minimum: 2,
  maximum: 6,
  increment: 2,
};
const setProduct = {
  id: "isolated-sample-offer",
  handle: SAMPLE_SET_OFFER.productHandle,
  title: "Sample Set",
  productCode: null,
  description: "Isolated browser fixture: three 20 g samples.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [setVariant],
};
const teas = SAMPLE_SET_CONTENTS.map((item, index) => ({
  ...setProduct,
  id: item.key,
  handle: item.productHandle,
  title: item.name,
  productCode: item.productCode,
  variants: [
    {
      ...setVariant,
      id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
      title: "1 kg",
      options: [{ name: "Size", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));

function cartFor(quantity) {
  return {
    totalQuantity: quantity,
    subtotalLabel: money(setVariant.priceMinor * quantity, setVariant.currency),
    totalLabel: money(setVariant.priceMinor * quantity, setVariant.currency),
    lines: [
      {
        lineKey: "isolated-sample-line",
        productHandle: setProduct.handle,
        productTitle: setProduct.title,
        variantTitle: setVariant.title,
        options: setVariant.options,
        quantity,
        unitPriceLabel: money(setVariant.priceMinor, setVariant.currency),
        lineTotalLabel: money(
          setVariant.priceMinor * quantity,
          setVariant.currency,
        ),
        purchaseState: "purchasable",
        quantityRule: {
          minimum: setVariant.minimum,
          maximum: setVariant.maximum,
          increment: setVariant.increment,
        },
        canUpdateQuantity: true,
        canRemove: true,
        image: null,
      },
    ],
  };
}

async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const [width, tone] of [
    [1440, "light"],
    [320, "dark"],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 320 ? 844 : 900 },
      reducedMotion: "reduce",
      hasTouch: width === 320,
      isMobile: width === 320,
    });
    const errors = [];
    const actions = [];
    let currentCart = null;
    let completeAdd = null;
    await context.addCookies([
      { name: "atoma-theme", value: tone, url: baseURL },
      { name: "atoma-locale", value: "en", url: baseURL },
    ]);
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin !== origin) {
        errors.push("Unexpected external request");
        return route.abort();
      }
      if (url.pathname === "/api/catalog" && request.method() === "GET")
        return route.fulfill({
          json: {
            status: "ready",
            products: [setProduct, ...teas],
            shopUrl: "https://example.invalid",
          },
        });
      if (url.pathname === "/api/cart" && request.method() === "GET")
        return route.fulfill({
          json: currentCart
            ? { kind: "ready", cart: currentCart, checkoutEnabled: false }
            : { kind: "empty", checkoutEnabled: false },
        });
      if (url.pathname === "/api/cart" && request.method() === "POST") {
        actions.push(request.postDataJSON());
        const kind = await new Promise((done) => {
          completeAdd = done;
        });
        completeAdd = null;
        if (kind === "rejected")
          return route.fulfill({
            status: 422,
            json: { kind, checkoutEnabled: false },
          });
        currentCart = cartFor(actions.at(-1).quantity);
        return route.fulfill({
          json: { kind, cart: currentCart, checkoutEnabled: false },
        });
      }
      if (
        url.pathname.startsWith("/api/") ||
        !["GET", "HEAD"].includes(request.method())
      ) {
        errors.push(
          `Unexpected local request: ${request.method()} ${url.pathname}`,
        );
        return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.goto(baseURL);
      await page
        .getByRole("button", {
          name: "Explore matcha from the silver bag",
          exact: true,
        })
        .click();
      const entry = page.locator("[data-sample-start-entry]");
      await entry.waitFor({ state: "visible" });
      await entry.locator("[data-sample-order]").waitFor();
      assert.equal(
        await entry.locator("[data-sample-value]").isVisible(),
        true,
        "The reason to sample and first-order credit remain visible before opening details",
      );
      const shippingNote = entry.locator("[data-sample-shipping-note]");
      assert.equal(await shippingNote.isVisible(), false);
      const credit = entry.locator("[data-sample-credit-link]");
      assert.equal(await credit.getAttribute("href"), "/samples#samples-next");
      assert.equal(await credit.isVisible(), false);
      assert.equal(
        (await entry.locator("details summary").innerText()).trim(),
        "Ordering information",
      );
      await entry.locator("details summary").click();
      assert.equal(await shippingNote.isVisible(), true);
      assert.equal(
        await shippingNote.innerText(),
        "Shipping is extra and calculated by Shopify at checkout for your delivery destination.",
      );
      assert.equal(await credit.isVisible(), true);
      assert.ok((await credit.innerText()).includes("approx. US$29"));
      const creditDelivery = entry.getByText(
        "Your credit code is included in your Sample Set order confirmation email. Keep it for when you are ready to order 1 kg or more.",
        { exact: true },
      );
      assert.equal(await creditDelivery.isVisible(), true);
      assert.equal(await entry.locator("input[readonly]").count(), 0);
      assert.equal(
        (await entry.textContent()).includes("TEST-SAMPLE-CREDIT"),
        false,
        "The purchase panel never exposes the reusable credit code",
      );
      await entry.locator("details summary").click();
      assert.equal(await creditDelivery.isVisible(), false);
      assert.equal(await shippingNote.isVisible(), false);
      const add = entry.getByRole("button", {
        name: "Add to cart",
        exact: true,
      });
      await eventually(
        () => add.isEnabled(),
        "The reviewed set becomes purchasable",
      );
      assert.deepEqual(
        await page
          .locator("[data-homepage-product-choice]")
          .evaluateAll((nodes) =>
            [
              ...new Set(
                nodes.map((node) => node.dataset.homepageProductChoice),
              ),
            ].sort(),
          ),
        teas.map((tea) => tea.id).sort(),
        "The sample offer never enters the three ordinary tea selectors",
      );
      const quantity = entry.getByRole("status", {
        name: "Set quantity",
        exact: true,
      });
      const total = entry.getByRole("status", {
        name: "Sample set total",
        exact: true,
      });
      const decrease = entry.getByRole("button", {
        name: "Decrease quantity",
        exact: true,
      });
      const increase = entry.getByRole("button", {
        name: "Increase quantity",
        exact: true,
      });
      assert.equal(await quantity.innerText(), "2");
      assert.equal(await decrease.isDisabled(), true);
      assert.ok((await entry.innerText()).includes(money(1379, "JPY")));
      assert.equal(await total.innerText(), money(2758, "JPY"));
      await increase.click();
      assert.equal(await quantity.innerText(), "4");
      await increase.click();
      assert.equal(await quantity.innerText(), "6");
      assert.equal(await increase.isDisabled(), true);
      assert.equal(await total.innerText(), money(8274, "JPY"));
      await decrease.click();
      assert.equal(await quantity.innerText(), "4");
      await increase.click();
      assert.equal(await quantity.innerText(), "6");
      assert.ok(
        (await entry.innerText()).includes("Minimum 2 · Increments of 2"),
      );
      assert.equal(
        await entry.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1,
        ),
        true,
      );
      await eventually(
        () =>
          entry
            .locator("img")
            .evaluateAll((images) =>
              images.every(
                (image) =>
                  image.complete &&
                  image.naturalWidth > 0 &&
                  image.closest('[data-masked="true"]'),
              ),
            ),
        "All sample images finish their masks",
      );
      await entry.screenshot({
        path: resolve(evidence, `${width}-${tone}-purchase.png`),
      });

      // Two immediate activations exercise the submission-ref guard before
      // React has committed the pending button state.
      await add.focus();
      await add.evaluate((button) => {
        button.click();
        button.click();
      });
      await eventually(
        () => completeAdd !== null,
        "The add request is intercepted locally",
      );
      assert.deepEqual(actions, [
        {
          action: "add",
          productHandle: setProduct.handle,
          variantKey: setVariant.id,
          quantity: 6,
        },
      ]);
      const pending = entry.locator('button[data-pending="true"]');
      assert.equal(await pending.isDisabled(), true);
      assert.equal(await pending.getAttribute("aria-busy"), "true");
      assert.equal(await decrease.isDisabled(), true);
      assert.equal(
        await page
          .locator('[data-homepage-product-choice="barista"]')
          .isDisabled(),
        true,
      );
      assert.equal(
        await entry
          .locator('[data-sample-entry="start"]')
          .getAttribute("aria-disabled"),
        "true",
      );
      completeAdd("rejected");
      await entry.getByRole("alert").waitFor();
      assert.ok(
        (await entry.getByRole("alert").innerText()).includes(
          "Check its availability and quantity.",
        ),
      );
      await eventually(
        () => add.isEnabled(),
        "A definite rejection allows a deliberate retry",
      );
      assert.equal(await quantity.innerText(), "6");
      assert.equal(
        actions.length,
        1,
        "A rejected request is never replayed automatically",
      );

      await add.focus();
      await page.keyboard.press("Enter");
      await eventually(
        () => completeAdd !== null && actions.length === 2,
        "The user retry sends one new add request",
      );
      assert.deepEqual(actions[1], actions[0]);
      completeAdd("success");
      const cart = page.locator("dialog[open]");
      await cart
        .getByRole("button", { name: "Close cart", exact: true })
        .waitFor();
      assert.ok((await cart.innerText()).includes("Sample Set"));
      assert.ok((await cart.innerText()).includes(money(8274, "JPY")));
      await page.screenshot({
        path: resolve(evidence, `${width}-${tone}-cart.png`),
      });
      await cart
        .getByRole("button", { name: "Close cart", exact: true })
        .click();
      assert.equal(await quantity.innerText(), "6");
      assert.equal(await entry.isVisible(), true);
      await eventually(
        () => add.evaluate((node) => node === document.activeElement),
        "Closing cart returns focus to Add to cart",
      );
      assert.equal(actions.length, 2);
      assert.deepEqual(errors, []);
      console.log(
        `${width}-${tone}: price, quantity rules, pending, rejection, guarded retry, cart and tea exclusion passed`,
      );
    } catch (error) {
      await page.screenshot({
        path: resolve(evidence, `${width}-${tone}-failure.png`),
        fullPage: true,
      });
      throw error;
    } finally {
      completeAdd?.("rejected");
      await context.close();
    }
  }
} finally {
  await browser.close();
}
