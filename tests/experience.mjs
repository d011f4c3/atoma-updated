/* Browser regression suite. Every commerce request is fulfilled in memory. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);

const baseURL = process.env.EXPERIENCE_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const money = (amount) =>
  new Intl.NumberFormat("en", { style: "currency", currency: "JPY" }).format(
    amount,
  );
const variant = (letter, title, priceMinor, rule = {}) => ({
  id: `v1_${letter.repeat(43)}`,
  title,
  available: true,
  priceMinor,
  currency: "JPY",
  options: [{ name: "Format", value: title }],
  minimum: 1,
  maximum: 4,
  increment: 1,
  ...rule,
});
const products = [
  {
    id: "matcha-one",
    handle: "matcha-one",
    title: "Matcha One",
    description: "Product information supplied by the mocked catalog.",
    imageUrl: null,
    imageAlt: "",
    productUrl: null,
    isFixture: true,
    variants: [
      variant("a", "1 kg", 1200),
      variant("b", "5 × 1 kg", 6000, {
        minimum: 5,
        maximum: 15,
        increment: 5,
      }),
    ],
  },
  {
    id: "matcha-two",
    handle: "matcha-two",
    title: "Matcha Two",
    description: "A second selectable product for browser regression checks.",
    imageUrl: null,
    imageAlt: "",
    productUrl: null,
    isFixture: true,
    variants: [variant("c", "1 kg", 2400)],
  },
  {
    id: "matcha-three",
    handle: "matcha-three",
    title: "Matcha Three",
    description: "An unavailable product for availability checks.",
    imageUrl: null,
    imageAlt: "",
    productUrl: null,
    isFixture: true,
    variants: [{ ...variant("d", "1 kg", 3600), available: false }],
  },
];
const catalog = {
  status: "ready",
  products,
  shopUrl: "https://example.invalid",
};
const productStories = products.map((product, index) => ({
  ...product,
  title: [
    "Japanese Culinary Matcha Powder for Cafés & Baking — 1 kg",
    "Japanese Barista Matcha Powder for Lattes — 1 kg",
    "Japanese Premium Matcha Powder for Tea Service — 1 kg",
  ][index],
}));

async function setup(browser, options = {}) {
  const {
    catalogProducts = products,
    initialTheme,
    ...browserOptions
  } = options;
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
    ...browserOptions,
  });
  if (initialTheme) {
    await context.addCookies([
      { name: "atoma-theme", value: initialTheme, url: origin },
    ]);
  }
  const state = {
    lines: [],
    actions: [],
    reads: 0,
    catalogReads: 0,
    catalogMode: "ready",
    nextMutation: "success",
    nextMutationGate: null,
    pageErrors: [],
    routeErrors: [],
  };
  function projection() {
    const subtotal = state.lines.reduce(
      (sum, line) => sum + line.quantity * line.priceMinor,
      0,
    );
    return {
      totalQuantity: state.lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotalLabel: money(subtotal),
      totalLabel: money(subtotal),
      lines: state.lines.map(({ priceMinor, ...line }) => ({
        ...line,
        unitPriceLabel: money(priceMinor),
        lineTotalLabel: money(priceMinor * line.quantity),
      })),
    };
  }
  function applyAction(action) {
    assert.ok(["add", "update", "remove"].includes(action.action));
    if (action.action === "add") {
      const product = catalogProducts.find(
        (item) => item.handle === action.productHandle,
      );
      assert.ok(product, "Add must send a catalog product handle");
      const format = product.variants.find(
        (item) => item.id === action.variantKey,
      );
      assert.ok(format?.available, "Add must send an available variant key");
      const existing = state.lines.find(
        (line) =>
          line.productHandle === product.handle &&
          line.variantTitle === format.title,
      );
      if (existing) {
        existing.quantity += action.quantity;
      } else {
        state.lines.push({
          lineKey: `line-${product.handle}-${format.id}`,
          productHandle: product.handle,
          productTitle: product.title,
          variantTitle: format.title,
          options: format.options,
          quantity: action.quantity,
          priceMinor: format.priceMinor,
          purchaseState: "purchasable",
          quantityRule: {
            minimum: format.minimum,
            maximum: format.maximum,
            increment: format.increment,
          },
          canUpdateQuantity: true,
          canRemove: true,
          image: null,
        });
      }
    } else {
      const index = state.lines.findIndex(
        (line) => line.lineKey === action.lineKey,
      );
      assert.notEqual(index, -1, "Cart actions must use the returned line key");
      if (action.action === "remove") state.lines.splice(index, 1);
      else state.lines[index].quantity = action.quantity;
    }
    for (const line of state.lines) {
      const { minimum, maximum, increment } = line.quantityRule;
      assert.ok(Number.isSafeInteger(line.quantity));
      assert.ok(line.quantity >= minimum);
      assert.ok(maximum === null || line.quantity <= maximum);
      assert.equal((line.quantity - minimum) % increment, 0);
    }
  }
  await context.route("**/*", async (route) => {
    if (!["GET", "HEAD"].includes(route.request().method())) {
      state.routeErrors.push(
        `An unmocked ${route.request().method()} to ${new URL(route.request().url()).pathname} was blocked`,
      );
      return route.abort("blockedbyclient");
    }
    return route.continue();
  });
  await context.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const respond = (json, status = 200) =>
      route.fulfill({ status, contentType: "application/json", json });
    try {
      assert.equal(url.origin, origin);
      if (url.pathname === "/api/catalog" && request.method() === "GET") {
        state.catalogReads++;
        if (state.catalogMode === "unavailable") {
          return respond(
            { ...catalog, status: "unavailable", products: [] },
            503,
          );
        }
        if (state.catalogMode === "empty") {
          return respond({ ...catalog, status: "empty", products: [] });
        }
        return respond({ ...catalog, products: catalogProducts });
      }
      if (url.pathname === "/api/cart" && request.method() === "GET") {
        state.reads++;
        return respond(
          state.lines.length
            ? { kind: "ready", cart: projection(), checkoutEnabled: false }
            : { kind: "empty", checkoutEnabled: false },
        );
      }
      if (url.pathname === "/api/cart" && request.method() === "POST") {
        assert.match(request.headers()["content-type"], /application\/json/);
        const action = request.postDataJSON();
        state.actions.push(action);
        const mode = state.nextMutation;
        state.nextMutation = "success";
        const gate = state.nextMutationGate;
        state.nextMutationGate = null;
        if (gate) await gate;
        if (mode === "rejected") {
          return respond({ kind: "rejected", checkoutEnabled: false });
        }
        if (mode === "rejected-review") {
          return respond({
            kind: "rejected",
            cart: projection(),
            reviewRequired: true,
            checkoutEnabled: false,
          });
        }
        applyAction(action);
        if (mode === "ambiguous") {
          // The write happened, but the client cannot know until it reads again.
          return respond({ kind: "ambiguous", checkoutEnabled: false }, 503);
        }
        return respond({
          kind: "success",
          cart: projection(),
          checkoutEnabled: false,
        });
      }
      throw new Error(
        `Unexpected API request: ${request.method()} ${url.pathname}`,
      );
    } catch (error) {
      state.routeErrors.push(error.message);
      return respond({ kind: "error", checkoutEnabled: false }, 500);
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  page.on("pageerror", (error) => state.pageErrors.push(error.message));
  return { context, page, state };
}

async function eventually(check, message, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  assert.fail(message);
}

async function assertFocused(locator, message) {
  await eventually(
    () => locator.evaluate((element) => element === document.activeElement),
    message,
  );
}

async function assertNoOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(
    dimensions.document <= dimensions.viewport + 1 &&
      dimensions.body <= dimensions.viewport + 1,
    `Horizontal overflow: ${JSON.stringify(dimensions)}`,
  );
}

async function assertWithinViewport(control, message) {
  let result;
  try {
    await eventually(async () => {
      result = await control.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          bounds.x + bounds.width / 2,
          bounds.y + bounds.height / 2,
        );
        let opacity = 1;
        for (let current = element; current; current = current.parentElement) {
          opacity *= Number(getComputedStyle(current).opacity);
        }
        return {
          x: bounds.x,
          y: bounds.y,
          right: bounds.right,
          bottom: bounds.bottom,
          viewportWidth: document.documentElement.clientWidth,
          viewportHeight: window.innerHeight,
          receivesPointer: element === hit || element.contains(hit),
          opacity,
        };
      });
      return (
        result.x >= -1 &&
        result.y >= -1 &&
        result.right <= result.viewportWidth + 1 &&
        result.bottom <= result.viewportHeight + 1 &&
        result.receivesPointer &&
        result.opacity >= 0.99
      );
    }, message);
  } catch {
    assert.fail(`${message}: ${JSON.stringify(result)}`);
  }
}

async function assertSelectionControlReachable(page, control, message) {
  const embedded = await control.evaluate((element) =>
    Boolean(element.closest('[data-embedded="true"]')),
  );
  if (embedded && page.viewportSize().width > 760) {
    const stage = page.locator('[data-embedded="true"] [data-product-object]');
    const before = await stage.boundingBox();
    await control.scrollIntoViewIfNeeded();
    const after = await stage.boundingBox();
    assert.equal(await page.evaluate(() => window.scrollY), 0);
    assert.ok(
      Math.abs(after.y - before.y) < 1 &&
        Math.abs(after.height - before.height) < 1,
      "Reaching a desktop selection control must keep the left stage fixed",
    );
  } else if (embedded) {
    await control.scrollIntoViewIfNeeded();
    await assertSelectionScrollPolicy(page, new URL(page.url()).pathname);
  }
  await assertWithinViewport(control, message);
}

async function captureReview(page, filename) {
  if (!process.env.EXPERIENCE_SCREENSHOTS) return;
  const directory = resolve(process.env.EXPERIENCE_SCREENSHOTS);
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: resolve(directory, filename) });
}

function heroExplore(page) {
  return page.locator('button[aria-controls="home-selection"]');
}

async function selectHomeShop(page) {
  await page
    .locator('[data-embedded="true"]')
    .getByRole("button", { name: "Shop", exact: true })
    .click();
}

async function usesHomeSelector(page) {
  return (await page.locator('[data-embedded="true"]').count()) === 1;
}

async function matchaChoice(page, name) {
  return (await usesHomeSelector(page))
    ? page
        .getByRole("group", { name: "Matcha to explore", exact: true })
        .getByRole("button", { name: `Select ${name}`, exact: true })
    : page.getByRole("radio", { name: new RegExp(name, "i") });
}

async function chooseMatcha(page, name) {
  const choice = await matchaChoice(page, name);
  if (await usesHomeSelector(page)) await choice.click();
  else await choice.check();
}

async function matchaHeading(page) {
  return page.getByRole("heading", {
    name: (await usesHomeSelector(page))
      ? "Format & quantity."
      : "Choose your matcha.",
    exact: true,
  });
}

async function continueToQuantity(page) {
  if (await usesHomeSelector(page)) return;
  await page
    .getByRole("button", { name: "Continue to quantity", exact: true })
    .click();
}

async function swipeMaterial(context, page, target, direction) {
  await target.scrollIntoViewIfNeeded();
  const bounds = await target.boundingBox();
  const startX = bounds.x + bounds.width * (direction === "next" ? 0.8 : 0.2);
  const endX = bounds.x + bounds.width * (direction === "next" ? 0.2 : 0.8);
  const y = bounds.y + bounds.height / 2;
  assert.ok(
    y > 0 && y < page.viewportSize().height,
    "A native swipe must start on the visible material",
  );
  const input = await context.newCDPSession(page);
  try {
    await input.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: startX, y }],
    });
    for (let step = 1; step <= 10; step++) {
      await input.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: startX + ((endX - startX) * step) / 10, y }],
      });
      await page.waitForTimeout(20);
    }
    await input.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await input.detach();
  }
}

async function recordHomeHandoff(page) {
  await page.evaluate(() => {
    const samples = [];
    window.__homeHandoffClickedAt = null;
    document.querySelector('main[data-concept="01"]').addEventListener(
      "click",
      () => {
        window.__homeHandoffClickedAt = performance.now();
      },
      { once: true, capture: true },
    );
    const opacity = (element) => {
      if (!element) return 0;
      let value = 1;
      for (let node = element; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return 0;
        value *= Number(style.opacity);
      }
      return value;
    };
    const sample = () => {
      const main = document.querySelector('main[data-concept="01"]');
      const tray =
        main.querySelector("[data-handoff-tray] img") ??
        main.querySelector('img[alt^="An overhead view"]');
      const scene = main.querySelector("[data-renderer]");
      const sources = scene ? [...scene.querySelectorAll("img, canvas")] : [];
      const renderedOpacity = sources.reduce((sum, source) => {
        const ready =
          source.tagName === "CANVAS"
            ? scene.dataset.renderer === "webgl"
            : source.complete && source.naturalWidth > 0;
        return sum + (ready ? opacity(source) : 0);
      }, 0);
      const trayBounds = tray.getBoundingClientRect();
      const entryControl = [
        ...main.querySelectorAll('[aria-label="Shopping mode"] button'),
      ].find((button) => button.textContent.startsWith("Shop"));
      samples.push({
        elapsed:
          window.__homeHandoffClickedAt === null
            ? null
            : performance.now() - window.__homeHandoffClickedAt,
        phase: main.dataset.handoff,
        renderer: scene?.dataset.renderer ?? "absent",
        trayOpacity: tray.complete && tray.naturalWidth > 0 ? opacity(tray) : 0,
        renderedOpacity,
        trayX: trayBounds.x,
        trayY: trayBounds.y,
        trayWidth: trayBounds.width,
        trayHeight: trayBounds.height,
        controlsEnabled: Boolean(
          entryControl &&
          !entryControl.disabled &&
          getComputedStyle(entryControl).visibility !== "hidden",
        ),
      });
      window.__homeHandoffFrame = requestAnimationFrame(sample);
    };
    window.__homeHandoffSamples = samples;
    sample();
  });
}

async function finishHomeHandoffRecording(page) {
  return page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    cancelAnimationFrame(window.__homeHandoffFrame);
    return window.__homeHandoffSamples;
  });
}

async function openColdHome(page, path = "/") {
  // Background scene preparation intentionally remains blocked by the test's
  // asset gate, so wait for the visible hero rather than network idleness.
  await page.goto(`${baseURL}${path}`, { waitUntil: "domcontentloaded" });
  await page
    .getByAltText(/An overhead view of fine green matcha/)
    .evaluate((image) => image.decode());
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.locator('[data-embedded="true"]').waitFor({ state: "attached" });
}

async function openHome(page, path = "/") {
  await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });
  await heroExplore(page).click();
  await selectHomeShop(page);
  await (await matchaChoice(page, "Matcha One")).waitFor();
  await continueToQuantity(page);
}

function assertHealthy(state) {
  assert.deepEqual(
    state.routeErrors,
    [],
    "All API calls must match the mock contract",
  );
  assert.deepEqual(state.pageErrors, [], "No browser runtime errors");
}

async function assertMaterialProperties(profile) {
  const properties = profile.getByRole("group", {
    name: "Explore material properties",
  });
  assert.equal(
    await properties.getByRole("button").count(),
    7,
    "Every material property must be present without a disclosure",
  );
  for (const label of [
    "Aroma",
    "Flavour",
    "Umami",
    "Bitterness",
    "Texture",
    "Colour",
    "Finish",
  ]) {
    const control = properties.getByRole("button", {
      name: new RegExp(`^${label}`),
    });
    assert.equal(
      await control.isVisible(),
      true,
      `${label} must remain visible`,
    );
    const bounds = await control.boundingBox();
    assert.ok(bounds && bounds.height >= 43.5, `${label} needs a 44px target`);
  }
}

async function expectWebgl(page) {
  const scene = page.locator("[data-renderer]");
  await eventually(
    () =>
      scene.getAttribute("data-renderer").then((value) => value === "webgl"),
    "The supported browser must render the actual WebGL material scene",
    20_000,
  );
  const canvas = scene.locator(
    (await scene.getAttribute("data-material")) === "matcha"
      ? "canvas[data-scene-canvas]"
      : "canvas",
  );
  assert.equal(await canvas.count(), 1);
  const pixels = await canvas.evaluate((element) => ({
    width: element.width,
    height: element.height,
  }));
  assert.ok(
    pixels.width > 100 && pixels.height > 100,
    "The 3D scene needs a nonempty drawing buffer",
  );
  return { scene, canvas };
}

async function settledScene(scene) {
  let previous;
  let unchanged = 0;
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    const current = await scene.screenshot();
    unchanged = previous?.equals(current) ? unchanged + 1 : 0;
    if (unchanged >= 3) return current;
    previous = current;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  assert.fail("The material scene must finish its transition and settle");
}

async function expectPowder(scene) {
  assert.equal(await scene.getAttribute("data-material"), "matcha");
  assert.equal(await scene.getAttribute("data-stage"), "powder");
}

async function assertCardField(page, field, expected) {
  const value = page.locator(`[data-label-card] [data-label-field="${field}"]`);
  await eventually(
    () =>
      value
        .textContent()
        .then((text) =>
          expected instanceof RegExp
            ? expected.test(text.trim())
            : text.trim() === expected,
        ),
    `The label card ${field} must show ${expected}`,
  );
}

async function assertPrintedField(page, field, expected, reducedMotion) {
  const ink = page.locator(`[data-label-card] [data-label-ink="${field}"]`);
  const completedInk = () =>
    ink
      .evaluate((element) => ({
        text: element.textContent.trim(),
        visible:
          (element.dataset.labelInk === "reference" ||
            element.children.length > 0) &&
          [element, ...element.children].every((glyph) => {
            const style = getComputedStyle(glyph);
            return (
              Number(style.opacity) >= 0.99 && style.visibility !== "hidden"
            );
          }),
      }))
      .then((value) => value.text === expected && value.visible);
  if (reducedMotion === "reduce") {
    assert.equal(
      await completedInk(),
      true,
      "Reduced motion must show the complete new label text immediately",
    );
    return;
  }
  await eventually(
    completedInk,
    "The printed label must finish on the latest value after rapid changes",
    2000,
  );
}

