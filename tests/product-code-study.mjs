/* Repeatable product-code study review. Every commerce request is mocked. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.PRODUCT_CODE_BASE_URL ?? "http://127.0.0.1:3100";
const evidence = process.env.PRODUCT_CODE_EVIDENCE;
const directions = [
  ["current", "No code"],
  ["eyebrow", "Above name"],
  ["corner", "Corner"],
  ["footline", "Footer line"],
  ["caption", "Caption"],
  ["edge", "Edge note"],
  ["register", "Register"],
  ["tag", "Specimen tag"],
];
const products = [
  [
    "barista",
    "Barista",
    "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
    "Lattes",
    "b",
    2400,
  ],
  [
    "ceremonial",
    "Premium",
    "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
    "Tea Service",
    "c",
    3600,
  ],
  [
    "culinary",
    "Culinary",
    "jmm-storefront-test-matcha",
    "Cafés & Baking",
    "a",
    1200,
  ],
].map(([id, title, handle, application, letter, priceMinor]) => ({
  id,
  title: `Japanese ${title} Matcha Powder for ${application} — 1 kg`,
  handle,
  description: "Isolated browser fixture for presentation checks.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${letter.repeat(43)}`,
      title: "1 kg",
      available: true,
      priceMinor,
      currency: "JPY",
      options: [{ name: "Format", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));
const codeById = {
  culinary: "[WZKA-00]",
  barista: "[WZKA-01]",
  ceremonial: "[WZKA-02]",
};
const nameById = {
  culinary: "Culinary Matcha",
  barista: "Barista Matcha",
  ceremonial: "Ceremonial Matcha",
  unknown: "New Matcha",
};
const views = [
  ["Overview", '[data-homepage-view-panel="overview"] > header'],
  ["Specifications", "[data-focused-specifications] > header"],
  ["Shop", "[data-shop-exploration] > header"],
];

async function eventually(check, message) {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function setup(browser, width, tone, catalog = products) {
  const context = await browser.newContext({
    viewport: { width, height: width === 320 ? 740 : 900 },
    reducedMotion: "reduce",
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
  ]);
  const state = { errors: [], writes: [] };
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const respond = (json) =>
      route.fulfill({ status: 200, contentType: "application/json", json });
    try {
      if (url.pathname.startsWith("/api/")) {
        assert.equal(url.origin, new URL(baseURL).origin);
        if (url.pathname === "/api/catalog" && request.method() === "GET")
          return respond({
            status: "ready",
            products: catalog,
            shopUrl: "https://example.invalid",
          });
        if (url.pathname === "/api/cart" && request.method() === "GET")
          return respond({ kind: "empty", checkoutEnabled: false });
        if (url.pathname === "/api/cart" && request.method() === "POST") {
          state.writes.push(request.postDataJSON());
          return respond({ kind: "rejected", checkoutEnabled: false });
        }
        assert.fail(
          `Unexpected API request: ${request.method()} ${url.pathname}`,
        );
      }
      assert.ok(
        ["GET", "HEAD"].includes(request.method()),
        "Every write must be mocked",
      );
      return route.continue();
    } catch (error) {
      state.errors.push(error.message);
      return route.abort("blockedbyclient");
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  page.setDefaultNavigationTimeout(30_000);
  page.on("pageerror", (error) => state.errors.push(error.message));
  return { context, page, state };
}

async function ready(page, path = "/numbering-exploration?direction=current") {
  await page.goto(`${baseURL}${path}`);
  await page
    .locator("[data-homepage-product-choice]:not(:disabled)")
    .first()
    .waitFor();
  await page.locator("[data-scene-canvas]").waitFor({ state: "attached" });
  await page.evaluate(() => document.fonts.ready);
}

async function rememberNodes(page) {
  await page.evaluate(() => {
    window.__productCodeNodes = [
      'main[data-concept="01"]',
      '[data-brand-part="material-stage"]',
      "[data-renderer]",
      "[data-scene-canvas]",
    ].map((selector) => [selector, document.querySelector(selector)]);
  });
}

async function assertNodes(page) {
  assert.equal(
    await page.evaluate(() =>
      window.__productCodeNodes.every(
        ([selector, element]) =>
          element && document.querySelector(selector) === element,
      ),
    ),
    true,
    "The hero, material stage, powder renderer and canvas stay mounted",
  );
}

async function switchView(page, name) {
  await page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name, exact: true })
    .click();
  const header = page.locator(views.find(([label]) => label === name)[1]);
  await header.waitFor({ state: "visible" });
  return header;
}

async function switchDirection(page, direction, keyboard = false) {
  const select = page.getByRole("combobox", {
    name: "Identity direction",
    exact: true,
  });
  if (await select.isVisible()) {
    if (keyboard) {
      await select.focus();
      // Native macOS selects support type-ahead; arrow navigation belongs to
      // the OS picker and is not committed by headless Chrome.
      await select.pressSequentially(
        directions.find(([key]) => key === direction)[1],
      );
      await select.press("Enter");
    } else await select.selectOption(direction);
  } else {
    const name = directions.find(([key]) => key === direction)[1];
    const button = page
      .getByRole("group", { name: "Identity direction" })
      .getByRole("button", { name: new RegExp(`^${name}`) });
    if (keyboard) {
      await button.focus();
      await button.press("Enter");
    } else await button.click();
  }
  await eventually(
    () =>
      page
        .locator("[data-numbering-exploration]")
        .getAttribute("data-direction")
        .then((value) => value === direction),
    `Direction ${direction} activated`,
  );
  assert.equal(new URL(page.url()).searchParams.get("direction"), direction);
}

async function assertHeader(page, header, productId, direction) {
  assert.equal(
    (await header.locator("h2").textContent()).trim(),
    nameById[productId],
    "Product names stay unchanged",
  );
  const expected = direction === "current" ? undefined : codeById[productId];
  assert.equal(
    await header.getAttribute("data-display-index"),
    expected ?? null,
  );
  assert.equal(
    await header.getAttribute("data-code-placement"),
    expected ? direction : null,
  );
  if (expected) {
    assert.ok((await header.textContent()).includes(expected));
    assert.equal(
      await header.getByText("Product code", { exact: true }).count(),
      1,
    );
    const geometry = await header.evaluate((element) => {
      const title = element.querySelector("h2").getBoundingClientRect();
      const code = element
        .querySelector(":scope > span")
        .getBoundingClientRect();
      return {
        overlap:
          Math.max(
            0,
            Math.min(title.right, code.right) - Math.max(title.left, code.left),
          ) *
          Math.max(
            0,
            Math.min(title.bottom, code.bottom) - Math.max(title.top, code.top),
          ),
        codeLeft: code.left,
        codeRight: code.right,
      };
    });
    assert.ok(
      geometry.overlap <= 1,
      `${direction}: code must not cover the product name`,
    );
    assert.ok(
      geometry.codeLeft >= -1 &&
        geometry.codeRight <= page.viewportSize().width + 1,
      `${direction}: code stays within the viewport`,
    );
  }
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    `${direction}: no horizontal page overflow`,
  );
}

async function capture(page, filename) {
  if (!evidence) return;
  await mkdir(evidence, { recursive: true });
  await page.screenshot({
    path: resolve(evidence, `${filename}.png`),
    fullPage: true,
  });
}

async function matrixCase(browser, width, initialTone) {
  const { context, page, state } = await setup(browser, width, initialTone);
  try {
    await ready(page);
    await rememberNodes(page);
    await page
      .getByRole("button", { name: "Select Ceremonial Matcha", exact: true })
      .click();
    await switchView(page, "Shop");
    await page
      .getByRole("button", { name: "Increase quantity", exact: true })
      .click();
    for (const [direction] of directions) {
      await switchDirection(page, direction, direction === "caption");
      assert.equal(
        await page.locator('[data-embedded="true"]').getAttribute("data-mode"),
        "builder",
        "Direction changes retain the active Shop tab",
      );
      assert.equal(
        (
          await page
            .locator('[data-shop-exploration] output[aria-label="Quantity"]')
            .textContent()
        ).trim(),
        "2",
      );
      assert.equal(
        await page
          .getByRole("button", {
            name: "Select Ceremonial Matcha",
            exact: true,
          })
          .getAttribute("aria-pressed"),
        "true",
      );
      for (const [view] of views) {
        const header = await switchView(page, view);
        await assertHeader(page, header, "ceremonial", direction);
        await assertNodes(page);
        if (["caption", "edge", "register", "tag"].includes(direction)) {
          if (width === 320)
            await header.evaluate((element) =>
              element.scrollIntoView({ block: "start", inline: "nearest" }),
            );
          await capture(
            page,
            `${width}-${initialTone}-${direction}-${view.toLowerCase()}`,
          );
        }
      }
      if (direction !== "current") {
        for (const product of products) {
          const choice = page.locator(
            `[data-homepage-product-choice="${product.id}"]`,
          );
          assert.equal(
            await choice.getAttribute("data-code-placement"),
            direction,
          );
          assert.ok(
            (await choice.textContent()).includes(codeById[product.id]),
          );
        }
      } else
        assert.equal(
          await page
            .locator("[data-code-placement], [data-display-index]")
            .count(),
          0,
        );
    }
    const oppositeTone = initialTone === "light" ? "dark" : "light";
    await page
      .getByRole("link", {
        name: `${oppositeTone === "dark" ? "Dark" : "Light"} mode`,
        exact: true,
      })
      .click();
    await eventually(
      () =>
        page
          .locator("[data-numbering-exploration]")
          .getAttribute("data-storefront-theme")
          .then((value) => value === oppositeTone),
      "Theme changes in place",
    );
    await assertNodes(page);
    assert.equal(
      await page.locator('[data-embedded="true"]').getAttribute("data-mode"),
      "builder",
    );
    assert.equal(
      (
        await page
          .locator('[data-shop-exploration] output[aria-label="Quantity"]')
          .textContent()
      ).trim(),
      "2",
    );
    assert.equal(
      (await context.cookies(baseURL)).find(
        (cookie) => cookie.name === "atoma-theme",
      )?.value,
      initialTone,
      "Study appearance leaves the site preference intact",
    );
    await switchDirection(page, "caption");
    // Catalog deliberately uses a different order from 00 / 01 / 02.
    for (const product of products) {
      await page
        .locator(`[data-homepage-product-choice="${product.id}"]`)
        .click();
      for (const [view] of views)
        await assertHeader(
          page,
          await switchView(page, view),
          product.id,
          "caption",
        );
      await assertNodes(page);
    }
    assert.deepEqual(state.errors, []);
    assert.deepEqual(state.writes, []);
  } finally {
    await context.close();
  }
}

async function unknownCase(browser) {
  const unknown = {
    ...products[0],
    id: "unknown",
    title: "New Matcha",
    handle: "unmapped-new-matcha",
  };
  const { context, page, state } = await setup(browser, 320, "light", [
    unknown,
  ]);
  try {
    await ready(page, "/numbering-exploration?direction=tag");
    for (const [direction] of directions) {
      await switchDirection(page, direction);
      for (const [view] of views)
        await assertHeader(
          page,
          await switchView(page, view),
          "unknown",
          direction,
        );
      assert.equal(
        await page
          .locator("[data-code-placement], [data-display-index]")
          .count(),
        0,
        "Unknown products receive no invented annotation",
      );
    }
    await page.goto(`${baseURL}/shop`);
    const unknownCard = page.locator('[data-shop-product="unknown"]');
    await unknownCard.waitFor();
    assert.equal(
      await unknownCard.getByText(/WZKA-/).count(),
      0,
      "The dedicated shop also omits unsupported product codes",
    );
    await page.goto(`${baseURL}/?matcha=${unknown.handle}`);
    await page
      .locator("[data-homepage-product-choice]:not(:disabled)")
      .first()
      .waitFor();
    for (const [view] of views)
      await assertHeader(
        page,
        await switchView(page, view),
        "unknown",
        "register",
      );
    assert.deepEqual(state.errors, []);
    assert.deepEqual(state.writes, []);
  } finally {
    await context.close();
  }
}

async function routesCase(browser) {
  const { context, page, state } = await setup(browser, 1440, "light");
  try {
    await ready(page, "/numbering-exploration?direction=register");
    assert.equal(
      await page
        .locator("[data-numbering-exploration]")
        .getAttribute("data-direction"),
      "register",
    );
    await page.reload();
    await page
      .locator("[data-homepage-product-choice]:not(:disabled)")
      .first()
      .waitFor();
    assert.equal(
      await page
        .locator("[data-numbering-exploration]")
        .getAttribute("data-direction"),
      "register",
    );
    await ready(page, "/numbering-exploration?direction=unknown");
    assert.equal(
      await page
        .locator("[data-numbering-exploration]")
        .getAttribute("data-direction"),
      "register",
    );
    await switchDirection(page, "current");
    for (const [view] of views)
      await assertHeader(
        page,
        await switchView(page, view),
        "barista",
        "current",
      );
    assert.equal(
      await page.locator("[data-code-placement], [data-display-index]").count(),
      0,
      "The study's Current baseline remains unmarked after adoption",
    );
    assert.deepEqual(state.errors, []);
    assert.deepEqual(state.writes, []);
  } finally {
    await context.close();
  }
}

async function adoptionCase(browser, width, tone) {
  const { context, page, state } = await setup(browser, width, tone);
  try {
    await ready(page, `/?matcha=${products[0].handle}`);
    await rememberNodes(page);
    assert.equal(await page.locator("[data-numbering-exploration]").count(), 0);
    for (const product of products) {
      const choice = page.locator(
        `[data-homepage-product-choice="${product.id}"]`,
      );
      await choice.click();
      assert.equal(
        await choice.getAttribute("data-code-placement"),
        "register",
      );
      assert.ok((await choice.textContent()).includes(codeById[product.id]));
      for (const [view] of views) {
        const header = await switchView(page, view);
        await assertHeader(page, header, product.id, "register");
        await assertNodes(page);
        if (product.id === "ceremonial") {
          if (width === 320)
            await header.evaluate((element) =>
              element.scrollIntoView({ block: "start", inline: "nearest" }),
            );
          await capture(page, `${width}-${tone}-adopted-${view.toLowerCase()}`);
        }
      }
    }
    await page.goto(`${baseURL}/shop`);
    await page.locator("[data-shop-product]").first().waitFor();
    assert.equal(
      await page.locator("[data-shop-product]").count(),
      products.length,
    );
    for (const product of products) {
      const article = page.locator(`[data-shop-product="${product.id}"]`);
      const heading = article.locator("[data-shop-product-name]");
      assert.equal((await heading.textContent()).trim(), nameById[product.id]);
      const link = article.getByRole("link", {
        name: `View ${nameById[product.id]}`,
        exact: true,
      });
      assert.equal(await link.getAttribute("href"), `/shop/${product.handle}`);
      const code = article.locator("[data-shop-product-code]");
      await code.waitFor({ state: "visible" });
      assert.ok((await code.textContent()).includes(codeById[product.id]));
      assert.equal(
        await code.getAttribute("data-shop-product-code"),
        codeById[product.id],
      );
      assert.equal(
        await link.getAttribute("aria-describedby"),
        await code.getAttribute("id"),
      );
      assert.equal(
        (await code.textContent()).trim(),
        `Product code ${codeById[product.id]}`,
      );
      const codeSize = await code.evaluate((element) =>
        parseFloat(getComputedStyle(element).fontSize),
      );
      const titleSize = await heading.evaluate((element) =>
        parseFloat(getComputedStyle(element).fontSize),
      );
      assert.ok(
        codeSize <= 12 && codeSize < titleSize,
        "Shop code stays subordinate to the product name",
      );
      await link.focus();
      assert.equal(
        await link.evaluate((element) => element === document.activeElement),
        true,
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
        "Shop cards and their codes fit the viewport",
      );
    }
    if (width === 320)
      await page
        .locator('[data-shop-product="ceremonial"]')
        .scrollIntoViewIfNeeded();
    await capture(page, `${width}-${tone}-adopted-shop-collection`);
    assert.deepEqual(state.errors, []);
    assert.deepEqual(state.writes, []);
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
  headless: true,
});
const cases = [
  ...[1440, 320].flatMap((width) =>
    ["light", "dark"].map((tone) => [
      `${width}px ${tone}: eight directions, three views, stable identity and state`,
      () => matrixCase(browser, width, tone),
    ]),
  ),
  [
    "unknown product: study, homepage and shop omit unsupported codes",
    () => unknownCase(browser),
  ],
  [
    "shareable directions, reload, invalid fallback and unmarked Current baseline",
    () => routesCase(browser),
  ],
  ...[1440, 320].flatMap((width) =>
    ["light", "dark"].map((tone) => [
      `${width}px ${tone}: adopted homepage Register and dedicated shop codes`,
      () => adoptionCase(browser, width, tone),
    ]),
  ),
].filter(
  ([name]) =>
    !process.env.PRODUCT_CODE_FILTER ||
    new RegExp(process.env.PRODUCT_CODE_FILTER).test(name),
);
assert.ok(cases.length, "PRODUCT_CODE_FILTER must match at least one check");
const results = [];
try {
  for (const [name, run] of cases) {
    try {
      await run();
      results.push({ name, passed: true });
      console.log(`PASS ${name}`);
    } catch (error) {
      results.push({ name, passed: false, error: error.stack });
      console.error(`FAIL ${name}\n${error.stack}`);
    }
  }
} finally {
  await browser.close();
}
if (evidence) {
  await mkdir(evidence, { recursive: true });
  await writeFile(
    resolve(evidence, "results.json"),
    JSON.stringify(results, null, 2),
  );
}
const passed = results.filter((result) => result.passed).length;
console.log(`${passed}/${results.length} product code checks passed`);
if (passed !== results.length) process.exitCode = 1;
