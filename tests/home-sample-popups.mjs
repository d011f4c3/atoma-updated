/* Homepage sample names reuse the existing reader. Commerce stays isolated. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { createHeroStudyFixture } from "./hero-cx-fixtures.mjs";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.HOME_SAMPLE_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.HOME_SAMPLE_EVIDENCE ?? ".local/home-sample-popups";
const homeSamples = (page) =>
  page.locator(
    '[data-new-hero7-view="home"] [data-new-hero-section="samples"]',
  );
const sampleView = (page) =>
  page.locator('[data-new-hero7-view="samples"]:visible');
const trigger = (scope, key) =>
  scope.locator(`[data-new-hero7-sample-tab="${key}"]`);
const dialog = (scope) => scope.locator("[data-new-hero7-sample-dialog][open]");
const close = (scope) => dialog(scope).locator("[data-new-hero7-sample-close]");
const profiles = new Map();

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

async function settled(page) {
  await page.locator("[data-hero-loader]").waitFor({ state: "detached" });
  await eventually(
    () => page.locator("footer [data-theme-switcher]").isEnabled(),
    "The storefront is hydrated",
  );
  await page.evaluate(() => document.fonts.ready);
}

async function profile(scope) {
  const popup = dialog(scope);
  const preparation = popup.locator("[data-new-hero7-sample-preparation]");
  await preparation.locator("summary").click();
  return {
    name: await popup.locator("h2").innerText(),
    values: await popup.locator("dd").allTextContents(),
    preparation: await preparation.locator("p").innerText(),
    observations: await preparation.locator("li").allTextContents(),
    largerFormat: await popup
      .locator("[data-new-hero7-sample-product]")
      .getAttribute("href"),
  };
}

async function open(page, scope, item, keyboard = false) {
  const button = trigger(scope, item.key);
  await button.scrollIntoViewIfNeeded();
  await button.focus();
  const before = {
    url: page.url(),
    scroll: await page.evaluate(() => scrollY),
    bounds: await button.boundingBox(),
  };
  if (keyboard) await page.keyboard.press("Enter");
  else await button.click();
  const popup = dialog(scope);
  await popup.waitFor();
  assert.equal(
    await popup.getAttribute("data-new-hero7-sample-profile"),
    item.key,
    "Each name opens its own matcha profile",
  );
  assert.equal(await popup.evaluate((node) => node.matches(":modal")), true);
  assert.equal((await popup.locator("h2").textContent()).trim(), item.name);
  assert.equal(await popup.locator("dd").count(), 7);
  assert.equal(await button.getAttribute("aria-haspopup"), "dialog");
  assert.equal(await button.getAttribute("aria-expanded"), "true");
  assert.equal(
    await button.getAttribute("aria-controls"),
    await popup.getAttribute("id"),
  );
  await focused(close(scope), "Opening focuses the existing Close control");
  assert.equal(page.url(), before.url, "Reading does not navigate away");
  assert.equal(await page.evaluate(() => scrollY), before.scroll);
  assert.deepEqual(await button.boundingBox(), before.bounds);
  const bounds = await popup.boundingBox();
  const viewport = page.viewportSize();
  assert.ok(bounds.x > 0 && bounds.y > 0, "The reader is an inset popup");
  assert.ok(bounds.x + bounds.width < viewport.width);
  assert.ok(bounds.y + bounds.height < viewport.height);
  assert.equal(
    await popup.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    true,
    "The popup has no horizontal overflow",
  );
  return before;
}

async function dismiss(page, scope, item, before, method) {
  const popup = dialog(scope);
  if (method === "Escape") await page.keyboard.press("Escape");
  else if (method === "backdrop") await page.mouse.click(2, 2);
  else await close(scope).click();
  await popup.waitFor({ state: "hidden" });
  const button = trigger(scope, item.key);
  await focused(button, `${method} returns focus to the same matcha name`);
  assert.equal(await button.getAttribute("aria-expanded"), "false");
  assert.equal(await page.evaluate(() => scrollY), before.scroll);
  assert.deepEqual(await button.boundingBox(), before.bounds);
  assert.equal(page.url(), before.url);
}

await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
async function fixture(width, tone, route, run) {
  const test = await createHeroStudyFixture(
    browser,
    baseURL,
    width,
    tone,
    "en",
  );
  try {
    await test.page.goto(`${baseURL}${route}`, {
      waitUntil: "domcontentloaded",
    });
    await settled(test.page);
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
  for (const tone of ["light", "dark"]) {
    await fixture(1440, tone, "/", async ({ page }) => {
      const scope = homeSamples(page);
      assert.equal(
        await scope.locator("[data-new-hero7-sample-tab]").count(),
        3,
      );
      await scope.scrollIntoViewIfNeeded();
      await scope.screenshot({
        path: resolve(evidence, `home-sample-rows-${tone}.png`),
      });
      const requests = [];
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (request.isNavigationRequest() || url.searchParams.has("_rsc"))
          requests.push(url.pathname);
      });
      for (const [index, item] of SAMPLE_SET_CONTENTS.entries()) {
        const before = await open(page, scope, item, index === 0);
        const content = await profile(scope);
        if (tone === "light") profiles.set(item.key, content);
        else assert.deepEqual(content, profiles.get(item.key));
        if (index === 0)
          await page.screenshot({
            path: resolve(evidence, `home-sample-${tone}.png`),
          });
        await dismiss(
          page,
          scope,
          item,
          before,
          ["close", "Escape", "backdrop"][index],
        );
      }

      const barista = SAMPLE_SET_CONTENTS.find(
        (item) => item.key === "barista",
      );
      const before = await open(page, scope, barista);
      await dialog(scope).locator("[data-new-hero7-sample-product]").click();
      const productPopup = page.locator(
        "[data-new-hero7-product-dialog][open]",
      );
      await productPopup.waitFor();
      assert.equal(new URL(page.url()).searchParams.get("view"), "matcha");
      assert.equal(
        new URL(page.url()).searchParams.get("application"),
        "barista",
      );
      assert.equal(
        await productPopup
          .locator('[data-new-hero-product="barista"]:visible')
          .count(),
        1,
      );
      assert.equal(
        await page.locator("[data-new-hero7-sample-dialog][open]").count(),
        0,
      );
      await page.goBack();
      await dialog(scope).waitFor();
      await focused(close(scope), "Back restores the retained Home reader");
      await dismiss(page, scope, barista, before, "Escape");

      const ceremonial = SAMPLE_SET_CONTENTS.find(
        (item) => item.key === "ceremonial",
      );
      await open(page, scope, ceremonial);
      await dialog(scope).locator("[data-new-hero7-sample-order]").click();
      await sampleView(page).waitFor();
      assert.equal(new URL(page.url()).searchParams.get("view"), "samples");
      assert.equal(
        await page.locator("[data-new-hero7-sample-dialog][open]").count(),
        0,
      );
      const purchase = sampleView(page).locator(
        "[data-new-hero7-sample-purchase]",
      );
      await eventually(
        () => purchase.locator("button[data-available]").isEnabled(),
        "Order the Sample Set reaches the real sample purchase controls",
      );
      await page.goBack();
      await scope.waitFor();
      assert.equal(
        await page.locator("[data-new-hero7-sample-dialog][open]").count(),
        0,
      );
      assert.deepEqual(
        requests,
        [],
        "Reading and handoffs retain the same document",
      );
    });
    console.log(
      `Home sample names, dismissal and purchase handoffs: desktop ${tone}`,
    );
  }

  for (const [width, tone] of [
    [1440, "light"],
    [390, "dark"],
  ]) {
    await fixture(width, tone, "/?view=samples", async ({ page }) => {
      const scope = sampleView(page);
      const purchase = scope.locator("[data-new-hero7-sample-purchase]");
      await eventually(
        () => purchase.locator("button[data-available]").isEnabled(),
        "The original Sample Set order is ready",
      );
      await purchase
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      for (const [index, item] of SAMPLE_SET_CONTENTS.entries()) {
        const before = await open(page, scope, item, index === 0);
        assert.deepEqual(
          await profile(scope),
          profiles.get(item.key),
          "Home and Samples expose exactly the same learning and handoff",
        );
        await dismiss(page, scope, item, before, "Escape");
      }
      assert.equal(
        await purchase.locator('output[aria-label="Set quantity"]').innerText(),
        "2",
      );
      await open(page, scope, SAMPLE_SET_CONTENTS[0]);
      await dialog(scope).locator("[data-new-hero7-sample-order]").click();
      await focused(
        purchase,
        "The original reader still focuses its in-page order",
      );
      assert.equal(
        await page.locator("[data-new-hero7-sample-dialog][open]").count(),
        0,
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
      );
    });
    console.log(
      `Existing sample profiles and retained order: ${width}px ${tone}`,
    );
  }
} finally {
  await browser.close();
}
