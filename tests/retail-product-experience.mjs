/* Canonical product buying and learning: exact catalog fixtures, no live writes. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { createHeroStudyFixture } from "./hero-cx-fixtures.mjs";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.RETAIL_PRODUCT_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.RETAIL_PRODUCT_EVIDENCE ?? ".local/product-0265/tests";
const requested = process.env.RETAIL_PRODUCT_CASES?.split(",").filter(Boolean);
const identity = SAMPLE_SET_CONTENTS.find((item) => item.key === "culinary");
const route = `/shop/${identity.productHandle}`;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
const geometries = [];
await mkdir(evidence, { recursive: true });

const main = (page) =>
  page.locator(`[data-retail-product="${identity.productHandle}"]`);
const purchase = (page) => main(page).locator("[data-retail-purchase]");
const controls = (page) =>
  purchase(page).locator("[data-retail-purchase-controls]");
const add = (page) => purchase(page).locator("button[data-pending]");
const quantity = (page) => purchase(page).locator("output");
const learning = (page) =>
  main(page).locator("[data-retail-product-information]");
const learningToggle = (page) =>
  main(page).locator("[data-retail-learning-toggle]");
const mobilePrice = (page) =>
  controls(page).locator("[data-retail-mobile-price]");
const tab = (page, name) =>
  learning(page).locator(`[data-retail-learning-tab="${name}"]`);
const panel = (page, name) =>
  learning(page).locator(`[data-retail-learning-panel="${name}"]`);

async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function ready(page, path = route, available = true) {
  await page.goto(`${baseURL}${path}`);
  await page.locator("[data-retail-product]").waitFor();
  if (available !== null) {
    await add(page).waitFor();
    await eventually(
      async () => (await add(page).isEnabled()) === available,
      "Published purchase state settles before inspection",
    );
  }
  await page.evaluate(() => document.fonts.ready);
}

async function noOverflow(page) {
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "The product page needs no horizontal scrolling",
  );
  for (const region of [controls(page), learning(page)])
    if ((await region.count()) && (await region.isVisible()))
      assert.ok(
        await region.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1,
        ),
        "Ordering and learning fit their content width",
      );
}

async function capture(page, label) {
  await page.addStyleTag({
    content:
      "nextjs-portal { display: none !important; } * { caret-color: transparent !important; }",
  });
  await page.evaluate(async () => {
    await Promise.all(
      [...document.images]
        .filter((image) => {
          const bounds = image.getBoundingClientRect();
          return (
            bounds.width &&
            bounds.height &&
            bounds.top < innerHeight &&
            bounds.bottom > 0
          );
        })
        .map((image) => image.decode().catch(() => {})),
    );
  });
  await page.screenshot({
    path: `${evidence}/${label}.png`,
    animations: "disabled",
  });
}

async function firstView(page, label) {
  const box = await add(page).boundingBox();
  const viewport = page.viewportSize();
  assert.ok(
    box && box.y >= 0 && box.y + box.height <= viewport.height + 1,
    `${label}: Add to cart is available in the first viewport without scrolling`,
  );
  assert.equal(await page.evaluate(() => scrollY), 0);
  assert.equal(await main(page).locator("h1:visible").count(), 1);
  assert.equal(await controls(page).isVisible(), true);
  assert.ok(box.width >= 44 && box.height >= 44);
  const profile = await (
    viewport.width <= 760 ? learningToggle(page) : learning(page)
  ).boundingBox();
  if (viewport.width <= 760) {
    assert.equal(await learning(page).isVisible(), false);
    assert.equal(
      await learningToggle(page).getAttribute("aria-expanded"),
      "false",
    );
    assert.ok(
      profile.y >= box.y + box.height - 1,
      "Mobile purchase is followed by optional focused learning",
    );
  } else assert.equal(await learningToggle(page).isVisible(), false);
  const image = main(page)
    .locator(
      "[data-product-application-cutout], [data-product-application-image]",
    )
    .first();
  assert.equal(
    await image.isVisible(),
    true,
    "A complete application visual still introduces the product",
  );
  await noOverflow(page);
  geometries.push({
    label,
    viewport,
    add: box,
    learning: profile,
    image: await image.boundingBox(),
  });
  await capture(page, label);
}

async function focusLearning(page) {
  await openLearning(page);
  await tab(page, "profile").scrollIntoViewIfNeeded();
  const top = await tab(page, "profile").evaluate(
    (node) => node.getBoundingClientRect().top + scrollY,
  );
  await page.evaluate(
    (position) =>
      scrollTo({ top: Math.max(0, position - 120), behavior: "instant" }),
    top,
  );
  return page.evaluate(() => scrollY);
}

async function openLearning(page) {
  if (
    page.viewportSize().width <= 760 &&
    (await learningToggle(page).getAttribute("aria-expanded")) === "false"
  )
    await learningToggle(page).click();
  assert.equal(await learning(page).isVisible(), true);
}

async function singleMobilePrice(page, expected, count = 1) {
  assert.equal(await mobilePrice(page).innerText(), expected);
  assert.equal(
    await controls(page).locator("[data-retail-secondary-total]").isVisible(),
    false,
    "Mobile ordering has no second Total price",
  );
  assert.equal(
    (await controls(page).innerText()).match(/¥/g)?.length,
    1,
    "Exactly one monetary amount is visible across the purchase controls",
  );
  if (count > 1)
    assert.match(
      await controls(page).innerText(),
      new RegExp(`Total · ${count} × 1 kg`),
    );
}

async function inspectControls(page, scope) {
  for (const control of await scope
    .locator("button:visible, summary:visible, select:visible")
    .all()) {
    await control.scrollIntoViewIfNeeded();
    const box = await control.boundingBox();
    const width = page.viewportSize().width;
    assert.ok(
      box && box.width >= 44 && box.height >= 44,
      "Interactive targets remain usable",
    );
    assert.ok(
      box.x >= -1 && box.x + box.width <= width + 1,
      "Controls fit the screen width",
    );
  }
}

function catalog({ soldOut = false, missingKilogram = false } = {}) {
  return {
    status: "ready",
    shopUrl: "https://example.invalid",
    products: SAMPLE_SET_CONTENTS.map((item, index) => ({
      id: item.key,
      handle: item.productHandle,
      title: item.name,
      productCode: item.productCode,
      description: "Isolated product-page browser fixture.",
      imageUrl: null,
      imageAlt: "",
      productUrl: null,
      isFixture: true,
      variants: [
        ...(item.key === "culinary"
          ? [
              {
                id: `v1_${"x".repeat(43)}`,
                title: "100 g",
                available: !soldOut,
                priceMinor: 1500,
                currency: "JPY",
                options: [{ name: "Size", value: "100 g" }],
                minimum: 1,
                maximum: 4,
                increment: 1,
              },
            ]
          : []),
        ...(!(item.key === "culinary" && missingKilogram)
          ? [
              {
                id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
                title: "1 kg",
                available: item.key !== "culinary" || !soldOut,
                priceMinor: 6000 + index * 1000,
                currency: "JPY",
                options: [{ name: "Size", value: "1 kg" }],
                minimum: 1,
                maximum: 4,
                increment: 1,
              },
            ]
          : []),
      ],
    })),
  };
}

async function run(label, width, height, tone, locale, options, callback) {
  if (requested && !requested.includes(label)) return;
  const fixture = await createHeroStudyFixture(
    browser,
    baseURL,
    width,
    tone,
    locale,
    options,
  );
  await fixture.page.setViewportSize({ width, height });
  try {
    await callback(fixture);
    assert.deepEqual(fixture.errors, [], `${label}: no client errors`);
    assert.deepEqual(fixture.writes, [], `${label}: no live commerce writes`);
    results.push(label);
    console.log(`Retail product passed: ${label}`);
  } catch (error) {
    await fixture.page.screenshot({ path: `${evidence}/${label}-failure.png` });
    throw error;
  } finally {
    fixture.release();
    await fixture.context.close();
  }
}

try {
  for (const [width, height, tone] of [
    [1440, 900, "light"],
    [1280, 720, "dark"],
    [390, 844, "light"],
    [390, 844, "dark"],
  ]) {
    const label = `first-view-${width}-${tone}`;
    await run(label, width, height, tone, "en", {}, async ({ page }) => {
      await ready(page);
      await firstView(page, label);
      assert.equal(await main(page).getAttribute("data-tone"), tone);
      await openLearning(page);
      assert.equal(await learning(page).getByRole("tablist").count(), 1);
      assert.equal(
        await learning(page).getByRole("tabpanel").count(),
        1,
        "One focused learning panel is shown at a time",
      );
      assert.equal(
        await panel(page, "profile")
          .locator("[data-retail-profile-property]")
          .count(),
        7,
      );
      assert.equal(
        await learning(page).locator("details details").count(),
        0,
        "Learning does not require nested disclosure navigation",
      );
    });
  }

  await run(
    "mobile-simple-purchase",
    390,
    700,
    "dark",
    "en",
    {},
    async ({ page }) => {
      await ready(page, `${route}?format=1kg`);
      await firstView(page, "mobile-simple-purchase-dark");
      await singleMobilePrice(page, "¥8,000");
      assert.equal(
        await controls(page).locator("details").count(),
        0,
        "Unavailable subscription cards are not presented as purchase choices",
      );
      await main(page)
        .getByRole("button", { name: "Powder", exact: true })
        .click();
      assert.equal(
        await main(page)
          .locator("[data-retail-imagery]")
          .getAttribute("data-retail-imagery"),
        "material",
      );
      await main(page)
        .getByRole("button", { name: "In use", exact: true })
        .click();
      assert.equal(
        await main(page)
          .locator("[data-retail-imagery]")
          .getAttribute("data-retail-imagery"),
        "application",
      );
      await purchase(page)
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await singleMobilePrice(page, "¥16,000", 2);
      await openLearning(page);
      await tab(page, "preparation").click();
      await learningToggle(page).click();
      assert.equal(await learning(page).isVisible(), false);
      await openLearning(page);
      assert.equal(
        await tab(page, "preparation").getAttribute("aria-selected"),
        "true",
        "Closing product details retains the chosen learning view",
      );
      await learningToggle(page).click();
      assert.equal(await quantity(page).textContent(), "2");
      await singleMobilePrice(page, "¥16,000", 2);
      await page.evaluate(() => scrollTo(0, 0));
      await capture(page, "mobile-simple-purchase-quantity-two");
    },
  );

  await run(
    "mobile-purchase-options",
    390,
    700,
    "light",
    "en",
    {},
    async ({ page, context }) => {
      const offer = catalog();
      const kilogram = offer.products
        .find((item) => item.handle === identity.productHandle)
        .variants.find((item) => item.title === "1 kg");
      kilogram.sellingPlans = [
        {
          id: `v1_${"s".repeat(43)}`,
          name: "Every 4 weeks",
          description: null,
          deliveryInterval: "week",
          deliveryIntervalCount: 4,
          priceMinor: 7200,
          currency: "JPY",
          available: true,
        },
      ];
      await context.route("**/api/catalog", (request) =>
        request.fulfill({ json: offer }),
      );
      await ready(page, `${route}?format=1kg`);
      const disclosure = controls(page).locator("details");
      const summary = disclosure.locator("summary");
      const indicator = summary.locator("span[aria-hidden=true]");
      const glyph = () =>
        indicator.evaluate((node) =>
          getComputedStyle(node, "::after").content.replaceAll('"', ""),
        );
      assert.equal(await disclosure.getAttribute("open"), null);
      assert.equal(await disclosure.locator("fieldset").isVisible(), false);
      assert.equal(await glyph(), "+");
      await summary.click();
      assert.equal(await disclosure.locator("fieldset").isVisible(), true);
      assert.equal(await glyph(), "−");
      const recurring = disclosure.getByRole("radio", {
        name: "Subscribe · Every 4 weeks",
        exact: true,
      });
      await recurring.locator("..").click();
      assert.equal(await recurring.isChecked(), true);
      await summary.click();
      assert.equal(
        await disclosure.locator("fieldset").isVisible(),
        false,
        "Collapsed purchase options hide their cards and subscription terms",
      );
      assert.equal(await glyph(), "+");
      await singleMobilePrice(page, "¥7,200");
      await purchase(page)
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await singleMobilePrice(page, "¥14,400", 2);
      await summary.click();
      assert.equal(
        await recurring.isChecked(),
        true,
        "Disclosure toggling and quantity edits preserve the selected selling plan",
      );
      assert.equal(await glyph(), "−");
      await summary.click();
      await noOverflow(page);
    },
  );

  await run(
    "learning-and-origins",
    1440,
    900,
    "dark",
    "en",
    {},
    async ({ page }) => {
      await ready(page);
      await purchase(page)
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await purchase(page)
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      assert.equal(await quantity(page).textContent(), "3");
      const scroll = await focusLearning(page);
      const property = panel(page, "profile").locator(
        '[data-retail-profile-property="0"]',
      );
      await property.click();
      assert.equal(await property.getAttribute("aria-pressed"), "true");
      const target = await property.getAttribute("aria-controls");
      assert.equal(await page.locator(`[id="${target}"]`).isVisible(), true);
      assert.ok(
        Math.abs((await page.evaluate(() => scrollY)) - scroll) < 2,
        "Reading a property does not jump the page",
      );
      await tab(page, "profile").focus();
      await page.keyboard.press("ArrowRight");
      assert.equal(
        await tab(page, "preparation").getAttribute("aria-selected"),
        "true",
      );
      assert.equal(await panel(page, "preparation").isVisible(), true);
      assert.ok(
        Math.abs((await page.evaluate(() => scrollY)) - scroll) < 2,
        "Changing learning views keeps the reading position",
      );
      await page.keyboard.press("End");
      assert.equal(
        await tab(page, "origin").getAttribute("aria-selected"),
        "true",
      );
      assert.match(await panel(page, "origin").innerText(), /Tea designation/i);
      assert.doesNotMatch(
        await panel(page, "origin").innerText(),
        /Grown in Wazuka/,
      );
      const origin = panel(page, "origin").getByRole("button", {
        name: "All origins",
        exact: true,
      });
      await origin.scrollIntoViewIfNeeded();
      const originScroll = await page.evaluate(() => scrollY);
      await origin.click();
      const reader = page.getByRole("dialog", {
        name: "ATOMA Origins",
        exact: true,
      });
      await reader.waitFor();
      await reader
        .getByRole("button", { name: "Return to Culinary Matcha", exact: true })
        .first()
        .click();
      await reader.waitFor({ state: "hidden" });
      await eventually(
        () => origin.evaluate((node) => node === document.activeElement),
        "Origins returns focus to the same learning action",
      );
      assert.ok(
        Math.abs((await page.evaluate(() => scrollY)) - originScroll) < 2,
      );
      assert.equal(await quantity(page).textContent(), "3");
      assert.equal(
        await tab(page, "origin").getAttribute("aria-selected"),
        "true",
      );
      await tab(page, "profile").click();
      assert.equal(
        await property.getAttribute("aria-pressed"),
        "true",
        "Learning choices survive an Origins visit",
      );
      await capture(page, "learning-profile");
    },
  );

  await run(
    "mobile-learning-position",
    390,
    844,
    "light",
    "en",
    {},
    async ({ page }) => {
      await ready(page);
      const scroll = await focusLearning(page);
      const property = panel(page, "profile").locator(
        '[data-retail-profile-property="6"]',
      );
      await property.tap();
      assert.equal(await property.getAttribute("aria-pressed"), "true");
      assert.ok(
        Math.abs((await page.evaluate(() => scrollY)) - scroll) < 2,
        "Touching a profile value retains the mobile reading position",
      );
      for (const name of ["preparation", "origin", "profile"]) {
        await tab(page, name).tap();
        assert.equal(await panel(page, name).isVisible(), true);
        assert.ok(
          Math.abs((await page.evaluate(() => scrollY)) - scroll) < 2,
          `Mobile ${name} learning retains the reading position`,
        );
      }
      await capture(page, "mobile-learning-profile");
    },
  );

  await run(
    "exact-format-purchase",
    390,
    844,
    "light",
    "en",
    { holdMutation: true },
    async (test) => {
      const { page, context } = test;
      await context.route("**/api/catalog", (request) =>
        request.fulfill({ json: catalog() }),
      );
      await ready(page, `${route}?format=1kg`);
      const formats = purchase(page).getByRole("group", {
        name: "Format",
        exact: true,
      });
      assert.equal(
        await formats
          .getByRole("button", { name: "1 kg", exact: true })
          .getAttribute("aria-pressed"),
        "true",
        "An exact 1 kg link never silently chooses a smaller offer",
      );
      await purchase(page)
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await purchase(page)
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await add(page).click();
      await eventually(
        () => test.simulatedWrites.length === 1,
        "The purchase remains inside the isolated adapter",
      );
      assert.equal(
        test.simulatedWrites[0].productHandle,
        identity.productHandle,
      );
      assert.equal(test.simulatedWrites[0].variantKey, `v1_${"c".repeat(43)}`);
      assert.equal(test.simulatedWrites[0].quantity, 3);
      assert.equal(await add(page).isDisabled(), true);
      assert.equal(
        await purchase(page)
          .getByRole("button", { name: "Increase quantity", exact: true })
          .isDisabled(),
        true,
      );
      for (const format of await formats.getByRole("button").all())
        assert.equal(await format.isDisabled(), true);
      test.releaseMutation();
      await eventually(
        () => add(page).isEnabled(),
        "A settled attempt releases the purchase controls",
      );
      assert.equal(await quantity(page).textContent(), "3");
      assert.equal(await purchase(page).getByRole("alert").count(), 1);
    },
  );

  await run(
    "unavailable-and-exact-format",
    390,
    844,
    "dark",
    "en",
    {},
    async ({ context, page }) => {
      await context.route("**/api/catalog", (request) =>
        request.fulfill({ json: catalog({ soldOut: true }) }),
      );
      await ready(page, route, false);
      assert.equal(await add(page).isDisabled(), true);
      assert.equal(
        await purchase(page)
          .getByRole("button", { name: "Increase quantity", exact: true })
          .isDisabled(),
        true,
      );
      await focusLearning(page);
      await tab(page, "preparation").click();
      assert.equal(
        await panel(page, "preparation").isVisible(),
        true,
        "Unavailable products remain learnable",
      );
      await context.unroute("**/api/catalog");
      await context.route("**/api/catalog", (request) =>
        request.fulfill({ json: catalog({ missingKilogram: true }) }),
      );
      await ready(page, `${route}?format=1kg`, false);
      await page
        .locator('[data-requested-format-unavailable="true"]')
        .waitFor();
      assert.equal(
        await add(page).isDisabled(),
        true,
        "A missing exact offer cannot fall back silently",
      );
      await purchase(page)
        .getByRole("button", { name: "100 g", exact: true })
        .click();
      assert.equal(
        await add(page).isEnabled(),
        true,
        "A buyer may explicitly choose another published offer",
      );
      await ready(page, "/shop/not-in-the-current-catalog", null);
      await page.locator("[data-product-not-found]").waitFor();
      assert.equal(
        await page.locator("[data-retail-purchase]").count(),
        0,
        "An unknown product URL never borrows another tea's purchase form",
      );
    },
  );

  await run(
    "japanese-enlarged",
    320,
    568,
    "dark",
    "ja",
    {},
    async ({ page }) => {
      await ready(page);
      await page.addStyleTag({
        content: "html { font-size: 200% !important; }",
      });
      await noOverflow(page);
      await inspectControls(page, purchase(page));
      assert.ok(
        await mobilePrice(page).evaluate((node) => {
          const range = document.createRange();
          range.selectNodeContents(node);
          return (
            range.getBoundingClientRect().height <=
            Number.parseFloat(getComputedStyle(node).lineHeight) + 1
          );
        }),
        "The enlarged order total stays on one readable line",
      );
      await capture(page, "japanese-order-enlarged");
      await focusLearning(page);
      await inspectControls(page, learning(page).getByRole("tablist"));
      for (const name of ["profile", "preparation", "origin"]) {
        await tab(page, name).click();
        assert.equal(await panel(page, name).isVisible(), true);
        await noOverflow(page);
        if (name === "profile") await inspectControls(page, panel(page, name));
      }
      await tab(page, "preparation").click();
      await capture(page, "japanese-learning-enlarged");
    },
  );
} finally {
  await writeFile(
    `${evidence}/results.json`,
    `${JSON.stringify({ results, geometries }, null, 2)}\n`,
  );
  await browser.close();
}
