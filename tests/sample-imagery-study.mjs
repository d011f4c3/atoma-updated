/* Local imagery study: mock catalog/cart reads, block external requests and
 * writes, and preserve real tea selection while visual concepts change. */
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
const baseURL = process.env.SAMPLE_IMAGERY_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.SAMPLE_IMAGERY_EVIDENCE ?? ".local/sample-foil-0173/browser";
const filter = process.env.SAMPLE_IMAGERY_FILTER;
const destination = { countryCode: "US", currency: "JPY" };
const options = [
  ["sachets", "Foil trio"],
  ["box", "Open set", "open-set.png"],
  ["landscape", "Powder landscape", "powder-landscape.png"],
  ["set", "Set portrait"],
  ["focus", "Focal study"],
  ["spread", "Open arrangement"],
  ["register", "Horizontal register"],
];
const products = SAMPLE_SET_CONTENTS.map((item, index) => ({
  id: item.key,
  handle: item.productHandle,
  title: item.name,
  productCode: item.productCode,
  description: "Isolated imagery study fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: ["1 kg", "200 g"].map((title, format) => ({
    id: `v1_${String.fromCharCode(97 + index + format * 3).repeat(43)}`,
    selectionId: `${item.key}-${format}`,
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

async function setup(width, tone) {
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
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      errors.push("Unexpected external request or write");
      return route.abort();
    }
    if (url.pathname === "/api/cart")
      return route.fulfill({
        json: {
          kind: "empty",
          checkoutEnabled: false,
          destination,
          destinationReviewRequired: false,
        },
      });
    if (url.pathname === "/api/destination")
      return route.fulfill({
        json: {
          kind: "ready",
          preference: {
            countryCode: destination.countryCode,
            source: "manual",
          },
          destination,
          countries: ["US", "SG"],
          reviewRequired: false,
        },
      });
    if (url.pathname === "/api/catalog")
      return route.fulfill({
        json: {
          status: "ready",
          products,
          destination,
          shopUrl: "https://example.invalid",
        },
      });
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Unexpected API ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  activePage = page;
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page, errors };
}

async function ready(page) {
  await eventually(
    async () =>
      (await page
        .locator("[data-embedded]")
        .getAttribute("data-entry-settled")) === "true",
    "The material experience is ready",
  );
  await page
    .locator('[data-homepage-product-choice="barista"]:not(:disabled)')
    .waitFor();
  await page.evaluate(() => document.fonts.ready);
}

async function fit(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "The study has no horizontal page overflow",
  );
  const stage = page.locator("[data-sample-set-imagery]");
  assert.equal(
    await stage.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    true,
    "Artwork and labels fit their stage",
  );
}

async function imageReady(image, masked = false) {
  await eventually(
    () =>
      image.evaluate(
        (node) =>
          node.complete &&
          node.naturalWidth > 0 &&
          getComputedStyle(node).opacity === "1",
      ),
    "The selected image loads completely",
  );
  if (masked)
    await eventually(
      () =>
        image.evaluate((node) => node.closest('[data-masked="true"]') !== null),
      "The powder uses its prepared mask",
    );
}

