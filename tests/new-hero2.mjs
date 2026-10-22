/* New concept browser checks. Catalog and cart writes are isolated in memory. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { translate } from "../src/lib/i18n/index.ts";
import { getProductApplicationImage } from "../src/lib/product-application-imagery.ts";
import { createHeroStudyFixture } from "./hero-cx-fixtures.mjs";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.NEW_HERO2_BASE_URL ?? "http://127.0.0.1:3100";
const evidence = process.env.NEW_HERO2_EVIDENCE ?? ".local/new-hero-0235/hero2";
const url = `${baseURL}/new-hero2`;
const pageRoot = (page) => page.locator("[data-new-hero2]");
const card = (page, key) => page.locator(`[data-new-hero-product="${key}"]`);
const add = (page, key) =>
  card(page, key).locator("[data-new-hero-add] button");
const quantity = (page, key) =>
  card(page, key).locator("[data-new-hero-quantity]");
const increase = (page, key) =>
  card(page, key).getByRole("button", {
    name: "Increase quantity",
    exact: true,
  });
const profiles = process.env.NEW_HERO2_PROFILES?.split(",").filter(Boolean) ?? [
  "1440-light-en",
  "1440-dark-ja",
  "1200-light-en",
  "768-light-zh-Hans",
  "768-dark-zh-Hant",
  "390-light-ja",
  "390-dark-en",
  "360-light-zh-Hans",
  "320-dark-zh-Hant",
];

async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function ready(page) {
  await pageRoot(page).waitFor();
  await eventually(
    async () =>
      (await page
        .locator('[data-new-hero-product][data-catalog-state="ready"]')
        .count()) === 3 && (await add(page, "ceremonial").isEnabled()),
    "All application products have current catalog controls",
  );
}

function clean(test) {
  assert.deepEqual(test.errors, []);
  assert.deepEqual(test.writes, []);
}

async function nativeEntries(page, locale) {
  assert.equal(
    await page.locator("[data-new-hero2-samples]").getAttribute("href"),
    "/samples",
  );
  assert.equal(
    await page.locator("[data-new-hero2-explore]").getAttribute("href"),
    "#hero2-applications",
  );
  assert.ok(
    (await page.locator("[data-new-hero2-samples]").textContent()).includes(
      translate(locale, "Start with the Sample Set"),
    ),
  );
  for (const identity of SAMPLE_SET_CONTENTS) {
    const product = card(page, identity.key);
    const link = product.locator("[data-new-hero-product-link]");
    assert.equal(
      await link.getAttribute("href"),
      `/shop/${identity.productHandle}`,
    );
    assert.ok(
      (await link.textContent()).includes(translate(locale, identity.name)),
    );
    assert.ok(
      (
        await product.locator("[data-new-hero-product-code]").textContent()
      ).includes(identity.productCode),
    );
    const jump = page.locator(`[data-new-hero2-jump="${identity.key}"]`);
    const target = `#new-hero2-${identity.key}`;
    assert.equal(await jump.getAttribute("href"), target);
    assert.equal(await page.locator(target).count(), 1);
    assert.equal(await product.getAttribute("id"), target.slice(1));
    const reorder = page.locator(`[data-new-hero2-reorder="${identity.key}"]`);
    assert.equal(
      await reorder.getAttribute("href"),
      `/shop/${identity.productHandle}?format=1kg`,
    );
    assert.ok(
      (await reorder.textContent()).includes(translate(locale, identity.name)),
    );
    assert.ok((await reorder.textContent()).includes(identity.productCode));
  }
}

async function capture(page, name) {
  for (const section of await pageRoot(page).locator("main > section").all()) {
    await section.scrollIntoViewIfNeeded();
    await eventually(
      () =>
        section
          .locator("img")
          .evaluateAll((nodes) => nodes.every((node) => node.complete)),
      "Visible imagery has loaded before capture",
    );
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(evidence, `${name}-viewport.png`) });
  await page.screenshot({
    path: resolve(evidence, `${name}-page.png`),
    fullPage: true,
  });
}

async function layout(page, width, tone, locale) {
  assert.equal(await pageRoot(page).getAttribute("data-tone"), tone);
  assert.equal(await page.locator("html").getAttribute("lang"), locale);
  assert.equal(await pageRoot(page).locator("h1").count(), 1);
  assert.deepEqual(
    await page
      .locator("[data-new-hero2-section]")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.dataset.newHero2Section),
      ),
    ["applications", "samples", "origin", "supply"],
  );
  assert.equal(
    await page
      .locator('[data-hero-cx-study],[aria-label="Study controls"],canvas')
      .count(),
    0,
  );
  assert.equal(
    await pageRoot(page)
      .locator(
        "main a [data-scramble-glyph],main button [data-scramble-glyph],main p [data-scramble-glyph]",
      )
      .count(),
    0,
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "No horizontal overflow",
  );
  assert.deepEqual(
    await pageRoot(page)
      .locator(
        "h1,h2,h3,[data-new-hero-product-name],[data-new-hero-product-code],[data-new-hero-price],[data-new-hero-total]",
      )
      .evaluateAll((nodes) =>
        nodes
          .filter(
            (node) =>
              node.getClientRects().length &&
              node.scrollWidth > node.clientWidth + 1,
          )
          .map((node) => node.textContent),
      ),
    [],
    "Product labels, prices and headings do not clip",
  );
  const appearance = await pageRoot(page).evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      ink: style.color,
      surface: style.getPropertyValue("--color-surface").trim(),
      background: style.backgroundImage,
      font: style.fontFamily,
    };
  });
  assert.equal(appearance.surface, tone === "light" ? "#f1f5ef" : "#080b11");
  assert.equal(
    appearance.ink,
    tone === "light" ? "rgb(38, 59, 52)" : "rgb(233, 238, 242)",
  );
  assert.ok(
    appearance.font.includes("atomaMono"),
    "The established mono family remains applied",
  );
  await nativeEntries(page, locale);
  await page.evaluate(() => window.scrollTo(0, 0));
  const geometry = await page.evaluate(() => {
    const bounds = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, height: rect.height };
    };
    return {
      viewportHeight: innerHeight,
      sample: bounds("[data-new-hero2-samples]"),
      explore: bounds("[data-new-hero2-explore]"),
    };
  });
  assert.ok(
    geometry.sample.bottom <= geometry.viewportHeight,
    "Primary Sample Set entry fits the first viewport",
  );
  assert.ok(
    geometry.explore.bottom <= geometry.viewportHeight,
    "Application entry fits the first viewport",
  );
  for (const [index, identity] of SAMPLE_SET_CONTENTS.entries()) {
    const product = card(page, identity.key);
    const reference = getProductApplicationImage(identity.productHandle);
    await product.scrollIntoViewIfNeeded();
    assert.equal(
      await product.locator("[data-product-application-caption]").textContent(),
      translate(locale, reference.caption),
    );
    assert.ok(
      (await product.locator("[data-new-hero-price]").textContent()).startsWith(
        `¥${(6000 + index * 1000).toLocaleString("en")}`,
      ),
    );
    assert.equal(await add(page, identity.key).isEnabled(), true);
    assert.equal(
      await product.locator("[data-new-hero-product-link]").isVisible(),
      true,
    );
    if (width <= 760) {
      for (const control of await product
        .locator("[data-new-hero-format],[data-new-hero-add] button")
        .all()) {
        assert.ok(
          (await control.boundingBox()).height >= 44,
          "Commerce touch targets are at least 44px high",
        );
        assert.equal(
          await control.evaluate(
            (node) =>
              getComputedStyle(node).visibility === "visible" &&
              Number(getComputedStyle(node).opacity) > 0,
          ),
          true,
        );
      }
      assert.ok(
        await product
          .locator("p")
          .filter({ hasText: translate(locale, reference.usage) })
          .evaluate(
            (node) => parseFloat(getComputedStyle(node).fontSize) >= 16,
          ),
        "Mobile product prose remains readable at 16px",
      );
    }
  }
  const sampleSection = page.locator('[data-new-hero2-section="samples"]');
  for (const identity of SAMPLE_SET_CONTENTS) {
    const sampleItem = sampleSection
      .locator("li")
      .filter({ hasText: translate(locale, identity.name) });
    assert.ok((await sampleItem.textContent()).includes(`${identity.grams} g`));
  }
  return { ...geometry, ...appearance };
}

async function fragmentNavigation(page) {
  await page.locator("[data-new-hero2-explore]").click();
  assert.equal(new URL(page.url()).hash, "#hero2-applications");
  await eventually(async () => {
    const bounds = await page.locator("#hero2-applications").boundingBox();
    return bounds.y >= 0 && bounds.y < 160;
  }, "Application entry reaches the purchase section");
  for (const identity of SAMPLE_SET_CONTENTS) {
    await page.locator(`[data-new-hero2-jump="${identity.key}"]`).click();
    assert.equal(new URL(page.url()).hash, `#new-hero2-${identity.key}`);
    await eventually(async () => {
      const bounds = await card(page, identity.key).boundingBox();
      return bounds.y >= 0 && bounds.y < 160;
    }, "Application entrance reaches its exact product");
  }
}

await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const measurements = [];
try {
  for (const profile of profiles) {
    const [rawWidth, tone, ...localeParts] = profile.split("-");
    const width = Number(rawWidth);
    const locale = localeParts.join("-");
    const test = await createHeroStudyFixture(
      browser,
      baseURL,
      width,
      tone,
      locale,
    );
    try {
      await test.page.goto(url, { waitUntil: "domcontentloaded" });
      await ready(test.page);
      measurements.push({
        profile,
        ...(await layout(test.page, width, tone, locale)),
      });
      await capture(test.page, profile);
      await fragmentNavigation(test.page);
      clean(test);
      console.log(
        `New hero 2 layout, palette and application entries: ${profile}`,
      );
    } finally {
      test.release();
      await test.context.close();
    }
  }

  const native = await createHeroStudyFixture(
    browser,
    baseURL,
    390,
    "light",
    "en",
    { holdScripts: true },
  );
  try {
    await native.page.goto(url, { waitUntil: "commit" });
    await pageRoot(native.page).waitFor();
    await eventually(
      () => native.scriptRequests() > 0,
      "Hydration scripts are held",
    );
    await nativeEntries(native.page, "en");
    assert.equal(native.catalogReads(), 0);
    assert.equal(await native.page.locator("header details[open]").count(), 0);
    await native.page.locator("[data-new-hero2-explore]").click();
    assert.equal(new URL(native.page.url()).hash, "#hero2-applications");
    await native.page.locator('[data-new-hero2-jump="culinary"]').click();
    assert.equal(new URL(native.page.url()).hash, "#new-hero2-culinary");
    assert.ok((await card(native.page, "culinary").boundingBox()).y < 160);
    native.releaseScripts();
    await ready(native.page);
    clean(native);
  } finally {
    native.release();
    await native.context.close();
  }
  console.log("Native application, sample and product links before hydration");

  const handoff = await createHeroStudyFixture(
    browser,
    baseURL,
    390,
    "light",
    "en",
  );
  try {
    const { page } = handoff;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await ready(page);
    await increase(page, "barista").click();
    assert.equal(await quantity(page, "barista").textContent(), "2");
    const reads = handoff.catalogReads();
    await page.locator("footer [data-theme-switcher]").click();
    assert.equal(await pageRoot(page).getAttribute("data-tone"), "dark");
    await page.locator("footer [data-language-switcher]").selectOption("ja");
    assert.equal(await quantity(page, "barista").textContent(), "2");
    assert.equal(handoff.catalogReads(), reads);
    await page.locator("footer [data-language-switcher]").selectOption("en");
    await card(page, "barista").locator("[data-new-hero-product-link]").click();
    const retail = page.locator(
      `[data-retail-product="${SAMPLE_SET_CONTENTS[1].productHandle}"]`,
    );
    await retail.waitFor();
    await eventually(
      async () =>
        (await retail
          .getByRole("button", { name: "1 kg", exact: true })
          .getAttribute("aria-pressed")) === "true" &&
        (await retail
          .locator('output[aria-label="Quantity"]')
          .textContent()) === "2",
      "Selected format and quantity continue into the product page",
    );
    await page.goBack();
    await ready(page);
    assert.equal(await quantity(page, "barista").textContent(), "2");
    assert.equal(await quantity(page, "ceremonial").textContent(), "1");
    await page.locator('[data-new-hero2-reorder="culinary"]').click();
    const reordered = page.locator(
      `[data-retail-product="${SAMPLE_SET_CONTENTS[2].productHandle}"]`,
    );
    await reordered.waitFor();
    assert.equal(new URL(page.url()).searchParams.get("format"), "1kg");
    await eventually(
      async () =>
        (await reordered
          .getByRole("button", { name: "1 kg", exact: true })
          .getAttribute("aria-pressed")) === "true",
      "The named repeat-order link selects one kilogram",
    );
    clean(handoff);
  } finally {
    handoff.release();
    await handoff.context.close();
  }
  console.log(
    "Theme/locale continuity, selected product handoff, Back and exact 1 kg repeat order",
  );

  const purchase = await createHeroStudyFixture(
    browser,
    baseURL,
    390,
    "dark",
    "en",
    { holdMutation: true },
  );
  try {
    const { page } = purchase;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await ready(page);
    await increase(page, "culinary").click();
    await add(page, "culinary").click();
    await eventually(
      () => purchase.simulatedWrites.length === 1,
      "Explicit add reaches the isolated fixture",
    );
    assert.deepEqual(purchase.simulatedWrites[0], {
      action: "add",
      productHandle: SAMPLE_SET_CONTENTS[2].productHandle,
      variantKey: `v1_${"c".repeat(43)}`,
      quantity: 2,
    });
    for (const identity of SAMPLE_SET_CONTENTS)
      assert.equal(await add(page, identity.key).isDisabled(), true);
    const heldURL = page.url();
    await page
      .locator("[data-new-hero2-samples]")
      .evaluate((node) => node.click());
    await page
      .locator("[data-new-hero2-explore]")
      .evaluate((node) => node.click());
    await page
      .locator('[data-new-hero2-jump="ceremonial"]')
      .evaluate((node) => node.click());
    await page
      .locator('[data-new-hero2-reorder="ceremonial"]')
      .evaluate((node) => node.click());
    assert.equal(
      page.url(),
      heldURL,
      "The new concept respects pending cart navigation locks",
    );
    purchase.releaseMutation();
    await card(page, "culinary")
      .locator("[data-new-hero-purchase-error]")
      .waitFor();
    assert.equal(await add(page, "culinary").isEnabled(), true);
    assert.equal(purchase.simulatedWrites.length, 1);
    clean(purchase);
  } finally {
    purchase.release();
    await purchase.context.close();
  }
  console.log(
    "Exact add request, pending-operation locks and inline rejection recovery",
  );

  const keyboard = await createHeroStudyFixture(
    browser,
    baseURL,
    1440,
    "dark",
    "en",
  );
  try {
    const { page } = keyboard;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await ready(page);
    assert.equal(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      true,
    );
    const sampleLink = page.locator("[data-new-hero2-samples]");
    await sampleLink.focus();
    assert.equal(
      await sampleLink.evaluate(
        (node) =>
          document.activeElement === node &&
          parseFloat(getComputedStyle(node).outlineWidth) >= 2,
      ),
      true,
    );
    await page.keyboard.press("Enter");
    await eventually(
      () => new URL(page.url()).pathname === "/samples",
      "Keyboard activation opens the existing Sample Set flow",
    );
    clean(keyboard);
  } finally {
    keyboard.release();
    await keyboard.context.close();
  }
  console.log("Keyboard Sample Set entry and reduced motion");

  const failedImages = await createHeroStudyFixture(
    browser,
    baseURL,
    320,
    "dark",
    "en",
    { failImages: true, reducedMotion: "no-preference" },
  );
  try {
    const { page } = failedImages;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await ready(page);
    for (const identity of SAMPLE_SET_CONTENTS) {
      const product = card(page, identity.key);
      await product.scrollIntoViewIfNeeded();
      const fallback = product.locator("[data-product-application-fallback]");
      await fallback.waitFor();
      assert.equal(
        await fallback.evaluate(
          (node) =>
            node.scrollWidth <= node.clientWidth &&
            node.scrollHeight <= node.clientHeight,
        ),
        true,
        "The compact mobile image fallback fits without clipping",
      );
      assert.equal(await add(page, identity.key).isEnabled(), true);
    }
    await nativeEntries(page, "en");
    await capture(page, "320-dark-en-image-fallback");
    clean(failedImages);
  } finally {
    failedImages.release();
    await failedImages.context.close();
  }
  console.log("Failed imagery remains readable and does not block commerce");
  if (measurements.length)
    await writeFile(
      resolve(evidence, "measurements.json"),
      `${JSON.stringify(measurements, null, 2)}\n`,
    );
} finally {
  await browser.close();
}
