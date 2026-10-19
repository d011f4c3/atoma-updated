/* Shop-filter study regression. Catalog reads use isolated fixtures; all writes
 * and external requests are blocked. No commerce state is mutated. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";
import { translate } from "../src/lib/i18n/index.ts";

const playwright = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.SHOP_FILTER_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const engine = process.env.SHOP_FILTER_BROWSER ?? "chromium";
const evidence =
  process.env.SHOP_FILTER_EVIDENCE ?? ".local/shop-filter-study-0211/browser";
const filter = process.env.SHOP_FILTER_FILTER;
const directions = ["index", "tiles", "facets"];
const categories = ["all", "ceremonial", "barista", "culinary"];
const destination = { countryCode: "US", currency: "USD" };
assert.ok(["chromium", "webkit"].includes(engine));
assert.ok(SAMPLE_SET_OFFER);

// Titles intentionally contradict identity. Only the reviewed product handle
// may assign a tea to a category; an unmapped title cannot borrow a category.
const catalogProducts = [
  {
    id: "isolated-set",
    handle: SAMPLE_SET_OFFER.productHandle,
    title: "Sample Set",
    options: SAMPLE_SET_OFFER.variants[0].options,
  },
  ...SAMPLE_SET_CONTENTS.map((item) => ({
    id: `isolated-${item.key}`,
    handle: item.productHandle,
    title: `${item.key === "ceremonial" ? "Culinary" : "Ceremonial"} renamed upstream fixture`,
    options: [{ name: "Format", value: "1 kg" }],
  })),
  {
    id: "isolated-unmapped",
    handle: "unmapped-filter-fixture",
    title: "Ceremonial barista culinary reserve",
    options: [{ name: "Format", value: "1 kg" }],
  },
].map((item, index) => ({
  id: item.id,
  handle: item.handle,
  title: item.title,
  description: "Isolated filter-study fixture.",
  productCode: null,
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
      selectionId: item.id,
      title: index ? "1 kg" : "3 × 20 g",
      options: item.options,
      available: true,
      priceMinor: index ? 6500 : 2900,
      currency: "USD",
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));
const expectedIds = {
  all: [
    ...SAMPLE_SET_CONTENTS.map((item) => `isolated-${item.key}`),
    "isolated-unmapped",
  ],
  ceremonial: ["isolated-ceremonial"],
  barista: ["isolated-barista"],
  culinary: ["isolated-culinary"],
};

function gate() {
  let release;
  const promise = new Promise((resolveGate) => {
    release = resolveGate;
  });
  return { promise, release };
}

async function setup(
  browser,
  {
    width = 390,
    tone = "light",
    reducedMotion = "no-preference",
    locale = "en",
    products = catalogProducts,
    failed = false,
    held = false,
  } = {},
) {
  const context = await browser.newContext({
    viewport: { width, height: width <= 760 ? 844 : 1000 },
    hasTouch: width <= 760,
    isMobile: width <= 760,
    reducedMotion,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: locale, url: baseURL },
  ]);
  const state = { failed, products, reads: 0, gate: held ? gate() : null };
  const errors = [];
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      errors.push(
        `Blocked external request or write: ${request.method()} ${url.pathname}`,
      );
      return route.abort();
    }
    if (url.pathname === "/api/destination")
      return route.fulfill({
        json: {
          kind: "ready",
          preference: { countryCode: "US", source: "manual" },
          destination,
          countries: ["US"],
          reviewRequired: false,
        },
      });
    if (url.pathname === "/api/catalog") {
      state.reads++;
      await state.gate?.promise;
      return route.fulfill({
        status: state.failed ? 503 : 200,
        json: {
          status: state.failed ? "unavailable" : "ready",
          destination,
          products: state.failed ? [] : state.products,
          shopUrl: "https://example.invalid",
        },
      });
    }
    if (url.pathname === "/api/cart")
      return route.fulfill({
        json: {
          kind: "empty",
          destination,
          destinationReviewRequired: false,
          checkoutEnabled: false,
        },
      });
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Unexpected API: ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  return {
    context,
    page,
    errors,
    state,
    width,
    tone,
    releaseCatalog() {
      state.gate?.release();
      state.gate = null;
    },
    async close() {
      state.gate?.release();
      await context.close();
    },
  };
}

async function checkFit(page) {
  const overflow = await page.evaluate(() => {
    const root =
      document.querySelector("[data-shop-filter-study]") ??
      document.querySelector("[data-canonical-shop]") ??
      document;
    const elements = [
      ...root.querySelectorAll("button, select, article, h1, h2, p, label"),
    ];
    return {
      document: document.documentElement.scrollWidth > innerWidth,
      elements: elements
        .filter(
          (node) =>
            node.getClientRects().length &&
            getComputedStyle(node).visibility !== "hidden" &&
            !node.closest("[inert]") &&
            // Compact destination labels intentionally use the standard 1px clip.
            !(
              getComputedStyle(node).clipPath === "inset(50%)" &&
              node.clientWidth === 1 &&
              node.clientHeight === 1
            ),
        )
        .filter((node) => {
          const box = node.getBoundingClientRect();
          return (
            box.left < -1 ||
            box.right > innerWidth + 1 ||
            node.scrollWidth > node.clientWidth + 1
          );
        })
        .map((node) => ({
          tag: node.tagName,
          text: node.textContent.slice(0, 70),
        })),
    };
  });
  assert.deepEqual(overflow, { document: false, elements: [] });
}

async function visibleCardIds(page) {
  return page
    .locator("[data-shop-product]:visible")
    .evaluateAll((cards) =>
      cards.map((card) => card.getAttribute("data-shop-product")).sort(),
    );
}

async function rememberCards(page) {
  const cards = new Map();
  for (const card of await page.locator("[data-shop-product]").all())
    cards.set(
      await card.getAttribute("data-shop-product"),
      await card.elementHandle(),
    );
  return cards;
}

async function checkMountedCards(page, originals) {
  assert.equal(
    await page.locator("[data-shop-product]").count(),
    originals.size,
  );
  for (const [id, original] of originals)
    assert.equal(
      await page
        .locator(`[data-shop-product="${id}"]`)
        .evaluate((card, old) => card === old, original),
      true,
      `${id} stays mounted while filtering and comparing treatments`,
    );
}

async function checkProductLinks(page) {
  for (const product of catalogProducts.filter(
    (item) => item.id !== "isolated-set",
  )) {
    const card = page.locator(`[data-shop-product="${product.id}"]`);
    assert.equal(
      await card
        .getByRole("link", { includeHidden: true })
        .getAttribute("href"),
      `/shop/${encodeURIComponent(product.handle)}`,
    );
    assert.equal(
      await card.locator("button").count(),
      0,
      "Filtering does not add a purchase action to the product card",
    );
  }
}

async function checkThemeCookie(context, originalTone) {
  const cookies = await context.cookies(baseURL);
  assert.equal(
    cookies.find((cookie) => cookie.name === "atoma-theme")?.value,
    originalTone,
    "Study tone does not overwrite storefront preference",
  );
}

const study = (page) => page.locator("[data-shop-filter-study]");
const categoryButton = (page, category) =>
  page.locator(`[data-shop-category="${category}"]`);

async function open(fixture, query = "") {
  await fixture.page.goto(`${baseURL}/shop-filter-study${query}`);
  await study(fixture.page).waitFor();
  await fixture.page.evaluate(() => document.fonts.ready);
}

async function ready(page) {
  await page.waitForFunction(() => {
    const choice = document.querySelector('[data-shop-category="all"]');
    return choice && !choice.disabled;
  });
}

async function chooseCategory(page, category) {
  const trigger = page.locator("[data-shop-category-trigger]");
  if (
    (await trigger.count()) &&
    (await trigger.getAttribute("aria-expanded")) !== "true"
  )
    await trigger.click();
  await categoryButton(page, category).click();
  if (await trigger.count()) {
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    assert.equal(
      await trigger.evaluate((node) => node === document.activeElement),
      true,
      "Facet choice returns focus to its trigger",
    );
  }
}

async function checkCategory(page, category, ids = expectedIds, locale = "en") {
  assert.deepEqual(await visibleCardIds(page), [...ids[category]].sort());
  assert.equal(
    await categoryButton(page, category).getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page.locator('[data-shop-category][aria-pressed="true"]').count(),
    1,
  );
  for (const choice of categories) {
    const count = categoryButton(page, choice).locator("span[aria-label]");
    assert.equal(
      await count.getAttribute("aria-label"),
      translate(locale, "{count} matcha", { count: ids[choice].length }),
    );
    assert.equal(
      (await count.textContent()).trim(),
      String(ids[choice].length).padStart(2, "0"),
    );
  }
  const count = translate(locale, "{count} of {total} matcha", {
    count: String(ids[category].length).padStart(2, "0"),
    total: String(ids.all.length).padStart(2, "0"),
  });
  assert.equal(
    await page
      .locator('main span[aria-live="polite"]')
      .filter({ hasText: count })
      .count(),
    1,
  );
  assert.equal(
    await page.locator('[data-sample-entry-point="collection"]').isVisible(),
    true,
    "Sample Set entry remains available in every category",
  );
}

async function checkFuture(page, locale = "en") {
  const future = page.locator("[data-shop-future-fields]");
  assert.equal(await future.count(), 1);
  assert.equal(await future.locator("[data-shop-future-filter]").count(), 2);
  const beforeURL = page.url();
  const beforeCategory = await page
    .locator('[data-shop-category][aria-pressed="true"]')
    .getAttribute("data-shop-category");
  for (const name of ["Taste", "Region"]) {
    const field = future.locator(
      `[data-shop-future-filter="${name.toLowerCase()}"]`,
    );
    assert.equal(
      await field.getByText(translate(locale, name), { exact: true }).count(),
      1,
    );
    assert.equal(
      await field
        .getByText(translate(locale, "Coming soon"), { exact: true })
        .count(),
      1,
    );
    const semantics = await field.evaluate((node) => {
      const before = document.activeElement;
      node.focus();
      const box = node.getBoundingClientRect();
      return {
        focusUnchanged: document.activeElement === before,
        tabIndex: node.tabIndex,
        tag: node.tagName,
        role: node.getAttribute("role"),
        children: [...node.children].map((child) => child.tagName),
        fits: [...node.children].every((child) => {
          const childBox = child.getBoundingClientRect();
          return (
            child.scrollWidth <= child.clientWidth + 1 &&
            childBox.left >= box.left &&
            childBox.right <= box.right + 1
          );
        }),
      };
    });
    assert.equal(semantics.tag, "DIV");
    assert.equal(semantics.role, null);
    assert.equal(semantics.tabIndex, -1);
    assert.equal(semantics.focusUnchanged, true);
    assert.deepEqual(semantics.children, ["SPAN", "SPAN"]);
    assert.equal(semantics.fits, true, "Future labels fit within their fields");
    assert.doesNotMatch(await field.textContent(), /[+＋]/);
    await field.click();
    assert.equal(page.url(), beforeURL, "Future text has no navigation action");
    assert.equal(
      await page
        .locator('[data-shop-category][aria-pressed="true"]')
        .getAttribute("data-shop-category"),
      beforeCategory,
      "Future text does not change the working category filter",
    );
  }
  assert.equal(
    await future
      .locator("a, button, input, select, textarea, [tabindex], [role=button]")
      .count(),
    0,
    "Unreleased filters are explanatory text, not controls",
  );
}

async function checkTargets(page) {
  for (const control of await page
    .locator(
      "[data-filter-direction], [data-shop-category]:visible, [data-shop-category-trigger], [data-study-tone]",
    )
    .all()) {
    const box = await control.boundingBox();
    assert.ok(
      box && box.width >= 44 && box.height >= 44,
      "Filter and study controls retain touch targets",
    );
  }
}

async function responsiveCase(browser, width, tone, name) {
  const fixture = await setup(browser, { width, tone });
  const { page } = fixture;
  try {
    await open(fixture, `?tone=${tone}`);
    await ready(page);
    const initialReads = fixture.state.reads;
    const original = await rememberCards(page);
    assert.deepEqual([...original.keys()].sort(), [...expectedIds.all].sort());
    await checkProductLinks(page);
    let category = "all";
    for (const direction of directions) {
      await page.locator(`[data-filter-direction="${direction}"]`).click();
      assert.equal(
        await page.locator(`[data-shop-filters="${direction}"]`).count(),
        1,
      );
      await checkCategory(page, category);
      await checkMountedCards(page, original);
      for (const next of ["ceremonial", "barista", "culinary", "all"]) {
        await chooseCategory(page, next);
        category = next;
        await checkCategory(page, category);
        assert.equal(
          new URL(page.url()).searchParams.get("category"),
          category,
        );
        await checkMountedCards(page, original);
      }
      await page.locator("[data-study-future]").check();
      await checkFuture(page);
      if (direction === "facets")
        await page.locator("[data-shop-category-trigger]").click();
      await checkFit(page);
      await checkTargets(page);
      await page.screenshot({
        path: `${evidence}/${name}-${direction}.png`,
        fullPage: true,
      });
      if (width >= 390) {
        await page.evaluate(() =>
          window.scrollTo({ top: 0, behavior: "instant" }),
        );
        await page.screenshot({
          path: `${evidence}/${name}-${direction}-viewport.png`,
        });
      }
      if (direction === "facets") await page.keyboard.press("Escape");
      // Leave a real filter selected so the next direction must preserve it.
      await chooseCategory(page, "barista");
      category = "barista";
    }
    await page.locator("[data-study-tone]").click();
    const nextTone = tone === "light" ? "dark" : "light";
    assert.equal(await study(page).getAttribute("data-tone"), nextTone);
    await checkCategory(page, "barista");
    await checkMountedCards(page, original);
    await checkFuture(page);
    await checkThemeCookie(fixture.context, tone);
    const query = new URL(page.url()).searchParams;
    assert.equal(query.get("direction"), "facets");
    assert.equal(query.get("tone"), nextTone);
    assert.equal(query.get("future"), "1");
    assert.equal(
      fixture.state.reads,
      initialReads,
      "Presentation changes do not refetch the collection",
    );
    await page.reload();
    await ready(page);
    assert.equal(await study(page).getAttribute("data-tone"), nextTone);
    await checkCategory(page, "barista");
    await checkFuture(page);
    await page.locator("[data-shop-clear-category]").click();
    await checkCategory(page, "all");
    assert.equal(
      await page
        .locator("[data-shop-category-trigger]")
        .evaluate((node) => node === document.activeElement),
      true,
      "Clear restores focus to the facet trigger before its own control disappears",
    );
    assert.equal(await page.locator("[data-shop-clear-category]").count(), 0);
    await page.locator("[data-study-future]").uncheck();
    assert.equal(await page.locator("[data-shop-future-fields]").count(), 0);
    assert.equal(new URL(page.url()).searchParams.has("future"), false);
    assert.deepEqual(fixture.errors, []);
    return {
      name,
      directions: directions.length,
      exactCategoryIdentities: "passed",
      mountedCards: original.size,
      queryReload: "passed",
    };
  } finally {
    await fixture.close();
  }
}

async function keyboardCase(browser, name) {
  const fixture = await setup(browser, {
    width: 1440,
    reducedMotion: "reduce",
    tone: "dark",
  });
  const { page } = fixture;
  try {
    await open(fixture, "?direction=index&tone=dark&category=all");
    await ready(page);
    await categoryButton(page, "ceremonial").focus();
    await page.keyboard.press("Enter");
    await checkCategory(page, "ceremonial");
    assert.notEqual(
      await categoryButton(page, "ceremonial").evaluate(
        (node) => getComputedStyle(node).outlineStyle,
      ),
      "none",
    );
    await page.locator('[data-filter-direction="tiles"]').focus();
    await page.keyboard.press("Space");
    await checkCategory(page, "ceremonial");
    await categoryButton(page, "barista").focus();
    await page.keyboard.press("Space");
    await checkCategory(page, "barista");
    assert.equal(
      await categoryButton(page, "barista").evaluate(
        (node) => getComputedStyle(node).transitionDuration,
      ),
      "0s",
    );
    await page.locator("[data-shop-clear-category]").focus();
    await page.keyboard.press("Enter");
    await checkCategory(page, "all");
    assert.equal(
      await categoryButton(page, "all").evaluate(
        (node) => node === document.activeElement,
      ),
      true,
      "Clear restores keyboard focus to All matcha",
    );
    await categoryButton(page, "barista").focus();
    await page.keyboard.press("Space");
    await page.locator('[data-filter-direction="facets"]').focus();
    await page.keyboard.press("Enter");
    const trigger = page.locator("[data-shop-category-trigger]");
    await trigger.focus();
    await page.keyboard.press("Enter");
    assert.equal(await trigger.getAttribute("aria-expanded"), "true");
    await categoryButton(page, "all").waitFor({ state: "visible" });
    await checkReducedPopup(await popupPanel(page));
    // Safari's default keyboard preference uses Option+Tab for all controls.
    await page.keyboard.press(engine === "webkit" ? "Alt+Tab" : "Tab");
    assert.equal(
      await categoryButton(page, "all").evaluate(
        (node) => node === document.activeElement,
      ),
      true,
      `Facet choices follow the trigger in native tab order (focused ${await page.evaluate(() => document.activeElement?.tagName)})`,
    );
    await page.keyboard.press("Space");
    await checkCategory(page, "all");
    assert.equal(
      await trigger.evaluate((node) => node === document.activeElement),
      true,
    );
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    assert.equal(
      await trigger.evaluate((node) => node === document.activeElement),
      true,
    );
    await checkFit(page);
    assert.deepEqual(fixture.errors, []);
    return {
      name,
      keyboard: "passed",
      reducedMotion: "passed",
      facetDismissal: "passed",
    };
  } finally {
    await fixture.close();
  }
}

async function recoveryCase(browser, name, canonical = false) {
  const locale = canonical ? "ja" : "en";
  const fixture = await setup(browser, { held: true, failed: true, locale });
  const { page, state } = fixture;
  try {
    if (canonical) await page.goto(`${baseURL}/shop?category=culinary`);
    else await open(fixture, "?direction=index&category=culinary");
    await page
      .getByText(translate(locale, "Opening the collection…"), { exact: false })
      .waitFor();
    assert.equal(await page.locator("[data-shop-product]").count(), 0);
    if (canonical)
      assert.equal(
        await page.locator("[data-shop-category-trigger]").isDisabled(),
        true,
      );
    for (const category of categories) {
      assert.equal(await categoryButton(page, category).isDisabled(), true);
      assert.equal(
        (
          await categoryButton(page, category)
            .locator("span[aria-label]")
            .textContent()
        ).trim(),
        "—",
      );
    }
    fixture.releaseCatalog();
    await page
      .getByRole("heading", {
        name: translate(locale, "The collection couldn’t be loaded."),
        exact: true,
      })
      .waitFor();
    state.failed = false;
    const failedReads = state.reads;
    state.products = catalogProducts.filter(
      (product) => product.id !== "isolated-culinary",
    );
    await page
      .getByRole("button", {
        name: new RegExp(translate(locale, "Try again"), "i"),
      })
      .click({ position: { x: 8, y: 8 } });
    await ready(page);
    await page.locator("[data-shop-category-empty]").waitFor();
    const ids = {
      ...expectedIds,
      all: expectedIds.all.filter((id) => id !== "isolated-culinary"),
      culinary: [],
    };
    await checkCategory(page, "culinary", ids, locale);
    assert.equal(
      await page.locator("[data-shop-category-empty] h2").innerText(),
      translate(locale, "No matcha in this category."),
    );
    await page
      .getByRole("button", {
        name: translate(locale, "Clear category"),
        exact: true,
      })
      .click();
    await checkCategory(page, "all", ids, locale);
    if (canonical)
      assert.equal(new URL(page.url()).searchParams.has("category"), false);
    assert.equal(await page.locator("[data-shop-category-empty]").count(), 0);
    assert.ok(state.reads > failedReads, "Retry makes a new catalog request");
    await checkFit(page);
    assert.deepEqual(fixture.errors, []);
    return {
      name,
      loading: "passed",
      retry: "passed",
      emptyCategory: "passed",
    };
  } finally {
    await fixture.close();
  }
}

async function canonicalCase(browser, name) {
  const fixture = await setup(browser, { width: 1440, tone: "dark" });
  const { page } = fixture;
  try {
    await open(
      fixture,
      "?direction=invalid&tone=invalid&category=invalid&future=wrong",
    );
    await ready(page);
    assert.equal(await page.locator('[data-shop-filters="facets"]').count(), 1);
    assert.equal(await study(page).getAttribute("data-tone"), "dark");
    assert.equal(await page.locator("[data-study-future]").isChecked(), false);
    await checkCategory(page, "all");
    await page.goto(`${baseURL}/shop?category=barista&category=invalid`);
    await ready(page);
    await checkCategory(page, "barista");
    await chooseCategory(page, "culinary");
    await waitForCategory(page, "culinary");
    assert.deepEqual(
      new URL(page.url()).searchParams.getAll("category"),
      ["culinary"],
      "Selecting a category normalizes duplicate query values",
    );
    await page.locator("[data-shop-clear-category]").click();
    await waitForCategory(page, "all");
    assert.deepEqual(
      new URL(page.url()).searchParams.getAll("category"),
      [],
      "Clear removes every category query value",
    );
    assert.equal(await page.locator("[data-canonical-shop]").count(), 1);
    assert.equal(
      await page
        .locator(
          "[data-shop-filter-study], [data-filter-direction], [data-study-future]",
        )
        .count(),
      0,
    );
    assert.equal(await page.locator('[data-shop-filters="facets"]').count(), 1);
    await checkFuture(page);
    await checkCategory(page, "all");
    await checkProductLinks(page);
    assert.equal(
      await page.locator('[data-sample-entry-point="collection"]').isVisible(),
      true,
    );
    await checkFit(page);
    await checkThemeCookie(fixture.context, "dark");
    await fixture.context.addCookies([
      { name: "atoma-locale", value: "ja", url: baseURL },
    ]);
    await page.goto(
      `${baseURL}/shop-filter-study?direction=tiles&category=barista`,
    );
    await ready(page);
    assert.equal(await page.locator("html").getAttribute("lang"), "ja");
    assert.equal(
      await page
        .locator('main span[aria-live="polite"]')
        .filter({ hasText: "01 of 04 matcha" })
        .getAttribute("lang"),
      "en",
      "English study count declares its language within the Japanese storefront",
    );
    assert.equal(
      await page.locator("[data-shop-filters]").getAttribute("lang"),
      "en",
    );
    for (const direction of directions) {
      await page.locator(`[data-filter-direction="${direction}"]`).click();
      await checkCategory(page, "barista");
      assert.equal(
        await categoryButton(page, "all").locator("span").first().textContent(),
        "All matcha",
        "Saved study treatments retain their independent English presentation",
      );
    }
    assert.deepEqual(fixture.errors, []);
    return { name, queryFallback: "passed", canonicalShop: "passed" };
  } finally {
    await fixture.close();
  }
}

async function popupPanel(page) {
  const id = await page
    .locator("[data-shop-category-trigger]")
    .getAttribute("aria-controls");
  assert.ok(id, "The trigger identifies its persistent popup");
  return page.locator(`[id="${id}"]`);
}

async function waitForCategory(page, category) {
  await page.waitForFunction(
    (value) =>
      document
        .querySelector(`[data-shop-category="${value}"]`)
        ?.getAttribute("aria-pressed") === "true",
    category,
  );
}

async function adoptionCase(browser, width, tone, name) {
  const fixture = await setup(browser, { width, tone });
  const { page, context } = fixture;
  try {
    await page.goto(
      `${baseURL}/shop?category=invalid&campaign=filter-check#collection-check`,
    );
    await ready(page);
    await page.evaluate(() => document.fonts.ready);
    const main = page.locator("[data-canonical-shop]");
    const trigger = page.locator("[data-shop-category-trigger]");
    assert.equal(await main.locator('[data-shop-filters="facets"]').count(), 1);
    assert.equal(
      await page
        .locator(
          "[data-shop-filter-study], [data-filter-direction], [data-study-future]",
        )
        .count(),
      0,
      "Canonical Shop contains no study controls",
    );
    await checkFuture(page);
    await checkCategory(page, "all");
    await page.screenshot({ path: `${evidence}/${name}-en-closed.png` });
    const originalCards = await rememberCards(page);
    const initialReads = fixture.state.reads;
    const initialHistoryLength = await page.evaluate(() => history.length);
    const assertURL = (category) => {
      const url = new URL(page.url());
      assert.equal(
        url.searchParams.get("category"),
        category === "all" ? null : category,
      );
      assert.equal(url.searchParams.get("campaign"), "filter-check");
      assert.equal(url.hash, "#collection-check");
    };
    for (const category of ["ceremonial", "culinary", "barista"]) {
      await chooseCategory(page, category);
      await waitForCategory(page, category);
      await checkCategory(page, category);
      await checkMountedCards(page, originalCards);
      assertURL(category);
    }
    await page.locator("[data-shop-clear-category]").click();
    await waitForCategory(page, "all");
    await checkCategory(page, "all");
    assertURL("all");
    assert.equal(
      await trigger.evaluate((node) => node === document.activeElement),
      true,
      "Clear returns focus before removing itself",
    );
    assert.equal(
      await page.evaluate(() => history.length),
      initialHistoryLength,
      "Category changes replace the current history entry",
    );

    const panel = await popupPanel(page);
    const collectionTop = () =>
      page
        .locator('[aria-label="Matcha collection"]')
        .evaluate((node) => node.getBoundingClientRect().top + scrollY);
    const beforeTop = await collectionTop();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await settlePopup(panel);
    assert.ok(
      Math.abs((await collectionTop()) - beforeTop) <= 1,
      "Canonical popup overlays the collection without moving it",
    );
    await checkFit(page);
    await checkTargets(page);
    await page.screenshot({ path: `${evidence}/${name}-en-open.png` });
    await page.keyboard.press(engine === "webkit" ? "Alt+Tab" : "Tab");
    assert.equal(
      await categoryButton(page, "all").evaluate(
        (node) => node === document.activeElement,
      ),
      true,
      "Canonical popup choices are reachable by native keyboard navigation",
    );
    await page.keyboard.press("Escape");
    await closedPopup(page, panel);
    assert.equal(
      await trigger.evaluate((node) => node === document.activeElement),
      true,
    );
    await chooseCategory(page, "barista");
    await waitForCategory(page, "barista");

    const selectedURL = page.url();
    await page.locator("[data-theme-switcher]:visible").first().click();
    const nextTone = tone === "light" ? "dark" : "light";
    await page.waitForFunction(
      (value) =>
        document
          .querySelector("[data-canonical-shop]")
          ?.getAttribute("data-tone") === value,
      nextTone,
    );
    await page
      .locator("[data-language-switcher]:visible")
      .first()
      .selectOption("ja");
    await page.waitForFunction(() => document.documentElement.lang === "ja");
    await checkCategory(page, "barista", expectedIds, "ja");
    await checkMountedCards(page, originalCards);
    assert.equal(
      page.url(),
      selectedURL,
      "Appearance and language changes preserve the selected category URL",
    );
    assert.equal(
      await page.locator("[data-shop-filters]").getAttribute("lang"),
      "ja",
    );
    assert.equal(
      await page.locator('main span[aria-live="polite"]').getAttribute("lang"),
      "ja",
    );
    assert.equal(
      await page.locator("[data-shop-filters] h2").innerText(),
      translate("ja", "Refine the collection"),
    );
    await checkFuture(page, "ja");
    await page.screenshot({
      path: `${evidence}/${name}-ja-${nextTone}-closed.png`,
    });
    assert.ok(
      (await categoryButton(page, "barista").evaluate((node) =>
        parseFloat(getComputedStyle(node).fontSize),
      )) >= 14,
      "Japanese category type retains the CJK increment",
    );
    await trigger.click();
    await settlePopup(panel);
    await checkFit(page);
    await page.screenshot({
      path: `${evidence}/${name}-ja-${nextTone}-open.png`,
    });
    await page.keyboard.press("Escape");
    await closedPopup(page, panel);
    assert.equal(
      fixture.state.reads,
      initialReads,
      "Filtering and appearance changes do not refetch the catalog",
    );
    await checkThemeCookie(context, nextTone);
    assert.equal(
      (await context.cookies(baseURL)).find(
        (cookie) => cookie.name === "atoma-locale",
      )?.value,
      "ja",
    );

    await page.reload();
    await ready(page);
    await waitForCategory(page, "barista");
    await checkCategory(page, "barista", expectedIds, "ja");
    assertURL("barista");
    assert.equal(await main.getAttribute("data-tone"), nextTone);
    assert.equal(await page.locator("html").getAttribute("lang"), "ja");
    const product = page
      .locator('[data-shop-product="isolated-barista"]')
      .getByRole("link");
    const href = await product.getAttribute("href");
    await product.click();
    await page.waitForURL((url) => url.pathname === href);
    await page.locator("[data-retail-product]").waitFor();
    await page.goBack();
    await ready(page);
    await waitForCategory(page, "barista");
    await checkCategory(page, "barista", expectedIds, "ja");
    assertURL("barista");
    assert.equal(await main.getAttribute("data-tone"), nextTone);
    await page.goForward();
    await page.locator("[data-retail-product]").waitFor();
    await page.goBack();
    await ready(page);
    await waitForCategory(page, "barista");
    await checkCategory(page, "barista", expectedIds, "ja");
    assertURL("barista");
    await checkFit(page);
    assert.deepEqual(fixture.errors, []);
    return {
      name,
      categories: "passed",
      mountedCards: originalCards.size,
      noRefetch: "passed",
      URLAndHistory: "passed",
      productReturn: "passed",
      Japanese: "passed",
      futurePlaceholders: "translated, noninteractive and nonfocusable",
      keyboardPopup: "passed",
    };
  } finally {
    await fixture.close();
  }
}

async function settlePopup(panel) {
  await panel.evaluate(async (node) => {
    await Promise.allSettled(
      node
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    );
  });
}

async function checkReducedPopup(panel) {
  const reduced = await panel.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      durations: style.transitionDuration
        .split(",")
        .map((value) => value.trim()),
      transform: style.transform,
    };
  });
  assert.ok(
    reduced.durations.every((duration) => duration === "0s"),
    "Reduced motion removes transition duration rather than merely waiting for it",
  );
  assert.equal(
    reduced.transform,
    "none",
    "Reduced motion removes popup translation",
  );
}

async function closedPopup(page, panel) {
  assert.equal(
    await page
      .locator("[data-shop-category-trigger]")
      .getAttribute("aria-expanded"),
    "false",
  );
  assert.equal(await panel.getAttribute("aria-hidden"), "true");
  assert.equal(
    await panel.evaluate((node) => node.inert),
    true,
    "Closing immediately removes choices from keyboard and pointer interaction",
  );
  await settlePopup(panel);
  assert.equal(
    await panel.evaluate((node) => getComputedStyle(node).opacity),
    "0",
  );
  assert.equal(
    await panel.evaluate((node) => getComputedStyle(node).pointerEvents),
    "none",
  );
}

async function popupMotion(page) {
  return page.evaluate(async () => {
    const trigger = document.querySelector("[data-shop-category-trigger]");
    const panel = document.getElementById(
      trigger.getAttribute("aria-controls"),
    );
    const collection = document.querySelector(
      '[aria-label="Matcha collection"]',
    );
    const frames = [],
      started = performance.now();
    const read = () => {
      const style = getComputedStyle(panel);
      return {
        opacity: Number(style.opacity),
        transform: style.transform,
        translate: style.translate,
        collectionTop: collection.getBoundingClientRect().top + scrollY,
      };
    };
    frames.push(read());
    trigger.click();
    await new Promise((resolve) => {
      const sample = () => {
        frames.push(read());
        if (performance.now() - started >= 400) resolve();
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    return frames;
  });
}

function checkPopupMotion(frames, opening) {
  const middle = frames.filter(
    (frame) => frame.opacity > 0.01 && frame.opacity < 0.99,
  );
  assert.ok(
    middle.length >= 2,
    `${opening ? "Opening" : "Closing"} renders intermediate opacity frames`,
  );
  assert.ok(
    new Set(middle.map((frame) => frame.transform + frame.translate)).size >= 2,
    "The popup visibly translates during its transition",
  );
  assert.equal(frames.at(-1).opacity, opening ? 1 : 0);
  assert.ok(
    Math.max(...frames.map((frame) => frame.collectionTop)) -
      Math.min(...frames.map((frame) => frame.collectionTop)) <=
      1,
    "Popup animation does not move the collection layout",
  );
  return middle.length;
}

async function popupCase(browser, width, tone, name) {
  const fixture = await setup(browser, { width, tone });
  const { page } = fixture;
  try {
    await open(fixture, `?tone=${tone}&future=1`);
    await ready(page);
    assert.equal(
      await page.locator('[data-shop-filters="facets"]').count(),
      1,
      "Filter bar is the study default",
    );
    const trigger = page.locator("[data-shop-category-trigger]");
    let panel = await popupPanel(page);
    const originalPanel = await panel.elementHandle();
    const originalCards = await rememberCards(page);
    const initialReads = fixture.state.reads;
    await trigger.evaluate((node) =>
      window.scrollTo({
        top: node.getBoundingClientRect().top + scrollY - 120,
        behavior: "instant",
      }),
    );
    await closedPopup(page, panel);
    const openingFrames = checkPopupMotion(await popupMotion(page), true);
    assert.equal(await panel.getAttribute("aria-hidden"), "false");
    assert.equal(await panel.evaluate((node) => node.inert), false);
    const geometry = await trigger.evaluate((node) => {
      const trigger = node.getBoundingClientRect(),
        svg = node.querySelector("svg")?.getBoundingClientRect();
      const panel = document
        .getElementById(node.getAttribute("aria-controls"))
        .getBoundingClientRect();
      return {
        svg: svg
          ? {
              width: svg.width,
              height: svg.height,
              centerError: Math.abs(
                svg.top + svg.height / 2 - trigger.top - trigger.height / 2,
              ),
            }
          : null,
        triggerWidth: trigger.width,
        panelWidth: panel.width,
        panelLeft: panel.left,
        triggerLeft: trigger.left,
      };
    });
    assert.ok(geometry.svg, "Chevron uses a fixed SVG instead of a font glyph");
    assert.equal(geometry.svg.width, 16);
    assert.equal(geometry.svg.height, 16);
    assert.ok(
      geometry.svg.centerError <= 1,
      "Chevron is vertically centered in the trigger",
    );
    assert.ok(Math.abs(geometry.panelLeft - geometry.triggerLeft) <= 1);
    assert.ok(
      Math.abs(
        geometry.panelWidth - (width <= 760 ? geometry.triggerWidth : 240),
      ) <= 1,
    );
    await checkCategory(page, "all");
    await checkFit(page);
    await checkTargets(page);
    await page.screenshot({ path: `${evidence}/${name}-open.png` });
    const closingFrames = checkPopupMotion(await popupMotion(page), false);
    await closedPopup(page, panel);
    assert.equal(
      await panel.evaluate(
        (node, previous) => node === previous,
        originalPanel,
      ),
      true,
      "The popup stays mounted through open/close",
    );

    // Reverse while each transition is still in flight, then verify final state.
    await trigger.evaluate(async (node) => {
      for (let index = 0; index < 3; index++) {
        node.click();
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
      }
    });
    await settlePopup(panel);
    assert.equal(await trigger.getAttribute("aria-expanded"), "true");
    assert.equal(
      await panel.evaluate((node) => getComputedStyle(node).opacity),
      "1",
    );
    assert.equal(await panel.evaluate((node) => node.inert), false);
    await page.locator("[data-shop-filters] h2").click();
    await closedPopup(page, panel);

    // Safari can retain outside focus after a pointer opens a native button.
    // Escape must still dismiss without repairing that focus in the harness.
    await page.locator("[data-study-tone]").focus();
    await trigger.click();
    await settlePopup(panel);
    const pointerOpenFocusOutside = await panel.evaluate(
      (node) => !node.parentElement.contains(document.activeElement),
    );
    const pointerOpenScroll = await page.evaluate(() => scrollY);
    await page.keyboard.press("Escape");
    await closedPopup(page, panel);
    assert.equal(
      await trigger.evaluate((node) => node === document.activeElement),
      true,
      "Escape after pointer opening returns focus to the trigger",
    );
    assert.ok(
      Math.abs((await page.evaluate(() => scrollY)) - pointerOpenScroll) <= 1,
      "Escape focus return preserves scroll position",
    );

    await trigger.focus();
    await page.keyboard.press("Enter");
    await settlePopup(panel);
    await categoryButton(page, "barista").focus();
    await page.keyboard.press("Escape");
    await closedPopup(page, panel);
    assert.equal(
      await trigger.evaluate((node) => node === document.activeElement),
      true,
      "Escape returns focus to the trigger",
    );
    await trigger.click();
    await settlePopup(panel);
    await categoryButton(page, "culinary").focus();
    await page.keyboard.press(engine === "webkit" ? "Alt+Tab" : "Tab");
    await closedPopup(page, panel);
    assert.equal(
      await panel.evaluate((node) => node.contains(document.activeElement)),
      false,
      "Tab leaves the popup naturally",
    );

    await chooseCategory(page, "barista");
    await closedPopup(page, panel);
    await checkCategory(page, "barista");
    for (const direction of ["index", "tiles", "facets"]) {
      await page.locator(`[data-filter-direction="${direction}"]`).click();
      await checkCategory(page, "barista");
      await checkMountedCards(page, originalCards);
    }
    panel = await popupPanel(page);
    await closedPopup(page, panel);
    await page.locator("[data-study-tone]").click();
    await checkCategory(page, "barista");
    await checkMountedCards(page, originalCards);
    await page.locator("[data-study-tone]").click();
    assert.equal(
      fixture.state.reads,
      initialReads,
      "Popup and direction changes do not refetch the catalog",
    );

    if (width <= 760) {
      await page.setViewportSize({ width, height: 420 });
      await trigger.evaluate((node) =>
        window.scrollTo({
          top: node.getBoundingClientRect().top + scrollY - 300,
          behavior: "instant",
        }),
      );
      await trigger.click();
      await settlePopup(panel);
      const above = await trigger.evaluate((node) => {
        const trigger = node.getBoundingClientRect(),
          panel = document
            .getElementById(node.getAttribute("aria-controls"))
            .getBoundingClientRect();
        return {
          top: panel.top,
          bottom: panel.bottom,
          triggerTop: trigger.top,
          viewport: innerHeight,
        };
      });
      assert.ok(
        above.bottom <= above.triggerTop,
        "Short mobile viewport places the popup above its trigger",
      );
      assert.ok(
        above.top >= 0 && above.bottom <= above.viewport,
        "Above popup stays within the mobile viewport",
      );
      await page.screenshot({ path: `${evidence}/${name}-above.png` });
      await page.keyboard.press("Escape");
      await closedPopup(page, panel);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await trigger.click();
    await settlePopup(panel);
    await checkReducedPopup(panel);
    assert.equal(
      await panel.evaluate((node) => getComputedStyle(node).opacity),
      "1",
    );
    assert.equal(
      await panel.evaluate(
        (node) => node.getAnimations({ subtree: true }).length,
      ),
      0,
      "Reduced motion has no active popup animation",
    );
    await trigger.click();
    await closedPopup(page, panel);
    await checkFit(page);
    assert.deepEqual(fixture.errors, []);
    return {
      name,
      openingFrames,
      closingFrames,
      geometry,
      dismissals: "passed",
      continuity: "passed",
      reducedMotion: "passed",
      abovePlacement: width <= 760 ? "passed" : "not needed",
      pointerOpenFocusOutside,
    };
  } finally {
    await fixture.close();
  }
}

await mkdir(evidence, { recursive: true });
const browser = await playwright[engine].launch(
  engine === "chromium"
    ? { channel: "chrome", headless: true }
    : { headless: true },
);
const results = [];
try {
  for (const width of [390, 1440])
    for (const tone of ["light", "dark"]) {
      const name = `${engine}-adoption-${width}-${tone}`;
      if (filter && !name.includes(filter)) continue;
      results.push(await adoptionCase(browser, width, tone, name));
      console.log(`PASS ${name}`);
    }
  for (const width of [390, 1440])
    for (const tone of ["light", "dark"]) {
      const name = `${engine}-popup-${width}-${tone}`;
      if (filter && !name.includes(filter)) continue;
      results.push(await popupCase(browser, width, tone, name));
      console.log(`PASS ${name}`);
    }
  for (const width of [320, 390, 1440]) {
    for (const tone of ["light", "dark"]) {
      const name = `${engine}-${width}-${tone}`;
      if (filter && !name.includes(filter)) continue;
      results.push(await responsiveCase(browser, width, tone, name));
      console.log(`PASS ${name}`);
    }
  }
  for (const [label, run] of [
    ["keyboard-reduced", keyboardCase],
    ["recovery-empty", recoveryCase],
    ["canonical-fallback", canonicalCase],
    [
      "canonical-recovery",
      (browser, name) => recoveryCase(browser, name, true),
    ],
  ]) {
    const name = `${engine}-${label}`;
    if (filter && !name.includes(filter)) continue;
    results.push(await run(browser, name));
    console.log(`PASS ${name}`);
  }
} finally {
  await browser.close();
  await writeFile(
    `${evidence}/${engine}${filter ? `-${filter.replace(/[^a-z0-9-]/gi, "_")}` : ""}-results.json`,
    `${JSON.stringify(results, null, 2)}\n`,
  );
}
assert.ok(results.length, "At least one scenario matched");
console.log(`${results.length} shop-filter scenarios passed.`);
