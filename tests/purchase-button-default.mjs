/* Canonical Current restoration. Catalog, destination and cart responses are local
 * fixtures; every unexpected write and every external request is blocked. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";

const playwright = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL =
  process.env.PURCHASE_DEFAULT_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const engine = process.env.PURCHASE_DEFAULT_BROWSER ?? "chromium";
const filter = process.env.PURCHASE_DEFAULT_FILTER;
const evidence =
  process.env.PURCHASE_DEFAULT_EVIDENCE ??
  ".local/purchase-button-default-0217";
assert.ok(["chromium", "webkit"].includes(engine));
assert.ok(SAMPLE_SET_OFFER);
const products = [
  {
    key: "sample-set",
    handle: SAMPLE_SET_OFFER.productHandle,
    name: "Sample Set",
  },
  ...SAMPLE_SET_CONTENTS.map((item) => ({
    key: item.key,
    handle: item.productHandle,
    name: item.name,
  })),
].map((item, index) => ({
  id: item.key,
  handle: item.handle,
  title: item.name,
  description: "Isolated purchase surface fixture.",
  productCode: null,
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
      selectionId: item.key,
      title: index ? "1 kg" : "3 × 20 g",
      options: index
        ? [{ name: "Format", value: "1 kg" }]
        : SAMPLE_SET_OFFER.variants[0].options,
      available: true,
      priceMinor: index ? 6500 : 2900,
      currency: "USD",
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));

async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function setup(browser, { width = 390, tone = "light" } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: width <= 760 ? 844 : 1000 },
    hasTouch: width <= 760,
    isMobile: width <= 760,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: "en", url: baseURL },
  ]);
  const state = {
    destination: { countryCode: "US", currency: "USD" },
    available: true,
    release: null,
    actions: [],
  };
  const errors = [];
  await context.route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      method = request.method();
    if (url.origin !== origin) {
      errors.push(`External request blocked: ${url.pathname}`);
      return route.abort();
    }
    if (url.pathname === "/api/destination" && method === "GET")
      return route.fulfill({
        json: {
          kind: "ready",
          preference: {
            countryCode: state.destination.countryCode,
            source: "manual",
          },
          destination: state.destination,
          countries: ["US", "SG"],
          reviewRequired: false,
        },
      });
    if (url.pathname === "/api/catalog" && method === "GET")
      return route.fulfill({
        json: {
          status: "ready",
          products: products.map((product) => ({
            ...product,
            variants: product.variants.map((variant) => ({
              ...variant,
              currency: state.destination.currency,
              available: state.available,
            })),
          })),
          destination: state.destination,
          shopUrl: "https://example.invalid",
        },
      });
    if (url.pathname === "/api/cart" && method === "GET")
      return route.fulfill({
        json: {
          kind: "empty",
          destination: state.destination,
          destinationReviewRequired: false,
          checkoutEnabled: false,
        },
      });
    if (url.pathname === "/api/cart" && method === "POST") {
      const action = request.postDataJSON();
      const validAdd =
        action.action === "add" &&
        action.productHandle === products[0].handle &&
        action.variantKey === products[0].variants[0].id &&
        action.quantity === 1 &&
        Object.keys(action).sort().join() ===
          "action,productHandle,quantity,variantKey";
      const validDestination =
        action.action === "destination" &&
        action.countryCode === "SG" &&
        Object.keys(action).sort().join() === "action,countryCode";
      if (!validAdd && !validDestination) {
        errors.push("Unexpected mutation blocked");
        return route.abort();
      }
      state.actions.push(action);
      await new Promise((done) => {
        state.release = done;
      });
      state.release = null;
      if (validDestination) {
        state.destination = { countryCode: "SG", currency: "SGD" };
        return route.fulfill({
          json: {
            kind: "success",
            cart: {
              totalQuantity: 0,
              subtotalLabel: "S$0.00",
              totalLabel: "S$0.00",
              lines: [],
            },
            destination: state.destination,
            destinationReviewRequired: false,
            checkoutEnabled: false,
          },
        });
      }
      // A deliberate rejection restores the real purchase UI without creating a cart.
      return route.fulfill({
        status: 422,
        json: {
          kind: "rejected",
          destination: state.destination,
          checkoutEnabled: false,
        },
      });
    }
    if (url.pathname.startsWith("/api/") || !["GET", "HEAD"].includes(method)) {
      errors.push(`Unexpected request blocked: ${method} ${url.pathname}`);
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
    state,
    errors,
    width,
    tone,
    async close() {
      state.release?.();
      await context.close();
    },
  };
}

const purchase = (page) => page.locator("[data-sample-purchase]");
const buttonFor = (page) => purchase(page).locator("button[data-available]");

async function openSamples(fixture) {
  await fixture.page.goto(`${baseURL}/samples`);
  await eventually(
    () => buttonFor(fixture.page).isEnabled(),
    "Samples purchase becomes ready",
  );
  await fixture.page.evaluate(() => document.fonts.ready);
  await buttonFor(fixture.page).scrollIntoViewIfNeeded();
  await settle(buttonFor(fixture.page));
}

async function settle(button) {
  await button.evaluate(async (node) => {
    await Promise.allSettled(
      node
        .getAnimations({ subtree: true })
        .filter((animation) =>
          Number.isFinite(animation.effect?.getTiming().iterations),
        )
        .map((animation) => animation.finished),
    );
  });
  await eventually(
    () =>
      button.evaluate((node) =>
        [...node.querySelectorAll("[data-scramble-glyph]")].every(
          (glyph) =>
            glyph.textContent === glyph.previousElementSibling?.textContent,
        ),
      ),
    "The retained animated purchase label resolves before capture",
  );
}

async function metrics(button) {
  return button.evaluate((node) => {
    const style = getComputedStyle(node),
      box = node.getBoundingClientRect();
    const part = (name) => node.querySelector(`[class*="_${name}__"]`);
    const partStyle = (name) => getComputedStyle(part(name));
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    const rgbFor = (color) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    const luminance = (values) => {
      const rgb = values.map((value) => {
        const s = value / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    };
    const inkRGB = rgbFor(style.color),
      ink = luminance(inkRGB),
      fillRGB = rgbFor(style.backgroundColor),
      fill = luminance(fillRGB);
    const contrast = (background) =>
      (Math.max(ink, background) + 0.05) / (Math.min(ink, background) + 0.05);
    // The retained pointer radial paints at most 16% ink over the solid fill.
    const tintedContrast = contrast(
      luminance(
        fillRGB.map((value, index) => value * 0.84 + inkRGB[index] * 0.16),
      ),
    );
    const label = part("label"),
      labelBox = label.getBoundingClientRect(),
      actionBox = part("action").getBoundingClientRect();
    return {
      treatment: style.getPropertyValue("--button-treatment").trim(),
      explicitTreatment: node.getAttribute("data-treatment"),
      fill: style.backgroundColor,
      edge: style.borderColor,
      ink: style.color,
      contrast: contrast(fill),
      tintedContrast,
      backgroundImage: style.backgroundImage,
      shadow: style.boxShadow,
      width: box.width,
      height: box.height,
      radius: style.borderRadius,
      font: parseFloat(style.fontSize),
      overflow:
        box.left < -1 ||
        box.right > innerWidth + 1 ||
        node.scrollWidth > node.clientWidth + 1 ||
        label.scrollWidth > label.clientWidth + 1 ||
        labelBox.right > actionBox.left + 1,
      scramble: node.querySelectorAll("[data-scramble-glyph]").length,
      labelOpacity: partStyle("label").opacity,
      labelDisplay: partStyle("label").display,
      arrow: partStyle("arrow").opacity,
      plus: partStyle("plus").opacity,
      transform: style.transform,
      surfaceDisplay: partStyle("surface").display,
      surfaceOpacity: partStyle("surface").opacity,
      scan: getComputedStyle(part("track"), "::after").animationName,
      spinnerDisplay: partStyle("spinner").display,
      spinnerAnimation: partStyle("spinner").animationName,
      outline: style.outlineStyle,
    };
  });
}

function checkOriginalMineralSurface(result, tone) {
  const expected =
    tone === "light"
      ? {
          fill: "rgb(220, 230, 217)",
          edge: "rgb(111, 131, 118)",
          ink: "rgb(38, 59, 52)",
        }
      : {
          fill: "rgb(38, 58, 70)",
          edge: "rgb(129, 149, 162)",
          ink: "rgb(233, 238, 242)",
        };
  for (const [key, value] of Object.entries(expected))
    assert.equal(
      result[key],
      value,
      `Original Mineral ${tone} ${key} remains exact`,
    );
  assert.equal(
    result.backgroundImage,
    "none",
    "Mineral has no directional gradient",
  );
  assert.equal(
    result.shadow,
    "none",
    "Mineral retains the original flat resting surface",
  );
}

async function studyMineral(page, tone) {
  await page.goto(
    `${baseURL}/purchase-button-study/samples?tone=${tone}&direction=mineral`,
  );
  const mineral = page.locator('[data-button-option="mineral"] button');
  await mineral.waitFor();
  await page.evaluate(() => document.fonts.ready);
  const result = await metrics(mineral);
  checkOriginalMineralSurface(result, tone);
  return result;
}

function checkCurrentSurface(result, tone) {
  const fill = tone === "light" ? "rgb(38, 59, 52)" : "rgb(233, 238, 242)";
  const ink = tone === "light" ? "rgb(241, 245, 239)" : "rgb(8, 11, 17)";
  assert.equal(
    result.fill,
    fill,
    "Current uses the original inverse theme surface",
  );
  assert.equal(result.edge, fill, "Current border matches its surface");
  assert.equal(result.ink, ink, "Current uses the original inverse theme ink");
  assert.equal(result.backgroundImage, "none");
  assert.notEqual(
    result.shadow,
    "none",
    "Current restores the original resting shadow",
  );
}

async function compareCurrentStudy(page, tone, canonical) {
  await page.goto(
    `${baseURL}/purchase-button-study/samples?tone=${tone}&direction=current`,
  );
  const current = page.locator('[data-button-option="current"] button');
  await current.waitFor();
  const study = await metrics(current);
  checkCurrentSurface(study, tone);
  for (const key of ["fill", "edge", "ink", "backgroundImage", "shadow"])
    assert.equal(
      canonical[key],
      study[key],
      `Canonical and saved study Current share identical ${key}`,
    );
}

async function checkReady(button, width, tone) {
  const result = await metrics(button);
  assert.equal(result.treatment, "", "No canonical Mineral token remains");
  assert.equal(
    result.explicitTreatment,
    null,
    "Canonical purchase uses the original Current component",
  );
  assert.ok(result.scramble > 0, "Existing scramble text stays mounted");
  assert.equal(result.radius, "6px");
  assert.ok(result.height >= 44);
  assert.equal(result.overflow, false, "Label and icon fit without clipping");
  assert.equal(result.labelOpacity, "1");
  assert.notEqual(result.labelDisplay, "none");
  assert.ok(
    result.contrast >= 4.5 && result.tintedContrast >= 4.5,
    `Readable solid fill and maximum pointer tint: ${result.contrast}, ${result.tintedContrast}`,
  );
  checkCurrentSurface(result, tone);
  if (width <= 760) assert.ok(result.font >= 12);
  assert.notEqual(result.surfaceDisplay, "none");
  assert.match(result.scan, /ready-scan/);
  return result;
}

async function checkDesktopInteraction(page, button, name) {
  const box = await button.boundingBox();
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5);
  await settle(button);
  const hover = await metrics(button);
  assert.equal(hover.arrow, "1");
  assert.equal(hover.plus, "0");
  assert.notEqual(hover.transform, "none");
  assert.equal(hover.surfaceOpacity, "1");
  assert.ok(
    await button.evaluate(
      (node) => parseFloat(node.style.getPropertyValue("--pointer-x")) > 0,
    ),
    "Pointer-following surface retains live coordinates",
  );
  await button.screenshot({ path: `${evidence}/${name}-hover.png` });
  await page.mouse.move(0, 0);
  await page.keyboard.press(engine === "webkit" ? "Alt+Tab" : "Tab");
  await button.focus();
  await settle(button);
  assert.notEqual(
    (await metrics(button)).outline,
    "none",
    "Keyboard focus remains visible",
  );
  assert.equal(
    await button.evaluate((node) => node === document.activeElement),
    true,
  );
}

async function responsiveCase(browser, width, tone, name) {
  const fixture = await setup(browser, { width, tone });
  const { page } = fixture;
  try {
    await openSamples(fixture);
    assert.equal(
      await page
        .locator("[data-samples-page]")
        .getAttribute("data-purchase-treatment"),
      null,
    );
    const button = buttonFor(page),
      ready = await checkReady(button, width, tone);
    await purchase(page).screenshot({
      path: `${evidence}/${name}-section.png`,
    });
    await button.screenshot({ path: `${evidence}/${name}-button.png` });
    if (width > 760) await checkDesktopInteraction(page, button, name);
    await compareCurrentStudy(page, tone, ready);
    assert.equal(fixture.state.actions.length, 0);
    assert.deepEqual(fixture.errors, []);
    return {
      name,
      contrast: ready.contrast,
      maximumTintContrast: ready.tintedContrast,
      readyFill: ready.fill,
      readyEdge: ready.edge,
      studyEquality: "passed",
      font: ready.font,
      originalInteraction: "preserved",
    };
  } finally {
    await fixture.close();
  }
}

async function statesCase(browser, name) {
  const fixture = await setup(browser, { width: 320, tone: "dark" });
  const { page, state } = fixture;
  try {
    await openSamples(fixture);
    const button = buttonFor(page),
      original = await button.elementHandle();
    await page
      .locator("[data-destination-selector]:visible")
      .first()
      .selectOption("SG");
    await eventually(
      () => state.release !== null,
      "Destination mutation is held locally",
    );
    await purchase(page)
      .getByRole("button", { name: "Updating prices…", exact: true })
      .waitFor();
    assert.equal(await button.isDisabled(), true);
    assert.equal(await button.getAttribute("aria-busy"), "true");
    assert.equal((await metrics(button)).overflow, false);
    await button.screenshot({ path: `${evidence}/${name}-updating.png` });
    state.release();
    await eventually(
      () => button.isEnabled(),
      "Destination update restores ready purchase",
    );
    await button.click({ position: { x: 8, y: 8 } });
    await eventually(() => state.release !== null, "Add is held locally");
    assert.equal(await button.getAttribute("data-pending"), "true");
    assert.equal(await button.isDisabled(), true);
    const pending = await metrics(button);
    assert.equal(pending.spinnerDisplay, "block");
    assert.match(pending.spinnerAnimation, /spin/);
    assert.match(pending.scan, /pending-scan/);
    assert.equal(pending.overflow, false);
    await button.evaluate((node) => {
      node.click();
      node.click();
    });
    assert.equal(
      state.actions.filter((action) => action.action === "add").length,
      1,
      "Disabled pending purchase cannot submit again",
    );
    await button.screenshot({ path: `${evidence}/${name}-pending.png` });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const reducedPending = await metrics(button);
    assert.equal(reducedPending.spinnerAnimation, "none");
    assert.equal(reducedPending.scan, "none");
    state.release();
    await eventually(
      () => button.isEnabled(),
      "Rejected isolated add restores purchase",
    );
    assert.equal(
      await button.evaluate((node, previous) => node === previous, original),
      true,
      "State changes preserve the shared button node",
    );
    assert.equal((await metrics(button)).scan, "none");
    state.available = false;
    await page.reload();
    await purchase(page)
      .getByRole("button", { name: "Currently unavailable", exact: true })
      .waitFor();
    assert.equal(await button.isDisabled(), true);
    assert.equal(await button.getAttribute("aria-busy"), "false");
    assert.equal((await metrics(button)).overflow, false);
    await button.screenshot({ path: `${evidence}/${name}-unavailable.png` });
    assert.deepEqual(fixture.errors, []);
    return {
      name,
      updating: "passed",
      pending: "passed",
      unavailable: "passed",
      reducedMotion: "passed",
      interceptedActions: state.actions.length,
    };
  } finally {
    await fixture.close();
  }
}

async function homepageCase(browser, width, tone, name) {
  const fixture = await setup(browser, { width, tone });
  const { page } = fixture;
  try {
    await page.goto(baseURL);
    assert.equal(
      await page
        .locator('[data-concept="01"]')
        .getAttribute("data-purchase-treatment"),
      null,
    );
    await page
      .getByRole("button", {
        name: "Explore matcha from the silver bag",
        exact: true,
      })
      .click();
    const sample = page.locator(
      "[data-sample-start-entry] button[data-available]",
    );
    await eventually(() => sample.isEnabled(), "Homepage Sample Set is ready");
    await sample.scrollIntoViewIfNeeded();
    await settle(sample);
    await checkReady(sample, width, tone);
    await page
      .getByRole("button", { name: "Explore individual matcha", exact: true })
      .click();
    await page.locator('[data-homepage-product-choice="barista"]').click();
    await page
      .getByRole("group", { name: "Shopping mode", exact: true })
      .getByRole("button", { name: "Shop", exact: true })
      .click();
    const shop = page.locator("[data-shop-exploration]");
    const button = shop.locator("button[data-available]");
    await eventually(
      () => button.isEnabled(),
      "Regular matcha Shop purchase is ready",
    );
    await button.scrollIntoViewIfNeeded();
    await settle(button);
    const ready = await checkReady(button, width, tone);
    assert.equal(
      await page
        .locator('[data-homepage-product-choice="barista"]')
        .getAttribute("aria-pressed"),
      "true",
    );
    await shop.screenshot({ path: `${evidence}/${name}-section.png` });
    await button.screenshot({ path: `${evidence}/${name}-button.png` });
    if (width > 760) await checkDesktopInteraction(page, button, name);

    await page.goto(`${baseURL}/shop/${SAMPLE_SET_CONTENTS[0].productHandle}`);
    assert.equal(
      await page
        .locator("[data-retail-product]")
        .getAttribute("data-purchase-treatment"),
      null,
    );
    const retail = page.locator("[data-retail-product] button[data-available]");
    await eventually(() => retail.isEnabled(), "Retail purchase is ready");
    await retail.scrollIntoViewIfNeeded();
    await settle(retail);
    const retailReady = await checkReady(retail, width, tone);
    for (const key of ["fill", "edge", "ink", "shadow"])
      assert.equal(
        retailReady[key],
        ready[key],
        "Retail and homepage restore the same Current surface",
      );
    await compareCurrentStudy(page, tone, ready);
    assert.equal(fixture.state.actions.length, 0);
    assert.deepEqual(fixture.errors, []);
    return {
      name,
      homepageSample: "passed",
      regularMatchaShop: "passed",
      retailProduct: "passed",
      studyEquality: "passed",
      contrast: ready.contrast,
      maximumTintContrast: ready.tintedContrast,
      readyFill: ready.fill,
      readyInk: ready.ink,
      restingShadow: ready.shadow,
    };
  } finally {
    await fixture.close();
  }
}

async function studyCase(browser, name) {
  const fixture = await setup(browser, { width: 1440, tone: "light" });
  const { page } = fixture;
  try {
    for (const tone of ["light", "dark"]) {
      await studyMineral(page, tone);
      const root = page.locator("[data-purchase-button-study]");
      await root.waitFor();
      const current = root.locator('[data-button-option="current"] button');
      const mineral = root.locator('[data-button-option="mineral"] button');
      assert.equal(await root.getAttribute("data-purchase-treatment"), null);
      assert.equal(await current.getAttribute("data-treatment"), null);
      assert.equal(await mineral.getAttribute("data-treatment"), "mineral");
      const original = await metrics(current),
        quiet = await metrics(mineral);
      assert.notEqual(original.treatment, "mineral");
      assert.notEqual(original.fill, quiet.fill);
      assert.ok(original.scramble > 0);
      assert.equal(quiet.scramble, 0);
      assert.match(original.scan, /ready-scan/);
      assert.equal(quiet.surfaceDisplay, "none");
      assert.equal(await root.locator("[data-button-option]").count(), 4);
    }
    assert.equal(fixture.state.actions.length, 0);
    assert.deepEqual(fixture.errors, []);
    return { name, originalCurrent: "preserved", originalMineral: "preserved" };
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
  for (const tone of ["light", "dark"]) {
    const width = engine === "chromium" ? 1440 : 390;
    const name = `${engine}-core-home-${tone}`;
    if (filter && !name.includes(filter)) continue;
    results.push(await homepageCase(browser, width, tone, name));
    console.log(`PASS ${name}`);
  }
  {
    const tone = engine === "chromium" ? "light" : "dark";
    const name = `${engine}-core-samples-${tone}`;
    if (!filter || name.includes(filter)) {
      results.push(await responsiveCase(browser, 390, tone, name));
      console.log(`PASS ${name}`);
    }
  }
  for (const [label, run] of [
    ["states-reduced", statesCase],
    ["study-isolation", studyCase],
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
console.log(`${results.length} Current purchase scenarios passed.`);
