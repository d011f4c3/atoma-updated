/* Material-led application poster. Every commerce request stays in isolated fixtures. */
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
const baseURL = process.env.NEW_HERO4_BASE_URL ?? "http://127.0.0.1:3100";
const evidence = process.env.NEW_HERO4_EVIDENCE ?? ".local/new-hero-0237";
const url = `${baseURL}/new-hero4`;
const pageRoot = (page) => page.locator("[data-new-hero4]");
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
const profiles = process.env.NEW_HERO4_PROFILES?.split(",").filter(Boolean) ?? [
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
    "All three products expose current catalog controls",
  );
}

async function nativeEntries(page, locale) {
  assert.equal(
    await page.locator("[data-new-hero4-samples]").getAttribute("href"),
    "/samples",
  );
  assert.equal(
    await page.locator("[data-new-hero4-explore]").getAttribute("href"),
    "#hero4-applications",
  );
  assert.ok(
    (await page.locator("[data-new-hero4-samples]").textContent()).includes(
      translate(locale, "Start with the Sample Set"),
    ),
  );
  for (const identity of SAMPLE_SET_CONTENTS) {
    const product = card(page, identity.key);
    const jump = page.locator(`[data-new-hero4-jump="${identity.key}"]`);
    assert.equal(await jump.getAttribute("href"), `#new-hero4-${identity.key}`);
    const link = product.locator("[data-new-hero-product-link]");
    assert.equal(await product.getAttribute("id"), `new-hero4-${identity.key}`);
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
    const reorder = page.locator(`[data-new-hero4-reorder="${identity.key}"]`);
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
  await page.locator("main img").evaluateAll(async (images) => {
    await Promise.all(
      images.map(async (image) => {
        image.loading = "eager";
        await image.decode().catch(() => {});
      }),
    );
  });
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
  assert.equal(
    (await pageRoot(page).locator("h1").textContent())
      .replace(/\s+/g, " ")
      .trim(),
    translate(locale, "Matcha for the way you make it."),
    "The hero retains the complete positioning in a single heading",
  );
  assert.equal(await page.locator("[data-new-hero4-hero]").count(), 1);
  assert.equal(await page.locator("[data-new-hero4-material]").count(), 1);
  assert.ok(
    (await page.locator("[data-new-hero4-hero]").textContent()).includes(
      translate(locale, "AI material reference"),
    ),
    "The illustrative material is labelled",
  );
  assert.equal(
    await page
      .locator('[data-new-hero-products][data-presentation="counter"]')
      .count(),
    1,
  );
  assert.deepEqual(
    await page
      .locator("[data-new-hero4-section]")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.dataset.newHero4Section),
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
    "Headings, product names, codes and prices fit",
  );
  const appearance = await pageRoot(page).evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      ink: style.color,
      surface: style.getPropertyValue("--color-surface").trim(),
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
    "Established mono typography",
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
      sample: bounds("[data-new-hero4-samples]"),
      explore: bounds("[data-new-hero4-explore]"),
    };
  });
  for (const bounds of [geometry.sample, geometry.explore]) {
    assert.ok(
      bounds.bottom <= geometry.viewportHeight,
      "Both main entries fit the first viewport",
    );
    if (width <= 760)
      assert.ok(bounds.height >= 44, "Main touch entries are at least 44px");
  }
  for (const identity of SAMPLE_SET_CONTENTS) {
    const jump = page.locator(`[data-new-hero4-jump="${identity.key}"]`);
    assert.equal(await jump.isVisible(), true);
    if (width <= 760)
      assert.ok(
        (await jump.boundingBox()).height >= 44,
        "Application entries are at least 44px on phones",
      );
  }
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
        .locator(
          "[data-new-hero-format],[data-new-hero-add] button,button[aria-label]",
        )
        .all()) {
        assert.ok(
          (await control.boundingBox()).height >= 44,
          "Commerce touch controls are at least 44px",
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
        "Mobile product prose is at least 16px",
      );
    }
  }
  const sampleSection = page.locator('[data-new-hero4-section="samples"]');
  await sampleSection.scrollIntoViewIfNeeded();
  for (const identity of SAMPLE_SET_CONTENTS) {
    const item = sampleSection
      .locator("li")
      .filter({ hasText: translate(locale, identity.name) });
    assert.ok((await item.textContent()).includes(`${identity.grams} g`));
    const pouch = sampleSection.locator(`[data-pouch="${identity.key}"]`);
    for (const element of [pouch, pouch.locator('img[alt=""]')]) {
      const bounds = await element.boundingBox();
      assert.ok(
        bounds && bounds.width >= 44 && bounds.height >= 44,
        "Every sample pouch has useful rendered bounds",
      );
    }
  }
  assert.equal(
    await sampleSection.evaluate((section) => {
      const entry = section.querySelector('a[href="/samples"]');
      const inspection = section.querySelector("[data-pouch]");
      return Boolean(
        entry &&
        inspection &&
        entry.compareDocumentPosition(inspection) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }),
    true,
    "The Sample Set entry precedes label inspection in reading order",
  );
  await sampleSection.locator('a[href="/samples"]').focus();
  await page.keyboard.press("Tab");
  assert.equal(
    await sampleSection
      .locator("[data-pouch]")
      .first()
      .evaluate((node) => document.activeElement === node),
    true,
    "Keyboard traversal reaches sample purchase before optional inspection",
  );
  return { ...geometry, ...appearance };
}