async function assertReferenceFont(page) {
  const reference = page.getByRole("textbox", {
    name: "Your reference",
    exact: true,
  });
  const typography = await reference.evaluate(async (input) => {
    const style = getComputedStyle(input);
    const configured = style
      .getPropertyValue("--font-antro-vectra")
      .trim()
      .split(",")[0];
    const loaded = configured
      ? await document.fonts.load(`32px ${configured}`, "Studio 01")
      : [];
    await document.fonts.ready;
    const printed = document.querySelector(
      '[data-label-card] [data-label-ink="reference"]',
    );
    return {
      configured,
      inputFamily: style.fontFamily,
      cardFamily: getComputedStyle(printed).fontFamily,
      inputSize: Number.parseFloat(style.fontSize),
      inputTransform: style.textTransform,
      cardTransform: getComputedStyle(printed).textTransform,
      fontLoaded:
        loaded.length > 0 && loaded.every((face) => face.status === "loaded"),
      fontReady: configured && document.fonts.check(`32px ${configured}`),
      separateGlyphs: printed.children.length,
    };
  });
  assert.ok(typography.configured, "Antro Vectra must be configured locally");
  const family = typography.configured.replace(/["']/g, "").trim();
  assert.ok(typography.inputFamily.includes(family));
  assert.ok(typography.cardFamily.includes(family));
  assert.ok(typography.fontLoaded && typography.fontReady);
  assert.equal(typography.inputSize, 32);
  assert.equal(typography.inputTransform, "none");
  assert.equal(typography.cardTransform, "none");
  assert.equal(
    typography.separateGlyphs,
    0,
    "Handwritten reference text must stay together for connected script shaping",
  );
}

async function expectVisibleStage(page) {
  const bounds = await page.locator("[data-renderer]").boundingBox();
  const viewport = page.viewportSize();
  assert.ok(
    bounds &&
      viewport &&
      bounds.y >= -1 &&
      bounds.y + bounds.height <= viewport.height + 1 &&
      bounds.width >= 200 &&
      bounds.height >= 100,
    `The product stage must remain visible while choosing: ${JSON.stringify(bounds)}`,
  );
}

async function builderStep(page, name) {
  if (await usesHomeSelector(page)) return;
  await page
    .getByRole("navigation", { name: "Builder steps" })
    .getByRole("button", { name: new RegExp(name) })
    .click();
}

async function assertSelectionScrollPolicy(page, path) {
  const panel = page.locator(
    path.startsWith("/concept-02") ? "#matcha-workspace" : "#home-selection",
  );
  const scrolling = await panel.evaluate((element) =>
    [element, ...element.querySelectorAll("*")]
      .filter((node) => !node.closest("dialog"))
      .filter((node) => {
        const style = getComputedStyle(node);
        return (
          /^(auto|scroll)$/.test(style.overflowY) &&
          node.scrollHeight > node.clientHeight + 1
        );
      })
      .map((node) => ({
        tag: node.tagName,
        height: node.clientHeight,
        content: node.scrollHeight,
        selectionPane: node.hasAttribute("data-selection-scroll"),
      })),
  );
  if (!path.startsWith("/concept-02") && page.viewportSize().width > 760) {
    assert.equal(await panel.locator("[data-selection-scroll]").count(), 1);
    assert.ok(
      scrolling.every((node) => node.selectionPane),
      "Desktop homepage scrolling must be contained by its single right pane",
    );
    assert.equal(await page.evaluate(() => window.scrollY), 0);
    return;
  }
  assert.deepEqual(
    scrolling,
    [],
    "Quick buying must not need an inner selection scrollbar",
  );
}

function primaryEntry(page, path) {
  return path.startsWith("/concept-02")
    ? page.locator('button[aria-controls="matcha-workspace"]')
    : heroExplore(page);
}

async function openStorySelection(page, path = "/concept-02") {
  await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });
  await primaryEntry(page, path).click();
  if (!path.startsWith("/concept-02")) await selectHomeShop(page);
  await (await matchaChoice(page, "Culinary Matcha")).waitFor();
  if (!path.startsWith("/concept-02")) await continueToQuantity(page);
}

const cases = [];
for (const [width, tone] of [
  [320, "dark"],
  [390, "light"],
]) {
  const path = "/";
  cases.push([
    `mobile ${width}px ${tone}: compact navigation and product-first selection follow a natural page flow`,
    async (browser) => {
      const { context, page, state } = await setup(browser, {
        initialTheme: tone,
        viewport: { width, height: 844 },
        hasTouch: true,
        reducedMotion: "reduce",
        catalogProducts: productStories,
      });
      try {
        await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });
        const originalURL = page.url();
        const main = page.locator('main[data-concept="01"]');
        const header = main.locator(":scope > header");
        const disclosure = header.locator("[data-navigation-index]");
        const menu = disclosure.locator('summary[aria-label="Menu"]');
        const brand = header.getByRole("link", {
          name: "ATOMA home",
          exact: true,
        });
        const cart = header.getByRole("button", {
          name: "Open cart, 0 items",
          exact: true,
        });
        const matcha = header.getByRole("button", {
          name: "Explore matcha",
          exact: true,
        });
        const shopLink = header.getByRole("link", {
          name: "SHOP",
          exact: true,
        });
        const heroHeading = main.getByRole("heading", { level: 1 });
        assert.equal(
          await disclosure.evaluate((element) => element.open),
          false,
        );
        assert.equal(
          await matcha.count(),
          0,
          "Closed Menu must hide its actions from keyboard navigation",
        );
        const headerBounds = await header.boundingBox();
        assert.ok(
          headerBounds.height <= 80,
          "Phone navigation must leave room for the product",
        );
        const targets = [];
        for (const control of [brand, menu, cart]) {
          await assertWithinViewport(
            control,
            "The compact header must expose brand, Menu and Cart",
          );
          const bounds = await control.boundingBox();
          assert.ok(
            bounds.height >= 43.5,
            "Mobile header controls need a 44px touch target",
          );
          targets.push(bounds);
        }
        assert.ok(
          targets.every(
            (bounds) =>
              Math.abs(
                bounds.y +
                  bounds.height / 2 -
                  (targets[0].y + targets[0].height / 2),
              ) < 4,
          ),
          "Brand, Menu and Cart must share one row",
        );
        const tray = page.getByRole("button", {
          name: "Explore matcha from the tray",
          exact: true,
        });
        const trayBounds = await tray.boundingBox();
        const headingBounds = await heroHeading.boundingBox();
        const entryBounds = await heroExplore(page).boundingBox();
        assert.ok(
          trayBounds.y + trayBounds.height <= headingBounds.y + 1,
          "The mobile hero must introduce the matcha before its headline",
        );
        assert.ok(
          headingBounds.y + headingBounds.height <= entryBounds.y + 1,
          "The primary entry must follow the headline",
        );
        await assertWithinViewport(
          heroExplore(page),
          "The mobile hero must make its primary entry directly reachable",
        );

        await menu.focus();
        await page.keyboard.press("Enter");
        assert.equal(
          await disclosure.evaluate((element) => element.open),
          true,
        );
        await page.keyboard.press("Tab");
        await assertFocused(
          matcha,
          "Menu must expose Matcha to native keyboard navigation",
        );
        for (const control of [
          matcha,
          shopLink,
          header.getByRole("button", { name: "About ATOMA", exact: true }),
        ]) {
          await assertWithinViewport(
            control,
            "Open Menu actions must remain visible and clickable",
          );
          assert.ok((await control.boundingBox()).height >= 43.5);
        }
        assert.equal(await shopLink.getAttribute("href"), "/shop");
        await page.keyboard.press("Escape");
        assert.equal(
          await disclosure.evaluate((element) => element.open),
          false,
        );
        await assertFocused(menu, "Escape must restore Menu focus");
        await page.keyboard.press("Enter");
        await page.keyboard.press("Shift+Tab");
        await assertFocused(
          brand,
          "Leaving Menu must preserve normal backward navigation",
        );
        assert.equal(
          await disclosure.evaluate((element) => element.open),
          false,
        );
        await menu.click();
        await heroHeading.click();
        assert.equal(
          await disclosure.evaluate((element) => element.open),
          false,
          "A pointer action outside Menu must close it",
        );
        await menu.click();
        await header
          .getByRole("button", { name: "About ATOMA", exact: true })
          .click();
        const about = page.getByRole("dialog", {
          name: /A closer look at matcha/,
        });
        await about.waitFor();
        await assertFocused(
          about.getByRole("button", { name: "CLOSE", exact: true }),
          "About must focus its close control",
        );
        assert.equal(
          await disclosure.evaluate((element) => element.open),
          false,
        );
        await page.keyboard.press("Escape");
        await about.waitFor({ state: "hidden" });
        await assertFocused(
          menu,
          "About must return focus to the visible Menu control",
        );
        await cart.click();
        const cartDialog = page.getByRole("dialog", { name: /Your selection/ });
        await cartDialog.waitFor();
        await page.keyboard.press("Escape");
        await cartDialog.waitFor({ state: "hidden" });
        await assertFocused(
          cart,
          "Closing Cart must restore its always-visible header control",
        );

        await heroExplore(page).click();
        await main.locator('[data-embedded="true"]').waitFor();
        await page.locator('main[data-handoff="complete"]').waitFor();
        await selectHomeShop(page);
        const modes = page.getByRole("group", { name: "Shopping mode" });
        const stage = main.locator("[data-product-object]");
        const selectionHeading = await matchaHeading(page);
        await assertFocused(
          selectionHeading,
          "Mobile entry must focus the active selection heading",
        );
        await assertWithinViewport(
          selectionHeading,
          "The focused selection heading must be on screen",
        );
        await modes.scrollIntoViewIfNeeded();
        const types = page.getByRole("group", {
          name: "Matcha to explore",
          exact: true,
        });
        assert.equal(await types.count(), 1);
        const typeBounds = await types.boundingBox();
        const modeBounds = await modes.boundingBox();
        const stageBounds = await stage.boundingBox();
        const selectionBounds = await selectionHeading.boundingBox();
        assert.ok(
          typeBounds.y + typeBounds.height <= modeBounds.y + 1,
          "The shared product chooser must precede the product views on phones",
        );
        assert.ok(
          modeBounds.y + modeBounds.height <= stageBounds.y + 1,
          "The product views must precede the product stage on phones",
        );
        assert.ok(
          stageBounds.y + stageBounds.height <= selectionBounds.y + 1,
          "The product stage must precede its selection content",
        );
        for (const control of await modes.getByRole("button").all())
          assert.ok(
            (await control.boundingBox()).height >= 43.5,
            "Mode choices need a 44px touch target",
          );
        assert.equal(
          await page
            .getByRole("navigation", { name: "Builder steps", exact: true })
            .count(),
          0,
        );
        assert.equal(
          await page
            .getByRole("button", { name: "Continue to quantity", exact: true })
            .count(),
          0,
        );
        assert.equal(
          await page
            .getByRole("button", {
              name: /^(?:Add|Edit) reference Personalize/,
            })
            .count(),
          0,
        );
        assert.equal(
          await page
            .getByRole("group", { name: "Move label card", exact: true })
            .count(),
          0,
        );
        const quantity = page.getByLabel("Quantity", { exact: true });
        assert.equal(
          await quantity.textContent(),
          "01",
          "Mobile Shop must expose quantity without another step",
        );
        assert.ok(
          await page
            .getByRole("radio", { name: "One-time purchase", exact: true })
            .isChecked(),
        );
        assert.ok(
          await page
            .getByRole("radio", {
              name: "Subscribe — unavailable",
              exact: true,
            })
            .isDisabled(),
        );
        await page
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        await chooseMatcha(page, "Culinary Matcha");
        assert.equal(
          await quantity.textContent(),
          "02",
          "Re-selecting the active grade must retain its quantity",
        );
        const previous = page.getByRole("button", {
          name: "Previous matcha",
          exact: true,
        });
        const next = page.getByRole("button", {
          name: "Next matcha",
          exact: true,
        });
        assert.ok(await previous.isDisabled());
        await next.click();
        assert.equal(
          await (
            await matchaChoice(page, "Barista Matcha")
          ).getAttribute("aria-pressed"),
          "true",
        );
        await previous.click();
        assert.equal(
          await (
            await matchaChoice(page, "Culinary Matcha")
          ).getAttribute("aria-pressed"),
          "true",
        );
        await swipeMaterial(context, page, stage, "next");
        await eventually(
          () =>
            page
              .locator('[data-embedded="true"]')
              .getAttribute("data-pose")
              .then((value) => value === "1"),
          "A native material swipe must select the next grade under reduced motion",
        );
        assert.equal(
          await quantity.textContent(),
          "01",
          "A different matcha must use its own valid initial quantity",
        );
        await page
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        await modes
          .getByRole("button", { name: "Overview", exact: true })
          .click();
        await assertFocused(
          page.getByRole("heading", { name: "Barista Matcha", exact: true }),
          "Explore must focus its material heading",
        );
        await modes.scrollIntoViewIfNeeded();
        const before = {
          scroll: await page.evaluate(() => window.scrollY),
          stage: await stage.boundingBox(),
        };
        const continueShop = page.getByRole("button", {
          name: "Shop this matcha",
          exact: true,
        });
        await continueShop.scrollIntoViewIfNeeded();
        await assertWithinViewport(
          continueShop,
          "The material overview must lead to a reachable Shop action",
        );
        const after = {
          scroll: await page.evaluate(() => window.scrollY),
          stage: await stage.boundingBox(),
        };
        assert.ok(
          Math.abs(
            before.stage.y - after.stage.y - (after.scroll - before.scroll),
          ) < 2,
          "The mobile product must scroll with the page instead of obscuring content",
        );
        assert.equal(
          await main
            .locator("[data-selection-scroll]")
            .evaluate((element) => element.scrollTop),
          0,
        );
        await assertSelectionScrollPolicy(page, path);
        await continueShop.click();
        await assertFocused(
          await matchaHeading(page),
          "Mobile Shop must focus its matcha heading above the inline quantity controls",
        );
        assert.equal(
          await quantity.textContent(),
          "02",
          "Overview and Shop must preserve the inline quantity",
        );
        const catalogReads = state.catalogReads;
        const themeSwitch = page.getByRole("switch", {
          name: "Dark mode",
          exact: true,
        });
        const historyLength = await page.evaluate(() => window.history.length);
        await themeSwitch.click();
        assert.equal(await quantity.textContent(), "02");
        assert.equal(page.url(), originalURL);
        assert.equal(
          await page.evaluate(() => window.history.length),
          historyLength,
        );
        await themeSwitch.click();
        assert.equal(page.url(), originalURL);
        assert.equal(await quantity.textContent(), "02");
        assert.equal(state.catalogReads, catalogReads);
        await assertSelectionControlReachable(
          page,
          page.getByRole("button", { name: /^Add to cart/ }),
          "The mobile purchase action must remain reachable after reading material details",
        );
        await page
          .getByRole("button", { name: "Back to overview", exact: true })
          .click();
        await assertFocused(
          heroExplore(page),
          "Overview must restore the original hero entry",
        );
        assert.equal(page.url(), originalURL);
        await menu.click();
        await shopLink.click();
        await page
          .getByRole("heading", { name: "Find your matcha.", exact: true })
          .waitFor();
        assert.equal(new URL(page.url()).pathname, "/shop");
        assert.equal(
          state.actions.length,
          0,
          "Browsing the mobile navigation and material must not mutate commerce",
        );
        await assertNoOverflow(page);
        assertHealthy(state);
      } finally {
        await context.close();
      }
    },
  ]);
}

for (const width of [1440, 320, 390]) {
  for (const [path, tone] of [
    ["/", "dark"],
    ["/", "light"],
    ["/concept-02", "light"],
  ]) {
    cases.push([
      `quick purchase ${width}px ${path} ${tone}: choices and Add remain reachable with the intended scroll layout`,
      async (browser) => {
        const { context, page, state } = await setup(browser, {
          initialTheme: tone,
          viewport: { width, height: width === 1440 ? 900 : 844 },
          reducedMotion: "reduce",
          catalogProducts: productStories,
        });
        try {
          await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });
          await assertNoOverflow(page);
          const trigger = primaryEntry(page, path);
          const currentURL = page.url();
          const tray =
            path !== "/concept-02"
              ? page.getByAltText(/An overhead view of fine green matcha/)
              : null;
          const trayBefore = tray ? await tray.boundingBox() : null;
          await trigger.focus();
          await page.keyboard.press("Enter");
          if (path !== "/concept-02") await selectHomeShop(page);
          await (await matchaChoice(page, "Culinary Matcha")).waitFor();
          assert.equal(
            page.url(),
            currentURL,
            "Product entry must remain on the same page",
          );
          await assertFocused(
            await matchaHeading(page),
            "Product entry must focus the selection heading",
          );
          if (path === "/concept-02") {
            assert.equal(
              await page.locator("main[data-mode]").getAttribute("data-mode"),
              "standard",
            );
            assert.equal(
              await page
                .locator("[data-renderer]")
                .getAttribute("data-material"),
              "matcha",
              "The primary concept must retain the matcha material",
            );
            assert.equal(
              await page
                .getByRole("navigation", { name: "Builder steps" })
                .count(),
              0,
              "The primary entry must not require builder steps",
            );
          } else {
            assert.equal(
              await page
                .locator('main[data-concept="01"]')
                .getAttribute("data-tone"),
              tone,
            );
            const experience = page.locator(
              '[data-embedded="true"][data-mode]',
            );
            assert.equal(await experience.getAttribute("data-mode"), "builder");
            assert.equal(await experience.getAttribute("data-stage"), "powder");
            assert.equal(
              await page
                .getByRole("navigation", { name: "Builder steps" })
                .getByRole("button")
                .count(),
              0,
              "Homepage Shop must expose quantity without a redundant matcha step",
            );
            if (width === 1440) {
              await eventually(async () => {
                const after = await tray.boundingBox();
                return after && after.x < trayBefore.x - 80;
              }, "Opening selection must move the tray left");
            }
            assert.equal(
              await page
                .getByRole("group", { name: "Shopping mode" })
                .getByRole("button", { name: "Shop", exact: true })
                .getAttribute("aria-pressed"),
              "true",
            );
          }
          if (await usesHomeSelector(page)) {
            assert.equal(
              await page.getByRole("radio", { name: /Matcha/i }).count(),
              0,
            );
            assert.equal(
              await page
                .getByRole("group", { name: "Matcha to explore", exact: true })
                .getByRole("button")
                .count(),
              3,
            );
          } else
            assert.equal(
              await page.getByRole("radio", { name: /Matcha/i }).count(),
              3,
            );
          assert.equal(
            await page.locator("[data-material-profile]:visible").count(),
            0,
            "Material properties must stay optional during quick buying",
          );
          assert.equal(await page.locator("dialog[open]").count(), 0);
          assert.equal(
            await page.getByRole("region", { name: /^About / }).count(),
            0,
            "Quick selection must not append a separate product-information section",
          );
          for (const [name, available] of [
            ["Culinary Matcha", true],
            ["Barista Matcha", true],
            ["Ceremonial Matcha", false],
          ]) {
            if (path !== "/concept-02") await builderStep(page, "Matcha");
            const choice = await matchaChoice(page, name);
            await assertSelectionControlReachable(
              page,
              (await usesHomeSelector(page)) ? choice : choice.locator(".."),
              "Every product choice must be reachable before selecting it",
            );
            await chooseMatcha(page, name);
            if (path !== "/concept-02") await continueToQuantity(page);
            const buy = page.getByRole("button", {
              name: available ? /^Add to cart/ : /^Currently unavailable/,
            });
            await assertSelectionControlReachable(
              page,
              buy,
              `The purchase action for ${name} must be reachable in its selection layout`,
            );
            assert.equal(await buy.isDisabled(), !available);
            if (name === "Barista Matcha") {
              assert.equal(
                await page
                  .getByRole("button", { name: "1 kg", exact: true })
                  .count(),
                0,
                "A single available format must be a fact rather than a redundant choice",
              );
            }
            await assertSelectionScrollPolicy(page, path);
            await assertNoOverflow(page);
          }
          if (path !== "/concept-02") await builderStep(page, "Matcha");
          await chooseMatcha(page, "Culinary Matcha");
          if (path !== "/concept-02") await continueToQuantity(page);
          await assertSelectionControlReachable(
            page,
            page.getByRole("button", { name: "5 × 1 kg", exact: true }),
            "Multiple formats must remain directly accessible",
          );
          await assertSelectionControlReachable(
            page,
            page.getByRole("button", {
              name: "Increase quantity",
              exact: true,
            }),
            "Quantity must remain directly accessible",
          );
          await captureReview(
            page,
            `quick-purchase-${path === "/" ? tone : path.slice(1)}-${width}.png`,
          );
          assert.equal(
            await page.locator("dialog[open]").count(),
            0,
            "Buying must not require opening the information drawer",
          );
          await page.getByRole("button", { name: /^Add to cart/ }).click();
          const cart = page.getByRole("dialog", { name: /Your selection/ });
          await cart.waitFor();
          assert.equal(state.actions.length, 1);
          assert.equal(state.lines[0].quantity, 1);
          await assertNoOverflow(page);
          await page.keyboard.press("Escape");
          await cart.waitFor({ state: "hidden" });
          await assertFocused(
            page.getByRole("button", { name: /^Add to cart/ }),
            "Cart Escape must return focus before another selection action",
          );
          assert.equal(
            await page
              .locator("main[data-exploring]")
              .getAttribute("data-exploring"),
            "true",
            "Cart Escape must keep the selection open",
          );
          await page.keyboard.press("Escape");
          await assertFocused(
            trigger,
            "Closing selection must return focus to its entry control",
          );
          assert.equal(
            await page.locator('a[href*="myshopify.com"]').count(),
            0,
          );
          assertHealthy(state);
        } finally {
          await context.close();
        }
      },
    ]);
  }
}

