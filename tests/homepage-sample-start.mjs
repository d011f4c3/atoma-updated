/* Canonical sample-first context checks. Only local catalog/cart reads are
 * mocked; external requests and all writes are blocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.SAMPLE_START_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.SAMPLE_START_EVIDENCE ??
  ".local/sample-start-purchase-0168/browser";
const filter = process.env.SAMPLE_START_FILTER;
const edgesOnly = process.env.SAMPLE_START_EDGES === "1";
const products = SAMPLE_SET_CONTENTS.map((item, index) => ({
  id: item.key,
  handle: item.productHandle,
  title: item.name,
  productCode: item.productCode,
  description: "Isolated sample context fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: ["1 kg", "200 g"].map((title, format) => ({
    id: `v1_${String.fromCharCode(97 + index + format * 3).repeat(43)}`,
    title,
    available: true,
    priceMinor: format ? 700 : 2400,
    currency: "JPY",
    options: [{ name: "Format", value: title }],
    minimum: 1,
    maximum: 4,
    increment: 1,
  })),
}));
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
let activePage;
let activeName;

async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function setup(width, tone, slow = false) {
  const context = await browser.newContext({
    viewport: { width, height: width < 500 ? 844 : 900 },
    reducedMotion: "reduce",
    hasTouch: width < 500,
    isMobile: width < 500,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: "en", url: baseURL },
  ]);
  const errors = [];
  let releaseCatalog;
  let catalogPending = false;
  const catalogGate = new Promise((resolve) => {
    releaseCatalog = resolve;
  });
  if (!slow) releaseCatalog();
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      errors.push("Unexpected external request or write");
      return route.abort();
    }
    if (url.pathname === "/api/cart")
      return route.fulfill({ json: { kind: "empty", checkoutEnabled: false } });
    if (url.pathname === "/api/catalog") {
      catalogPending = slow;
      await catalogGate;
      catalogPending = false;
      return route.fulfill({
        json: { status: "ready", products, shopUrl: "https://example.invalid" },
      });
    }
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Unexpected API ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  if (process.env.SAMPLE_START_TRACE)
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) console.log("navigation", frame.url());
    });
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(error.message));
  activePage = page;
  return {
    context,
    page,
    errors,
    releaseCatalog,
    catalogPending: () => catalogPending,
  };
}

async function ready(page) {
  await eventually(
    async () =>
      (await page
        .locator("[data-embedded]")
        .getAttribute("data-entry-settled")) === "true",
    "The product experience is ready",
  );
  await page
    .locator('[data-homepage-product-choice="barista"]:not(:disabled)')
    .waitFor();
}

async function fit(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "The page fits the viewport",
  );
  for (const selector of [
    "[data-sample-start-navigation]",
    "[data-sample-start-entry]",
  ])
    for (const node of await page.locator(`${selector}:visible`).all())
      assert.equal(
        await node.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
        true,
        "The sample context has no clipped horizontal content",
      );
  assert.equal(
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest("[inert], [hidden]")),
    ),
    false,
    "Focus stays in the active context",
  );
}

async function chooseContext(page, name) {
  const button =
    name === "Sample Set"
      ? page.locator('button[data-sample-entry-point="selection"]')
      : page
          .locator("[data-sample-start-navigation]")
          .getByRole("button", { name, exact: true });
  await button.focus();
  await page.keyboard.press("Enter");
  await eventually(
    async () =>
      (await page.locator("[data-sample-start-entry]").isVisible()) ===
      (name === "Sample Set"),
    "The requested context opens",
  );
  if (name === "Sample Set") {
    assert.equal(await button.getAttribute("aria-pressed"), "true");
    await eventually(
      () =>
        page
          .locator("#sample-start-heading")
          .evaluate((node) => node === document.activeElement),
      "The left selector transfers focus into the requested set information",
    );
  } else
    await eventually(
      () =>
        page.evaluate(() => {
          const active = document.activeElement;
          return Boolean(
            active?.matches('h2[tabindex="-1"]') &&
            active.closest("[data-selection-controls]") &&
            !active.closest("[inert], [hidden]"),
          );
        }),
      "Returning to tea focuses its visible information heading",
    );
  await fit(page);
}

async function setFacts(page) {
  const entry = page.locator("[data-sample-start-entry]");
  await entry.waitFor({ state: "visible" });
  for (const text of [
    "Sample Set",
    "Three matcha · 20 g each",
    "All three included.",
    "60 g total",
  ])
    assert.ok((await entry.innerText()).includes(text));
  for (const item of SAMPLE_SET_CONTENTS) {
    assert.ok(
      (await entry.innerText()).includes(item.name.replace(/ Matcha$/, "")),
    );
    assert.ok((await entry.innerText()).includes(item.application));
  }
  assert.equal(await entry.locator("img").count(), 3);
  for (const image of await entry.locator("img").all())
    await eventually(
      () =>
        image.evaluate(
          (node) =>
            node.complete &&
            node.naturalWidth > 0 &&
            node.closest('[data-masked="true"]') !== null,
        ),
      "Each sample material loads with its prepared mask",
    );
  const cta = entry.locator('[data-sample-entry="start"]');
  assert.equal(await cta.getAttribute("href"), "/samples");
  assert.equal(await cta.isVisible(), true);
  const purchase = entry.locator("[data-sample-purchase]");
  assert.equal(
    await purchase.count(),
    1,
    "The set has its own purchase surface",
  );
  await purchase.locator("[data-sample-unavailable]").waitFor();
  assert.ok((await purchase.innerText()).includes("Ordering is not open yet."));
  const unavailable = purchase.getByRole("button", {
    name: "Currently unavailable",
    exact: true,
  });
  assert.equal(await unavailable.isDisabled(), true);
  assert.equal(
    await purchase.locator("[data-sample-order]").count(),
    0,
    "An unconfigured set cannot borrow a tea's purchase controls",
  );
  const stage = page.locator("[data-sample-imagery-stage]");
  assert.equal(await stage.isVisible(), true);
  const imagery = stage.locator("[data-sample-set-imagery]");
  assert.equal(await imagery.getAttribute("data-variant"), "set");
  assert.equal(await imagery.locator("[data-sample-set-material]").count(), 3);
  for (const image of await imagery.locator("img").all())
    await eventually(
      () =>
        image.evaluate(
          (node) =>
            node.complete &&
            node.naturalWidth > 0 &&
            node.closest('[data-masked="true"]') !== null,
        ),
      "All three left-stage powders use prepared images",
    );
  assert.equal(
    await page.locator("[data-tea-material]").isVisible(),
    false,
    "The selected tea stage is concealed while the set is active",
  );
  assert.doesNotMatch(
    await entry.innerText(),
    /¥|￥|JPY|\$\d/,
    "The entrance does not invent a set price",
  );
  await fit(page);
}

async function scenario(page, width, tone) {
  await page.goto(`${baseURL}/`);
  assert.equal(
    await page.locator('a[data-nav-action="about"]').getAttribute("href"),
    "/about",
    "About links directly to its page before Explore",
  );
  assert.equal(
    await page.locator('a[data-nav-action="samples"]').getAttribute("href"),
    "/samples",
    "Samples links directly to its page before Explore",
  );
  assert.equal(
    await page.locator("[data-sample-start-entry]").isVisible(),
    false,
    "Samples do not replace the opening before Explore",
  );
  await page
    .getByRole("button", {
      name: "Explore matcha from the silver bag",
      exact: true,
    })
    .click();
  await ready(page);
  const nav = page.locator("[data-sample-start-navigation]");
  const setChoice = page.locator('button[data-sample-entry-point="selection"]');
  assert.equal(
    await page.locator("[data-sample-start-entry]").isVisible(),
    true,
    "Fresh Explore defaults to the complete Sample Set",
  );
  assert.equal(
    await nav.isVisible(),
    true,
    "The selected tea remains available through the set return control",
  );
  assert.equal(
    await page.locator('[data-nav-action="samples"]').getAttribute("href"),
    "/samples",
  );
  assert.equal(await setChoice.getAttribute("aria-pressed"), "true");
  assert.equal(
    await setChoice.getAttribute("href"),
    null,
    "The left Sample Set control opens in place",
  );
  await setFacts(page);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: resolve(evidence, `${activeName}-first-entry.png`),
    animations: "disabled",
  });
  const material = await page.locator("[data-tea-material]").elementHandle();
  assert.equal(new URL(page.url()).pathname, "/");
  if (width < 500) await nav.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: resolve(evidence, `${activeName}-selected-set.png`),
    animations: "disabled",
  });

  const barista = page.locator('[data-homepage-product-choice="barista"]');
  await barista.click();
  await eventually(
    async () => !(await page.locator("[data-sample-start-entry]").isVisible()),
    "Choosing a tea opens its information",
  );
  assert.equal(await barista.getAttribute("aria-pressed"), "true");
  assert.equal(
    await page.locator("[data-sample-imagery-stage]").isVisible(),
    false,
  );
  assert.equal(
    await page.locator("[data-tea-material]").isVisible(),
    true,
    "Choosing a tea restores its material stage",
  );
  const shop = page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name: "Shop", exact: true });
  await shop.click();
  const order = page.locator("[data-shop-exploration]");
  const format = order.getByRole("combobox", { name: "Format", exact: true });
  const formatId = products.find((item) => item.id === "barista").variants[1]
    .id;
  await format.selectOption(formatId);
  await order
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  assert.equal(
    (await order.getByLabel("Quantity", { exact: true }).textContent()).trim(),
    "2",
  );
  await chooseContext(page, "Sample Set");
  await setFacts(page);
  await chooseContext(page, "Explore individual matcha");
  assert.equal(
    await page.locator("[data-sample-imagery-stage]").isVisible(),
    false,
  );
  assert.equal(await page.locator("[data-tea-material]").isVisible(), true);
  assert.equal(await barista.getAttribute("aria-pressed"), "true");
  assert.equal(await shop.getAttribute("aria-pressed"), "true");
  assert.equal(await format.inputValue(), formatId);
  assert.equal(
    (await order.getByLabel("Quantity", { exact: true }).textContent()).trim(),
    "2",
  );
  assert.equal(
    await page
      .locator("[data-tea-material]")
      .evaluate((node, original) => node === original, material),
    true,
    "Context changes preserve the mounted material renderer",
  );

  await chooseContext(page, "Sample Set");
  await barista.focus();
  if (process.env.SAMPLE_START_TRACE)
    console.log(
      "before tea Enter",
      await page.evaluate(() => ({
        focus: document.activeElement?.outerHTML.slice(0, 300),
        exploring: document
          .querySelector("main")
          ?.getAttribute("data-exploring"),
      })),
    );
  await page.keyboard.press("Enter");
  if (process.env.SAMPLE_START_TRACE)
    console.log(
      "after tea Enter",
      await page.evaluate(() => ({
        focus: document.activeElement?.outerHTML.slice(0, 300),
        exploring: document
          .querySelector("main")
          ?.getAttribute("data-exploring"),
      })),
    );
  await eventually(
    async () => !(await page.locator("[data-sample-start-entry]").isVisible()),
    "Choosing the selected tea restores its previous information tab",
  );
  assert.equal(await shop.getAttribute("aria-pressed"), "true");
  assert.equal(await format.inputValue(), formatId);
  assert.equal(
    (await order.getByLabel("Quantity", { exact: true }).textContent()).trim(),
    "2",
  );

  await chooseContext(page, "Sample Set");
  const cta = page.locator('[data-sample-entry="start"]');
  await cta.focus();
  await page.keyboard.press("Enter");
  await page.waitForURL((url) => url.pathname === "/samples");
  await page.locator("[data-samples-page]").waitFor();
  assert.equal(
    await page.locator("[data-samples-page]").getAttribute("data-tone"),
    tone,
  );
  await page.goBack();
  await ready(page);
  await setFacts(page);
  assert.equal(
    await setChoice.getAttribute("aria-pressed"),
    "true",
    "Back restores the sample context",
  );
  await chooseContext(page, "Explore individual matcha");
  assert.equal(await barista.getAttribute("aria-pressed"), "true");
  assert.equal(await shop.getAttribute("aria-pressed"), "true");
  assert.equal(await format.inputValue(), formatId);
  assert.equal(
    (await order.getByLabel("Quantity", { exact: true }).textContent()).trim(),
    "2",
    "Back restores the selected order quantity",
  );

  const explicit = products.find((item) => item.id === "culinary");
  await page.goto(`${baseURL}/?matcha=${explicit.handle}`);
  await ready(page);
  await eventually(
    async () => (await setChoice.getAttribute("aria-pressed")) === "false",
    "An explicit product link opens its selected tea context",
  );
  assert.equal(
    await page
      .locator('[data-homepage-product-choice="culinary"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page.locator("[data-sample-start-entry]").isVisible(),
    false,
  );
  await fit(page);
}

async function mountedProductRoute(page) {
  const culinary = products.find((item) => item.id === "culinary");
  const ceremonial = products.find((item) => item.id === "ceremonial");
  await page.goto(`${baseURL}/?matcha=${culinary.handle}`);
  await ready(page);
  await chooseContext(page, "Sample Set");
  const material = await page.locator("[data-tea-material]").elementHandle();
  await page.locator('header a[data-nav-action="origins"]').click();
  const origins = page.locator("[data-origins-dialog][open]");
  await origins.waitFor();
  await origins
    .getByRole("searchbox", { name: "Find a place", exact: true })
    .fill("Wazuka");
  await origins.locator('[data-origin-place="wazuka"]').click();
  await origins.locator(`a[href="/?matcha=${ceremonial.handle}"]`).click();
  await page.waitForURL(
    (url) =>
      url.pathname === "/" &&
      url.searchParams.get("matcha") === ceremonial.handle,
  );
  await ready(page);
  await eventually(
    async () => !(await page.locator("[data-sample-start-entry]").isVisible()),
    "A visible Origins product link closes the set context",
  );
  assert.equal(
    await page
      .locator('[data-homepage-product-choice="ceremonial"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page
      .locator("[data-tea-material]")
      .evaluate((node, original) => node === original, material),
    true,
    "The product link updates the mounted homepage renderer",
  );
  await chooseContext(page, "Sample Set");
  await setFacts(page);
  await chooseContext(page, "Explore individual matcha");
  assert.equal(
    await page
      .locator('[data-homepage-product-choice="ceremonial"]')
      .getAttribute("aria-pressed"),
    "true",
    "Reopening and leaving the set retains the explicit tea",
  );
}

async function loadingFocus(fixture) {
  const { page } = fixture;
  await page.goto(`${baseURL}/`);
  await page
    .getByRole("button", {
      name: "Explore matcha from the silver bag",
      exact: true,
    })
    .click();
  const choice = page.locator(
    'button[data-sample-entry-point="selection"]:not(:disabled)',
  );
  await choice.waitFor();
  assert.equal(
    fixture.catalogPending(),
    true,
    "The isolated catalog response is still pending",
  );
  await eventually(
    () =>
      page
        .locator("#sample-start-heading")
        .evaluate((node) => node === document.activeElement),
    "The default set heading receives focus during catalog loading",
  );
  assert.equal(
    fixture.catalogPending(),
    true,
    "Opening samples does not depend on finishing the catalog",
  );
  assert.equal(
    await page
      .locator("#sample-start-heading")
      .evaluate((node) => node === document.activeElement),
    true,
    "Loading state focuses the visible set heading",
  );
  fixture.releaseCatalog();
  await ready(page);
  await setFacts(page);
  await fit(page);
}

try {
  if (edgesOnly) {
    for (const name of ["mounted-product-route", "slow-catalog-focus"]) {
      activeName = name;
      const fixture = await setup(1440, "light", name === "slow-catalog-focus");
      try {
        if (name === "mounted-product-route")
          await mountedProductRoute(fixture.page);
        else await loadingFocus(fixture);
        assert.deepEqual(
          fixture.errors,
          [],
          "No page errors, external requests or writes",
        );
        console.log(`${name}: passed`);
      } finally {
        fixture.releaseCatalog();
        await fixture.context.close();
      }
    }
  } else
    for (const [width, tone] of [
      [1440, "light"],
      [390, "dark"],
    ]) {
      activeName = `${width}-${tone}`;
      if (filter && !activeName.includes(filter)) continue;
      const fixture = await setup(width, tone);
      await scenario(fixture.page, width, tone);
      assert.deepEqual(
        fixture.errors,
        [],
        "No page errors, external requests or writes",
      );
      await fixture.context.close();
      console.log(`${activeName}: passed`);
    }
} catch (error) {
  if (activePage && !activePage.isClosed())
    await activePage.screenshot({
      path: resolve(evidence, `${activeName}-failure.png`),
      animations: "disabled",
    });
  throw error;
} finally {
  await browser.close();
}
