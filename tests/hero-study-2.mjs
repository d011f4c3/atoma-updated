/* Hero study 2 uses an isolated catalog and mocked cart writes. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.HERO_STUDY_2_BASE_URL ?? "http://127.0.0.1:3100";
const screenshots = process.env.HERO_STUDY_2_SCREENSHOTS;
const directions = ["current", "display", "cadence", "proof"];
const products = [
  ["culinary", "Culinary", "jmm-storefront-test-matcha", "a", 1200],
  [
    "barista",
    "Barista",
    "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
    "b",
    2400,
  ],
  [
    "premium",
    "Premium",
    "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
    "c",
    3600,
  ],
].map(([id, title, handle, letter, priceMinor]) => ({
  id,
  title: `Japanese ${title} Matcha Powder — 1 kg`,
  handle,
  description: "Catalog content supplied by this isolated browser fixture.",
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

async function setup(browser, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: width <= 760 ? "reduce" : "no-preference",
  });
  await context.addCookies([
    { name: "atoma-theme", value: "dark", url: baseURL },
  ]);
  await context.addInitScript(() => {
    window.__hero2ThemeWrites = [];
    const cookie = Object.getOwnPropertyDescriptor(
      Document.prototype,
      "cookie",
    );
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => cookie.get.call(document),
      set: (value) => {
        if (value.startsWith("atoma-theme="))
          window.__hero2ThemeWrites.push(value);
        cookie.set.call(document, value);
      },
    });
  });
  const state = { actions: [], errors: [], gate: null };
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
            products,
            shopUrl: "https://example.invalid",
          });
        if (url.pathname === "/api/cart" && request.method() === "GET")
          return respond({ kind: "empty", checkoutEnabled: false });
        if (url.pathname === "/api/cart" && request.method() === "POST") {
          const action = request.postDataJSON();
          state.actions.push(action);
          assert.equal(action.action, "add");
          assert.equal(action.productHandle, products[1].handle);
          assert.equal(action.variantKey, products[1].variants[0].id);
          assert.equal(action.quantity, 2);
          if (state.gate) await state.gate;
          return respond({ kind: "rejected", checkoutEnabled: false });
        }
        assert.fail(
          `Unexpected API request: ${request.method()} ${url.pathname}`,
        );
      }
      assert.ok(
        ["GET", "HEAD"].includes(request.method()),
        "Every write must use the mocked cart",
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

async function eventually(check, message) {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function capture(page, name) {
  if (!screenshots) return;
  await mkdir(screenshots, { recursive: true });
  await page.screenshot({ path: resolve(screenshots, `${name}.png`) });
}

async function heroReady(page) {
  await page.locator('main[data-concept="01"]:not([inert])').waitFor();
  await page.locator("[data-renderer]").waitFor({ state: "attached" });
  await page.evaluate(() => document.fonts.ready);
  await eventually(
    () =>
      page
        .locator('[data-brand-part="bag"] img')
        .evaluate((image) => image.complete && image.naturalWidth > 0),
    "The existing silver bag must finish loading",
  );
}

async function geometry(page) {
  return page.evaluate(() => {
    const main = document
      .querySelector('main[data-concept="01"]')
      .getBoundingClientRect();
    const viewer = document
      .querySelector('[data-brand-part="viewer"]')
      .getBoundingClientRect();
    const header = document
      .querySelector("main > header")
      .getBoundingClientRect();
    const footer = document
      .querySelector('[data-brand-part="hero-footer"]')
      .getBoundingClientRect();
    const bounds = (rect) => ({
      x: rect.x - main.x,
      y: rect.y - main.y,
      width: rect.width,
      height: rect.height,
    });
    return {
      main: { width: main.width, height: main.height },
      viewer: bounds(viewer),
      header: bounds(header),
      footer: bounds(footer),
    };
  });
}

function assertGeometry(actual, expected, message) {
  for (const part of Object.keys(expected))
    for (const key of Object.keys(expected[part]))
      assert.ok(
        Math.abs(actual[part][key] - expected[part][key]) <= 1,
        `${message}: ${part}.${key} changed from ${expected[part][key]} to ${actual[part][key]}`,
      );
}

async function rememberNodes(page) {
  await page.evaluate(() => {
    window.__hero2Main = document.querySelector('main[data-concept="01"]');
    window.__hero2Viewer = document.querySelector('[data-brand-part="viewer"]');
    window.__hero2Bag = document.querySelector('[data-brand-part="bag"] img');
    window.__hero2Renderer = document.querySelector("[data-renderer]");
  });
}

async function assertNodes(page) {
  assert.equal(
    await page.evaluate(
      () =>
        window.__hero2Main ===
          document.querySelector('main[data-concept="01"]') &&
        window.__hero2Viewer ===
          document.querySelector('[data-brand-part="viewer"]') &&
        window.__hero2Bag ===
          document.querySelector('[data-brand-part="bag"] img') &&
        window.__hero2Renderer === document.querySelector("[data-renderer]"),
    ),
    true,
    "Introduction and appearance changes must retain the hero, viewer, bag image and renderer",
  );
}

async function assertIndependentTheme(context, page) {
  assert.equal(
    (await context.cookies(baseURL)).find(
      (cookie) => cookie.name === "atoma-theme",
    )?.value,
    "dark",
  );
  assert.deepEqual(
    await page.evaluate(() => window.__hero2ThemeWrites),
    [],
    "The study must never write the persistent storefront theme cookie",
  );
}

async function settleIntroduction(page) {
  await page.locator("[data-hero-introduction-2]").evaluate(async (element) => {
    const entrances = element
      .getAnimations({ subtree: true })
      .filter(
        (animation) =>
          animation.effect?.getComputedTiming().iterations !== Infinity,
      );
    await Promise.allSettled(entrances.map((animation) => animation.finished));
  });
}

async function assertIntroduction(page, direction) {
  const intro = page.locator('[data-brand-part="introduction"]');
  assert.equal(
    await intro
      .locator("[data-hero-introduction-2]")
      .getAttribute("data-direction"),
    direction,
  );
  assert.equal(
    await intro
      .getByRole("heading", { name: "A closer look at matcha.", exact: true })
      .count(),
    1,
  );
  const copy = await intro.evaluate((element) => {
    const clone = element.cloneNode(true);
    clone
      .querySelectorAll('[aria-hidden="true"]')
      .forEach((node) => node.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  });
  assert.match(copy, /Flavour\.\s*Texture\.\s*Performance\./);
  assert.match(copy, /Matcha selected for a specific application\./);
  const enter = intro.getByRole("button", {
    name: "EXPLORE MATCHA",
    exact: true,
  });
  assert.equal(await enter.getAttribute("aria-controls"), "home-selection");
  assert.equal(await enter.getAttribute("aria-expanded"), "false");
  await enter.scrollIntoViewIfNeeded();
  const clipped = await intro.evaluate((element) => {
    const problems = [];
    for (const node of element.querySelectorAll("h1, p, button")) {
      if (!node.checkVisibility({ checkVisibilityCSS: true })) continue;
      const rect = node.getBoundingClientRect();
      if (node.scrollWidth > node.clientWidth + 1)
        problems.push(`${node.tagName} has horizontal overflow`);
      for (
        let parent = node.parentElement;
        parent;
        parent = parent.parentElement
      ) {
        const style = getComputedStyle(parent);
        const box = parent.getBoundingClientRect();
        if (style.overflowY === "hidden" || style.overflowY === "clip")
          if (rect.top < box.top - 1 || rect.bottom > box.bottom + 1)
            problems.push(
              `${node.tagName} is vertically clipped by ${parent.tagName}`,
            );
        if (style.overflowX === "hidden" || style.overflowX === "clip")
          if (rect.left < box.left - 1 || rect.right > box.right + 1)
            problems.push(
              `${node.tagName} is horizontally clipped by ${parent.tagName}`,
            );
      }
    }
    if (
      Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
      ) >
      innerWidth + 1
    )
      problems.push("The page overflows horizontally");
    return problems;
  });
  assert.deepEqual(
    clipped,
    [],
    `${direction} introduction must remain readable and unclipped`,
  );
}

async function assertCopyFit(page, direction) {
  const fit = await page
    .locator("[data-hero-introduction-2]")
    .evaluate((element) => {
      const header = document
        .querySelector("main > header")
        .getBoundingClientRect();
      const footer = document
        .querySelector('[data-brand-part="hero-footer"]')
        .getBoundingClientRect();
      const main = document.querySelector("main").getBoundingClientRect();
      const nodes = Array.from(element.querySelectorAll("h1, p, button"))
        .filter((node) => node.checkVisibility({ checkVisibilityCSS: true }))
        .map((node) => {
          const clone = node.cloneNode(true);
          clone
            .querySelectorAll('[aria-hidden="true"]')
            .forEach((hidden) => hidden.remove());
          return {
            tag: node.tagName,
            text: clone.textContent.replace(/\s+/g, " ").trim(),
            rect: node.getBoundingClientRect(),
          };
        });
      const problems = [];
      for (const [index, node] of nodes.entries()) {
        if (
          node.rect.top < header.bottom - 1 ||
          node.rect.bottom > footer.top + 1 ||
          node.rect.left < main.left - 1 ||
          node.rect.right > main.right + 1
        )
          problems.push(`${node.tag} falls outside the hero content`);
        for (const other of nodes.slice(index + 1)) {
          const width =
            Math.min(node.rect.right, other.rect.right) -
            Math.max(node.rect.left, other.rect.left);
          const height =
            Math.min(node.rect.bottom, other.rect.bottom) -
            Math.max(node.rect.top, other.rect.top);
          if (width > 1 && height > 1)
            problems.push(`${node.tag} intersects ${other.tag}`);
        }
      }
      return {
        problems,
        headings: nodes.filter((node) => node.tag === "H1").length,
        actions: nodes.filter((node) => node.tag === "BUTTON").length,
        copy: nodes.map((node) => node.text).join(" "),
      };
    });
  assert.deepEqual(
    fit.problems,
    [],
    `${direction} must fit between the header and hero footer without overlapping`,
  );
  assert.equal(fit.headings, 1, "The introduction heading must remain visible");
  assert.equal(fit.actions, 1, "The Explore action must remain visible");
  assert.match(fit.copy, /Flavour\.\s*Texture\.\s*Performance\./);
  assert.match(fit.copy, /Matcha selected for a specific application\./);
}

async function selectView(page, name) {
  await page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name, exact: true })
    .click();
  await page
    .locator(
      `[data-embedded][data-mode="${name === "Shop" ? "builder" : name.toLowerCase()}"]`,
    )
    .waitFor();
}

async function assertSelection(page) {
  assert.equal(
    await page
      .getByRole("group", { name: "Matcha to explore", exact: true })
      .getByRole("button", { name: "Select Barista Matcha", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    Number(await page.getByLabel("Quantity", { exact: true }).textContent()),
    2,
  );
  await assertNodes(page);
}

async function originsRoundTrip(page, tone) {
  await selectView(page, "Origins");
  const entry = page
    .locator('[data-origin-preview="panorama"]')
    .getByRole("button", { name: "Explore the growing region", exact: true });
  await entry.focus();
  await page.keyboard.press("Enter");
  const reader = page.getByRole("dialog", {
    name: "ATOMA Origins",
    exact: true,
  });
  await reader.waitFor();
  assert.equal(await reader.getAttribute("data-tone"), tone);
  const previousDirection = new URL(page.url()).searchParams.get("direction");
  await reader
    .getByRole("button", { name: "Return to Barista Matcha", exact: true })
    .click();
  await reader.waitFor({ state: "hidden" });
  await reader.locator("[data-origins-content]").waitFor({ state: "detached" });
  await eventually(
    () => entry.evaluate((element) => element === document.activeElement),
    "Origins must restore the originating control",
  );
  await eventually(
    () => new URL(page.url()).hash === "",
    "Origins must restore the study URL",
  );
  assert.equal(
    new URL(page.url()).searchParams.get("direction"),
    previousDirection,
  );
  await selectView(page, "Shop");
  await assertSelection(page);
}

async function layoutsCase(browser, width, height) {
  const { context, page, state } = await setup(browser, width, height);
  let release;
  try {
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await heroReady(page);
    const canonical = await geometry(page);
    await page.goto(`${baseURL}/hero-study-2`, {
      waitUntil: "domcontentloaded",
    });
    await heroReady(page);
    const study = page.locator("[data-hero-study-2]");
    const layout = page.getByRole("combobox", {
      name: "Hero layout",
      exact: true,
    });
    const appearance = page.getByRole("combobox", {
      name: "Study appearance",
      exact: true,
    });
    assert.equal(await study.getAttribute("data-direction"), "display");
    assert.equal(await layout.evaluate((element) => element.tagName), "SELECT");
    assert.equal(
      await appearance.evaluate((element) => element.tagName),
      "SELECT",
    );
    assert.deepEqual(
      await layout
        .locator("option")
        .evaluateAll((options) => options.map((option) => option.value)),
      directions,
    );
    await rememberNodes(page);
    let current;
    for (const tone of ["light", "dark"]) {
      await appearance.selectOption(tone);
      for (const direction of directions) {
        await layout.selectOption(direction);
        await settleIntroduction(page);
        assert.equal(await study.getAttribute("data-direction"), direction);
        assert.equal(await study.getAttribute("data-tone"), tone);
        assert.equal(
          await page.locator("main").getAttribute("data-tone"),
          tone,
        );
        assert.equal(
          new URL(page.url()).searchParams.get("direction"),
          direction,
        );
        await assertIntroduction(page, direction);
        await assertCopyFit(page, direction);
        const actual = await geometry(page);
        if (!current) current = actual;
        assertGeometry(
          actual,
          current,
          "Every direction must retain the existing page geometry",
        );
        assertGeometry(
          { viewer: actual.viewer, header: actual.header },
          { viewer: canonical.viewer, header: canonical.header },
          "The right viewer and storefront header must match the canonical homepage",
        );
        if (width > 760)
          assert.equal(
            Math.round(actual.main.height),
            height,
            "The study must preserve the homepage's full viewport height",
          );
        await assertNodes(page);
        await assertIndependentTheme(context, page);
        await page.locator("main").scrollIntoViewIfNeeded();
        await capture(page, `${width}-${tone}-${direction}`);
      }
    }

    const enter = page
      .locator('[data-brand-part="introduction"]')
      .getByRole("button", { name: "EXPLORE MATCHA", exact: true });
    await enter.focus();
    await page.keyboard.press("Enter");
    const experience = page.locator("[data-embedded]");
    await experience.waitFor();
    for (const [attribute, value] of [
      ["data-material-object", "silver-bag"],
      ["data-selector-placement", "left"],
      ["data-selector-variant", "slides"],
      ["data-section-selector-variant", "tabs"],
      ["data-shop-preview-variant", "refined"],
    ])
      assert.equal(await experience.getAttribute(attribute), value);
    await page
      .getByRole("group", { name: "Matcha to explore", exact: true })
      .getByRole("button", { name: "Select Barista Matcha", exact: true })
      .click();
    await selectView(page, "Shop");
    await page
      .getByRole("button", { name: "Increase quantity", exact: true })
      .click();
    for (const direction of directions) {
      await layout.selectOption(direction);
      await appearance.selectOption(
        direction === "display" || direction === "proof" ? "light" : "dark",
      );
      await assertSelection(page);
      await assertIndependentTheme(context, page);
    }
    await originsRoundTrip(page, "light");

    state.gate = new Promise((done) => {
      release = done;
    });
    await page
      .getByRole("button", { name: "Add to cart", exact: true })
      .click();
    await eventually(
      () => state.actions.length === 1,
      "The retained order must reach the mocked cart",
    );
    assert.equal(await layout.isDisabled(), true);
    assert.equal(await appearance.isDisabled(), true);
    const home = page.getByRole("link", {
      name: "Current homepage",
      exact: true,
    });
    assert.equal(await home.getAttribute("aria-disabled"), "true");
    await home.focus();
    await page.keyboard.press("Enter");
    assert.equal(
      new URL(page.url()).pathname,
      "/hero-study-2",
      "Pending writes must block study navigation",
    );
    release();
    await eventually(
      () => layout.isEnabled(),
      "Study controls must unlock after the mocked write",
    );
    await assertSelection(page);
    await page
      .getByRole("button", { name: "Back to overview", exact: true })
      .click();
    await page.locator('main[data-exploring="false"]').waitFor();
    await eventually(
      () => enter.evaluate((element) => element === document.activeElement),
      "Closing selection must restore the left Explore action",
    );
    await assertNodes(page);
    await enter.focus();
    await page.keyboard.press("Enter");
    await experience.waitFor();
    await selectView(page, "Shop");
    await assertSelection(page);
    await assertIndependentTheme(context, page);
    assert.deepEqual(state.errors, []);
    assert.equal(state.actions.length, 1);
  } catch (error) {
    await capture(page, `${width}-failure`);
    throw error;
  } finally {
    release?.();
    await context.close();
  }
}

async function queryCase(browser) {
  const { context, page, state } = await setup(browser, 1440, 900);
  try {
    for (const direction of directions) {
      await page.goto(`${baseURL}/hero-study-2?direction=${direction}`, {
        waitUntil: "domcontentloaded",
      });
      const study = page.locator("[data-hero-study-2]");
      await study.waitFor();
      assert.equal(await study.getAttribute("data-direction"), direction);
      await page.reload({ waitUntil: "domcontentloaded" });
      await study.waitFor();
      assert.equal(await study.getAttribute("data-direction"), direction);
      await assertIndependentTheme(context, page);
    }
    for (const suffix of [
      "?direction=unknown",
      "?direction=display&direction=proof",
    ]) {
      await page.goto(`${baseURL}/hero-study-2${suffix}`, {
        waitUntil: "domcontentloaded",
      });
      await page.locator("[data-hero-study-2]").waitFor();
      assert.equal(
        await page
          .locator("[data-hero-study-2]")
          .getAttribute("data-direction"),
        "display",
      );
    }
    assert.deepEqual(state.errors, []);
    assert.equal(state.actions.length, 0);
  } finally {
    await context.close();
  }
}

async function landscapeCase(browser, width, height) {
  const { context, page, state } = await setup(browser, width, height);
  try {
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await heroReady(page);
    const canonical = await geometry(page);
    await page.goto(`${baseURL}/hero-study-2`, {
      waitUntil: "domcontentloaded",
    });
    await heroReady(page);
    await rememberNodes(page);
    const layout = page.getByRole("combobox", {
      name: "Hero layout",
      exact: true,
    });
    const appearance = page.getByRole("combobox", {
      name: "Study appearance",
      exact: true,
    });
    for (const tone of ["light", "dark"]) {
      await appearance.selectOption(tone);
      // Current intentionally retains the canonical short-landscape behavior,
      // which hides supporting copy. The new options keep the full copy visible.
      for (const direction of directions.filter((item) => item !== "current")) {
        await layout.selectOption(direction);
        await settleIntroduction(page);
        await assertIntroduction(page, direction);
        const actual = await geometry(page);
        assertGeometry(
          { viewer: actual.viewer, header: actual.header },
          { viewer: canonical.viewer, header: canonical.header },
          "Short landscape must retain the canonical viewer and header",
        );
        await assertCopyFit(page, direction);
        await assertNodes(page);
        await assertIndependentTheme(context, page);
        await page.locator("main").scrollIntoViewIfNeeded();
        await capture(page, `${width}x${height}-${tone}-${direction}`);
      }
    }
    assert.deepEqual(state.errors, []);
    assert.equal(state.actions.length, 0);
  } catch (error) {
    await capture(page, `${width}x${height}-failure`);
    throw error;
  } finally {
    await context.close();
  }
}

async function isolationCase(browser) {
  const { context, page, state } = await setup(browser, 1440, 900);
  try {
    await page.goto(`${baseURL}/hero-study-2?direction=cadence`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .getByRole("combobox", { name: "Study appearance", exact: true })
      .selectOption("light");
    await assertIndependentTheme(context, page);
    for (const path of [
      "/",
      "/light",
      "/hero-study",
      "/footer-study",
      "/selector-study",
      "/shop-study",
      "/origins-study",
    ]) {
      await page.goto(`${baseURL}${path}`, { waitUntil: "domcontentloaded" });
      await page.locator("main").waitFor();
      assert.equal(
        await page
          .locator("[data-hero-study-2], [data-hero-introduction-2]")
          .count(),
        0,
        `${path} must retain its own composition`,
      );
      if (path === "/" || path === "/light") {
        await heroReady(page);
        assert.equal(
          await page.locator("main").getAttribute("data-tone"),
          "dark",
        );
        assert.equal(
          await page
            .locator('[data-site-footer][data-footer-direction="directory"]')
            .count(),
          1,
        );
      }
      if (path === "/hero-study") {
        assert.equal(
          await page
            .locator("[data-hero-study]")
            .getAttribute("data-direction"),
          "specimen",
        );
        const controls = page.getByRole("group", {
          name: "Hero direction",
          exact: true,
        });
        assert.equal(
          await controls
            .getByRole("button", { name: "Specimen", exact: true })
            .getAttribute("aria-pressed"),
          "true",
        );
        assert.equal(
          await controls
            .getByRole("button", { name: "Current", exact: true })
            .count(),
          1,
        );
      }
    }
    assert.deepEqual(state.errors, []);
    assert.equal(state.actions.length, 0);
  } finally {
    await context.close();
  }
}

const cases = [
  [
    "desktop directions, geometry, themes, selection and cart guards",
    () => layoutsCase(browser, 1440, 900),
  ],
  [
    "320px directions, geometry, reduced motion and selection",
    () => layoutsCase(browser, 320, 740),
  ],
  [
    "844px short landscape geometry and visible copy fit",
    () => landscapeCase(browser, 844, 390),
  ],
  [
    "568px short landscape geometry and visible copy fit",
    () => landscapeCase(browser, 568, 320),
  ],
  [
    "shareable directions, reload and invalid query fallback",
    () => queryCase(browser),
  ],
  [
    "canonical homepage and saved studies remain isolated",
    () => isolationCase(browser),
  ],
].filter(
  ([name]) =>
    !process.env.HERO_STUDY_2_FILTER ||
    new RegExp(process.env.HERO_STUDY_2_FILTER).test(name),
);
assert.ok(cases.length, "HERO_STUDY_2_FILTER must match at least one check");
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
  headless: true,
});
let failed = 0;
try {
  for (const [name, run] of cases) {
    try {
      await run();
      console.log(`PASS ${name}`);
    } catch (error) {
      failed++;
      console.error(`FAIL ${name}\n${error.stack}`);
    }
  }
} finally {
  await browser.close();
}
console.log(
  `${cases.length - failed}/${cases.length} Hero study 2 checks passed`,
);
if (failed) process.exitCode = 1;