for (const [tone, width, reducedMotion] of [
  ["dark", 1440, "no-preference"],
  ["light", 390, "reduce"],
]) {
  const path = "/";
  cases.push([
    `home handoff ${tone}: click responds before scene loading, ${reducedMotion === "reduce" ? "reduced motion survives close and reopen" : "material overlaps without blocking purchase"}`,
    async (browser) => {
      const { context, page, state } = await setup(browser, {
        initialTheme: tone,
        viewport: { width, height: width === 1440 ? 900 : 844 },
        reducedMotion,
        catalogProducts: productStories,
      });
      let releaseAssets;
      const assetGate = new Promise((resolve) => {
        releaseAssets = resolve;
      });
      let delayedAssets = 0;
      await context.route(
        /\/images\/matcha\/[^/?]+\.(?:jpg|webp)(?:\?.*)?$/,
        async (route) => {
          delayedAssets++;
          await assetGate;
          await route.continue();
        },
      );
      try {
        await openColdHome(page, path);
        const main = page.locator('main[data-concept="01"]');
        const tray = page.getByAltText(/An overhead view of fine green matcha/);
        const trayBefore = await tray.boundingBox();
        const trigger = heroExplore(page);
        await recordHomeHandoff(page);
        await trigger.click();
        await eventually(
          () => delayedAssets > 0,
          "A fresh homepage must exercise the delayed scene assets",
        );
        await page
          .locator('[data-renderer="loading"]')
          .waitFor({ state: "attached" });
        assert.notEqual(await main.getAttribute("data-handoff"), "complete");
        await page.evaluate(async () => {
          for (let frame = 0; frame < 8; frame++)
            await new Promise(requestAnimationFrame);
        });
        const loadingSamples = await page.evaluate(() =>
          window.__homeHandoffSamples.filter(
            (sample) => sample.elapsed !== null && sample.phase !== "idle",
          ),
        );
        assert.ok(
          loadingSamples.length >= 8,
          "The slow first load must be observed across rendered frames",
        );
        assert.ok(
          loadingSamples.every((sample) => sample.trayOpacity >= 0.99),
          "The original tray must remain fully visible until the material renderer is ready",
        );
        const firstMotion = loadingSamples.find(
          (sample) =>
            Math.abs(sample.trayX - trayBefore.x) > 2 ||
            Math.abs(sample.trayY - trayBefore.y) > 2 ||
            Math.abs(sample.trayWidth - trayBefore.width) > 2 ||
            Math.abs(sample.trayHeight - trayBefore.height) > 2,
        );
        assert.ok(
          firstMotion && firstMotion.elapsed <= 200,
          `The tray must begin responding within 200ms of click while scene assets are blocked; observed ${firstMotion?.elapsed ?? "no motion"}ms`,
        );
        await captureReview(page, `home-loading-${tone}-${width}.png`);
        if (reducedMotion === "reduce") {
          await page.keyboard.press("Escape");
          await eventually(
            () =>
              main
                .getAttribute("data-handoff")
                .then((value) => value === "idle"),
            "Closing during load must cancel the in-progress handoff",
          );
          await assertFocused(
            trigger,
            "Interrupted loading must return focus to Explore",
          );
          releaseAssets();
          await expectWebgl(page);
          assert.equal(
            await main.getAttribute("data-handoff"),
            "idle",
            "A late renderer callback must not reopen a closed homepage journey",
          );
          await trigger.click();
        } else {
          releaseAssets();
        }
        await eventually(
          () =>
            main
              .getAttribute("data-handoff")
              .then((value) => value === "complete"),
          "Ready material must finish the tray-to-powder handoff",
          20_000,
        );
        const { scene } = await expectWebgl(page);
        await expectPowder(scene);
        assert.equal(await scene.getAttribute("data-stage"), "powder");
        const samples = await finishHomeHandoffRecording(page);
        const transitioning = samples.filter((sample) =>
          ["loading", "moving", "revealing"].includes(sample.phase),
        );
        assert.ok(
          transitioning.every(
            (sample) => sample.trayOpacity + sample.renderedOpacity >= 0.9,
          ),
          "Every transition frame needs a visible tray or ready product image; both must not disappear together",
        );
        assert.ok(
          transitioning.every(
            (sample) =>
              sample.trayOpacity >= 0.99 ||
              sample.renderer === "webgl" ||
              sample.renderer === "fallback",
          ),
          "The tray may fade only after a replacement renderer is ready",
        );
        if (reducedMotion === "no-preference")
          assert.ok(
            samples.some(
              (sample) =>
                sample.phase === "revealing" && sample.controlsEnabled,
            ),
            "The purchase controls must unlock during the image overlap without waiting for the powder animation to finish",
          );
        await assertFocused(
          page.locator(
            '[data-homepage-view-panel="overview"] [data-homepage-product-name]',
          ),
          "Finishing the handoff must expose and focus the selected matcha overview",
        );
        assert.equal(
          await page
            .getByRole("button", { name: "Overview", exact: true })
            .isEnabled(),
          true,
          "Completing the handoff must release the Overview option",
        );
        await selectHomeShop(page);
        await continueToQuantity(page);
        await expectPowder(scene);
        await page
          .getByRole("button", { name: "Back to overview", exact: true })
          .click();
        await assertFocused(
          trigger,
          "Closing the completed journey must restore Explore",
        );
        await recordHomeHandoff(page);
        await trigger.click();
        await eventually(
          () =>
            main
              .getAttribute("data-handoff")
              .then((value) => value === "complete"),
          "The retained scene must complete a second entry without stale transition state",
        );
        const warmSamples = await finishHomeHandoffRecording(page);
        const finished = warmSamples.find(
          (sample) => sample.phase === "complete" && sample.elapsed !== null,
        );
        assert.ok(
          finished && finished.elapsed <= 1300,
          `A prepared scene must complete the handoff within 1.3 seconds without an artificial hold; observed ${finished?.elapsed ?? "no complete frame"}ms`,
        );
        assert.equal(await scene.getAttribute("data-stage"), "powder");
        assert.equal(state.actions.length, 0);
        await assertNoOverflow(page);
        assertHealthy(state);
      } finally {
        releaseAssets();
        await context.close();
      }
    },
  ]);
}

cases.push([
  "home handoff fallback: unavailable WebGL retains the tray until its photograph decodes",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      reducedMotion: "reduce",
      catalogProducts: productStories,
    });
    let releaseImages;
    const imageGate = new Promise((resolve) => {
      releaseImages = resolve;
    });
    let delayedImages = 0;
    await context.addInitScript(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...options) {
        if (/webgl/.test(kind)) return null;
        return originalGetContext.call(this, kind, ...options);
      };
    });
    // Next dev requests source maps for the deliberately triggered WebGL
    // diagnostic. Fulfill that exact development-only request in memory too.
    await context.route(`${origin}/__nextjs_original-stack-frames`, (route) => {
      assert.equal(route.request().method(), "POST");
      return route.fulfill({ status: 204, body: "" });
    });
    await context.route(
      (url) =>
        url.pathname.startsWith("/images/matcha/") ||
        (url.pathname === "/_next/image" &&
          url.searchParams.get("url")?.startsWith("/images/matcha/")),
      async (route) => {
        delayedImages++;
        await imageGate;
        await route.continue();
      },
    );
    try {
      await openColdHome(page);
      await recordHomeHandoff(page);
      await heroExplore(page).click();
      await eventually(
        () => delayedImages > 0,
        "The fallback test must delay its actual product photographs",
      );
      const main = page.locator('main[data-concept="01"]');
      const scene = page.locator("[data-renderer]");
      await eventually(
        () =>
          scene
            .getAttribute("data-renderer")
            .then((value) => value === "fallback"),
        "Unsupported WebGL must select the photographic fallback",
      );
      await page.evaluate(async () => {
        for (let frame = 0; frame < 8; frame++)
          await new Promise(requestAnimationFrame);
      });
      assert.equal(
        await main.getAttribute("data-handoff"),
        "loading",
        "A fallback is ready only after its replacement image is decoded",
      );
      releaseImages();
      await eventually(
        () =>
          main
            .getAttribute("data-handoff")
            .then((value) => value === "complete"),
        "A decoded fallback must finish the reduced-motion handoff",
      );
      const samples = await finishHomeHandoffRecording(page);
      assert.ok(
        samples.every(
          (sample) => sample.trayOpacity + sample.renderedOpacity >= 0.9,
        ),
        "The unavailable-renderer path must retain a visible image throughout its handoff",
      );
      await expectPowder(scene);
      assert.equal(await scene.locator("canvas[data-scene-canvas]").count(), 0);
      await selectHomeShop(page);
      await page.getByLabel("Quantity", { exact: true }).waitFor();
      await expectPowder(scene);
      await assertSelectionControlReachable(
        page,
        page.getByRole("button", { name: /^Add to cart/ }),
        "The photographic fallback must preserve a usable purchase flow",
      );
      assert.equal(state.actions.length, 0);
      await assertNoOverflow(page);
      await captureReview(page, "home-powder-label-fallback-light.png");
      assertHealthy(state);
    } finally {
      releaseImages();
      await context.close();
    }
  },
]);

for (const [tone, width, entry] of [
  ["dark", 1440, "tray"],
  ["light", 390, "header"],
]) {
  const path = "/";
  cases.push([
    `home journey ${tone}: ${entry} enters powder, selection reforms material, quantity stays current and cart follows the theme`,
    async (browser) => {
      const { context, page, state } = await setup(browser, {
        initialTheme: tone,
        viewport: { width, height: width === 1440 ? 900 : 844 },
        catalogProducts: productStories,
      });
      try {
        await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });
        const initialURL = page.url();
        const trigger =
          entry === "tray"
            ? page.getByRole("button", {
                name: "Explore matcha from the tray",
                exact: true,
              })
            : page.locator('header button[aria-label="Explore matcha"]');
        const returnTarget =
          entry === "header" && width <= 760
            ? page.locator('header summary[aria-label="Menu"]')
            : trigger;
        if (returnTarget !== trigger) await returnTarget.click();
        await trigger.click();
        const experience = page.locator('[data-embedded="true"][data-mode]');
        await selectHomeShop(page);
        await (await matchaChoice(page, "Culinary Matcha")).waitFor();
        assert.equal(await experience.getAttribute("data-mode"), "builder");
        assert.equal(await experience.getAttribute("data-tone"), tone);
        assert.equal(
          await page.locator('main[data-concept="01"] > header').count(),
          1,
          "The in-place builder must reuse the homepage header",
        );
        await assertFocused(
          await matchaHeading(page),
          "Homepage builder entry must focus its selection heading",
        );
        const { scene } = await expectWebgl(page);
        await expectPowder(scene);
        assert.equal(await scene.getAttribute("data-stage"), "powder");
        assert.equal(await scene.getAttribute("data-tone"), tone);
        const firstPowder = await settledScene(scene);
        await chooseMatcha(page, "Barista Matcha");
        const nextPowder = await settledScene(scene);
        assert.equal(
          firstPowder.equals(nextPowder),
          false,
          "Changing matcha must reform the actual rendered material",
        );
        assert.match(
          await scene.getAttribute("aria-label"),
          /Barista Matcha powder/,
        );
        assert.ok(
          decodeURIComponent(
            await scene.locator("img").getAttribute("src"),
          ).includes("/images/matcha/latte.jpg"),
          "The selected powder must derive from its supplied product photograph",
        );
        await captureReview(page, `home-material-${tone}-${width}.png`);
        await continueToQuantity(page);
        await expectPowder(scene);
        assert.match(
          await scene.getAttribute("aria-label"),
          /Barista Matcha powder/,
        );
        if (width > 760) {
          await assertCardField(page, "name", "Barista Matcha");
          await assertCardField(page, "application", /lattes/i);
          await assertCardField(page, "format", "1 kg");
          await assertCardField(page, "quantity", "01");
        } else
          assert.equal(
            await page.getByLabel("Quantity", { exact: true }).textContent(),
            "01",
          );
        await page
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        if (width > 760) await assertCardField(page, "quantity", "02");
        await expectPowder(scene);
        assert.equal(
          await page.getByLabel("Quantity", { exact: true }).textContent(),
          "02",
        );
        await assertSelectionControlReachable(
          page,
          page.getByRole("button", { name: /^Add to cart/ }),
          "The homepage quantity step must keep its purchase action reachable",
        );
        await captureReview(page, `home-powder-label-${tone}-${width}.png`);
        await page
          .getByRole("button", { name: "Overview", exact: true })
          .click();
        assert.equal(
          await (
            await matchaChoice(page, "Barista Matcha")
          ).getAttribute("aria-pressed"),
          "true",
        );
        assert.equal(
          await page.getByLabel("Quantity", { exact: true }).count(),
          0,
          "Explore must present material information instead of purchase controls",
        );
        await page.getByRole("button", { name: "Shop", exact: true }).click();
        assert.equal(
          await page.getByLabel("Quantity", { exact: true }).textContent(),
          "02",
          "Switching shopping modes must preserve the builder step and quantity",
        );
        const add = page.getByRole("button", { name: /^Add to cart/ });
        await add.click();
        const cart = page.getByRole("dialog", { name: /Your selection/ });
        await cart.waitFor();
        const cartColors = await cart.evaluate((element) => {
          const style = getComputedStyle(element);
          const brightness = (color) =>
            color
              .match(/[\d.]+/g)
              .slice(0, 3)
              .reduce((sum, value) => sum + Number(value), 0) / 3;
          return {
            background: brightness(style.backgroundColor),
            text: brightness(style.color),
            colorScheme: style.colorScheme,
          };
        });
        assert.equal(cartColors.colorScheme, tone);
        assert.equal(
          cartColors.text > cartColors.background,
          tone === "dark",
          "Cart text and background must visibly follow the active page theme",
        );
        assert.deepEqual(state.actions[0], {
          action: "add",
          productHandle: productStories[1].handle,
          variantKey: productStories[1].variants[0].id,
          quantity: 2,
        });
        await captureReview(page, `home-cart-${tone}-${width}.png`);
        await assertNoOverflow(page);
        await page.keyboard.press("Escape");
        await cart.waitFor({ state: "hidden" });
        await assertFocused(
          add,
          "Closing the themed cart must return to the in-place purchase control",
        );
        assert.equal(
          await page
            .locator('main[data-concept="01"]')
            .getAttribute("data-exploring"),
          "true",
        );
        await page
          .getByRole("button", { name: "Back to overview", exact: true })
          .click();
        await assertFocused(
          returnTarget,
          "Closing the builder must restore the original tray or visible header menu",
        );
        assert.equal(
          page.url(),
          initialURL,
          "The whole homepage purchase journey must remain in place",
        );
        assertHealthy(state);
      } finally {
        await context.close();
      }
    },
  ]);
}

cases.push([
  "powder sizing: rotated mobile scenes retain their aspect through placement, view and viewport changes",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      viewport: { width: 713, height: 900 },
      reducedMotion: "reduce",
      catalogProducts: productStories,
    });
    try {
      await page.goto(`${baseURL}/selector-study/left`, {
        waitUntil: "networkidle",
      });
      await page.locator('main[data-handoff="complete"]').waitFor();
      const { scene, canvas } = await expectWebgl(page);
      const originalCanvas = await canvas.elementHandle();
      const assertUniformPixels = async (message) => {
        await eventually(
          () =>
            scene.evaluate((element) => {
              const canvas = element.querySelector("canvas[data-scene-canvas]");
              if (
                !canvas ||
                element.clientWidth < 100 ||
                element.clientHeight < 100
              )
                return false;
              const horizontalScale = canvas.width / element.clientWidth;
              const verticalScale = canvas.height / element.clientHeight;
              return (
                Math.abs(horizontalScale - verticalScale) < 0.01 &&
                Math.abs(horizontalScale - Math.min(devicePixelRatio, 2)) < 0.01
              );
            }),
          message,
        );
        assert.equal(
          await canvas.evaluate(
            (element, original) => element === original,
            originalCanvas,
          ),
          true,
          "Layout changes must preserve the existing material renderer",
        );
      };
      await assertUniformPixels(
        "A fresh mobile scene needs equal horizontal and vertical pixel density",
      );
      assert.ok(
        await scene.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return (
            Math.abs(
              bounds.width / bounds.height -
                element.clientWidth / element.clientHeight,
            ) > 0.2
          );
        }),
        "The regression must exercise a rotated, non-square mobile material stage",
      );

      await chooseMatcha(page, "Barista Matcha");
      await selectHomeShop(page);
      await page
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      const quantity = page.getByLabel("Quantity", { exact: true });
      assert.equal(Number(await quantity.textContent()), 2);
      const placements = page.getByRole("group", {
        name: "Selector placement",
        exact: true,
      });
      for (const placement of ["Right", "Left"]) {
        await placements
          .getByRole("button", { name: placement, exact: true })
          .click();
        await assertUniformPixels(
          `${placement} placement must keep the powder proportionate`,
        );
        assert.equal(Number(await quantity.textContent()), 2);
      }

      const modes = page.getByRole("group", {
        name: "Shopping mode",
        exact: true,
      });
      await modes
        .getByRole("button", { name: "Specifications", exact: true })
        .click();
      await scene.waitFor({ state: "hidden" });
      await modes
        .getByRole("button", { name: "Overview", exact: true })
        .click();
      await scene.waitFor({ state: "visible" });
      await assertUniformPixels(
        "Returning from a hidden view must restore the correct mobile powder aspect",
      );
      await selectHomeShop(page);
      assert.equal(Number(await quantity.textContent()), 2);
      assert.equal(
        await (
          await matchaChoice(page, "Barista Matcha")
        ).getAttribute("aria-pressed"),
        "true",
        "Placement and view changes must retain the selected matcha",
      );

      for (const width of [1366, 713]) {
        await page.setViewportSize({ width, height: 900 });
        await assertUniformPixels(
          `Resizing to ${width}px must preserve uniform material pixel density`,
        );
        assert.equal(Number(await quantity.textContent()), 2);
      }
      await assertNoOverflow(page);
      assert.equal(state.actions.length, 0);
      assertHealthy(state);
    } finally {
      await context.close();
    }
  },
]);

