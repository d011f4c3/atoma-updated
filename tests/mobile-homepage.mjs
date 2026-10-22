/* Dedicated phone homepage: selection, navigation, popup return and responsive access. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { createHeroStudyFixture } from "./hero-cx-fixtures.mjs";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.MOBILE_HOMEPAGE_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.MOBILE_HOMEPAGE_EVIDENCE ?? ".local/mobile-0255/tests";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
const geometries = [];
await mkdir(evidence, { recursive: true });

async function ready(page, path = "/") {
  await page.goto(`${baseURL}${path}`);
  await page.locator("[data-hero-loader]").waitFor({ state: "detached" });
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("footer [data-theme-switcher]")].at(-1)
        ?.disabled === false,
  );
  await page.evaluate(() => document.fonts.ready);
}

async function inspectPhone(page, label) {
  assert.equal(await page.locator("h1:visible").count(), 1);
  assert.equal(await page.locator("[data-mobile-home-hero]").isVisible(), true);
  assert.equal(await page.locator("[data-new-hero7-hero]").isVisible(), false);
  assert.equal(
    await page.locator("[data-mobile-home-sections]").isVisible(),
    true,
  );
  const geometry = await page.evaluate(() => {
    const hero = document.querySelector("[data-mobile-home-hero]");
    const rect = (node) => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height, bottom: y + height };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      scrollWidth: document.documentElement.scrollWidth,
      hero: rect(hero),
      heading: rect(hero.querySelector("h1")),
      preview: rect(hero.querySelector("[data-mobile-hero-preview]")),
      actions: Array.from(hero.querySelectorAll("a,button")).map((node) => ({
        role: node.getAttribute("role") ?? node.tagName.toLowerCase(),
        label: node.getAttribute("data-mobile-hero-choice") ?? node.textContent,
        ...rect(node),
      })),
    };
  });
  assert.ok(
    geometry.scrollWidth <= geometry.viewport.width + 1,
    `${label}: no horizontal overflow`,
  );
  for (const action of geometry.actions) {
    assert.ok(
      action.width >= 44 && action.height >= 44,
      `${label}: comfortable target ${action.label}`,
    );
    assert.ok(
      action.x >= -1 && action.x + action.width <= geometry.viewport.width + 1,
      `${label}: action fits the phone`,
    );
  }
  geometries.push({ label, ...geometry });
  await page.screenshot({ path: `${evidence}/${label}.png`, fullPage: true });
}

async function run(label, width, tone, locale, options, callback) {
  const fixture = await createHeroStudyFixture(
    browser,
    baseURL,
    width,
    tone,
    locale,
    options,
  );
  try {
    await callback(fixture);
    assert.deepEqual(
      fixture.errors,
      [],
      `${label}: no client errors or unexpected reads`,
    );
    assert.deepEqual(
      fixture.writes,
      [],
      `${label}: no live commerce mutations`,
    );
    results.push(label);
    console.log(`Mobile homepage passed: ${label}`);
  } catch (error) {
    await fixture.page.screenshot({ path: `${evidence}/${label}-failure.png` });
    throw error;
  } finally {
    fixture.release();
    await fixture.context.close();
  }
}

try {
  await run(
    "390-dark-interactions",
    390,
    "dark",
    "en",
    {},
    async ({ page }) => {
      await ready(page);
      await inspectPhone(page, "390-dark");
      const preview = page.locator("[data-mobile-hero-preview]");
      const learn = page.locator("[data-mobile-hero-learn]");
      const popup = page.locator("[data-new-hero7-home-product-dialog]");
      const close = page.locator("[data-new-hero7-home-product-close]");
      const initialURL = page.url();
      const initialScroll = await page.evaluate(() => scrollY);
      const initialHeight = (await preview.boundingBox()).height;
      const imagePositions = new Set();

      for (const item of SAMPLE_SET_CONTENTS) {
        await page.locator(`[data-mobile-hero-choice="${item.key}"]`).tap();
        assert.equal(
          await preview.getAttribute("data-mobile-hero-preview"),
          item.key,
        );
        assert.match(await learn.textContent(), new RegExp(item.name));
        assert.match(await learn.textContent(), new RegExp(item.productCode));
        assert.equal(
          await page
            .locator('[data-mobile-hero-choice][aria-selected="true"]')
            .count(),
          1,
        );
        assert.equal(
          await page.locator('[data-mobile-hero-choice][tabindex="0"]').count(),
          1,
        );
        imagePositions.add(
          await preview
            .locator("img")
            .evaluate((node) => getComputedStyle(node).left),
        );
        assert.equal(page.url(), initialURL, "Preview choices do not navigate");
        assert.equal(
          await page.evaluate(() => scrollY),
          initialScroll,
          "Preview choices do not move the page",
        );
        assert.ok(
          Math.abs((await preview.boundingBox()).height - initialHeight) < 1,
          "Stable preview footprint",
        );
      }
      assert.equal(
        imagePositions.size,
        3,
        "Each application uses a distinct crop",
      );

      await page.locator('[data-mobile-hero-choice="culinary"]').focus();
      for (const [key, selected] of [
        ["ArrowRight", "ceremonial"],
        ["ArrowLeft", "culinary"],
        ["Home", "ceremonial"],
        ["End", "culinary"],
      ]) {
        await page.keyboard.press(key);
        assert.equal(
          await preview.getAttribute("data-mobile-hero-preview"),
          selected,
        );
        assert.equal(
          await page
            .locator(`[data-mobile-hero-choice="${selected}"]`)
            .evaluate((node) => node === document.activeElement),
          true,
        );
      }

      for (const [attribute, view] of [
        ["data-mobile-hero-samples", "samples"],
        ["data-mobile-hero-explore", "matcha"],
      ]) {
        await page.locator(`[${attribute}]`).tap();
        await page.waitForFunction(
          (value) =>
            document
              .querySelector("[data-homepage]")
              ?.getAttribute("data-active-view") === value,
          view,
        );
        assert.equal(new URL(page.url()).searchParams.get("view"), view);
        assert.equal(
          await page
            .locator("h1:visible")
            .evaluate((node) => node === document.activeElement),
          true,
        );
        await page.locator("[data-nav-brand]:visible").click();
        await page
          .locator("[data-mobile-home-hero]")
          .waitFor({ state: "visible" });
        assert.equal(
          await preview.getAttribute("data-mobile-hero-preview"),
          "culinary",
        );
        assert.equal(
          await page
            .locator("[data-mobile-home-hero] h1")
            .evaluate((node) => node === document.activeElement),
          true,
        );
      }

      for (const dismissal of ["close", "Escape", "history"]) {
        await learn.scrollIntoViewIfNeeded();
        const top = await page.evaluate(() => scrollY);
        await learn.tap();
        await popup.waitFor({ state: "visible" });
        assert.equal(
          new URL(page.url()).searchParams.get("application"),
          "culinary",
        );
        assert.equal(
          new URL(page.url()).searchParams.get("view"),
          null,
          "Popup keeps the homepage behind it",
        );
        assert.equal(
          await page.evaluate(() => scrollY),
          top,
          "Opening does not scroll to lower content",
        );
        if (dismissal === "close") await close.tap();
        else if (dismissal === "history") await page.goBack();
        else await page.keyboard.press("Escape");
        await popup.waitFor({ state: "hidden" });
        assert.equal(new URL(page.url()).search, "");
        assert.equal(await page.evaluate(() => scrollY), top);
        assert.equal(
          await learn.evaluate((node) => node === document.activeElement),
          true,
        );
        assert.equal(
          await preview.getAttribute("data-mobile-hero-preview"),
          "culinary",
        );
      }
      await page.goForward();
      await popup.waitFor({ state: "visible" });
      await page.keyboard.press("Escape");
      await popup.waitFor({ state: "hidden" });
      await page.locator('[data-mobile-hero-choice="barista"]').tap();
      await page.goForward();
      await popup.waitFor({ state: "visible" });
      assert.equal(
        await preview.getAttribute("data-mobile-hero-preview"),
        "culinary",
        "Restored product history updates the hero preview",
      );
      await page.keyboard.press("Escape");
      await popup.waitFor({ state: "hidden" });
      assert.equal(
        await learn.evaluate((node) => node === document.activeElement),
        true,
      );
    },
  );

  for (const [width, height, tone, locale] of [
    [320, 568, "dark", "en"],
    [430, 932, "light", "ja"],
  ]) {
    await run(
      `${width}-${tone}-${locale}`,
      width,
      tone,
      locale,
      {},
      async ({ page }) => {
        await page.setViewportSize({ width, height });
        await ready(page);
        await inspectPhone(page, `${width}-${tone}-${locale}`);
        await page.addStyleTag({
          content: "html { font-size: 200% !important; }",
        });
        await inspectPhone(page, `${width}-${tone}-${locale}-200pct`);
        await page.locator("[data-mobile-hero-samples]").tap();
        await page.waitForFunction(
          () =>
            document
              .querySelector("[data-homepage]")
              ?.getAttribute("data-active-view") === "samples",
        );
        assert.equal(await page.locator("h1:visible").count(), 1);
      },
    );
  }

  await run("desktop-and-study", 1440, "light", "en", {}, async ({ page }) => {
    await ready(page);
    assert.equal(
      await page.locator("[data-mobile-home-hero]").isVisible(),
      false,
    );
    assert.equal(
      await page.locator("[data-mobile-home-sections]").isVisible(),
      false,
    );
    assert.equal(await page.locator("[data-new-hero7-hero]").isVisible(), true);
    assert.equal(await page.locator("h1:visible").count(), 1);
    await page.setViewportSize({ width: 390, height: 844 });
    await ready(page, "/new-hero7");
    assert.equal(await page.locator("[data-mobile-home-hero]").count(), 0);
    assert.equal(await page.locator("[data-new-hero7-hero]").isVisible(), true);
  });

  await run(
    "normal-motion-readiness",
    390,
    "dark",
    "en",
    { holdImages: true },
    async (fixture) => {
      const { page } = fixture;
      await page.goto(baseURL, { waitUntil: "domcontentloaded" });
      await page.locator("[data-hero-loader]").waitFor({ state: "visible" });
      await page
        .locator("[data-homepage][inert]")
        .waitFor({ state: "attached" });
      assert.equal(await page.locator("[data-homepage][inert]").count(), 1);
      fixture.releaseImages();
      await page.locator("[data-hero-loader]").waitFor({ state: "detached" });
      await page.waitForFunction(
        () =>
          document.querySelector("[data-mobile-hero-preview] img")?.complete,
      );
      assert.equal(await page.locator("[data-homepage][inert]").count(), 0);
      await page.locator('[data-mobile-hero-choice="ceremonial"]').tap();
      assert.equal(
        await page
          .locator("[data-mobile-hero-preview]")
          .getAttribute("data-mobile-hero-preview"),
        "ceremonial",
      );
    },
  );

  await run(
    "failed-image",
    390,
    "dark",
    "en",
    { failImages: true },
    async ({ page }) => {
      await ready(page);
      assert.equal(
        await page.locator("[data-mobile-home-hero] [role=status]").isVisible(),
        true,
      );
      await page.locator('[data-mobile-hero-choice="culinary"]').tap();
      await page.locator("[data-mobile-hero-learn]").tap();
      await page
        .locator("[data-new-hero7-home-product-dialog]")
        .waitFor({ state: "visible" });
      await page.keyboard.press("Escape");
    },
  );
  await writeFile(
    `${evidence}/report.json`,
    JSON.stringify({ results, geometries }, null, 2),
  );
} finally {
  await browser.close();
}
