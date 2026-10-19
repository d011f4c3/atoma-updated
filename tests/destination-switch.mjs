/* Country-switch regression against isolated local fixtures. Every API call is
 * intercepted; no currency, cart mutation or request reaches Shopify. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { money } from "../src/lib/product-selection.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.DESTINATION_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.DESTINATION_EVIDENCE ?? ".local/destination-switch-0171/browser";
const filter = process.env.DESTINATION_FILTER;
const tea = SAMPLE_SET_CONTENTS.find((item) => item.key === "barista");
const initial = { countryCode: "US", currency: "USD" };
const singapore = { countryCode: "SG", currency: "SGD" };
const fallback = { countryCode: "SG", currency: "JPY" };
const planName = "Every 4 weeks";

function productsFor(destination) {
  const countryIndex =
    destination.currency === "JPY"
      ? 2
      : destination.countryCode === "SG"
        ? 1
        : 0;
  return SAMPLE_SET_CONTENTS.map((item, index) => ({
    id: item.key,
    handle: item.productHandle,
    title: item.name,
    description: "Isolated destination-switch fixture.",
    productCode: item.productCode,
    imageUrl: null,
    imageAlt: "",
    productUrl: null,
    isFixture: true,
    variants: ["1 kg", "200 g"].map((title, format) => ({
      id: `v1_${String.fromCharCode(97 + countryIndex * 6 + index * 2 + format).repeat(43)}`,
      selectionId: `${item.key}-${format}`,
      title,
      available: true,
      priceMinor: format
        ? [1100, 1700, 2300][countryIndex]
        : [4300, 6900, 11000][countryIndex],
      currency: destination.currency,
      options: [{ name: "Format", value: title }],
      minimum: 1,
      maximum: 4,
      increment: 1,
      sellingPlans: [
        {
          id: `v1_${String.fromCharCode(65 + countryIndex * 6 + index * 2 + format).repeat(43)}`,
          selectionId: `${item.key}-${format}-four-weeks`,
          name: planName,
          description: null,
          deliveryInterval: "week",
          deliveryIntervalCount: 4,
          priceMinor: format
            ? [900, 1400, 1900][countryIndex]
            : [4000, 6400, 10000][countryIndex],
          currency: destination.currency,
          available: true,
        },
      ],
    })),
  }));
}

function selectedFor(destination) {
  return productsFor(destination).find((item) => item.id === "barista")
    .variants[1];
}

function cartFor(destination) {
  const variant = selectedFor(destination);
  const price = variant.sellingPlans[0].priceMinor;
  return {
    totalQuantity: 2,
    subtotalLabel: money(price * 2, destination.currency),
    totalLabel: money(price * 2, destination.currency),
    lines: [
      {
        lineKey: `isolated-${destination.countryCode}-${destination.currency}`,
        productHandle: tea.productHandle,
        productTitle: tea.name,
        variantTitle: "200 g",
        options: variant.options,
        quantity: 2,
        unitPriceLabel: money(price, destination.currency),
        lineTotalLabel: money(price * 2, destination.currency),
        purchaseState: "purchasable",
        quantityRule: { minimum: 1, maximum: 4, increment: 1 },
        canUpdateQuantity: true,
        canRemove: true,
        image: null,
        sellingPlan: {
          name: planName,
          description: null,
          deliveryLabel: planName,
          priceLabel: money(price, destination.currency),
        },
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
let activePage;
let activeName;

async function setup(width, tone, { initialCartFailure = false } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: width < 500 ? 844 : 900 },
    hasTouch: width < 500,
    isMobile: width < 500,
    reducedMotion: "reduce",
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: "en", url: baseURL },
  ]);
  const actions = [],
    errors = [];
  let confirmed = initial;
  let release = null;
  let reads = 0;
  let destinationReads = 0;
  let failCartReads = initialCartFailure;
  await context.route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    const respond = (json, status = 200) => route.fulfill({ json, status });
    if (url.origin !== origin) {
      errors.push("External traffic blocked");
      return route.abort();
    }
    if (url.pathname === "/api/destination" && request.method() === "GET") {
      destinationReads++;
      return respond({
        kind: "ready",
        preference: { countryCode: confirmed.countryCode, source: "manual" },
        destination: confirmed,
        countries: ["US", "SG"],
        reviewRequired: false,
      });
    }
    if (url.pathname === "/api/catalog" && request.method() === "GET")
      return respond({
        status: "ready",
        products: productsFor(confirmed),
        destination: confirmed,
        shopUrl: "https://example.invalid",
      });
    if (url.pathname === "/api/cart" && request.method() === "GET") {
      reads++;
      if (failCartReads)
        return respond({ kind: "unavailable", checkoutEnabled: false }, 503);
      return respond({
        kind: "ready",
        cart: cartFor(confirmed),
        checkoutEnabled: false,
        destination: confirmed,
        destinationReviewRequired: false,
      });
    }
    if (url.pathname === "/api/cart" && request.method() === "POST") {
      const action = request.postDataJSON();
      actions.push(action);
      if (
        action.action !== "destination" ||
        !["US", "SG"].includes(action.countryCode) ||
        Object.keys(action).length !== 2
      ) {
        errors.push("Unexpected mutation payload");
        return route.abort();
      }
      const decision = await new Promise((done) => {
        release = done;
      });
      release = null;
      if (decision.kind === "success") {
        confirmed = decision.destination;
        return respond({
          kind: "success",
          cart: cartFor(confirmed),
          checkoutEnabled: false,
          destination: confirmed,
          destinationReviewRequired: false,
        });
      }
      if (decision.kind === "ambiguous") {
        confirmed = decision.destination;
        return respond({
          kind: "ambiguous",
          reviewRequired: true,
          destinationReviewRequired: true,
          checkoutEnabled: false,
        });
      }
      return respond(
        {
          kind: "rejected",
          reviewRequired: true,
          destinationReviewRequired: true,
          checkoutEnabled: false,
          destination: confirmed,
        },
        409,
      );
    }
    if (
      url.pathname.startsWith("/api/") ||
      !["GET", "HEAD"].includes(request.method())
    ) {
      errors.push("Unexpected API or write blocked");
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(error.message));
  activePage = page;
  return {
    context,
    page,
    actions,
    errors,
    pending: () => Boolean(release),
    complete: (decision) => release(decision),
    reads: () => reads,
    destinationReads: () => destinationReads,
    recoverCartReads: () => {
      failCartReads = false;
    },
  };
}

function selector(page) {
  return page.locator("select[data-destination-selector]:visible").first();
}

async function fit(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "The country control creates no page overflow",
  );
  for (const control of await page
    .locator("[data-destination-control]:visible")
    .all())
    assert.equal(
      await control.evaluate(
        (node) => node.scrollWidth <= node.clientWidth + 1,
      ),
      true,
      "Country and currency fit the compact control",
    );
}

async function checkConfirmed(page, destination, originalMaterial) {
  const order = page.locator("[data-shop-exploration]");
  const variant = selectedFor(destination);
  await eventually(
    async () =>
      (await order.getByLabel("Format", { exact: true }).inputValue()) ===
      variant.id,
    "The fresh catalog preserves the format by its stable selection identity",
  );
  await eventually(
    async () =>
      (await order.locator("[data-shop-total]").innerText()) ===
      money(variant.sellingPlans[0].priceMinor * 2, destination.currency),
    "The total uses the confirmed server price and currency",
  );
  assert.equal(await selector(page).inputValue(), destination.countryCode);
  assert.equal(
    await page
      .locator('[data-homepage-product-choice="barista"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    (await order.getByLabel("Quantity", { exact: true }).innerText()).trim(),
    "2",
  );
  assert.equal(
    await order
      .getByRole("radio", { name: `Subscribe · ${planName}`, exact: true })
      .isChecked(),
    true,
  );
  assert.equal(
    await page
      .locator("[data-tea-material]")
      .evaluate((node, original) => node === original, originalMaterial),
    true,
    "Destination changes keep the material renderer mounted",
  );
  for (const currency of await page
    .locator("[data-destination-currency]:visible")
    .all())
    assert.equal((await currency.innerText()).trim(), destination.currency);
  await fit(page);
}

async function beginSwitch(fixture, country, previous) {
  const { page } = fixture;
  const control = selector(page);
  const count = fixture.actions.length;
  await control.focus();
  await control.selectOption(country);
  await eventually(fixture.pending, "The country request starts once");
  assert.equal(fixture.actions.length, count + 1);
  assert.deepEqual(fixture.actions.at(-1), {
    action: "destination",
    countryCode: country,
  });
  assert.equal(
    await control.inputValue(),
    previous.countryCode,
    "The country label waits for confirmation",
  );
  const order = page.locator("[data-shop-exploration]");
  for (const locked of [
    control,
    order.getByLabel("Format", { exact: true }),
    order.getByRole("button", { name: "Increase quantity", exact: true }),
    order.getByRole("radio", { name: `Subscribe · ${planName}`, exact: true }),
    page.locator('[data-homepage-product-choice="culinary"]'),
  ])
    assert.equal(
      await locked.isDisabled(),
      true,
      "Selection and commerce controls share the pending lock",
    );
  const updating = order.getByRole("button", {
    name: "Updating prices…",
    exact: true,
  });
  await updating.waitFor();
  assert.equal(
    await updating.isDisabled(),
    true,
    "Price updates remain non-purchasable",
  );
  assert.equal(
    await order.getByText("Currently unavailable", { exact: true }).count(),
    0,
    "A pending country change is not presented as unavailable stock",
  );
  const expected = money(
    selectedFor(previous).sellingPlans[0].priceMinor * 2,
    previous.currency,
  );
  assert.ok(
    [expected, "—"].includes(
      await order.locator("[data-shop-total]").innerText(),
    ),
    "Pending state never displays an unconfirmed country price",
  );
  for (const currency of await page
    .locator("[data-destination-currency]:visible")
    .all())
    assert.equal((await currency.innerText()).trim(), previous.currency);
}

async function reviewAndReload(fixture, previous, expected, originalMaterial) {
  const { page } = fixture;
  const dialog = page.locator("dialog[open]");
  await dialog.waitFor();
  const reload = dialog.getByRole("button", {
    name: "Reload selection",
    exact: false,
  });
  await reload.waitFor();
  assert.equal(
    await selector(page).inputValue(),
    previous.countryCode,
    "A failed or uncertain mutation retains the last confirmed country",
  );
  const count = fixture.actions.length;
  await page.waitForTimeout(250);
  assert.equal(
    fixture.actions.length,
    count,
    "An uncertain country mutation is not replayed automatically",
  );
  const reads = fixture.reads();
  await reload.focus();
  await page.keyboard.press("Enter");
  await eventually(
    () => fixture.reads() > reads,
    "Recovery performs a fresh cart read",
  );
  await eventually(
    async () => !(await reload.isVisible()),
    "The explicit read resolves the mutation review",
  );
  assert.equal(
    (
      await dialog
        .getByLabel(`${tea.name} quantity`, { exact: true })
        .innerText()
    ).trim(),
    "2",
    "Changing country preserves existing cart quantities",
  );
  await dialog.getByRole("button", { name: "Close cart", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await checkConfirmed(page, expected, originalMaterial);
  assert.equal(
    fixture.actions.length,
    count,
    "Reloading never repeats the mutation",
  );
}

async function scenario(fixture, width, tone) {
  const { page } = fixture;
  await page.goto(`${baseURL}/?matcha=${tea.productHandle}`);
  await page
    .locator('[data-homepage-product-choice="barista"]:not(:disabled)')
    .waitFor();
  await eventually(
    async () =>
      !(await selector(page).isDisabled()) &&
      (await selector(page).inputValue()) === "US",
    "Initial country reconciliation completes",
  );
  await page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name: "Shop", exact: true })
    .click();
  const order = page.locator("[data-shop-exploration]");
  await order
    .getByLabel("Format", { exact: true })
    .selectOption(selectedFor(initial).id);
  await order
    .getByRole("radio", { name: `Subscribe · ${planName}`, exact: true })
    .check();
  await order
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  const material = await page.locator("[data-tea-material]").elementHandle();
  await checkConfirmed(page, initial, material);

  await beginSwitch(fixture, "SG", initial);
  fixture.complete({ kind: "success", destination: singapore });
  await checkConfirmed(page, singapore, material);
  await eventually(
    () => selector(page).evaluate((node) => node === document.activeElement),
    "Confirmation keeps native select focus",
  );
  await selector(page).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: resolve(evidence, `${activeName}-confirmed-sgd.png`),
    animations: "disabled",
  });

  await beginSwitch(fixture, "US", singapore);
  fixture.complete({ kind: "rejected" });
  await reviewAndReload(fixture, singapore, singapore, material);
  await beginSwitch(fixture, "US", singapore);
  fixture.complete({ kind: "ambiguous", destination: initial });
  await reviewAndReload(fixture, singapore, initial, material);

  await beginSwitch(fixture, "SG", initial);
  fixture.complete({ kind: "success", destination: fallback });
  await checkConfirmed(page, fallback, material);
  assert.equal(await page.locator("html").getAttribute("lang"), "en");
  assert.equal(
    (await fixture.context.cookies()).find(
      (cookie) => cookie.name === "atoma-theme",
    )?.value,
    tone,
  );
  await order.getByLabel("Format", { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: resolve(evidence, `${activeName}-truthful-jpy.png`),
    animations: "disabled",
  });
  assert.equal(
    fixture.actions.length,
    4,
    "Only the four deliberate country changes are sent",
  );
  await fit(page);
}

async function initialRecovery(fixture) {
  const { page } = fixture;
  await page.goto(`${baseURL}/shop`);
  const control = page.locator("[data-destination-control]:visible").first();
  const country = control.locator("select[data-destination-selector]");
  const retry = control.getByRole("button", { name: "Try again", exact: true });
  await retry.waitFor();
  assert.equal(await country.isDisabled(), true);
  assert.equal(await country.inputValue(), "");
  assert.equal(
    (await control.locator("[data-destination-currency]").innerText()).trim(),
    "—",
    "A failed initial read does not invent a confirmed currency",
  );
  assert.equal(await page.locator("dialog[open]").count(), 0);
  await fit(page);
  await page.screenshot({
    path: resolve(evidence, `${activeName}-retry.png`),
    animations: "disabled",
  });
  const previousReads = fixture.reads();
  const previousDestinationReads = fixture.destinationReads();
  fixture.recoverCartReads();
  await retry.focus();
  await page.keyboard.press("Enter");
  await eventually(
    async () =>
      !(await country.isDisabled()) &&
      (await country.inputValue()) === initial.countryCode &&
      (
        await control.locator("[data-destination-currency]").innerText()
      ).trim() === initial.currency,
    "Try again restores the confirmed country and currency through fresh reads",
  );
  await eventually(
    () => country.evaluate((node) => node === document.activeElement),
    "Successful read-only recovery restores focus to the native selector",
  );
  assert.ok(fixture.reads() > previousReads);
  assert.ok(fixture.destinationReads() > previousDestinationReads);
  assert.equal(await retry.count(), 0);
  assert.equal(await page.locator("dialog[open]").count(), 0);
  assert.deepEqual(fixture.actions, [], "Initial-load recovery sends no POST");
  await fit(page);
  await page.screenshot({
    path: resolve(evidence, `${activeName}-recovered.png`),
    animations: "disabled",
  });
}

async function retailPending(fixture) {
  const { page } = fixture;
  await page.goto(`${baseURL}/shop/${tea.productHandle}?format=1kg`);
  const purchase = page.getByRole("region", {
    name: `Purchase ${tea.name}`,
    exact: true,
  });
  await purchase
    .getByRole("button", { name: "Add to cart", exact: true })
    .waitFor();
  await eventually(
    async () => !(await selector(page).isDisabled()),
    "Retail destination is ready",
  );
  await selector(page).selectOption("SG");
  await eventually(
    fixture.pending,
    "Retail switch is held before confirmation",
  );
  const updating = purchase.getByRole("button", {
    name: "Updating prices…",
    exact: true,
  });
  await updating.waitFor();
  assert.equal(await updating.isDisabled(), true);
  assert.ok(
    (await purchase.getByText("Updating prices…", { exact: true }).count()) >=
      2,
    "Retail price and availability use neutral updating text",
  );
  assert.equal(
    await purchase.getByText("Currently unavailable", { exact: true }).count(),
    0,
  );
  assert.equal(
    await purchase.getByText("No published format", { exact: true }).count(),
    0,
  );
  await page.screenshot({
    path: resolve(evidence, `${activeName}-pending.png`),
    animations: "disabled",
  });
  fixture.complete({ kind: "success", destination: singapore });
  await eventually(
    async () =>
      !(await purchase
        .getByRole("button", { name: "Add to cart", exact: true })
        .isDisabled()),
    "Retail buying unlocks after confirmed fresh pricing",
  );
  assert.equal(
    await purchase
      .getByRole("button", { name: "1 kg", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(await selector(page).inputValue(), "SG");
  assert.equal(fixture.actions.length, 1);
}

try {
  for (const [width, tone] of [
    [1440, "light"],
    [320, "dark"],
  ]) {
    activeName = `${width}-${tone}`;
    if (filter && !activeName.includes(filter)) continue;
    const fixture = await setup(width, tone);
    await scenario(fixture, width, tone);
    assert.deepEqual(
      fixture.errors,
      [],
      "No page errors, external requests or unmocked writes",
    );
    await fixture.context.close();
    console.log(
      `${activeName}: confirmation, pending lock, stable selection/plan, rejection, ambiguous recovery and truthful JPY passed`,
    );
  }
  activeName = "1440-light-retail-pending";
  if (!filter || activeName.includes(filter)) {
    const fixture = await setup(1440, "light");
    await retailPending(fixture);
    assert.deepEqual(fixture.errors, []);
    await fixture.context.close();
    console.log(
      `${activeName}: neutral price/availability copy, purchase lock and confirmed recovery passed`,
    );
  }
  activeName = "1440-light-initial-recovery";
  if (!filter || activeName.includes(filter)) {
    const fixture = await setup(1440, "light", { initialCartFailure: true });
    await initialRecovery(fixture);
    assert.deepEqual(
      fixture.errors,
      [],
      "Initial recovery causes no page errors, external requests or unmocked writes",
    );
    await fixture.context.close();
    console.log(
      `${activeName}: disabled initial state, visible retry, read-only recovery and selector focus passed`,
    );
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
