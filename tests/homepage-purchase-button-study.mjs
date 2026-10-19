/* Homepage purchase preview: fixture reads only. All writes and external requests
 * are blocked, including accidental activation of real cart controls. */
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
  process.env.HOMEPAGE_PURCHASE_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const engine = process.env.HOMEPAGE_PURCHASE_BROWSER ?? "chromium";
const filter = process.env.HOMEPAGE_PURCHASE_FILTER;
const evidence =
  process.env.HOMEPAGE_PURCHASE_EVIDENCE ??
  ".local/homepage-purchase-button-study-0219";
const surfaces = {
  current: "Current",
  soft: "Soft solid",
  tonal: "Tonal",
  outline: "Outline",
};
const states = {
  ready: ["Add to cart", false, false],
  pending: ["Adding…", true, true],
  updating: ["Updating prices…", true, true],
  unavailable: ["Currently unavailable", true, false],
  locked: ["Add to cart", true, false],
};
assert.ok(["chromium", "webkit"].includes(engine));
assert.ok(SAMPLE_SET_OFFER);
const destination = { countryCode: "US", currency: "USD" };
const products = [
  {
    key: "sample-set",
    handle: SAMPLE_SET_OFFER.productHandle,
    name: "Sample Set",
    options: SAMPLE_SET_OFFER.variants[0].options,
  },
  ...SAMPLE_SET_CONTENTS.map((item) => ({
    ...item,
    handle: item.productHandle,
    options: [{ name: "Format", value: "1 kg" }],
  })),
].map((item, index) => ({
  id: item.key,
  handle: item.handle,
  title: item.name,
  description: "Isolated homepage purchase preview fixture.",
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

async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function setup(
  browser,
  { width, tone, reducedMotion = "no-preference" },
) {
  const context = await browser.newContext({
    viewport: { width, height: width <= 760 ? 844 : 1000 },
    hasTouch: width <= 760,
    isMobile: width <= 760,
    reducedMotion,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: "en", url: baseURL },
  ]);
  const errors = [],
    reads = { catalog: 0 },
    writes = [];
  await context.route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (!["GET", "HEAD"].includes(request.method())) {
      writes.push(`${request.method()} ${url.pathname}`);
      return route.abort();
    }
    if (url.origin !== origin) {
      errors.push(`External request blocked: ${url.pathname}`);
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
      reads.catalog++;
      return route.fulfill({
        json: {
          status: "ready",
          destination,
          products,
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
      errors.push(`Unexpected API read: ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page, width, tone, reads, writes, errors };
}

const root = (page) => page.locator("[data-homepage-purchase-study]");
const shop = (page) => root(page).locator("[data-shop-exploration]");
const preview = (page) =>
  root(page).locator("[data-homepage-purchase-preview]");
const button = (page) => preview(page).locator("button");
const radio = (page, surface) =>
  root(page)
    .getByRole("group", { name: "Purchase button surface" })
    .getByRole("radio", { name: surfaces[surface], exact: true });
const theme = (page) =>
  root(page).getByRole("switch", {
    name: "Dark mode in homepage button study",
    exact: true,
  });
const stateSelect = (page) =>
  root(page).getByRole("combobox", { name: "Button state", exact: true });

async function settle(target) {
  await target.evaluate(async (node) => {
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
      target.evaluate((node) =>
        [...node.querySelectorAll("[data-scramble-glyph]")].every(
          (glyph) =>
            glyph.textContent === glyph.previousElementSibling?.textContent,
        ),
      ),
    "Animated label resolves before capture",
  );
}

async function open(fixture, query = "") {
  await fixture.page.goto(`${baseURL}/purchase-button-study${query}`);
  await root(fixture.page).waitFor();
  await eventually(
    () => button(fixture.page).isEnabled(),
    "Shop preview becomes ready",
  );
  await eventually(
    () =>
      shop(fixture.page)
        .getByRole("button", { name: "Increase quantity", exact: true })
        .isEnabled(),
    "Real catalogue selection becomes ready",
  );
  await fixture.page.evaluate(() => document.fonts.ready);
  await settle(button(fixture.page));
}

async function metrics(target) {
  return target.evaluate((node) => {
    const style = getComputedStyle(node),
      box = node.getBoundingClientRect();
    const part = (name) => node.querySelector(`[class*="_${name}__"]`);
    const partStyle = (name) => getComputedStyle(part(name));
    const label = part("label"),
      labelBox = label.getBoundingClientRect(),
      actionBox = part("action").getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d"),
      ancestors = [];
    for (let item = node; item; item = item.parentElement)
      ancestors.unshift(item);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 1, 1);
    for (const item of ancestors) {
      ctx.fillStyle = getComputedStyle(item).backgroundColor;
      ctx.fillRect(0, 0, 1, 1);
    }
    const background = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = style.color;
    ctx.fillRect(0, 0, 1, 1);
    const ink = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
    const luminance = (values) =>
      values
        .map((v) => {
          const s = v / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const contrast = (values) =>
      (Math.max(luminance(ink), luminance(values)) + 0.05) /
      (Math.min(luminance(ink), luminance(values)) + 0.05);
    return {
      fill: style.backgroundColor,
      ink: style.color,
      edge: style.borderColor,
      backgroundImage: style.backgroundImage,
      shadow: style.boxShadow,
      contrast: contrast(background),
      tintedContrast: contrast(
        background.map((v, i) => v * 0.84 + ink[i] * 0.16),
      ),
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
      arrow: partStyle("arrow").opacity,
      plus: partStyle("plus").opacity,
      transform: style.transform,
      surfaceDisplay: partStyle("surface").display,
      surfaceOpacity: partStyle("surface").opacity,
      scan: getComputedStyle(part("track"), "::after").animationName,
      spinner: partStyle("spinner").animationName,
      outline: style.outlineStyle,
    };
  });
}

async function checkFit(fixture) {
  const fit = await root(fixture.page).evaluate((node) => {
    const controls = [
      ...node.querySelectorAll(
        ":scope > header input[type=radio], :scope > header select, :scope > header button",
      ),
    ].map((item) => {
      const target = item.type === "radio" ? item.parentElement : item;
      const box = target.getBoundingClientRect();
      return {
        width: box.width,
        height: box.height,
        font: parseFloat(getComputedStyle(item).fontSize),
        type: item.tagName,
        label: item.getAttribute("aria-label") || target.textContent,
      };
    });
    const overflow = [
      ...node.querySelectorAll(
        ":scope > header label, :scope > header button, :scope > header select, [data-shop-exploration] p, [data-shop-exploration] h2, [data-shop-exploration] button",
      ),
    ]
      .filter(
        (item) =>
          item.getClientRects().length &&
          getComputedStyle(item).visibility !== "hidden",
      )
      .filter((item) => {
        const box = item.getBoundingClientRect();
        return (
          box.width > 1 &&
          (box.left < -1 ||
            box.right > innerWidth + 1 ||
            item.scrollWidth > item.clientWidth + 1)
        );
      })
      .map((item) => item.textContent.slice(0, 60));
    return {
      controls,
      overflow,
      documentFits: document.documentElement.scrollWidth <= innerWidth + 1,
    };
  });
  assert.equal(fit.documentFits, true);
  assert.deepEqual(fit.overflow, []);
  if (fixture.width <= 760)
    for (const control of fit.controls) {
      assert.ok(
        control.width >= 43.9 && control.height >= 43.9,
        `Mobile study controls have 44 px targets: ${JSON.stringify(control)}`,
      );
      if (control.type === "SELECT")
        assert.ok(control.font >= 16, "Mobile state field avoids focus zoom");
    }
}

async function core(fixture, name) {
  const { page } = fixture;
  await open(fixture, `?surface=current&tone=${fixture.tone}&retain=1#study`);
  await page.locator('[data-homepage-product-choice="barista"]').click();
  await shop(page)
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  assert.equal(
    await shop(page)
      .getByRole("status", { name: "Quantity", exact: true })
      .textContent(),
    "2",
  );
  const saved = {
    purchase: await button(page).elementHandle(),
    scene: await root(page).locator("[data-tea-material]").elementHandle(),
    panel: await shop(page).elementHandle(),
    reads: fixture.reads.catalog,
  };
  async function continuous() {
    for (const [locator, handle] of [
      [button(page), saved.purchase],
      [root(page).locator("[data-tea-material]"), saved.scene],
      [shop(page), saved.panel],
    ])
      assert.equal(
        await locator.evaluate((node, previous) => node === previous, handle),
        true,
        "Study changes preserve mounted purchase and material nodes",
      );
    assert.equal(
      await page
        .locator('[data-homepage-product-choice="barista"]')
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      await shop(page)
        .getByRole("status", { name: "Quantity", exact: true })
        .textContent(),
      "2",
    );
    assert.equal(
      fixture.reads.catalog,
      saved.reads,
      "Surface, state and tone changes do not refetch catalogue",
    );
  }
  const collected = {};
  for (const surface of Object.keys(surfaces)) {
    await radio(page, surface).locator("..").click();
    await stateSelect(page).selectOption("ready");
    assert.equal(await preview(page).getAttribute("data-surface"), surface);
    const url = new URL(page.url());
    assert.equal(url.searchParams.get("surface"), surface);
    assert.equal(url.searchParams.get("retain"), "1");
    assert.equal(url.hash, "#study");
    await button(page).scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await button(page).evaluate((node) => node.blur());
    await settle(button(page));
    const ready = await metrics(button(page));
    collected[surface] = ready;
    assert.equal(
      await button(page).getAttribute("data-treatment"),
      null,
      "Each surface keeps original Current markup",
    );
    assert.ok(ready.scramble > 0);
    assert.equal(ready.radius, "6px");
    assert.ok(ready.height >= 44);
    assert.equal(ready.overflow, false);
    assert.ok(
      ready.contrast >= 4.5 && ready.tintedContrast >= 4.5,
      `Readable ${surface} text: ${ready.contrast}/${ready.tintedContrast}`,
    );
    assert.notEqual(ready.surfaceDisplay, "none");
    assert.match(ready.scan, /ready-scan/);
    await checkFit(fixture);
    await shop(page).screenshot({
      path: `${evidence}/${engine}-${name}-${surface}-section.png`,
    });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: `${evidence}/${engine}-${name}-${surface}-viewport.png`,
    });
    await button(page).scrollIntoViewIfNeeded();
    if (fixture.width <= 760)
      await page.screenshot({
        path: `${evidence}/${engine}-${name}-${surface}-shop-viewport.png`,
      });
    if (fixture.width > 760) {
      const box = await button(page).boundingBox();
      await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5);
      await settle(button(page));
      const hovered = await metrics(button(page));
      assert.equal(hovered.arrow, "1");
      assert.equal(hovered.plus, "0");
      assert.notEqual(hovered.transform, "none");
      assert.equal(hovered.surfaceOpacity, "1");
      assert.ok(
        await button(page).evaluate(
          (node) => parseFloat(node.style.getPropertyValue("--pointer-x")) > 0,
        ),
      );
    }
    // Use native button padding: animated glyph interception is separate from this study.
    await button(page).click({ position: { x: 8, y: 8 } });
    await root(page)
      .getByRole("status")
      .filter({ hasText: `${surfaces[surface]} previewed · cart unchanged.` })
      .waitFor();
    assert.deepEqual(
      fixture.writes,
      [],
      "Preview activation never reaches the cart",
    );
    for (const [state, [label, disabled, busy]] of Object.entries(states)) {
      await stateSelect(page).selectOption(state);
      assert.equal(await button(page).isDisabled(), disabled);
      assert.equal(await button(page).getAttribute("aria-busy"), String(busy));
      assert.equal(
        await preview(page)
          .getByRole("button", { name: label, exact: true })
          .count(),
        1,
      );
      await settle(button(page));
      assert.equal(
        (await metrics(button(page))).overflow,
        false,
        `${state} label fits ${surface}`,
      );
      if (disabled) {
        const status = await root(page)
          .getByRole("status")
          .filter({ hasText: "cart unchanged" })
          .textContent();
        await button(page).evaluate((node) => node.click());
        assert.equal(
          await root(page)
            .getByRole("status")
            .filter({ hasText: "cart unchanged" })
            .textContent(),
          status,
        );
      }
    }
    await continuous();
  }
  await stateSelect(page).selectOption("ready");
  await radio(page, "soft").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await radio(page, "tonal").isChecked(),
    true,
    "Native radio arrow-key selection works",
  );
  await button(page).focus();
  await page.keyboard.press(engine === "webkit" ? "Alt+Tab" : "Tab");
  await button(page).focus();
  await settle(button(page));
  assert.notEqual(
    (await metrics(button(page))).outline,
    "none",
    "Keyboard focus is visible",
  );
  await page.keyboard.press("Enter");
  await root(page)
    .getByRole("status")
    .filter({ hasText: "Tonal previewed · cart unchanged." })
    .waitFor();
  await theme(page).click();
  assert.equal(
    await root(page).getAttribute("data-tone"),
    fixture.tone === "light" ? "dark" : "light",
  );
  await continuous();
  await theme(page).click();
  await continuous();
  assert.equal(
    (await fixture.context.cookies()).find(
      (cookie) => cookie.name === "atoma-theme",
    )?.value,
    fixture.tone,
  );
  await page.reload();
  await eventually(
    () => button(page).isEnabled(),
    "Refreshed preview becomes ready",
  );
  assert.equal(
    await radio(page, "tonal").isChecked(),
    true,
    "Selected surface survives URL refresh",
  );
  assert.equal(await root(page).getAttribute("data-tone"), fixture.tone);
  return {
    surfaces: collected,
    mountedContinuity: true,
    zeroCartWrites: true,
    keyboard: true,
    urlRefresh: true,
  };
}

async function reducedAndIsolation(fixture, name) {
  const { page } = fixture;
  await open(fixture, "?surface=outline&tone=dark");
  for (const surface of Object.keys(surfaces)) {
    await radio(page, surface).locator("..").click();
    await button(page).scrollIntoViewIfNeeded();
    await button(page).hover();
    await settle(button(page));
    let current = await metrics(button(page));
    assert.equal(current.transform, "none");
    assert.equal(current.scan, "none");
    await stateSelect(page).selectOption("pending");
    current = await metrics(button(page));
    assert.equal(current.spinner, "none");
    assert.equal(current.scan, "none");
    await stateSelect(page).selectOption("ready");
  }
  await checkFit(fixture);
  await shop(page).screenshot({ path: `${evidence}/${engine}-${name}.png` });
  await page.goto(`${baseURL}/`);
  await page
    .getByRole("button", {
      name: "Explore matcha from the silver bag",
      exact: true,
    })
    .click();
  await eventually(
    () =>
      page.locator("[data-sample-purchase] button[data-available]").isEnabled(),
    "Canonical Sample Set is ready",
  );
  assert.equal(
    await page.locator("[data-homepage-purchase-preview]").count(),
    0,
  );
  assert.equal(
    await page
      .locator("[data-sample-purchase] button[data-available]")
      .getAttribute("data-treatment"),
    null,
  );
  await page
    .getByRole("button", { name: "Explore individual matcha", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name: "Shop", exact: true })
    .click();
  const canonical = page.locator(
    "[data-shop-exploration] button[data-available]",
  );
  await eventually(
    () => canonical.isEnabled(),
    "Canonical regular-matcha Shop is ready",
  );
  assert.equal(
    await page.locator("[data-homepage-purchase-preview]").count(),
    0,
  );
  const canonicalStyle = await metrics(canonical);
  assert.equal(canonicalStyle.fill, "rgb(38, 59, 52)");
  assert.equal(canonicalStyle.ink, "rgb(241, 245, 239)");
  for (const tone of ["light", "dark"]) {
    await page.goto(
      `${baseURL}/purchase-button-study/samples?tone=${tone}&direction=mineral`,
    );
    const archived = page.locator("[data-purchase-button-study]");
    await archived.waitFor();
    assert.equal(await archived.locator("[data-button-option]").count(), 4);
    const original = archived.locator('[data-button-option="current"] button');
    const mineral = archived.locator('[data-button-option="mineral"] button');
    assert.equal(await original.getAttribute("data-treatment"), null);
    assert.equal(await mineral.getAttribute("data-treatment"), "mineral");
    const originalStyle = await metrics(original),
      mineralStyle = await metrics(mineral);
    assert.ok(originalStyle.scramble > 0);
    assert.equal(mineralStyle.scramble, 0);
    assert.equal(
      mineralStyle.fill,
      tone === "light" ? "rgb(220, 230, 217)" : "rgb(38, 58, 70)",
    );
    assert.equal(mineralStyle.backgroundImage, "none");
    assert.equal(mineralStyle.shadow, "none");
  }
  return {
    reducedMotion: true,
    canonicalCurrent: true,
    archivedCurrentAndMineral: true,
  };
}

await mkdir(evidence, { recursive: true });
const browser = await playwright[engine].launch(
  engine === "chromium"
    ? { channel: "chrome", headless: true }
    : { headless: true },
);
const results = [];
async function run(name, settings, action) {
  if (filter && !name.includes(filter)) return;
  const fixture = await setup(browser, settings);
  try {
    const details = await action(fixture, name);
    assert.deepEqual(
      fixture.writes,
      [],
      "No network writes from preview or smoke paths",
    );
    assert.deepEqual(
      fixture.errors,
      [],
      "No page exceptions or unexpected external/API reads",
    );
    assert.equal(
      (await fixture.context.cookies()).find(
        (cookie) => cookie.name === "atoma-theme",
      )?.value,
      settings.tone,
      "Study theme stays isolated from storefront cookie",
    );
    results.push({ engine, name, ...details });
    console.log(`PASS ${engine}/${name}`);
  } catch (error) {
    await fixture.page
      .screenshot({
        path: `${evidence}/${engine}-${name}-failure.png`,
        fullPage: true,
      })
      .catch(() => {});
    throw error;
  } finally {
    await fixture.context.close();
  }
}
try {
  const width = engine === "chromium" ? 1440 : 390;
  for (const tone of ["light", "dark"])
    await run(`core-${width}-${tone}`, { width, tone }, core);
  if (engine === "chromium")
    await run(
      "reduced-isolation",
      { width: 390, tone: "light", reducedMotion: "reduce" },
      reducedAndIsolation,
    );
} finally {
  await browser.close();
  await writeFile(
    `${evidence}/${engine}${filter ? `-${filter}` : ""}-results.json`,
    `${JSON.stringify(results, null, 2)}\n`,
  );
}
assert.ok(results.length, "At least one scenario matched");
console.log(`${results.length} homepage purchase study scenarios passed.`);
