/* Real entrance frames and interaction continuity; all commerce is isolated.
   The loader/reduced-motion/no-script failure matrix lives in homepage-motion.mjs. */
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
const baseURL =
  process.env.STOREFRONT_MOTION_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.STOREFRONT_MOTION_EVIDENCE ?? ".local/motion-0277/storefront";
const requested =
  process.env.STOREFRONT_MOTION_CASES?.split(",").filter(Boolean);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
await mkdir(evidence, { recursive: true });

async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 35));
  }
  assert.fail(message);
}

async function installProbe(page) {
  await page.addInitScript(() => {
    const log = (window.__storefrontMotion = {
      frames: [],
      animations: [],
      loaderMounts: 0,
      controls: [],
    });
    for (const type of ["pointerdown", "focusin", "pointerup", "click"]) {
      document.addEventListener(
        type,
        (event) => {
          const product =
            event.target instanceof Element &&
            event.target.closest("[data-wholesale-product]");
          if (!product) return;
          const button = product.querySelector(
            '[aria-label="Increase quantity"]',
          );
          const box = button?.getBoundingClientRect();
          log.controls.push({
            type,
            at: performance.now(),
            target:
              event.target.getAttribute("aria-label") ?? event.target.tagName,
            product: product.getAttribute("data-wholesale-product"),
            reveal: product.getAttribute("data-page-reveal-state"),
            x: event.clientX,
            y: event.clientY,
            button: box
              ? { x: box.x, y: box.y, width: box.width, height: box.height }
              : null,
          });
        },
        true,
      );
    }
    let loaderPresent = false;
    const visible = (node) =>
      node.getClientRects().length && !node.closest("[hidden]");
    const key = (node) => {
      if (node.matches("[data-new-hero7-material] img")) return "home:image";
      if (node.hasAttribute("data-hero-stage")) {
        const hero = node.closest(
          "[data-mobile-home-hero], [data-new-hero7-hero]",
        );
        const stage = node.getAttribute("data-hero-stage");
        const siblings = [
          ...hero.querySelectorAll(`[data-hero-stage="${stage}"]`),
        ];
        return `home:${stage}:${siblings.indexOf(node)}`;
      }
      if (node.matches("[data-wholesale-collection-heading]"))
        return "wholesale:heading";
      if (node.matches("[data-wholesale-product]"))
        return `wholesale:card:${node.getAttribute("data-wholesale-product")}`;
      if (node.matches("[data-wholesale-image] > div"))
        return `wholesale:object:${node.closest("[data-wholesale-product]").getAttribute("data-wholesale-product")}`;
      if (node.matches("[data-wholesale-why-reason]"))
        return `wholesale:why:${[...document.querySelectorAll("[data-wholesale-why-reason]")].indexOf(node)}`;
      if (node.matches("[data-wholesale-why-action]"))
        return "wholesale:why-action";
      return null;
    };
    document.addEventListener("animationstart", (event) => {
      if (!(event.target instanceof Element) || !visible(event.target)) return;
      const target = key(event.target);
      if (target)
        log.animations.push({
          key: target,
          at: performance.now(),
          name: event.animationName,
        });
    });
    new MutationObserver(() => {
      const present = Boolean(document.querySelector("[data-hero-loader]"));
      if (present && !loaderPresent) log.loaderMounts++;
      loaderPresent = present;
    }).observe(document, { subtree: true, childList: true });
    const started = performance.now();
    const frame = () => {
      const nodes = document.querySelectorAll(
        "[data-hero-stage], [data-new-hero7-material] img, [data-wholesale-collection-heading], [data-wholesale-product], [data-wholesale-image] > div, [data-wholesale-why-reason], [data-wholesale-why-action]",
      );
      const targets = {};
      for (const node of nodes) {
        if (!visible(node)) continue;
        const style = getComputedStyle(node);
        let opacity = 1;
        for (let parent = node; parent; parent = parent.parentElement)
          opacity *= Number(getComputedStyle(parent).opacity);
        const box = node.getBoundingClientRect();
        targets[key(node)] = {
          opacity,
          translate: style.translate,
          transform: style.transform,
          clipPath: style.clipPath,
          width: box.width,
          height: box.height,
          inView: box.bottom > 0 && box.top < innerHeight,
        };
      }
      log.frames.push({
        at: performance.now(),
        loader: Boolean(document.querySelector("[data-hero-loader]")),
        targets,
      });
      if (performance.now() - started < 30000 && log.frames.length < 1800)
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

async function fixture(label, width, tone, run, options = {}) {
  if (requested && !requested.includes(label)) return;
  const test = await createHeroStudyFixture(
    browser,
    baseURL,
    width,
    tone,
    "en",
    { reducedMotion: "no-preference", ...options },
  );
  try {
    await installProbe(test.page);
    await run(test);
    assert.deepEqual(
      test.errors,
      [],
      "No client errors or unexpected requests",
    );
    assert.deepEqual(test.writes, [], "No live commerce writes");
    results.push({ label, status: "passed" });
    console.log(`PASS ${label}`);
  } catch (error) {
    results.push({ label, status: "failed", message: error.stack });
    console.error(`FAIL ${label}: ${error.message}`);
    await test.page
      .screenshot({ path: `${evidence}/${label}-failed.png`, fullPage: true })
      .catch(() => {});
  } finally {
    const frames = await test.page
      .evaluate(() => window.__storefrontMotion)
      .catch(() => null);
    await writeFile(
      `${evidence}/${label}.json`,
      JSON.stringify(frames, null, 2),
    );
    test.release();
    await test.context.close();
  }
}

const probe = (page) => page.evaluate(() => window.__storefrontMotion);
const hero = (page) =>
  page.locator(
    "[data-mobile-home-hero]:visible, [data-new-hero7-hero]:visible",
  );
const handle = (key) =>
  SAMPLE_SET_CONTENTS.find((item) => item.key === key).productHandle;
const card = (page, key) =>
  page.locator(`[data-wholesale-product="${handle(key)}"]`);
const countStarts = (log, prefix) =>
  log.animations.filter((entry) => entry.key.startsWith(prefix)).length;

function revealProgress(target) {
  const insets = [...target.clipPath.matchAll(/([\d.]+)%/g)].map((match) =>
    Number(match[1]),
  );
  return target.opacity * (1 - Math.max(0, ...insets) / 100);
}

function assertReveal(log, key, after = 0, withoutLoader = false) {
  const frames = log.frames.filter(
    (frame) =>
      frame.at >= after &&
      (!withoutLoader || !frame.loader) &&
      frame.targets[key]?.inView,
  );
  const moving = frames.filter((frame) => {
    const target = frame.targets[key];
    const progress = revealProgress(target);
    return progress > 0.01 && progress < 0.98;
  });
  assert.ok(
    moving.length >= 2,
    `${key} has observable intermediate reveal frames`,
  );
  assert.ok(
    new Set(
      moving.map((frame) => revealProgress(frame.targets[key]).toFixed(3)),
    ).size >= 2,
    `${key} visibly progresses rather than remaining obscured`,
  );
  return frames;
}

function entranceStart(log, key) {
  const frames = log.frames.filter(
    (frame) => !frame.loader && frame.targets[key]?.inView,
  );
  const minimum = Math.min(
    ...frames.map((frame) => revealProgress(frame.targets[key])),
  );
  return frames.find(
    (frame) => revealProgress(frame.targets[key]) > minimum + 0.05,
  )?.at;
}

async function settleHero(page) {
  await page.locator("[data-hero-loader]").waitFor({ state: "detached" });
  await eventually(
    () =>
      hero(page)
        .locator("[data-hero-stage]")
        .evaluateAll(
          (nodes) =>
            nodes.length > 0 &&
            nodes.every((node) => node.hasAttribute("data-page-enter-done")),
        ),
    "Hero stages finish after readiness",
  );
}

async function toggleTheme(page) {
  let toggle = page.locator("[data-theme-switcher]:visible").first();
  if (!(await toggle.count())) {
    await page.locator("[data-nav-toggle]:visible").click();
    toggle = page.locator("[data-theme-switcher]:visible").first();
  }
  await toggle.click();
  const menu = page.locator("[data-nav-toggle][aria-expanded=true]:visible");
  if (await menu.count()) await menu.click();
}

async function homeCase({ page, releaseImages }) {
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("[data-hero-loader]").waitFor();
  assert.ok(
    Number(
      await page.locator("[data-hero-loader]").getAttribute("aria-valuenow"),
    ) < 100,
    "Held images keep readiness incomplete",
  );
  releaseImages();
  await page.locator("[data-hero-loader]").waitFor({ state: "detached" });
  await eventually(
    () =>
      hero(page)
        .locator('[data-hero-stage="object"]')
        .first()
        .evaluate((node) => {
          const percentages = [
            ...getComputedStyle(node).clipPath.matchAll(/([\d.]+)%/g),
          ].map((match) => Number(match[1]));
          const remaining = Math.max(0, ...percentages);
          return remaining > 20 && remaining < 80;
        }),
    "The live photograph mask reaches an intermediate frame",
  );
  await page.screenshot({
    path: `${evidence}/home-${page.viewportSize().width}-mid-mask.png`,
  });
  await settleHero(page);
  const initial = await probe(page);
  assert.equal(
    await hero(page)
      .locator(
        '[data-hero-stage="caption"] [data-scramble-glyph], [data-hero-stage="actions"] [data-scramble-glyph]',
      )
      .count(),
    0,
    "Application captions and actions use settled text",
  );
  for (const stage of [
    "heading",
    "description",
    "object",
    "actions",
    "caption",
  ])
    assertReveal(initial, `home:${stage}:0`, 0, true);
  for (const index of page.viewportSize().width < 500 ? [0, 1, 2] : [0]) {
    const frames = initial.frames
      .filter(
        (frame) =>
          !frame.loader && frame.targets[`home:object:${index}`]?.inView,
      )
      .map((frame) => frame.targets[`home:object:${index}`]);
    for (const dimension of ["width", "height"]) {
      const values = frames.map((frame) => frame[dimension]);
      assert.ok(
        Math.max(...values) - Math.min(...values) < 0.5,
        "Hero photographs keep their final size throughout their reveal",
      );
    }
  }
  const start = (stage, index = 0) =>
    entranceStart(initial, `home:${stage}:${index}`);
  assert.ok(
    start("heading") < start("object") && start("object") < start("caption"),
    "The heading, imagery and captions arrive in order",
  );
  if (page.viewportSize().width < 500) {
    for (const index of [1, 2]) {
      assertReveal(initial, `home:object:${index}`, 0, true);
      assertReveal(initial, `home:caption:${index}`, 0, true);
      assert.ok(
        start("object", index) > start("object", index - 1),
        "Mobile objects arrive in sequence",
      );
    }
  }
  const starts = countStarts(initial, "home:");
  await toggleTheme(page);
  const opener =
    page.viewportSize().width < 500
      ? page.locator('[data-mobile-hero-learn="barista"]')
      : page.locator('[data-new-hero7-home-application="barista"]');
  await opener.click();
  const dialog = page.locator("[data-new-hero7-home-product-dialog][open]");
  await dialog.waitFor();
  await dialog.locator("[data-new-hero7-home-product-close]").click();
  await dialog.waitFor({ state: "detached" });
  await page
    .locator(
      "[data-mobile-hero-samples]:visible, [data-new-hero7-samples]:visible",
    )
    .click();
  await page.locator('[data-new-hero7-view="samples"]:visible').waitFor();
  await page.goBack();
  await hero(page).waitFor();
  await hero(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  const returned = await probe(page);
  assert.equal(
    countStarts(returned, "home:"),
    starts,
    "Theme, dialog and in-place return never replay the hero",
  );
  assert.equal(
    returned.loaderMounts,
    initial.loaderMounts,
    "In-place navigation does not restart loading",
  );
  await page.screenshot({
    path: `${evidence}/home-${page.viewportSize().width}-settled.png`,
  });
}

async function wholesaleCase({ page }) {
  await page.goto(`${baseURL}/wholesale`, { waitUntil: "domcontentloaded" });
  await eventually(
    async () => (await page.locator("[data-wholesale-product]").count()) === 3,
    "Fixture catalog is ready",
  );
  const first = page.locator("[data-wholesale-product]").first();
  const firstHandle = await first.getAttribute("data-wholesale-product");
  await eventually(
    () =>
      first.evaluate(
        (node) => node.getAttribute("data-page-reveal-state") === "complete",
      ),
    "First catalog card finishes its arrival",
  );
  const initial = await probe(page);
  assertReveal(initial, "wholesale:heading");
  assertReveal(initial, `wholesale:card:${firstHandle}`);
  assertReveal(initial, `wholesale:object:${firstHandle}`);

  // A keyboard user can interrupt an offscreen reveal without waiting for it.
  const whyAction = page.locator("[data-wholesale-why-action]");
  assert.equal(
    await whyAction.getAttribute("data-page-reveal-state"),
    "pending",
  );
  const scrollBefore = await page.evaluate(() => scrollY);
  await whyAction.evaluate((node) => node.focus({ preventScroll: true }));
  assert.equal(
    await whyAction.evaluate(
      (node) =>
        node === document.activeElement &&
        getComputedStyle(node).opacity === "1",
    ),
    true,
    "Focus immediately reveals the actionable group",
  );
  assert.equal(
    await page.evaluate(() => scrollY),
    scrollBefore,
    "Force-reveal itself does not change scroll",
  );
  await whyAction.evaluate((node) => node.blur());
  const revealAfter = await page.evaluate(() => performance.now());
  const reason = page.locator("[data-wholesale-why-reason]").first();
  await reason.scrollIntoViewIfNeeded();
  await eventually(
    () =>
      reason.evaluate(
        (node) => node.getAttribute("data-page-reveal-state") === "complete",
      ),
    "Why ATOMA reveals on scroll",
  );
  assertReveal(await probe(page), "wholesale:why:0", revealAfter);

  const barista = card(page, "barista");
  await barista.scrollIntoViewIfNeeded();
  await barista
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  const quantity = barista.locator("[data-wholesale-quantity]");
  await eventually(
    async () => (await quantity.textContent()).trim() === "2",
    "A single quantity click succeeds during the product reveal",
  );
  await eventually(
    () =>
      barista.evaluate(
        (node) => node.getAttribute("data-page-reveal-state") === "complete",
      ),
    "The interrupted product is settled",
  );
  const before = await probe(page);
  const cardKey = `wholesale:card:${handle("barista")}`;
  const cardStarts = countStarts(before, cardKey);
  const objectStarts = countStarts(
    before,
    `wholesale:object:${handle("barista")}`,
  );
  await page.locator('[data-wholesale-image-mode="powder"]').click();
  await eventually(
    () =>
      barista.locator("[data-wholesale-image-settled]").count().then(Boolean),
    "The chosen powder image finishes its own entrance",
  );
  const search = page.locator("[data-wholesale-search]");
  if (!(await search.isVisible()))
    await page.locator("[data-wholesale-search-toggle]").click();
  await search.fill("culinary");
  await barista.waitFor({ state: "hidden" });
  await search.fill("");
  await barista.waitFor({ state: "visible" });
  await toggleTheme(page);
  await page.locator('[data-wholesale-product-trigger="barista"]').click();
  const dialog = page.locator("[data-wholesale-product-dialog][open]");
  await dialog.waitFor();
  await dialog.locator("[data-wholesale-product-close]").click();
  await dialog.waitFor({ state: "detached" });
  await page.waitForTimeout(250);
  const returned = await probe(page);
  assert.equal(
    countStarts(returned, cardKey),
    cardStarts,
    "Search, imagery, theme and dialog return never replay the settled card",
  );
  assert.equal(
    countStarts(returned, `wholesale:object:${handle("barista")}`),
    objectStarts + 1,
    "Only changing imagery restarts the product object entrance",
  );
  assert.equal(
    (await quantity.textContent()).trim(),
    "2",
    "The exact quantity survives every presentation change",
  );
  assert.equal(
    await page
      .locator('[data-wholesale-image-mode="powder"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.screenshot({
    path: `${evidence}/wholesale-${page.viewportSize().width}-settled.png`,
  });
}

async function lateImageCase({ page, releaseImages }) {
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.locator("[data-hero-loader]").waitFor();
  await settleHero(page);
  const image = page.locator("[data-new-hero7-material] img");
  assert.equal(
    await image.evaluate((node) => node.complete),
    false,
    "The fail-open entrance settles while its image is still held",
  );
  const releasedAt = await page.evaluate(() => performance.now());
  releaseImages();
  await eventually(
    () =>
      image.evaluate((node) => node.hasAttribute("data-page-image-arriving")),
    "The late photograph receives its own arrival",
  );
  await eventually(
    () =>
      image.evaluate(
        (node) =>
          node.complete &&
          node.naturalWidth > 0 &&
          !node.hasAttribute("data-page-image-arriving"),
      ),
    "The late photograph finishes visibly",
  );
  const log = await probe(page);
  const frames = log.frames.filter(
    (frame) =>
      frame.at >= releasedAt &&
      frame.targets["home:image"]?.opacity > 0.01 &&
      frame.targets["home:image"].opacity < 0.98,
  );
  assert.ok(
    frames.length >= 2,
    "A late photograph has observable fade frames after the completed entrance",
  );
  assert.ok(
    new Set(
      frames.map((frame) => frame.targets["home:image"].opacity.toFixed(3)),
    ).size >= 2,
    "The late photograph actually progresses to visible",
  );
  assert.equal(
    await image.evaluate((node) => getComputedStyle(node).opacity),
    "1",
  );
  assert.equal(
    log.loaderMounts,
    1,
    "Late readiness does not remount the loader",
  );
}

try {
  await fixture("home-1440-light", 1440, "light", homeCase, {
    holdImages: true,
  });
  await fixture("home-390-dark", 390, "dark", homeCase, { holdImages: true });
  await fixture("wholesale-1440-dark", 1440, "dark", wholesaleCase);
  await fixture("wholesale-390-light", 390, "light", wholesaleCase);
  await fixture("late-hero-image", 1440, "light", lateImageCase, {
    holdImages: true,
  });
} finally {
  await browser.close();
  await writeFile(`${evidence}/results.json`, JSON.stringify(results, null, 2));
}
if (results.some((result) => result.status === "failed")) process.exitCode = 1;
