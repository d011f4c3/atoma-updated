/* Isolated purchase-button study: all external requests and network writes are
 * blocked. The canonical smoke uses reviewed local catalog fixtures only. */
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
const baseURL = process.env.PURCHASE_BUTTON_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const engine = process.env.PURCHASE_BUTTON_BROWSER ?? "chromium";
const evidence =
  process.env.PURCHASE_BUTTON_EVIDENCE ?? ".local/purchase-button-study-0209";
const filter = process.env.PURCHASE_BUTTON_FILTER;
const directions = ["current", "mineral", "split", "keyline"];
const names = {
  current: "Current",
  mineral: "Mineral",
  split: "Split",
  keyline: "Keyline",
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
    title: "Sample Set",
    options: SAMPLE_SET_OFFER.variants[0].options,
  },
  ...SAMPLE_SET_CONTENTS.map((item) => ({
    key: item.key,
    handle: item.productHandle,
    title: item.name,
    options: [{ name: "Format", value: "1 kg" }],
  })),
].map((item, index) => ({
  id: item.key,
  handle: item.handle,
  title: item.title,
  description: "Isolated button study fixture.",
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
await mkdir(evidence, { recursive: true });
const browser = await playwright[engine].launch(
  engine === "chromium"
    ? { channel: "chrome", headless: true }
    : { headless: true },
);
const results = [];

async function setup({
  width = 390,
  tone = "light",
  reducedMotion = "no-preference",
} = {}) {
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
  const errors = [];
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      errors.push(
        `Blocked external request or write: ${request.method()} ${url.pathname}`,
      );
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
    if (url.pathname === "/api/catalog")
      return route.fulfill({
        json: {
          status: "ready",
          destination,
          products,
          shopUrl: "https://example.invalid",
        },
      });
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
  return { context, page, errors, width, tone };
}

const root = (fixture) => fixture.page.locator("[data-purchase-button-study]");
const preview = (fixture) =>
  root(fixture).locator("[data-purchase-preview] button");
const option = (fixture, direction) =>
  root(fixture).locator(`[data-button-option="${direction}"]`);
const sharedButtons = (fixture) =>
  root(fixture).locator(
    "[data-purchase-preview] button, [data-button-option] button",
  );

async function open(fixture, query = "") {
  await fixture.page.goto(`${baseURL}/purchase-button-study/samples${query}`);
  await root(fixture).waitFor();
  await fixture.page.evaluate(() => document.fonts.ready);
  await root(fixture)
    .getByRole("combobox", { name: "Button state", exact: true })
    .waitFor();
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
}

async function checkState(fixture, state) {
  const [label, disabled, busy] = states[state];
  assert.equal(await root(fixture).getAttribute("data-preview-state"), state);
  assert.equal(await sharedButtons(fixture).count(), 5);
  for (const button of await sharedButtons(fixture).all()) {
    assert.equal(await button.isDisabled(), disabled);
    assert.equal(await button.getAttribute("aria-busy"), String(busy));
  }
  assert.equal(
    await root(fixture)
      .getByRole("button", { name: label, exact: true })
      .count(),
    5,
  );
}

async function checkGeometry(fixture) {
  const metrics = await root(fixture).evaluate((node) => {
    const overflow = [
      ...node.querySelectorAll("button, select, article, h1, h2, p, label"),
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
      .map((item) => ({
        tag: item.tagName,
        text: item.textContent.slice(0, 60),
        width: item.clientWidth,
        scrollWidth: item.scrollWidth,
      }));
    const buttons = [
      ...node.querySelectorAll(
        "[data-purchase-preview] button, [data-button-option] button",
      ),
    ].map((item) => {
      const box = item.getBoundingClientRect();
      return {
        width: box.width,
        height: box.height,
        text: item.innerText,
        color: getComputedStyle(item).color,
      };
    });
    const textContext = document.createElement("canvas").getContext("2d");
    const selectors = [...node.querySelectorAll("select")].map((selector) => {
      const style = getComputedStyle(selector);
      textContext.font = style.font;
      return {
        fieldFont: Number.parseFloat(style.fontSize),
        selectedText: selector.selectedOptions[0].text,
        selectedTextWidth: textContext.measureText(
          selector.selectedOptions[0].text,
        ).width,
        selectedSpace:
          selector.clientWidth -
          Number.parseFloat(style.paddingLeft) -
          Number.parseFloat(style.paddingRight) -
          24,
      };
    });
    return {
      overflow,
      buttons,
      smallControls: [...node.querySelectorAll("button, select")]
        .filter((item) => {
          const box = item.getBoundingClientRect();
          return box.width < 43.9 || box.height < 43.9;
        })
        .map((item) => ({
          tag: item.tagName,
          label: item.getAttribute("aria-label"),
          height: item.getBoundingClientRect().height,
        })),
      selectors,
      documentFits: document.documentElement.scrollWidth <= innerWidth + 1,
    };
  });
  assert.equal(metrics.documentFits, true);
  assert.deepEqual(metrics.overflow, []);
  if (fixture.width <= 760) {
    assert.deepEqual(
      metrics.smallControls,
      [],
      "Mobile controls have 44 px targets",
    );
    for (const selector of metrics.selectors) {
      assert.ok(
        selector.fieldFont >= 16,
        "Mobile selector uses at least 16 px type",
      );
      assert.ok(
        selector.selectedTextWidth <= selector.selectedSpace + 1,
        `Selected option fits without clipping: ${selector.selectedText}`,
      );
    }
  }
  assert.ok(
    metrics.buttons.every((item) => item.width >= 44 && item.height >= 44),
  );
  assert.ok(
    metrics.buttons.every(
      (item) => item.text.trim() && item.color !== "rgba(0, 0, 0, 0)",
    ),
  );
}

async function restStyle(button) {
  await settle(button);
  return button.evaluate((node) => ({
    styles: [node, ...node.children].map((item) => {
      const style = getComputedStyle(item);
      return {
        transform: style.transform,
        background: style.backgroundColor,
        color: style.color,
        opacity: style.opacity,
      };
    }),
    running: node
      .getAnimations({ subtree: true })
      .filter((animation) => animation.playState === "running")
      .map((animation) => animation.animationName ?? "transition"),
  }));
}

async function checkAlternative(fixture, direction) {
  const button = option(fixture, direction).locator("button");
  await button.scrollIntoViewIfNeeded();
  await fixture.page.mouse.move(1, 1);
  const before = await restStyle(button);
  assert.deepEqual(
    before.running,
    [],
    "Alternative buttons have no resting animation",
  );
  await button.evaluate((node) => {
    window.__buttonTextMutations = 0;
    window.__buttonTextObserver = new MutationObserver((records) => {
      window.__buttonTextMutations += records.filter(
        (record) =>
          record.type === "characterData" || record.type === "childList",
      ).length;
    });
    window.__buttonTextObserver.observe(node, {
      subtree: true,
      characterData: true,
      childList: true,
    });
  });
  if (fixture.width <= 760) await button.tap();
  else {
    await button.hover();
    await settle(button);
    await button.click();
    await fixture.page.mouse.move(1, 1);
    await button.evaluate((node) => node.blur());
  }
  await root(fixture)
    .getByRole("status")
    .getByText(
      `${names[direction]} interaction previewed. Your cart is unchanged.`,
      { exact: true },
    )
    .waitFor();
  await fixture.page.waitForTimeout(400);
  const after = await restStyle(button);
  assert.deepEqual(
    after,
    before,
    "Hover/touch feedback returns to its resting appearance",
  );
  const changes = await fixture.page.evaluate(() => {
    window.__buttonTextObserver.disconnect();
    return window.__buttonTextMutations;
  });
  assert.equal(
    changes,
    0,
    "Alternative labels remain steady during interaction",
  );
}

async function themeCookie(fixture) {
  return (await fixture.context.cookies()).find(
    (cookie) => cookie.name === "atoma-theme",
  )?.value;
}

async function finish(fixture) {
  assert.deepEqual(
    fixture.errors,
    [],
    "No browser exceptions, external requests or writes",
  );
  assert.equal(
    await themeCookie(fixture),
    fixture.tone,
    "The study does not persist a storefront theme preference",
  );
}

async function run(name, settings, action) {
  if (filter && !filter.split(",").some((part) => name.includes(part))) return;
  const fixture = await setup(settings);
  try {
    await action(fixture);
    await finish(fixture);
    const result = { engine, name, passed: true };
    results.push(result);
    await writeFile(
      `${evidence}/${engine}-${name}-result.json`,
      `${JSON.stringify(result, null, 2)}\n`,
    );
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
  for (const width of [320, 390, 1440])
    for (const tone of ["light", "dark"]) {
      await run(`layout-${width}-${tone}`, { width, tone }, async (fixture) => {
        await open(fixture);
        assert.equal(await root(fixture).getAttribute("data-tone"), tone);
        assert.equal(
          await preview(fixture).getAttribute("data-treatment"),
          "mineral",
        );
        await checkState(fixture, "ready");
        for (const direction of directions) {
          const card = option(fixture, direction);
          assert.equal(await card.count(), 1);
          assert.equal(
            await card.locator("button").getAttribute("data-treatment"),
            direction === "current" ? null : direction,
          );
        }
        await checkGeometry(fixture);
        for (const direction of directions.slice(1))
          await checkAlternative(fixture, direction);
        const state = root(fixture).getByRole("combobox", {
          name: "Button state",
          exact: true,
        });
        for (const value of Object.keys(states)) {
          await state.selectOption(value);
          await checkState(fixture, value);
          await checkGeometry(fixture);
        }
        await state.selectOption("ready");
        await root(fixture).screenshot({
          path: `${evidence}/${engine}-${width}-${tone}.png`,
        });
      });
    }

  await run(
    "query-state-keyboard",
    { width: 390, tone: "light" },
    async (fixture) => {
      await open(fixture, "?direction=keyline&tone=dark");
      assert.equal(await root(fixture).getAttribute("data-tone"), "dark");
      assert.equal(
        await preview(fixture).getAttribute("data-treatment"),
        "keyline",
      );
      assert.equal(
        await option(fixture, "keyline")
          .locator('input[name="purchase-direction"]')
          .isChecked(),
        true,
      );
      await fixture.page.evaluate(() => {
        window.__originalStudyButton = document.querySelector(
          "[data-purchase-preview] button",
        );
      });
      const state = root(fixture).getByRole("combobox", {
        name: "Button state",
        exact: true,
      });
      await state.selectOption("pending");
      const radio = option(fixture, "split").locator(
        'input[name="purchase-direction"]',
      );
      await radio.focus();
      await radio.press("Space");
      assert.equal(await radio.isChecked(), true);
      await checkState(fixture, "pending");
      assert.equal(
        new URL(fixture.page.url()).searchParams.get("direction"),
        "split",
      );
      const contextDirection = root(fixture).getByRole("combobox", {
        name: "Treatment in context",
        exact: true,
      });
      assert.equal(await contextDirection.inputValue(), "split");
      await contextDirection.selectOption("current");
      assert.equal(await preview(fixture).getAttribute("data-treatment"), null);
      await checkState(fixture, "pending");
      await contextDirection.selectOption("split");
      assert.equal(await radio.isChecked(), true);
      await root(fixture)
        .getByRole("switch", { name: "Dark mode in button study", exact: true })
        .click();
      assert.equal(await root(fixture).getAttribute("data-tone"), "light");
      await checkState(fixture, "pending");
      assert.equal(
        await fixture.page.evaluate(
          () =>
            document.querySelector("[data-purchase-preview] button") ===
            window.__originalStudyButton,
        ),
        true,
      );
      await state.selectOption("ready");
      await fixture.page.waitForFunction(
        () =>
          document.querySelector("[data-purchase-preview] button")?.disabled ===
          false,
      );
      await contextDirection.focus();
      // macOS WebKit uses Option-Tab to include buttons when full keyboard
      // access is off; plain Tab otherwise leaves focus on the document.
      await fixture.page.keyboard.press(
        engine === "webkit" ? "Alt+Tab" : "Tab",
      );
      assert.equal(
        await preview(fixture).evaluate(
          (node) => node === document.activeElement,
        ),
        true,
        `Keyboard target: ${await fixture.page.evaluate(() => document.activeElement?.outerHTML.slice(0, 260))}`,
      );
      assert.equal(
        await preview(fixture).evaluate(
          (node) =>
            node.matches(":focus-visible") &&
            getComputedStyle(node).outlineStyle !== "none" &&
            Number.parseFloat(getComputedStyle(node).outlineWidth) > 0,
        ),
        true,
        "Keyboard focus remains visible",
      );
      await preview(fixture).press("Enter");
      await root(fixture)
        .getByRole("status")
        .getByText("Split interaction previewed. Your cart is unchanged.", {
          exact: true,
        })
        .waitFor();
      await fixture.page.keyboard.press(
        engine === "webkit" ? "Alt+Tab" : "Tab",
      );
      assert.notEqual(
        await preview(fixture).evaluate(
          (node) => document.activeElement === node,
        ),
        true,
      );
    },
  );

  await run(
    "reduced-motion",
    { width: 320, tone: "dark", reducedMotion: "reduce" },
    async (fixture) => {
      await open(fixture);
      await root(fixture)
        .getByRole("combobox", { name: "Button state", exact: true })
        .selectOption("pending");
      await checkState(fixture, "pending");
      for (const button of await sharedButtons(fixture).all()) {
        assert.deepEqual((await restStyle(button)).running, []);
        assert.equal(
          await button.evaluate((node) =>
            [...node.querySelectorAll("span")].some((item) => {
              const style = getComputedStyle(item);
              return (
                style.display !== "none" &&
                style.borderTopStyle === "solid" &&
                style.borderRadius === "50%"
              );
            }),
          ),
          true,
          "Pending keeps a visible static progress indicator",
        );
      }
      await checkGeometry(fixture);
      await root(fixture).screenshot({
        path: `${evidence}/${engine}-reduced-pending.png`,
      });
    },
  );

  await run(
    "canonical-default",
    { width: 390, tone: "dark", reducedMotion: "reduce" },
    async (fixture) => {
      await fixture.page.goto(`${baseURL}/samples`);
      const button = fixture.page
        .locator("[data-sample-purchase]")
        .getByRole("button", { name: "Add to cart", exact: true });
      await button.waitFor();
      await fixture.page.waitForFunction(
        () =>
          document.querySelector(
            "[data-sample-purchase] button[data-available='true']",
          )?.disabled === false,
      );
      assert.equal(await button.getAttribute("data-treatment"), null);
      assert.equal(await button.isEnabled(), true);
      assert.equal(await button.getAttribute("aria-busy"), "false");
    },
  );
} finally {
  await browser.close();
  await writeFile(
    `${evidence}/${engine}${filter ? `-${filter.replace(/[^a-z0-9-]+/gi, "-")}` : ""}-results.json`,
    `${JSON.stringify(results, null, 2)}\n`,
  );
}
