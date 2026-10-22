/* Tasting continuity and named1kg links: public reads use isolated fixtures;
 * every external request and commerce mutation is blocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";
import { SAMPLE_TASTINGS_STORAGE_KEY } from "../src/lib/sample-tastings.ts";
import { SAVED_MATCHA_STORAGE_KEY } from "../src/lib/sample-journey.ts";
import { translate } from "../src/lib/i18n/index.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.CLIENT_TASTING_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.CLIENT_TASTING_EVIDENCE ?? ".local/client-feedback-0226/after";
const profiles = process.env.CLIENT_TASTING_PROFILES?.split(",") ?? [
  "1440-light-en",
  "390-dark-en",
  "390-light-ja",
];
const products = SAMPLE_SET_CONTENTS.map((item, index) => ({
  id: item.key,
  handle: item.productHandle,
  title: item.name,
  productCode: item.productCode,
  description: "Isolated comparison fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [100, 1000].map((grams, pack) => ({
    id: `v1_${String.fromCharCode(97 + index * 2 + pack).repeat(43)}`,
    title: grams === 100 ? "100 g" : "1 kg",
    available: true,
    priceMinor: pack ? 6000 + index * 1000 : 1000 + index * 100,
    currency: "JPY",
    options: [{ name: "Size", value: grams === 100 ? "100 g" : "1 kg" }],
    minimum: 1,
    maximum: 5,
    increment: 1,
  })),
}));
const sampleProduct = {
  ...products[0],
  id: "sample-set",
  handle: SAMPLE_SET_OFFER.productHandle,
  title: "Sample Set",
  productCode: null,
  variants: [
    {
      ...products[0].variants[0],
      id: `v1_${"s".repeat(43)}`,
      title: "3 × 20 g",
      options: SAMPLE_SET_OFFER.variants[0].options,
    },
  ],
};
const barista = products.find((item) => item.id === "barista");
const cart = {
  totalQuantity: 2,
  subtotalLabel: "¥14,000",
  totalLabel: "¥14,000",
  lines: [
    {
      lineKey: "retained-barista",
      productHandle: barista.handle,
      productTitle: barista.title,
      variantTitle: "1 kg",
      options: barista.variants[1].options,
      quantity: 2,
      unitPriceLabel: "¥7,000",
      lineTotalLabel: "¥14,000",
      purchaseState: "purchasable",
      quantityRule: { minimum: 1, maximum: 5, increment: 1 },
      canUpdateQuantity: true,
      canRemove: true,
      image: null,
    },
  ],
};
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}
async function setup(width = 1440, tone = "light", locale = "en") {
  const context = await browser.newContext({
    viewport: { width, height: width < 500 ? 844 : 900 },
    reducedMotion: "reduce",
    isMobile: width < 500,
    hasTouch: width < 500,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: locale, url: baseURL },
  ]);
  const fixture = {
    products: structuredClone([sampleProduct, ...products]),
    country: "US",
    unavailable: false,
    hold: null,
    catalogReads: 0,
  };
  const errors = [],
    writes = [];
  await context.route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.origin !== origin) {
      errors.push(`External request: ${url.origin}`);
      return route.abort();
    }
    if (!["GET", "HEAD"].includes(request.method())) {
      writes.push(`${request.method()} ${url.pathname}`);
      return route.abort();
    }
    if (url.pathname === "/api/catalog") {
      fixture.catalogReads++;
      if (fixture.hold) await fixture.hold;
      return route.fulfill({
        json: fixture.unavailable
          ? {
              status: "unavailable",
              products: [],
              shopUrl: "https://example.invalid",
            }
          : {
              status: "ready",
              products: fixture.products,
              shopUrl: "https://example.invalid",
              destination: { countryCode: fixture.country, currency: "JPY" },
            },
      });
    }
    if (url.pathname === "/api/cart")
      return route.fulfill({
        json: { kind: "ready", cart, checkoutEnabled: false },
      });
    if (url.pathname === "/api/destination")
      return route.fulfill({
        json: {
          kind: "ready",
          preference: { countryCode: fixture.country, source: "default" },
          destination: { countryCode: fixture.country, currency: "JPY" },
          countries: ["US", "SG"],
          reviewRequired: false,
        },
      });
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Unexpected API read: ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page, fixture, errors, writes };
}
const drafts = {
  ceremonial: {
    notes: "Fixture tea note. Keep dose unchanged. 試飲",
    preparation: "hot",
    matchaGrams: "2.125",
    waterMl: "70",
    milkMl: "0",
  },
  barista: {
    notes: "Fixture latte note. Compare the same milk.",
    preparation: "iced",
    matchaGrams: "3.5",
    waterMl: "40",
    milkMl: "120",
  },
  culinary: {
    notes: "Fixture recipe note. Retest after cooling.",
    preparation: "recipe",
    matchaGrams: "4.25",
    waterMl: "0",
    milkMl: "80",
  },
};
const tools = (page) => page.locator("[data-sample-tasting-tools]");
const editor = (page) => tools(page).locator("[data-tasting-editor]");
const button = (page, locale, label) =>
  tools(page).getByRole("button", {
    name: translate(locale, label),
    exact: true,
  });
const teaFor = (key) => SAMPLE_SET_CONTENTS.find((item) => item.key === key);
async function chooseTea(page, locale, key) {
  await button(page, locale, "Tasting card").click();
  await tools(page).locator(`[data-tasting-tea="${key}"]`).click();
}
async function fillDraft(page, locale, key) {
  await chooseTea(page, locale, key);
  const form = editor(page).locator("form"),
    draft = drafts[key];
  await form.locator('[name="notes"]').fill(draft.notes);
  const recipe = form.locator("details");
  if ((await recipe.getAttribute("open")) === null)
    await recipe.locator("summary").click();
  await form.locator('[name="preparation"]').selectOption(draft.preparation);
  for (const name of ["matchaGrams", "waterMl", "milkMl"])
    await form.locator(`[name="${name}"]`).fill(draft[name]);
}
async function assertDraft(page, key) {
  assert.equal(
    await tools(page)
      .locator(`[data-tasting-tea="${key}"]`)
      .getAttribute("aria-pressed"),
    "true",
    "Selected tea survives Back",
  );
  for (const [field, value] of Object.entries(drafts[key]))
    assert.equal(
      await editor(page).locator(`[name="${field}"]`).inputValue(),
      value,
      `${key} retains ${field}`,
    );
}
async function saved(page) {
  return page.evaluate(
    (key) => localStorage.getItem(key),
    SAMPLE_TASTINGS_STORAGE_KEY,
  );
}
async function assertNamedLink(link, key, locale) {
  const tea = teaFor(key);
  assert.equal(
    await link.getAttribute("href"),
    `/shop/${tea.productHandle}?format=1kg`,
  );
  assert.equal(
    (await link.textContent()).replace(/↗/g, "").trim(),
    translate(locale, "View 1 kg of {name}", {
      name: translate(locale, tea.name),
    }),
  );
  assert.equal(await link.evaluate((node) => node.tagName), "A");
}
async function openProductAndBack(page, link, key, locale) {
  await assertNamedLink(link, key, locale);
  await link.focus();
  await page.keyboard.press("Enter");
  const product = page.locator(
    `[data-retail-product="${teaFor(key).productHandle}"]`,
  );
  await product.locator("h1").waitFor();
  assert.equal(
    await product
      .getByRole("button", { name: "1 kg", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await product
      .getByRole("button", { name: "100 g", exact: true })
      .getAttribute("aria-pressed"),
    "false",
  );
  await page.goBack();
  await tools(page).waitFor();
}
async function geometry(page, scope) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
  );
  const clipped = await scope
    .locator('a[href*="format=1kg"]')
    .evaluateAll((nodes) =>
      nodes
        .filter(
          (node) =>
            node.getClientRects().length &&
            node.scrollWidth > node.clientWidth + 1,
        )
        .map((node) => node.textContent),
    );
  assert.deepEqual(clipped, [], "Named1kg links do not clip");
}
async function compare(page, locale, pair = ["barista", "culinary"]) {
  await button(page, locale, "Compare samples").click();
  const scope = tools(page).locator("[data-tasting-comparison]");
  await scope.waitFor();
  await scope
    .getByRole("combobox", {
      name: translate(locale, "First matcha"),
      exact: true,
    })
    .selectOption(pair[0]);
  await scope
    .getByRole("combobox", {
      name: translate(locale, "Second matcha"),
      exact: true,
    })
    .selectOption(pair[1]);
  return scope;
}
async function assertPair(page, locale, pair) {
  const scope = tools(page).locator("[data-tasting-comparison]");
  assert.equal(await scope.isVisible(), true, "Comparison view survives Back");
  assert.equal(
    await scope
      .getByRole("combobox", {
        name: translate(locale, "First matcha"),
        exact: true,
      })
      .inputValue(),
    pair[0],
  );
  assert.equal(
    await scope
      .getByRole("combobox", {
        name: translate(locale, "Second matcha"),
        exact: true,
      })
      .inputValue(),
    pair[1],
  );
}
try {
  for (const profile of profiles) {
    const [, rawWidth, tone, locale] =
      /^(\d+)-(light|dark)-(en|ja|zh-Hans|zh-Hant)$/.exec(profile) ?? [];
    assert.ok(rawWidth);
    const test = await setup(Number(rawWidth), tone, locale),
      { page } = test;
    try {
      await page.goto(`${baseURL}/samples`, { waitUntil: "networkidle" });
      await tools(page).waitFor();
      for (const tea of SAMPLE_SET_CONTENTS) {
        await fillDraft(page, locale, tea.key);
        assert.equal(
          await saved(page),
          null,
          "Editing never saves tasting data",
        );
        const link = editor(page).locator(
          `a[href="/shop/${tea.productHandle}?format=1kg"]`,
        );
        await geometry(page, editor(page));
        await openProductAndBack(page, link, tea.key, locale);
        await assertDraft(page, tea.key);
        assert.equal(
          await saved(page),
          null,
          "Product navigation never saves a draft",
        );
      }
      await editor(page).screenshot({
        path: resolve(evidence, `${profile}-editor.png`),
      });
      const comparison = await compare(page, locale);
      await geometry(page, comparison);
      for (const key of ["barista", "culinary"]) {
        const link = comparison.locator(
          `a[href="/shop/${teaFor(key).productHandle}?format=1kg"]`,
        );
        await openProductAndBack(page, link, key, locale);
        await assertPair(page, locale, ["barista", "culinary"]);
      }
      await comparison.screenshot({
        path: resolve(evidence, `${profile}-comparison.png`),
      });
      if (profile === "390-dark-en") {
        await page.setViewportSize({ width: 320, height: 740 });
        await geometry(page, comparison);
        await comparison.screenshot({
          path: resolve(evidence, "320-dark-en-comparison.png"),
        });
        await page.setViewportSize({ width: 390, height: 844 });
      }
      await button(page, locale, "Tasting card").click();
      await assertDraft(page, "culinary");
      for (const key of ["ceremonial", "barista"]) {
        await chooseTea(page, locale, key);
        await assertDraft(page, key);
      }
      const next = page.locator("[data-sample-next-order]");
      await next
        .locator(`input[value="${teaFor("culinary").productHandle}"]`)
        .check();
      await openProductAndBack(
        page,
        next.locator("[data-sample-one-kilogram]"),
        "culinary",
        locale,
      );
      assert.equal(
        await next
          .locator(`input[value="${teaFor("culinary").productHandle}"]`)
          .isChecked(),
        true,
      );
      await assertDraft(page, "barista");
      await next.screenshot({
        path: resolve(evidence, `${profile}-next-order.png`),
      });
      assert.equal(
        await page.evaluate(
          (key) => localStorage.getItem(key),
          SAVED_MATCHA_STORAGE_KEY,
        ),
        null,
        "Choosing next order never saves a favourite",
      );
      const cartButton = page.getByRole("button", {
        name: translate(locale, "Open cart, {count} items", { count: 2 }),
        exact: true,
      });
      await cartButton.click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      assert.ok((await dialog.textContent()).includes("14,000"));
      assert.ok(
        (await dialog.textContent()).includes(
          translate(locale, "Barista Matcha"),
        ),
      );
      await page
        .getByRole("button", {
          name: translate(locale, "Close cart"),
          exact: true,
        })
        .click();
      assert.deepEqual(test.errors, []);
      assert.deepEqual(test.writes, []);
      console.log(
        `${profile}: all3 namedlinks, unsaved drafts/dose/selection, comparison pair/view, nextorder and cart passed`,
      );
    } catch (error) {
      await page.screenshot({
        path: resolve(evidence, `${profile}-failure.png`),
        fullPage: true,
      });
      throw error;
    } finally {
      await test.context.close();
    }
  }
  const explicit = await setup(),
    { page } = explicit;
  try {
    await page.goto(`${baseURL}/samples`, { waitUntil: "networkidle" });
    await fillDraft(page, "en", "barista");
    await button(page, "en", "Save tasting card").click();
    await eventually(
      async () => Boolean(await saved(page)),
      "Explicit Save persists",
    );
    const stored = JSON.parse(await saved(page));
    assert.deepEqual(stored.records.barista, {
      preparation: "iced",
      matchaMg: 3500,
      waterMl: 40,
      milkMl: 120,
      notes: drafts.barista.notes,
    });
    const next = page.locator("[data-sample-next-order]");
    await next
      .locator(`input[value="${teaFor("culinary").productHandle}"]`)
      .check();
    await next
      .getByRole("button", { name: "Save for next time", exact: true })
      .click();
    assert.ok(
      (
        await page.evaluate(
          (key) => localStorage.getItem(key),
          SAVED_MATCHA_STORAGE_KEY,
        )
      ).includes(teaFor("culinary").productHandle),
    );
    await page.reload({ waitUntil: "networkidle" });
    await chooseTea(page, "en", "barista");
    await assertDraft(page, "barista");
    assert.equal(
      await next
        .locator(`input[value="${teaFor("culinary").productHandle}"]`)
        .isChecked(),
      true,
    );
    await button(page, "en", "Clear saved card").click();
    assert.equal(await saved(page), null);
    await next
      .getByRole("button", { name: "Clear saved choice", exact: true })
      .click();
    assert.equal(
      await page.evaluate(
        (key) => localStorage.getItem(key),
        SAVED_MATCHA_STORAGE_KEY,
      ),
      null,
    );
    await page.reload({ waitUntil: "networkidle" });
    await chooseTea(page, "en", "barista");
    assert.equal(await editor(page).locator('[name="notes"]').inputValue(), "");
    assert.equal(
      await editor(page).locator('[name="matchaGrams"]').inputValue(),
      "",
    );
    assert.deepEqual(explicit.errors, []);
    assert.deepEqual(explicit.writes, []);
    console.log(
      "Explicit Save, reload and Clear preserve storage boundaries for tasting and favourite",
    );
  } finally {
    await explicit.context.close();
  }
  const blocked = await setup(390, "dark", "en");
  try {
    await blocked.context.addInitScript(
      ({ tastingKey, favouriteKey }) => {
        for (const method of ["getItem", "setItem", "removeItem"]) {
          const original = Storage.prototype[method];
          Storage.prototype[method] = function (key, ...args) {
            if ([tastingKey, favouriteKey].includes(key))
              throw new DOMException(
                "Fixture storage blocked",
                "SecurityError",
              );
            return original.call(this, key, ...args);
          };
        }
      },
      {
        tastingKey: SAMPLE_TASTINGS_STORAGE_KEY,
        favouriteKey: SAVED_MATCHA_STORAGE_KEY,
      },
    );
    const { page } = blocked;
    await page.goto(`${baseURL}/samples`, { waitUntil: "networkidle" });
    await fillDraft(page, "en", "barista");
    await button(page, "en", "Save tasting card").click();
    await tools(page)
      .getByText(
        "Your card could not be saved on this device. You can still copy or download it.",
        { exact: true },
      )
      .waitFor();
    await openProductAndBack(
      page,
      editor(page).locator(`a[href="/shop/${barista.handle}?format=1kg"]`),
      "barista",
      "en",
    );
    await assertDraft(page, "barista");
    const next = page.locator("[data-sample-next-order]");
    await next.locator(`input[value="${barista.handle}"]`).check();
    await next
      .getByRole("button", { name: "Save for next time", exact: true })
      .click();
    await next
      .getByText("Your choice could not be saved on this device.", {
        exact: true,
      })
      .waitFor();
    await openProductAndBack(
      page,
      next.locator("[data-sample-one-kilogram]"),
      "barista",
      "en",
    );
    assert.equal(
      await next.locator(`input[value="${barista.handle}"]`).isChecked(),
      true,
    );
    await assertDraft(page, "barista");
    await editor(page).screenshot({
      path: resolve(evidence, "390-dark-en-storage-blocked.png"),
    });
    assert.deepEqual(blocked.errors, []);
    assert.deepEqual(blocked.writes, []);
    console.log(
      "Blocked localStorage retains usable draft, selected tea and nextorder choice in memory",
    );
  } finally {
    await blocked.context.close();
  }
} finally {
  await browser.close();
}
