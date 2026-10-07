/* Popup dismissal and mobile layout checks. Commerce requests are mocked. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.MOBILE_POPUPS_BASE_URL ?? "http://127.0.0.1:3100";
const evidence = process.env.MOBILE_POPUPS_EVIDENCE;
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
  description: "Isolated popup browser fixture.",
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
const methods = ["button", "escape", "outside"];
const results = [];

async function eventually(check, message) {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function setup(browser, viewport, tone) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: "reduce",
    hasTouch: viewport.width <= 760,
    isMobile: viewport.width <= 760,
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
            products,
            shopUrl: "https://example.invalid",
          });
        if (url.pathname === "/api/cart" && request.method() === "GET")
          return respond({ kind: "empty", checkoutEnabled: false });
        if (!["GET", "HEAD"].includes(request.method()))
          state.writes.push(`${request.method()} ${url.pathname}`);
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
  await page.goto(`${baseURL}/?matcha=${products[1].handle}`);
  await page
    .locator("[data-homepage-product-choice]:not(:disabled)")
    .first()
    .waitFor();
  await page.locator("[data-scene-canvas]").waitFor({ state: "attached" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.__popupNodes = [
      'main[data-concept="01"]',
      '[data-brand-part="material-stage"]',
      "[data-renderer]",
      "[data-scene-canvas]",
    ].map((selector) => [selector, document.querySelector(selector)]);
  });
  return { context, page, state };
}

async function focusIs(locator, message) {
  await eventually(
    () => locator.evaluate((el) => el === document.activeElement),
    message,
  );
}

async function switchView(page, name) {
  await page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name, exact: true })
    .click();
  const panel =
    name === "Shop"
      ? "[data-shop-exploration]"
      : `[data-homepage-view-panel="${name.toLowerCase()}"]:not([hidden])`;
  await page.locator(panel).waitFor();
}

async function assertSelection(page, view) {
  assert.equal(
    await page.locator('[data-embedded="true"]').getAttribute("data-mode"),
    view,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Select Ceremonial Matcha", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page.evaluate(() =>
      window.__popupNodes.every(
        ([selector, element]) =>
          element && document.querySelector(selector) === element,
      ),
    ),
    true,
    "Hero, material stage, renderer and canvas remain mounted",
  );
}

async function capture(page, name) {
  if (evidence)
    await page.screenshot({ path: resolve(evidence, `${name}.png`) });
}

async function clickPoint(page, x, y) {
  if (page.viewportSize().width <= 760) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

async function inspectPopup(page, dialog) {
  const box = await dialog.boundingBox();
  const viewport = page.viewportSize();
  assert.ok(box, "Popup has a visible box");
  if (viewport.width <= 760) {
    assert.ok(
      box.x >= 10 &&
        box.y >= 10 &&
        box.x + box.width <= viewport.width - 10 &&
        box.y + box.height <= viewport.height - 10,
      `Mobile popup leaves tappable space on all four sides: ${JSON.stringify(box)}`,
    );
  }
  assert.equal(
    await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    true,
    "Popup has no horizontal overflow",
  );
  // Desktop Material and Cart retain their full-height right drawer shape.
  const outside =
    box.x > 1
      ? {
          x: Math.min(4, box.x / 2),
          y: Math.min(viewport.height - 4, box.y + box.height / 2),
        }
      : { x: viewport.width / 2, y: Math.max(2, box.y / 2) };
  const inside = { x: box.x + 4, y: box.y + Math.min(60, box.height / 2) };
  const scrollY = await page.evaluate(() => window.scrollY);
  await clickPoint(page, inside.x, inside.y);
  assert.equal(
    await dialog.evaluate((el) => el.open),
    true,
    "Clicking or tapping inside keeps the popup open",
  );
  await page.mouse.move(inside.x, inside.y);
  await page.mouse.down();
  await page.mouse.move(outside.x, outside.y, { steps: 4 });
  await page.mouse.up();
  assert.equal(
    await dialog.evaluate((el) => el.open),
    true,
    "Dragging from content onto the backdrop keeps the popup open",
  );
  await eventually(
    () =>
      page.evaluate(() =>
        [document.body, document.documentElement].some((el) =>
          ["hidden", "clip"].includes(getComputedStyle(el).overflowY),
        ),
      ),
    "The popup locks background scrolling",
  );
  await page.mouse.move(outside.x, outside.y);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(80);
  assert.equal(
    await page.evaluate(() => window.scrollY),
    scrollY,
    "Wheel over the backdrop cannot move the page",
  );
  return { outside, scrollY };
}

async function dismiss(page, dialog, method, close, inspected) {
  const origins = (await dialog.getAttribute("data-origins-dialog")) !== null;
  if (method === "outside")
    await clickPoint(page, inspected.outside.x, inspected.outside.y);
  else if (method === "escape") await page.keyboard.press("Escape");
  else await close.click();
  await dialog.waitFor({ state: "hidden" });
  if (origins) {
    await eventually(
      () => new URL(page.url()).hash !== "#origins",
      "Origins history entry closes",
    );
    await page.evaluate(
      () =>
        new Promise((done) =>
          requestAnimationFrame(() => requestAnimationFrame(done)),
        ),
    );
  }
  assert.equal(
    await page.evaluate(() => window.scrollY),
    inspected.scrollY,
    "Closing preserves background scroll position",
  );
  await eventually(
    () =>
      page.evaluate(
        () =>
          document.body.style.overflow !== "hidden" &&
          document.documentElement.style.overflow !== "hidden",
      ),
    "Dismissal restores background scrolling",
  );
}

async function exercise(
  page,
  { open, dialog, close, focus, view, name, afterOpen, afterClose },
) {
  for (const method of methods) {
    await open();
    const modal = dialog();
    await modal.waitFor();
    if (afterOpen) await afterOpen(modal, method);
    const inspected = await inspectPopup(page, modal);
    if (method === "button") await capture(page, name);
    await dismiss(page, modal, method, close(modal), inspected);
    await focusIs(focus, `${name} returns focus to its trigger`);
    await assertSelection(page, view);
    if (afterClose) await afterClose();
  }
}

if (evidence) await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
  headless: true,
});
try {
  for (const [width, height] of [
    [320, 740],
    [390, 844],
    [1440, 900],
  ]) {
    for (const tone of ["light", "dark"]) {
      const label = `${width}-${tone}`;
      if (
        process.env.MOBILE_POPUPS_FILTER &&
        !label.includes(process.env.MOBILE_POPUPS_FILTER)
      )
        continue;
      let context;
      let page;
      try {
        const setupResult = await setup(browser, { width, height }, tone);
        ({ context, page } = setupResult);
        const { state } = setupResult;
        const mobile = width <= 760;
        const header = page.locator('main[data-concept="01"] > header').first();
        const menu = header.locator("[data-nav-summary]");
        const openMobileMenu = async () => {
          if (!mobile) return;
          await menu.click();
          // Safari may report no focus destination while a finger tap moves
          // from the summary to a menu action. Its click must remain reachable.
          await menu.evaluate((element) => {
            element.focus();
            element.blur();
          });
          assert.equal(
            await header
              .locator("[data-navigation-index]")
              .evaluate((element) => element.open),
            true,
            "A null-destination blur must not hide the pending menu action",
          );
        };
        const aboutTrigger = header.getByRole("button", {
          name: "About ATOMA",
          exact: true,
        });
        const originsTrigger = header.locator(
          '[data-nav-action="origins"]:visible',
        );
        const originalURL = page.url();
        const quantity = page.locator("[data-shop-exploration] output");
        await switchView(page, "Shop");
        await page
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        const checkQuantity = async () =>
          assert.equal((await quantity.textContent()).trim(), "2");
        const unchangedURL = () =>
          eventually(
            () => page.url() === originalURL,
            "Popup preserves or restores the existing URL",
          );
        await exercise(page, {
          name: `${label}-about`,
          view: "builder",
          open: async () => {
            await openMobileMenu();
            await aboutTrigger.click();
          },
          dialog: () =>
            page
              .locator("dialog[open]")
              .filter({ has: page.locator("[data-about-content]") }),
          close: (dialog) =>
            dialog.getByRole("button", { name: "CLOSE", exact: true }),
          focus: mobile ? menu : aboutTrigger,
          afterOpen: async (dialog, method) => {
            await unchangedURL();
            const close = dialog.getByRole("button", {
              name: "CLOSE",
              exact: true,
            });
            await focusIs(close, "About initially focuses Close");
            await page.keyboard.press("Tab");
            await focusIs(close, "About keeps keyboard focus within the popup");
            if (method === "button") {
              await dialog.evaluate((el) => {
                el.scrollTop = el.scrollHeight;
              });
              const bounds = await close.boundingBox();
              assert.ok(
                bounds.y >= 0 && bounds.y + bounds.height <= height,
                "About Close remains reachable while reading",
              );
              await capture(page, `${label}-about-end`);
              await dialog.evaluate((el) => {
                el.scrollTop = 0;
              });
            }
          },
          afterClose: checkQuantity,
        });
        await exercise(page, {
          name: `${label}-origins-menu`,
          view: "builder",
          open: async () => {
            await openMobileMenu();
            await originsTrigger.click();
          },
          dialog: () => page.locator("[data-origins-dialog][open]"),
          close: (dialog) =>
            dialog.getByRole("button", {
              name: "Return to Ceremonial Matcha",
              exact: true,
            }),
          focus: mobile ? menu : originsTrigger,
          afterOpen: async (dialog) => {
            assert.equal(
              new URL(page.url()).pathname,
              "/",
              "Origins remains a popup on the homepage",
            );
            assert.equal(new URL(page.url()).hash, "#origins");
            await focusIs(
              dialog.getByRole("heading", {
                name: "Growing places",
                exact: true,
              }),
              "Origins initially focuses its directory heading",
            );
            for (const key of ["Shift+Tab", "Tab"]) {
              await page.keyboard.press(key);
              assert.equal(
                await dialog.evaluate((el) =>
                  el.contains(document.activeElement),
                ),
                true,
                "Origins contains keyboard focus",
              );
            }
            await dialog
              .getByRole("searchbox", { name: "Find a place", exact: true })
              .fill("Wazuka");
            await dialog.locator('[data-origin-place="wazuka"]').click();
            await dialog.locator('[data-origins-directory="wazuka"]').waitFor();
          },
          afterClose: async () => {
            await unchangedURL();
            await checkQuantity();
          },
        });
        await switchView(page, "Origin");
        const preview = page.locator(
          '[data-homepage-view-panel="origins"] [data-origin-preview="panorama"]',
        );
        await preview.waitFor();
        await preview.evaluate((el) =>
          el.scrollIntoView({ block: "start", inline: "nearest" }),
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          true,
          "Origins tab has no horizontal page overflow",
        );
        if (mobile) {
          const photo = preview.locator("figure img").first();
          const bounds = await photo.boundingBox();
          const rowWidth = await photo.evaluate(
            (el) =>
              el.closest("figure").parentElement.getBoundingClientRect().width,
          );
          assert.ok(
            bounds.width >= rowWidth - 2,
            "Origins photo fills its mobile row",
          );
          assert.ok(
            bounds.height >= 150,
            "Origins photo has useful mobile height",
          );
        }
        await preview
          .getByRole("heading", { name: "Wazuka", exact: true })
          .waitFor();
        await capture(page, `${label}-origins-tab`);
        const placeTrigger = preview.getByRole("button", {
          name: "Explore the growing region",
          exact: true,
        });
        await exercise(page, {
          name: `${label}-origins-place`,
          view: "origins",
          open: () => placeTrigger.click(),
          dialog: () => page.locator("[data-origins-dialog][open]"),
          close: (dialog) =>
            dialog.getByRole("button", {
              name: "Return to Ceremonial Matcha",
              exact: true,
            }),
          focus: placeTrigger,
          afterOpen: (dialog) =>
            dialog.locator('[data-origins-directory="wazuka"]').waitFor(),
          afterClose: unchangedURL,
        });
        // Native browser Back must dismiss the existing Origins history entry too.
        await placeTrigger.click();
        await page.locator("[data-origins-dialog][open]").waitFor();
        await page.goBack();
        await page
          .locator("[data-origins-dialog][open]")
          .waitFor({ state: "hidden" });
        await unchangedURL();
        await focusIs(placeTrigger, "Browser Back returns to the place CTA");
        await assertSelection(page, "origins");
        await switchView(page, "Specifications");
        const property = page
          .locator("[data-focused-specifications] [data-specification]")
          .first();
        await exercise(page, {
          name: `${label}-specifications`,
          view: "specifications",
          open: () => property.click(),
          dialog: () =>
            page.locator("[data-focused-specifications] dialog[open]"),
          close: (dialog) =>
            dialog.getByRole("button", {
              name: "Close specification explanation",
              exact: true,
            }),
          focus: property,
        });
        await switchView(page, "Shop");
        await checkQuantity();
        const material = page
          .locator("[data-shop-exploration]")
          .getByRole("button", { name: "Material & use", exact: false });
        await exercise(page, {
          name: `${label}-material`,
          view: "builder",
          open: () => material.click(),
          dialog: () => page.locator("dialog[open]"),
          close: (dialog) =>
            dialog.getByRole("button", {
              name: "Back to selection",
              exact: false,
            }),
          focus: material,
        });
        const cart = header.getByRole("button", {
          name: "Open cart, 0 items",
          exact: true,
        });
        await exercise(page, {
          name: `${label}-cart`,
          view: "builder",
          open: () => cart.click(),
          dialog: () => page.getByRole("dialog", { name: /Your selection/ }),
          close: (dialog) =>
            dialog.getByRole("button", { name: "Close cart", exact: true }),
          focus: cart,
        });
        await checkQuantity();
        await unchangedURL();
        assert.deepEqual(
          state.errors,
          [],
          "No browser or unexpected network errors",
        );
        assert.deepEqual(state.writes, [], "No commerce writes occurred");
        results.push({ label, passed: true });
        console.log(
          `PASS ${label}: popup dismissal, fit, history, focus, scrolling and mounted selection`,
        );
      } catch (error) {
        results.push({ label, passed: false, error: error.stack });
        console.error(`FAIL ${label}\n${error.stack}`);
        if (page) await capture(page, `${label}-failure`);
      } finally {
        await context?.close();
      }
    }
  }
} finally {
  await browser.close();
}
if (evidence)
  await writeFile(
    resolve(evidence, "results.json"),
    JSON.stringify(results, null, 2),
  );
const passed = results.filter((result) => result.passed).length;
console.log(`${passed}/${results.length} popup cases passed`);
if (passed !== results.length || results.length === 0) process.exitCode = 1;
