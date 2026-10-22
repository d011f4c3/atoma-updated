/* Canonical navigation stays distinct from the seventh concept's local selection flow. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHeroStudyFixture } from "./hero-cx-fixtures.mjs";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.NEW_HERO7_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.NEW_HERO7_EVIDENCE ?? ".local/new-hero-0251/navigation";
const destinations = {
  matcha: "/new-hero7",
  shop: "/shop",
  samples: "/samples",
  origins: "/origins",
  about: "/about",
};
const header = (page) => page.locator("[data-new-hero7-header] header");
const view = (page, key) =>
  page.locator(`[data-new-hero7-view="${key}"]:visible`);
async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}
async function ready(page, key) {
  await view(page, key).waitFor();
  await eventually(
    () => page.locator("footer [data-theme-switcher]").isEnabled(),
    "The selection shell is hydrated",
  );
}
async function menuLink(page, key) {
  const link = header(page).locator(`[data-nav-action="${key}"]`);
  if (!(await link.isVisible())) await header(page).locator("summary").click();
  return link;
}
async function contract(page) {
  for (const [key, href] of Object.entries(destinations)) {
    assert.equal(
      await header(page)
        .locator(`[data-nav-action="${key}"]`)
        .getAttribute("href"),
      href,
    );
    assert.equal(
      await page
        .locator(`[data-new-hero7-footer] nav a[href="${href}"]`)
        .count(),
      1,
    );
  }
  assert.equal(
    await header(page).locator("[data-nav-brand]").getAttribute("href"),
    "/new-hero7",
  );
  assert.equal(
    await page
      .locator(
        '[data-new-hero7-header] [data-nav-action="wholesale"], [data-new-hero7-footer] a[href*="wholesale"]',
      )
      .count(),
    0,
  );
  assert.equal(
    await page.locator("[data-new-hero7-breadcrumb]:visible").count(),
    0,
  );
}
const browser = await chromium.launch({ channel: "chrome", headless: true });
async function fixture(width, route, options, run) {
  const test = await createHeroStudyFixture(
    browser,
    baseURL,
    width,
    "dark",
    "en",
    options,
  );
  try {
    if (options.height)
      await test.page.setViewportSize({ width, height: options.height });
    await test.page.goto(`${baseURL}${route}`, {
      waitUntil: "domcontentloaded",
    });
    await run(test);
    assert.deepEqual(
      test.errors,
      [],
      "No client errors or unexpected API reads",
    );
    assert.deepEqual(test.writes, [], "No live commerce writes");
  } catch (error) {
    console.error("Navigation failure at", test.page.url());
    await test.page.screenshot({ path: `${evidence}/failure.png` });
    throw error;
  } finally {
    test.release();
    await test.context.close();
  }
}
await mkdir(evidence, { recursive: true });
try {
  await fixture(
    1512,
    "/new-hero7",
    { height: 709, deviceScaleFactor: 2 },
    async ({ page }) => {
      await ready(page, "home");
      await contract(page);
      await page.evaluate(() => {
        window.__navDocument = document.documentElement;
        window.__navHeader = document.querySelector("[data-new-hero7-header]");
      });
      for (const [hook, key] of [
        ["samples", "samples"],
        ["explore", "matcha"],
      ]) {
        const link = page.locator(`[data-new-hero7-${hook}]`);
        assert.equal(await link.getAttribute("href"), `/new-hero7?view=${key}`);
        await link.click();
        await ready(page, key);
        await contract(page);
        assert.equal(
          await page.evaluate(
            () =>
              window.__navDocument === document.documentElement &&
              window.__navHeader ===
                document.querySelector("[data-new-hero7-header]"),
          ),
          true,
          "Local hero actions retain the document and header",
        );
        await page.goBack();
        await ready(page, "home");
      }
      const lower = page.locator(
        '[data-new-hero7-home-sections] [data-new-hero-section="samples"] a[href="/new-hero7?view=samples"]',
      );
      await lower.scrollIntoViewIfNeeded();
      const lowerScroll = await page.evaluate(() => scrollY);
      await lower.click();
      await ready(page, "samples");
      await page.goBack();
      await ready(page, "home");
      await eventually(
        async () =>
          Math.abs((await page.evaluate(() => scrollY)) - lowerScroll) <= 2,
        "Back restores the lower section scroll",
      );
      assert.equal(
        await page
          .locator(
            '[data-new-hero7-home-sections] [data-new-hero-section="origin"] a[href="/origins"]',
          )
          .count(),
        1,
      );
      await page.locator("[data-new-hero7-explore]").click();
      await ready(page, "matcha");
      await page.locator('[data-new-hero7-application="barista"]').click();
      const product = page.locator("[data-new-hero7-product-dialog][open]");
      await product.waitFor();
      assert.equal(
        await product.evaluate((node) => node.matches(":modal")),
        true,
      );
      await product
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await product.locator("[data-new-hero7-product-close]").click();
      await product.waitFor({ state: "hidden" });
      await page.locator('[data-new-hero7-next="samples"]').click();
      await ready(page, "samples");
      await view(page, "samples")
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await page.locator('[data-new-hero7-sample-tab="barista"]').click();
      const reader = page.locator("[data-new-hero7-sample-dialog][open]");
      await reader.waitFor();
      assert.equal(
        await reader.evaluate((node) => node.matches(":modal")),
        true,
      );
      await reader.locator("[data-new-hero7-sample-close]").click();
      const before = page.url();
      const origin = await menuLink(page, "origins");
      await origin.click();
      const originReader = page.locator("[data-origins-dialog][open]");
      await originReader.waitFor();
      assert.equal(
        await originReader.evaluate((node) => node.matches(":modal")),
        true,
        "Standard Origins opens its original native reader",
      );
      await page.keyboard.press("Escape");
      await originReader.waitFor({ state: "hidden" });
      await eventually(
        () => Promise.resolve(page.url() === before),
        "Origins dismissal restores the selection URL",
      );
      assert.equal(
        await view(page, "samples")
          .locator('output[aria-label="Set quantity"]')
          .textContent(),
        "2",
      );
      for (const key of ["shop", "samples", "about"]) {
        await (await menuLink(page, key)).click();
        await page.waitForURL((url) => url.pathname === destinations[key]);
        await page.goBack();
        await ready(page, "samples");
      }
      await eventually(
        () =>
          view(page, "samples")
            .locator('[data-masked="true"]')
            .count()
            .then((count) => count === 3),
        "All three sample thumbnails are masked",
      );
      const headerBox = await header(page).boundingBox();
      const contentBox = await view(page, "samples").boundingBox();
      assert.ok(
        Math.abs(headerBox.x - contentBox.x) <= 1 &&
          Math.abs(headerBox.width - contentBox.width) <= 1,
        "Restored standard header and selection content share their gutter",
      );
      await page.screenshot({
        path: `${evidence}/1512-dark-samples-standard-navigation.png`,
      });
      await writeFile(
        `${evidence}/1512-dark-samples-standard-navigation.json`,
        JSON.stringify({ header: headerBox, content: contentBox }, null, 2),
      );
      console.log(
        "Desktop canonical navigation, original Origins reader, local selection flow and final aligned masked Samples proof passed",
      );
    },
  );
  await fixture(390, "/new-hero7/samples", {}, async ({ page }) => {
    await ready(page, "samples");
    await contract(page);
    const origin = await menuLink(page, "origins");
    const before = page.url();
    await origin.click();
    const reader = page.locator("[data-origins-dialog][open]");
    await reader.waitFor();
    await page.keyboard.press("Escape");
    await reader.waitFor({ state: "hidden" });
    await eventually(
      () => Promise.resolve(page.url() === before),
      "Mobile reader returns to the dedicated selection route",
    );
    assert.equal(
      await header(page).locator("details").getAttribute("open"),
      null,
    );
    await (await menuLink(page, "about")).click();
    await page.waitForURL((url) => url.pathname === "/about");
    await page.goBack();
    await ready(page, "samples");
    await header(page).locator("[data-nav-brand]").click();
    await ready(page, "home");
    await page.locator("[data-new-hero7-explore]").click();
    await ready(page, "matcha");
    await contract(page);
    await page.screenshot({
      path: `${evidence}/390-dark-application-standard-navigation.png`,
    });
    console.log(
      "Dedicated/mobile canonical navigation and local application entry passed",
    );
  });
  for (const route of ["/new-hero7?view=samples", "/new-hero7/samples"]) {
    await fixture(
      1366,
      route,
      { holdMutation: true, height: 768 },
      async (test) => {
        const { page } = test;
        await ready(page, "samples");
        const add = view(page, "samples").locator(
          "[data-sample-purchase] button[data-available]",
        );
        await eventually(() => add.isEnabled(), "Fixture purchase is ready");
        await add.click();
        await eventually(
          () => Promise.resolve(test.simulatedWrites.length === 1),
          "Only the held fixture receives the order",
        );
        const before = page.url();
        for (const link of await page
          .locator("[data-new-hero7-header] a, [data-new-hero7-footer] a")
          .all())
          await link.evaluate((node) => node.click());
        assert.equal(
          page.url(),
          before,
          "Pending order blocks every standard header/footer link",
        );
        assert.equal(
          await page.locator("[data-origins-dialog][open]").count(),
          0,
        );
        assert.equal(await view(page, "samples").count(), 1);
        assert.equal(test.simulatedWrites.length, 1);
        test.releaseMutation();
        await eventually(
          () => add.isEnabled(),
          "Rejected fixture order releases navigation",
        );
        await (await menuLink(page, "shop")).click();
        await page.waitForURL((url) => url.pathname === "/shop");
      },
    );
  }
  console.log(
    "Query and dedicated standard navigation retain pending commerce guards",
  );
  await fixture(1366, "/new-hero7", {}, async ({ page }) => {
    await ready(page, "home");
    for (const [removed, canonical] of [
      ["origins", "/origins"],
      ["wholesale", "/shop"],
    ]) {
      for (const path of [
        `/new-hero7/${removed}`,
        `/new-hero7?view=${removed}`,
      ]) {
        await page.goto(`${baseURL}${path}`, { waitUntil: "domcontentloaded" });
        await page.waitForURL((url) => url.pathname === canonical);
      }
      await page.goto(`${baseURL}/new-hero7`, {
        waitUntil: "domcontentloaded",
      });
      await ready(page, "home");
      await page.evaluate((removed) => {
        history.pushState(null, "", `/new-hero7?view=${removed}`);
        dispatchEvent(new PopStateEvent("popstate"));
      }, removed);
      await page.waitForURL((url) => url.pathname === canonical);
    }
    console.log(
      "Legacy dedicated, query and client-history destinations redirect to canonical pages",
    );
  });
} finally {
  await browser.close();
}
