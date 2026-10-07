/* Local browser regression; every commerce operation is intercepted in memory. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { translate } from "../src/lib/i18n/index.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.CHECKOUT_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.CHECKOUT_EVIDENCE ?? ".local/checkout-0127/browser";
const handle = "jmm-storefront-test-matcha";
const product = {
  id: handle,
  handle,
  productCode: "UJI-01",
  title: "Culinary Matcha",
  description: "Isolated checkout regression fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${"a".repeat(43)}`,
      title: "1 kg",
      available: true,
      priceMinor: 1000,
      currency: "JPY",
      options: [{ name: "Format", value: "1 kg" }],
      minimum: 1,
      maximum: 10,
      increment: 1,
    },
  ],
};
function cart(quantity = 1) {
  return {
    totalQuantity: quantity,
    subtotalLabel: `¥${quantity * 1000}`,
    totalLabel: `¥${quantity * 1000}`,
    lines:
      quantity === 0
        ? []
        : [
            {
              lineKey: `v1_${"b".repeat(43)}`,
              productHandle: handle,
              productTitle: product.title,
              variantTitle: "1 kg",
              options: [],
              quantity,
              unitPriceLabel: "¥1,000",
              lineTotalLabel: `¥${quantity * 1000}`,
              purchaseState: "purchasable",
              quantityRule: { minimum: 1, maximum: 10, increment: 1 },
              canUpdateQuantity: true,
              canRemove: true,
              image: null,
            },
          ],
  };
}
const browser = await chromium.launch({ channel: "chrome", headless: true });
await mkdir(evidence, { recursive: true });
try {
  for (const [width, locale] of [
    [1366, "en"],
    [390, "zh-Hans"],
    [390, "zh-Hant"],
    [320, "ja"],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    await context.addCookies([
      { name: "atoma-locale", value: locale, url: baseURL },
    ]);
    const state = {
      enabled: false,
      quantity: 1,
      checkoutRequests: 0,
      cartReads: 0,
      failCheckout: true,
      releaseMutation: null,
      errors: [],
    };
    await context.route("**/*", async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (
        url.origin !== new URL(baseURL).origin &&
        !["GET", "HEAD"].includes(req.method())
      ) {
        state.errors.push("Unexpected remote write");
        return route.abort();
      }
      if (url.origin !== new URL(baseURL).origin) return route.continue();
      if (url.pathname === "/api/catalog")
        return route.fulfill({
          json: {
            status: "ready",
            products: [product],
            shopUrl: "https://example.invalid",
          },
        });
      if (url.pathname === "/api/cart") {
        if (req.method() === "POST") {
          const input = req.postDataJSON();
          assert.equal(input.action, "update");
          await new Promise((done) => {
            state.releaseMutation = done;
          });
          state.quantity = input.quantity;
          return route.fulfill({
            json: {
              kind: "warning",
              cart: cart(state.quantity),
              reviewRequired: true,
              checkoutEnabled: true,
            },
          });
        }
        state.cartReads += 1;
        return route.fulfill({
          json: {
            kind: state.quantity ? "ready" : "empty",
            ...(state.quantity ? { cart: cart(state.quantity) } : {}),
            checkoutEnabled: state.enabled,
          },
        });
      }
      if (url.pathname === "/api/checkout") {
        assert.equal(req.method(), "POST");
        assert.ok(
          !req.postData(),
          "Checkout must not submit a browser cart identifier or URL",
        );
        state.checkoutRequests += 1;
        return route.fulfill({
          status: 303,
          headers: {
            location: state.failCheckout
              ? "/shop?checkout=retry"
              : "/checkout-test-confirmation",
          },
        });
      }
      if (url.pathname === "/checkout-test-confirmation")
        return route.fulfill({
          contentType: "text/html",
          body: "<title>Mock checkout</title><p>Mock checkout reached</p>",
        });
      if (url.pathname.startsWith("/api/")) {
        state.errors.push(`Unexpected API ${url.pathname}`);
        return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => state.errors.push(error.message));
    page.setDefaultTimeout(15000);
    // Keep the original hosted-navigation and Back/Forward regression on the
    // native same-tab fallback. Successful popup behavior has its own suite.
    await page.addInitScript(
      (throws) => {
        window.open = () => {
          if (throws) throw new DOMException("Popup blocked", "SecurityError");
          return null;
        };
      },
      locale === "zh-Hant" || locale === "ja",
    );
    await page.goto(`${baseURL}/shop`);
    await page
      .getByRole("button", {
        name: translate(locale, "Open cart, {count} item", { count: 1 }),
        exact: true,
      })
      .click();
    const checkout = () =>
      page.getByRole("button", {
        name: translate(locale, "Checkout"),
        exact: true,
      });
    await checkout().waitFor();
    assert.equal(await checkout().isDisabled(), true);
    state.enabled = true;
    await page
      .getByRole("button", {
        name: translate(locale, "Close cart"),
        exact: true,
      })
      .click();
    await page
      .getByRole("button", {
        name: translate(locale, "Open cart, {count} item", { count: 1 }),
        exact: true,
      })
      .click();
    await page.waitForFunction(
      () =>
        document.querySelector(
          'form[action="/api/checkout"] button[type="submit"]',
        )?.disabled === false,
    );

    await page.locator("dialog").getByText("+", { exact: true }).click();
    await page.waitForFunction(
      () =>
        document.querySelector(
          'form[action="/api/checkout"] button[type="submit"]',
        )?.disabled === true,
    );
    assert.ok(state.releaseMutation, "Quantity update should be pending");
    state.releaseMutation();
    await page
      .getByRole("button", {
        name: translate(locale, "Refresh selection"),
        exact: true,
      })
      .waitFor();
    assert.equal(
      await checkout().isDisabled(),
      true,
      "Review-required state blocks checkout",
    );
    await page
      .getByRole("button", {
        name: translate(locale, "Refresh selection"),
        exact: true,
      })
      .click();
    await page.waitForFunction(
      () =>
        document.querySelector(
          'form[action="/api/checkout"] button[type="submit"]',
        )?.disabled === false,
    );
    await checkout().click();
    await page.locator("dialog").getByRole("alert").waitFor();
    assert.equal(
      await page
        .locator("dialog")
        .getByRole("alert")
        .textContent()
        .then((value) =>
          value.includes(
            translate(
              locale,
              "Checkout couldn’t be opened. Reload your selection and try again.",
            ),
          ),
        ),
      true,
    );
    assert.equal(await checkout().isDisabled(), true);
    assert.equal(new URL(page.url()).search, "");
    await page
      .getByRole("button", {
        name: translate(locale, "Reload selection"),
        exact: true,
      })
      .click();
    await page.waitForFunction(
      () =>
        document.querySelector(
          'form[action="/api/checkout"] button[type="submit"]',
        )?.disabled === false,
    );
    await page.screenshot({
      path: resolve(evidence, `${width}-${locale}.png`),
    });

    state.failCheckout = false;
    await checkout().click();
    await page.waitForURL("**/checkout-test-confirmation");
    assert.equal(state.checkoutRequests, 2);
    state.quantity = 0;
    await page.goBack();
    await page.waitForURL("**/shop");
    // Explicitly exercise persisted back/forward restoration in addition to ordinary navigation.
    await page.evaluate(() =>
      window.dispatchEvent(
        new PageTransitionEvent("pageshow", { persisted: true }),
      ),
    );
    await page
      .getByRole("button", {
        name: translate(locale, "Open cart, {count} items", { count: 0 }),
        exact: true,
      })
      .waitFor();
    assert.equal(await checkout().count(), 0);
    assert.deepEqual(state.errors, []);
    console.log(
      `${width} ${locale}: gated, pending, review, retry, redirect, and return refresh passed`,
    );
    await context.close();
  }
} finally {
  await browser.close();
}