cases.push([
  "home Shop: scrolling purchase controls keeps the page and left matcha stage fixed",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      viewport: { width: 1440, height: 700 },
      reducedMotion: "reduce",
      catalogProducts: productStories,
    });
    try {
      await page.goto(baseURL, { waitUntil: "networkidle" });
      await heroExplore(page).click();
      await page.locator('main[data-handoff="complete"]').waitFor();
      await selectHomeShop(page);
      const experience = page.locator('[data-embedded="true"][data-mode]');
      const scroller = experience.locator("[data-selection-scroll]");
      const stage = experience.locator("[data-product-object]");
      const heading = scroller.getByRole("heading", {
        name: "Format & quantity.",
        exact: true,
      });
      await assertFocused(
        heading,
        "Shop must focus its purchase configuration heading",
      );
      await heading.scrollIntoViewIfNeeded();
      const before = await stage.boundingBox();
      assert.ok(before && before.height > 0);
      assert.equal(await page.evaluate(() => window.scrollY), 0);
      assert.ok(
        await scroller.evaluate(
          (element) => element.scrollHeight > element.clientHeight + 1,
        ),
        "Shop controls must use bounded overflow at a short desktop viewport",
      );
      const bounds = await scroller.boundingBox();
      await page.mouse.move(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
      );
      const initialScroll = await scroller.evaluate(
        (element) => element.scrollTop,
      );
      await page.mouse.wheel(0, 600);
      await eventually(
        () =>
          scroller.evaluate(
            (element, initial) => element.scrollTop > initial,
            initialScroll,
          ),
        "Wheel input over the details must scroll the right panel",
      );
      const assertStationaryStage = async () => {
        assert.equal(await page.evaluate(() => window.scrollY), 0);
        const after = await stage.boundingBox();
        assert.ok(
          Math.abs(after.y - before.y) < 1,
          "Right-panel scrolling cannot move the left stage",
        );
        assert.ok(
          Math.abs(after.height - before.height) < 1,
          "The matcha stage must retain its viewport-fitted height",
        );
        assert.ok(
          after.y >= 0 &&
            after.y + after.height <= page.viewportSize().height + 1,
        );
      };
      await assertStationaryStage();
      const purchase = scroller.getByRole("button", {
        name: "Add to cart",
        exact: true,
      });
      await purchase.scrollIntoViewIfNeeded();
      await assertWithinViewport(
        purchase,
        "Add to cart must remain reachable in the right panel",
      );
      await assertStationaryStage();
      await heading.scrollIntoViewIfNeeded();
      await assertWithinViewport(
        heading,
        "The selected matcha heading must remain reachable by scrolling back",
      );
      await assertWithinViewport(
        page
          .getByRole("group", { name: "Shopping mode" })
          .getByRole("button", { name: "Shop", exact: true }),
        "The Shop tab must remain available while details scroll",
      );
      await assertStationaryStage();
      assert.equal(new URL(page.url()).pathname, "/");
      assert.equal(state.actions.length, 0);
      await assertNoOverflow(page);
      assertHealthy(state);
    } finally {
      await context.close();
    }
  },
]);

cases.push([
  "home Overview: material comparison returns the selected matcha to Shop without losing the reference",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      viewport: { width: 1024, height: 844 },
      reducedMotion: "reduce",
      catalogProducts: productStories,
    });
    try {
      await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
      const originalURL = page.url();
      await heroExplore(page).click();
      await page.locator('main[data-handoff="complete"]').waitFor();
      await selectHomeShop(page);
      const experience = page.locator('[data-embedded="true"][data-mode]');
      const modes = page.getByRole("group", { name: "Shopping mode" });
      const explore = modes.getByRole("button", {
        name: "Overview",
        exact: true,
      });
      const shop = modes.getByRole("button", { name: "Shop", exact: true });
      assert.equal(await modes.getByRole("button").count(), 4);
      assert.equal(await shop.getAttribute("aria-pressed"), "true");
      await page
        .getByRole("button", { name: "Add label reference", exact: true })
        .click();
      const reference = page.getByRole("textbox", {
        name: "Your reference",
        exact: true,
      });
      await assertFocused(
        reference,
        "Shop must offer personalization from its first step",
      );
      await reference.fill("Studio 31");
      await page.getByRole("button", { name: "Done", exact: true }).click();
      assert.equal(await experience.getAttribute("data-step"), "1");
      await assertCardField(page, "reference", "Studio 31");

      await explore.click();
      const choices = page.getByRole("group", { name: "Matcha to explore" });
      const explorer = page.locator("[data-homepage-product-information]");
      await assertFocused(
        explorer.getByRole("heading", { name: "Culinary Matcha", exact: true }),
        "Explore must focus its material heading",
      );
      assert.equal(await explore.getAttribute("aria-pressed"), "true");
      assert.equal(
        await experience.getAttribute("data-label-visible"),
        "false",
      );
      assert.equal(
        await page.locator("[data-label-card]").getAttribute("inert"),
        "",
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Add to cart", exact: true })
          .count(),
        0,
      );
      assert.equal(await page.getByRole("radio").count(), 0);
      await expectPowder(page.locator("[data-renderer]"));
      const barista = choices.getByRole("button", {
        name: "Select Barista Matcha",
        exact: true,
      });
      await barista.click();
      assert.equal(await barista.getAttribute("aria-pressed"), "true");
      await explorer
        .getByRole("heading", { name: "Barista Matcha", exact: true })
        .waitFor();
      await modes
        .getByRole("button", { name: "Specifications", exact: true })
        .click();
      const specifications = page.locator(
        '[data-homepage-view-panel="specifications"]',
      );
      assert.equal(
        await specifications.locator("button[data-specification]").count(),
        7,
      );
      const umami = specifications.getByRole("button", {
        name: "Umami: Balanced. Read explanation",
        exact: true,
      });
      assert.equal(await umami.isVisible(), true);
      await umami.click();
      const dialog = specifications.getByRole("dialog");
      await dialog.waitFor();
      assert.match(
        await dialog.textContent(),
        /Savoury depth gives the profile a centre/,
      );
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      await assertFocused(
        umami,
        "Closing a specification must restore its property control",
      );
      await explore.click();
      assert.equal(page.url(), originalURL);
      await explorer
        .getByRole("button", { name: "Shop this matcha", exact: true })
        .click();
      await assertFocused(
        page.getByRole("heading", {
          name: "Format & quantity.",
          exact: true,
        }),
        "Shop this matcha must continue directly to quantity",
      );
      assert.equal(await shop.getAttribute("aria-pressed"), "true");
      assert.equal(await experience.getAttribute("data-step"), "1");
      assert.equal(await experience.getAttribute("data-label-visible"), "true");
      await assertCardField(page, "name", "Barista Matcha");
      await assertCardField(page, "reference", "Studio 31");
      await assertCardField(page, "quantity", "01");
      await page
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await explore.click();
      await barista.click();
      await explorer
        .getByRole("button", { name: "Shop this matcha", exact: true })
        .click();
      assert.equal(
        await page.getByLabel("Quantity", { exact: true }).textContent(),
        "02",
      );
      await assertCardField(page, "reference", "Studio 31");
      assert.equal(page.url(), originalURL);
      assert.equal(state.actions.length, 0);
      await assertNoOverflow(page);
      assertHealthy(state);
    } finally {
      await context.close();
    }
  },
]);

cases.push([
  "concept 02: two builder steps retain powder and write choices onto the label card",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      reducedMotion: "reduce",
      catalogProducts: productStories,
    });
    try {
      await page.goto(`${baseURL}/concept-02`, { waitUntil: "networkidle" });
      const trigger = page.getByRole("button", {
        name: /^Explore with the interactive builder/,
      });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const main = page.locator("main[data-mode]");
      assert.equal(await main.getAttribute("data-mode"), "builder");
      const steps = page.getByRole("navigation", { name: "Builder steps" });
      assert.equal(
        await steps.getByRole("button").count(),
        2,
        "Only Matcha and Quantity are essential steps",
      );
      await assertFocused(
        page.getByRole("heading", { name: "Choose your matcha." }),
        "Builder entry must focus its heading",
      );
      const { scene } = await expectWebgl(page);
      await expectPowder(scene);
      assert.equal(await scene.getAttribute("data-stage"), "powder");
      await page.getByRole("radio", { name: /Barista Matcha/i }).check();
      await eventually(
        () => main.getAttribute("data-pose").then((value) => value === "1"),
        "Product choice must change the material pose",
      );
      assert.match(
        await scene.getAttribute("aria-label"),
        /Barista Matcha powder, formed from its material photograph/,
      );
      assert.ok(
        decodeURIComponent(
          await scene.locator("img").getAttribute("src"),
        ).includes("/images/matcha/latte.jpg"),
        "The powder stage must use the selected material photograph",
      );
      assert.equal(
        await page.getByRole("button", { name: /^OPEN BAG/ }).count(),
        0,
      );
      assert.equal(
        await page.locator("[data-material-profile]:visible").count(),
        0,
      );
      await page
        .getByRole("button", { name: /^Continue to quantity/ })
        .press("Enter");
      assert.equal(await main.getAttribute("data-step"), "1");
      await expectPowder(scene);
      assert.match(
        await scene.getAttribute("aria-label"),
        /Barista Matcha powder/,
        "The purchasing stage must keep the selected powder visible",
      );
      await assertCardField(page, "name", "Barista Matcha");
      await assertCardField(page, "application", /lattes/i);
      await assertCardField(page, "format", "1 kg");
      await assertCardField(page, "quantity", "01");
      await assertFocused(
        page.getByRole("heading", { name: "How much would you like?" }),
        "Quantity must focus its heading",
      );
      assert.equal(
        await page.getByRole("button", { name: "1 kg", exact: true }).count(),
        0,
      );
      assert.match(
        await page
          .getByRole("group", { name: "Format", exact: true })
          .textContent(),
        /1 kg/,
      );
      assert.equal(
        await page.getByRole("textbox", { name: /Your reference/i }).count(),
        0,
        "Label customization must be optional, not part of the purchase form",
      );
      assert.equal(
        await page.getByRole("button", { name: /^Add to cart/ }).isEnabled(),
        true,
        "Quantity must be sufficient to purchase without customizing a label",
      );
      await page
        .getByRole("button", { name: "Increase quantity", exact: true })
        .press("Enter");
      assert.equal(
        await page.getByLabel("Quantity", { exact: true }).textContent(),
        "02",
      );
      await assertCardField(page, "quantity", "02");
      await page
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await assertCardField(page, "quantity", "03");
      await expectPowder(scene);
      await page
        .getByRole("button", { name: /^Add reference Personalize/ })
        .click();
      assert.equal(await main.getAttribute("data-step"), "2");
      await page.getByRole("heading", { name: "Make it yours." }).waitFor();
      await assertFocused(
        page.getByRole("textbox", { name: "Your reference", exact: true }),
        "Optional reference entry must focus the typing field",
      );
      const card = page.locator("[data-label-card]");
      const beforeLabel = await card.screenshot();
      const label = page.getByRole("textbox", { name: /Your reference/i });
      assert.equal(await label.getAttribute("maxlength"), "32");
      await label.fill("STUDIO 01");
      await assertCardField(page, "reference", "STUDIO 01");
      assert.equal(
        beforeLabel.equals(await card.screenshot()),
        false,
        "The reference must change the rendered label",
      );
      await page.getByRole("button", { name: "Done", exact: true }).click();
      assert.equal(await main.getAttribute("data-mode"), "builder");
      assert.equal(await main.getAttribute("data-step"), "1");
      await assertFocused(
        page.getByRole("button", { name: /^Edit reference Personalize/ }),
        "Done must restore the optional reference action in the quantity step",
      );
      const modes = page.getByRole("group", { name: "Shopping mode" });
      await modes
        .getByRole("button", { name: "Standard selection", exact: true })
        .click();
      assert.equal(
        await page.getByLabel("Quantity", { exact: true }).textContent(),
        "3",
      );
      await page
        .getByRole("button", { name: /^Edit reference Personalize/ })
        .click();
      assert.equal(await main.getAttribute("data-mode"), "standard");
      assert.equal(await label.inputValue(), "STUDIO 01");
      await page.getByRole("button", { name: "Done", exact: true }).click();
      await assertFocused(
        page.getByRole("button", { name: /^Edit reference Personalize/ }),
        "Standard selection must retain its reference editor and return action",
      );
      await modes
        .getByRole("button", { name: "Interactive builder", exact: true })
        .click();
      await page
        .getByRole("button", { name: /^Edit reference Personalize/ })
        .click();
      assert.equal(await label.inputValue(), "STUDIO 01");
      await assertCardField(page, "reference", "STUDIO 01");
      await assertCardField(page, "quantity", "03");
      await page.getByRole("button", { name: "Done", exact: true }).click();
      await page.getByRole("button", { name: /^Add to cart/ }).click();
      const cart = page.getByRole("dialog", { name: /Your selection/ });
      await cart.waitFor();
      assert.deepEqual(
        Object.keys(state.actions[0]).sort(),
        ["action", "productHandle", "quantity", "variantKey"],
        "Optional label text must not be sent as a printing instruction",
      );
      assert.equal(state.actions[0].quantity, 3);
      await page.keyboard.press("Escape");
      await cart.waitFor({ state: "hidden" });
      await builderStep(page, "Matcha");
      await page.getByRole("radio", { name: /Culinary Matcha/i }).check();
      await builderStep(page, "Quantity");
      await page.getByRole("button", { name: "5 × 1 kg", exact: true }).click();
      assert.equal(
        await page.getByLabel("Quantity", { exact: true }).textContent(),
        "05",
      );
      await assertCardField(page, "name", "Culinary Matcha");
      await assertCardField(page, "format", "5 × 1 kg");
      await assertCardField(page, "quantity", "05");
      assert.equal(
        await page
          .getByRole("button", { name: "Decrease quantity", exact: true })
          .isDisabled(),
        true,
      );
      await page
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      assert.equal(
        await page.getByLabel("Quantity", { exact: true }).textContent(),
        "10",
      );
      await assertCardField(page, "quantity", "10");
      await page
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      assert.equal(
        await page
          .getByRole("button", { name: "Increase quantity", exact: true })
          .isDisabled(),
        true,
      );
      await assertCardField(page, "quantity", "15");
      await expectPowder(scene);
      assert.equal(
        await page
          .getByRole("button", { name: /^OPEN (?:BAG|VESSEL)/ })
          .count(),
        0,
      );
      await builderStep(page, "Matcha");
      await page.getByRole("radio", { name: /Ceremonial Matcha/i }).check();
      await builderStep(page, "Quantity");
      assert.equal(
        await page
          .getByRole("button", { name: /^Currently unavailable/ })
          .isDisabled(),
        true,
      );
      await page.keyboard.press("Escape");
      await assertFocused(
        trigger,
        "Closing the builder must restore the secondary entry focus",
      );
      assertHealthy(state);
    } finally {
      await context.close();
    }
  },
]);

for (const [tone, width, reducedMotion] of [
  ["dark", 1440, "no-preference"],
  ["light", 1024, "reduce"],
]) {
  const path = "/";
  cases.push([
    `label reference ${tone}: Shop, card and caption entry preserve selection and restore focus`,
    async (browser) => {
      const { context, page, state } = await setup(browser, {
        initialTheme: tone,
        viewport: { width, height: width === 1440 ? 900 : 844 },
        hasTouch: width < 700,
        reducedMotion,
        catalogProducts: productStories,
      });
      try {
        await openStorySelection(page, path);
        await page.locator('main[data-handoff="complete"]').waitFor();
        const experience = page.locator('[data-embedded="true"][data-mode]');
        const card = page.locator("[data-label-card]");
        const position = () =>
          card.evaluate((element) => ({
            x: Number(element.dataset.x),
            y: Number(element.dataset.y),
          }));
        await page
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        const stepBefore = await experience.getAttribute("data-step");
        const addReference = page.getByRole("button", {
          name: "Add label reference",
          exact: true,
        });
        await addReference.scrollIntoViewIfNeeded();
        await assertWithinViewport(
          addReference,
          "Shop must visibly offer label personalization",
        );
        assert.ok((await addReference.boundingBox()).height >= 44);
        await addReference.click();
        await page.getByRole("heading", { name: "Make it yours." }).waitFor();
        assert.equal(await experience.getAttribute("data-mode"), "builder");
        assert.equal(await experience.getAttribute("data-step"), "2");
        const reference = page.getByRole("textbox", {
          name: "Your reference",
          exact: true,
        });
        await assertFocused(
          reference,
          "Opening personalization must focus input",
        );
        await assertWithinViewport(
          reference,
          "The editor must remain reachable",
        );
        assert.equal(await reference.getAttribute("maxlength"), "32");
        assert.ok(await reference.getAttribute("aria-describedby"));
        const clear = page.getByRole("button", {
          name: "Clear text",
          exact: true,
        });
        assert.ok(await clear.isDisabled());
        await reference.fill("Studio 01");
        await page.keyboard.press("End");
        await page.keyboard.type(
          " · a personalised reference beyond the limit",
        );
        assert.equal((await reference.inputValue()).length, 32);
        assert.match(await reference.inputValue(), /^Studio 01/);
        await clear.click();
        assert.equal(await reference.inputValue(), "");
        assert.ok(await clear.isDisabled());
        await assertFocused(reference, "Clear text must return focus to input");
        await assertCardField(page, "reference", "—");
        await reference.fill("Studio 01");
        await assertCardField(page, "reference", "Studio 01");
        await assertPrintedField(page, "reference", "Studio 01", reducedMotion);
        await assertReferenceFont(page);
        await reference.press("Enter");
        assert.equal(
          await experience.getAttribute("data-editing-reference"),
          "false",
        );
        assert.equal(await experience.getAttribute("data-mode"), "builder");
        assert.equal(await experience.getAttribute("data-step"), stepBefore);
        assert.equal(
          await page.getByLabel("Quantity", { exact: true }).textContent(),
          "02",
        );
        await assertFocused(
          page.getByRole("button", {
            name: "Edit label reference",
            exact: true,
          }),
          "Done must restore the remounted reference action in Shop",
        );

        const cardReference = page.getByRole("button", {
          name: "Edit reference on label",
          exact: true,
        });
        const resting = await position();
        await cardReference.focus();
        await page.keyboard.press("ArrowRight");
        assert.deepEqual(
          await position(),
          resting,
          "Arrow keys on the reference button must not drag its parent card",
        );
        await card.evaluate((element) => {
          window.__referenceDragStates = [];
          window.__referenceDragObserver = new MutationObserver((records) => {
            for (const record of records)
              window.__referenceDragStates.push(
                record.oldValue,
                element.dataset.dragging,
              );
          });
          window.__referenceDragObserver.observe(element, {
            attributes: true,
            attributeFilter: ["data-dragging"],
            attributeOldValue: true,
          });
        });
        await cardReference.click();
        await assertFocused(
          reference,
          "Clicking the printed reference must open its editor",
        );
        const dragStates = await page.evaluate(() => {
          window.__referenceDragObserver.disconnect();
          return window.__referenceDragStates;
        });
        assert.equal(dragStates.includes("true"), false);
        assert.equal(await card.getAttribute("data-dragging"), "false");
        assert.deepEqual(await position(), resting);
        assert.equal(await reference.inputValue(), "Studio 01");
        await reference.fill("Studio 02");
        await page.getByRole("button", { name: "Done", exact: true }).click();
        await assertFocused(
          cardReference,
          "Done must restore the card reference control",
        );
        await assertCardField(page, "reference", "Studio 02");

        const caption = page.getByRole("button", {
          name: "Edit label reference",
          exact: true,
        });
        await caption.click();
        await assertFocused(
          reference,
          "The caption must open the same reference editor",
        );
        assert.equal(await reference.inputValue(), "Studio 02");
        await page
          .getByRole("button", { name: "Done editing reference", exact: true })
          .click();
        await assertFocused(
          caption,
          "Caption dismissal must return focus to its trigger",
        );
        assert.equal(await experience.getAttribute("data-mode"), "builder");
        assert.equal(
          await page.getByLabel("Quantity", { exact: true }).textContent(),
          "02",
        );
        assert.equal(
          state.actions.length,
          0,
          "Personalization is a local preview",
        );
        await assertNoOverflow(page);
        assertHealthy(state);
      } finally {
        await context.close();
      }
    },
  ]);
}

