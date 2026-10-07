/* Local native-window regression. Commerce responses are intercepted and the
 * inert cross-origin checkout fixture stays on loopback. No remote payments. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { setTimeout as wait } from "node:timers/promises";
import { translate } from "../src/lib/i18n/index.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.CHECKOUT_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.CHECKOUT_POPUP_EVIDENCE ?? ".local/checkout-0134/browser";

async function eventually(check, message) {
  const deadline = Date.now() + 10000;
  while (!(await check())) {
    assert.ok(Date.now() < deadline, message);
    await wait(20);
  }
}
// Chromium can bypass route interception after a fulfilled POST redirect. Use
// a separate loopback origin for the inert destination rather than risk DNS or
// remote payment traffic. No fields, transaction logic or Shopify calls exist.
let fixtureCoop = false;
const fixtureServer = createServer((request, response) => {
  assert.equal(request.method, "GET");
  response.writeHead(200, {
    "Content-Type": "text/html",
    ...(fixtureCoop ? { "Cross-Origin-Opener-Policy": "same-origin" } : {}),
  });
  response.end(
    "<!doctype html><title>Isolated checkout destination</title><p>Mock payment page; no payment controls.</p>",
  );
});
await new Promise((done) => fixtureServer.listen(0, "127.0.0.1", done));
const checkoutSentinel = `http://127.0.0.1:${fixtureServer.address().port}/checkouts/native-test-only`;
const handle = "jmm-storefront-test-matcha";
const product = {
  id: handle,
  handle,
  productCode: "UJI-01",
  title: "Culinary Matcha",
  description: "Isolated native popup regression fixture.",
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
    lines: quantity
      ? [
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
        ]
      : [],
  };
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
let activePage;
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
      quantity: 1,
      cartReads: 0,
      checkoutRequests: 0,
      failCart: false,
      breakCart: false,
      cartOverride: null,
      failCheckout: false,
      coop: false,
      submissions: [],
      errors: [],
    };
    await context.route("**/*", async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (url.origin === new URL(checkoutSentinel).origin)
        return route.continue();
      if (url.origin !== origin) {
        state.errors.push("Unexpected remote request");
        return route.abort();
      }
      if (url.pathname === "/api/catalog")
        return route.fulfill({
          json: {
            status: "ready",
            products: [product],
            shopUrl: "https://example.invalid",
          },
        });
      if (url.pathname === "/api/cart") {
        assert.equal(
          req.method(),
          "GET",
          "Popup must not replay a cart mutation",
        );
        state.cartReads++;
        if (state.breakCart) return route.abort("failed");
        if (state.failCart)
          return route.fulfill({ status: 503, json: { kind: "unavailable" } });
        return route.fulfill({
          json: state.cartOverride ?? {
            kind: state.quantity ? "ready" : "empty",
            ...(state.quantity ? { cart: cart(state.quantity) } : {}),
            checkoutEnabled: true,
          },
        });
      }
      if (url.pathname === "/api/checkout") {
        fixtureCoop = state.coop;
        assert.equal(req.method(), "POST");
        assert.equal(
          req.isNavigationRequest(),
          true,
          "Checkout must remain a native navigation",
        );
        assert.equal(
          req.resourceType(),
          "document",
          "Checkout URL must not be fetched into JavaScript",
        );
        assert.ok(
          !req.postData(),
          "Checkout accepts no browser cart identifier, URL or price",
        );
        state.checkoutRequests++;
        state.submissions.push(req.frame().page());
        return route.fulfill({
          status: 303,
          headers: {
            location: state.failCheckout
              ? "/shop?checkout=retry"
              : checkoutSentinel,
          },
        });
      }
      if (url.pathname.startsWith("/api/")) {
        state.errors.push(`Unexpected API ${url.pathname}`);
        return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    activePage = page;
    page.setDefaultTimeout(15000);
    page.on("pageerror", (error) => state.errors.push(error.message));
    await page.addInitScript(() => {
      const nativeOpen = window.open.bind(window);
      const nativeFetch = window.fetch.bind(window);
      window.__checkoutPopupTest = {
        opened: [],
        forms: [],
        fetches: [],
        finishedReads: 0,
        heldReads: [],
        holdNextRead: false,
      };
      window.__checkoutVisible = true;
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => (window.__checkoutVisible ? "visible" : "hidden"),
      });
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => !window.__checkoutVisible,
      });
      window.open = (...args) => {
        window.__checkoutPopupTest.opened.push(args.map(String));
        window.__checkoutPopupWindow = nativeOpen(...args);
        return window.__checkoutPopupWindow;
      };
      window.fetch = async (...args) => {
        window.__checkoutPopupTest.fetches.push(String(args[0]));
        const isCartRead =
          new URL(String(args[0]), location.href).pathname === "/api/cart";
        let response;
        try {
          response = await nativeFetch(...args);
        } catch (error) {
          if (isCartRead) window.__checkoutPopupTest.finishedReads++;
          throw error;
        }
        if (isCartRead) {
          const nativeJson = response.json.bind(response);
          response.json = async () => {
            try {
              const result = await nativeJson();
              if (window.__checkoutPopupTest.holdNextRead) {
                window.__checkoutPopupTest.holdNextRead = false;
                await new Promise((release) =>
                  window.__checkoutPopupTest.heldReads.push(release),
                );
              }
              return result;
            } finally {
              window.__checkoutPopupTest.finishedReads++;
            }
          };
        }
        return response;
      };
      document.addEventListener(
        "submit",
        (event) => {
          if (
            !(event.target instanceof HTMLFormElement) ||
            new URL(event.target.action).pathname !== "/api/checkout"
          )
            return;
          const form = event.target;
          window.__checkoutPopupTest.forms.push({
            target: form.target,
            action: form.action,
            method: form.method,
            entries: Array.from(new FormData(form)),
            prevented: event.defaultPrevented,
          });
        },
        false,
      );
    });
    await page.clock.install();
    const form = () => page.locator('form[action="/api/checkout"]');
    const submit = () => form().locator('button[type="submit"]');
    const button = (source) =>
      page.getByRole("button", {
        name: translate(locale, source),
        exact: true,
      });
    const openCart = async () =>
      page
        .getByRole("button", {
          name: translate(
            locale,
            state.quantity === 1
              ? "Open cart, {count} item"
              : "Open cart, {count} items",
            { count: state.quantity },
          ),
          exact: true,
        })
        .click();
    const ready = () =>
      eventually(
        async () =>
          (await submit().count()) === 1 && !(await submit().isDisabled()),
        "Checkout should be ready",
      );
    const locked = async () => {
      await button("Return to checkout").waitFor();
      assert.equal(
        await form().locator('button[type="submit"]:enabled').count(),
        0,
      );
      assert.equal(
        await page
          .getByRole("button", {
            name: translate(locale, "Open cart, {count} item", { count: 1 }),
            exact: true,
          })
          .count(),
        1,
      );
    };
    const readOnReturn = async () => {
      await page.clock.runFor(0);
      const before = await page.evaluate(
        () => window.__checkoutPopupTest.finishedReads,
      );
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await eventually(async () => {
        await page.clock.runFor(0);
        return page.evaluate(
          (value) => window.__checkoutPopupTest.finishedReads > value,
          before,
        );
      }, "A return should reconcile the authoritative cart");
    };
    const visible = (value) =>
      page.evaluate((isVisible) => {
        window.__checkoutVisible = isVisible;
        document.dispatchEvent(new Event("visibilitychange"));
      }, value);
    const holdNextRead = () =>
      page.evaluate(() => {
        window.__checkoutPopupTest.holdNextRead = true;
      });
    const releaseRead = () =>
      page.evaluate(() => {
        window.__checkoutPopupTest.heldReads.shift()?.();
      });
    const waitForHeldRead = () =>
      eventually(
        () =>
          page.evaluate(
            () => window.__checkoutPopupTest.heldReads.length === 1,
          ),
        "Read should be suspended after its response body has been parsed",
      );
    const startPopup = async () => {
      await ready();
      const opened = context.waitForEvent("page");
      if (locale === "en") {
        await submit().focus();
        await page.keyboard.press("Enter");
      } else {
        await submit().click();
      }
      const popup = await opened;
      await popup.waitForURL(checkoutSentinel);
      return popup;
    };
    await page.goto(`${baseURL}/shop`);
    await openCart();
    await ready();
    await page.clock.pauseAt(new Date(Date.now() + 1000));

    const popup = await startPopup();
    assert.equal(
      new URL(page.url()).pathname,
      "/shop",
      "The ATOMA page must remain open",
    );
    assert.equal(
      context.pages().length,
      2,
      "One checkout gesture must create exactly one extra window",
    );
    assert.equal(
      context.pages().some((candidate) => candidate.url() === "about:blank"),
      false,
      "Named form navigation must not strand a blank popup",
    );
    assert.equal(
      state.submissions.at(-1),
      popup,
      "The native form must submit into the reserved popup",
    );
    const recording = await page.evaluate(() => window.__checkoutPopupTest);
    assert.equal(recording.opened.length, 1);
    assert.ok(
      ["", "about:blank"].includes(recording.opened[0][0]),
      "Only a blank window may be opened by storefront JavaScript",
    );
    assert.ok(
      recording.opened[0][1] && !recording.opened[0][1].startsWith("_"),
      "Popup must use an explicit named target",
    );
    assert.equal(await form().getAttribute("target"), recording.opened[0][1]);
    assert.equal(recording.forms.at(-1).method, "post");
    assert.deepEqual(recording.forms.at(-1).entries, []);
    assert.equal(recording.forms.at(-1).prevented, false);
    assert.equal(
      recording.fetches.some((value) => value.includes("/api/checkout")),
      false,
    );
    assert.equal(
      await popup.evaluate(() => window.opener),
      null,
      "Payment window cannot navigate its opener",
    );

    // A queued second submit must neither open another window nor repeat the POST.
    await form().evaluate((node) =>
      node.dispatchEvent(
        new SubmitEvent("submit", { bubbles: true, cancelable: true }),
      ),
    );
    assert.equal(state.checkoutRequests, 1);
    assert.equal(
      await page.evaluate(() => window.__checkoutPopupTest.opened.length),
      1,
    );
    await button("Return to checkout").waitFor();
    assert.equal(
      await form().locator('button[type="submit"]:enabled').count(),
      0,
    );
    await button("Return to checkout").click();
    assert.equal(
      state.checkoutRequests,
      1,
      "Return to checkout only focuses the existing window",
    );
    const readsWhileActive = state.cartReads;
    await button("Close cart").click();
    assert.equal(
      popup.isClosed(),
      false,
      "Closing the cart must not close checkout",
    );
    await openCart();
    assert.equal(
      await form().locator('button[type="submit"]:enabled').count(),
      0,
      "Reopening the cart must not unlock an active checkout",
    );
    await readOnReturn();
    await page.evaluate(() =>
      window.dispatchEvent(
        new PageTransitionEvent("pageshow", { persisted: true }),
      ),
    );
    assert.equal(
      state.checkoutRequests,
      1,
      "Returning focus must not retry a payment handoff",
    );
    assert.equal(
      await form().locator('button[type="submit"]:enabled').count(),
      0,
    );
    assert.ok(
      state.cartReads > readsWhileActive,
      "Returning to ATOMA must read the authoritative cart",
    );
    await locked();

    // A canceled/nonempty checkout and transient failures never clear a cart
    // or unlock another payment attempt, including malformed successful reads.
    state.failCart = true;
    await readOnReturn();
    await locked();
    state.failCart = false;
    state.breakCart = true;
    await readOnReturn();
    await locked();
    state.breakCart = false;
    for (const malformed of [
      { kind: "ready", checkoutEnabled: true },
      {
        kind: "ready",
        cart: { ...cart(0), totalQuantity: 1 },
        checkoutEnabled: true,
      },
    ]) {
      state.cartOverride = malformed;
      await readOnReturn();
      await locked();
    }
    state.cartOverride = null;
    await readOnReturn();

    // Holding a parsed body simulates a slow response even after AbortSignal
    // fires. Return events must not overlap reads; hidden pages stop polling.
    await holdNextRead();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await waitForHeldRead();
    const heldReadCount = state.cartReads;
    await page.evaluate(() => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(
        new PageTransitionEvent("pageshow", { persisted: true }),
      );
    });
    await page.clock.runFor(9000);
    assert.equal(
      state.cartReads,
      heldReadCount,
      "Burst returns and timers must not overlap an active read",
    );
    await visible(false);
    await page.clock.runFor(60000);
    assert.equal(
      state.cartReads,
      heldReadCount,
      "Hidden storefronts must pause checkout polling",
    );
    await visible(true);
    assert.equal(
      state.cartReads,
      heldReadCount,
      "Visibility return waits for the aborted read to settle",
    );
    await releaseRead();
    await eventually(async () => {
      await page.clock.runFor(0);
      return state.cartReads === heldReadCount + 1;
    }, "Visibility return should queue exactly one fresh read");
    await locked();

    const localState = await page.evaluate(() => ({
      html: document.documentElement.innerHTML,
      local: { ...localStorage },
      session: { ...sessionStorage },
      href: location.href,
    }));
    assert.equal(
      JSON.stringify(localState).includes(checkoutSentinel),
      false,
      "Remote checkout URL must stay out of local markup, routes and storage",
    );
    await page.screenshot({
      path: resolve(evidence, `${width}-${locale}-active.png`),
    });

    await popup.close();
    await readOnReturn();
    await button("Return to checkout").waitFor();
    assert.equal(
      await form().locator('button[type="submit"]:enabled').count(),
      0,
      "Window closure alone must not unlock or confirm payment",
    );
    const readsBeforeReview = state.cartReads;
    await button("Review selection").click();
    await button("I’ve finished or closed checkout").waitFor();
    assert.equal(
      state.cartReads,
      readsBeforeReview,
      "Asking to review alone must not issue its manual reload",
    );
    assert.equal(state.checkoutRequests, 1);
    state.failCart = true;
    await button("I’ve finished or closed checkout").click();
    await page.locator("dialog").getByRole("alert").waitFor();
    assert.equal(
      await submit().isDisabled(),
      true,
      "Failed recovery must block a stale cart checkout",
    );
    state.failCart = false;
    await button("Reload selection").click();
    await ready();
    assert.equal(
      state.quantity,
      1,
      "Closing checkout must not claim payment or clear the selection",
    );
    assert.equal(
      await page
        .getByRole("button", {
          name: translate(locale, "Open cart, {count} item", { count: 1 }),
          exact: true,
        })
        .count(),
      1,
    );

    // A server retry renders inside the popup. The opener remains locked until
    // the buyer explicitly leaves that checkout and rereads the selection.
    state.failCheckout = true;
    const retryOpened = context.waitForEvent("page");
    await submit().click();
    const retryPopup = await retryOpened;
    await retryPopup.waitForURL(
      (url) => url.origin === origin && url.pathname === "/shop",
    );
    await retryPopup
      .getByRole("alert")
      .filter({
        hasText: translate(
          locale,
          "Checkout couldn’t be opened. Reload your selection and try again.",
        ),
      })
      .waitFor();
    assert.equal(new URL(page.url()).pathname, "/shop");
    assert.equal(
      await form().locator('button[type="submit"]:enabled').count(),
      0,
    );
    assert.equal(state.checkoutRequests, 2);
    assert.equal(context.pages().length, 2);
    await retryPopup.close();
    await button("Review selection").click();
    await button("I’ve finished or closed checkout").click();
    await ready();

    // COOP can sever a WindowProxy even while its real window is still open.
    // The application must not treat that as a successful or canceled payment.
    state.failCheckout = false;
    state.coop = true;
    const isolatedPopup = await startPopup();
    assert.equal(context.pages().length, 2);
    assert.equal(
      await page.evaluate(() => window.__checkoutPopupWindow.closed),
      true,
      "Fixture COOP must actually sever the opener’s WindowProxy",
    );
    const readsBeforeCoopFocus = state.cartReads;
    await readOnReturn();
    await page.evaluate(() =>
      window.dispatchEvent(
        new PageTransitionEvent("pageshow", { persisted: true }),
      ),
    );
    assert.equal(isolatedPopup.isClosed(), false);
    assert.equal(
      await form().locator('button[type="submit"]:enabled').count(),
      0,
    );
    assert.ok(
      state.cartReads > readsBeforeCoopFocus,
      "COOP does not prevent authoritative cart reconciliation",
    );
    assert.equal(state.checkoutRequests, 3);
    await button("Return to checkout").click();
    await page
      .getByRole("status")
      .filter({
        hasText: translate(
          locale,
          "Your browser may have opened checkout in another tab. Return there to continue.",
        ),
      })
      .waitFor();
    assert.equal(
      context.pages().length,
      2,
      "Severed handles must not open a replacement checkout",
    );
    assert.equal(state.checkoutRequests, 3);
    // A parsed empty response from an old attempt must not clear a later cart.
    // Delaying JSON resolution intentionally survives AbortController so the
    // attempt/request guards, rather than the network abort alone, are tested.
    state.cartOverride = { kind: "empty", checkoutEnabled: true };
    await holdNextRead();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await waitForHeldRead();
    state.cartOverride = null;
    await isolatedPopup.close();
    await button("Review selection").click();
    await button("I’ve finished or closed checkout").click();
    await ready();
    const nextPopup = await startPopup();
    assert.equal(state.checkoutRequests, 4);
    const completedBeforeStale = await page.evaluate(
      () => window.__checkoutPopupTest.finishedReads,
    );
    await releaseRead();
    await eventually(
      () =>
        page.evaluate(
          (before) => window.__checkoutPopupTest.finishedReads > before,
          completedBeforeStale,
        ),
      "The old response should settle after the new attempt starts",
    );
    await locked();
    assert.equal(nextPopup.isClosed(), false);

    // With the new attempt active, a successful empty/missing/zero-line
    // response clears the shared badge automatically while checkout stays open.
    state.quantity = 0;
    state.cartOverride =
      locale === "zh-Hans"
        ? { kind: "missing", checkoutEnabled: true }
        : locale === "zh-Hant"
          ? { kind: "ready", cart: cart(0), checkoutEnabled: true }
          : { kind: "empty", checkoutEnabled: true };
    if (locale === "en") {
      await page.clock.runFor(30000);
    } else {
      await readOnReturn();
    }
    await page
      .getByRole("button", {
        name: translate(locale, "Open cart, {count} items", { count: 0 }),
        exact: true,
      })
      .waitFor();
    assert.equal(
      await form().count(),
      0,
      "Authoritative empty cart clears the badge without a manual review",
    );
    assert.equal(
      nextPopup.isClosed(),
      false,
      "Cart reconciliation must not close a payment or receipt window",
    );
    assert.equal(await button("Return to checkout").count(), 0);
    const settledReadCount = state.cartReads;
    await page.clock.runFor(120000);
    assert.equal(
      state.cartReads,
      settledReadCount,
      "Completed cart reconciliation must stop background polling",
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );
    await context.close();
    assert.deepEqual(state.errors, []);
    console.log(
      `${width} ${locale}: native target/checkout guards, safe cancellation/errors, visibility/no-overlap polling, stale attempts and automatic empty-cart reconciliation passed`,
    );
  }
} catch (error) {
  if (activePage && !activePage.isClosed()) {
    console.error(
      "Mocked popup failure controls:",
      await activePage.getByRole("button").allTextContents(),
    );
    await activePage.screenshot({ path: resolve(evidence, "failure.png") });
  }
  throw error;
} finally {
  await browser.close();
  await new Promise((done) => fixtureServer.close(done));
}
