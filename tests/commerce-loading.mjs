/* Shopify loading feedback with deliberately delayed, isolated responses.
 * All commerce is mocked; external requests and unrecognised writes are blocked. */
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";
import { money } from "../src/lib/product-selection.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL =
  process.env.COMMERCE_LOADING_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const browser = await chromium.launch({ channel: "chrome", headless: true });

function catalogFor(destination) {
  const singapore = destination.countryCode === "SG";
  const common = {
    description: "Isolated loading feedback fixture.",
    imageUrl: null,
    imageAlt: "",
    productUrl: null,
    isFixture: true,
  };
  const sample = {
    ...common,
    id: "sample-set",
    handle: SAMPLE_SET_OFFER.productHandle,
    title: "Sample Set",
    variants: [
      {
        id: `v1_${(singapore ? "t" : "s").repeat(43)}`,
        selectionId: "sample-set-20g",
        title: "3 × 20 g",
        options: SAMPLE_SET_OFFER.variants[0].options,
        available: true,
        priceMinor: singapore ? 3800 : 2900,
        currency: destination.currency,
        minimum: 1,
        maximum: 4,
        increment: 1,
      },
    ],
  };
  return [
    sample,
    ...SAMPLE_SET_CONTENTS.map((item, index) => ({
      ...common,
      id: item.key,
      handle: item.productHandle,
      title: item.name,
      productCode: item.productCode,
      variants: [
        {
          ...sample.variants[0],
          id: `v1_${String.fromCharCode(97 + index + (singapore ? 3 : 0)).repeat(43)}`,
          selectionId: `${item.key}-1kg`,
          title: "1 kg",
          options: [{ name: "Format", value: "1 kg" }],
          priceMinor: singapore ? 8500 : 6500,
        },
      ],
    })),
  ];
}

async function eventually(check, message) {
  const until = Date.now() + 15000;
  while (Date.now() < until) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 30));
  }
  assert.fail(message);
}