for (const [tone, width, reducedMotion] of [
  ["dark", 1440, "no-preference"],
  ["light", 1024, "reduce"],
]) {
  const path = "/";
  cases.push([
    `label card ${tone}: drag and keyboard movement persist while the latest selection writes its details`,
    async (browser) => {
      const { context, page, state } = await setup(browser, {
        initialTheme: tone,
        viewport: { width, height: width === 1440 ? 900 : 844 },
        hasTouch: width !== 1440,
        reducedMotion,
        catalogProducts: productStories,
      });
      try {
        await openStorySelection(page, path);
        const { scene } = await expectWebgl(page);
        await expectPowder(scene);
        const card = page.locator("[data-label-card]");
        const move = page.getByRole("group", {
          name: "Move label card",
          exact: true,
        });
        await move.waitFor();
        await assertCardField(page, "name", "Culinary Matcha");
        await assertCardField(page, "quantity", "01");
        await assertCardField(page, "reference", "—");
        const position = () =>
          card.evaluate((element) => ({
            x: Number(element.dataset.x),
            y: Number(element.dataset.y),
          }));
        assert.deepEqual(await position(), { x: 0, y: 0 });
        await move.scrollIntoViewIfNeeded();
        const bounds = await move.boundingBox();
        const dragX = bounds.x + bounds.width / 2;
        const dragY = bounds.y + Math.min(30, bounds.height / 2);
        if (width !== 1440) {
          const input = await context.newCDPSession(page);
          await input.send("Input.dispatchTouchEvent", {
            type: "touchStart",
            touchPoints: [{ x: dragX, y: dragY }],
          });
          for (let step = 1; step <= 8; step++)
            await input.send("Input.dispatchTouchEvent", {
              type: "touchMove",
              touchPoints: [
                { x: dragX - (36 * step) / 8, y: dragY - (24 * step) / 8 },
              ],
            });
          await input.send("Input.dispatchTouchEvent", {
            type: "touchEnd",
            touchPoints: [],
          });
          await input.detach();
        } else {
          await page.mouse.move(dragX, dragY);
          await page.mouse.down();
          await page.mouse.move(dragX - 36, dragY - 24, { steps: 8 });
          await page.mouse.up();
        }
        await eventually(async () => {
          const moved = await position();
          return (
            moved.x < -10 && (width === 1440 ? moved.y < -8 : moved.y <= 0)
          );
        }, "Dragging must reposition the label card within the material stage");
        let previousPosition;
        let settledFrames = 0;
        await eventually(async () => {
          const current = await position();
          settledFrames =
            previousPosition?.x === current.x &&
            previousPosition?.y === current.y
              ? settledFrames + 1
              : 0;
          previousPosition = current;
          return settledFrames >= 5;
        }, "The weighted drag must settle before checking retained placement");
        const dragged = await position();
        assert.equal(await card.getAttribute("data-dragging"), "false");

        await builderStep(page, "Matcha");
        for (const name of [
          "Barista Matcha",
          "Culinary Matcha",
          "Ceremonial Matcha",
          "Barista Matcha",
        ])
          await chooseMatcha(page, name);
        await assertCardField(page, "name", "Barista Matcha");
        await assertPrintedField(page, "name", "Barista Matcha", reducedMotion);
        await assertCardField(page, "application", /lattes/i);
        await assertCardField(page, "format", "1 kg");
        assert.deepEqual(
          await position(),
          dragged,
          "Product changes must preserve the visitor's card placement",
        );
        await builderStep(page, "Quantity");
        await page
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        await assertCardField(page, "quantity", "02");
        await page
          .getByRole("button", { name: "Overview", exact: true })
          .click();
        await page.getByRole("button", { name: "Shop", exact: true }).click();
        await builderStep(page, "Quantity");
        assert.deepEqual(
          await position(),
          dragged,
          "Changing shopping mode must preserve the card placement",
        );
        await assertCardField(page, "quantity", "02");
        await assertFocused(
          page.getByRole("heading", { name: "Format & quantity." }),
          "The completed quantity step must focus its heading before the visitor focuses the card",
        );
        await move.focus();
        await page.keyboard.press("ArrowRight");
        await eventually(
          async () => Math.abs((await position()).x - (dragged.x + 12)) < 1,
          "Arrow keys must move the focused card by the documented increment",
        );
        await page.keyboard.press("ArrowDown");
        const hasVerticalRoom = await card.evaluate((element) => {
          const stage = element
            .closest("[data-label-bounds]")
            .getBoundingClientRect();
          return stage.height - element.getBoundingClientRect().height >= 16;
        });
        if (hasVerticalRoom)
          await eventually(
            async () => Math.abs((await position()).y - (dragged.y + 12)) < 1,
            "Vertical arrow keys must move the focused card when the stage has room",
          );
        else
          assert.equal(
            (await position()).y,
            0,
            "A compact card must clamp vertical movement when the stage has no spare height",
          );
        await page.keyboard.press("Home");
        await eventually(async () => {
          const reset = await position();
          return reset.x === 0 && reset.y === 0;
        }, "Home must restore the card's resting position");
        await page.keyboard.press("ArrowLeft");
        await page
          .getByRole("button", { name: "Reset label position", exact: true })
          .click();
        await eventually(async () => {
          const reset = await position();
          return reset.x === 0 && reset.y === 0;
        }, "Reset must return the card to its resting position");
        await page
          .getByRole("button", { name: "Add label reference", exact: true })
          .click();
        const reference = page.getByRole("textbox", {
          name: /Your reference/i,
        });
        await reference.fill("FIRST DRAFT");
        await reference.fill("LATEST REFERENCE");
        await assertCardField(page, "reference", "LATEST REFERENCE");
        await assertPrintedField(
          page,
          "reference",
          "LATEST REFERENCE",
          reducedMotion,
        );
        await expectPowder(scene);

        await assertCardField(page, "reference", "LATEST REFERENCE");
        await assertCardField(page, "name", "Barista Matcha");
        assert.equal(
          await page
            .getByRole("button", { name: /^OPEN (?:BAG|VESSEL)/ })
            .count(),
          0,
        );
        await page.getByRole("button", { name: "Done", exact: true }).click();
        await assertCardField(page, "reference", "LATEST REFERENCE");
        await assertSelectionControlReachable(
          page,
          page.getByRole("button", { name: /^Add to cart/ }),
          "Moving the label card must preserve the purchase control",
        );
        await assertNoOverflow(page);
        await captureReview(page, `label-card-${tone}-${width}.png`);
        assert.equal(state.actions.length, 0);
        assertHealthy(state);
      } finally {
        await context.close();
      }
    },
  ]);
}

for (const [tone, width, reducedMotion] of [
  ["dark", 1440, "no-preference"],
  ["light", 1024, "reduce"],
]) {
  const path = "/";
  cases.push([
    `appearance ${tone}: the switch preserves URL, history, selection and the live label`,
    async (browser) => {
      const themeProducts = productStories.map((product, index) =>
        index === 1
          ? {
              ...product,
              variants: [
                ...product.variants,
                variant("e", "5 × 1 kg", 12000, {
                  minimum: 5,
                  maximum: 15,
                  increment: 5,
                }),
              ],
            }
          : product,
      );
      const { context, page, state } = await setup(browser, {
        initialTheme: tone,
        viewport: { width, height: width === 1440 ? 900 : 844 },
        reducedMotion,
        catalogProducts: themeProducts,
      });
      let releaseMutation;
      try {
        await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });
        await heroExplore(page).click();
        await selectHomeShop(page);
        await chooseMatcha(page, "Barista Matcha");
        await page
          .getByRole("button", { name: "5 × 1 kg", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Add label reference", exact: true })
          .click();
        await assertFocused(
          page.getByRole("textbox", { name: "Your reference", exact: true }),
          "Label editing must finish navigation before moving the card",
        );
        await page
          .getByRole("textbox", { name: /Your reference/i })
          .fill("LAB STUDY 42");
        const move = page.getByRole("group", {
          name: "Move label card",
          exact: true,
        });
        await move.focus();
        await page.keyboard.press("ArrowLeft");
        await page.locator('main[data-handoff="complete"]').waitFor();
        await eventually(
          () =>
            page
              .locator("[data-label-card]")
              .getAttribute("data-x")
              .then((value) => Number(value) < 0),
          "The label must have a non-default position before appearance changes",
        );
        const catalogReads = state.catalogReads;
        await page.evaluate(() => {
          const card = document.querySelector("[data-label-card]");
          window.__themeContinuity = {
            card,
            scene: document.querySelector("[data-renderer]"),
            x: card.dataset.x,
            y: card.dataset.y,
            handoff: [],
          };
          new MutationObserver(() => {
            window.__themeContinuity.handoff.push(
              document.querySelector('main[data-concept="01"]').dataset.handoff,
            );
          }).observe(document.querySelector('main[data-concept="01"]'), {
            attributes: true,
            attributeFilter: ["data-handoff"],
          });
        });
        const initialTone = tone;
        const otherTone = initialTone === "dark" ? "light" : "dark";
        const themeSwitch = page.getByRole("switch", {
          name: "Dark mode",
          exact: true,
        });
        const originalURL = page.url();
        const historyLength = await page.evaluate(() => window.history.length);
        async function assertSelection(tone, mode = "builder", editing = true) {
          await page.locator(`main[data-tone="${tone}"]`).waitFor();
          assert.equal(page.url(), originalURL);
          assert.equal(
            await page.evaluate(() => window.history.length),
            historyLength,
          );
          const experience = page.locator('[data-embedded="true"][data-mode]');
          assert.equal(await experience.getAttribute("data-tone"), tone);
          assert.equal(await experience.getAttribute("data-mode"), mode);
          assert.equal(
            await experience.getAttribute("data-label-visible"),
            String(mode === "builder"),
          );
          assert.equal(
            await experience.getAttribute("data-step"),
            editing ? "2" : "1",
          );
          assert.equal(
            await experience.getAttribute("data-editing-reference"),
            String(editing),
          );
          assert.equal(
            await themeSwitch.getAttribute("aria-checked"),
            String(tone === "dark"),
          );
          await assertCardField(page, "name", "Barista Matcha");
          await assertCardField(page, "format", "5 × 1 kg");
          await assertCardField(page, "quantity", "10");
          await assertCardField(page, "reference", "LAB STUDY 42");
          assert.equal(
            await page.locator("[data-renderer]").getAttribute("data-tone"),
            tone,
          );
          assert.deepEqual(
            await page.evaluate(() => {
              const saved = window.__themeContinuity;
              const card = document.querySelector("[data-label-card]");
              return {
                sameCard: card === saved.card,
                sameScene:
                  document.querySelector("[data-renderer]") === saved.scene,
                samePosition:
                  card.dataset.x === saved.x && card.dataset.y === saved.y,
                handoff: saved.handoff,
                phase: document.querySelector('main[data-concept="01"]').dataset
                  .handoff,
              };
            }),
            {
              sameCard: true,
              sameScene: true,
              samePosition: true,
              handoff: [],
              phase: "complete",
            },
          );
          assert.equal(
            state.catalogReads,
            catalogReads,
            "Appearance cannot reload selection",
          );
        }
        await assertSelection(initialTone);
        assert.equal(
          await themeSwitch.evaluate((element) => element.tagName),
          "BUTTON",
        );
        await themeSwitch.click();
        await assertSelection(otherTone);
        await themeSwitch.click();
        await assertSelection(initialTone);
        await themeSwitch.click();
        await assertSelection(otherTone);
        await page
          .getByRole("button", { name: "Overview", exact: true })
          .click();
        await themeSwitch.focus();
        await page.keyboard.press("Enter");
        await assertSelection(initialTone, "overview", false);
        await page.getByRole("button", { name: "Shop", exact: true }).click();
        await page
          .getByRole("button", { name: "Edit label reference", exact: true })
          .click();
        assert.equal(
          await page
            .getByRole("textbox", { name: /Your reference/i })
            .inputValue(),
          "LAB STUDY 42",
        );
        await captureReview(page, `appearance-preserved-${width}.png`);
        assert.equal(state.actions.length, 0);
        await page.getByRole("button", { name: "Done", exact: true }).click();
        state.nextMutationGate = new Promise((resolve) => {
          releaseMutation = resolve;
        });
        await page
          .getByRole("button", { name: "Add to cart", exact: true })
          .click();
        await eventually(
          () => state.actions.length === 1,
          "The mocked purchase must be pending before changing appearance",
        );
        assert.equal(await themeSwitch.isEnabled(), true);
        await themeSwitch.click();
        await assertSelection(otherTone, "builder", false);
        assert.deepEqual(state.actions, [
          {
            action: "add",
            productHandle: themeProducts[1].handle,
            variantKey: themeProducts[1].variants[1].id,
            quantity: 10,
          },
        ]);
        releaseMutation();
        const cart = page.getByRole("dialog", { name: /Your selection/ });
        await cart.waitFor();
        await page.keyboard.press("Escape");
        await cart.waitFor({ state: "hidden" });
        await assertSelection(otherTone, "builder", false);
        await assertNoOverflow(page);
        assertHealthy(state);
      } finally {
        releaseMutation?.();
        await context.close();
      }
    },
  ]);
}

cases.push([
  "canister backup: original rendered packaging retains selection, reveal and cart behavior",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
      catalogProducts: productStories,
    });
    try {
      const path = "/concept-02/canister";
      await openStorySelection(page, path);
      assert.equal(new URL(page.url()).pathname, path);
      const { scene } = await expectWebgl(page);
      assert.equal(await scene.getAttribute("data-stage"), "vessel");
      assert.match(
        await scene.getAttribute("aria-label"),
        /Culinary Matcha in an aluminum vessel with a printed specification label/,
        "The backup route must preserve the original canister scene",
      );
      assert.equal(
        await page.getByRole("button", { name: /^OPEN BAG/ }).count(),
        0,
      );
      await page.getByRole("radio", { name: /Barista Matcha/i }).check();
      await page
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      assert.equal(
        await page.getByLabel("Quantity", { exact: true }).textContent(),
        "2",
      );
      await eventually(
        () =>
          page
            .locator("main[data-multiple]")
            .getAttribute("data-multiple")
            .then((value) => value === "true"),
        "The backup must retain quantity-driven packaging",
      );
      await page.getByRole("button", { name: /^OPEN VESSEL/ }).click();
      assert.match(
        await scene.getAttribute("aria-label"),
        /Barista Matcha.*open to reveal the matcha inside/,
      );
      await page.getByRole("button", { name: /^CLOSE VESSEL/ }).click();
      assert.doesNotMatch(
        await scene.getAttribute("aria-label"),
        /open to reveal/,
      );
      await assertWithinViewport(
        page.getByRole("button", { name: /^Add to cart/ }),
        "The retained canister concept must keep its purchase action available",
      );
      await assertSelectionScrollPolicy(page, path);
      await assertNoOverflow(page);
      await captureReview(page, "canister-backup-1440.png");
      await page.getByRole("button", { name: /^Add to cart/ }).click();
      await page.getByRole("dialog", { name: /Your selection/ }).waitFor();
      assert.equal(state.actions.length, 1);
      assert.deepEqual(state.actions[0], {
        action: "add",
        productHandle: productStories[1].handle,
        variantKey: productStories[1].variants[0].id,
        quantity: 2,
      });
      assert.equal(state.lines[0].quantity, 2);
      assert.equal(new URL(page.url()).pathname, path);
      assertHealthy(state);
    } finally {
      await context.close();
    }
  },
]);