async function inspectFoilLabels(page, stage, assertOrderUnchanged) {
  assert.equal(await stage.getAttribute("data-concept"), null);
  assert.equal(await stage.locator("[data-foil-trio]").count(), 1);
  assert.equal(await stage.locator("button[data-pouch]").count(), 3);
  for (const image of await stage.locator("button[data-pouch] img").all())
    await imageReady(image);

  const first = SAMPLE_SET_CONTENTS[0];
  const opener = stage.getByRole("button", {
    name: `Inspect ${first.name} label`,
    exact: true,
  });
  await opener.scrollIntoViewIfNeeded();
  await opener.focus();
  const beforeScroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  await opener.click();
  const dialog = page.getByRole("dialog", {
    name: "ATOMA / Sample labels",
    exact: true,
  });
  await dialog.waitFor({ state: "visible" });
  assert.equal(
    await dialog.evaluate((node) => node.contains(document.activeElement)),
    true,
    "Opening a label moves keyboard focus into the modal",
  );
  const choices = dialog.getByRole("group", {
    name: "Choose a label",
    exact: true,
  });
  const choiceFor = (item) =>
    choices.getByRole("button", {
      name: `${item.productCode} ${item.name.replace(/ Matcha$/, "")}`,
      exact: true,
    });
  assert.equal(await choiceFor(first).getAttribute("aria-pressed"), "true");

  for (const item of SAMPLE_SET_CONTENTS) {
    await choiceFor(item).click();
    for (const candidate of SAMPLE_SET_CONTENTS)
      assert.equal(
        await choiceFor(candidate).getAttribute("aria-pressed"),
        String(candidate.key === item.key),
        "Exactly the inspected label is selected",
      );
    const qr = dialog.getByRole("img", {
      name: "Scan for product details",
      exact: true,
    });
    await imageReady(qr);
    assert.equal(
      await qr.getAttribute("src"),
      `/images/samples/qr/${item.key}.svg`,
      "The readable label shows the inspected matcha's QR asset",
    );
    assert.equal(
      await dialog
        .getByRole("link", { name: "Explore this matcha", exact: true })
        .getAttribute("href"),
      `/shop/${item.productHandle}`,
      "The label links to the corresponding canonical product",
    );
    assert.match(
      await dialog.innerText(),
      /All three matcha are included in your set\./,
    );
    await assertOrderUnchanged();
  }

  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.equal(
    await opener.evaluate((node) => node === document.activeElement),
    true,
    "Escape returns focus to the pouch that opened the label",
  );
  const afterScroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  assert.ok(
    Math.abs(afterScroll.x - beforeScroll.x) <= 1 &&
      Math.abs(afterScroll.y - beforeScroll.y) <= 1,
    "Inspecting labels preserves the underlying page position",
  );
  await assertOrderUnchanged();
}

