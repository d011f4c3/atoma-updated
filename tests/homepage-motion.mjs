/* Restored authored motion, with real glyph/frame observations and isolated commerce. */
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
const baseURL = process.env.HOMEPAGE_MOTION_BASE_URL ?? "http://127.0.0.1:3100";
const evidence = process.env.HOMEPAGE_MOTION_EVIDENCE ?? ".local/homepage-0253";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
const cases = process.env.HOMEPAGE_MOTION_CASES?.split(",").filter(Boolean);
const hero = (page) =>
  page.locator(
    "[data-mobile-home-hero]:visible, [data-new-hero7-hero]:visible",
  );
const heroAction = (page, action) =>
  page.locator(
    `[data-mobile-hero-${action}]:visible, [data-new-hero7-${action}]:visible`,
  );
async function eventually(check, message, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 30));
  }
  assert.fail(message);
}
async function installProbe(page) {
  await page.addInitScript(() => {
    const log = (window.__motion = {
      progress: [],
      phases: [],
      glyphs: [],
      animations: [],
      frames: [],
      loaderMounts: 0,
      loaderWasPresent: false,
    });
    const group = (node) => {
      const nav = node.closest("[data-nav-action]");
      if (nav) return `nav:${nav.getAttribute("data-nav-action")}`;
      if (node.closest("[data-nav-summary]")) return "menu";
      const heading = node.closest("h1,h2,h3");
      return heading?.tagName.toLowerCase() ?? "copy";
    };
    new MutationObserver((mutations) => {
      const loader = document.querySelector("[data-hero-loader]");
      if (loader) {
        if (!log.loaderWasPresent) log.loaderMounts++;
        const value = Number(loader.getAttribute("aria-valuenow"));
        if (log.progress.at(-1)?.value !== value)
          log.progress.push({
            value,
            at: performance.now(),
            fonts:
              value === 100
                ? Array.from(document.fonts).map((face) => ({
                    family: face.family,
                    weight: face.weight,
                    status: face.status,
                  }))
                : undefined,
          });
        const phase = loader.getAttribute("data-state");
        if (log.phases.at(-1)?.phase !== phase)
          log.phases.push({ phase, at: performance.now() });
      } else if (log.loaderWasPresent)
        log.phases.push({ phase: "done", at: performance.now() });
      log.loaderWasPresent = Boolean(loader);
      for (const mutation of mutations) {
        const target =
          mutation.target instanceof Element
            ? mutation.target
            : mutation.target.parentElement;
        const glyph = target?.closest("[data-scramble-glyph]");
        if (
          !glyph ||
          !glyph.checkVisibility({
            checkOpacity: true,
            checkVisibilityCSS: true,
          }) ||
          glyph.closest("[hidden],[inert]")
        )
          continue;
        const source = glyph.previousElementSibling?.textContent ?? "";
        if (glyph.textContent !== source && log.glyphs.length < 5000)
          log.glyphs.push({
            group: group(glyph),
            at: performance.now(),
            value: glyph.textContent,
            source,
          });
      }
    }).observe(document, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["data-state", "aria-valuenow", "inert"],
    });
    document.addEventListener("animationstart", (event) => {
      const node = event.target;
      if (!(node instanceof Element)) return;
      log.animations.push({
        name: event.animationName,
        at: performance.now(),
        tag: node.tagName,
        enter: node.getAttribute("data-page-enter"),
        reveal: node.getAttribute("data-page-reveal"),
        hero: Boolean(
          node.closest("[data-mobile-home-hero], [data-new-hero7-hero]"),
        ),
        loader: Boolean(document.querySelector("[data-hero-loader]")),
      });
    });
    const opacity = (node) => {
      let result = 1;
      for (let current = node; current; current = current.parentElement)
        result *= Number(getComputedStyle(current).opacity);
      return result;
    };
    const start = performance.now();
    function frame() {
      const visibleHero = Array.from(
        document.querySelectorAll(
          "[data-mobile-home-hero], [data-new-hero7-hero]",
        ),
      ).find((node) => node.getClientRects().length > 0);
      const heading = visibleHero?.querySelector("h1");
      const material = visibleHero?.querySelector('[data-page-enter="visual"]');
      const loader = document.querySelector("[data-hero-loader]");
      if (heading && material && log.frames.length < 700)
        log.frames.push({
          at: performance.now(),
          loader: loader?.getAttribute("data-state") ?? null,
          headingOpacity: opacity(heading),
          materialOpacity: opacity(material),
          loaderOpacity: loader ? opacity(loader) : null,
          headingAnimation: getComputedStyle(heading).animationName,
          materialAnimation: getComputedStyle(material).animationName,
        });
      if (performance.now() - start < 12000) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}
async function fixture(label, width, tone, options, run) {
  if (cases && !cases.includes(label)) return;
  const test = await createHeroStudyFixture(
    browser,
    baseURL,
    width,
    tone,
    "en",
    { reducedMotion: "no-preference", ...options },
  );
  try {
    if (options.javaScriptEnabled !== false) await installProbe(test.page);
    await run(test);
    assert.deepEqual(
      test.errors,
      [],
      "No client errors or unexpected requests",
    );
    assert.deepEqual(test.writes, [], "No live commerce writes");
    if (options.javaScriptEnabled !== false) {
      const motion = await test.page.evaluate(() => window.__motion);
      await writeFile(
        `${evidence}/${label}.json`,
        JSON.stringify(motion, null, 2),
      );
    }
    results.push(label);
    console.log(`Motion passed: ${label}`);
  } catch (error) {
    console.error("Motion failure", label, test.page.url());
    await test.page.screenshot({ path: `${evidence}/${label}-failure.png` });
    if (options.javaScriptEnabled !== false)
      await writeFile(
        `${evidence}/${label}-failure.json`,
        JSON.stringify(
          await test.page.evaluate(() => window.__motion),
          null,
          2,
        ),
      );
    throw error;
  } finally {
    test.release();
    await test.context.close();
  }
}
async function hydrated(page) {
  await eventually(
    () => page.locator("footer [data-theme-switcher]").last().isEnabled(),
    "The page is hydrated",
  );
  await page.evaluate(() => document.fonts.ready);
}
async function released(page) {
  await page.locator("[data-hero-loader]").waitFor({ state: "detached" });
  await hydrated(page);
  assert.equal(
    await hero(page).evaluate((node) =>
      Boolean(node.closest("[inert],[aria-hidden='true']")),
    ),
    false,
  );
}
async function settled(scope) {
  await eventually(
    () =>
      scope.evaluate((node) =>
        Array.from(node.querySelectorAll("[data-scramble-glyph]")).every(
          (glyph) =>
            glyph.textContent === glyph.previousElementSibling?.textContent,
        ),
      ),
    "Visible source glyphs settle",
  );
}
async function painted(scope) {
  await scope.evaluate(async (node) => {
    await Promise.all(
      Array.from(node.querySelectorAll("img"))
        .filter((image) => image.checkVisibility())
        .map((image) => image.decode().catch(() => undefined)),
    );
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .filter(
          (animation) =>
            animation.effect?.getComputedTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => undefined)),
    );
    await new Promise((done) =>
      requestAnimationFrame(() => requestAnimationFrame(done)),
    );
  });
}
async function reviewSelectionVisuals(page, width, tone, description) {
  const prefix = `${evidence}/font-${width}-${tone}`;
  const style = (node) => {
    const css = getComputedStyle(node);
    return { color: css.color, weight: css.fontWeight, family: css.fontFamily };
  };
  const headingCase = async (scope) => {
    assert.equal(
      await scope
        .locator("h1,h2,h3")
        .evaluateAll((nodes) =>
          nodes.every(
            (node) => getComputedStyle(node).textTransform === "uppercase",
          ),
        ),
      true,
    );
    assert.doesNotMatch(
      await scope.innerText(),
      /AI-generated|Application reference|Illustrative profiles|Final specifications pending|Photography pending/i,
      "Customer-facing views omit internal reference-status notes",
    );
  };
  await heroAction(page, "samples").click();
  const samples = page.locator('[data-new-hero7-view="samples"]:visible');
  await samples.waitFor();
  await settled(samples);
  await painted(samples);
  if (description)
    assert.deepEqual(
      await samples.locator(":scope > header > p").evaluate(style),
      description,
      "Sample introduction matches the hero supporting-text role",
    );
  await headingCase(samples);
  const sampleAdd = samples.locator(
    "[data-new-hero7-sample-purchase] button[data-available]",
  );
  await eventually(() => sampleAdd.isEnabled(), "The set can be ordered");
  if (width >= 761)
    assert.ok(
      (await sampleAdd.boundingBox()).y +
        (await sampleAdd.boundingBox()).height <=
        900,
    );
  await page.screenshot({ path: `${prefix}-samples.png` });
  if (width < 761) {
    const contents = samples.getByRole("button", {
      name: "Inside the set",
      exact: true,
    });
    assert.equal(await contents.getAttribute("aria-expanded"), "false");
    await contents.click();
    assert.equal(await contents.getAttribute("aria-expanded"), "true");
  }
  await samples.locator('[data-new-hero7-sample-tab="ceremonial"]').click();
  const sampleDialog = samples.locator("[data-new-hero7-sample-dialog][open]");
  await sampleDialog.waitFor();
  assert.equal(
    await sampleDialog.evaluate((node) => node.matches(":modal")),
    true,
  );
  await sampleDialog
    .locator('[data-masked="true"]')
    .waitFor({ state: "attached" });
  await headingCase(sampleDialog);
  assert.equal(
    await sampleDialog
      .locator("[data-new-hero7-sample-preparation] > summary")
      .evaluate((node) => getComputedStyle(node).textTransform),
    "uppercase",
  );
  await painted(sampleDialog);
  await page.screenshot({ path: `${prefix}-sample-profile.png` });
  await sampleDialog.locator("[data-new-hero7-sample-close]").click();
  await sampleDialog.waitFor({ state: "hidden" });
  await page.goBack();
  await page.locator('[data-new-hero7-view="home"]:visible').waitFor();
  if (width >= 761) await heroAction(page, "explore").click();
  const applications = page.locator(
    width >= 761
      ? '[data-new-hero7-view="matcha"]:visible'
      : '[data-new-hero7-view="home"]:visible',
  );
  await applications.waitFor();
  if (width >= 761) {
    await settled(applications);
    await painted(applications);
    assert.deepEqual(
      await applications
        .locator(":scope > header > div:first-child > p:last-child")
        .evaluate(style),
      description,
      "Application introduction matches the hero supporting-text role",
    );
    await headingCase(applications);
    await page.screenshot({ path: `${prefix}-applications.png` });
  }
  const trigger = applications.locator(
    width >= 761
      ? '[data-new-hero7-application="barista"]'
      : '[data-mobile-hero-learn="barista"]',
  );
  await trigger.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await trigger.click();
  const dialog = applications.locator(
    width >= 761
      ? "[data-new-hero7-product-dialog][open]"
      : "[data-new-hero7-home-product-dialog][open]",
  );
  await dialog.waitFor();
  assert.equal(await dialog.evaluate((node) => node.matches(":modal")), true);
  assert.equal(await page.evaluate(() => scrollY), before);
  const product = dialog.locator('[data-new-hero-product="barista"]');
  await product.locator('[data-masked="true"]').waitFor({ state: "attached" });
  const add = product.locator("[data-new-hero-add] button");
  await eventually(
    () => add.isEnabled(),
    "Product buying controls remain usable",
  );
  for (const selector of [
    "[data-new-hero-price]",
    "[data-new-hero-format]",
    "[data-new-hero-quantity]",
    "[data-new-hero-total]",
    "[data-new-hero-add]",
  ])
    assert.ok(await product.locator(selector).first().isVisible());
  if (width >= 761) {
    const button = await add.boundingBox();
    const box = await dialog.boundingBox();
    assert.ok(
      button.y >= box.y && button.y + button.height <= box.y + box.height,
    );
  }
  await headingCase(dialog);
  if (width < 761) {
    const preparation = product.locator(
      '[data-popup-mobile-detail="preparation"]',
    );
    assert.equal(await preparation.getAttribute("open"), null);
    await preparation.locator(":scope > summary").click();
    assert.equal(await preparation.getAttribute("open"), "");
    assert.equal(await preparation.locator("p").first().isVisible(), true);
    await preparation.locator(":scope > summary").click();
    const profile = product.locator('[data-popup-mobile-detail="profile"]');
    assert.equal(await profile.getAttribute("open"), null);
    await profile.locator(":scope > summary").click();
    assert.equal(await profile.locator("dd:visible").count(), 6);
    await profile.locator(":scope > summary").click();
  } else {
    const preparation = product.locator('[data-popup-info-tab="preparation"]');
    await preparation.click();
    assert.equal(await preparation.getAttribute("aria-selected"), "true");
    assert.equal(
      await product.locator("[data-new-hero-product-profile]").isVisible(),
      true,
    );
    await product.locator('[data-popup-info-tab="overview"]').click();
  }
  await painted(dialog);
  await page.screenshot({ path: `${prefix}-product.png` });
  await dialog
    .locator(
      "[data-new-hero7-product-close], [data-new-hero7-home-product-close]",
    )
    .click();
  await dialog.waitFor({ state: "hidden" });
  assert.equal(await page.evaluate(() => scrollY), before);
  if (width >= 761) await page.goBack();
  await page.locator('[data-new-hero7-view="home"]:visible').waitFor();
}
async function observe(scope) {
  await scope.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const sources = () =>
      Array.from(node.querySelectorAll('span[class*="accessible"]')).map(
        (item) => item.textContent,
      );
    const initial = JSON.stringify(sources());
    const record = (window.__interaction = {
      changes: 0,
      sourceStable: true,
      geometryStable: true,
    });
    window.__interactionObserver?.disconnect();
    window.__interactionObserver = new MutationObserver(() => {
      const now = node.getBoundingClientRect();
      record.sourceStable &&= initial === JSON.stringify(sources());
      record.geometryStable &&=
        Math.abs(rect.width - now.width) < 0.1 &&
        Math.abs(rect.height - now.height) < 0.1;
      if (
        Array.from(node.querySelectorAll("[data-scramble-glyph]")).some(
          (glyph) =>
            glyph.textContent !== glyph.previousElementSibling?.textContent,
        )
      )
        record.changes++;
    });
    window.__interactionObserver.observe(node, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  });
}
async function animatedInteraction(page, scope, action, reduced = false) {
  await settled(scope);
  assert.ok(
    await scope.locator("[data-scramble-glyph]").count(),
    "The actual control contains authored glyph slots",
  );
  await observe(scope);
  await action();
  if (reduced) {
    await page.evaluate(
      () =>
        new Promise((done) => {
          const start = performance.now();
          function frame(now) {
            if (now - start >= 1100) done();
            else requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
        }),
    );
  } else
    await eventually(
      () => page.evaluate(() => window.__interaction.changes > 0),
      "The native interaction produces real glyph mutations",
    );
  await settled(scope);
  const record = await page.evaluate(() => window.__interaction);
  assert.equal(record.sourceStable, true, "Accessible text stays unchanged");
  assert.equal(
    record.geometryStable,
    true,
    "Animated label geometry stays fixed",
  );
  if (reduced)
    assert.equal(record.changes, 0, "Reduced motion keeps glyphs settled");
  await page.evaluate(() => window.__interactionObserver.disconnect());
}
const header = (page) => page.locator('header[data-brand-part="header"]');
await mkdir(evidence, { recursive: true });
try {
  for (const [width, tone] of [
    [1440, "light"],
    [390, "dark"],
  ]) {
    await fixture(
      `loader-${width}-${tone}`,
      width,
      tone,
      { holdImages: true },
      async (test) => {
        const { page } = test;
        await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
        const loader = page.locator("[data-hero-loader]");
        await loader.waitFor();
        await eventually(
          () => Promise.resolve(test.imageRequests() > 0),
          "The real hero image is held",
        );
        await eventually(
          async () => Number(await loader.getAttribute("aria-valuenow")) > 0,
          "Accessible percentage advances while the image is pending",
        );
        assert.ok(Number(await loader.getAttribute("aria-valuenow")) < 100);
        assert.equal(await loader.getAttribute("data-state"), "loading");
        assert.equal(
          await hero(page).evaluate((node) => Boolean(node.closest("[inert]"))),
          true,
        );
        await page.keyboard.press("Tab");
        assert.equal(
          await page.evaluate(() =>
            Boolean(document.activeElement?.closest("[inert]")),
          ),
          false,
        );
        await page.screenshot({
          path: `${evidence}/loader-${width}-${tone}.png`,
          animations: "allow",
        });
        test.releaseImages();
        await released(page);
        await hero(page)
          .locator('[data-page-enter="hero"][data-page-enter-done]')
          .waitFor();
        assert.equal(
          await hero(page).locator("h1 [data-scramble-glyph]").count(),
          0,
          "The main hero headline stays stable while its entrance animates",
        );
        assert.equal(
          await page.evaluate(() =>
            window.__motion.glyphs.some((item) => item.group === "h1"),
          ),
          false,
        );
        const progress = await page.evaluate(() =>
          window.__motion.progress.map((item) => item.value),
        );
        assert.ok(progress.length > 1 && progress.at(-1) === 100);
        assert.ok(
          progress.every(
            (value, index) =>
              value >= 0 &&
              value <= 100 &&
              (!index || value >= progress[index - 1]),
          ),
        );
        const phases = await page.evaluate(() =>
          window.__motion.phases.map((item) => item.phase),
        );
        assert.ok(
          phases.includes("leaving") && phases.at(-1) === "done",
          "The compact readout fades before leaving",
        );
        const frames = await page.evaluate(() => window.__motion.frames);
        assert.ok(
          frames.some(
            (item) =>
              item.loader === "leaving" &&
              item.loaderOpacity > 0 &&
              item.loaderOpacity < 1,
          ),
          "The loader visibly fades through intermediate frames",
        );
        assert.ok(
          frames.some(
            (item) =>
              item.loader === null &&
              item.headingOpacity > 0 &&
              item.headingOpacity < 1,
          ),
          "The hero heading reveals after the loader clears",
        );
        assert.ok(
          frames.some(
            (item) =>
              item.loader === null &&
              item.materialOpacity > 0 &&
              item.materialOpacity < 1,
          ),
          "The material reveals after the loader clears",
        );
        await settled(hero(page));
        await page.screenshot({
          path: `${evidence}/released-${width}-${tone}.png`,
        });
        const loaderMounts = await page.evaluate(
          () => window.__motion.loaderMounts,
        );
        const summary = header(page).locator("[data-nav-summary]");
        if (width < 760) {
          await animatedInteraction(page, summary, () => summary.tap());
          assert.equal(
            await header(page)
              .locator("details")
              .evaluate((node) => node.open),
            true,
          );
          const nav = header(page).locator('[data-nav-action="shop"]');
          await animatedInteraction(page, nav, () => nav.focus());
          await page.keyboard.press("Escape");
        } else {
          const nav = header(page).locator('[data-nav-action="shop"]');
          await animatedInteraction(page, nav, () => nav.hover());
          await page.mouse.move(1, 1);
          await nav.evaluate((node) => node.blur());
          await animatedInteraction(page, nav, () => nav.focus());
        }
        if (width < 760) {
          await page.locator('[data-mobile-hero-learn="barista"]').click();
        } else {
          await heroAction(page, "explore").click();
          await page
            .locator('[data-new-hero7-view="matcha"]:visible')
            .waitFor();
          await page.locator('[data-new-hero7-application="barista"]').click();
        }
        const popup = page.locator(
          width < 760
            ? "[data-new-hero7-home-product-dialog][open]"
            : "[data-new-hero7-product-dialog][open]",
        );
        await popup.waitFor();
        assert.equal(
          await popup.evaluate((node) => node.matches(":modal")),
          true,
        );
        await page.keyboard.press("Escape");
        await popup.waitFor({ state: "hidden" });
        if (width < 760) {
          await heroAction(page, "samples").click();
          await page
            .locator('[data-new-hero7-view="samples"]:visible')
            .waitFor();
        }
        await page.goBack();
        await page.locator('[data-new-hero7-view="home"]:visible').waitFor();
        assert.equal(
          await page.evaluate(() => window.__motion.loaderMounts),
          loaderMounts,
          "In-place navigation never replays the loader",
        );
        assert.equal(await page.locator("[data-hero-loader]").count(), 0);
        await page.reload({ waitUntil: "domcontentloaded" });
        await released(page);
        assert.equal(
          await page.evaluate(() => window.__motion.loaderMounts),
          1,
          "A fresh document shows the entrance again",
        );
      },
    );
  }
  await fixture("canonical-pages", 1366, "light", {}, async ({ page }) => {
    for (const route of [
      "/shop",
      "/samples",
      "/origins",
      "/about",
      `/shop/${SAMPLE_SET_CONTENTS[1].productHandle}`,
    ]) {
      await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
      await hydrated(page);
      await eventually(
        () =>
          page.evaluate(() =>
            window.__motion.glyphs.some((item) => item.group === "h1"),
          ),
        `${route} has a real animated heading`,
      );
      const nav = header(page).locator('[data-nav-action="shop"]');
      await animatedInteraction(page, nav, () => nav.hover());
      await page.mouse.move(1, 1);
      await nav.evaluate((node) => node.blur());
      await animatedInteraction(page, nav, () => nav.focus());
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
      );
      if (route === "/about" || route.startsWith("/shop/")) {
        assert.ok(
          await page.evaluate(() =>
            window.__motion.animations.some((item) => item.enter === "visual"),
          ),
          "Authored photography entrances run on the canonical page",
        );
      }
      if (route === "/origins") {
        await page.locator('[data-origin-place="kyoto"]').click();
        await page
          .locator(
            '[data-origins-directory="kyoto"] [data-page-enter="visual"]',
          )
          .waitFor();
        await eventually(
          () =>
            page.evaluate(() =>
              window.__motion.animations.some(
                (item) => item.enter === "visual",
              ),
            ),
          "Origins photography retains its reveal",
        );
      }
      await writeFile(
        `${evidence}/canonical-${route.replaceAll("/", "_")}.json`,
        JSON.stringify(await page.evaluate(() => window.__motion), null, 2),
      );
      console.log(`Canonical heading and header glyphs: ${route}`);
    }
  });
  for (const reduced of [false, true]) {
    await fixture(
      reduced ? "canonical-actions-reduced" : "canonical-actions",
      1366,
      "dark",
      { reducedMotion: reduced ? "reduce" : "no-preference" },
      async ({ page }) => {
        const checks = [
          ["/?view=samples", '[data-new-hero7-sample-tab="barista"]'],
          ["/shop", "[data-comparison-details]"],
          ["/samples", "[data-sample-purchase] details > summary"],
          ["/origins", '[data-origin-place="kyoto"]'],
          ["/about", "[data-storefront-footer] button:last-child"],
          [
            `/shop/${SAMPLE_SET_CONTENTS[0].productHandle}`,
            "[data-retail-origins] > summary",
          ],
        ];
        for (const [route, selector] of checks) {
          await page.goto(`${baseURL}${route}`, {
            waitUntil: "domcontentloaded",
          });
          await hydrated(page);
          await page.evaluate(() => document.fonts.ready);
          const action = page.locator(selector).first();
          await action.scrollIntoViewIfNeeded();
          await page.mouse.move(1, 1);
          await animatedInteraction(
            page,
            action,
            () => action.hover(),
            reduced,
          );
          if (route === "/?view=samples")
            assert.equal(
              await action.evaluate((node) =>
                [node, ...node.querySelectorAll("*")].every(
                  (item) =>
                    !getComputedStyle(item).textDecorationLine.includes(
                      "underline",
                    ),
                ),
              ),
              true,
              "Read profile uses one continuous rule, not underlined glyph spans",
            );
          await page.mouse.move(1, 1);
          await action.evaluate((node) => node.blur());
          await animatedInteraction(
            page,
            action,
            () => action.focus(),
            reduced,
          );
          console.log(
            `Page action effects: ${route} (${reduced ? "reduced" : "motion"})`,
          );
        }
      },
    );
  }

  for (const width of [1440, 390]) {
    await fixture(
      `sizing-reduced-${width}`,
      width,
      "dark",
      { reducedMotion: "reduce" },
      async ({ page }) => {
        await page.goto(`${baseURL}/new-hero7`, {
          waitUntil: "domcontentloaded",
        });
        await hydrated(page);
        const studySize = await page
          .locator("[data-new-hero7-hero] h1")
          .evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
        await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
        await released(page);
        const heading = hero(page).locator("h1");
        const homeSize = await heading.evaluate((node) =>
          parseFloat(getComputedStyle(node).fontSize),
        );
        if (width > 760)
          assert.ok(
            homeSize / studySize >= 0.85 && homeSize / studySize <= 0.86,
            "The desktop heading follows the approved smaller scale",
          );
        else
          assert.ok(
            homeSize > studySize && homeSize >= 28 && homeSize <= 40,
            "The dedicated portrait hero has a distinct, readable display scale",
          );
        const summary = header(page).locator("[data-nav-summary]");
        if (width < 760)
          await animatedInteraction(page, summary, () => summary.tap(), true);
        const nav = header(page).locator('[data-nav-action="shop"]');
        await animatedInteraction(page, nav, () => nav.focus(), true);
        await settled(heading);
        assert.deepEqual(
          await page.evaluate(() => window.__motion.glyphs),
          [],
          "Reduced-motion visits never scramble text",
        );
        assert.equal(
          await heading.evaluate((node) => getComputedStyle(node).opacity),
          "1",
        );
      },
    );
  }
  await fixture(
    "failed-hero-image",
    390,
    "light",
    { failImages: true },
    async ({ page }) => {
      await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
      await released(page);
      await hero(page)
        .locator('[data-new-hero7-image-fallback], [role="status"]')
        .waitFor();
      await heroAction(page, "samples").click();
      await page.locator('[data-new-hero7-view="samples"]:visible').waitFor();
      assert.equal(
        await page.locator("[data-hero-loader]").count(),
        0,
        "Image failure never traps selection navigation",
      );
    },
  );
  await fixture(
    "no-javascript",
    390,
    "light",
    { javaScriptEnabled: false },
    async ({ page }) => {
      await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
      assert.equal(await page.locator("[data-hero-loader]").isVisible(), false);
      const heading = hero(page).locator("h1");
      assert.equal(await heading.isVisible(), true);
      assert.equal(
        await heading.evaluate((node) => getComputedStyle(node).opacity),
        "1",
      );
      await heroAction(page, "samples").click();
      await page.locator('[data-new-hero7-view="samples"]:visible').waitFor();
      assert.equal(new URL(page.url()).pathname, "/");
      assert.equal(new URL(page.url()).searchParams.get("view"), "samples");
    },
  );
  await fixture(
    "scripts-held-fail-open",
    1440,
    "light",
    { holdScripts: true },
    async (test) => {
      const { page } = test;
      await page.goto(`${baseURL}/`, { waitUntil: "commit" });
      const loader = page.locator("[data-hero-loader]");
      await loader.waitFor();
      await eventually(
        () => Promise.resolve(test.scriptRequests() > 0),
        "Application scripts are held before hydration",
      );
      assert.equal(
        await page.locator("[data-homepage]").evaluate((node) => node.inert),
        false,
      );
      await loader.waitFor({ state: "hidden", timeout: 12000 });
      const heading = hero(page).locator("h1");
      assert.equal(
        await heading.evaluate((node) =>
          node.checkVisibility({
            checkOpacity: true,
            checkVisibilityCSS: true,
          }),
        ),
        true,
        "CSS fail-open leaves the server-rendered hero visible without hydration",
      );
      await page.screenshot({ path: `${evidence}/scripts-held-fail-open.png` });
      assert.equal(test.catalogReads(), 0);
      await heroAction(page, "samples").click({ noWaitAfter: true });
      await page.waitForURL(`${baseURL}/?view=samples`, {
        waitUntil: "commit",
      });
      await page.locator('[data-new-hero7-view="samples"]:visible').waitFor();
      assert.equal(
        test.catalogReads(),
        0,
        "Native selection remains usable while application scripts are blocked",
      );
    },
  );
  for (const [width, tone] of [
    [1440, "light"],
    [390, "dark"],
    [390, "light"],
  ]) {
    await fixture(
      `font-${width}-${tone}`,
      width,
      tone,
      {},
      async ({ page }) => {
        await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
        await released(page);
        await hero(page)
          .locator('[data-page-enter="hero"][data-page-enter-done]')
          .waitFor();
        await settled(hero(page));
        await settled(header(page));
        await painted(hero(page));
        const fonts = await page.evaluate(() => {
          const visible = (selector) =>
            Array.from(document.querySelectorAll(selector)).find(
              (node) => node.getClientRects().length > 0,
            );
          const currentHero = visible(
            "[data-mobile-home-hero], [data-new-hero7-hero]",
          );
          const style = (node) => {
            const css = getComputedStyle(node);
            const bounds = node.getBoundingClientRect();
            return {
              weight: css.fontWeight,
              size: parseFloat(css.fontSize),
              family: css.fontFamily,
              color: css.color,
              width: bounds.width,
              height: bounds.height,
              x: bounds.x,
              y: bounds.y,
            };
          };
          const header = document.querySelector(
            'header[data-brand-part="header"]',
          );
          return {
            heading: style(currentHero.querySelector("h1")),
            description: (() => {
              const node = currentHero.querySelector(
                "[data-new-hero7-description], h1 + p",
              );
              return node ? style(node) : null;
            })(),
            controlCount: currentHero.querySelectorAll("a,button").length,
            proseCount: currentHero.querySelectorAll("p:not([role=status])")
              .length,
            headings: Array.from(
              document.querySelectorAll("[data-homepage] :is(h1,h2,h3)"),
            ).map((node) => ({
              label: node.textContent,
              transform: getComputedStyle(node).textTransform,
            })),
            explore: (() => {
              const node = visible(
                "[data-mobile-hero-explore], [data-new-hero7-explore]",
              );
              if (!node) return null;
              const line = getComputedStyle(node, "::after");
              return {
                decoration: getComputedStyle(node).textDecorationLine,
                content: line.content,
                height: line.height,
                left: line.left,
                right: line.right,
                fragmentedUnderline: [node, ...node.querySelectorAll("*")].some(
                  (item) =>
                    getComputedStyle(item).textDecorationLine.includes(
                      "underline",
                    ),
                ),
              };
            })(),
            wordmark: style(header.querySelector("[data-nav-brand]")),
            nav: Array.from(
              header.querySelectorAll(
                "[data-nav-action], [data-nav-summary], [data-destination-control], [data-destination-selector], [data-destination-currency], button[aria-label^='Open cart']",
              ),
            ).map((node) => ({
              label:
                node.getAttribute("data-nav-action") ??
                node.getAttribute("aria-label") ??
                node.tagName,
              ...style(node),
            })),
            faces: Array.from(document.fonts).map((face) => ({
              family: face.family,
              weight: face.weight,
              status: face.status,
            })),
          };
        });
        assert.equal(
          fonts.heading.weight,
          "400",
          "The hero keeps its restored regular weight",
        );
        assert.equal(
          fonts.wordmark.weight,
          "700",
          "The wordmark retains its original weight",
        );
        assert.equal(
          fonts.description.weight,
          "300",
          "The hero description uses the lighter weight",
        );
        assert.ok(
          fonts.description.size >= 16,
          "Hero supporting text remains readable",
        );
        if (width < 761) {
          assert.equal(
            fonts.proseCount,
            1,
            "The mobile hero retains one concise introduction",
          );
          assert.equal(
            fonts.controlCount,
            4,
            "The mobile hero contains three product links and one Sample Set action",
          );
          assert.equal(
            fonts.explore,
            null,
            "The mobile hero has one primary onward action",
          );
        }
        assert.ok(fonts.headings.length > 1);
        for (const item of fonts.headings)
          assert.equal(
            item.transform,
            "uppercase",
            `Canonical heading is uppercase: ${item.label}`,
          );
        if (width >= 761) {
          assert.equal(fonts.explore.decoration, "none");
          assert.equal(
            fonts.explore.fragmentedUnderline,
            false,
            "Explore never adds fragmented glyph underlines",
          );
          assert.deepEqual(
            fonts.explore,
            {
              decoration: "none",
              content: '""',
              height: "1px",
              left: "0px",
              right: "0px",
              fragmentedUnderline: false,
            },
            "Desktop Explore retains its single continuous rule",
          );
        }
        for (const item of fonts.nav)
          assert.equal(
            item.weight,
            tone === "light" ? "400" : "300",
            `${item.label} uses the approved ${tone} header weight`,
          );
        const normalize = (family) =>
          family.replaceAll('"', "").replaceAll("'", "").trim();
        const family = normalize(fonts.heading.family.split(",")[0]);
        for (const item of [
          ...fonts.nav,
          ...(fonts.description ? [fonts.description] : []),
        ]) {
          const computedFamily = normalize(item.family.split(",")[0]);
          assert.ok(
            fonts.faces.some(
              (face) =>
                normalize(face.family) === computedFamily &&
                face.weight === item.weight &&
                face.status === "loaded",
            ),
            `The actual computed ${item.weight}-weight Mono font face is loaded`,
          );
        }
        const progress = await page.evaluate(() => window.__motion.progress);
        assert.ok(
          progress.some(
            (item) =>
              item.value === 100 &&
              item.fonts?.some(
                (face) =>
                  normalize(face.family) === family &&
                  face.weight === fonts.heading.weight &&
                  face.status === "loaded",
              ),
          ),
          "The loader reaches 100 only with the intended hero font loaded",
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          true,
        );
        assert.ok(
          fonts.heading.x >= 0 &&
            fonts.heading.x + fonts.heading.width <= width,
        );
        assert.equal(
          await hero(page).evaluate((node) => {
            const applications = Array.from(
              node.querySelectorAll(
                "[data-new-hero7-jump], [data-mobile-hero-application]",
              ),
            );
            return (
              applications.length === 3 &&
              applications.every((link) => {
                const box = link.getBoundingClientRect();
                return box.top >= 0 && box.bottom <= innerHeight + 1;
              })
            );
          }),
          true,
          "Every application and its learning control remain in the first viewport",
        );
        if (width === 1440)
          assert.ok(
            Math.abs(fonts.heading.size - 50.4) < 0.01,
            "Desktop type keeps its approved size",
          );
        await page.mouse.move(1, 1);
        await page.screenshot({
          path: `${evidence}/font-${width}-${tone}-settled.png`,
        });
        if (width === 390) {
          await header(page).locator("[data-nav-summary]").tap();
          await settled(header(page));
          assert.equal(
            await header(page).locator('[data-nav-action="shop"]').isVisible(),
            true,
          );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            true,
          );
          await page.screenshot({
            path: `${evidence}/font-${width}-${tone}-menu.png`,
          });
          await page.keyboard.press("Escape");
        }
        await reviewSelectionVisuals(
          page,
          width,
          tone,
          fonts.description
            ? {
                color: fonts.description.color,
                weight: fonts.description.weight,
                family: fonts.description.family,
              }
            : null,
        );
        await writeFile(
          `${evidence}/font-${width}-${tone}-metrics.json`,
          JSON.stringify(fonts, null, 2),
        );
        const motion = await page.evaluate(() => window.__motion);
        assert.equal(motion.loaderMounts, 1);
        assert.ok(
          motion.frames.some(
            (frame) =>
              frame.loader === null &&
              frame.headingOpacity > 0 &&
              frame.headingOpacity < 1,
          ),
        );
        if (width === 390) {
          await page.goto(`${baseURL}/new-hero7`, {
            waitUntil: "domcontentloaded",
          });
          await hydrated(page);
          const studySize = await page
            .locator("[data-new-hero7-hero] h1")
            .evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
          assert.ok(
            fonts.heading.size > studySize &&
              fonts.heading.size >= 28 &&
              fonts.heading.size <= 40,
            "Mobile type follows the dedicated portrait composition",
          );
        }
      },
    );
  }
  await writeFile(`${evidence}/passed.json`, JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