for (const width of [1440, 320, 390]) {
  cases.push([
    `concept 02 ${width}px: standard selection and builder preserve product, format and quantity`,
    async (browser) => {
      const { context, page, state } = await setup(browser, {
        viewport: { width, height: width === 1440 ? 900 : 844 },
        reducedMotion: "reduce",
        catalogProducts: productStories,
      });
      try {
        await openStorySelection(page);
        await page.getByRole("radio", { name: /Barista Matcha/i }).check();
        await page
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        assert.equal(
          await page.getByLabel("Quantity", { exact: true }).textContent(),
          "2",
        );
        const modes = page.getByRole("group", { name: "Shopping mode" });
        await modes
          .getByRole("button", { name: "Interactive builder", exact: true })
          .click();
        assert.equal(
          await page
            .getByRole("radio", { name: /Barista Matcha/i })
            .isChecked(),
          true,
        );
        await builderStep(page, "Quantity");
        assert.equal(
          await page.getByLabel("Quantity", { exact: true }).textContent(),
          "02",
        );
        await expectWebgl(page);
        if (width < 700) await expectVisibleStage(page);
        await modes
          .getByRole("button", { name: "Standard selection", exact: true })
          .click();
        assert.equal(
          await page.getByLabel("Quantity", { exact: true }).textContent(),
          "2",
        );
        await page.getByRole("radio", { name: /Culinary Matcha/i }).check();
        await page
          .getByRole("button", { name: "5 × 1 kg", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        assert.equal(
          await page.getByLabel("Quantity", { exact: true }).textContent(),
          "10",
        );
        await modes
          .getByRole("button", { name: "Interactive builder", exact: true })
          .click();
        assert.equal(
          await page.getByLabel("Quantity", { exact: true }).textContent(),
          "10",
        );
        assert.equal(
          await page
            .getByRole("button", { name: "5 × 1 kg", exact: true })
            .getAttribute("aria-pressed"),
          "true",
        );
        await modes
          .getByRole("button", { name: "Standard selection", exact: true })
          .click();
        assert.equal(
          await page
            .getByRole("radio", { name: /Culinary Matcha/i })
            .isChecked(),
          true,
        );
        assert.equal(
          await page
            .getByRole("button", { name: "5 × 1 kg", exact: true })
            .getAttribute("aria-pressed"),
          "true",
        );
        await assertNoOverflow(page);
        await assertSelectionScrollPolicy(page, "/concept-02");
        await page
          .getByRole("button", { name: "Back to overview", exact: true })
          .click();
        await assertFocused(
          primaryEntry(page, "/concept-02"),
          "Closing selection must restore the primary entry focus",
        );
        assertHealthy(state);
      } finally {
        await context.close();
      }
    },
  ]);
}

for (const [path, width, tone] of [
  ["/", 1440, "dark"],
  ["/", 390, "light"],
  ["/concept-02", 320, "light"],
]) {
  cases.push([
    `information ${width}px ${path} ${tone}: optional native drawer retains purchase state and restores keyboard focus`,
    async (browser) => {
      const { context, page, state } = await setup(browser, {
        initialTheme: tone,
        viewport: { width, height: width === 1440 ? 900 : 844 },
        reducedMotion: "reduce",
        catalogProducts: productStories,
      });
      try {
        await openStorySelection(page, path);
        await page
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        const trigger = page.getByRole("button", { name: /^Material & use/ });
        await trigger.focus();
        await page.keyboard.press("Enter");
        const dialog = page.getByRole("dialog", {
          name: "Culinary Matcha",
          exact: true,
        });
        await dialog.waitFor();
        const close = dialog.getByRole("button", {
          name: /^Back to selection/,
        });
        await assertFocused(close, "Information must focus its return control");
        await page.keyboard.press("Tab");
        await assertFocused(
          dialog.getByRole("button", { name: /^Aroma/ }),
          "Tab must stay inside the material drawer",
        );
        await page.keyboard.press("Shift+Tab");
        await assertFocused(
          close,
          "Reverse tab must return to the close control",
        );
        await page.keyboard.press("Shift+Tab");
        await assertFocused(
          dialog.locator("summary"),
          "Reverse tab at the start must wrap inside the modal",
        );
        await assertMaterialProperties(
          dialog.locator("[data-material-profile]"),
        );
        await dialog.getByRole("button", { name: /^Umami/ }).click();
        assert.match(
          await dialog
            .locator('[data-material-profile] [aria-live="polite"]')
            .textContent(),
          /supporting role/,
        );
        const details = dialog.locator("details");
        assert.equal(
          await details.getAttribute("open"),
          null,
          "Preparation should remain an optional disclosure",
        );
        await dialog.locator("summary").click();
        assert.match(await details.textContent(), /cooking and cooling/);
        assert.match(await details.textContent(), /finished recipe/);
        await assertNoOverflow(page);
        await captureReview(
          page,
          `information-${path === "/" ? tone : path.slice(1)}-${width}.png`,
        );
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden" });
        await assertFocused(
          trigger,
          "Information Escape must restore its trigger",
        );
        assert.equal(
          await page
            .locator("main[data-exploring]")
            .getAttribute("data-exploring"),
          "true",
          "Information Escape must not also close the product selection",
        );
        assert.equal(
          await page.getByLabel("Quantity", { exact: true }).textContent(),
          path === "/concept-02" ? "2" : "02",
        );
        if (path === "/concept-02")
          assert.equal(
            await page
              .getByRole("radio", { name: /Culinary Matcha/i })
              .isChecked(),
            true,
          );
        else {
          await assertCardField(page, "name", "Culinary Matcha");
          assert.equal(
            await page
              .locator('[data-embedded="true"]')
              .getAttribute("data-pose"),
            "0",
          );
        }
        await trigger.click();
        await close.click();
        await assertFocused(
          trigger,
          "Back to selection must restore its trigger",
        );
        assert.equal(
          await page.getByLabel("Quantity", { exact: true }).textContent(),
          path === "/concept-02" ? "2" : "02",
        );
        assert.equal(
          state.actions.length,
          0,
          "Reading material information must not mutate a cart",
        );
        await page.getByRole("button", { name: /^Add to cart/ }).click();
        await page.getByRole("dialog", { name: /Your selection/ }).waitFor();
        assert.equal(
          state.actions[0].quantity,
          2,
          "Buying after information must use the preserved quantity",
        );
        assertHealthy(state);
      } finally {
        await context.close();
      }
    },
  ]);
}

cases.push([
  "information: material comparison and application guidance follow products and responsive resizing",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      reducedMotion: "reduce",
      catalogProducts: productStories,
    });
    try {
      await openStorySelection(page);
      const trigger = page.getByRole("button", { name: /^Material & use/ });
      for (const [width, name, umami, explanation, preparation] of [
        [
          1440,
          "Culinary Matcha",
          "Restrained",
          /supporting role/,
          /cooking and cooling/,
        ],
        [
          390,
          "Barista Matcha",
          "Balanced",
          /Savoury depth gives the profile a centre/,
          /milk and sweetener/,
        ],
        [
          320,
          "Ceremonial Matcha",
          "Full · rounded",
          /more prominent/,
          /water temperature/,
        ],
      ]) {
        await page.setViewportSize({
          width,
          height: width === 1440 ? 900 : 844,
        });
        await page.getByRole("radio", { name: new RegExp(name, "i") }).check();
        await trigger.click();
        const dialog = page.getByRole("dialog", { name, exact: true });
        await dialog.waitFor();
        const profile = dialog.locator("[data-material-profile]");
        await assertMaterialProperties(profile);
        assert.equal(
          await profile
            .getByRole("group", {
              name: "Explore material properties",
              exact: true,
            })
            .count(),
          1,
        );
        const comparison = profile.getByRole("button", {
          name: new RegExp(`^Umami.*${umami}`),
        });
        if (width === 1440) await comparison.click();
        assert.equal(
          await comparison.getAttribute("aria-pressed"),
          "true",
          "Comparison property must persist across product changes and resizing",
        );
        assert.match(
          await profile.locator('[aria-live="polite"]').textContent(),
          explanation,
        );
        const details = dialog.locator("details");
        if ((await details.getAttribute("open")) === null)
          await dialog.locator("summary").click();
        assert.match(await details.textContent(), preparation);
        await page.setViewportSize({
          width: width === 1440 ? 390 : 1440,
          height: 900,
        });
        assert.equal(
          await comparison.getAttribute("aria-pressed"),
          "true",
          "Resizing an open drawer must retain comparison state",
        );
        await assertNoOverflow(page);
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden" });
        assert.equal(
          await page.locator("[data-material-profile]:visible").count(),
          0,
        );
      }
      assert.equal(state.actions.length, 0);
      assertHealthy(state);
    } finally {
      await context.close();
    }
  },
]);

cases.push([
  "cart: rejected add can retry, confirmed add/update/remove, modal keyboard behavior",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      reducedMotion: "reduce",
    });
    try {
      await openHome(page);
      const add = page.getByRole("button", { name: /^Add to cart/ });
      state.nextMutation = "rejected";
      await add.click();
      await page
        .getByRole("alert")
        .filter({ hasText: /couldn’t be updated/ })
        .waitFor();
      assert.equal(state.actions.length, 1);
      assert.equal(state.lines.length, 0);
      await add.click();
      const dialog = page.getByRole("dialog", { name: /Your selection/ });
      await dialog.waitFor();
      assert.equal(
        state.actions.length,
        2,
        "Only the explicit retry may send a second mutation",
      );
      assert.equal(state.lines[0].quantity, 1);
      assert.equal(
        await page
          .getByRole("button", {
            name: "Open cart, 1 item",
            includeHidden: true,
          })
          .count(),
        1,
      );
      await assertFocused(
        dialog.getByRole("button", { name: "Close cart" }),
        "Opening cart must focus Close",
      );
      await page.keyboard.press("Shift+Tab");
      await assertFocused(
        dialog.getByRole("button", { name: /Continue exploring/ }),
        "Shift+Tab must wrap inside the modal",
      );
      await page.keyboard.press("Tab");
      await assertFocused(
        dialog.getByRole("button", { name: "Close cart" }),
        "Tab must wrap inside the modal",
      );
      await dialog
        .getByRole("button", { name: "Increase Matcha One quantity" })
        .click();
      await eventually(
        () => Promise.resolve(state.lines[0].quantity === 2),
        "Cart increment must reach the API",
      );
      await eventually(
        () =>
          dialog
            .getByLabel("Matcha One quantity", { exact: true })
            .textContent()
            .then((value) => value === "2"),
        "Cart must display the confirmed quantity",
      );
      assert.ok(
        (await dialog.textContent()).includes(money(2400)),
        "Cart must display the server-confirmed total",
      );
      assert.equal(
        await dialog
          .getByRole("button", { name: "Checkout", exact: false })
          .isDisabled(),
        true,
      );
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      await assertFocused(add, "Closing cart must return focus to Add to cart");
      assert.equal(
        await page
          .locator('main[data-concept="01"]')
          .getAttribute("data-exploring"),
        "true",
        "Cart Escape must not also close the product selection",
      );
      const cartButton = page.getByRole("button", {
        name: "Open cart, 2 items",
      });
      await cartButton.click();
      await dialog.waitFor();
      await eventually(
        () =>
          dialog.getByRole("button", { name: "Remove Matcha One" }).isEnabled(),
        "Restored cart must finish loading",
      );
      await dialog.getByRole("button", { name: "Remove Matcha One" }).click();
      await dialog.getByText("Your selection starts with matcha.").waitFor();
      assert.equal(state.lines.length, 0);
      assert.equal(
        state.actions.length,
        4,
        "Expected reject, add, update, remove only",
      );
      await page.keyboard.press("Escape");
      await assertFocused(
        page.getByRole("button", { name: "Open cart, 0 items" }),
        "Cart trigger focus must survive count changes",
      );
      assertHealthy(state);
    } finally {
      await context.close();
    }
  },
]);

cases.push([
  "cart: rejected add requiring review blocks every mutation until a fresh read",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      reducedMotion: "reduce",
    });
    try {
      await openHome(page);
      const add = page.getByRole("button", { name: /^Add to cart/ });
      const dialog = page.getByRole("dialog", { name: /Your selection/ });
      await add.click();
      await dialog.waitFor();
      await eventually(
        () =>
          dialog
            .getByLabel("Matcha One quantity", { exact: true })
            .textContent()
            .then((value) => value === "1"),
        "Initial add must establish a confirmed cart line",
      );
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });

      state.nextMutation = "rejected-review";
      const readsBefore = state.reads;
      await add.click();
      await dialog.waitFor();
      await dialog.getByRole("alert").waitFor();
      assert.equal(state.actions.length, 2);
      assert.equal(state.lines[0].quantity, 1);
      assert.equal(
        state.reads,
        readsBefore,
        "A review-required rejection must await an explicit fresh read",
      );
      for (const name of [
        "Increase Matcha One quantity",
        "Remove Matcha One",
      ]) {
        assert.equal(
          await dialog.getByRole("button", { name }).isDisabled(),
          true,
          `${name} must remain blocked until review completes`,
        );
      }
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      await add.click();
      await dialog.waitFor();
      assert.equal(
        state.actions.length,
        2,
        "Another add must open review without retrying the rejected mutation",
      );
      assert.equal(state.reads, readsBefore);

      await dialog.getByRole("button", { name: /Reload selection/ }).click();
      await eventually(
        () =>
          dialog.getByRole("button", { name: "Remove Matcha One" }).isEnabled(),
        "A successful fresh cart read must unlock cart controls",
      );
      assert.equal(state.reads, readsBefore + 1);
      assert.equal(state.actions.length, 2, "Review must never replay a POST");
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      await add.click();
      await dialog.waitFor();
      await eventually(
        () =>
          dialog
            .getByLabel("Matcha One quantity", { exact: true })
            .textContent()
            .then((value) => value === "2"),
        "Only an explicit add after fresh review may mutate the selection",
      );
      assert.equal(state.actions.length, 3);
      assertHealthy(state);
    } finally {
      await context.close();
    }
  },
]);

cases.push([
  "cart: ambiguous accepted write is read before any explicit retry",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      reducedMotion: "reduce",
    });
    try {
      await openHome(page);
      state.nextMutation = "ambiguous";
      const add = page.getByRole("button", { name: /^Add to cart/ });
      await add.click();
      const dialog = page.getByRole("dialog", { name: /Your selection/ });
      await dialog.waitFor();
      await dialog
        .getByRole("alert")
        .filter({ hasText: /couldn’t be confirmed/ })
        .waitFor();
      assert.equal(state.actions.length, 1);
      assert.equal(
        state.lines[0].quantity,
        1,
        "Mock write should have committed before connection failure",
      );
      await page.keyboard.press("Escape");
      await add.click();
      await dialog.waitFor();
      assert.equal(
        state.actions.length,
        1,
        "Another add before reconciliation must not replay the ambiguous write",
      );
      const readsBefore = state.reads;
      await dialog.getByRole("button", { name: /Reload selection/ }).click();
      await eventually(
        () =>
          dialog
            .getByLabel("Matcha One quantity", { exact: true })
            .count()
            .then((count) => count === 1),
        "Reload must reveal authoritative cart contents",
      );
      assert.ok(state.reads > readsBefore, "Reload must read the cart");
      assert.equal(state.actions.length, 1, "Reload must not replay the POST");
      await page.keyboard.press("Escape");
      await add.click();
      await dialog.waitFor();
      await eventually(
        () =>
          dialog
            .getByLabel("Matcha One quantity", { exact: true })
            .textContent()
            .then((value) => value === "2"),
        "An explicit add after review may update the cart",
      );
      assert.equal(state.actions.length, 2);
      assertHealthy(state);
    } finally {
      await context.close();
    }
  },
]);

cases.push([
  "catalog: empty and failed collection remain local and can recover",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      reducedMotion: "reduce",
    });
    try {
      state.catalogMode = "empty";
      await page.goto(baseURL, { waitUntil: "networkidle" });
      await heroExplore(page).click();
      await selectHomeShop(page);
      await page.getByText("The next selection is taking shape.").waitFor();
      const initialCatalogReads = state.catalogReads;
      assert.equal(
        await page.getByRole("button", { name: /^Add to cart/ }).count(),
        0,
      );
      state.catalogMode = "unavailable";
      await page.getByRole("button", { name: /Try again/ }).click();
      await page.getByText("The collection couldn’t be loaded.").waitFor();
      state.catalogMode = "ready";
      await page.getByRole("button", { name: /Try again/ }).click();
      await (await matchaChoice(page, "Matcha One")).waitFor();
      assert.equal(
        state.catalogReads,
        initialCatalogReads + 2,
        "Each explicit retry must make one catalog request",
      );
      assert.equal(state.actions.length, 0);
      assert.equal(new URL(page.url()).pathname, "/");
      assertHealthy(state);
    } finally {
      await context.close();
    }
  },
]);

for (const reducedMotion of ["no-preference", "reduce"]) {
  cases.push([
    `text resolution ${reducedMotion}: full controls, radio focus, stable names and motion preference`,
    async (browser) => {
      const { context, page, state } = await setup(browser, {
        reducedMotion,
      });
      try {
        const readGlyphs = (control) =>
          control.locator("[data-scramble-glyph]").evaluateAll((glyphs) => ({
            actual: glyphs.map((glyph) => glyph.textContent).join(""),
            expected: glyphs
              .map((glyph) => glyph.previousElementSibling.textContent)
              .join(""),
          }));
        const resolved = async (control) => {
          const value = await readGlyphs(control);
          return value.actual === value.expected;
        };
        async function checkControl(
          control,
          { focusTarget = control, verifyFocusRest = false } = {},
        ) {
          await control.scrollIntoViewIfNeeded();
          await page.mouse.move(0, 0);
          await focusTarget.evaluate((element) => element.blur());
          await eventually(() => resolved(control), "Entry text must settle");
          const original = await readGlyphs(control);
          assert.ok(
            original.expected.length,
            "Control must have resolvable text",
          );
          const accessibleContent = async () =>
            (await control.ariaSnapshot()).replace(/ \[active\]/g, "");
          const name = await accessibleContent();
          const before = await control.boundingBox();
          const hoverPosition = {
            x: Math.min(12, before.width / 2),
            y: before.height / 2,
          };
          // Enter through padding, outside the text itself.
          await control.hover({ position: hoverPosition });
          if (reducedMotion === "reduce") {
            await page.waitForTimeout(120);
            assert.ok(await resolved(control));
          } else {
            await eventually(
              async () => !(await resolved(control)),
              "Hovering the control padding must resolve its label",
              1000,
            );
          }
          assert.equal(await accessibleContent(), name);
          const during = await control.boundingBox();
          assert.equal(
            during.width,
            before.width,
            "Glyph changes cannot resize controls",
          );
          await page.mouse.move(0, 0);
          await eventually(
            () => resolved(control),
            "Pointer exit must restore text",
          );
          await focusTarget.focus();
          if (reducedMotion === "reduce") {
            await page.waitForTimeout(120);
            assert.ok(await resolved(control));
          } else {
            await eventually(
              async () => !(await resolved(control)),
              "Native keyboard focus must resolve the same label",
              1000,
            );
          }
          assert.equal(await accessibleContent(), name);
          if (verifyFocusRest && reducedMotion === "no-preference") {
            await eventually(
              () => resolved(control),
              "Focus burst must settle",
            );
            const changedWhileFocused = await control.evaluate(
              (element) =>
                new Promise((resolve) => {
                  let changed = false;
                  const observer = new MutationObserver(() => {
                    changed = true;
                  });
                  element
                    .querySelectorAll("[data-scramble-glyph]")
                    .forEach((glyph) =>
                      observer.observe(glyph, {
                        childList: true,
                        characterData: true,
                        subtree: true,
                      }),
                    );
                  setTimeout(() => {
                    observer.disconnect();
                    resolve(changed);
                  }, 3000);
                }),
            );
            assert.equal(
              changedWhileFocused,
              false,
              "Keyboard focus cannot repeat while reading",
            );
          }
          await control.hover({ position: hoverPosition });
          await page.mouse.move(0, 0);
          assert.ok(
            await resolved(control),
            "Pointer exit must settle even while focused",
          );
          await focusTarget.evaluate((element) => element.blur());
          await eventually(() => resolved(control), "Blur must restore text");
          await control.dispatchEvent("pointerenter", { pointerType: "touch" });
          await page.waitForTimeout(100);
          assert.ok(
            await resolved(control),
            "Touch entry cannot trigger hover motion",
          );
        }

        await page.goto(baseURL, { waitUntil: "networkidle" });
        await checkControl(
          page.getByRole("button", { name: "Explore matcha", exact: true }),
        );
        await checkControl(heroExplore(page));
        const about = page.getByRole("button", {
          name: "About ATOMA",
          exact: true,
        });
        await checkControl(about, { verifyFocusRest: true });
        await about.click();
        await checkControl(
          page
            .getByRole("dialog")
            .getByRole("button", { name: "CLOSE", exact: true }),
        );
        await page.keyboard.press("Escape");
        await heroExplore(page).click();
        await selectHomeShop(page);
        const type = await matchaChoice(page, "Matcha One");
        await type.waitFor();
        await checkControl(type);
        const information = page.getByRole("button", {
          name: "Material & use",
          exact: true,
        });
        await checkControl(information);
        await information.click();
        const dialog = page.getByRole("dialog");
        await checkControl(dialog.getByRole("button", { name: /^Aroma / }));
        await checkControl(dialog.locator("summary"));
        await checkControl(
          dialog.getByRole("button", {
            name: "Back to selection",
            exact: true,
          }),
        );
        await page.keyboard.press("Escape");
        const add = page.getByRole("button", {
          name: "Add to cart",
          exact: true,
        });
        await checkControl(add);
        await add.click();
        const cart = page.getByRole("dialog");
        await cart.waitFor();
        await checkControl(
          cart.getByRole("button", { name: "Close cart", exact: true }),
        );
        await checkControl(
          cart.getByRole("button", { name: "Remove Matcha One", exact: true }),
        );
        assert.deepEqual(
          state.actions.map((action) => action.action),
          ["add"],
        );
        await page.goto(`${baseURL}/concept-02`, { waitUntil: "networkidle" });
        await primaryEntry(page, "/concept-02").click();
        const standardRadio = page.getByRole("radio", { name: /Matcha One/i });
        await checkControl(standardRadio.locator(".."), {
          focusTarget: standardRadio,
        });
        await page
          .getByRole("button", { name: "Interactive builder", exact: true })
          .click();
        await builderStep(page, "Matcha");
        await checkControl(
          page.getByRole("button", {
            name: "Continue to quantity",
            exact: true,
          }),
        );
        assertHealthy(state);
      } finally {
        await context.close();
      }
    },
  ]);
}

