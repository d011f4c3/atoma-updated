/* Learn about each included matcha before ordering. All commerce is isolated. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";
import { createHeroStudyFixture } from "./hero-cx-fixtures.mjs";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.NEW_HERO7_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.NEW_HERO7_EVIDENCE ?? ".local/new-hero-0251/samples";
const expected = {
  ceremonial: {
    profile: [
      "Delicate · fresh leaf",
      "Clean green · savoury",
      "Full · rounded",
      "Gentle",
      "Fine · soft",
      "Bright green",
      "Soft · lingering umami",
    ],
    preparation:
      "Keep the matcha dose, water quantity, water temperature and whisking method consistent.",
    observation: "Aroma as the matcha is prepared",
  },
  barista: {
    profile: [
      "Fresh green",
      "Round · vegetal",
      "Balanced",
      "Moderate",
      "Soft-bodied",
      "Deep green",
      "Rounded · lightly savoury",
    ],
    preparation: "Use your usual milk and sweetener.",
    observation: "Flavour with your chosen milk",
  },
  culinary: {
    profile: [
      "Green leaf · dry grass",
      "Robust vegetal",
      "Restrained",
      "Defined",
      "Fine · powdery",
      "Olive green",
      "Lingering green",
    ],
    preparation:
      "Keep the matcha dose, ingredients, method and serving size the same between trials.",
    observation: "The result after cooking and cooling",
  },
};
const samples = (page) =>
  page.locator('[data-new-hero7-view="samples"]:visible');
const toggle = (page, key) =>
  samples(page).locator(`[data-new-hero7-sample-tab="${key}"]`);
const reader = (page, key) =>
  samples(page).locator(`[data-new-hero7-sample-profile="${key}"]`);
const dialog = (page) =>
  samples(page).locator("[data-new-hero7-sample-dialog][open]");
const close = (page) => dialog(page).locator("[data-new-hero7-sample-close]");
const purchase = (page) =>
  samples(page).locator("[data-new-hero7-sample-purchase]");
const add = (page) => purchase(page).locator("button[data-available]");
const quantity = (page) =>
  purchase(page).locator('output[aria-label="Set quantity"]');

async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function focused(locator, message) {
  await eventually(
    () => locator.evaluate((node) => node === document.activeElement),
    message,
  );
}

async function underlying(page, key) {
  return page.evaluate((key) => {
    const bounds = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const box = node.getBoundingClientRect();
      return {
        x: box.x,
        y: box.y + scrollY,
        width: box.width,
        height: box.height,
      };
    };
    return {
      scrollY,
      height: document.body.getBoundingClientRect().height,
      trigger: bounds(`[data-new-hero7-sample-tab="${key}"]`),
      purchase: bounds("[data-new-hero7-sample-purchase]"),
      foil: bounds('[data-new-hero7-view="samples"] [data-foil-trio]'),
    };
  }, key);
}

async function closeReader(page, dismissal = "button") {
  const popup = dialog(page);
  if (!(await popup.count())) return;
  const key = await popup.getAttribute("data-new-hero7-sample-profile");
  const before = await underlying(page, key);
  if (dismissal === "Escape") await page.keyboard.press("Escape");
  else if (dismissal === "backdrop") await page.mouse.click(2, 2);
  else if (dismissal === "back")
    await dialog(page).locator("[data-new-hero7-sample-back]").click();
  else await close(page).click();
  await popup.waitFor({ state: "hidden" });
  await focused(
    toggle(page, key),
    "Dismissal restores the same product trigger",
  );
  assert.deepEqual(
    await underlying(page, key),
    before,
    "Dismissal preserves page geometry and scroll",
  );
  assert.equal(await toggle(page, key).getAttribute("aria-expanded"), "false");
}

async function choose(page, key, keyboard = false) {
  await closeReader(page);
  const button = toggle(page, key);
  await button.scrollIntoViewIfNeeded();
  const before = await underlying(page, key);
  if (keyboard) {
    await button.focus();
    await page.keyboard.press("Enter");
  } else await button.click();
  await reader(page, key).waitFor();
  assert.equal(
    await dialog(page).evaluate((node) => node.matches(":modal")),
    true,
    "Learning opens a native modal, never an inline reader",
  );
  await eventually(
    () =>
      dialog(page)
        .locator('[data-masked="true"]')
        .count()
        .then((count) => count === 1),
    "The sample powder uses its transparent material mask",
  );
  assert.equal(await button.getAttribute("aria-expanded"), "true");
  assert.equal(
    await button.getAttribute("aria-controls"),
    await dialog(page).getAttribute("id"),
  );
  assert.equal(
    await samples(page)
      .locator("[data-new-hero7-sample-profile]:visible")
      .count(),
    1,
  );
  await focused(close(page), "The modal Close control receives focus");
  assert.deepEqual(
    await underlying(page, key),
    before,
    "Opening learning preserves page, purchase, pouches and scroll",
  );
  for (const direction of ["Shift+Tab", "Tab"]) {
    await page.keyboard.press(direction);
    assert.equal(
      await dialog(page).evaluate(
        (node) =>
          node.contains(document.activeElement) ||
          document.activeElement === document.body,
      ),
      true,
      "Keyboard navigation never focuses the inert page",
    );
    if (await page.evaluate(() => document.activeElement === document.body))
      await page.keyboard.press(direction);
    assert.equal(
      await dialog(page).evaluate((node) =>
        node.contains(document.activeElement),
      ),
      true,
      "Keyboard focus returns to the modal after browser chrome",
    );
  }
}

async function fit(page, label) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    `${label} fits without horizontal scrolling`,
  );
  if (await dialog(page).count())
    assert.equal(
      await dialog(page).evaluate(
        (node) => node.scrollWidth <= node.clientWidth + 1,
      ),
      true,
      `${label} keeps the modal within its inset width`,
    );
  const clipped = await samples(page)
    .locator("h1,h2,h3,button,dt,dd")
    .evaluateAll((nodes) =>
      nodes
        .filter(
          (node) =>
            node.checkVisibility() &&
            !node.closest("[data-foil-trio]") &&
            (node.scrollWidth > node.clientWidth + 1 ||
              (node.tagName === "BUTTON" &&
                node.scrollHeight > node.clientHeight + 1)),
        )
        .map((node) => node.textContent),
    );
  assert.deepEqual(
    clipped,
    [],
    `${label} keeps controls and profile values readable`,
  );
}

async function capture(page, label) {
  await page.locator("main img:visible").evaluateAll(async (images) =>
    Promise.all(
      images.map(async (image) => {
        image.loading = "eager";
        await image.decode().catch(() => {});
      }),
    ),
  );
  await page.screenshot({
    path: resolve(evidence, `${label}.png`),
    fullPage: true,
  });
}

await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
async function fixture(width, tone, options, run) {
  const test = await createHeroStudyFixture(
    browser,
    baseURL,
    width,
    tone,
    options.locale ?? "en",
    options,
  );
  try {
    if (options.height)
      await test.page.setViewportSize({ width, height: options.height });
    await options.beforeNavigation?.(test);
    await test.page.goto(
      `${baseURL}${options.route ?? "/new-hero7?view=samples"}`,
      { waitUntil: "domcontentloaded" },
    );
    await samples(test.page).waitFor();
    assert.equal(
      await test.page.locator("[data-new-hero7-breadcrumb]:visible").count(),
      0,
      "Samples uses the shared header without a duplicate navigation layer",
    );
    await eventually(
      () => test.page.locator("footer [data-theme-switcher]").isEnabled(),
      "The sample view is hydrated",
    );
    if (!options.unavailable && !options.review)
      await eventually(
        () => add(test.page).isEnabled(),
        "The existing set purchase is ready",
      );
    await run(test);
    assert.deepEqual(
      test.errors,
      [],
      "No client errors or unexpected requests",
    );
    assert.deepEqual(test.writes, [], "No commerce writes reach the server");
  } finally {
    test.release();
    await test.context.close();
  }
}

try {
  for (const [width, height, tone, route] of [
    [1440, 900, "light", "/new-hero7?view=samples"],
    [1366, 768, "dark", "/new-hero7?view=samples"],
    [1366, 768, "light", "/new-hero7/samples"],
    [900, 600, "dark", "/new-hero7?view=samples"],
    [844, 390, "light", "/new-hero7?view=samples"],
    [390, 844, "light", "/new-hero7?view=samples"],
    [390, 844, "dark", "/new-hero7/samples"],
    [320, 740, "dark", "/new-hero7?view=samples"],
  ]) {
    const requestedWidths =
      process.env.NEW_HERO7_SAMPLE_WIDTHS?.split(",").map(Number);
    if (requestedWidths && !requestedWidths.includes(width)) continue;
    await fixture(width, tone, { height, route }, async ({ page }) => {
      assert.equal(
        await samples(page).locator("[data-new-hero7-sample-tab]").count(),
        3,
      );
      assert.equal(await dialog(page).count(), 0);
      if (width >= 1366) {
        for (const control of [
          ...(await samples(page).locator("[data-new-hero7-sample-tab]").all()),
          purchase(page).locator("[data-sample-order] > div").first(),
          quantity(page),
          add(page),
        ]) {
          const bounds = await control.boundingBox();
          assert.ok(
            bounds.y >= 0 && bounds.y + bounds.height <= height,
            "Desktop shows the three learning choices, price, quantity and Add in the first viewport",
          );
        }
        await capture(page, `sample-first-viewport-${width}-${tone}`);
      }
      await purchase(page)
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await purchase(page).evaluate((node) => {
        window.__sampleOrderNode = node;
      });
      for (const [index, item] of SAMPLE_SET_CONTENTS.entries()) {
        await choose(page, item.key, true);
        const content = reader(page, item.key);
        const text = await content.textContent();
        assert.ok(text.includes(item.name));
        assert.ok(text.includes(item.productCode));
        assert.doesNotMatch(
          text,
          /Illustrative profiles|Final specifications pending/,
          "Sample learning omits internal reference-status notes",
        );
        for (const value of expected[item.key].profile)
          assert.ok(text.includes(value), `${item.key} presents ${value}`);
        const preparation = content.locator(
          "[data-new-hero7-sample-preparation]",
        );
        if (width >= 1366) {
          const summary = await preparation.locator("summary").boundingBox();
          const dismiss = await close(page).boundingBox();
          const order = await content
            .locator("[data-new-hero7-sample-order]")
            .boundingBox();
          assert.ok(
            summary.y >= dismiss.y + dismiss.height &&
              summary.y + summary.height <= order.y,
            "Preparation is visible by default between the fixed header and footer",
          );
          assert.equal(
            await preparation.locator("summary").evaluate((node) => {
              const box = node.getBoundingClientRect();
              return node.contains(
                document.elementFromPoint(
                  box.x + box.width / 2,
                  box.y + box.height / 2,
                ),
              );
            }),
            true,
            "Preparation is not hidden by the sample footer",
          );
        }
        if ((await preparation.getAttribute("open")) === null)
          await preparation.locator("summary").click();
        assert.equal(await preparation.getAttribute("open"), "");
        const preparationText = await preparation.textContent();
        assert.ok(preparationText.includes(expected[item.key].preparation));
        assert.ok(preparationText.includes(expected[item.key].observation));
        assert.equal(await quantity(page).textContent(), "2");
        assert.equal(
          await purchase(page).evaluate(
            (node) => window.__sampleOrderNode === node,
          ),
          true,
          "Learning keeps the same purchase form mounted",
        );
        assert.equal(new URL(page.url()).pathname, route.split("?")[0]);
        await fit(page, `${width}/${tone}/${item.key}`);
        const lastAction = content.locator("[data-new-hero7-sample-product]");
        await lastAction.scrollIntoViewIfNeeded();
        const popup = await dialog(page).boundingBox();
        const action = await lastAction.boundingBox();
        const dismiss = await close(page).boundingBox();
        assert.ok(
          action.y + action.height <= popup.y + popup.height + 1,
          "The final action is reachable inside the popup",
        );
        assert.ok(
          dismiss.y >= popup.y &&
            dismiss.y + dismiss.height <= popup.y + popup.height,
          "Close stays visible while learning content scrolls",
        );
        await capture(page, `sample-popup-${width}-${tone}-${item.key}`);
        await closeReader(page, ["button", "Escape", "backdrop"][index]);
      }
      await choose(page, "barista");
      await closeReader(page, "back");
      await choose(page, "barista");
      await reader(page, "barista")
        .locator("[data-new-hero7-sample-order]")
        .click();
      await dialog(page).waitFor({ state: "hidden" });
      await focused(
        purchase(page),
        "Order closes learning and focuses the existing purchase controls",
      );
      const bounds = await purchase(page).boundingBox();
      assert.ok(
        bounds.y >= 0 && bounds.y < height,
        "The explicit Order action reaches the purchase",
      );
      assert.equal(await quantity(page).textContent(), "2");
    });
    console.log(
      `Native sample popups, all profiles, dismissal and retained purchase: ${width}/${height}/${tone}/${route}`,
    );
  }

  await fixture(390, "light", {}, async ({ page }) => {
    await purchase(page)
      .getByRole("button", { name: "Increase quantity", exact: true })
      .click();
    await choose(page, "barista");
    const requests = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (
        request.isNavigationRequest() ||
        (url.pathname.startsWith("/new-hero7") && url.searchParams.has("_rsc"))
      )
        requests.push(url.pathname);
    });
    await reader(page, "barista")
      .locator("[data-new-hero7-sample-product]")
      .click();
    const product = page.locator(
      '[data-new-hero7-view="matcha"] [data-new-hero-product="barista"]:visible',
    );
    await product.waitFor();
    assert.equal(
      await page.locator("[data-new-hero-product]:visible").count(),
      1,
      "The larger-format action opens only the matcha the visitor learned about",
    );
    assert.equal(
      new URL(page.url()).searchParams.get("application"),
      "barista",
    );
    const productPopup = page.locator("[data-new-hero7-product-dialog][open]");
    await productPopup.waitFor();
    assert.equal(
      await productPopup.evaluate((node) => node.matches(":modal")),
      true,
    );
    assert.equal(
      await page.locator("[data-new-hero7-sample-dialog][open]").count(),
      0,
      "The hidden Samples view releases its popup",
    );
    await eventually(
      () =>
        productPopup.evaluate((node) => node.contains(document.activeElement)),
      "Larger-format entry focuses the matching product popup",
    );
    await page.goBack();
    await reader(page, "barista").waitFor();
    assert.equal(
      await dialog(page).evaluate((node) => node.matches(":modal")),
      true,
    );
    await eventually(
      () =>
        dialog(page).evaluate((node) => node.contains(document.activeElement)),
      "Back restores focus inside the retained reader",
    );
    assert.equal(await quantity(page).textContent(), "2");
    assert.deepEqual(
      requests,
      [],
      "Learning and comparison retain the same document",
    );
  });
  console.log(
    "The selected sample opens its matching product in place and survives Back",
  );

  await fixture(390, "light", {}, async ({ page, context }) => {
    const orders = [];
    await context.route("**/api/cart", (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      const action = route.request().postDataJSON();
      orders.push(action);
      return route.fulfill({
        json: {
          kind: "success",
          checkoutEnabled: false,
          cart: {
            totalQuantity: action.quantity,
            subtotalLabel: "¥12,000",
            totalLabel: "¥12,000",
            lines: [
              {
                lineKey: "learned-sample-set",
                productHandle: action.productHandle,
                productTitle: "Sample Set",
                variantTitle: "3 × 20 g",
                options: SAMPLE_SET_OFFER.variants[0].options,
                quantity: action.quantity,
                unitPriceLabel: "¥6,000",
                lineTotalLabel: "¥12,000",
                purchaseState: "purchasable",
                quantityRule: { minimum: 1, maximum: 4, increment: 1 },
                canUpdateQuantity: true,
                canRemove: true,
                image: null,
              },
            ],
          },
        },
      });
    });
    await purchase(page)
      .getByRole("button", { name: "Increase quantity", exact: true })
      .click();
    for (const key of ["ceremonial", "barista", "culinary"])
      await choose(page, key);
    await reader(page, "culinary")
      .locator("[data-new-hero7-sample-order]")
      .click();
    await add(page).focus();
    await add(page).evaluate((node) => {
      node.click();
      node.click();
    });
    const cart = page.getByRole("dialog").filter({
      has: page.getByRole("button", { name: "Close cart", exact: true }),
    });
    await cart.waitFor();
    assert.ok((await cart.textContent()).includes("¥12,000"));
    assert.deepEqual(orders, [
      {
        action: "add",
        productHandle: SAMPLE_SET_OFFER.productHandle,
        variantKey: `v1_${"s".repeat(43)}`,
        quantity: 2,
      },
    ]);
    await page.keyboard.press("Escape");
    await focused(
      add(page),
      "Ordering after learning restores purchase focus when the cart closes",
    );
    assert.equal(
      await dialog(page).count(),
      0,
      "Ordering leaves the learning popup closed",
    );
    assert.equal(await quantity(page).textContent(), "2");
  });
  console.log(
    "Learning about all three matcha leads to one correct Sample Set fixture order",
  );

  await fixture(390, "dark", {}, async ({ page }) => {
    await purchase(page)
      .getByRole("button", { name: "Increase quantity", exact: true })
      .click();
    await page
      .locator("header [data-nav-brand]")
      .evaluate((node) => node.click());
    await page.locator('[data-new-hero7-view="home"]:visible').waitFor();
    await page.locator("[data-new-hero7-samples]").click();
    await samples(page).waitFor();
    await choose(page, "barista");
    const current = page.url();
    // Simulate a global cart request while reading; inert UI cannot be clicked by a visitor.
    await page
      .getByRole("button", { name: /^Open cart,/ })
      .evaluate((node) => node.click());
    const cart = page.getByRole("dialog").filter({
      has: page.getByRole("button", { name: "Close cart", exact: true }),
    });
    await cart.waitFor();
    await close(page).evaluate((node) => node.click());
    await reader(page, "barista")
      .locator("[data-new-hero7-sample-product]")
      .evaluate((node) => node.click());
    assert.equal(page.url(), current, "A top cart guards lower reader actions");
    assert.equal(
      await dialog(page).evaluate((node) => node.matches(":modal")),
      true,
    );
    await page.goBack();
    await page.locator('[data-new-hero7-view="home"]:visible').waitFor();
    assert.equal(
      await page.locator("[data-new-hero7-sample-dialog][open]").count(),
      0,
      "Leaving Samples closes the hidden native reader",
    );
    assert.equal(await cart.isVisible(), true);
    await page.goForward();
    await samples(page).waitFor();
    assert.equal(
      await dialog(page).count(),
      0,
      "Returning to Samples defers its reader beneath an active cart",
    );
    assert.equal(
      await cart.evaluate((node) => node.contains(document.activeElement)),
      true,
      "The active cart retains focus through history",
    );
    await page.keyboard.press("Escape");
    await cart.waitFor({ state: "hidden" });
    await dialog(page).waitFor();
    assert.equal(
      await dialog(page).evaluate((node) => node.matches(":modal")),
      true,
    );
    await eventually(
      () =>
        dialog(page).evaluate((node) => node.contains(document.activeElement)),
      "The retained sample reader takes focus after cart dismissal",
    );
    assert.equal(await quantity(page).textContent(), "2");
    await closeReader(page);
    assert.equal(
      await page.evaluate(
        () =>
          getComputedStyle(document.documentElement).overflow !== "hidden" &&
          getComputedStyle(document.body).overflow !== "hidden",
      ),
      true,
      "Both modal scroll locks are released",
    );
  });
  console.log(
    "Sample reader history, hidden-view cleanup and nested cart guards retain the chosen set",
  );

  await fixture(390, "dark", { holdMutation: true }, async (test) => {
    const { page } = test;
    await choose(page, "barista");
    await reader(page, "barista")
      .locator("[data-new-hero7-sample-order]")
      .click();
    await add(page).click();
    await eventually(
      () => test.simulatedWrites.length === 1,
      "Only the held fixture receives the order",
    );
    const before = page.url();
    for (const selector of [
      "[data-new-hero7-sample-tab]",
      "[data-new-hero7-sample-close]",
      "[data-new-hero7-sample-order]",
      "[data-new-hero7-sample-product]",
    ]) {
      for (const control of await samples(page).locator(selector).all())
        await control.evaluate((node) => node.click());
    }
    assert.equal(page.url(), before);
    assert.equal(
      await dialog(page).count(),
      0,
      "Pending purchase cannot reopen a learning popup",
    );
    assert.equal(await add(page).isDisabled(), true);
    assert.deepEqual(test.simulatedWrites, [
      {
        action: "add",
        productHandle: SAMPLE_SET_OFFER.productHandle,
        variantKey: `v1_${"s".repeat(43)}`,
        quantity: 1,
      },
    ]);
    test.releaseMutation();
    await eventually(
      () => add(page).isEnabled(),
      "Rejected fixture orders restore buying controls",
    );
    await choose(page, "culinary");
  });
  console.log(
    "Reader and purchase controls retain the pending-order navigation guard",
  );

  await fixture(
    390,
    "light",
    {
      unavailable: true,
      beforeNavigation: async ({ context }) => {
        await context.route("**/api/catalog", (route) =>
          route.fulfill({
            json: {
              status: "unavailable",
              products: [],
              shopUrl: "https://example.invalid",
            },
          }),
        );
      },
    },
    async ({ page }) => {
      for (const key of ["ceremonial", "barista", "culinary"])
        await choose(page, key, true);
      assert.equal(
        await add(page).count(),
        0,
        "Unavailable commerce does not invent an order action",
      );
      await reader(page, "culinary")
        .locator("[data-new-hero7-sample-order]")
        .click();
      await focused(
        purchase(page),
        "The purchase action reaches the honest availability state",
      );
    },
  );
  console.log(
    "All sample learning remains available when the catalog is unavailable",
  );

  await fixture(
    390,
    "dark",
    {
      review: true,
      beforeNavigation: async ({ context }) => {
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
      },
    },
    async ({ page }) => {
      const confirm = purchase(page).getByRole("button", {
        name: "Confirm country",
        exact: true,
      });
      await confirm.waitFor();
      for (const key of ["ceremonial", "barista", "culinary"])
        await choose(page, key);
      assert.equal(
        await add(page).isDisabled(),
        true,
        "Learning cannot bypass country review",
      );
      await reader(page, "culinary")
        .locator("[data-new-hero7-sample-order]")
        .click();
      await focused(
        purchase(page),
        "The order action reaches the existing review control",
      );
      await confirm.click();
      await page
        .getByRole("dialog")
        .filter({
          has: page.getByRole("button", { name: "Close cart", exact: true }),
        })
        .waitFor();
      await page.keyboard.press("Escape");
    },
  );
  console.log(
    "Country review locks purchase while keeping product learning available",
  );

  await fixture(320, "light", {}, async ({ page }) => {
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    await choose(page, "ceremonial");
    await reader(page, "ceremonial")
      .locator("[data-new-hero7-sample-preparation] summary")
      .click();
    const lastObservation = reader(page, "ceremonial")
      .locator("[data-new-hero7-sample-preparation] li")
      .last();
    await lastObservation.scrollIntoViewIfNeeded();
    const popup = await dialog(page).boundingBox();
    const observation = await lastObservation.boundingBox();
    assert.ok(
      observation.y >= popup.y &&
        observation.y + observation.height <= popup.y + popup.height + 1,
      "The complete preparation remains reachable at 200% text",
    );
    for (const action of await reader(page, "ceremonial")
      .locator("[data-new-hero7-sample-order], [data-new-hero7-sample-product]")
      .all()) {
      await action.scrollIntoViewIfNeeded();
      const bounds = await action.boundingBox();
      assert.ok(
        bounds.y >= popup.y &&
          bounds.y + bounds.height <= popup.y + popup.height + 1,
        "Both follow-up actions remain reachable at 200% text",
      );
    }
    const dismiss = await close(page).boundingBox();
    assert.ok(
      dismiss.y >= popup.y &&
        dismiss.y + dismiss.height <= popup.y + popup.height,
      "Close stays reachable with enlarged content",
    );
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
      "Close remains unobstructed after enlarged content scrolls",
    );
    await fit(page, "320px / 200% text");
    await capture(page, "sample-learning-320-light-enlarged");
    await closeReader(page, "Escape");
  });
  console.log("Sample learning remains readable at 320px with 200% text");

  await fixture(
    390,
    "dark",
    { route: "/new-hero7/samples" },
    async ({ page }) => {
      await purchase(page)
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await choose(page, "culinary");
      const handoff = reader(page, "culinary").locator(
        "[data-new-hero7-sample-product]",
      );
      assert.equal(
        await handoff.getAttribute("href"),
        "/new-hero7/matcha#new-hero7-culinary",
      );
      await handoff.click();
      const product = page.locator("[data-new-hero7-product-dialog][open]");
      await product.waitFor();
      assert.equal(new URL(page.url()).pathname, "/new-hero7/matcha");
      assert.equal(new URL(page.url()).hash, "#new-hero7-culinary");
      assert.equal(
        await product.evaluate((node) => node.matches(":modal")),
        true,
      );
      assert.equal(
        await product
          .locator('[data-new-hero-product="culinary"]:visible')
          .count(),
        1,
      );
      await page.goBack();
      await samples(page).waitFor();
      await eventually(
        () =>
          quantity(page)
            .textContent()
            .then((value) => value === "2"),
        "Dedicated route handoff retains the Sample Set quantity",
      );
    },
  );
  console.log(
    "The dedicated Sample Set route retains the same learning experience",
  );
} finally {
  await browser.close();
}