await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const measurements = [];
async function fixture(profile, options, run) {
  const [rawWidth, tone, ...localeParts] = profile.split("-");
  const width = Number(rawWidth);
  const locale = localeParts.join("-");
  const test = await createHeroStudyFixture(
    browser,
    baseURL,
    width,
    tone,
    locale,
    options,
  );
  try {
    await test.page.goto(url, {
      waitUntil: options.holdScripts ? "commit" : "domcontentloaded",
    });
    if (!options.holdScripts) await ready(test.page);
    await run(test, { width, tone, locale });
    assert.deepEqual(
      test.errors,
      [],
      "No client or unexpected external request errors",
    );
    assert.deepEqual(test.writes, [], "No commerce writes reach the server");
  } finally {
    test.release();
    await test.context.close();
  }
}

try {
  for (const profile of profiles) {
    await fixture(profile, {}, async ({ page }, { width, tone, locale }) => {
      measurements.push({
        profile,
        ...(await layout(page, width, tone, locale)),
      });
      await capture(page, profile);
      await page.locator("[data-new-hero4-explore]").click();
      assert.equal(new URL(page.url()).hash, "#hero4-applications");
      await eventually(async () => {
        const bounds = await page.locator("#hero4-applications").boundingBox();
        return bounds.y >= 0 && bounds.y < 160;
      }, "Application entry reaches product buying controls");
      for (const identity of SAMPLE_SET_CONTENTS) {
        await page.locator(`[data-new-hero4-jump="${identity.key}"]`).click();
        assert.equal(new URL(page.url()).hash, `#new-hero4-${identity.key}`);
        await eventually(async () => {
          const bounds = await card(page, identity.key).boundingBox();
          return bounds.y >= 0 && bounds.y < 160;
        }, "Each application entry reaches its own purchasing controls");
      }
    });
    console.log(`New hero 4 layout, palette and entries: ${profile}`);
  }

  await fixture("390-light-en", { holdScripts: true }, async (test) => {
    const { page } = test;
    await pageRoot(page).waitFor();
    await eventually(
      () => test.scriptRequests() > 0,
      "Hydration scripts are held",
    );
    await nativeEntries(page, "en");
    assert.equal(test.catalogReads(), 0);
    assert.equal(await page.locator("header details[open]").count(), 0);
    await page.locator("[data-new-hero4-explore]").click();
    assert.equal(new URL(page.url()).hash, "#hero4-applications");
    await page.locator('[data-new-hero4-jump="barista"]').click();
    assert.equal(new URL(page.url()).hash, "#new-hero4-barista");
    test.releaseScripts();
    await ready(page);
  });
  console.log(
    "Native sample, application and exact product links before hydration",
  );

  await fixture("390-light-en", {}, async (test) => {
    const { page } = test;
    await increase(page, "barista").click();
    assert.equal(await quantity(page, "barista").textContent(), "2");
    const reads = test.catalogReads();
    await page.locator("footer [data-theme-switcher]").click();
    assert.equal(await pageRoot(page).getAttribute("data-tone"), "dark");
    await page.locator("footer [data-language-switcher]").selectOption("ja");
    assert.equal(await quantity(page, "barista").textContent(), "2");
    assert.equal(test.catalogReads(), reads);
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
    await page.locator('[data-new-hero4-reorder="culinary"]').click();
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
      "Repeat-order entry selects the named one-kilogram product",
    );
  });
  console.log(
    "Theme/locale continuity, product handoff, Back and exact 1 kg repeat order",
  );

  await fixture("390-dark-en", { holdMutation: true }, async (test) => {
    const { page } = test;
    await increase(page, "culinary").click();
    await add(page, "culinary").click();
    await eventually(
      () => test.simulatedWrites.length === 1,
      "Explicit add reaches isolated fixture",
    );
    assert.deepEqual(test.simulatedWrites[0], {
      action: "add",
      productHandle: SAMPLE_SET_CONTENTS[2].productHandle,
      variantKey: `v1_${"c".repeat(43)}`,
      quantity: 2,
    });
    for (const identity of SAMPLE_SET_CONTENTS)
      assert.equal(await add(page, identity.key).isDisabled(), true);
    const heldURL = page.url();
    for (const selector of [
      "[data-new-hero4-samples]",
      "[data-new-hero4-explore]",
      '[data-new-hero4-reorder="ceremonial"]',
      '[data-new-hero4-jump="barista"]',
      '[data-new-hero-product="ceremonial"] [data-new-hero-product-link]',
    ]) {
      await page.locator(selector).evaluate((node) => node.click());
    }
    assert.equal(
      page.url(),
      heldURL,
      "Pending cart operation locks navigation",
    );
    test.releaseMutation();
    await card(page, "culinary")
      .locator("[data-new-hero-purchase-error]")
      .waitFor();
    assert.equal(await add(page, "culinary").isEnabled(), true);
    assert.equal(
      await page.locator("[data-new-hero-purchase-error]").count(),
      1,
    );
    assert.equal(test.simulatedWrites.length, 1);
  });
  console.log(
    "Exact cart request, pending-operation locks and inline rejection recovery",
  );

  await fixture("1440-dark-en", {}, async ({ page }) => {
    assert.equal(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      true,
    );
    const link = page.locator("[data-new-hero4-samples]");
    await link.focus();
    assert.equal(
      await link.evaluate(
        (node) =>
          document.activeElement === node &&
          parseFloat(getComputedStyle(node).outlineWidth) >= 2,
      ),
      true,
    );
    await page.keyboard.press("Enter");
    await eventually(
      () => new URL(page.url()).pathname === "/samples",
      "Keyboard entry opens Sample Set",
    );
  });
  console.log("Keyboard Sample Set entry and reduced motion");

  await fixture("390-light-en", { holdImages: true }, async (test) => {
    const { page } = test;
    const material = page.locator("[data-new-hero4-material]");
    await eventually(() => test.imageRequests() > 0, "Hero imagery is held");
    assert.equal(await material.getAttribute("data-image-state"), "loading");
    await nativeEntries(page, "en");
    assert.equal(await add(page, "barista").isEnabled(), true);
    await page.locator('[data-new-hero4-jump="barista"]').click();
    assert.equal(new URL(page.url()).hash, "#new-hero4-barista");
    test.releaseImages();
    await eventually(
      async () => (await material.getAttribute("data-image-state")) === "ready",
      "Hero material resolves without gating selection",
    );
  });
  console.log(
    "Delayed hero imagery leaves application and purchase entries usable",
  );

  await fixture(
    "320-dark-en",
    { failImages: true, reducedMotion: "no-preference" },
    async ({ page }) => {
      const material = page.locator("[data-new-hero4-material]");
      await eventually(
        async () =>
          (await material.getAttribute("data-image-state")) === "failed",
        "Failed hero material exposes its fallback",
      );
      const heroFallback = page.locator("[data-new-hero4-image-fallback]");
      assert.equal(await heroFallback.isVisible(), true);
      assert.equal(
        await heroFallback.evaluate(
          (node) =>
            node.scrollWidth <= node.clientWidth &&
            node.scrollHeight <= node.clientHeight,
        ),
        true,
        "The hero fallback remains readable on the smallest phone",
      );
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
          "Mobile image fallback remains readable",
        );
        assert.equal(await add(page, identity.key).isEnabled(), true);
      }
      await nativeEntries(page, "en");
      await capture(page, "320-dark-en-image-fallback");
    },
  );
  console.log("Failed imagery does not obscure labels or buying controls");
  if (measurements.length)
    await writeFile(
      resolve(evidence, "measurements.json"),
      `${JSON.stringify(measurements, null, 2)}\n`,
    );
} finally {
  await browser.close();
}
