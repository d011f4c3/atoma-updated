/* Subscription purchase regression. Every catalog/cart request is intercepted;
 * no request reaches Shopify and no other write is permitted. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { SHOPIFY_CUSTOMER_ACCOUNT_URL } from "../src/lib/customer-account.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.SELLING_PLANS_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.SELLING_PLANS_EVIDENCE ?? ".local/selling-plans-0170/browser";
await mkdir(evidence, { recursive: true });
const tea = SAMPLE_SET_CONTENTS.find((item) => item.key === "barista");
assert.ok(tea);
const plan = {
  id: `v1_${"s".repeat(43)}`,
  name: "Every 4 weeks",
  description: null,
  deliveryInterval: "week",
  deliveryIntervalCount: 4,
  priceMinor: 2400,
  currency: "JPY",
  available: true,
};
const small = {
  id: `v1_${"a".repeat(43)}`,
  title: "200 g",
  available: true,
  priceMinor: 700,
  currency: "JPY",
  options: [{ name: "Format", value: "200 g" }],
  minimum: 1,
  maximum: 4,
  increment: 1,
};
const kilogram = {
  ...small,
  id: `v1_${"b".repeat(43)}`,
  title: "1 kg",
  priceMinor: 2400,
  options: [{ name: "Format", value: "1 kg" }],
  sellingPlans: [plan],
};
const product = {
  id: tea.productHandle,
  handle: tea.productHandle,
  title: tea.name,
  productCode: tea.productCode,
  description: "Isolated subscription regression fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [small, kilogram],
};
const money = (amount) => `¥${amount.toLocaleString("en")}`;

async function eventually(check, message) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const [width, tone] of [
    [1440, "light"],
    [390, "dark"],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: width < 500 ? 844 : 900 },
      isMobile: width < 500,
      hasTouch: width < 500,
      reducedMotion: "reduce",
    });
    await context.addCookies([
      { name: "atoma-theme", value: tone, url: baseURL },
      { name: "atoma-locale", value: "en", url: baseURL },
    ]);
    const actions = [],
      errors = [];
    let cart = null;
    let release;
    let gate = new Promise((done) => {
      release = done;
    });
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const respond = (json) => route.fulfill({ json });
      try {
        assert.equal(url.origin, origin, "External traffic is blocked");
        if (url.pathname === "/api/destination" && request.method() === "GET")
          return respond({
            kind: "ready",
            preference: { countryCode: "US", source: "default" },
            destination: { countryCode: "US", currency: "JPY" },
            countries: ["US", "SG"],
            reviewRequired: false,
          });
        if (url.pathname === "/api/catalog" && request.method() === "GET")
          return respond({
            status: "ready",
            products: [product],
            shopUrl: "https://example.invalid",
          });
        if (url.pathname === "/api/cart" && request.method() === "GET")
          return respond(
            cart
              ? { kind: "ready", cart, checkoutEnabled: false }
              : { kind: "empty", checkoutEnabled: false },
          );
        if (url.pathname === "/api/cart" && request.method() === "POST") {
          const action = request.postDataJSON();
          actions.push(action);
          assert.equal(action.action, "add");
          assert.equal(action.productHandle, product.handle);
          assert.ok([kilogram.id, plan.id].includes(action.variantKey));
          assert.equal(action.quantity, 2);
          if (gate) await gate;
          const recurring = action.variantKey === plan.id;
          cart = {
            totalQuantity: action.quantity,
            subtotalLabel: money(2400 * action.quantity),
            totalLabel: money(2400 * action.quantity),
            lines: [
              {
                lineKey: "isolated-subscription-line",
                productHandle: product.handle,
                productTitle: product.title,
                variantTitle: kilogram.title,
                options: kilogram.options,
                quantity: action.quantity,
                unitPriceLabel: money(2400),
                lineTotalLabel: money(2400 * action.quantity),
                purchaseState: "purchasable",
                quantityRule: { minimum: 1, maximum: 4, increment: 1 },
                canUpdateQuantity: true,
                canRemove: true,
                image: null,
                ...(recurring
                  ? {
                      sellingPlan: {
                        name: plan.name,
                        description: null,
                        deliveryLabel: "Every 4 weeks",
                        priceLabel: money(plan.priceMinor),
                      },
                    }
                  : {}),
              },
            ],
          };
          return respond({ kind: "success", cart, checkoutEnabled: false });
        }
        assert.ok(
          !url.pathname.startsWith("/api/"),
          `Unexpected API: ${url.pathname}`,
        );
        assert.ok(
          ["GET", "HEAD"].includes(request.method()),
          "All other writes are blocked",
        );
        return route.continue();
      } catch (error) {
        errors.push(error.message);
        return route.abort("blockedbyclient");
      }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.goto(`${baseURL}/shop/${product.handle}?format=1kg`);
      const purchase = page.getByRole("region", {
        name: `Purchase ${tea.name}`,
        exact: true,
      });
      await purchase.waitFor();
      assert.equal(
        await purchase
          .getByRole("button", { name: "1 kg", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      await purchase.locator("summary").click();
      const once = purchase.getByRole("radio", {
        name: "One-time purchase",
        exact: true,
      });
      const recurring = purchase.getByRole("radio", {
        name: "Subscribe · Every 4 weeks",
        exact: true,
      });
      assert.equal(await once.isChecked(), true, "1 kg starts as one-time");
      assert.equal(await recurring.isChecked(), false);
      await recurring.locator("..").click();
      assert.equal(await recurring.isChecked(), true);
      const terms = purchase.getByLabel("Subscription terms", { exact: true });
      await terms.waitFor();
      const management = purchase.getByRole("link", {
        name: "Manage subscriptions (opens in a new tab)",
        exact: true,
      });
      assert.equal(
        await management.getAttribute("href"),
        SHOPIFY_CUSTOMER_ACCOUNT_URL,
      );
      assert.equal(await management.getAttribute("target"), "_blank");
      const footerManagement = page
        .locator("[data-site-footer]")
        .getByRole("link", {
          name: "Manage subscriptions (opens in a new tab)",
          exact: true,
        });
      assert.equal(
        await footerManagement.getAttribute("href"),
        SHOPIFY_CUSTOMER_ACCOUNT_URL,
      );
      assert.equal(
        await page.locator("[data-footer-utility-preview] a").count(),
        0,
        "Unpublished policy/contact labels remain plain text",
      );
      assert.match(
        await terms.innerText(),
        /¥2,400\s*\/ Per delivery\. Billed and delivered every 4 weeks\./,
      );
      await purchase
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      assert.equal(
        await purchase.getByLabel("Quantity", { exact: true }).innerText(),
        "2",
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
      );
      await purchase.screenshot({
        path: `${evidence}/${width}-${tone}-subscription.png`,
      });
      await purchase
        .getByRole("button", { name: "Add to cart", exact: true })
        .click();
      await eventually(
        () => actions.length === 1,
        "The mock received the recurring add",
      );
      assert.equal(
        actions[0].variantKey,
        plan.id,
        "Recurring add uses the signed plan action key",
      );
      assert.equal(actions[0].quantity, 2);
      assert.equal(
        await once.isDisabled(),
        true,
        "One-time is locked during a cart write",
      );
      assert.equal(
        await recurring.isDisabled(),
        true,
        "Recurring is locked during a cart write",
      );
      assert.equal(await management.getAttribute("aria-disabled"), "true");
      assert.equal(
        await purchase
          .getByRole("button", { name: "Increase quantity", exact: true })
          .isDisabled(),
        true,
      );
      release();
      gate = null;
      const dialog = page.getByRole("dialog", {
        name: "Your selection.",
        exact: true,
      });
      await dialog.waitFor();
      await dialog.getByText(/Every 4 weeks/).waitFor();
      await dialog.getByText(/per delivery/i).waitFor();
      const recurringTerms = await dialog
        .locator("p")
        .filter({ hasText: /Every 4 weeks/ })
        .innerText();
      assert.equal(
        recurringTerms.match(/Every 4 weeks/g)?.length,
        1,
        "Identical plan name and delivery interval are shown once",
      );
      await dialog.screenshot({
        path: `${evidence}/${width}-${tone}-recurring-cart.png`,
      });
      await dialog
        .getByRole("button", { name: "Close cart", exact: true })
        .click();
      await dialog.waitFor({ state: "hidden" });
      await once.focus();
      await page.keyboard.press("Space");
      assert.equal(await once.isChecked(), true);
      assert.equal(
        await terms.count(),
        0,
        "One-time selection removes recurring terms",
      );
      await purchase
        .getByRole("button", { name: "Add to cart", exact: true })
        .click();
      await eventually(
        () => actions.length === 2,
        "The mock received the one-time add",
      );
      assert.equal(
        actions[1].variantKey,
        kilogram.id,
        "One-time add uses the base action key",
      );
      await dialog.waitFor();
      assert.equal(await dialog.getByText(/per delivery/i).count(), 0);
      await dialog
        .getByRole("button", { name: "Close cart", exact: true })
        .click();
      await dialog.waitFor({ state: "hidden" });
      await purchase
        .getByRole("button", { name: "200 g", exact: true })
        .click();
      assert.equal(
        await purchase
          .getByRole("radio", { name: "Subscribe — unavailable", exact: true })
          .isDisabled(),
        true,
      );
      assert.equal(
        await purchase
          .getByRole("radio", { name: "One-time purchase", exact: true })
          .isChecked(),
        true,
      );
      assert.equal(
        await purchase.getByLabel("Quantity", { exact: true }).innerText(),
        "1",
      );
      assert.equal(await terms.count(), 0);
      await page.locator("[data-site-footer]").screenshot({
        path: `${evidence}/${width}-${tone}-management-footer.png`,
      });
      assert.deepEqual(errors, []);
      console.log(
        `${width}-${tone}: recurring/one-time keys, terms, quantity, busy lock and smaller format passed`,
      );
    } catch (error) {
      await page.screenshot({
        path: `${evidence}/${width}-${tone}-failure.png`,
        fullPage: true,
      });
      throw error;
    } finally {
      release?.();
      await context.close();
    }
  }
} finally {
  await browser.close();
}