cases.push([
  "connected script: shop captions keep joined words and stable widths through periodic pulses",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      viewport: { width: 900, height: 480 },
      reducedMotion: "no-preference",
      catalogProducts: [productStories[0]],
    });
    try {
      await page.goto(`${baseURL}/shop`, { waitUntil: "networkidle" });
      const purpose = page
        .getByRole("article", { name: "Culinary Matcha", exact: true })
        .locator('[data-connected="true"][data-periodic="true"]');
      await purpose.waitFor();
      await purpose.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      const typography = await purpose.evaluate(async (element) => {
        const style = getComputedStyle(element);
        const configured = style
          .getPropertyValue("--font-antro-vectra")
          .trim()
          .split(",")[0];
        const loaded = configured
          ? await document.fonts.load(`${style.fontSize} ${configured}`)
          : [];
        await document.fonts.ready;
        const glyphs = [...element.querySelectorAll("[data-scramble-glyph]")];
        return {
          configured,
          family: style.fontFamily,
          loaded:
            loaded.length > 0 &&
            loaded.every((font) => font.status === "loaded"),
          expectedWords: element.firstElementChild.textContent
            .split(/\s+/u)
            .filter(Boolean),
          measuredWords: glyphs.map(
            (glyph) => glyph.previousElementSibling.textContent,
          ),
          wordWidths: glyphs.map(
            (glyph) => glyph.parentElement.getBoundingClientRect().width,
          ),
        };
      });
      assert.ok(typography.configured && typography.loaded);
      assert.ok(
        typography.family.includes(
          typography.configured.replace(/["']/g, "").trim(),
        ),
      );
      assert.deepEqual(typography.measuredWords, typography.expectedWords);
      assert.ok(typography.measuredWords.some((word) => word.length > 1));
      assert.ok(typography.wordWidths.every((width) => width > 0));
      const accessible = await purpose.ariaSnapshot();
      const pulses = await purpose.evaluate(
        (element) =>
          new Promise((resolve) => {
            const glyphs = [
              ...element.querySelectorAll("[data-scramble-glyph]"),
            ];
            const expected = glyphs.map(
              (glyph) => glyph.previousElementSibling.textContent,
            );
            const widths = glyphs.map(
              (glyph) => glyph.parentElement.getBoundingClientRect().width,
            );
            const visiblePassages = [
              ...document.querySelectorAll('[data-periodic="true"]'),
            ].filter((passage) => {
              if (
                !passage.checkVisibility({
                  checkOpacity: true,
                  checkVisibilityCSS: true,
                })
              )
                return false;
              return [...passage.getClientRects()].some(
                (rect) =>
                  rect.width > 0 &&
                  rect.height > 0 &&
                  rect.bottom > 0 &&
                  rect.top < innerHeight &&
                  rect.right > 0 &&
                  rect.left < innerWidth,
              );
            }).length;
            let started = 0;
            let completed = 0;
            let changing = false;
            let greatestWidthChange = 0;
            let frame;
            let deadline;
            const finish = () => {
              cancelAnimationFrame(frame);
              clearTimeout(deadline);
              resolve({
                started,
                completed,
                greatestWidthChange,
                settled: glyphs.every(
                  (glyph, index) => glyph.textContent === expected[index],
                ),
              });
            };
            const sample = () => {
              const unsettled = glyphs.some(
                (glyph, index) => glyph.textContent !== expected[index],
              );
              if (unsettled && !changing) started++;
              if (!unsettled && changing) completed++;
              changing = unsettled;
              glyphs.forEach((glyph, index) => {
                greatestWidthChange = Math.max(
                  greatestWidthChange,
                  Math.abs(
                    glyph.parentElement.getBoundingClientRect().width -
                      widths[index],
                  ),
                );
              });
              if (completed >= 2) finish();
              else frame = requestAnimationFrame(sample);
            };
            // Allow each visible passage its scheduled turn and the per-passage rest.
            deadline = setTimeout(
              finish,
              2 * (visiblePassages + 1) * 4000 + 14000,
            );
            frame = requestAnimationFrame(sample);
          }),
      );
      assert.ok(
        pulses.started >= 2 && pulses.completed >= 2,
        "The caption must periodically change and fully settle without hover",
      );
      assert.ok(pulses.settled);
      assert.ok(
        pulses.greatestWidthChange < 0.1,
        "Whole-word scrambling cannot resize its measured slots",
      );
      assert.equal(await purpose.ariaSnapshot(), accessible);

      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      const reduced = await purpose.evaluate(
        (element) =>
          new Promise((resolve) => {
            const glyphs = [
              ...element.querySelectorAll("[data-scramble-glyph]"),
            ];
            let mutations = 0;
            const observer = new MutationObserver((records) => {
              mutations += records.length;
            });
            glyphs.forEach((glyph) =>
              observer.observe(glyph, {
                childList: true,
                characterData: true,
                subtree: true,
              }),
            );
            setTimeout(() => {
              observer.disconnect();
              resolve({
                mutations,
                settled: glyphs.every(
                  (glyph) =>
                    glyph.textContent ===
                    glyph.previousElementSibling.textContent,
                ),
              });
            }, 4500);
          }),
      );
      assert.deepEqual(reduced, { mutations: 0, settled: true });
      assert.equal(await purpose.ariaSnapshot(), accessible);
      assert.equal(state.actions.length, 0);
      await assertNoOverflow(page);
      assertHealthy(state);
    } finally {
      await context.close();
    }
  },
]);

cases.push([
  "purchase CTA: shared interaction, honest pending state and reduced motion",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      reducedMotion: "no-preference",
    });
    let releaseMutation;
    try {
      await page.goto(`${baseURL}/concept-02`, { waitUntil: "networkidle" });
      await primaryEntry(page, "/concept-02").click();
      await page.getByRole("radio", { name: /Matcha One/i }).waitFor();
      await page.getByRole("radio", { name: /Matcha Three/i }).check();
      const unavailable = page.getByRole("button", {
        name: "Currently unavailable",
        exact: true,
      });
      assert.ok(await unavailable.isDisabled());
      await unavailable.evaluate((element) => element.click());
      assert.equal(state.actions.length, 0);
      await page.getByRole("radio", { name: /Matcha One/i }).check();

      let sharedClass;
      for (const mode of ["standard", "builder"]) {
        if (mode === "builder") {
          await page.emulateMedia({ reducedMotion: "reduce" });
          await page.setViewportSize({ width: 390, height: 844 });
          await page
            .getByRole("button", { name: "Interactive builder", exact: true })
            .click();
          await page
            .getByRole("button", { name: "Continue to quantity", exact: true })
            .click();
        }
        const add = page.getByRole("button", {
          name: "Add to cart",
          exact: true,
        });
        await add.scrollIntoViewIfNeeded();
        await assertWithinViewport(add, "Purchase CTA must remain reachable");
        const bounds = await add.boundingBox();
        assert.ok(bounds.height >= 52, "Purchase target must remain full size");
        const className = await add.getAttribute("class");
        if (sharedClass) assert.equal(className, sharedClass);
        sharedClass = className;
        await page.mouse.move(0, 0);
        await add.evaluate((element) => element.blur());
        await add.hover({ position: { x: 12, y: bounds.height / 2 } });
        if (mode === "standard") {
          await eventually(
            () =>
              add.evaluate(
                (element) =>
                  getComputedStyle(element).transform !== "none" &&
                  element.style.getPropertyValue("--pointer-x") !== "",
              ),
            "Entering the CTA padding must activate its surface and lift",
          );
        } else {
          const reduced = await add.evaluate((element) => {
            const label = element
              .querySelector("[data-scramble-glyph]")
              .closest("[data-wrap]").parentElement;
            return {
              buttonTransform: getComputedStyle(element).transform,
              labelTransform: getComputedStyle(label).transform,
              pointer: element.style.getPropertyValue("--pointer-x"),
              moving: [element, ...element.querySelectorAll("*")].some((part) =>
                [
                  getComputedStyle(part),
                  getComputedStyle(part, "::after"),
                ].some(
                  (style) =>
                    style.animationName !== "none" ||
                    style.transitionDuration !== "0s",
                ),
              ),
            };
          });
          assert.deepEqual(reduced, {
            buttonTransform: "none",
            labelTransform: "none",
            pointer: "",
            moving: false,
          });
        }

        state.nextMutation = mode === "standard" ? "success" : "rejected";
        state.nextMutationGate = new Promise((resolve) => {
          releaseMutation = resolve;
        });
        const writesBefore = state.actions.length;
        await add.click();
        const pending = page.getByRole("button", {
          name: "Adding…",
          exact: true,
        });
        await pending.waitFor();
        await eventually(
          () => state.actions.length === writesBefore + 1,
          "Each explicit add must send one request",
        );
        assert.ok(await pending.isDisabled());
        assert.equal(await pending.getAttribute("aria-busy"), "true");
        await pending.evaluate((element) => {
          element.click();
          element.click();
        });
        assert.equal(state.actions.length, writesBefore + 1);
        if (mode === "builder") {
          assert.ok(
            await pending.evaluate((element) =>
              [...element.querySelectorAll("*")].every(
                (part) =>
                  getComputedStyle(part).animationName === "none" &&
                  getComputedStyle(part, "::after").animationName === "none",
              ),
            ),
            "Pending indicators must honor reduced motion too",
          );
        }
        releaseMutation();
        releaseMutation = undefined;
        const dialog = page.getByRole("dialog", { name: /Your selection/ });
        if (mode === "standard") {
          await dialog.waitFor();
          await page.keyboard.press("Escape");
          await dialog.waitFor({ state: "hidden" });
          await assertFocused(add, "Closing cart must return focus to the CTA");
        } else {
          await page.getByRole("alert").waitFor();
          assert.equal(await dialog.isVisible(), false);
          assert.equal(
            state.lines[0].quantity,
            1,
            "Rejection cannot imply success",
          );
        }
        await eventually(
          () => add.isEnabled(),
          "Completed request must unlock CTA",
        );
        assert.equal(await add.getAttribute("aria-busy"), "false");
        assert.equal(
          state.actions.length,
          writesBefore + 1,
          "No automatic replay",
        );
        await assertNoOverflow(page);
      }
      assertHealthy(state);
    } finally {
      releaseMutation?.();
      await context.close();
    }
  },
]);

async function openShopPurchase(card, name) {
  const trigger = card.getByRole("button", {
    name: `Choose ${name}`,
    exact: true,
    includeHidden: true,
  });
  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    const hover = await card.evaluate(
      () => window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    );
    if (hover) {
      await card
        .page()
        .getByRole("heading", { name: "Find your matcha.", exact: true })
        .hover();
      await card.hover({ position: { x: 12, y: 12 } });
    } else await trigger.tap();
  }
  const panel = card.getByRole("region", {
    name: `Purchase ${name}`,
    exact: true,
  });
  await panel.waitFor();
  assert.equal(
    await trigger.getAttribute("aria-controls"),
    await panel.getAttribute("id"),
  );
  return panel;
}

async function closeShopPurchase(card, name) {
  await card
    .getByRole("button", {
      name: `Close purchase options for ${name}`,
      exact: true,
    })
    .click();
  await card
    .getByRole("region", { name: `Purchase ${name}`, exact: true })
    .waitFor({ state: "hidden" });
}

cases.push([
  "shop purchase panels: hover and keyboard reveal compact controls, dismissal preserves selection",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      reducedMotion: "no-preference",
    });
    try {
      await page.goto(`${baseURL}/shop`, { waitUntil: "networkidle" });
      const heading = page.getByRole("heading", {
        name: "Find your matcha.",
        exact: true,
      });
      const card = page.getByRole("article", {
        name: "Matcha One",
        exact: true,
      });
      const trigger = card.getByRole("button", {
        name: "Choose Matcha One",
        exact: true,
        includeHidden: true,
      });
      const panel = card.getByRole("region", {
        name: "Purchase Matcha One",
        exact: true,
      });
      const close = card.getByRole("button", {
        name: "Close purchase options for Matcha One",
        exact: true,
      });
      await heading.click();
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      assert.equal(
        await panel.count(),
        0,
        "Resting cards must not expose closed purchase controls to keyboard navigation",
      );
      const resting = await card.boundingBox();
      await card.hover({ position: { x: 12, y: 12 } });
      await panel.waitFor();
      assert.equal(await trigger.getAttribute("aria-expanded"), "true");
      assert.ok(
        Math.abs((await card.boundingBox()).height - resting.height) < 1,
        "Revealing purchase options must not make the product card taller",
      );
      await heading.hover();
      await panel.waitFor({ state: "hidden" });
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      await trigger.focus();
      await page.keyboard.press("Enter");
      await assertFocused(
        close,
        "Keyboard opening must move focus to the purchase panel's close control",
      );
      assert.equal(
        await trigger.getAttribute("aria-controls"),
        await panel.getAttribute("id"),
      );
      await page.keyboard.press("Tab");
      await assertFocused(
        card.getByRole("button", { name: "1 kg", exact: true }),
        "Native Tab must enter the purchase controls",
      );
      await card.getByRole("button", { name: "5 × 1 kg", exact: true }).click();
      await card
        .getByRole("button", {
          name: "Increase quantity for Matcha One",
          exact: true,
        })
        .click();
      const information = panel.getByRole("button", {
        name: "Material & use",
        exact: true,
      });
      await information.click();
      const material = page.getByRole("dialog", {
        name: "Matcha One",
        exact: true,
      });
      await material.waitFor();
      await page.keyboard.press("Escape");
      await material.waitFor({ state: "hidden" });
      await assertFocused(
        information,
        "Closing material information must return to the still-open purchase panel",
      );
      assert.equal(await trigger.getAttribute("aria-expanded"), "true");
      await page.keyboard.press("Escape");
      await panel.waitFor({ state: "hidden" });
      await assertFocused(
        trigger,
        "Escape must return to the compact card's Choose control",
      );
      await page.keyboard.press("Enter");
      await panel.waitFor();
      assert.equal(
        await card
          .getByLabel("Quantity for Matcha One", { exact: true })
          .textContent(),
        "10",
      );
      assert.equal(
        await card
          .getByRole("button", { name: "5 × 1 kg", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      await close.click();
      await panel.waitFor({ state: "hidden" });
      await assertFocused(
        trigger,
        "The close button must also restore Choose focus",
      );
      assert.equal(
        state.actions.length,
        0,
        "Opening and dismissing purchase options must not submit a cart mutation",
      );
      await assertNoOverflow(page);
      assertHealthy(state);
    } finally {
      await context.close();
    }
  },
]);

