/* Focus modality regression. All commerce reads are fixtures; external traffic
 * and every write are blocked. Use FOCUS_BROWSER=webkit for the Safari engine;
 * FOCUS_SCOPE=details isolates its native focus-visible reproduction. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
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
const engine = process.env.FOCUS_BROWSER ?? "chromium";
const browser = await playwright[engine].launch(
  engine === "chromium"
    ? { channel: "chrome", headless: true }
    : { headless: true },
);
const baseURL = process.env.FOCUS_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.FOCUS_EVIDENCE ?? ".local/focus-interactions-0202/browser";
await mkdir(evidence, { recursive: true });
const destination = { countryCode: "US", currency: "USD" };
const common = {
  description: "Isolated focus fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
};
const variant = (letter, title, options) => ({
  id: `v1_${letter.repeat(43)}`,
  selectionId: letter,
  title,
  options,
  available: true,
  priceMinor: 2900,
  currency: "USD",
  minimum: 1,
  maximum: 4,
  increment: 1,
});
const products = [
  {
    ...common,
    id: "sample-set",
    handle: SAMPLE_SET_OFFER.productHandle,
    title: "Sample Set",
    variants: [variant("s", "3 × 20 g", SAMPLE_SET_OFFER.variants[0].options)],
  },
  ...SAMPLE_SET_CONTENTS.map((item, index) => ({
    ...common,
    id: item.key,
    handle: item.productHandle,
    title: item.name,
    productCode: item.productCode,
    variants: [
      variant(String.fromCharCode(97 + index), "1 kg", [
        { name: "Format", value: "1 kg" },
      ]),
    ],
  })),
];

async function eventually(check, message) {
  const end = Date.now() + 15000;
  while (Date.now() < end) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 30));
  }
  assert.fail(message);
}
async function setup(width, tone) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: "reduce",
    isMobile: width < 760,
    hasTouch: width < 760,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: "en", url: baseURL },
  ]);
  const errors = [];
  await context.route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      errors.push(`Blocked ${request.method()} ${url.pathname}`);
      return route.abort();
    }
    if (url.pathname === "/api/cart")
      return route.fulfill({
        json: { kind: "empty", destination, checkoutEnabled: false },
      });
    if (url.pathname === "/api/destination")
      return route.fulfill({
        json: {
          kind: "ready",
          preference: { countryCode: "US", source: "manual" },
          destination,
          countries: ["US", "SG"],
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
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Blocked API ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseURL);
  await page.locator("[data-hero-loader]").waitFor({ state: "detached" });
  await page
    .getByRole("button", {
      name: "Explore matcha from the silver bag",
      exact: true,
    })
    .click();
  await page
    .locator(
      '[data-sample-purchase] button[data-available="true"]:not(:disabled)',
    )
    .waitFor();
  await page.evaluate(() => document.fonts.ready);
  return { page, context, errors, width, tone };
}
async function pointer(fixture, node) {
  if (fixture.width >= 760) return node.click();
  if (
    engine === "webkit" &&
    (await node.locator("[data-scramble-glyph]").count())
  ) {
    // Existing WebKit touch behavior can drop the synthesized click when a
    // ScrambleText glyph under the pointer is rewritten. Use native control
    // padding/static content to isolate focus modality from that separate issue.
    await node.scrollIntoViewIfNeeded();
    const position = await node.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return [
        { x: 4, y: box.height / 2 },
        { x: box.width - 4, y: box.height / 2 },
        { x: box.width / 2, y: 4 },
        { x: box.width / 2, y: box.height - 4 },
      ].find(({ x, y }) => {
        const target = document.elementFromPoint(box.left + x, box.top + y);
        return (
          element.contains(target) && !target.closest("[data-scramble-glyph]")
        );
      });
    });
    assert.ok(position, "A native control has a non-glyph touch target");
    return node.tap({ position });
  }
  return node.tap();
}
async function appearance(node) {
  return node.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      focused: document.activeElement === element,
      visible: element.matches(":focus-visible"),
      outline: style.outlineStyle,
      width: parseFloat(style.outlineWidth),
      color: style.outlineColor,
      mode: document.documentElement.dataset.inputModality,
    };
  });
}
function hasRing(value) {
  return (
    value.outline !== "none" &&
    value.width > 0 &&
    value.color !== "transparent" &&
    !/rgba\([^)]*,\s*0\)$/.test(value.color)
  );
}
async function assertRing(node, expected, message) {
  const value = await appearance(node);
  assert.equal(
    hasRing(value),
    expected,
    `${message}: ${JSON.stringify(value)}`,
  );
}
const scrollPosition = (page) =>
  page.evaluate(() => ({ x: scrollX, y: scrollY }));
async function settledClose(fixture, dialog, trigger, returnTarget = trigger) {
  await dialog.waitFor({ state: "hidden" });
  await eventually(
    () => returnTarget.evaluate((node) => node === document.activeElement),
    "Dismissal returns real focus to the opener or its native return target",
  );
  // Native close and React's close handler run in separate tasks.
  if ((await trigger.getAttribute("aria-expanded")) !== null)
    await eventually(
      async () => (await trigger.getAttribute("aria-expanded")) === "false",
      "The opener finishes its closed state",
    );
  await fixture.page.evaluate(
    () =>
      new Promise((done) =>
        requestAnimationFrame(() => requestAnimationFrame(done)),
      ),
  );
}
async function modal(
  fixture,
  { name, trigger, dialog, close, keyboard = "Enter" },
) {
  const { page } = fixture;
  // Seed keyboard focus before switching to pointer, reproducing inherited rings.
  await page.keyboard.press("Tab");
  await trigger.focus();
  await trigger.scrollIntoViewIfNeeded();
  const before = await scrollPosition(page);
  const nativeCartReturn = name === "Cart" && engine === "webkit";
  if (nativeCartReturn) {
    // Safari can leave body focused after a pointer click. Preserve Cart's
    // existing capture of the actual click-time focus, not an assumed target.
    await trigger.evaluate((element) => {
      element.addEventListener(
        "click",
        () => {
          window.__atomaFocusReturnForTest = document.activeElement;
        },
        { once: true, capture: true },
      );
    });
  }
  await pointer(fixture, trigger);
  await dialog.waitFor();
  const returnTarget = nativeCartReturn
    ? await page.evaluateHandle(() => window.__atomaFocusReturnForTest)
    : trigger;
  await eventually(
    () => close.evaluate((node) => node === document.activeElement),
    `${name} keeps accessible close focus`,
  );
  await assertRing(
    close,
    false,
    `${name} pointer opening has no action outline`,
  );
  if (name === "Sample details") {
    await page.screenshot({
      path: `${evidence}/${engine}-${fixture.width}-${fixture.tone}-details-pointer.png`,
    });
    const inheritedFocus = await appearance(close);
    if (inheritedFocus.visible) {
      await page.evaluate(() => {
        delete document.documentElement.dataset.inputModality;
      });
      await assertRing(
        close,
        true,
        "The native inherited focus-visible heuristic reproduces the former ring",
      );
      console.log(
        `REPRO ${engine} ${fixture.width}-${fixture.tone}: native focus-visible=true, pointer outline=none`,
      );
    }
  }
  await pointer(fixture, close);
  await settledClose(fixture, dialog, trigger, returnTarget);
  await assertRing(
    returnTarget,
    false,
    `${name} pointer return has no action outline`,
  );
  if (nativeCartReturn) await returnTarget.dispose();
  assert.deepEqual(
    await scrollPosition(page),
    before,
    `${name} close preserves underlying scroll`,
  );

  await page.keyboard.press("Tab");
  await trigger.focus();
  await assertRing(
    trigger,
    true,
    `${name} keyboard focus has a visible outline`,
  );
  await trigger.press(keyboard);
  await dialog.waitFor();
  await eventually(
    () => close.evaluate((node) => node === document.activeElement),
    `${name} keyboard opening focuses its close action`,
  );
  await assertRing(close, true, `${name} keyboard opening retains its outline`);
  await page.keyboard.press("Tab");
  const active = page.locator(":focus");
  assert.equal(
    await dialog.evaluate(
      (node) =>
        node.contains(document.activeElement) ||
        document.activeElement === document.body,
    ),
    true,
    "Tab cannot focus background page controls while the modal is open",
  );
  if (
    (await active.count()) &&
    (await active.evaluate((node) =>
      node.matches('button,a,summary,[role="button"]'),
    ))
  )
    await assertRing(active, true, "Tab restores a visible action outline");
  await page.keyboard.press("Escape");
  await settledClose(fixture, dialog, trigger);
  await assertRing(
    trigger,
    true,
    `${name} keyboard dismissal retains opener indication`,
  );
}

async function scenario(fixture) {
  const { page, width, tone } = fixture;
  const header = page.locator('main[data-concept="01"] > header').first();
  const detailsTrigger = page.locator(
    "[data-sample-order-panel] [data-sample-details-trigger]",
  );
  const details = page.locator("[data-sample-set-details][open]");
  await modal(fixture, {
    name: "Sample details",
    trigger: detailsTrigger,
    dialog: details,
    close: details.getByRole("button", { name: "Close details", exact: true }),
  });
  if (process.env.FOCUS_SCOPE === "details") {
    assert.deepEqual(fixture.errors, []);
    return;
  }
  const labelTrigger = page
    .locator("[data-foil-trio]:visible button[data-pouch]")
    .first();
  const label = page.locator("[data-sample-label-dialog][open]");
  await modal(fixture, {
    name: "Foil label",
    trigger: labelTrigger,
    dialog: label,
    close: label.getByRole("button", { name: "Close label", exact: true }),
    keyboard: "Space",
  });
  const cartTrigger = header.getByRole("button", {
    name: "Open cart, 0 items",
    exact: true,
  });
  const cart = page.getByRole("dialog", { name: /Your\s+selection/ });
  await modal(fixture, {
    name: "Cart",
    trigger: cartTrigger,
    dialog: cart,
    close: cart.getByRole("button", { name: "Close cart", exact: true }),
  });

  // Pointerdown must clear a keyboard ring even when the same action keeps focus.
  const ordering = page.locator("[data-sample-purchase] summary");
  await page.keyboard.press("Tab");
  await ordering.focus();
  await assertRing(ordering, true, "Keyboard focus marks the ordering summary");
  await ordering.scrollIntoViewIfNeeded();
  const box = await ordering.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  assert.equal(
    await ordering.evaluate((node) => node === document.activeElement),
    true,
    "Changing modality does not blur the current action",
  );
  await assertRing(
    ordering,
    false,
    "Pointerdown clears a stale ring without blur",
  );
  await page.mouse.up();
  // Safari's Option+Tab is a keyboard navigation chord, not a pointer action.
  await ordering.dispatchEvent("keydown", {
    key: "Tab",
    altKey: true,
    bubbles: true,
  });
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.inputModality),
    "keyboard",
    "Option+Tab restores keyboard modality",
  );
  await page.keyboard.press("Tab");
  const next = page.locator(":focus");
  await assertRing(next, true, "A subsequent Tab restores keyboard indication");

  if (width < 760) {
    const menu = header.locator("[data-nav-summary]");
    await pointer(fixture, menu);
    await assertRing(menu, false, "Touch navigation summary has no ring");
    await pointer(fixture, menu);
    await page.keyboard.press("Tab");
    await menu.focus();
    await assertRing(menu, true, "Keyboard navigation summary has a ring");
    await menu.press("Enter");
    await menu.press("Enter");
    await pointer(fixture, menu);
  }
  const originsTrigger = header.locator('[data-nav-action="origins"]:visible');
  await pointer(fixture, originsTrigger);
  const origins = page.locator("[data-origins-dialog][open]");
  await origins.waitFor();
  const returnButton = origins.getByRole("button", { name: /^Return to / });
  await pointer(fixture, returnButton);
  await origins.waitFor({ state: "hidden" });
  const returnTarget =
    width < 760 ? header.locator("[data-nav-summary]") : originsTrigger;
  await eventually(
    () => returnTarget.evaluate((node) => node === document.activeElement),
    "Origins returns focus to its navigation entry",
  );
  await assertRing(
    returnTarget,
    false,
    "Pointer Origins return has no outline",
  );
  if (width < 760) await pointer(fixture, returnTarget);
  await pointer(fixture, originsTrigger);
  await origins.waitFor();
  const search = origins.getByRole("searchbox", {
    name: "Find a place",
    exact: true,
  });
  await pointer(fixture, search);
  assert.equal(
    await search.evaluate((node) => node === document.activeElement),
    true,
  );
  await assertRing(
    search.locator(".."),
    true,
    "Pointer entry retains the search field's focus-within indication",
  );
  await search.fill("Wazuka");
  assert.equal(await search.inputValue(), "Wazuka");
  await page.screenshot({
    path: `${evidence}/${engine}-${width}-${tone}-search.png`,
  });
  // Escape may clear an active search field first; dismiss from its next control.
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  await origins.waitFor({ state: "hidden" });
  await eventually(
    () => returnTarget.evaluate((node) => node === document.activeElement),
    "Keyboard Origins dismissal returns focus",
  );
  await assertRing(
    returnTarget,
    true,
    "Keyboard Origins return has an outline",
  );

  await page.locator('[data-homepage-product-choice="ceremonial"]').click();
  const modes = page.getByRole("group", { name: "Shopping mode", exact: true });
  await pointer(
    fixture,
    modes.getByRole("button", { name: "Specifications", exact: true }),
  );
  const property = page
    .locator("[data-focused-specifications] [data-specification]")
    .first();
  const explanation = page.locator(
    "[data-focused-specifications] dialog[open]",
  );
  await modal(fixture, {
    name: "Specification",
    trigger: property,
    dialog: explanation,
    close: explanation.getByRole("button", {
      name: "Close specification explanation",
      exact: true,
    }),
  });
  await pointer(
    fixture,
    modes.getByRole("button", { name: "Shop", exact: true }),
  );
  const materialTrigger = page
    .locator("[data-shop-exploration]")
    .getByRole("button", { name: "Material & use", exact: false });
  const material = page.getByRole("dialog").filter({
    has: page.getByRole("button", {
      name: "Back to selection",
      exact: false,
    }),
  });
  await modal(fixture, {
    name: "Material",
    trigger: materialTrigger,
    dialog: material,
    close: material.getByRole("button", {
      name: "Back to selection",
      exact: false,
    }),
  });
  assert.deepEqual(fixture.errors, []);
}
try {
  for (const width of [390, 1440])
    for (const tone of ["light", "dark"]) {
      const name = `${width}-${tone}`;
      if (
        process.env.FOCUS_FILTER &&
        !new RegExp(process.env.FOCUS_FILTER).test(name)
      )
        continue;
      const fixture = await setup(width, tone);
      try {
        await scenario(fixture);
        console.log(
          `PASS ${engine} ${name} ${process.env.FOCUS_SCOPE ?? "full"}`,
        );
      } catch (error) {
        await fixture.page
          .screenshot({ path: `${evidence}/failure-${engine}-${name}.png` })
          .catch(() => {});
        throw error;
      } finally {
        await fixture.context.close();
      }
    }
} finally {
  await browser.close();
}
