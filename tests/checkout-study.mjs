/* Local-only browser checks. All commerce/network calls and popup windows are mocked.
 * The installed SDK is real; lifecycle DOM events below exercise our wrapper, not
 * Shopify's remote ECP transport or payment processing. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.CHECKOUT_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.CHECKOUT_STUDY_EVIDENCE ?? ".local/checkout-0130/browser";
const checkoutSentinel =
  "https://h0cuaw-f7.myshopify.com/checkouts/study-mock-only";

function cart(quantity = 1, purchasable = true) {
  return {
    totalQuantity: quantity,
    subtotalLabel: `¥${quantity * 10000}`,
    totalLabel: `¥${quantity * 10000}`,
    lines: quantity
      ? [
          {
            lineKey: `v1_${"b".repeat(43)}`,
            productHandle: "jmm-storefront-test-matcha",
            productTitle: "Culinary Matcha",
            variantTitle: "1 kg",
            options: [],
            quantity,
            unitPriceLabel: "¥10,000",
            lineTotalLabel: `¥${quantity * 10000}`,
            purchaseState: purchasable ? "purchasable" : "not_purchasable",
            quantityRule: { minimum: 1, maximum: 10, increment: 1 },
            canUpdateQuantity: true,
            canRemove: true,
            image: null,
          },
        ]
      : [],
  };
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
await mkdir(evidence, { recursive: true });
try {
  for (const width of [1366, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const state = {
      quantity: 1,
      purchasable: true,
      enabled: true,
      cartReads: 0,
      preparations: 0,
      hosted: 0,
      failPreparation: false,
      mutationResult: "success",
      releaseMutation: null,
      errors: [],
    };
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin !== new URL(baseURL).origin) {
        state.errors.push("Unexpected external request");
        return route.abort();
      }
      if (url.pathname === "/api/cart") {
        if (request.method() === "POST") {
          const action = request.postDataJSON();
          assert.equal(action.action, "update");
          await new Promise((done) => {
            state.releaseMutation = done;
          });
          if (state.mutationResult !== "rejected")
            state.quantity = action.quantity;
          return route.fulfill({
            status: state.mutationResult === "rejected" ? 400 : 200,
            json: {
              kind: state.mutationResult,
              cart: cart(state.quantity),
              checkoutEnabled: true,
              ...(state.mutationResult === "warning"
                ? { reviewRequired: true }
                : {}),
            },
          });
        }
        state.cartReads++;
        return route.fulfill({
          json: {
            kind: state.quantity ? "ready" : "empty",
            ...(state.quantity
              ? { cart: cart(state.quantity, state.purchasable) }
              : {}),
            checkoutEnabled: state.enabled,
          },
        });
      }
      if (["/api/checkout", "/api/checkout/study"].includes(url.pathname)) {
        assert.equal(request.method(), "POST");
        assert.ok(
          !request.postData(),
          "Handoff accepts no browser cart or checkout input",
        );
        if (url.pathname.endsWith("/study")) {
          state.preparations++;
          return route.fulfill({
            status: state.failPreparation ? 409 : 200,
            headers: {
              "Cache-Control": "no-store",
              "Referrer-Policy": "no-referrer",
            },
            json: state.failPreparation
              ? { kind: "unavailable" }
              : { kind: "ready", checkoutUrl: checkoutSentinel },
          });
        }
        state.hosted++;
        return route.fulfill({
          status: 303,
          headers: { location: "/checkout-study-mock-confirmation" },
        });
      }
      if (url.pathname === "/checkout-study-mock-confirmation") {
        return route.fulfill({
          contentType: "text/html",
          body: "<title>Mock confirmation</title><p>Mock hosted checkout</p>",
        });
      }
      if (url.pathname.startsWith("/api/")) {
        state.errors.push("Unexpected local API");
        return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on("pageerror", (error) => state.errors.push(error.message));
    await page.addInitScript(() => {
      window.__checkoutStudyMock = { blocked: true, popup: null, opens: 0 };
      window.open = () => {
        const mock = window.__checkoutStudyMock;
        mock.opens++;
        if (mock.blocked) return null;
        mock.popup = {
          closed: false,
          close() {
            this.closed = true;
          },
          focus() {},
        };
        return mock.popup;
      };
    });
    await page.clock.install();
    await page.goto(`${baseURL}/checkout-study`);
    await page
      .getByRole("heading", { name: "Complete your selection." })
      .waitFor();
    const hosted = () =>
      page.getByRole("button", { name: "Try hosted checkout", exact: true });
    const prepare = () =>
      page.getByRole("button", { name: "Prepare Checkout Kit", exact: true });
    const open = () =>
      page.getByRole("button", {
        name: "Open Checkout Kit popup",
        exact: true,
      });
    const waitReady = () =>
      page.waitForFunction(() =>
        [...document.querySelectorAll("button")].some(
          (button) =>
            button.textContent.includes("Prepare Checkout Kit") &&
            !button.disabled,
        ),
      );
    const readyPopup = async () => {
      await waitReady();
      await prepare().click();
      await page.waitForFunction(() =>
        document.querySelector('[data-checkout-kit-status="ready"]'),
      );
      assert.equal(await hosted().isDisabled(), true);
      assert.equal(
        await page.getByRole("button", { name: /^Open cart,/ }).count(),
        0,
      );
    };
    const emit = (name, detail) =>
      page.evaluate(
        ({ name, detail }) => {
          document
            .querySelector("shopify-checkout")
            .dispatchEvent(new CustomEvent(name, { detail }));
        },
        { name, detail },
      );
    await waitReady();

    // The bespoke visual concept cannot collect contact/card data or submit a
    // payment. Country/appearance exploration must not touch commerce APIs.
    const concept = page.locator('section[aria-labelledby="study-title"]');
    assert.equal(
      await concept
        .locator('form, input, textarea, select, [contenteditable="true"]')
        .count(),
      0,
    );
    assert.equal(
      await concept
        .getByRole("button", { name: "Payment not connected", exact: true })
        .isDisabled(),
      true,
    );
    const beforeConcept = {
      reads: state.cartReads,
      preparations: state.preparations,
      hosted: state.hosted,
    };
    const countries = concept.getByRole("group", {
      name: "Concept shipping country",
    });
    await countries
      .getByRole("button", { name: "United States", exact: true })
      .click();
    await concept
      .getByText("Shipping to United States", { exact: true })
      .waitFor();
    await countries
      .getByRole("button", { name: "Singapore", exact: true })
      .click();
    await concept.getByText("Shipping to Singapore", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: /Switch study to .* appearance/ })
      .click();
    await page
      .getByRole("button", { name: /Switch study to .* appearance/ })
      .click();
    await concept
      .getByRole("button", { name: "Payment not connected", exact: true })
      .evaluate((button) => button.click());
    assert.deepEqual(
      {
        reads: state.cartReads,
        preparations: state.preparations,
        hosted: state.hosted,
      },
      beforeConcept,
    );
    assert.equal(await page.locator("shopify-checkout").count(), 0);

    state.purchasable = false;
    await page.getByRole("button", { name: "Refresh selection" }).click();
    await page
      .getByText(
        "Review the cart’s availability and quantities before checking out.",
      )
      .waitFor();
    assert.equal(await hosted().isDisabled(), true);
    assert.equal(await prepare().isDisabled(), true);
    state.purchasable = true;
    await page.getByRole("button", { name: "Refresh selection" }).click();
    await waitReady();

    await page.getByRole("button", { name: /^Open cart,/ }).click();
    await page.locator("dialog").getByText("+", { exact: true }).click();
    await page.waitForFunction(() =>
      [...document.querySelectorAll("button")].some(
        (button) =>
          button.textContent.includes("Prepare Checkout Kit") &&
          button.disabled,
      ),
    );
    await page.getByRole("button", { name: "Close cart", exact: true }).click();
    assert.equal(await hosted().isDisabled(), true);
    assert.equal(await prepare().isDisabled(), true);
    assert.ok(state.releaseMutation);
    state.releaseMutation();
    await waitReady();

    // Closing the drawer, or rereading its projection in the study, must not
    // bypass the shared cart's outstanding review/error state.
    for (const result of ["warning", "rejected"]) {
      state.mutationResult = result;
      state.releaseMutation = null;
      await page.getByRole("button", { name: /^Open cart,/ }).click();
      await page.locator("dialog").getByText("+", { exact: true }).click();
      await page.waitForFunction(
        () =>
          document.querySelector(
            'dialog form[action="/api/checkout"] button[type="submit"]',
          )?.disabled === true,
      );
      assert.ok(state.releaseMutation);
      state.releaseMutation();
      await page
        .locator("dialog")
        .getByText(
          result === "warning"
            ? "Your selection changed. Review the quantities and total below."
            : "This selection couldn’t be updated. Check its availability and quantity.",
          { exact: true },
        )
        .last()
        .waitFor();
      await page
        .getByRole("button", { name: "Close cart", exact: true })
        .click();
      const selectionResponse = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === "/api/cart" &&
          response.request().method() === "GET",
      );
      await page.getByRole("button", { name: "Refresh selection" }).click();
      await selectionResponse;
      await page
        .locator(
          'section[aria-labelledby="selection-title"][aria-busy="false"]',
        )
        .waitFor();
      assert.equal(
        await hosted().isDisabled(),
        true,
        `${result} remains a hosted checkout lock`,
      );
      assert.equal(
        await prepare().isDisabled(),
        true,
        `${result} remains a popup checkout lock`,
      );
      await page.getByRole("button", { name: /^Open cart,/ }).click();
      await page.waitForFunction(
        () =>
          document.querySelector(
            'dialog form[action="/api/checkout"] button[type="submit"]',
          )?.disabled === false,
      );
      await page
        .getByRole("button", { name: "Close cart", exact: true })
        .click();
      await waitReady();
    }
    state.mutationResult = "success";

    state.failPreparation = true;
    await prepare().click();
    await page.getByText(/Checkout could not be prepared/).waitFor();
    await waitReady();
    assert.equal(await page.locator("shopify-checkout").count(), 0);
    state.failPreparation = false;

    // Installed alpha SDK with a blocked window: preserve the attempt until
    // explicit close, including beyond unused-preparation expiry.
    await readyPopup();
    await open().click();
    await page.clock.fastForward(15001);
    await page.locator('[data-checkout-kit-status="unconfirmed"]').waitFor();
    await page.clock.fastForward(60001);
    assert.equal(await page.locator("shopify-checkout").count(), 1);
    await page
      .getByRole("button", { name: "Close preview", exact: true })
      .click();
    await waitReady();
    assert.equal(await page.locator("shopify-checkout").count(), 0);
    assert.equal(await hosted().isDisabled(), false);

    await readyPopup();
    await page.clock.fastForward(60001);
    await page.getByText(/The prepared checkout expired/).waitFor();
    await waitReady();
    assert.equal(await page.locator("shopify-checkout").count(), 0);

    // SDK popup-close detection on host focus, using only a fake Window handle.
    await page.evaluate(() => {
      window.__checkoutStudyMock.blocked = false;
    });
    await readyPopup();
    await open().click();
    await page.evaluate(() => {
      window.__checkoutStudyMock.popup.closed = true;
      window.dispatchEvent(new Event("focus"));
    });
    await page.clock.fastForward(100);
    await waitReady();
    assert.equal(await page.locator("shopify-checkout").count(), 0);

    await readyPopup();
    await open().click();
    await emit("ec.error", {
      error: { messages: [{ severity: "recoverable", content: "Mock only" }] },
    });
    await page.locator('[data-checkout-kit-status="warning"]').waitFor();
    assert.equal(await page.locator("shopify-checkout").count(), 1);
    assert.equal(await hosted().isDisabled(), true);
    await emit("ec.start", { checkout: {} });
    await page.locator('[data-checkout-kit-status="active"]').waitFor();
    await page
      .getByRole("button", { name: "Close preview", exact: true })
      .click();
    await waitReady();

    await readyPopup();
    await open().click();
    await page.evaluate(() => {
      const element = document.querySelector("shopify-checkout");
      element.dispatchEvent(
        new CustomEvent("ec.error", {
          detail: { error: { messages: [{ severity: "unrecoverable" }] } },
        }),
      );
      element.dispatchEvent(new CustomEvent("ec.close"));
    });
    await page.getByText(/The popup could not continue/).waitFor();
    await waitReady();
    assert.equal(await page.locator("shopify-checkout").count(), 0);

    assert.equal(
      await page.evaluate(
        (sentinel) =>
          JSON.stringify(localStorage).includes(sentinel) ||
          JSON.stringify(sessionStorage).includes(sentinel) ||
          location.href.includes(sentinel),
        checkoutSentinel,
      ),
      false,
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await page.screenshot({
      path: resolve(evidence, `${width}-study.png`),
      fullPage: true,
    });

    await readyPopup();
    await open().click();
    state.quantity = 0;
    await page.evaluate(() => {
      const element = document.querySelector("shopify-checkout");
      element.dispatchEvent(
        new CustomEvent("ec.complete", { detail: { checkout: {} } }),
      );
      element.dispatchEvent(new CustomEvent("ec.close"));
    });
    await page.getByText(/Checkout reported completion/).waitFor();
    await page.getByText(/Add a product to see your selection here/).waitFor();
    await page
      .getByRole("button", { name: "Open cart, 0 items", exact: true })
      .waitFor();
    assert.equal(await hosted().isDisabled(), true);
    state.quantity = 1;
    await page.getByRole("button", { name: "Refresh selection" }).click();
    await waitReady();
    await hosted().click();
    await page.waitForURL("**/checkout-study-mock-confirmation");
    await page.goBack();
    await page.waitForURL("**/checkout-study");
    await waitReady();
    assert.equal(await page.locator("shopify-checkout").count(), 0);
    assert.equal(state.hosted, 1);
    assert.deepEqual(state.errors, []);
    console.log(
      `${width}: unavailable/pending cart, preparation failure/expiry, blocked/manual close, recoverable/fatal errors, completion and hosted return passed`,
    );
    await context.close();
  }
} finally {
  await browser.close();
}
