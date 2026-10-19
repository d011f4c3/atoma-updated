/* Multiple Sample Set entrances: mocked reads; external requests and writes blocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { translate } from "../src/lib/i18n/index.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL =
  process.env.SAMPLES_ENTRY_STUDY_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.SAMPLES_ENTRY_STUDY_EVIDENCE ?? ".local/samples-entry-0153";
const filters = (process.env.SAMPLES_ENTRY_STUDY_FILTER ?? "")
  .split(",")
  .filter(Boolean);
const directions = ["connected", "featured", "quiet"];
const contexts = ["explore", "shop"];
const newRightEntries = ["invitation", "preparation", "alongside", "spotlight"];
const newRightNames = {
  invitation: "04 — Open invitation",
  preparation: "05 — By preparation",
  alongside: "06 — Alongside this tea",
  spotlight: "07 — Set spotlight",
};
const newRightCopy = {
  invitation: [
    "Start with samples",
    "Find your matcha.",
    "Three matcha · 20 g each",
  ],
  preparation: [
    "Sample Set",
    "Three ways to prepare.",
    "All three included.",
    "Three matcha · 20 g each",
  ],
  alongside: [
    "Included in the set",
    "Try it alongside the other two.",
    "Three matcha · 20 g each",
  ],
  spotlight: [
    "Sample Set",
    "Your starting point.",
    "Compare in your own preparation.",
  ],
};
const products = SAMPLE_SET_CONTENTS.map((item, index) => ({
  id: item.key,
  handle: item.productHandle,
  title: item.name,
  productCode: item.productCode,
  description: "Isolated sample entrance study fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
      title: "1 kg",
      available: true,
      priceMinor: 6123,
      currency: "JPY",
      options: [{ name: "Size", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));

await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
let passed = 0;

async function eventually(check, message) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function setup(width, locale = "en") {
  const browserContext = await browser.newContext({
    viewport: { width, height: width < 500 ? 800 : 900 },
    reducedMotion: "reduce",
    hasTouch: width < 500,
    isMobile: width < 500,
  });
  await browserContext.addCookies([
    { name: "atoma-theme", value: "light", url: baseURL },
    { name: "atoma-locale", value: locale, url: baseURL },
  ]);
  const errors = [];
  let catalogReads = 0;
  let cartReads = 0;
  await browserContext.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      errors.push(`Unexpected external request or write: ${request.method()}`);
      return route.abort();
    }
    if (url.pathname === "/api/cart") {
      cartReads++;
      return route.fulfill({ json: { kind: "empty", checkoutEnabled: false } });
    }
    if (url.pathname === "/api/catalog") {
      catalogReads++;
      return route.fulfill({
        json: { status: "ready", products, shopUrl: "https://example.invalid" },
      });
    }
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Unexpected API request: ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await browserContext.newPage();
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  return {
    browserContext,
    page,
    errors,
    reads: () => ({ catalog: catalogReads, cart: cartReads }),
  };
}

function preview(page, context) {
  return page.locator(`[data-entry-context="${context}"]`);
}

function control(page, name) {
  return page.getByRole("combobox", { name, exact: true });
}

async function selectWhileFocused(page, name, value) {
  const select = control(page, name);
  await select.focus();
  await select.selectOption(value);
  await page.evaluate(
    () =>
      new Promise((done) =>
        requestAnimationFrame(() => requestAnimationFrame(done)),
      ),
  );
  assert.equal(
    await select.evaluate((node) => node === document.activeElement),
    true,
    `${name} retains focus while its preview changes`,
  );
}

async function ready(page) {
  await page.locator("[data-samples-entry-study]").waitFor();
  await eventually(
    async () =>
      (await preview(page, "explore")
        .locator("[data-homepage-product-choice]")
        .count()) === 3 &&
      (await preview(page, "shop").locator("[data-shop-product]").count()) ===
        3,
    "Both mounted previews load the actual three teas",
  );
  await eventually(
    async () =>
      (await preview(page, "explore")
        .locator("[data-embedded]")
        .getAttribute("data-entry-settled")) === "true",
    "The Explore experience is ready for interaction",
  );
}

async function fit(page, context) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "The study has no page horizontal overflow",
  );
  for (const element of await preview(page, context)
    .locator("[data-sample-entry]:visible, [data-stage-selectors]:visible")
    .all())
    assert.equal(
      await element.evaluate(
        (node) => node.scrollWidth <= node.clientWidth + 1,
      ),
      true,
      "Each visible sample entrance fits without clipping its content",
    );
}

async function registerLabelsStayClear(choices) {
  for (const choice of await choices.all()) {
    const spacing = await choice.evaluate((node) => {
      const label = node.querySelector("[data-display-index]");
      const code = label?.querySelector(':scope > [aria-hidden="true"]');
      if (!label || !code) return null;
      const codeBox = code.getBoundingClientRect();
      return [...label.children]
        .filter((child) => child !== code && child.getClientRects().length > 0)
        .map((child) => {
          const box = child.getBoundingClientRect();
          return {
            text: child.textContent,
            separated:
              box.bottom + 3 <= codeBox.top ||
              codeBox.bottom + 3 <= box.top ||
              box.right + 3 <= codeBox.left ||
              codeBox.right + 3 <= box.left,
          };
        });
    });
    assert.ok(
      spacing?.length,
      "Each tea has visible identity text and its Register code",
    );
    for (const label of spacing)
      assert.equal(
        label.separated,
        true,
        `${label.text} has clear space from the Register code`,
      );
  }
}

async function entranceState(page, context, direction, tone) {
  const root = page.locator("[data-samples-entry-study]");
  assert.equal(await root.getAttribute("data-direction"), direction);
  assert.equal(await root.getAttribute("data-context"), context);
  assert.equal(await root.getAttribute("data-tone"), tone);
  for (const value of contexts) {
    const node = preview(page, value);
    assert.equal(await node.count(), 1);
    assert.equal(await node.isVisible(), value === context);
    assert.equal(
      await node.evaluate((element) => element.inert),
      value !== context,
      "Only the chosen preview can receive input",
    );
  }
  const active = preview(page, context);
  const allLinks = active.locator('a[href="/samples"]');
  assert.ok(
    (await allLinks.count()) >= 3,
    "Each preview offers at least three sample entrances including navigation",
  );
  const mainLinks = allLinks.filter({
    hasNot: page.locator("[data-nav-action]"),
  });
  const visibleContentLinks = await mainLinks.evaluateAll(
    (nodes) =>
      nodes.filter(
        (node) =>
          !node.hasAttribute("data-nav-action") &&
          node.getClientRects().length > 0,
      ).length,
  );
  assert.ok(
    visibleContentLinks >= 2,
    "At least two content entrances are available together",
  );
  assert.equal(
    await active.locator('[data-nav-action="samples"]').getAttribute("href"),
    "/samples",
  );
  for (const entry of await active.locator("[data-sample-entry]").all()) {
    assert.equal(await entry.getAttribute("href"), "/samples");
    assert.ok(await entry.getAttribute("data-sample-entry-point"));
    assert.doesNotMatch(
      await entry.innerText(),
      /[¥￥$]|JPY|4,800|1,000|6,123/,
      "Entrances introduce the confirmed contents without an invented offer",
    );
  }
  if (context === "explore") {
    assert.equal(
      await active.locator("main").getAttribute("data-exploring"),
      "true",
    );
    const choices = active.locator("[data-homepage-product-choice]");
    assert.equal(await choices.count(), 3);
    for (const choice of await choices.all())
      assert.equal(await choice.isVisible(), true);
    await registerLabelsStayClear(choices);
    assert.equal(
      await active
        .locator('[data-homepage-product-choice][aria-pressed="true"]')
        .count(),
      1,
      "A real tea remains selected",
    );
    assert.equal(await active.locator("[data-sample-select]").count(), 0);
  } else {
    assert.equal(await active.locator("[data-shop-product]").count(), 3);
    for (const product of await active.locator("[data-shop-product]").all())
      assert.equal(await product.isVisible(), true);
  }
  assert.equal(
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest("[data-entry-context][inert]")),
    ),
    false,
    "Focus is never left inside an inactive preview",
  );
  await fit(page, context);
}

async function appearanceCookie(fixture) {
  assert.equal(
    (await fixture.browserContext.cookies()).find(
      (item) => item.name === "atoma-theme",
    )?.value,
    "light",
    "Study appearance leaves the canonical preference unchanged",
  );
}

async function screenshot(page, name) {
  await page.screenshot({
    path: resolve(evidence, `${name}.png`),
    fullPage: true,
    animations: "disabled",
  });
}

async function newRightEntry(page, right, view, locale = "en") {
  const explore = preview(page, "explore");
  const entry = explore.locator(`[data-sample-right-treatment="${right}"]`);
  const expected =
    right === "invitation" ||
    right === "alongside" ||
    view === "Overview" ||
    (right === "preparation" && view === "Shop");
  assert.equal(
    await entry.count(),
    expected ? 1 : 0,
    `${right} appears only in its intended ${view} placement`,
  );
  if (!expected) return null;
  await entry.waitFor({ state: "visible" });
  const inScroll = await entry.evaluate((node) =>
    Boolean(node.closest("[data-selection-scroll]")),
  );
  assert.equal(
    inScroll,
    right === "preparation" || right === "spotlight",
    `${right} has the intended relationship to the information scroll area`,
  );
  const position = await entry.evaluate((node) => {
    const panel = node.closest("[data-embedded]");
    const scroll = panel.querySelector("[data-selection-scroll]");
    const tabs = panel.querySelector("[data-shopping-mode]");
    return {
      beforeScroll: Boolean(
        node.compareDocumentPosition(scroll) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
      afterScroll: Boolean(
        node.compareDocumentPosition(scroll) & Node.DOCUMENT_POSITION_PRECEDING,
      ),
      beforeTabs: Boolean(
        node.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    };
  });
  if (right === "invitation") {
    assert.equal(position.beforeScroll, true);
    assert.equal(
      position.beforeTabs,
      true,
      "Invitation precedes the view tabs",
    );
  }
  if (right === "alongside") {
    assert.equal(
      position.afterScroll,
      true,
      "Alongside follows the information scroll area",
    );
    const selected = await explore
      .locator('[data-homepage-product-choice][aria-pressed="true"]')
      .getAttribute("data-homepage-product-choice");
    assert.equal(await entry.getAttribute("data-sample-selected"), selected);
    const item = SAMPLE_SET_CONTENTS.find((item) => item.key === selected);
    assert.ok(
      (await entry.innerText()).includes(translate(locale, item.name)),
      "The companion names the actual selected tea",
    );
  }
  if (inScroll) {
    const body = explore.locator(
      view === "Shop"
        ? "[data-shop-exploration]"
        : "[data-homepage-product-information]",
    );
    assert.equal(
      await entry.evaluate(
        (node, content) =>
          Boolean(
            node.compareDocumentPosition(content) &
            Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        await body.elementHandle(),
      ),
      true,
      "The sample entrance precedes the selected tea information",
    );
  }
  const destination = entry.locator(
    `[data-sample-entry-point="information-${right}"]`,
  );
  assert.equal(await destination.count(), 1);
  assert.equal(await destination.getAttribute("href"), "/samples");
  assert.equal(await destination.getAttribute("data-sample-entry"), right);
  assert.equal(
    await destination.getAttribute("aria-label"),
    translate(locale, "Explore the sample set"),
  );
  assert.doesNotMatch(
    await entry.innerText(),
    /[¥￥$]|JPY|6,123|checkout|add to cart/i,
  );
  assert.match(
    await entry.innerText(),
    /20\s*g/i,
    "The confirmed 20 g portions remain visible",
  );
  for (const [, grams] of (await entry.innerText()).matchAll(/(\d+)\s*g\b/gi))
    assert.ok(
      ["20", "60"].includes(grams),
      "Only the confirmed portion and total weights are stated",
    );
  const images = entry.locator("img");
  assert.ok(
    (await images.count()) > 0,
    "The treatment features the sample materials",
  );
  for (const image of await images.all())
    await eventually(
      () => image.evaluate((node) => node.complete && node.naturalWidth > 0),
      "Each sample preview photograph loads",
    );
  await destination.scrollIntoViewIfNeeded();
  assert.equal(await destination.isVisible(), true);
  assert.equal(
    await destination.evaluate((node) => {
      const box = node.getBoundingClientRect();
      return node.contains(
        document.elementFromPoint(
          box.x + box.width / 2,
          box.y + box.height / 2,
        ),
      );
    }),
    true,
    "The sample destination is exposed to pointer and touch input",
  );
  assert.equal(
    await destination.evaluate((node) => {
      const box = node.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(node);
      return [...range.getClientRects()].every(
        (text) =>
          text.width === 0 ||
          (text.left >= box.left - 1 &&
            text.right <= box.right + 1 &&
            text.top >= box.top - 1 &&
            text.bottom <= box.bottom + 1),
      );
    }),
    true,
    "The sample destination label fits inside its clickable area",
  );
  const size = await entry.evaluate((node) => ({
    width: node.clientWidth,
    content: node.scrollWidth,
  }));
  assert.ok(
    size.content <= size.width + 1,
    `${right}/${view} fits its panel: ${size.content}px content in ${size.width}px`,
  );
  await fit(page, "explore");
  return entry;
}

async function run(name, args, check) {
  if (filters.length && !filters.some((filter) => name.includes(filter)))
    return;
  const fixture = await setup(...args);
  try {
    await check(fixture);
    assert.deepEqual(fixture.errors, []);
    passed++;
    console.log(`${name}: passed`);
  } catch (error) {
    await screenshot(fixture.page, `${name}-failure`);
    throw error;
  } finally {
    await fixture.browserContext.close();
  }
}

try {
  for (const width of [1440, 768, 390, 320])
    await run(`matrix-${width}`, [width], async (fixture) => {
      const { page } = fixture;
      await page.goto(`${baseURL}/samples-entry-study`);
      await ready(page);
      const reads = fixture.reads();
      assert.ok(
        reads.catalog === 2 || reads.catalog === 4,
        "Two catalog owners load once, with development Strict Mode replay allowed",
      );
      for (const tone of ["light", "dark"]) {
        await control(page, "Study appearance").selectOption(tone);
        for (const direction of directions) {
          await control(page, "Entry point direction").selectOption(direction);
          for (const context of contexts) {
            await control(page, "Preview context").selectOption(context);
            await entranceState(page, context, direction, tone);
            assert.deepEqual(
              fixture.reads(),
              reads,
              "Changing study controls does not fetch catalog or cart again",
            );
            await appearanceCookie(fixture);
            for (const image of await preview(page, context)
              .locator("[data-sample-entry] img:visible")
              .all())
              await eventually(
                () =>
                  image.evaluate(
                    (node) => node.complete && node.naturalWidth > 0,
                  ),
                "Every sample photograph loads",
              );
            await screenshot(page, `${width}-${tone}-${direction}-${context}`);
          }
        }
      }
    });

  for (const width of [1440, 320])
    await run(`continuity-${width}`, [width], async (fixture) => {
      const { page } = fixture;
      await page.goto(`${baseURL}/samples-entry-study`);
      await ready(page);
      const explore = preview(page, "explore");
      await explore.locator('[data-homepage-product-choice="barista"]').click();
      await explore
        .getByRole("group", { name: "Shopping mode", exact: true })
        .getByRole("button", { name: "Shop", exact: true })
        .click();
      await explore
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      const stableSelectors = [
        '[data-entry-context="explore"]',
        '[data-entry-context="shop"]',
        "[data-embedded]",
        "[data-tea-material]",
        '[data-material="matcha"][data-stage="powder"]',
        '[data-entry-context="shop"] [data-shop-product="barista"]',
      ];
      const handles = new Map();
      for (const selector of stableSelectors)
        handles.set(selector, await page.locator(selector).elementHandle());
      const reads = fixture.reads();
      for (const direction of directions) {
        await selectWhileFocused(page, "Preview context", "shop");
        await selectWhileFocused(page, "Entry point direction", direction);
        await selectWhileFocused(page, "Study appearance", "dark");
        await entranceState(page, "shop", direction, "dark");
        await selectWhileFocused(page, "Preview context", "explore");
        await entranceState(page, "explore", direction, "dark");
        assert.equal(
          await explore.locator("[data-embedded]").getAttribute("data-mode"),
          "builder",
          "The selected tea's Shop view is preserved",
        );
        assert.equal(
          await explore
            .locator('[data-homepage-product-choice="barista"]')
            .getAttribute("aria-pressed"),
          "true",
        );
        assert.equal(
          Number(
            await explore.getByLabel("Quantity", { exact: true }).textContent(),
          ),
          2,
          "Tea quantity survives context, direction and appearance changes",
        );
        for (const [selector, handle] of handles)
          assert.equal(
            await page
              .locator(selector)
              .evaluate((node, original) => node === original, handle),
            true,
            `${selector} remains mounted`,
          );
        assert.deepEqual(fixture.reads(), reads);
        await appearanceCookie(fixture);
      }
    });

  for (const width of [1440, 320])
    await run(`origins-isolation-${width}`, [width], async (fixture) => {
      const { page } = fixture;
      await page.goto(`${baseURL}/samples-entry-study?context=shop`);
      await ready(page);
      let settledReads = fixture.reads();
      const explore = preview(page, "explore");

      async function roundTrip(context, returnLabel) {
        assert.deepEqual(
          fixture.reads(),
          settledReads,
          "Switching previews does not add catalog requests",
        );
        const active = preview(page, context);
        const menu = active.locator("[data-nav-summary]");
        const entry = active.locator('[data-nav-action="origins"]');
        const mobileMenu = await menu.isVisible();
        if (!(await entry.isVisible())) await menu.click();
        const before = page.url();
        await entry.click();
        const reader = page.locator("[data-origins-dialog][open]");
        await reader.waitFor();
        const back = reader.getByRole("button", {
          name: returnLabel,
          exact: true,
        });
        assert.equal(
          await back.count(),
          1,
          "Origins names only the visible preview's return target",
        );
        if (context === "shop")
          assert.equal(
            await reader
              .getByRole("button", { name: /Return to .*Matcha/ })
              .count(),
            0,
            "A hidden Explore tea does not leak into Shop's Origins return label",
          );
        await back.click();
        await reader.waitFor({ state: "hidden" });
        await page
          .locator("[data-origins-dialog] [data-origins-content]")
          .waitFor({ state: "detached" });
        await eventually(
          () => page.url() === before,
          "Origins restores the selected study context URL",
        );
        assert.equal(
          await page
            .locator("[data-samples-entry-study]")
            .getAttribute("data-context"),
          context,
        );
        const returnTarget = mobileMenu ? menu : entry;
        await eventually(
          () =>
            returnTarget.evaluate((node) => node === document.activeElement),
          "Origins restores focus to the visible context's navigation",
        );
        assert.equal(
          await page.evaluate(() =>
            Boolean(
              document.activeElement?.closest("[data-entry-context][inert]"),
            ),
          ),
          false,
        );
        settledReads = fixture.reads();
      }

      await roundTrip("shop", "Return to matcha");
      await selectWhileFocused(page, "Preview context", "explore");
      await explore.locator('[data-homepage-product-choice="barista"]').click();
      await explore
        .getByRole("group", { name: "Shopping mode", exact: true })
        .getByRole("button", { name: "Shop", exact: true })
        .click();
      await explore
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await roundTrip("explore", "Return to Barista Matcha");
      await selectWhileFocused(page, "Preview context", "shop");
      await roundTrip("shop", "Return to matcha");
      await selectWhileFocused(page, "Preview context", "explore");
      await roundTrip("explore", "Return to Barista Matcha");
      assert.equal(
        Number(
          await explore.getByLabel("Quantity", { exact: true }).textContent(),
        ),
        2,
      );
      assert.equal(
        await explore.locator("[data-embedded]").getAttribute("data-mode"),
        "builder",
      );
      assert.deepEqual(fixture.reads(), settledReads);
      await fit(page, "explore");
    });

  for (const context of contexts)
    await run(`keyboard-destination-${context}`, [1440], async ({ page }) => {
      await page.goto(`${baseURL}/samples-entry-study?context=${context}`);
      await ready(page);
      const entry = preview(page, context)
        .locator("[data-sample-entry]:visible")
        .first();
      await entry.focus();
      assert.equal(
        await entry.evaluate((node) => node === document.activeElement),
        true,
      );
      await page.keyboard.press("Enter");
      await page.waitForURL(`${baseURL}/samples`);
      await page
        .locator("[data-samples-page] [data-sample-unavailable]")
        .waitFor();
      assert.equal(await page.locator("[data-sample-order]").count(), 0);
    });

  await run("mobile-navigation", [320], async ({ page }) => {
    await page.goto(`${baseURL}/samples-entry-study`);
    await ready(page);
    for (const context of contexts) {
      await control(page, "Preview context").selectOption(context);
      const active = preview(page, context);
      const menu = active.locator("[data-nav-summary]");
      await menu.click();
      const samples = active.locator('[data-nav-action="samples"]');
      assert.equal(await samples.isVisible(), true);
      assert.equal(await samples.getAttribute("href"), "/samples");
      await samples.focus();
      await page.keyboard.press("Escape");
      await eventually(
        () => samples.isHidden(),
        "Escape closes the mobile navigation",
      );
      assert.equal(
        await menu.evaluate((node) => node === document.activeElement),
        true,
      );
    }
    await preview(page, "shop").locator("[data-nav-summary]").click();
    await preview(page, "shop").locator('[data-nav-action="samples"]').click();
    await page.waitForURL(`${baseURL}/samples`);
    await page
      .locator("[data-samples-page] [data-sample-unavailable]")
      .waitFor();
  });

  for (const locale of ["ja", "zh-Hant"])
    await run(`localized-${locale}`, [320, locale], async ({ page }) => {
      await page.goto(`${baseURL}/samples-entry-study`);
      await ready(page);
      for (const direction of directions) {
        await control(page, "Entry point direction").selectOption(direction);
        for (const context of contexts) {
          await control(page, "Preview context").selectOption(context);
          await entranceState(page, context, direction, "light");
          await screenshot(page, `320-${locale}-${direction}-${context}`);
        }
      }
    });

  await run("query-fallbacks", [320], async ({ page }) => {
    for (const direction of directions)
      for (const context of contexts) {
        await page.goto(
          `${baseURL}/samples-entry-study?direction=${direction}&context=${context}`,
        );
        await ready(page);
        await entranceState(page, context, direction, "light");
      }
    for (const query of [
      "",
      "direction=unknown&context=unknown",
      "direction=__proto__&context=__proto__",
      "direction=constructor&context=constructor",
      "direction=FEATURED&context=SHOP",
      "direction=featured&direction=quiet&context=shop&context=explore",
    ]) {
      await page.goto(
        `${baseURL}/samples-entry-study${query ? `?${query}` : ""}`,
      );
      await ready(page);
      await entranceState(page, "explore", "connected", "light");
    }
  });

  for (const width of [1440, 320])
    await run(`right-entrances-${width}`, [width], async (fixture) => {
      const { page } = fixture;
      await page.goto(
        `${baseURL}/samples-entry-study?direction=quiet&right=off`,
      );
      await ready(page);
      const explore = preview(page, "explore");
      const views = explore.getByRole("group", {
        name: "Shopping mode",
        exact: true,
      });
      await explore.locator('[data-homepage-product-choice="barista"]').click();
      await views.getByRole("button", { name: "Shop", exact: true }).click();
      await explore
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      const material = await explore
        .locator("[data-tea-material]")
        .elementHandle();
      const reads = fixture.reads();

      for (const tone of ["light", "dark"]) {
        await selectWhileFocused(page, "Study appearance", tone);
        for (const right of ["off", "note", "panel", "footnote"]) {
          await selectWhileFocused(page, "Right-side sample entry", right);
          assert.equal(new URL(page.url()).searchParams.get("right"), right);
          assert.equal(
            await page
              .locator("[data-samples-entry-study]")
              .getAttribute("data-right-entry"),
            right,
          );
          for (const view of ["Overview", "Specifications", "Origin", "Shop"]) {
            await views
              .getByRole("button", { name: view, exact: true })
              .click();
            const expected =
              view === "Overview"
                ? right !== "off"
                : view === "Shop" && (right === "note" || right === "footnote");
            const entries = explore.locator(
              "[data-selection-scroll] [data-sample-entry]",
            );
            assert.equal(
              await entries.count(),
              expected ? 1 : 0,
              `${right} has the intended presence in ${view}`,
            );
            assert.equal(
              await explore
                .locator('[data-stage-selectors] [data-sample-entry="rail"]')
                .count(),
              1,
              "Every right-side comparison retains the approved left rail",
            );
            assert.equal(
              await explore
                .locator('[data-brand-part="hero-footer"] a[href="/samples"]')
                .count(),
              0,
              "Explicit right-side comparisons do not add footer repetition",
            );
            if (expected) {
              const entry = entries.first();
              assert.equal(await entry.getAttribute("href"), "/samples");
              assert.equal(
                await entry.getAttribute("data-sample-entry"),
                right === "panel" ? "panel" : "note",
              );
              const body = explore.locator(
                view === "Shop"
                  ? "[data-shop-exploration]"
                  : "[data-homepage-product-information]",
              );
              const entryBox = await entry.boundingBox();
              const bodyBox = await body.boundingBox();
              assert.ok(entryBox && bodyBox);
              assert.equal(
                right === "footnote"
                  ? entryBox.y >= bodyBox.y + bodyBox.height - 1
                  : entryBox.y + entryBox.height <= bodyBox.y + 1,
                true,
                "The invitation sits in its chosen position relative to the tea information",
              );
            }
            await fit(page, "explore");
            if (view === "Overview")
              await screenshot(page, `${width}-${tone}-right-${right}`);
          }
          assert.equal(
            await explore
              .locator('[data-homepage-product-choice="barista"]')
              .getAttribute("aria-pressed"),
            "true",
          );
          assert.equal(
            Number(
              await explore
                .getByLabel("Quantity", { exact: true })
                .textContent(),
            ),
            2,
          );
          assert.equal(
            await explore
              .locator("[data-tea-material]")
              .evaluate((node, original) => node === original, material),
            true,
            "The selected material remains mounted between right-side treatments",
          );
          assert.deepEqual(fixture.reads(), reads);
        }
      }
      await appearanceCookie(fixture);
      await views
        .getByRole("button", { name: "Overview", exact: true })
        .click();
      await explore
        .locator('[data-sample-entry-point="information-footnote"]')
        .focus();
      await page.keyboard.press("Enter");
      await page.waitForURL(`${baseURL}/samples`);
      await page
        .locator("[data-samples-page] [data-sample-unavailable]")
        .waitFor();
      assert.equal(await page.locator("[data-sample-order]").count(), 0);
    });

  for (const right of ["invitation", "preparation"])
    await run(
      `right-priority-shop-focus-${right}`,
      [1440],
      async ({ page }) => {
        await page.goto(
          `${baseURL}/samples-entry-study?direction=quiet&right=${right}`,
        );
        await ready(page);
        const explore = preview(page, "explore");
        await explore
          .locator('[data-homepage-product-choice="barista"]')
          .click();
        const action = explore.getByRole("button", {
          name: "Shop this matcha",
          exact: false,
        });
        await action.focus();
        await page.keyboard.press("Enter");
        const heading = explore.locator(
          '[data-shop-exploration] h2[tabindex="-1"]',
        );
        await eventually(
          async () =>
            (await heading.count()) === 1 &&
            (await heading.evaluate((node) => node === document.activeElement)),
          "Keyboard entry focuses the selected tea's Shop heading, beyond the sample promotion",
        );
        assert.equal(
          await explore.locator("[data-embedded]").getAttribute("data-mode"),
          "builder",
        );
        assert.match(await heading.innerText(), /Barista Matcha/i);
        assert.equal(
          await explore
            .locator('[data-homepage-product-choice="barista"]')
            .getAttribute("aria-pressed"),
          "true",
        );
      },
    );

  for (const width of [1440, 768, 320])
    await run(`right-refined-${width}`, [width], async (fixture) => {
      const { page } = fixture;
      await page.goto(
        `${baseURL}/samples-entry-study?direction=quiet&right=folio`,
      );
      await ready(page);
      const explore = preview(page, "explore");
      const views = explore.getByRole("group", {
        name: "Shopping mode",
        exact: true,
      });
      await explore.locator('[data-homepage-product-choice="barista"]').click();
      await views.getByRole("button", { name: "Shop", exact: true }).click();
      await explore
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      const material = await explore
        .locator("[data-tea-material]")
        .elementHandle();
      const reads = fixture.reads();
      for (const tone of ["light", "dark"]) {
        await selectWhileFocused(page, "Study appearance", tone);
        for (const right of ["folio", "companion", "compare"]) {
          await selectWhileFocused(page, "Right-side sample entry", right);
          assert.equal(new URL(page.url()).searchParams.get("right"), right);
          await views
            .getByRole("button", { name: "Overview", exact: true })
            .click();
          const entry = explore.locator(
            `[data-sample-right-treatment="${right}"]`,
          );
          await entry.waitFor({ state: "visible" });
          assert.equal(
            await explore
              .locator('[data-stage-selectors] [data-sample-entry="rail"]')
              .count(),
            1,
          );
          assert.doesNotMatch(await entry.innerText(), /[¥￥$]|JPY|6,123/);
          if (right === "compare") {
            const summary = entry.locator("summary");
            await summary.focus();
            await page.keyboard.press("Enter");
            assert.equal(await entry.getAttribute("open"), "");
            assert.equal(await entry.locator("li").count(), 3);
            assert.match(
              await entry.locator('[data-selected="true"]').innerText(),
              /Barista Matcha/,
            );
            for (const item of SAMPLE_SET_CONTENTS)
              assert.match(
                await entry.innerText(),
                new RegExp(item.application),
              );
            await page.keyboard.press("Escape");
            assert.equal(await entry.getAttribute("open"), null);
            assert.equal(
              await summary.evaluate((node) => node === document.activeElement),
              true,
            );
            await summary.click();
          }
          for (const image of await entry.locator("img:visible").all())
            await eventually(
              () =>
                image.evaluate(
                  (node) => node.complete && node.naturalWidth > 0,
                ),
              "The right-side sample photographs load",
            );
          assert.equal(
            await entry.evaluate(
              (node) => node.scrollWidth <= node.clientWidth + 1,
            ),
            true,
          );
          if (right === "companion") {
            assert.equal(
              await entry.evaluate((node) =>
                Boolean(node.closest("[data-selection-scroll]")),
              ),
              false,
              "The companion sits outside the information scroll area",
            );
            const scroll = explore.locator("[data-selection-scroll]");
            await scroll.evaluate((node) => {
              node.scrollTop = node.scrollHeight;
            });
            assert.equal(await entry.isVisible(), true);
          }
          await fit(page, "explore");
          await screenshot(page, `${width}-${tone}-refined-${right}`);
          await entry.screenshot({
            path: resolve(evidence, `${width}-${tone}-detail-${right}.png`),
            animations: "disabled",
          });
          await views
            .getByRole("button", { name: "Specifications", exact: true })
            .click();
          assert.equal(
            await explore.locator("[data-sample-right-treatment]").count(),
            right === "companion" ? 1 : 0,
          );
          await views
            .getByRole("button", { name: "Shop", exact: true })
            .click();
          assert.equal(
            await explore.locator("[data-sample-right-treatment]").count(),
            right === "folio" ? 0 : 1,
          );
          assert.equal(
            Number(
              await explore
                .getByLabel("Quantity", { exact: true })
                .textContent(),
            ),
            2,
          );
          assert.equal(
            await explore
              .locator('[data-homepage-product-choice="barista"]')
              .getAttribute("aria-pressed"),
            "true",
          );
          assert.equal(
            await explore
              .locator("[data-tea-material]")
              .evaluate((node, original) => node === original, material),
            true,
          );
          assert.deepEqual(fixture.reads(), reads);
        }
      }
      await appearanceCookie(fixture);
      const compare = explore.locator(
        '[data-sample-right-treatment="compare"]',
      );
      await compare.locator("summary").click();
      const link = compare.locator('a[href="/samples"]');
      await link.focus();
      await page.keyboard.press("Enter");
      await page.waitForURL(`${baseURL}/samples`);
      await page.locator("[data-sample-unavailable]").waitFor();
    });

  for (const locale of ["ja", "zh-Hans", "zh-Hant"])
    await run(
      `right-refined-locale-${locale}`,
      [320, locale],
      async ({ page }) => {
        await page.goto(
          `${baseURL}/samples-entry-study?direction=quiet&right=folio`,
        );
        await ready(page);
        const explore = preview(page, "explore");
        for (const right of ["folio", "companion", "compare"]) {
          await selectWhileFocused(page, "Right-side sample entry", right);
          const entry = explore.locator(
            `[data-sample-right-treatment="${right}"]`,
          );
          if (right === "compare") await entry.locator("summary").click();
          assert.doesNotMatch(
            await entry.innerText(),
            /Sample Set|Ceremonial|Barista|Culinary|Explore|Three matcha|starting point|included|total/,
          );
          assert.equal(
            await entry.evaluate(
              (node) => node.scrollWidth <= node.clientWidth + 1,
            ),
            true,
          );
          await fit(page, "explore");
        }
        await screenshot(page, `320-${locale}-refined-compare`);
      },
    );

  for (const width of [1440, 768, 320])
    await run(`right-priority-${width}`, [width], async (fixture) => {
      const { page } = fixture;
      await page.goto(
        `${baseURL}/samples-entry-study?direction=quiet&right=invitation`,
      );
      await ready(page);
      const explore = preview(page, "explore");
      const views = explore.locator("[data-shopping-mode]");
      await explore.locator('[data-homepage-product-choice="barista"]').click();
      await views.getByRole("button", { name: "Shop", exact: true }).click();
      await explore
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      const material = await explore
        .locator("[data-tea-material]")
        .elementHandle();
      const reads = fixture.reads();
      async function selectedTeaIsIntact() {
        assert.equal(
          await explore
            .locator('[data-homepage-product-choice="barista"]')
            .getAttribute("aria-pressed"),
          "true",
          "Sample exploration leaves the selected tea unchanged",
        );
        assert.equal(
          await explore
            .locator("[data-tea-material]")
            .evaluate((node, original) => node === original, material),
          true,
          "The material scene remains mounted",
        );
        assert.deepEqual(
          fixture.reads(),
          reads,
          "Sample previews do not fetch catalog or cart again",
        );
      }
      for (const tone of ["light", "dark"]) {
        await selectWhileFocused(page, "Study appearance", tone);
        for (const right of newRightEntries) {
          if (tone === "light") {
            const quickOptions = page.getByRole("group", {
              name: "New right-side studies",
              exact: true,
            });
            assert.equal(await quickOptions.getByRole("button").count(), 4);
            const quick = quickOptions.getByRole("button", {
              name: newRightNames[right],
              exact: true,
            });
            if (width === 320) await quick.tap();
            else {
              await quick.focus();
              await page.keyboard.press("Enter");
            }
            assert.equal(await quick.getAttribute("aria-pressed"), "true");
            assert.equal(
              await control(page, "Right-side sample entry").inputValue(),
              right,
            );
          } else
            await selectWhileFocused(page, "Right-side sample entry", right);
          assert.equal(new URL(page.url()).searchParams.get("right"), right);
          for (const view of ["Overview", "Specifications", "Origin", "Shop"]) {
            await views
              .getByRole("button", { name: view, exact: true })
              .click();
            const entry = await newRightEntry(page, right, view);
            if (entry) {
              if (right === "preparation") {
                const buttons = entry.locator("button[data-sample-preview]");
                assert.equal(await buttons.count(), 3);
                for (const item of SAMPLE_SET_CONTENTS) {
                  const button = entry.locator(
                    `[data-sample-preview="${item.key}"]`,
                  );
                  if (width === 320) await button.tap();
                  else {
                    await button.focus();
                    await page.keyboard.press("Enter");
                  }
                  assert.equal(
                    await button.getAttribute("aria-pressed"),
                    "true",
                  );
                  assert.equal(
                    await entry
                      .locator(
                        'button[data-sample-preview][aria-pressed="true"]',
                      )
                      .count(),
                    1,
                  );
                  if (width !== 320)
                    assert.equal(
                      await button.evaluate(
                        (node) => node === document.activeElement,
                      ),
                      true,
                      "Preview controls retain keyboard focus",
                    );
                  assert.equal(
                    await entry.getAttribute("data-sample-preview-active"),
                    item.key,
                  );
                  assert.match(
                    await entry.locator('[aria-live="polite"]').innerText(),
                    new RegExp(item.name.replace(/ Matcha$/, "")),
                  );
                  assert.equal(
                    await entry
                      .locator("[data-active] img")
                      .getAttribute("src"),
                    item.image,
                  );
                  await selectedTeaIsIntact();
                }
              }
              assert.equal(
                await entry.evaluate(
                  (node) =>
                    node
                      .getAnimations({ subtree: true })
                      .filter((animation) => animation.playState === "running")
                      .length,
                ),
                0,
                "Reduced motion keeps the sample treatment still",
              );
              if (view === "Overview") {
                await screenshot(page, `${width}-${tone}-priority-${right}`);
                await entry.screenshot({
                  path: resolve(
                    evidence,
                    `${width}-${tone}-priority-detail-${right}.png`,
                  ),
                  animations: "disabled",
                });
              }
            }
            await selectedTeaIsIntact();
            await fit(page, "explore");
          }
          assert.equal(
            Number(
              await explore
                .getByLabel("Quantity", { exact: true })
                .textContent(),
            ),
            2,
          );
          await appearanceCookie(fixture);
        }
      }
    });

  for (const [index, right] of newRightEntries.entries())
    await run(
      `right-priority-destination-${right}`,
      [index % 2 ? 320 : 1440],
      async ({ page }) => {
        await page.goto(
          `${baseURL}/samples-entry-study?direction=quiet&right=${right}`,
        );
        await ready(page);
        const entry = await newRightEntry(page, right, "Overview");
        const link = entry.locator(
          `[data-sample-entry-point="information-${right}"]`,
        );
        if (page.viewportSize().width === 320) await link.tap();
        else {
          await link.focus();
          await page.keyboard.press("Enter");
        }
        await page.waitForURL(`${baseURL}/samples`);
        await page
          .locator("[data-samples-page] [data-sample-unavailable]")
          .waitFor();
        assert.equal(await page.locator("[data-sample-order]").count(), 0);
      },
    );

  for (const locale of ["ja", "zh-Hans", "zh-Hant"])
    await run(
      `right-priority-locale-${locale}`,
      [320, locale],
      async ({ page }) => {
        await page.goto(
          `${baseURL}/samples-entry-study?direction=quiet&right=invitation`,
        );
        await ready(page);
        for (const right of newRightEntries) {
          await selectWhileFocused(page, "Right-side sample entry", right);
          const entry = await newRightEntry(page, right, "Overview", locale);
          for (const source of [...newRightCopy[right], "Explore the set"]) {
            const translated = translate(locale, source);
            assert.notEqual(
              translated,
              source,
              `${source} has a ${locale} translation`,
            );
            assert.ok(
              (await entry.textContent()).includes(translated),
              `${right} displays ${source} in ${locale}`,
            );
          }
          assert.doesNotMatch(
            await entry.innerText(),
            /Sample Set|Ceremonial|Barista|Culinary|Explore|Three matcha|starting point|included|total|preparation|alongside/i,
          );
          if (right === "preparation")
            for (const item of SAMPLE_SET_CONTENTS) {
              await entry.locator(`[data-sample-preview="${item.key}"]`).tap();
              assert.ok(
                (
                  await entry.locator('[aria-live="polite"]').innerText()
                ).includes(
                  translate(locale, item.name.replace(/ Matcha$/, "")),
                ),
              );
              assert.equal(
                await entry.locator("[data-active] img").getAttribute("src"),
                item.image,
              );
            }
          await entry.screenshot({
            path: resolve(evidence, `320-${locale}-priority-${right}.png`),
            animations: "disabled",
          });
        }
      },
    );

  await run("right-query-fallbacks", [320], async ({ page }) => {
    for (const right of [
      "off",
      "note",
      "panel",
      "footnote",
      "folio",
      "companion",
      "compare",
      ...newRightEntries,
      "unknown",
      "__proto__",
      "note&right=panel",
    ]) {
      await page.goto(
        `${baseURL}/samples-entry-study?direction=quiet&right=${right}`,
      );
      await ready(page);
      const expected = [
        "off",
        "note",
        "panel",
        "footnote",
        "folio",
        "companion",
        "compare",
        ...newRightEntries,
      ].includes(right)
        ? right
        : "default";
      assert.equal(
        await control(page, "Right-side sample entry").inputValue(),
        expected,
      );
      assert.equal(
        await page
          .locator("[data-samples-entry-study]")
          .getAttribute("data-right-entry"),
        expected,
      );
    }
  });

  for (const width of [1440, 320])
    await run(`canonical-adopted-${width}`, [width], async (fixture) => {
      const { page } = fixture;
      await page.goto(`${baseURL}/samples-entry-study`);
      await ready(page);
      await control(page, "Study appearance").selectOption("dark");
      await page.goto(`${baseURL}/`);
      await page
        .locator('main[data-exploring="false"]')
        .waitFor({ state: "visible" });
      assert.equal(await page.locator("[data-sample-entry]").count(), 0);
      assert.equal(
        await page.locator('[data-nav-action="samples"]').count(),
        1,
        "Samples is available in the canonical navigation before Explore",
      );
      assert.equal(
        await page.locator('[data-nav-action="samples"]').getAttribute("href"),
        "/samples",
      );
      await page
        .locator('[data-brand-part="introduction"]')
        .getByRole("button", { name: "EXPLORE MATCHA", exact: true })
        .click();
      const selectionEntry = page.locator(
        '[data-stage-selectors] [data-sample-entry="rail"]',
      );
      await selectionEntry.waitFor({ state: "visible" });
      assert.equal(await selectionEntry.getAttribute("href"), "/samples");
      assert.equal(await page.locator("[data-sample-entry]").count(), 1);
      assert.equal(await page.locator("[data-sample-entrance]").count(), 0);
      assert.equal(
        await page
          .locator("[data-selection-scroll] [data-sample-entry]")
          .count(),
        0,
        "The approved homepage entrance stays beside the teas on the left",
      );
      assert.equal(
        await page
          .locator('[data-brand-part="hero-footer"] a[href="/samples"]')
          .count(),
        0,
        "The study's extra footer entrance is not adopted",
      );
      await eventually(
        async () =>
          (await page
            .locator("[data-embedded]")
            .getAttribute("data-entry-settled")) === "true",
        "The homepage selection is ready",
      );
      await page.locator('[data-homepage-product-choice="barista"]').click();
      await page
        .getByRole("group", { name: "Shopping mode", exact: true })
        .getByRole("button", { name: "Shop", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      const material = await page
        .locator("[data-tea-material]")
        .elementHandle();
      await page
        .locator('[data-brand-part="hero-footer"] [data-theme-switcher]')
        .click();
      assert.equal(
        await page.locator("main").getAttribute("data-tone"),
        "dark",
      );
      assert.equal(
        await page
          .locator('[data-homepage-product-choice="barista"]')
          .getAttribute("aria-pressed"),
        "true",
      );
      assert.equal(
        Number(
          await page.getByLabel("Quantity", { exact: true }).textContent(),
        ),
        2,
      );
      assert.equal(
        await page
          .locator("[data-tea-material]")
          .evaluate((node, original) => node === original, material),
        true,
        "The material remains mounted while the canonical theme changes",
      );
      await screenshot(page, `${width}-canonical-home-quiet-left`);
      await page.goto(`${baseURL}/shop`);
      await page.locator("[data-shop-product]").first().waitFor();
      const collection = page.getByRole("region", {
        name: "Matcha collection",
      });
      const collectionEntry = collection.locator(
        '[data-sample-entry="collection"]',
      );
      assert.equal(await collectionEntry.count(), 1);
      assert.equal(
        await collectionEntry.evaluate(
          (node) => node.parentElement?.firstElementChild === node,
        ),
        true,
        "The Sample Set leads the Shop collection",
      );
      assert.equal(await collectionEntry.getAttribute("href"), "/samples");
      assert.equal(
        await page
          .locator(
            '[data-sample-entry="note"][data-sample-entry-point="footer"]',
          )
          .count(),
        1,
      );
      assert.equal(await page.locator("[data-shop-product]").count(), 3);
      assert.equal(await page.locator("[data-study-shop-theme]").count(), 0);
      assert.equal(
        await page.locator("main").getAttribute("data-tone"),
        "dark",
      );
      const shopTheme = page.locator("main > footer [data-theme-switcher]");
      assert.equal(await shopTheme.isEnabled(), true);
      await shopTheme.click();
      assert.equal(
        await page.locator("main").getAttribute("data-tone"),
        "light",
      );
      await appearanceCookie(fixture);
      await screenshot(page, `${width}-canonical-shop-connected`);
      await collectionEntry.focus();
      await page.keyboard.press("Enter");
      await page.waitForURL(`${baseURL}/samples`);
      await page
        .locator("[data-samples-page] [data-sample-unavailable]")
        .waitFor();
      assert.equal(await page.locator("[data-sample-entry]").count(), 0);
      assert.equal(await page.locator("[data-sample-order]").count(), 0);
      await appearanceCookie(fixture);
    });
} finally {
  await browser.close();
}
console.log(`${passed} samples-entry scenarios passed; all writes blocked`);
