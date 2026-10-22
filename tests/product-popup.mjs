/* Canonical product popup: useful purchase states and continuous modal return. */
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
const baseURL = process.env.PRODUCT_POPUP_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.PRODUCT_POPUP_EVIDENCE ?? ".local/popup-0256/tests";
const requested = process.env.PRODUCT_POPUP_CASES?.split(",").filter(Boolean);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
await mkdir(evidence, { recursive: true });

const dialog = (page) => page.locator("dialog[data-canonical-popup][open]");
const product = (page) =>
  dialog(page).locator("[data-new-hero-product]:visible");
const close = (page) =>
  dialog(page).locator(
    "[data-new-hero7-product-close], [data-new-hero7-home-product-close]",
  );
const quantity = (page) => product(page).locator("[data-new-hero-quantity]");
const add = (page) => product(page).locator("[data-new-hero-add] button");
const scrollBody = (page) =>
  dialog(page).locator("[data-new-hero7-product-scroll]");

async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function ready(page, path = "/?view=matcha") {
  await page.goto(`${baseURL}${path}`);
  await page.locator("[data-hero-loader]").waitFor({ state: "detached" });
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("footer [data-theme-switcher]")].at(-1)
        ?.disabled === false,
  );
  await page.evaluate(() => document.fonts.ready);
}

async function choose(page, key = "ceremonial") {
  const trigger = page.locator(`[data-new-hero7-application="${key}"]`);
  await trigger.scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => scrollY);
  await trigger.click();
  await dialog(page).waitFor();
  assert.equal(
    await dialog(page).evaluate((node) => node.matches(":modal")),
    true,
    "Product learning opens a native modal",
  );
  assert.equal(await product(page).getAttribute("data-new-hero-product"), key);
  assert.equal(
    await dialog(page).locator("[data-new-hero7-product-back]:visible").count(),
    0,
    "The canonical popup has one clear dismissal control",
  );
  await eventually(
    () => close(page).evaluate((node) => document.activeElement === node),
    "Close receives initial focus without moving the page",
  );
  assert.ok(Math.abs((await page.evaluate(() => scrollY)) - scroll) < 2);
  return { trigger, scroll };
}

async function returned(page, entry) {
  await dialog(page).waitFor({ state: "detached" });
  await eventually(
    () => entry.trigger.evaluate((node) => node === document.activeElement),
    "Dismissal returns focus to the same application",
  );
  assert.ok(
    Math.abs((await page.evaluate(() => scrollY)) - entry.scroll) < 2,
    "Dismissal preserves the gallery scroll position",
  );
  assert.equal(new URL(page.url()).searchParams.has("application"), false);
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).overflow === "hidden",
    ),
    false,
    "Dismissal releases the popup scroll lock",
  );
}

async function withinDialog(locator, popup, message) {
  const bounds = await locator.boundingBox();
  const outer = await popup.boundingBox();
  assert.ok(bounds && outer, `${message}: visible`);
  assert.ok(
    bounds.x >= outer.x - 1 &&
      bounds.x + bounds.width <= outer.x + outer.width + 1 &&
      bounds.y >= outer.y - 1 &&
      bounds.y + bounds.height <= outer.y + outer.height + 1,
    `${message}: fits the popup`,
  );
}

