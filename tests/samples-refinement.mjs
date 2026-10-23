/* Canonical sample buying and learning. Every commerce request is isolated. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";
import { money } from "../src/lib/product-selection.ts";
import { translate } from "../src/lib/i18n/index.ts";
import { createHeroStudyFixture } from "./hero-cx-fixtures.mjs";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.SAMPLES_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.SAMPLES_REFINEMENT_EVIDENCE ?? ".local/samples-0271/tests";
const filters = process.env.SAMPLES_REFINEMENT_CASES?.split(",");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
await mkdir(evidence, { recursive: true });

const purchase = (page) => page.locator("[data-sample-purchase]:visible");
const quantity = (page) =>
  purchase(page).locator('output[aria-label="Set quantity"]');
const add = (page) => purchase(page).locator("button[data-available]");
const tools = (page) => page.locator("[data-sample-tasting-tools]");
const orderPrice = (page) => purchase(page).locator("[data-sample-price]");

function sampleCatalog(priceMinor, currency) {
  return {
    status: "ready",
    shopUrl: "https://example.invalid",
    products: [
      {
        id: "sample-set",
        handle: SAMPLE_SET_OFFER.productHandle,
        title: "Sample Set",
        productCode: null,
        description: "Isolated sample currency fixture.",
        imageUrl: null,
        imageAlt: "",
        productUrl: null,
        isFixture: true,
        variants: [
          {
            id: `v1_${"s".repeat(43)}`,
            title: "3 × 20 g",
            available: true,
            options: SAMPLE_SET_OFFER.variants[0].options,
            priceMinor,
            currency,
            minimum: 1,
            maximum: 4,
            increment: 1,
          },
        ],
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

async function ready(page) {
  await page.goto(`${baseURL}/samples`);
  await page.locator("[data-sample-order]").waitFor({ state: "visible" });
  await eventually(
    () => add(page).isEnabled(),
    "The published sample offer is ready",
  );
  await page.evaluate(() => document.fonts.ready);
}

async function visiblyRendered(locator) {
  if (!(await locator.count())) return false;
  return locator.evaluate((node) => {
    if (!node.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))
      return false;
    const range = document.createRange();
    range.selectNodeContents(node);
    return [...range.getClientRects()].some(
      (box) => box.width > 1 && box.height > 1,
    );
  });
}

async function fit(page) {
  assert.ok(
    await page.evaluate(
      (width) => document.documentElement.scrollWidth <= width + 1,
      page.viewportSize().width,
    ),
    "Samples fits without horizontal scrolling",
  );
  for (const scope of [
    purchase(page),
    tools(page).locator("[data-tasting-current]"),
  ])
    assert.deepEqual(
      await scope.evaluate((node) => {
        const outer = node.getBoundingClientRect();
        return [
          ...node.querySelectorAll("button, select, input, textarea, h3, p"),
        ]
          .filter((child) => child.checkVisibility())
          .filter((child) => {
            const box = child.getBoundingClientRect();
            return (
              box.width > 1 &&
              (box.left < outer.left - 1 ||
                box.right > outer.right + 1 ||
                child.scrollWidth > child.clientWidth + 1)
            );
          })
          .map((child) => child.tagName);
      }),
      [],
      "Purchase controls and the current tasting identity fit their own container",
    );
}

async function inspectPage(page, locale = "en") {
  assert.equal(await page.locator("h1:visible").count(), 1);
  assert.equal(
    await page.locator("[data-sample-gallery] [data-pouch]").count(),
    3,
  );
  const credit = purchase(page).locator("[data-sample-credit-summary]");
  assert.equal(
    await visiblyRendered(credit),
    true,
    "The wholesale credit is visible without opening a disclosure",
  );
  assert.ok((await credit.innerText()).includes("4,500"));
  assert.equal(
    await tools(page).isVisible(),
    true,
    "Tasting tools are directly available in the page",
  );
  assert.equal(await tools(page).locator('[name="notes"]').isVisible(), true);
  if (page.viewportSize().width <= 760) {
    assert.equal(
      await page.locator('a[href="#samples-order"]:visible').count(),
      0,
      "Mobile does not repeat an Order the set callout below learning",
    );
    assert.ok(
      await credit.evaluate(
        (node) => parseFloat(getComputedStyle(node).fontSize) >= 15,
      ),
      "The visible credit retains the mobile 15px prose floor",
    );
    for (const field of await tools(page)
      .locator(
        'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):visible, textarea:visible, select:visible',
      )
      .all()) {
      assert.ok(
        await field.evaluate(
          (node) => parseFloat(getComputedStyle(node).fontSize) >= 16,
        ),
        "Editable tasting fields retain 16px type to avoid mobile input zoom",
      );
    }
  }
  assert.equal(await page.locator("#samples-contents").count(), 1);
  for (const item of SAMPLE_SET_CONTENTS) {
    const row = page.locator(`[data-sample-content="${item.key}"]`);
    assert.ok(
      (await row.textContent()).includes(translate(locale, item.name)),
      "Inside the set retains each exact matcha",
    );
  }
  await fit(page);
}

async function inspectSinglePrice(page, amount, currency, count) {
  const visibleAmounts = await purchase(page)
    .locator("[data-sample-order]")
    .evaluate((order) => {
      const walker = document.createTreeWalker(order, NodeFilter.SHOW_TEXT);
      const amounts = [];
      for (let text = walker.nextNode(); text; text = walker.nextNode()) {
        if (
          !text.parentElement?.checkVisibility({
            checkOpacity: true,
            checkVisibilityCSS: true,
          })
        )
          continue;
        const range = document.createRange();
        range.selectNodeContents(text);
        if (![...range.getClientRects()].some((box) => box.width && box.height))
          continue;
        amounts.push(
          ...(text.textContent.match(/(?:USD|SGD)\s*[\d,]+\.\d{2}|¥[\d,]+/gu) ??
            []),
        );
      }
      return amounts;
    });
  assert.deepEqual(
    visibleAmounts,
    [money(amount, currency)],
    "Exactly one rendered order amount reflects the selected quantity",
  );
  assert.equal(await quantity(page).textContent(), `${count}`);
  if (count === 1) {
    const label = purchase(page).getByText("Per set", { exact: true });
    assert.equal(await label.isVisible(), true);
    assert.ok(
      (await label.evaluate((node) =>
        parseFloat(getComputedStyle(node).fontSize),
      )) <
        (await orderPrice(page).evaluate((node) =>
          parseFloat(getComputedStyle(node).fontSize),
        )),
      "Per set is a smaller label beside the single-set price",
    );
  } else {
    assert.equal(
      await purchase(page).getByText("Per set", { exact: true }).count(),
      0,
      "A multi-set total is not mislabelled as a per-set price",
    );
    assert.equal(
      await purchase(page).getByText("Total", { exact: true }).isVisible(),
      true,
    );
  }
}

async function inspectPrice(page, amount, currency) {
  await inspectSinglePrice(page, amount, currency, 1);
  await purchase(page)
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  await inspectSinglePrice(page, amount * 2, currency, 2);
  await purchase(page)
    .getByRole("button", { name: "Decrease quantity", exact: true })
    .click();
  await inspectSinglePrice(page, amount, currency, 1);
}

async function screenshot(page, name) {
  await page.addStyleTag({
    content:
      "nextjs-portal{display:none!important}*{caret-color:transparent!important}",
  });
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `${evidence}/${name}.png`,
    animations: "disabled",
  });
  await tools(page).screenshot({
    path: `${evidence}/${name}-tasting.png`,
    animations: "disabled",
  });
}

async function run(name, width, tone, locale, options, action) {
  if (filters && !filters.includes(name)) return;
  const fixture = await createHeroStudyFixture(
    browser,
    baseURL,
    width,
    tone,
    locale,
    options,
  );
  try {
    await action(fixture);
    assert.deepEqual(fixture.errors, [], `${name}: no client errors`);
    assert.deepEqual(fixture.writes, [], `${name}: no live commerce writes`);
    results.push(name);
    console.log(`Samples refinement passed: ${name}`);
  } catch (error) {
    await fixture.page.screenshot({
      path: `${evidence}/${name}-failure.png`,
      animations: "disabled",
    });
    throw error;
  } finally {
    fixture.release();
    await fixture.context.close();
  }
}

try {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [430, 932],
    [320, 568],
  ])
    for (const tone of ["light", "dark"])
      await run(
        `layout-${width}-${tone}`,
        width,
        tone,
        "en",
        {},
        async ({ page }) => {
          await page.setViewportSize({ width, height });
          await ready(page);
          await inspectPage(page);
          await inspectPrice(page, 6000, "JPY");
          for (const control of await purchase(page)
            .locator("button:visible")
            .all()) {
            const box = await control.boundingBox();
            assert.ok(
              box.width >= 44 && box.height >= 44,
              "Purchase controls keep usable touch targets",
            );
          }
          await screenshot(page, `layout-${width}-${tone}`);
        },
      );

  await run("labels-and-order", 390, "dark", "en", {}, async ({ page }) => {
    await ready(page);
    await purchase(page)
      .getByRole("button", { name: "Increase quantity", exact: true })
      .click();
    for (const item of SAMPLE_SET_CONTENTS) {
      const opener = page.locator(
        `[data-sample-gallery] [data-pouch="${item.key}"]`,
      );
      await opener.scrollIntoViewIfNeeded();
      const scroll = await page.evaluate(() => scrollY);
      await opener.click();
      const dialog = page.locator("[data-sample-label-dialog][open]");
      await dialog.waitFor();
      assert.equal(
        await dialog.locator(`a[href="/shop/${item.productHandle}"]`).count(),
        1,
      );
      await dialog
        .getByRole("button", { name: "Close label", exact: true })
        .click();
      await dialog.waitFor({ state: "hidden" });
      assert.equal(
        await opener.evaluate((node) => node === document.activeElement),
        true,
      );
      assert.ok(Math.abs((await page.evaluate(() => scrollY)) - scroll) < 2);
      assert.equal(await quantity(page).textContent(), "2");
    }
    await tools(page)
      .locator('[name="notes"]')
      .fill("Retain this tasting while reviewing the set.");
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    assert.equal(await quantity(page).textContent(), "2");
    assert.equal(
      await tools(page).locator('[name="notes"]').inputValue(),
      "Retain this tasting while reviewing the set.",
    );
  });

  for (const [label, locale] of [
    ["enlarged-japanese", "ja"],
    ["enlarged-english", "en"],
  ])
    await run(label, 320, "light", locale, {}, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await ready(page);
      await page.addStyleTag({ content: "html{font-size:200%!important}" });
      await inspectPage(page, locale);
      await purchase(page)
        .getByRole("button", {
          name: translate(locale, "Increase quantity"),
          exact: true,
        })
        .click();
      const priceBox = await orderPrice(page).boundingBox();
      assert.ok(
        priceBox.x >= -1 && priceBox.x + priceBox.width <= 321,
        "The enlarged order price remains inside the viewport",
      );
      await fit(page);
      await screenshot(page, label);
    });

  await run("usd-price", 390, "light", "en", {}, async ({ page, context }) => {
    await context.route("**/api/catalog", (route) =>
      route.fulfill({
        json: sampleCatalog(3456, "USD"),
      }),
    );
    await context.route("**/api/destination", (route) =>
      route.fulfill({
        json: {
          kind: "ready",
          preference: { countryCode: "US", source: "manual" },
          destination: { countryCode: "US", currency: "USD" },
          countries: ["US"],
          reviewRequired: false,
        },
      }),
    );
    await ready(page);
    await inspectPrice(page, 3456, "USD");
  });

  for (const [surface, path] of [
    ["page", "/samples"],
    ["home", "/?view=samples"],
  ]) {
    for (const width of [390, 1440]) {
      const label = `single-price-${surface}-${width}`;
      await run(label, width, "light", "en", {}, async ({ page, context }) => {
        let reviewRequired = false;
        await context.route("**/api/catalog", (route) =>
          route.fulfill({ json: sampleCatalog(2900, "USD") }),
        );
        await context.route("**/api/destination", (route) =>
          route.fulfill({
            json: {
              kind: "ready",
              preference: { countryCode: "US", source: "default" },
              destination: { countryCode: "US", currency: "USD" },
              countries: ["US"],
              reviewRequired,
            },
          }),
        );
        await page.goto(`${baseURL}${path}`);
        await eventually(
          () => add(page).isEnabled(),
          "The USD sample offer is ready",
        );
        await page.evaluate(() => document.fonts.ready);
        assert.equal(
          await page
            .getByRole("button", { name: /Tap to see more|Inspect a label/u })
            .count(),
          0,
          "Canonical sample buying has no repeated inspection prompt",
        );
        assert.equal(
          await page.locator("[data-pouch]:visible").count(),
          3,
          "All three pouches retain their direct inspection interaction",
        );
        if (surface === "home" && width <= 760)
          assert.equal(
            await page
              .locator('[data-new-hero7-view="samples"]')
              .getByText("Three matcha · 20 g each", { exact: true })
              .isVisible(),
            false,
            "The mobile entry does not repeat its set-size label",
          );
        const credit = purchase(page).locator("[data-sample-credit-summary]");
        assert.equal(await visiblyRendered(credit), true);
        for (const text of ["4,500", "1 kg", "email"])
          assert.ok(
            (await credit.innerText()).includes(text),
            "Both buying entrances show the credit and its key terms before disclosure",
          );
        for (const count of [1, 2]) {
          if (count === 2)
            await purchase(page)
              .getByRole("button", { name: "Increase quantity", exact: true })
              .click();
          await inspectSinglePrice(page, 2900 * count, "USD", count);
          for (const review of [true, false]) {
            reviewRequired = review;
            await page
              .getByRole("button", { name: /^Open cart,/u })
              .first()
              .click();
            await eventually(
              async () => (await add(page).isDisabled()) === review,
              "A read-only cart refresh reconciles destination confirmation",
            );
            const closeCart = page.getByRole("button", {
              name: "Close cart",
              exact: true,
            });
            await closeCart.click();
            await closeCart.waitFor({ state: "hidden" });
            await inspectSinglePrice(page, 2900 * count, "USD", count);
            assert.equal(await add(page).isDisabled(), review);
            if (review && surface === "home")
              assert.equal(
                await page
                  .locator("[data-new-hero7-sample-purchase]")
                  .getByRole("button", { name: "Confirm country", exact: true })
                  .isVisible(),
                true,
                "The reproduced confirmation state keeps one accurate price",
              );
            if (review) {
              await purchase(page).scrollIntoViewIfNeeded();
              await page.screenshot({
                path: `${evidence}/${label}-quantity-${count}-review.png`,
                animations: "disabled",
              });
            }
          }
        }
      });
    }
  }

  await run("unavailable", 320, "dark", "en", {}, async ({ page, context }) => {
    await context.route("**/api/catalog", (route) =>
      route.fulfill({
        json: {
          status: "ready",
          products: [],
          shopUrl: "https://example.invalid",
        },
      }),
    );
    await page.goto(`${baseURL}/samples`);
    await page.locator("[data-sample-unavailable]").waitFor();
    assert.equal(await page.locator("[data-sample-order]").count(), 0);
    assert.equal(await orderPrice(page).count(), 0);
    await inspectPage(page);
    await screenshot(page, "unavailable");
  });

  await run(
    "pending-guard",
    390,
    "dark",
    "en",
    { holdMutation: true },
    async (fixture) => {
      const { page } = fixture;
      await ready(page);
      await purchase(page)
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await add(page).click();
      await eventually(
        () => fixture.simulatedWrites.length === 1,
        "The isolated Add request is held",
      );
      assert.equal(await add(page).isDisabled(), true);
      assert.equal(
        await purchase(page)
          .getByRole("button", { name: "Increase quantity", exact: true })
          .isDisabled(),
        true,
      );
      assert.ok(
        (await page.locator("[data-sample-gallery] button").all()).length > 0,
      );
      for (const control of await page
        .locator("[data-sample-gallery] button")
        .all())
        assert.equal(
          await control.isDisabled(),
          true,
          "Pouch inspection cannot interrupt pending commerce",
        );
      const url = page.url();
      for (const link of [
        page.locator('[data-samples-page] nav a[href="/wholesale"]').last(),
        page.locator("[data-sample-one-kilogram]"),
        tools(page).locator('[data-tasting-one-kilogram="ceremonial"]').first(),
      ]) {
        assert.equal(await link.getAttribute("aria-disabled"), "true");
        await link.evaluate((node) => node.click());
        assert.equal(
          page.url(),
          url,
          "Pending commerce keeps departure links guarded",
        );
      }
      await add(page).evaluate((node) => node.click());
      assert.equal(fixture.simulatedWrites.length, 1);
      fixture.releaseMutation();
      await eventually(
        () => add(page).isEnabled(),
        "Rejected fixture purchase releases the controls",
      );
      assert.equal(await quantity(page).textContent(), "2");
      assert.equal(await purchase(page).getByRole("alert").count(), 1);
    },
  );
} finally {
  await writeFile(
    `${evidence}/results.json`,
    `${JSON.stringify(results, null, 2)}\n`,
  );
  await browser.close();
}