async function study(page, width, tone, context) {
  await page.goto(`${baseURL}/samples-imagery-study`);
  const root = page.locator("[data-sample-imagery-study]");
  await root.waitFor();
  await ready(page);
  assert.equal(await root.getAttribute("data-tone"), tone);
  const stage = page.locator("[data-sample-set-imagery]");
  const originalStage = await stage.elementHandle();
  const originalTea = await page.locator("[data-tea-material]").elementHandle();
  const barista = page.locator('[data-homepage-product-choice="barista"]');
  await barista.click();
  const shop = page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name: "Shop", exact: true });
  await shop.click();
  const order = page.locator("[data-shop-exploration]");
  const format = order.getByLabel("Format", { exact: true });
  const formatId = products.find((item) => item.id === "barista").variants[1]
    .id;
  await format.selectOption(formatId);
  await order
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  await page.locator('button[data-sample-entry-point="selection"]').click();
  await stage.waitFor({ state: "visible" });
  async function assertOrderUnchanged() {
    assert.equal(
      await page.locator("[data-embedded]").getAttribute("data-mode"),
      "builder",
    );
    assert.equal(
      (
        await order.getByLabel("Quantity", { exact: true }).textContent()
      ).trim(),
      "2",
      "Inspecting imagery retains the selected quantity",
    );
    assert.equal(
      await format.inputValue(),
      formatId,
      "Inspecting imagery retains the selected tea format",
    );
  }
  for (const [variant, name, asset] of options) {
    const option = root
      .getByRole("group", { name: "Sample imagery direction", exact: true })
      .getByRole("button", { name, exact: true });
    await option.focus();
    await page.keyboard.press("Enter");
    await eventually(
      async () => (await stage.getAttribute("data-variant")) === variant,
      "The selected visual direction is shown",
    );
    assert.equal(await option.getAttribute("aria-pressed"), "true");
    assert.equal(
      await stage.evaluate(
        (node, original) => node === original,
        originalStage,
      ),
      true,
      "Changing a concept retains the imagery root",
    );
    assert.equal(
      await page
        .locator("[data-tea-material]")
        .evaluate((node, original) => node === original, originalTea),
      true,
      "Changing a concept retains the tea renderer",
    );
    assert.equal(
      await page
        .locator("[data-tea-material]")
        .evaluate((node) => getComputedStyle(node).opacity),
      "0",
      "The hidden tea renderer cannot paint a bag or label behind set artwork",
    );
    await assertOrderUnchanged();
    if (variant === "sachets") {
      await inspectFoilLabels(page, stage, assertOrderUnchanged);
      await stage.screenshot({
        path: resolve(evidence, `${activeName}-${variant}.png`),
        animations: "disabled",
      });
    } else if (asset) {
      assert.equal(await stage.getAttribute("data-concept"), "true");
      const active = stage.locator(`[data-concept-image="${variant}"]`);
      await eventually(
        () => active.evaluate((node) => getComputedStyle(node).opacity === "1"),
        "The selected artwork becomes visible",
      );
      const image = active.locator("img");
      await imageReady(image);
      assert.ok(
        (await image.getAttribute("src")).includes(encodeURIComponent(asset)) ||
          (await image.getAttribute("src")).includes(asset),
      );
      assert.equal(
        await image.evaluate((node) => getComputedStyle(node).objectFit),
        "contain",
        "Concept images preserve their complete composition",
      );
      assert.match(await image.getAttribute("alt"), /Generated/);
      const copy = (await stage.innerText()).toLowerCase();
      assert.ok(
        copy.includes(
          variant === "landscape"
            ? "generated illustration"
            : "packaging concept",
        ),
      );
      assert.ok(
        copy.includes(
          variant === "landscape"
            ? "not an exact tea photograph"
            : "unconfirmed",
        ),
      );
      await stage.scrollIntoViewIfNeeded();
      await fit(page);
      await stage.screenshot({
        path: resolve(evidence, `${activeName}-${variant}.png`),
        animations: "disabled",
      });
      await page.screenshot({
        path: resolve(evidence, `${activeName}-${variant}-context.png`),
        animations: "disabled",
      });
    } else {
      assert.equal(await stage.getAttribute("data-concept"), null);
      for (const image of await stage
        .locator("[data-sample-set-material] img")
        .all())
        await imageReady(image, true);
      if (variant === "focus") {
        await stage
          .getByRole("button", { name: "UJI-00 Barista", exact: true })
          .click();
        assert.equal(await stage.getAttribute("data-preview"), "barista");
      }
    }
    await assertOrderUnchanged();
    await fit(page);
    console.log(`${activeName}/${variant}: passed`);
  }
  await page.locator('[data-homepage-product-choice="barista"]').click();
  await eventually(
    async () => (await shop.getAttribute("aria-pressed")) === "true",
    "Leaving the study artwork restores the previous tea view",
  );
  assert.equal(await barista.getAttribute("aria-pressed"), "true");
  assert.equal(await format.inputValue(), formatId);
  assert.equal(
    (await order.getByLabel("Quantity", { exact: true }).textContent()).trim(),
    "2",
  );
  assert.equal(
    (await context.cookies()).find((cookie) => cookie.name === "atoma-theme")
      ?.value,
    tone,
  );

  await page.goto(`${baseURL}/`);
  await page
    .getByRole("button", {
      name: "Explore matcha from the silver bag",
      exact: true,
    })
    .click();
  await ready(page);
  assert.equal(
    await stage.getAttribute("data-variant"),
    "sachets",
    "Canonical homepage adopts the approved interactive foil trio",
  );
  assert.equal(await stage.getAttribute("data-concept"), null);
  assert.equal(
    await stage.locator("[data-concept-image]").count(),
    0,
    "Unselected packaging concepts remain confined to the study",
  );
  assert.equal(await stage.locator("[data-foil-trio]").count(), 1);
  assert.equal(await stage.locator("button[data-pouch]").count(), 3);
  await fit(page);
}

try {
  for (const [width, tone] of [
    [1440, "light"],
    [390, "dark"],
  ]) {
    activeName = `${width}-${tone}`;
    if (filter && !activeName.includes(filter)) continue;
    const fixture = await setup(width, tone);
    await study(fixture.page, width, tone, fixture.context);
    assert.deepEqual(
      fixture.errors,
      [],
      "No page errors, external requests or writes",
    );
    await fixture.context.close();
    console.log(`${activeName}: continuity and canonical boundary passed`);
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