async function mobileReading(page) {
  const popup = dialog(page);
  const body = scrollBody(page);
  const pageScroll = await page.evaluate(() => scrollY);
  const nestedScrollers = await body.evaluate((node) =>
    [...node.querySelectorAll("*")]
      .filter((child) => {
        const style = getComputedStyle(child);
        return (
          /auto|scroll/.test(style.overflowY) &&
          child.scrollHeight > child.clientHeight + 1
        );
      })
      .map((child) => child.getAttribute("class")),
  );
  assert.deepEqual(
    nestedScrollers,
    [],
    "Mobile learning and ordering share one scroll area",
  );
  const profile = product(page).locator('[data-popup-mobile-detail="profile"]');
  const preparation = product(page).locator(
    '[data-popup-mobile-detail="preparation"]',
  );
  assert.equal(await profile.getAttribute("open"), null);
  assert.equal(await preparation.getAttribute("open"), null);
  assert.equal(await product(page).getByRole("tablist").count(), 0);
  await profile.locator("summary").click();
  const fields = profile.locator("dl > div");
  assert.equal(
    await fields.count(),
    6,
    "The complete profile remains available",
  );
  const purchase = await product(page)
    .locator("[data-popup-purchase]")
    .boundingBox();
  const fieldBounds = await fields.evaluateAll((nodes) =>
    nodes.map((node) => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    }),
  );
  for (const [index, field] of fieldBounds.entries()) {
    assert.ok(
      purchase && field.y >= purchase.y + purchase.height - 1,
      "Optional mobile details follow the immediate purchase area",
    );
    for (const next of fieldBounds.slice(index + 1)) {
      const overlapWidth =
        Math.min(field.x + field.width, next.x + next.width) -
        Math.max(field.x, next.x);
      const overlapHeight =
        Math.min(field.y + field.height, next.y + next.height) -
        Math.max(field.y, next.y);
      assert.ok(
        overlapWidth <= 1 || overlapHeight <= 1,
        "Mobile profile fields never overlap",
      );
    }
  }
  const targets = await product(page)
    .locator(
      '[data-popup-mobile-detail="profile"] dl > div, [data-new-hero-add] button, [data-popup-sample-action]',
    )
    .all();
  for (const target of targets) {
    await target.scrollIntoViewIfNeeded();
    await withinDialog(
      target,
      body,
      "Mobile details and actions are reachable",
    );
    await withinDialog(close(page), popup, "Close stays visible while reading");
    assert.equal(
      await close(page).evaluate((node) => {
        const box = node.getBoundingClientRect();
        return node.contains(
          document.elementFromPoint(
            box.x + box.width / 2,
            box.y + box.height / 2,
          ),
        );
      }),
      true,
      "Scrolling content cannot cover the persistent Close control",
    );
  }
  assert.ok(
    Math.abs((await page.evaluate(() => scrollY)) - pageScroll) < 2,
    "Reading and ordering scroll only the popup",
  );
  await profile.locator("summary").click();
  await body.evaluate((node) => {
    node.scrollTop = 0;
  });
}

async function inspect(page, label) {
  const popup = dialog(page);
  const geometry = await popup.evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
    width: node.getBoundingClientRect().width,
    left: node.getBoundingClientRect().left,
    top: node.getBoundingClientRect().top,
    bottom: node.getBoundingClientRect().bottom,
    viewportWidth: innerWidth,
    viewportHeight: innerHeight,
  }));
  assert.ok(
    geometry.scrollWidth <= geometry.clientWidth + 1,
    "No sideways scroll",
  );
  assert.ok(geometry.left >= 0 && geometry.top >= 0, "Popup remains inset");
  assert.ok(geometry.bottom <= geometry.viewportHeight + 1);
  assert.ok(geometry.width < geometry.viewportWidth);
  if (geometry.viewportWidth >= 900 && geometry.viewportHeight >= 600) {
    const purchase = await product(page)
      .locator("[data-popup-purchase]")
      .boundingBox();
    for (const field of await product(page)
      .locator('[role="tabpanel"]:visible dl > div')
      .all()) {
      const bounds = await field.boundingBox();
      assert.ok(
        bounds && purchase && bounds.y + bounds.height <= purchase.y,
        "Every profile field is visible above the purchase controls",
      );
    }
  }
  await withinDialog(close(page), popup, "Close stays visible");
  if (geometry.viewportWidth <= 760) await mobileReading(page);
  for (const target of await product(page)
    .locator("[data-new-hero-add] button, [data-popup-sample-action]")
    .all()) {
    if (geometry.viewportWidth > 760) {
      await withinDialog(
        target,
        popup,
        "The desktop purchase action is immediately visible",
      );
    }
    assert.ok((await target.boundingBox()).height >= 44);
  }
  await page.screenshot({ path: `${evidence}/${label}.png` });
}