async function setup(width) {
  const context = await browser.newContext({
    viewport: { width, height: width < 760 ? 844 : 900 },
    reducedMotion: width < 760 ? "reduce" : "no-preference",
    isMobile: width < 760,
    hasTouch: width < 760,
  });
  await context.addCookies([
    {
      name: "atoma-theme",
      value: width < 760 ? "dark" : "light",
      url: baseURL,
    },
    { name: "atoma-locale", value: "en", url: baseURL },
  ]);
  let destination = { countryCode: "US", currency: "USD" };
  let cart = null;
  let failReads = false;
  let failCatalog = false;
  const gates = new Map();
  const errors = [];
  const writes = [];
  const reads = { cart: 0, catalog: 0, destination: 0 };
  function hold(name) {
    assert.equal(gates.has(name), false);
    let release;
    const promise = new Promise((done) => (release = done));
    gates.set(name, { promise, release });
  }
  function release(name) {
    assert.ok(gates.has(name));
    gates.get(name).release();
    gates.delete(name);
  }
  async function wait(name) {
    await gates.get(name)?.promise;
  }
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (url.origin !== origin) {
      errors.push("External traffic blocked");
      return route.abort();
    }
    const reply = (json, status = 200) => route.fulfill({ json, status });
    if (url.pathname === "/api/destination" && method === "GET") {
      reads.destination++;
      await wait("destination");
      return reply({
        kind: "ready",
        preference: { countryCode: destination.countryCode, source: "manual" },
        destination,
        countries: ["US", "SG"],
        reviewRequired: false,
      });
    }
    if (url.pathname === "/api/catalog" && method === "GET") {
      reads.catalog++;
      const current = destination;
      await wait("catalog");
      if (failCatalog)
        return reply(
          {
            status: "unavailable",
            products: [],
            shopUrl: "https://example.invalid",
          },
          503,
        );
      return reply({
        status: "ready",
        destination: current,
        products: catalogFor(current),
        shopUrl: "https://example.invalid",
      });
    }
    if (url.pathname === "/api/cart" && method === "GET") {
      reads.cart++;
      await wait("cart");
      return failReads
        ? reply({ kind: "unavailable", checkoutEnabled: false }, 503)
        : reply({
            kind: cart ? "ready" : "empty",
            cart,
            destination,
            destinationReviewRequired: false,
            checkoutEnabled: false,
          });
    }
    if (url.pathname === "/api/cart" && method === "POST") {
      const action = request.postDataJSON();
      writes.push(action);
      if (action.action === "destination" && action.countryCode === "SG") {
        assert.deepEqual(Object.keys(action).sort(), ["action", "countryCode"]);
        await wait("change");
        destination = { countryCode: "SG", currency: "SGD" };
        return reply({
          kind: "success",
          cart,
          destination,
          destinationReviewRequired: false,
          checkoutEnabled: false,
        });
      }
      const product = catalogFor(destination)[0];
      const variant = product.variants[0];
      if (action.action === "add") {
        assert.deepEqual(action, {
          action: "add",
          productHandle: product.handle,
          variantKey: variant.id,
          quantity: 2,
        });
        await wait("add");
        const total = money(variant.priceMinor * 2, variant.currency);
        cart = {
          totalQuantity: 2,
          subtotalLabel: total,
          totalLabel: total,
          lines: [
            {
              lineKey: `v1_${"x".repeat(43)}`,
              productHandle: product.handle,
              productTitle: product.title,
              variantTitle: variant.title,
              options: variant.options,
              quantity: 2,
              unitPriceLabel: money(variant.priceMinor, variant.currency),
              lineTotalLabel: total,
              purchaseState: "purchasable",
              quantityRule: { minimum: 1, maximum: 4, increment: 1 },
              canUpdateQuantity: true,
              canRemove: true,
              image: null,
            },
          ],
        };
        return reply({
          kind: "success",
          cart,
          destination,
          checkoutEnabled: false,
        });
      }
    }
    if (url.pathname.startsWith("/api/") || !["GET", "HEAD"].includes(method)) {
      errors.push(`Unrecognised request blocked: ${method} ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(error.message));
  return {
    page,
    reads,
    writes,
    errors,
    hold,
    release,
    failReads: (value) => (failReads = value),
    failCatalog: (value) => (failCatalog = value),
    close: async () => {
      for (const name of gates.keys()) release(name);
      await context.close();
    },
  };
}

function notice(page) {
  return page.locator("[data-commerce-loading]:visible");
}

async function checkNotice(page, label) {
  await notice(page).waitFor();
  assert.equal(
    await notice(page).count(),
    1,
    "Concurrent reads share one notice",
  );
  assert.equal(await notice(page).getAttribute("role"), "status");
  assert.equal(await notice(page).getAttribute("aria-valuenow"), null);
  assert.equal((await notice(page).innerText()).trim(), label);
  assert.equal(await notice(page).locator("[aria-valuenow]").count(), 0);
  assert.equal((await notice(page).innerText()).includes("%"), false);
  assert.equal(
    await notice(page).evaluate((node) => getComputedStyle(node).pointerEvents),
    "none",
    "Loading feedback does not intercept exploration or keyboard focus",
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
  );
}

async function pendingFlow(fixture, path, width) {
  const { page, hold, release } = fixture;
  hold("cart");
  hold("catalog");
  await page.goto(`${baseURL}${path}`);
  await checkNotice(page, "Loading prices and availability…");
  const country = page
    .locator("select[data-destination-selector]:visible")
    .first();
  assert.equal(await country.isDisabled(), true);
  hold("destination");
  release("cart");
  await eventually(
    () => fixture.reads.destination > 0,
    "Destination read begins",
  );
  await checkNotice(page, "Loading prices and availability…");
  release("destination");
  await eventually(
    async () => !(await country.isDisabled()),
    "Destination settles",
  );
  await checkNotice(page, "Loading prices and availability…");
  if (width < 760)
    assert.equal(
      await notice(page)
        .locator("[data-indeterminate]")
        .evaluate((node) => getComputedStyle(node).animationName),
      "none",
      "Reduced motion retains the status without animated ticks",
    );
  release("catalog");
  await page.locator("[data-commerce-loading]").waitFor({ state: "detached" });
  const purchase = page.locator("[data-sample-purchase]");
  const add = purchase.locator("button[data-available]");
  await eventually(
    async () => (await add.count()) === 1 && !(await add.isDisabled()),
    "Sample purchase becomes available",
  );
  await purchase
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  assert.equal(
    await purchase.getByLabel("Set quantity", { exact: true }).innerText(),
    "2",
  );

  hold("change");
  hold("catalog");
  await country.selectOption("SG");
  await checkNotice(page, "Updating prices…");
  assert.equal(await add.isDisabled(), true);
  assert.equal(await country.isDisabled(), true);
  release("change");
  await eventually(
    async () => (await country.inputValue()) === "SG",
    "Country response is confirmed",
  );
  await checkNotice(page, "Loading prices and availability…");
  release("catalog");
  await page.locator("[data-commerce-loading]").waitFor({ state: "detached" });
  await eventually(
    async () => !(await add.isDisabled()),
    "Refreshed prices unlock purchasing",
  );
  assert.equal(
    await purchase.getByLabel("Set quantity", { exact: true }).innerText(),
    "2",
  );
  assert.equal(
    await purchase.getByLabel("Sample set total", { exact: true }).innerText(),
    money(7600, "SGD"),
  );

  hold("add");
  await add.click();
  await checkNotice(page, "Adding…");
  await purchase.locator('button[aria-busy="true"]').waitFor();
  assert.equal(
    fixture.writes.length,
    2,
    "Only the deliberate country change and add are sent",
  );
  release("add");
  await page.getByRole("dialog", { name: /Your\s+selection/ }).waitFor();
  await page.locator("[data-commerce-loading]").waitFor({ state: "detached" });
  assert.equal(
    fixture.writes.length,
    2,
    "The indicator never replays a mutation",
  );

  await page.getByRole("button", { name: "Close cart", exact: true }).click();
  hold("cart");
  await page
    .getByRole("button", { name: "Open cart, 2 items", exact: true })
    .first()
    .click();
  await checkNotice(page, "Loading prices and availability…");
  assert.equal(await notice(page).getAttribute("data-in-cart"), "true");
  assert.equal(
    await notice(page).evaluate((node) =>
      Boolean(node.closest('[aria-busy="true"]')),
    ),
    false,
    "Busy cart content does not defer the loading announcement",
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Close cart", exact: true })
      .isEnabled(),
    true,
  );
  release("cart");
  await page.locator("[data-commerce-loading]").waitFor({ state: "detached" });
  assert.equal(fixture.writes.length, 2, "Cart refresh is read-only");
}

async function failureRecovery(fixture) {
  const { page, hold, release } = fixture;
  hold("cart");
  fixture.failReads(true);
  await page.goto(`${baseURL}/`);
  await page.locator("[data-hero-loader]").waitFor({ state: "detached" });
  await checkNotice(page, "Loading prices and availability…");
  release("cart");
  await page.locator("[data-commerce-loading]").waitFor({ state: "detached" });
  const control = page.locator("[data-destination-control]:visible").first();
  const retry = control.getByRole("button", { name: "Try again", exact: true });
  await retry.waitFor();
  assert.equal(
    await retry.isDisabled(),
    false,
    "A failed read does not leave a loading lock",
  );
  assert.equal(
    await control.locator("select").isDisabled(),
    true,
    "Unconfirmed prices stay protected",
  );
  fixture.failReads(false);
  hold("cart");
  await retry.click();
  await checkNotice(page, "Loading prices and availability…");
  assert.equal(await retry.isDisabled(), true);
  release("cart");
  await page.locator("[data-commerce-loading]").waitFor({ state: "detached" });
  await eventually(
    async () => !(await control.locator("select").isDisabled()),
    "Read-only retry recovers the country",
  );
  assert.equal(await retry.count(), 0);
  assert.deepEqual(
    fixture.writes,
    [],
    "Recovery never submits a commerce write",
  );
  assert.equal(await page.locator("dialog[open]").count(), 0);
}

async function catalogFailureRecovery(fixture, afterCountryChange) {
  const { page } = fixture;
  if (!afterCountryChange) fixture.failCatalog(true);
  await page.goto(`${baseURL}/samples`);
  const country = page
    .locator("select[data-destination-selector]:visible")
    .first();
  const purchase = page.locator("[data-sample-purchase]");
  const add = purchase.locator("button[data-available]");
  await eventually(
    async () => !(await country.isDisabled()),
    "The delivery country is confirmed",
  );
  if (afterCountryChange) {
    await eventually(
      async () => (await add.count()) === 1 && !(await add.isDisabled()),
      "Initial catalog is purchasable",
    );
    await purchase
      .getByRole("button", { name: "Increase quantity", exact: true })
      .click();
    fixture.failCatalog(true);
    await country.selectOption("SG");
  }
  const retry = purchase.getByRole("button", {
    name: "Try again",
    exact: true,
  });
  await eventually(
    async () => (await retry.count()) === 1 && !(await retry.isDisabled()),
    "A failed catalog read offers an enabled read-only retry",
  );
  await page.locator("[data-commerce-loading]").waitFor({ state: "detached" });
  assert.equal(
    await add.count(),
    0,
    "Stale availability cannot be ordered after failure",
  );
  assert.equal(
    (await purchase.innerText()).includes("Updating prices…"),
    false,
    "A completed failure is not presented as a pending request",
  );
  const writesBeforeRetry = fixture.writes.length;
  const readsBeforeRetry = fixture.reads.catalog;
  assert.equal(writesBeforeRetry, afterCountryChange ? 1 : 0);
  fixture.failCatalog(false);
  fixture.hold("catalog");
  await retry.click();
  await checkNotice(page, "Loading prices and availability…");
  assert.equal(
    await add.count(),
    0,
    "Retry keeps purchasing unavailable until fresh prices arrive",
  );
  fixture.release("catalog");
  await page.locator("[data-commerce-loading]").waitFor({ state: "detached" });
  await eventually(
    async () => (await add.count()) === 1 && !(await add.isDisabled()),
    "Successful retry restores purchasing",
  );
  const quantity = afterCountryChange ? 2 : 1;
  assert.equal(
    await purchase.getByLabel("Set quantity", { exact: true }).innerText(),
    String(quantity),
    "Retry preserves the selected quantity",
  );
  assert.equal(
    await purchase.getByLabel("Sample set total", { exact: true }).innerText(),
    money(
      (afterCountryChange ? 3800 : 2900) * quantity,
      afterCountryChange ? "SGD" : "USD",
    ),
    "Recovered total uses the newly confirmed destination price",
  );
  assert.ok(fixture.reads.catalog > readsBeforeRetry);
  assert.equal(
    fixture.writes.length,
    writesBeforeRetry,
    "Catalog recovery never replays a destination or cart mutation",
  );
}

const cases = [
  [
    "samples-desktop",
    1440,
    (fixture) => pendingFlow(fixture, "/samples", 1440),
  ],
  ["samples-mobile", 390, (fixture) => pendingFlow(fixture, "/samples", 390)],
  ["homepage-failed-read", 1440, failureRecovery],
  [
    "initial-catalog-retry",
    1440,
    (fixture) => catalogFailureRecovery(fixture, false),
  ],
  [
    "country-catalog-retry",
    390,
    (fixture) => catalogFailureRecovery(fixture, true),
  ],
];
try {
  for (const [name, width, run] of cases) {
    if (
      process.env.COMMERCE_LOADING_FILTER &&
      !new RegExp(process.env.COMMERCE_LOADING_FILTER).test(name)
    )
      continue;
    const fixture = await setup(width);
    try {
      await run(fixture);
      assert.deepEqual(fixture.errors, []);
      console.log(`PASS ${name}`);
    } finally {
      await fixture.close();
    }
  }
} finally {
  await browser.close();
}
