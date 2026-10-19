/* Samples next-order UI: local read fixtures only, all network writes blocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import {
  SAVED_MATCHA_STORAGE_KEY,
  oneKilogramProductUrl,
} from "../src/lib/sample-journey.ts";
import { translate } from "../src/lib/i18n/index.ts";
const base = process.env.SAMPLE_NEXT_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(base).origin;
const evidence =
  process.env.SAMPLE_NEXT_EVIDENCE ?? ".local/sample-next-order-0170/browser";
await mkdir(evidence, { recursive: true });
const products = SAMPLE_SET_CONTENTS.map((item, index) => ({
  id: item.key,
  handle: item.productHandle,
  title: item.name,
  productCode: item.productCode,
  description: "Isolated review fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
      title: "1 kg",
      available: index !== 2,
      priceMinor: 2400,
      currency: "JPY",
      options: [{ name: "Format", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));
const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const [width, tone, locale] of [
  [1440, "light", "en"],
  [390, "dark", "en"],
  [320, "light", "ja"],
]) {
  const context = await browser.newContext({
    viewport: { width, height: width < 500 ? 844 : 900 },
    hasTouch: width < 500,
    isMobile: width < 500,
    reducedMotion: "reduce",
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: base },
    { name: "atoma-locale", value: locale, url: base },
  ]);
  const errors = [];
  await context.route("**/*", async (route) => {
    const req = route.request(),
      u = new URL(req.url());
    if (u.origin !== origin || !["GET", "HEAD"].includes(req.method())) {
      errors.push("Unexpected network write");
      return route.abort();
    }
    if (u.pathname === "/api/destination")
      return route.fulfill({
        json: {
          kind: "ready",
          preference: { countryCode: "US", source: "default" },
          destination: { countryCode: "US", currency: "JPY" },
          countries: ["US", "SG"],
          reviewRequired: false,
        },
      });
    if (u.pathname === "/api/cart")
      return route.fulfill({ json: { kind: "empty", checkoutEnabled: false } });
    if (u.pathname === "/api/catalog")
      return route.fulfill({
        json: { status: "ready", products, shopUrl: "https://example.invalid" },
      });
    if (u.pathname.startsWith("/api/")) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/samples#samples-next`);
  await page.locator("[data-sample-next-order]").waitFor();
  await page.evaluate(() => document.fonts.ready);
  const scope = page.locator("[data-sample-next-order]");
  assert.equal(
    await scope
      .getByText(translate(locale, "Try 20 g → Choose 1 kg → Reorder"), {
        exact: true,
      })
      .count(),
    1,
  );
  await scope
    .getByRole("button", {
      name: translate(locale, "Save for next time"),
      exact: true,
    })
    .waitFor({ state: "visible" });
  await page.waitForFunction(
    () =>
      document.querySelector("[data-sample-next-order] button")?.disabled ===
      false,
  );
  assert.equal(
    await page.evaluate(
      (key) => localStorage.getItem(key),
      SAVED_MATCHA_STORAGE_KEY,
    ),
    null,
  );
  const barista = SAMPLE_SET_CONTENTS.find((x) => x.key === "barista");
  const culinary = SAMPLE_SET_CONTENTS.find((x) => x.key === "culinary");
  await scope.locator(`input[value="${culinary.productHandle}"]`).check();
  await scope
    .getByText(
      `${translate(locale, culinary.name)} · ${translate(locale, "1 kg is currently unavailable.")}`,
      { exact: true },
    )
    .waitFor();
  await scope.locator(`input[value="${barista.productHandle}"]`).check();
  assert.equal(
    await scope.locator("[data-sample-one-kilogram]").getAttribute("href"),
    oneKilogramProductUrl(barista.productHandle),
  );
  assert.equal(
    await page.evaluate(
      (key) => localStorage.getItem(key),
      SAVED_MATCHA_STORAGE_KEY,
    ),
    null,
    "Changing preview does not persist",
  );
  const otherPage = width === 1440 ? await context.newPage() : null;
  if (otherPage) {
    otherPage.on("pageerror", (error) => errors.push(error.message));
    await otherPage.goto(`${base}/samples#samples-next`);
    await otherPage.locator("[data-sample-next-order]").waitFor();
    await otherPage.waitForFunction(
      () =>
        document.querySelector("[data-sample-next-order] button")?.disabled ===
        false,
    );
  }
  await scope
    .getByRole("button", {
      name: translate(locale, "Save for next time"),
      exact: true,
    })
    .click();
  assert.equal(
    JSON.parse(
      await page.evaluate(
        (key) => localStorage.getItem(key),
        SAVED_MATCHA_STORAGE_KEY,
      ),
    ).productHandle,
    barista.productHandle,
  );
  await scope
    .getByText(
      translate(locale, "Saved on this device: {matcha}", {
        matcha: translate(locale, barista.name),
      }),
      { exact: true },
    )
    .waitFor();
  if (otherPage) {
    await otherPage
      .locator(
        `[data-sample-next-order] input[value="${barista.productHandle}"]:checked`,
      )
      .waitFor();
  }
  await page.reload();
  await scope
    .locator(`input[value="${barista.productHandle}"]:checked`)
    .waitFor();
  await scope
    .getByRole("button", {
      name: translate(locale, "Clear saved choice"),
      exact: true,
    })
    .click();
  assert.equal(
    await page.evaluate(
      (key) => localStorage.getItem(key),
      SAVED_MATCHA_STORAGE_KEY,
    ),
    null,
  );
  assert.equal(
    await scope.locator(`input[value="${barista.productHandle}"]`).isChecked(),
    true,
    "Clear preserves current preview",
  );
  assert.equal(
    await scope
      .getByRole("button", {
        name: translate(locale, "Save for next time"),
        exact: true,
      })
      .evaluate((n) => n === document.activeElement),
    true,
    "Clear restores focus",
  );
  if (otherPage) {
    await otherPage
      .getByRole("button", { name: "Clear saved choice", exact: true })
      .waitFor({ state: "hidden" });
    await otherPage.close();
  }
  await scope.scrollIntoViewIfNeeded();
  await scope.screenshot({
    path: `${evidence}/${width}-${tone}-${locale}-closed.png`,
  });
  await scope.locator("summary").click();
  assert.equal(await scope.locator("details").getAttribute("open"), "");
  const offer = scope.locator("[data-sample-first-order-offer]");
  assert.equal(await offer.locator("input, button").count(), 0);
  assert.equal(
    (await page.locator("body").textContent()).includes("TEST-SAMPLE-CREDIT"),
    false,
    "The reusable credit code is never displayed on the public page",
  );
  for (const source of [
    "¥4,500 credit toward your first eligible wholesale order of 1 kg or more after buying the Sample Set.",
    "Approximately US$29. The credit is set in JPY and converted by Shopify at checkout.",
    "Your credit code is included in your Sample Set order confirmation email. Keep it for when you are ready to order 1 kg or more.",
    "Use the same email as your Sample Set order.",
    "Once per customer, on one order. Excludes subscriptions and cannot be combined with other discounts.",
    "Shopify checks eligibility at checkout.",
  ]) {
    assert.equal(
      await offer.getByText(translate(locale, source), { exact: true }).count(),
      1,
    );
  }
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
  );
  await scope.scrollIntoViewIfNeeded();
  await scope.screenshot({
    path: `${evidence}/${width}-${tone}-${locale}-guidance.png`,
  });
  await scope
    .getByRole("button", {
      name: translate(locale, "Save for next time"),
      exact: true,
    })
    .click();
  const shopPage = await context.newPage();
  shopPage.on("pageerror", (error) => errors.push(error.message));
  await shopPage.goto(`${base}/shop`);
  const savedStrip = shopPage.locator("[data-shop-saved-matcha]");
  await savedStrip.waitFor();
  assert.equal(
    await savedStrip
      .getByRole("link", {
        name: translate(locale, "Review 1 kg"),
        exact: true,
      })
      .getAttribute("href"),
    oneKilogramProductUrl(barista.productHandle),
  );
  assert.equal(
    await savedStrip
      .getByText(translate(locale, barista.name), { exact: true })
      .count(),
    1,
  );
  assert.equal(
    await shopPage.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
  );
  await savedStrip.screenshot({
    path: `${evidence}/${width}-${tone}-${locale}-shop.png`,
  });
  await savedStrip
    .getByRole("button", {
      name: translate(locale, "Clear saved matcha"),
      exact: true,
    })
    .click();
  await savedStrip.waitFor({ state: "hidden" });
  assert.equal(
    await shopPage
      .getByRole("heading", {
        name: translate(locale, "THE COLLECTION"),
        exact: true,
      })
      .evaluate((node) => node === document.activeElement),
    true,
    "Shop clear restores focus to the collection heading",
  );
  await scope
    .getByRole("button", {
      name: translate(locale, "Clear saved choice"),
      exact: true,
    })
    .waitFor({ state: "hidden" });
  await shopPage.close();
  if (width === 1440) {
    await scope
      .getByRole("button", { name: "Save for next time", exact: true })
      .click();
    await page.evaluate((key) => {
      const originalSet = Storage.prototype.setItem;
      const originalRemove = Storage.prototype.removeItem;
      Storage.prototype.setItem = function (candidate, value) {
        if (candidate === key) throw new DOMException("Storage unavailable");
        return originalSet.call(this, candidate, value);
      };
      Storage.prototype.removeItem = function (candidate) {
        if (candidate === key) throw new DOMException("Storage unavailable");
        return originalRemove.call(this, candidate);
      };
    }, SAVED_MATCHA_STORAGE_KEY);
    await scope
      .getByRole("button", { name: "Clear saved choice", exact: true })
      .click();
    await scope
      .getByText("Your saved choice could not be cleared on this device.", {
        exact: true,
      })
      .waitFor();
    await scope
      .getByRole("button", { name: "Save for next time", exact: true })
      .click();
    await scope
      .getByText("Your choice could not be saved on this device.", {
        exact: true,
      })
      .waitFor();
  }
  assert.deepEqual(errors, []);
  await context.close();
  console.log(`${width}-${tone}-${locale}: passed`);
}
await browser.close();