async function exploreProduct(page, touch = false) {
  const before = await quantity(page).textContent();
  const pageScroll = await page.evaluate(() => scrollY);
  const activate = (locator) => (touch ? locator.tap() : locator.click());
  for (const image of ["matcha", "application"]) {
    const choice = product(page).locator(
      `[data-popup-image-choice="${image}"]`,
    );
    await activate(choice);
    assert.equal(await choice.getAttribute("aria-pressed"), "true");
    assert.equal(
      await product(page)
        .locator("[data-popup-image]")
        .getAttribute("data-popup-image"),
      image,
    );
    assert.equal(
      await product(page).locator("[data-new-hero-product-swatch]").isVisible(),
      image === "matcha",
      "The material and application are deliberate image choices",
    );
  }
  const mobile = await product(page)
    .locator("[data-popup-mobile-details]")
    .isVisible();
  if (mobile) {
    for (const detail of ["profile", "preparation"]) {
      const disclosure = product(page).locator(
        `[data-popup-mobile-detail="${detail}"]`,
      );
      const summary = disclosure.locator("summary");
      await summary.focus();
      await page.keyboard.press("Enter");
      assert.equal(await disclosure.getAttribute("open"), "");
      assert.equal(
        await disclosure.locator(detail === "profile" ? "dl" : "p").isVisible(),
        true,
      );
      await activate(summary);
      assert.equal(await disclosure.getAttribute("open"), null);
    }
    assert.equal(await quantity(page).textContent(), before);
    assert.ok(Math.abs((await page.evaluate(() => scrollY)) - pageScroll) < 2);
    return;
  }
  const overview = product(page).locator('[data-popup-info-tab="overview"]');
  const preparation = product(page).locator(
    '[data-popup-info-tab="preparation"]',
  );
  await activate(preparation);
  assert.equal(await preparation.getAttribute("aria-selected"), "true");
  assert.equal(await product(page).getByRole("tabpanel").count(), 1);
  assert.equal(
    await product(page).locator("[data-new-hero-product-profile]").isVisible(),
    true,
  );
  await activate(overview);
  if (!touch) {
    await overview.focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await preparation.evaluate((node) => node === document.activeElement),
      true,
    );
    await page.keyboard.press("Home");
    assert.equal(await overview.getAttribute("aria-selected"), "true");
    await page.keyboard.press("End");
    assert.equal(await preparation.getAttribute("aria-selected"), "true");
    await page.keyboard.press("ArrowLeft");
    assert.equal(await overview.getAttribute("aria-selected"), "true");
  }
  assert.equal(
    await quantity(page).textContent(),
    before,
    "Learning keeps the chosen order",
  );
  assert.ok(
    Math.abs((await page.evaluate(() => scrollY)) - pageScroll) < 2,
    "Learning never moves the page below the popup",
  );
}

function catalog({ soldOut = [], multiple = false } = {}) {
  return {
    status: "ready",
    shopUrl: "https://example.invalid",
    products: SAMPLE_SET_CONTENTS.map((item, index) => ({
      id: item.key,
      handle: item.productHandle,
      title: item.name,
      productCode: item.productCode,
      description: "Isolated canonical popup fixture.",
      imageUrl: null,
      imageAlt: "",
      productUrl: null,
      isFixture: true,
      variants: (multiple ? ["1 kg", "100 g"] : ["1 kg"]).map(
        (title, offset) => ({
          id: `v1_${String.fromCharCode(97 + index + offset * 3).repeat(43)}`,
          title,
          available: offset === 0 ? !soldOut.includes(item.key) : true,
          priceMinor: offset === 0 ? 6000 + index * 1000 : 1000 + index * 100,
          currency: "JPY",
          options: [{ name: "Size", value: title }],
          minimum: 1,
          maximum: 4,
          increment: 1,
        }),
      ),
    })),
  };
}

async function run(label, width, tone, locale, options, callback) {
  if (requested && !requested.includes(label)) return;
  const fixture = await createHeroStudyFixture(
    browser,
    baseURL,
    width,
    tone,
    locale,
    options,
  );
  try {
    await callback(fixture);
    assert.deepEqual(fixture.errors, [], `${label}: no client errors`);
    assert.deepEqual(fixture.writes, [], `${label}: no live commerce writes`);
    results.push(label);
    console.log(`Product popup passed: ${label}`);
  } catch (error) {
    await fixture.page.screenshot({ path: `${evidence}/${label}-failure.png` });
    throw error;
  } finally {
    fixture.release();
    await fixture.context.close();
  }
}

