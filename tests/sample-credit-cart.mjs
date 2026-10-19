/* Email-only sample credit regression. Commerce reads are local fixtures;
 * public cart controls must never request or reveal the sample discount. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { translate } from "../src/lib/i18n/index.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const base = process.env.SAMPLE_CREDIT_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(base).origin;
const evidence =
  process.env.SAMPLE_CREDIT_EVIDENCE ?? ".local/sample-credit-0178/browser";
const tea = SAMPLE_SET_CONTENTS[0];
const browser = await chromium.launch({ channel: "chrome", headless: true });
await mkdir(evidence, { recursive: true });

try {
  for (const [width, locale, currency] of [
    [1366, "en", "USD"],
    [390, "zh-Hans", "SGD"],
    [390, "zh-Hant", "USD"],
    [320, "ja", "SGD"],
  ]) {
    const countryCode = currency === "USD" ? "US" : "SG";
    const destination = { countryCode, currency };
    const state = {
      credit: null,
      total: currency === "USD" ? "$100.00" : "S$130.00",
      appliedTotal: currency === "USD" ? "$71.00" : "S$92.05",
      requests: [],
      errors: [],
    };
    const cart = () => ({
      destination,
      totalQuantity: 1,
      subtotalLabel: state.total,
      totalLabel:
        state.credit?.status === "applied" ? state.appliedTotal : state.total,
      ...(state.credit ? { sampleCredit: state.credit } : {}),
      lines: [
        {
          lineKey: "isolated-credit-line",
          productHandle: tea.productHandle,
          productTitle: tea.name,
          variantTitle: "1 kg",
          options: [{ name: "Size", value: "1 kg" }],
          quantity: 1,
          unitPriceLabel: state.total,
          lineTotalLabel: state.total,
          purchaseState: "purchasable",
          quantityRule: { minimum: 1, maximum: 5, increment: 1 },
          canUpdateQuantity: true,
          canRemove: true,
          image: null,
        },
      ],
    });
    const context = await browser.newContext({
      viewport: { width, height: width < 500 ? 844 : 900 },
      hasTouch: width < 500,
      isMobile: width < 500,
      reducedMotion: "reduce",
    });
    await context.addCookies([
      { name: "atoma-locale", value: locale, url: base },
      { name: "atoma-theme", value: width < 500 ? "dark" : "light", url: base },
    ]);
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin !== origin) {
        state.errors.push("Unexpected external request");
        return route.abort();
      }
      if (url.pathname === "/api/destination")
        return route.fulfill({
          json: {
            kind: "ready",
            preference: { countryCode, source: "manual" },
            destination,
            countries: ["US", "SG"],
            reviewRequired: false,
          },
        });
      if (url.pathname === "/api/catalog")
        return route.fulfill({
          json: {
            status: "empty",
            products: [],
            shopUrl: "https://example.invalid",
          },
        });
      if (url.pathname === "/api/cart") {
        if (request.method() === "POST") {
          state.requests.push(request.postDataJSON());
          state.errors.push("Unexpected public cart mutation");
          return route.abort();
        }
        return route.fulfill({
          json: {
            kind: "ready",
            cart: cart(),
            destination,
            checkoutEnabled: true,
          },
        });
      }
      if (
        url.pathname.startsWith("/api/") ||
        !["GET", "HEAD"].includes(request.method())
      ) {
        state.errors.push("Unexpected commerce operation");
        return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on("pageerror", (error) => state.errors.push(error.message));
    const button = (name) =>
      page.getByRole("button", { name: translate(locale, name), exact: true });
    const open = async () => {
      await page
        .getByRole("button", {
          name: translate(locale, "Open cart, {count} item", { count: 1 }),
          exact: true,
        })
        .click();
      await button("Checkout").waitFor();
      await page.waitForFunction(
        () =>
          document.querySelector(
            'form[action="/api/checkout"] button[type="submit"]',
          )?.disabled === false,
      );
    };
    const reopen = async () => {
      await button("Close cart").click();
      await open();
    };
    await page.goto(`${base}/shop`);
    await open();
    // Ignore legacy projections as well: an old or cached response cannot
    // restore the removed public apply action or claim customer eligibility.
    for (const credit of [
      null,
      { status: "not-requested", canApply: false },
      { status: "not-requested", canApply: true },
      { status: "pending", canApply: true },
      { status: "applied", canApply: true },
    ]) {
      state.credit = credit;
      await reopen();
      const dialog = page.locator("dialog[open]");
      assert.equal(
        await dialog.locator("[data-cart-sample-credit]").count(),
        0,
      );
      assert.equal(await dialog.locator("[data-cart-credit-total]").count(), 0);
      assert.equal(await dialog.locator('input[type="text"]').count(), 0);
      assert.equal(
        (await dialog.textContent()).includes("TEST-SAMPLE-CREDIT"),
        false,
      );
      assert.equal(await button("Checkout").isEnabled(), true);
      assert.equal(state.requests.length, 0);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
      );
    }
    await page.locator("dialog[open]").screenshot({
      path: `${evidence}/${width}-${locale}-email-only.png`,
    });
    assert.deepEqual(state.errors, []);
    await context.close();
  }
} finally {
  await browser.close();
}