cases.push([
  "mobile shop: grade selection and native swipes preserve independent quantities with reduced motion",
  async (browser) => {
    const { context, page, state } = await setup(browser, {
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      reducedMotion: "reduce",
    });
    try {
      await page.goto(`${baseURL}/shop`, { waitUntil: "networkidle" });
      const collection = page.getByRole("region", {
        name: "Matcha collection",
        exact: true,
      });
      const grades = page.getByRole("navigation", {
        name: "Choose a matcha",
        exact: true,
      });
      const browse = (name) =>
        grades.getByRole("button", { name: `Browse ${name}`, exact: true });
      const first = page.getByRole("article", {
        name: "Matcha One",
        exact: true,
      });
      const second = page.getByRole("article", {
        name: "Matcha Two",
        exact: true,
      });
      const firstQuantity = first.getByLabel("Quantity for Matcha One", {
        exact: true,
      });
      const secondQuantity = second.getByLabel("Quantity for Matcha Two", {
        exact: true,
      });
      await first.waitFor();
      const resting = await first.boundingBox();
      assert.equal(
        await first
          .getByRole("region", { name: "Purchase Matcha One", exact: true })
          .count(),
        0,
      );
      const firstChoose = first.getByRole("button", {
        name: "Choose Matcha One",
        exact: true,
      });
      assert.ok(
        (await firstChoose.boundingBox()).height >= 43.5,
        "Touch shopping must have an explicit purchase entry",
      );
      await openShopPurchase(first, "Matcha One");
      await assertFocused(
        first.getByRole("button", {
          name: "Close purchase options for Matcha One",
          exact: true,
        }),
        "Tapping Choose must expose and focus the purchase options",
      );
      assert.ok(
        Math.abs((await first.boundingBox()).height - resting.height) < 1,
        "Mobile purchase options must keep the carousel card compact",
      );
      const purchaseOptions = first
        .locator("summary")
        .filter({ hasText: /^Purchase options/ });
      assert.equal(
        await purchaseOptions.locator("..").getAttribute("open"),
        null,
      );
      await purchaseOptions.click();
      assert.ok(
        await first
          .getByRole("radio", { name: "One-time purchase", exact: true })
          .isChecked(),
      );
      assert.ok(
        await first
          .getByRole("radio", { name: "Subscribe — unavailable", exact: true })
          .isDisabled(),
      );
      await purchaseOptions.click();
      assert.equal(
        await purchaseOptions.locator("..").getAttribute("open"),
        null,
      );
      assert.equal(await grades.getByRole("button").count(), 3);
      for (const grade of await grades.getByRole("button").all())
        assert.ok(
          (await grade.boundingBox()).height >= 43.5,
          "Mobile collection grades need touch-sized controls",
        );
      assert.equal(
        await browse("Matcha One").getAttribute("aria-pressed"),
        "true",
      );
      await first
        .getByRole("button", { name: "5 × 1 kg", exact: true })
        .click();
      await first
        .getByRole("button", {
          name: "Increase quantity for Matcha One",
          exact: true,
        })
        .click();
      assert.equal(await firstQuantity.textContent(), "10");
      await closeShopPurchase(first, "Matcha One");
      await assertFocused(
        firstChoose,
        "Touch dismissal must restore the card's entry control",
      );
      await browse("Matcha Two").click();
      await eventually(
        () =>
          browse("Matcha Two")
            .getAttribute("aria-pressed")
            .then((value) => value === "true"),
        "Tapping a grade must move its product into the carousel",
      );
      assert.ok(await collection.evaluate((element) => element.scrollLeft > 0));
      await openShopPurchase(second, "Matcha Two");
      await second
        .getByRole("button", {
          name: "Increase quantity for Matcha Two",
          exact: true,
        })
        .click();
      assert.equal(await secondQuantity.textContent(), "2");
      await closeShopPurchase(second, "Matcha Two");
      await swipeMaterial(
        context,
        page,
        second.getByRole("img").locator("../.."),
        "previous",
      );
      await eventually(
        () =>
          browse("Matcha One")
            .getAttribute("aria-pressed")
            .then((value) => value === "true"),
        "A native right swipe must return to the previous product under reduced motion",
      );
      assert.equal(await firstQuantity.textContent(), "10");
      await openShopPurchase(first, "Matcha One");
      assert.equal(
        await first
          .getByRole("button", { name: "5 × 1 kg", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      await closeShopPurchase(first, "Matcha One");
      await swipeMaterial(
        context,
        page,
        first.getByRole("img").locator("../.."),
        "next",
      );
      await eventually(
        () =>
          browse("Matcha Two")
            .getAttribute("aria-pressed")
            .then((value) => value === "true"),
        "A native left swipe must update the current grade",
      );
      assert.equal(
        await secondQuantity.textContent(),
        "2",
        "Browsing away and back must retain each product's quantity",
      );
      await browse("Matcha Three").click();
      const unavailableCard = page.getByRole("article", {
        name: "Matcha Three",
        exact: true,
      });
      await openShopPurchase(unavailableCard, "Matcha Three");
      const unavailable = unavailableCard.getByRole("button", {
        name: "Currently unavailable",
        exact: true,
      });
      await unavailable.scrollIntoViewIfNeeded();
      assert.ok(await unavailable.isDisabled());
      await closeShopPurchase(unavailableCard, "Matcha Three");
      assert.equal(
        state.actions.length,
        0,
        "Grade selection and swipes must not submit commerce",
      );
      await browse("Matcha One").click();
      const reads = state.catalogReads;
      await page
        .getByRole("switch", { name: "Dark mode", exact: true })
        .click();
      assert.equal(new URL(page.url()).pathname, "/shop");
      assert.equal(await firstQuantity.textContent(), "10");
      assert.equal(await secondQuantity.textContent(), "2");
      assert.equal(state.catalogReads, reads);
      await openShopPurchase(first, "Matcha One");
      const add = first.getByRole("button", {
        name: "Add to cart",
        exact: true,
      });
      await add.click();
      const cart = page.getByRole("dialog", { name: /Your selection/ });
      await cart.waitFor();
      assert.deepEqual(state.actions, [
        {
          action: "add",
          productHandle: products[0].handle,
          variantKey: products[0].variants[1].id,
          quantity: 10,
        },
      ]);
      await page.keyboard.press("Escape");
      await cart.waitFor({ state: "hidden" });
      await assertFocused(
        add,
        "Closing Cart must restore the purchased mobile product's action",
      );
      await assertNoOverflow(page);
      assertHealthy(state);
    } finally {
      await context.close();
    }
  },
]);

cases.push([
  "shop: independent selections, preserved appearance and guarded card purchases",
  async (browser) => {
    const noFormat = {
      ...products[0],
      id: "matcha-no-format",
      handle: "matcha-no-format",
      title: "Matcha Without Format",
      variants: [],
    };
    const { context, page, state } = await setup(browser, {
      reducedMotion: "reduce",
      catalogProducts: [...products, noFormat],
    });
    let releaseMutation;
    try {
      await page.goto(baseURL, { waitUntil: "networkidle" });
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "SHOP", exact: true })
        .click();
      await page.getByRole("heading", { name: "Find your matcha." }).waitFor();
      await eventually(
        () =>
          page
            .getByRole("article")
            .count()
            .then((count) => count === 4),
        "Shop must render the published collection without a fixed card count",
      );
      assert.equal(new URL(page.url()).pathname, "/shop");
      const first = page.getByRole("article", {
        name: "Matcha One",
        exact: true,
      });
      const second = page.getByRole("article", {
        name: "Matcha Two",
        exact: true,
      });
      const unavailable = page.getByRole("article", {
        name: "Matcha Three",
        exact: true,
      });
      const missing = page.getByRole("article", {
        name: "Matcha Without Format",
        exact: true,
      });
      const firstQuantity = first.getByLabel("Quantity for Matcha One", {
        exact: true,
      });
      const secondQuantity = second.getByLabel("Quantity for Matcha Two", {
        exact: true,
      });
      await openShopPurchase(first, "Matcha One");
      await first
        .getByRole("button", { name: "Increase quantity for Matcha One" })
        .click();
      assert.equal(await firstQuantity.textContent(), "2");
      assert.equal(await secondQuantity.textContent(), "1");
      await openShopPurchase(second, "Matcha Two");
      await second
        .getByRole("button", { name: "Increase quantity for Matcha Two" })
        .click();
      const firstPanel = await openShopPurchase(first, "Matcha One");
      await first
        .getByRole("button", { name: "5 × 1 kg", exact: true })
        .click();
      assert.equal(await firstQuantity.textContent(), "5");
      assert.equal(await secondQuantity.textContent(), "2");
      const increase = first.getByRole("button", {
        name: "Increase quantity for Matcha One",
      });
      await increase.click();
      await increase.click();
      assert.equal(await firstQuantity.textContent(), "15");
      assert.ok(await increase.isDisabled());
      await first
        .getByRole("button", { name: "Decrease quantity for Matcha One" })
        .click();
      assert.equal(await firstQuantity.textContent(), "10");
      assert.equal(
        await firstPanel.getByText(money(60_000), { exact: true }).count(),
        1,
      );
      for (const [card, name] of [
        [unavailable, "Matcha Three"],
        [missing, "Matcha Without Format"],
      ]) {
        await openShopPurchase(card, name);
        const action = card.getByRole("button", {
          name: "Currently unavailable",
          exact: true,
        });
        assert.ok(await action.isDisabled());
        await action.evaluate((element) => element.click());
        await closeShopPurchase(card, name);
      }
      assert.equal(
        await missing.getByText("No published format", { exact: true }).count(),
        1,
      );
      assert.equal(state.actions.length, 0);

      const catalogReadsBeforeTheme = state.catalogReads;
      const themeSwitch = page.getByRole("switch", {
        name: "Dark mode",
        exact: true,
      });
      const shopURL = page.url();
      const historyLength = await page.evaluate(() => window.history.length);
      await themeSwitch.click();
      await eventually(
        () => page.locator('main[data-tone="dark"]').count(),
        "The switch must update the shop theme in place",
      );
      assert.equal(page.url(), shopURL);
      assert.equal(
        await page.evaluate(() => window.history.length),
        historyLength,
      );
      assert.equal(await firstQuantity.textContent(), "10");
      assert.equal(await secondQuantity.textContent(), "2");
      assert.equal(state.catalogReads, catalogReadsBeforeTheme);
      await themeSwitch.click();
      await eventually(
        () => page.locator('main[data-tone="light"]').count(),
        "The switch must restore light appearance without navigation",
      );
      assert.equal(new URL(page.url()).pathname, "/shop");
      assert.equal(await firstQuantity.textContent(), "10");
      assert.equal(await secondQuantity.textContent(), "2");

      state.nextMutationGate = new Promise((resolve) => {
        releaseMutation = resolve;
      });
      await openShopPurchase(first, "Matcha One");
      const add = first.getByRole("button", {
        name: "Add to cart",
        exact: true,
      });
      await add.click();
      const pending = first.getByRole("button", {
        name: "Adding…",
        exact: true,
      });
      await pending.waitFor();
      const pendingClose = first.getByRole("button", {
        name: "Close purchase options for Matcha One",
        exact: true,
      });
      assert.ok(await pendingClose.isDisabled());
      await page.keyboard.press("Escape");
      assert.equal(
        await first.getAttribute("data-purchase-open"),
        "true",
        "A pending purchase must keep its originating action available for Cart focus restoration",
      );
      const sibling = second.getByRole("button", {
        name: "Add to cart",
        exact: true,
        includeHidden: true,
      });
      assert.ok(await pending.isDisabled());
      assert.ok(await sibling.isDisabled());
      assert.equal(await pending.getAttribute("aria-busy"), "true");
      assert.equal(await sibling.getAttribute("aria-busy"), "false");
      assert.equal(
        await page
          .getByRole("button", { name: "Adding…", exact: true })
          .count(),
        1,
      );
      assert.ok(await increase.isDisabled());
      assert.ok(
        await first
          .getByRole("button", { name: "1 kg", exact: true })
          .isDisabled(),
      );
      await pending.evaluate((element) => element.click());
      await sibling.evaluate((element) => element.click());
      await eventually(
        () => state.actions.length === 1,
        "Only the requested card may submit",
      );
      assert.deepEqual(state.actions, [
        {
          action: "add",
          productHandle: products[0].handle,
          variantKey: products[0].variants[1].id,
          quantity: 10,
        },
      ]);
      releaseMutation();
      releaseMutation = undefined;
      const cart = page.getByRole("dialog", { name: /Your selection/ });
      await cart.waitFor();
      assert.equal(
        await cart
          .getByLabel("Matcha One quantity", { exact: true })
          .textContent(),
        "10",
      );
      await page.keyboard.press("Escape");
      await cart.waitFor({ state: "hidden" });
      await assertFocused(
        add,
        "Cart close must restore the originating card action",
      );
      assert.ok(await sibling.isEnabled());
      assert.equal(
        state.actions.length,
        1,
        "Theme changes and retries cannot replay a purchase",
      );

      state.catalogMode = "unavailable";
      await page.reload({ waitUntil: "networkidle" });
      await page
        .getByRole("heading", { name: "The collection couldn’t be loaded." })
        .waitFor();
      assert.equal(await page.getByRole("article").count(), 0);
      state.catalogMode = "empty";
      await page
        .getByRole("button", { name: "Try again", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "The next selection is taking shape." })
        .waitFor();
      assert.equal(await page.getByRole("article").count(), 0);
      assert.equal(state.actions.length, 1);
      await assertNoOverflow(page);
      assertHealthy(state);
    } finally {
      releaseMutation?.();
      await context.close();
    }
  },
]);

for (const [width, height, reducedMotion] of [
  [1440, 900, "no-preference"],
  [320, 844, "reduce"],
]) {
  cases.push([
    `navigation study ${width}px: comparisons preserve selection and each navigation remains usable`,
    async (browser) => {
      const { context, page, state } = await setup(browser, {
        viewport: { width, height },
        reducedMotion,
        catalogProducts: productStories,
      });
      try {
        await page.goto(`${baseURL}/navigation-study`, {
          waitUntil: "networkidle",
        });
        const main = page.locator('main[data-concept="01"]');
        const header = main.locator(":scope > header");
        const options = page.getByRole("group", { name: "Navigation options" });
        const choices = [
          ["01 Index", "index"],
          ["02 Folio", "folio"],
          ["03 Dial", "dial"],
          ["04 Plain text", "quiet"],
          ["05 Edge", "edge"],
          ["06 Stack", "stack"],
          ["07 Shutter", "shutter"],
          ["08 Frame", "frame"],
          ["09 Track", "track"],
        ];
        const directVariants = ["quiet", "frame"];
        const menuChoices = choices.filter(
          ([, variant]) => !directVariants.includes(variant),
        );
        assert.equal(await main.getAttribute("data-tone"), "light");
        assert.equal(
          await header.getAttribute("data-navigation-variant"),
          "quiet",
          "The comparison must open on the chosen Plain text navigation",
        );
        assert.equal(
          await options
            .getByRole("button", { name: "04 Plain text", exact: true })
            .getAttribute("aria-pressed"),
          "true",
        );
        async function choose(name, variant) {
          const choice = options.getByRole("button", { name, exact: true });
          await choice.click();
          assert.equal(await choice.getAttribute("aria-pressed"), "true");
          assert.equal(
            await header.getAttribute("data-navigation-variant"),
            variant,
          );
          assert.equal(new URL(page.url()).pathname, "/navigation-study");
        }
        async function captureNavigation(variant, stage) {
          if (!process.env.EXPERIENCE_SCREENSHOTS) return;
          await eventually(
            () =>
              header
                .locator("[data-scramble-glyph]")
                .evaluateAll((glyphs) =>
                  glyphs.every(
                    (glyph) =>
                      glyph.textContent ===
                      glyph.previousElementSibling.textContent,
                  ),
                ),
            "Navigation text must finish its entry resolution before review",
          );
          await captureReview(
            page,
            `navigation-${variant}-${stage}-${width}.png`,
          );
        }
        for (const [name, variant] of choices) {
          await choose(name, variant);
          if (directVariants.includes(variant)) {
            assert.equal(
              await header.locator("[data-navigation-index]").count(),
              0,
            );
            for (const control of [
              header.getByRole("button", {
                name: "Explore matcha",
                exact: true,
              }),
              header.getByRole("link", { name: "SHOP", exact: true }),
              header.getByRole("button", { name: "About ATOMA", exact: true }),
              header.getByRole("button", {
                name: "Open cart, 0 items",
                exact: true,
              }),
            ])
              await assertWithinViewport(
                control,
                "Direct navigation must keep its destinations visible without a menu",
              );
          }
          if (variant === "frame") {
            const aboutTrigger = header.getByRole("button", {
              name: "About ATOMA",
              exact: true,
            });
            await aboutTrigger.click();
            const about = page.getByRole("dialog", {
              name: /A closer look at matcha/,
            });
            await about.waitFor();
            await assertFocused(
              about.getByRole("button", { name: "CLOSE", exact: true }),
              "Frame About must focus its close action",
            );
            await page.keyboard.press("Escape");
            await about.waitFor({ state: "hidden" });
            await assertFocused(aboutTrigger, "Frame must restore About focus");
          }
          await assertNoOverflow(page);
          await captureNavigation(variant, "overview");
        }
        const disclosure = header.locator("[data-navigation-index]");
        const index = disclosure.locator('summary[aria-label="Index"]');
        const explore = header.getByRole("button", {
          name: "Explore matcha",
          exact: true,
        });
        async function exerciseMenu(name, variant) {
          await choose(name, variant);
          await index.focus();
          await page.keyboard.press("Enter");
          assert.equal(
            await disclosure.evaluate((element) => element.open),
            true,
          );
          for (const control of [
            explore,
            header.getByRole("link", { name: "SHOP", exact: true }),
            header.getByRole("button", { name: "About ATOMA", exact: true }),
          ])
            await assertWithinViewport(
              control,
              `The ${variant} menu actions must remain visible and clickable`,
            );
          await captureNavigation(variant, "open");
          await page.keyboard.press("Tab");
          await assertFocused(
            explore,
            "Index must expose Matcha to native keyboard navigation",
          );
          await page.keyboard.press("Escape");
          assert.equal(
            await disclosure.evaluate((element) => element.open),
            false,
          );
          await assertFocused(index, "Escape must restore focus to Index");
          await page.keyboard.press("Enter");
          await page.keyboard.press("Shift+Tab");
          if (variant === "index")
            await assertFocused(
              header.getByRole("link", { name: "ATOMA home", exact: true }),
              "Leaving Index must retain the visitor's next focus target",
            );
          else
            assert.equal(
              await disclosure.evaluate((element) => {
                const focused = document.activeElement;
                return (
                  focused !== document.body &&
                  !element.contains(focused) &&
                  focused.getClientRects().length > 0
                );
              }),
              true,
              "Leaving a menu must keep a visible focus target outside it",
            );
          assert.equal(
            await disclosure.evaluate((element) => element.open),
            false,
          );
          await index.focus();
          await page.keyboard.press("Enter");
          if (height <= 500)
            await page
              .locator('section[aria-label="Navigation study"]')
              .click({ position: { x: 1, y: 1 } });
          else
            await page
              .getByRole("heading", { name: "Navigation study", exact: true })
              .click();
          assert.equal(
            await disclosure.evaluate((element) => element.open),
            false,
            "A pointer action outside Index must dismiss it",
          );
          await index.focus();
          await page.keyboard.press("Enter");
          assert.equal(
            await header
              .getByRole("link", { name: "SHOP", exact: true })
              .getAttribute("href"),
            "/shop",
          );
          await header
            .getByRole("button", { name: "About ATOMA", exact: true })
            .click();
          const about = page.getByRole("dialog", {
            name: /A closer look at matcha/,
          });
          await about.waitFor();
          assert.equal(
            await disclosure.evaluate((element) => element.open),
            false,
          );
          await assertFocused(
            about.getByRole("button", { name: "CLOSE", exact: true }),
            "About must focus its close control",
          );
          await page.keyboard.press("Escape");
          await about.waitFor({ state: "hidden" });
          await assertFocused(
            index,
            "Closing About must return focus to the closed Index",
          );
        }
        for (const [name, variant] of menuChoices)
          await exerciseMenu(name, variant);
        await choose("01 Index", "index");
        await index.focus();
        await page.keyboard.press("Enter");
        await explore.click();
        await page.locator('main[data-exploring="true"]').waitFor();
        assert.equal(
          await disclosure.evaluate((element) => element.open),
          false,
        );
        await selectHomeShop(page);
        await chooseMatcha(page, "Barista Matcha");
        await continueToQuantity(page);
        await page
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        await page.locator('main[data-handoff="complete"]').waitFor();
        await assertCardField(page, "name", "Barista Matcha");
        assert.equal(
          await page.getByLabel("Quantity", { exact: true }).textContent(),
          "02",
        );
        if (width > 760) await assertCardField(page, "quantity", "02");
        if (process.env.EXPERIENCE_SCREENSHOTS)
          await settledScene(page.locator("[data-renderer]"));
        const reads = state.catalogReads;
        await page.evaluate(() => {
          window.__studyCard = document.querySelector("[data-label-card]");
        });
        async function selectionRemains() {
          assert.equal(await main.getAttribute("data-exploring"), "true");
          assert.equal(await main.getAttribute("data-handoff"), "complete");
          await assertCardField(page, "name", "Barista Matcha");
          assert.equal(
            await page.getByLabel("Quantity", { exact: true }).textContent(),
            "02",
          );
          if (width > 760) await assertCardField(page, "quantity", "02");
          assert.equal(
            await page.evaluate(
              () =>
                document.querySelector("[data-label-card]") ===
                window.__studyCard,
            ),
            true,
            "Comparing navigation must retain the live label",
          );
          assert.equal(
            state.catalogReads,
            reads,
            "Comparing navigation cannot restart the catalog",
          );
          const layout = await main.evaluate((element) => ({
            workspaceBottom: element
              .querySelector('[aria-label="Matcha selection"]')
              .getBoundingClientRect().bottom,
            footerTop: element
              .querySelector(":scope > footer")
              .getBoundingClientRect().top,
          }));
          assert.ok(
            layout.footerTop + 1 >= layout.workspaceBottom,
            `Selection must not cover the appearance controls: ${JSON.stringify(layout)}`,
          );
        }
        for (const [name, variant] of choices) {
          await choose(name, variant);
          await selectionRemains();
          if (menuChoices.some(([, menuVariant]) => menuVariant === variant)) {
            await index.focus();
            await page.keyboard.press("Enter");
            await explore.click();
            assert.equal(
              await disclosure.evaluate((element) => element.open),
              false,
            );
            await assertFocused(
              index,
              "Reactivating Matcha must return focus to the closed menu control",
            );
            await selectionRemains();
          }
          if (variant === "frame") {
            await explore.click();
            await selectionRemains();
            await assertFocused(
              explore,
              "Active Frame Matcha must retain visible focus",
            );
          }
          await assertNoOverflow(page);
          await captureNavigation(variant, "selection");
        }
        await choose("01 Index", "index");
        await selectionRemains();
        for (const tone of ["dark", "light"]) {
          await page
            .getByRole("link", {
              name: tone === "dark" ? "Dark mode" : "Light mode",
              exact: true,
            })
            .click();
          await page.locator(`main[data-tone="${tone}"]`).waitFor();
          assert.equal(new URL(page.url()).pathname, "/navigation-study");
          assert.equal(await header.getAttribute("data-tone"), tone);
          await selectionRemains();
        }
        const cart = header.getByRole("button", {
          name: "Open cart, 0 items",
          exact: true,
        });
        await cart.click();
        const cartDialog = page.getByRole("dialog", { name: /Your selection/ });
        await cartDialog.waitFor();
        await page.keyboard.press("Escape");
        await cartDialog.waitFor({ state: "hidden" });
        await assertFocused(
          cart,
          "Index navigation must restore Cart focus after close",
        );
        await selectionRemains();
        await page
          .locator("[data-selection-controls]")
          .getByRole("button", { name: "Back to overview", exact: true })
          .click();
        await page.locator('main[data-exploring="false"]').waitFor();
        await assertFocused(
          heroExplore(page),
          "Overview must restore usable entry focus after the original Index trigger is replaced",
        );
        await index.waitFor();
        assert.equal(
          await disclosure.evaluate((element) => element.open),
          false,
          "Returning to the overview must leave Index closed and usable",
        );
        assert.equal(state.actions.length, 0);
        await assertNoOverflow(page);
        assertHealthy(state);
      } finally {
        await context.close();
      }
    },
  ]);
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : { channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome" }),
  });
  const selectedCases = process.env.EXPERIENCE_TEST_FILTER
    ? cases.filter(([name]) =>
        new RegExp(process.env.EXPERIENCE_TEST_FILTER).test(name),
      )
    : cases;
  assert.ok(selectedCases.length, "The filter must select at least one check");
  let failed = 0;
  try {
    for (const [name, run] of selectedCases) {
      try {
        await run(browser);
        console.log(`PASS ${name}`);
      } catch (error) {
        failed++;
        console.error(`FAIL ${name}\n${error.stack ?? error}`);
      }
    }
  } finally {
    await browser.close();
  }
  console.log(
    `${selectedCases.length - failed}/${selectedCases.length} experience checks passed.`,
  );
  process.exitCode = failed ? 1 : 0;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