try {
  await run("desktop-return", 1440, "dark", "en", {}, async ({ page }) => {
    await ready(page);
    let entry = await choose(page);
    await add(page).waitFor();
    assert.equal(await add(page).isEnabled(), true);
    assert.equal(
      await product(page).locator("button[data-new-hero-format]").count(),
      0,
      "One published format is information, not a redundant selector",
    );
    await product(page)
      .getByRole("button", { name: "Increase quantity" })
      .click();
    await product(page)
      .getByRole("button", { name: "Increase quantity" })
      .click();
    assert.equal(await quantity(page).textContent(), "3");
    await exploreProduct(page);
    await inspect(page, "desktop-available");

    await close(page).click();
    await returned(page, entry);
    entry = await choose(page, "barista");
    assert.equal(await quantity(page).textContent(), "1");
    await page.keyboard.press("Escape");
    await returned(page, entry);

    entry = await choose(page);
    assert.equal(
      await quantity(page).textContent(),
      "3",
      "The order is retained",
    );
    const reading = product(page).locator("[data-product-popup-detail-scroll]");
    await product(page).locator('[data-popup-info-tab="preparation"]').click();
    await reading.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await withinDialog(close(page), dialog(page), "Close after reading");
    await withinDialog(add(page), dialog(page), "Purchase after reading");
    await page.mouse.click(3, 3);
    await returned(page, entry);

    entry = await choose(page);
    await page.goBack();
    await returned(page, entry);
    await page.goForward();
    await dialog(page).waitFor();
    assert.equal(await quantity(page).textContent(), "3");
    await close(page).click();
    await returned(page, entry);
  });

  await run("mobile-unavailable", 390, "light", "en", {}, async (test) => {
    await test.context.route("**/api/catalog", (route) =>
      route.fulfill({ json: catalog({ soldOut: ["ceremonial"] }) }),
    );
    await ready(test.page);
    const entry = await choose(test.page);
    await product(test.page)
      .locator('[data-popup-purchase][data-unavailable="true"]')
      .waitFor();
    assert.equal(await quantity(test.page).count(), 0);
    assert.equal(
      await product(test.page).locator("[data-new-hero-total]").count(),
      0,
    );
    assert.equal(await add(test.page).count(), 1);
    assert.equal(await add(test.page).isDisabled(), true);
    assert.equal(
      await product(test.page)
        .getByRole("button", { name: "Add to cart", exact: true })
        .count(),
      1,
    );
    assert.equal(
      await product(test.page)
        .getByText("Currently unavailable", { exact: true })
        .count(),
      1,
      "Sold-out status appears once beside the disabled primary action",
    );
    await inspect(test.page, "mobile-unavailable");
    await product(test.page).locator("[data-popup-sample-action]").tap();
    await dialog(test.page).waitFor({ state: "detached" });
    assert.equal(new URL(test.page.url()).searchParams.get("view"), "samples");
    assert.equal(
      new URL(test.page.url()).searchParams.has("application"),
      false,
    );
    await test.page.goBack();
    await dialog(test.page).waitFor();
    await close(test.page).tap();
    await returned(test.page, entry);
  });

  await run("small-phone-barista", 320, "light", "en", {}, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await ready(page, "/?view=matcha&application=barista");
    await dialog(page).waitFor();
    await eventually(
      () => add(page).isEnabled(),
      "The Barista offer is ready before measuring the small phone layout",
    );
    const directEntry = {
      trigger: page.locator('[data-new-hero7-application="barista"]'),
      scroll: await page.evaluate(() => scrollY),
    };
    for (const selector of [
      "[data-new-hero-product-code]",
      "[data-new-hero-product-name]",
      "[data-popup-mobile-summary]",
      "[data-product-application-cutout]",
    ]) {
      await withinDialog(
        product(page).locator(selector),
        scrollBody(page),
        "The small phone opens with a meaningful product introduction",
      );
    }
    assert.equal(
      await scrollBody(page).evaluate((node) => node.scrollTop),
      0,
      "Direct product links begin at the product introduction",
    );
    const order = product(page).locator("[data-popup-purchase]");
    await dialog(page).locator("[data-popup-order-jump]").tap();
    assert.equal(
      await order.evaluate((node) => document.activeElement === node),
      true,
      "The mobile order shortcut moves keyboard focus into purchase controls",
    );
    await withinDialog(
      order,
      scrollBody(page),
      "The order shortcut reveals purchase",
    );
    await withinDialog(
      add(page),
      scrollBody(page),
      "Add to cart is reachable directly",
    );
    await withinDialog(
      close(page),
      dialog(page),
      "Close remains visible at purchase",
    );
    assert.ok(
      Math.abs((await page.evaluate(() => scrollY)) - directEntry.scroll) < 2,
      "The order shortcut preserves the page underneath",
    );
    await scrollBody(page).evaluate((node) => {
      node.scrollTop = 0;
    });
    await inspect(page, "small-phone-barista-direct");
    await close(page).tap();
    await returned(page, directEntry);

    let entry = await choose(page, "barista");
    await product(page)
      .getByRole("button", { name: "Increase quantity" })
      .tap();
    await product(page)
      .getByRole("button", { name: "Increase quantity" })
      .tap();
    assert.equal(await quantity(page).textContent(), "3");
    await exploreProduct(page, true);
    await inspect(page, "small-phone-barista-order");
    await page.touchscreen.tap(3, 3);
    await returned(page, entry);

    entry = await choose(page, "ceremonial");
    assert.equal(
      await quantity(page).textContent(),
      "1",
      "Other products retain their independent quantity",
    );
    await page.keyboard.press("Escape");
    await returned(page, entry);
    entry = await choose(page, "barista");
    assert.equal(await quantity(page).textContent(), "3");
    assert.equal(
      await scrollBody(page).evaluate((node) => node.scrollTop),
      0,
      "Reopening starts at the product identity without losing its order",
    );
    await page.goBack();
    await returned(page, entry);
    await page.goForward();
    await dialog(page).waitFor();
    assert.equal(await quantity(page).textContent(), "3");
    assert.equal(
      new URL(page.url()).searchParams.get("application"),
      "barista",
    );
    await close(page).tap();
    await returned(page, entry);
  });

  await run(
    "mobile-formats",
    390,
    "dark",
    "en",
    {},
    async ({ context, page }) => {
      await context.route("**/api/catalog", (route) =>
        route.fulfill({
          json: catalog({ soldOut: ["ceremonial"], multiple: true }),
        }),
      );
      await ready(page);
      await choose(page);
      const formats = product(page).locator("button[data-new-hero-format]");
      assert.equal(await formats.count(), 2);
      assert.equal(
        await add(page).isEnabled(),
        true,
        "An available format is initially chosen",
      );
      await formats.first().tap();
      assert.equal(await add(page).count(), 1);
      assert.equal(await add(page).isDisabled(), true);
      assert.equal(await quantity(page).count(), 0);
      assert.equal(
        await product(page).locator("[data-popup-sample-action]").count(),
        1,
      );
      await formats.last().tap();
      assert.equal(
        await add(page).isEnabled(),
        true,
        "An available alternative stays reachable",
      );
      await product(page)
        .getByRole("button", { name: "Increase quantity" })
        .tap();
      assert.equal(await quantity(page).textContent(), "2");
      await exploreProduct(page, true);
      await inspect(page, "mobile-multiple-formats");
    },
  );

  await run("loading-failure", 390, "light", "en", {}, async (test) => {
    let release;
    const gate = new Promise((done) => {
      release = done;
    });
    await test.context.route("**/api/catalog", async (route) => {
      await gate;
      await route.fulfill({ json: catalog() });
    });
    try {
      await ready(test.page);
      await choose(test.page);
      assert.match(
        await product(test.page)
          .locator("[data-new-hero-product-status]")
          .textContent(),
        /Loading/,
      );
      assert.equal(
        await product(test.page)
          .getByText("Currently unavailable", { exact: true })
          .count(),
        0,
      );
      assert.equal(await add(test.page).count(), 1);
      assert.equal(await add(test.page).isDisabled(), true);
    } finally {
      release();
    }
    await eventually(
      () => add(test.page).isEnabled(),
      "The real offer appears when its catalog is ready",
    );
    await test.context.unroute("**/api/catalog");
    await test.context.route("**/api/catalog", (route) =>
      route.fulfill({
        status: 503,
        json: {
          status: "unavailable",
          products: [],
          shopUrl: "https://example.invalid",
        },
      }),
    );
    await ready(test.page, "/?view=matcha&application=ceremonial");
    await dialog(test.page).waitFor();
    await eventually(
      () =>
        product(test.page)
          .getAttribute("data-catalog-state")
          .then((value) => value === "unavailable"),
      "A failed read is represented honestly",
    );
    assert.equal(await add(test.page).count(), 1);
    assert.equal(await add(test.page).isDisabled(), true);
    assert.equal(
      await product(test.page)
        .getByText("Currently unavailable", { exact: true })
        .count(),
      0,
    );
    await dialog(test.page)
      .getByRole("button", { name: "Try again", exact: true })
      .waitFor();
    await inspect(test.page, "mobile-catalog-failure");
  });

  await run(
    "country-review",
    1440,
    "light",
    "en",
    {},
    async ({ context, page }) => {
      await context.route("**/api/destination", (route) =>
        route.fulfill({
          json: {
            kind: "ready",
            preference: { countryCode: "US", source: "default" },
            destination: { countryCode: "US", currency: "JPY" },
            countries: ["US", "SG"],
            reviewRequired: true,
          },
        }),
      );
      await ready(page);
      await choose(page);
      await dialog(page)
        .getByRole("button", { name: "Confirm country", exact: true })
        .waitFor();
      for (const button of await add(page).all())
        assert.equal(await button.isDisabled(), true);
      assert.equal(
        await product(page)
          .getByText("Currently unavailable", { exact: true })
          .count(),
        0,
      );
      assert.doesNotMatch(
        await product(page).locator("[data-new-hero-price]").textContent(),
        /6,000/,
      );
      await inspect(page, "desktop-country-review");
    },
  );

  await run(
    "pending-guard",
    390,
    "dark",
    "en",
    { holdMutation: true },
    async (test) => {
      await ready(test.page);
      await choose(test.page);
      await add(test.page).tap();
      await eventually(
        () => test.simulatedWrites.length === 1,
        "The isolated mutation is held",
      );
      const url = test.page.url();
      assert.equal(await close(test.page).isDisabled(), true);
      await close(test.page).evaluate((node) => node.click());
      await product(test.page)
        .locator("[data-popup-sample-action]")
        .evaluate((node) => node.click());
      await test.page.keyboard.press("Escape");
      assert.equal(test.page.url(), url);
      assert.equal(await dialog(test.page).count(), 1);
      assert.equal(await add(test.page).isDisabled(), true);
      test.releaseMutation();
      await eventually(
        () => close(test.page).isEnabled(),
        "A completed attempt releases the guard",
      );
    },
  );

  await run("japanese-enlarged", 320, "dark", "ja", {}, async ({ page }) => {
    await ready(page, "/?view=matcha&application=barista");
    await eventually(
      () => add(page).isEnabled(),
      "Published purchase controls settle before measuring enlarged text",
    );
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    await dialog(page).waitFor();
    const popup = dialog(page);
    for (const summary of await product(page)
      .locator("[data-popup-mobile-detail] > summary")
      .all()) {
      await summary.click();
    }
    const bodySize = await scrollBody(page).evaluate((node) => ({
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
    }));
    assert.ok(
      bodySize.scrollWidth <= bodySize.clientWidth + 1,
      "Enlarged product content never needs sideways scrolling",
    );
    for (const name of ["数量を減らす", "数量を増やす"]) {
      const button = product(page).getByRole("button", { name, exact: true });
      const bounds = await button.boundingBox();
      assert.ok(
        bounds && bounds.width >= 44 && bounds.height >= 44,
        "Enlarged quantity controls retain physical touch targets",
      );
    }
    for (const control of await popup
      .locator("button:visible, a:visible, summary:visible")
      .all()) {
      await control.scrollIntoViewIfNeeded();
      const bounds = await control.boundingBox();
      const outer = await popup.boundingBox();
      assert.ok(
        bounds.x >= outer.x - 1 &&
          bounds.x + bounds.width <= outer.x + outer.width + 1,
        "Enlarged controls fit the popup width",
      );
    }
    await close(page).scrollIntoViewIfNeeded();
    await withinDialog(close(page), popup, "Enlarged close remains reachable");
    await page.screenshot({ path: `${evidence}/japanese-enlarged.png` });
    await close(page).click();
    await popup.waitFor({ state: "detached" });
  });

  await writeFile(
    `${evidence}/results.json`,
    `${JSON.stringify(results, null, 2)}\n`,
  );
} finally {
  await browser.close();
}
