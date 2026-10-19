/* Samples reveal checks use isolated catalog reads. External traffic and all
 * network writes are blocked; only explicit local tasting records are saved. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";
import { SAMPLE_TASTINGS_STORAGE_KEY } from "../src/lib/sample-tastings.ts";

const playwright = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.SAMPLES_REVEALS_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const engine = process.env.SAMPLES_REVEALS_BROWSER ?? "chromium";
const filter = process.env.SAMPLES_REVEALS_FILTER;
const evidence =
  process.env.SAMPLES_REVEALS_EVIDENCE ?? ".local/page-reveals-0210/samples";
assert.ok(["chromium", "webkit"].includes(engine));
assert.ok(SAMPLE_SET_OFFER);
const destination = { countryCode: "US", currency: "USD" };
const products = [
  {
    key: "sample-set",
    handle: SAMPLE_SET_OFFER.productHandle,
    title: "Sample Set",
    options: SAMPLE_SET_OFFER.variants[0].options,
  },
  ...SAMPLE_SET_CONTENTS.map((item) => ({
    key: item.key,
    handle: item.productHandle,
    title: item.name,
    options: [{ name: "Format", value: "1 kg" }],
  })),
].map((item, index) => ({
  id: item.key,
  handle: item.handle,
  title: item.title,
  description: "Isolated button study fixture.",
  productCode: null,
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
      selectionId: item.key,
      title: index ? "1 kg" : "3 × 20 g",
      options: item.options,
      available: true,
      priceMinor: index ? 6500 : 2900,
      currency: "USD",
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));
await mkdir(evidence, { recursive: true });
const browser = await playwright[engine].launch(
  engine === "chromium"
    ? { channel: "chrome", headless: true }
    : { headless: true },
);
const results = [];
const mainSelector = "[data-samples-page] main";
const enterSelector = `${mainSelector} [data-page-enter]`;
const sectionSelector = `${mainSelector} [data-page-reveal]`;

async function setup({
  width = 390,
  tone = "light",
  reduced = false,
  javascript = true,
  observer = "normal",
} = {}) {
  const context = await browser.newContext({
    viewport: { width, height: width <= 760 ? 844 : 900 },
    hasTouch: width <= 760,
    isMobile: width <= 760,
    reducedMotion: reduced ? "reduce" : "no-preference",
    javaScriptEnabled: javascript,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: "en", url: baseURL },
  ]);
  const errors = [];
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      errors.push(
        `Blocked external request or write: ${request.method()} ${url.pathname}`,
      );
      return route.abort();
    }
    if (url.pathname === "/api/destination")
      return route.fulfill({
        json: {
          kind: "ready",
          preference: { countryCode: "US", source: "manual" },
          destination,
          countries: ["US"],
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
    if (url.pathname === "/api/cart")
      return route.fulfill({
        json: {
          kind: "empty",
          destination,
          destinationReviewRequired: false,
          checkoutEnabled: false,
        },
      });
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Unexpected API read: ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  if (observer !== "normal")
    await context.addInitScript((mode) => {
      if (mode === "missing") {
        delete window.IntersectionObserver;
        delete window.IntersectionObserverEntry;
      } else {
        const Native = window.IntersectionObserver;
        window.IntersectionObserver = class extends Native {
          constructor(callback, options) {
            if (options?.rootMargin === "0px 0px -24px 0px")
              throw new Error("Fixture reveal observer failed");
            super(callback, options);
          }
        };
      }
    }, observer);
  await context.addInitScript((selector) => {
    window.__samplesFirstPaint = [];
    let started;
    const sample = (time) => {
      const nodes = [...document.querySelectorAll(selector)];
      if (nodes.length) {
        started ??= time;
        window.__samplesFirstPaint.push({
          time: time - started,
          items: nodes.map((node) => {
            const style = getComputedStyle(node);
            return {
              kind: node.dataset.pageEnter,
              opacity: Number(style.opacity),
              translate: style.translate,
              transform: style.transform,
              done: node.hasAttribute("data-page-enter-done"),
            };
          }),
        });
      }
      if (started === undefined || time - started < 1900)
        requestAnimationFrame(sample);
      else window.__samplesFirstPaintDone = true;
    };
    requestAnimationFrame(sample);
  }, enterSelector);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page, errors, width, tone, reduced, javascript };
}

async function scroll(page, top) {
  // A new native input cancels an unfinished range-shortcut scroll before the
  // test sets its next reading position, matching the storefront's input policy.
  await page.keyboard.press("Escape");
  await page.evaluate(
    (value) => scrollTo({ top: Math.max(0, value), behavior: "instant" }),
    top,
  );
  await page.evaluate(
    () =>
      new Promise((done) =>
        requestAnimationFrame(() => requestAnimationFrame(done)),
      ),
  );
}

async function fit(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "Samples has no horizontal document overflow",
  );
}

async function visible(locator) {
  return locator.evaluateAll((nodes) =>
    nodes.every((node) => {
      const style = getComputedStyle(node);
      return (
        Number(style.opacity) === 1 &&
        (style.translate === "none" ||
          style.translate === "0px" ||
          style.translate === "0px 0px")
      );
    }),
  );
}

async function open(fixture) {
  await fixture.page.goto(`${baseURL}/samples`);
  await fixture.page.locator(mainSelector).waitFor();
  await fixture.page.evaluate(() => document.fonts.ready);
  if (fixture.javascript)
    await fixture.page.waitForFunction(() =>
      document
        .querySelector("[data-samples-page] main")
        ?.hasAttribute("data-page-reveal-root"),
    );
}

async function entrance(fixture) {
  await fixture.page.waitForFunction(() => window.__samplesFirstPaintDone);
  const trace = await fixture.page.evaluate(() => window.__samplesFirstPaint);
  const hero = trace.flatMap((frame) =>
    frame.items.filter((item) => item.kind === "hero"),
  );
  const visual = trace.flatMap((frame) =>
    frame.items.filter((item) => item.kind === "visual"),
  );
  assert.ok(
    hero.some((item) => item.opacity > 0.02 && item.opacity < 0.95),
    "Hero paints real intermediate opacity",
  );
  assert.ok(
    hero.some((item) => {
      const shift = Number.parseFloat(item.translate.split(" ").at(-1));
      return shift > 0.1 && shift < 26;
    }),
    "Hero paints intermediate independent translation",
  );
  assert.ok(
    visual.some((item) => item.opacity > 0.02 && item.opacity < 0.95),
    "Pouches paint real intermediate opacity",
  );
  assert.ok(
    visual.every((item) => item.translate === "none"),
    "Pouch entrance does not translate or override scroll geometry",
  );
  assert.equal(await visible(fixture.page.locator(enterSelector)), true);
  assert.equal(
    await fixture.page
      .locator(`${enterSelector}:not([data-page-enter-done])`)
      .count(),
    0,
  );
  await writeFile(
    `${evidence}/${engine}-${fixture.width}-${fixture.tone}-entrance.json`,
    `${JSON.stringify(trace, null, 2)}\n`,
  );
  await fixture.page.screenshot({
    path: `${evidence}/${engine}-${fixture.width}-${fixture.tone}-hero.png`,
  });
}

async function reveal(fixture, selector, kind) {
  const target = fixture.page.locator(selector);
  assert.equal(await target.getAttribute("data-page-reveal-state"), "pending");
  await target.evaluate((node) => {
    window.__samplesSectionFrames = [];
    window.__samplesSectionDone = false;
    const start = performance.now();
    const sample = (time) => {
      const style = getComputedStyle(node);
      window.__samplesSectionFrames.push({
        time: time - start,
        opacity: Number(style.opacity),
        translate: style.translate,
        state: node.dataset.pageRevealState,
        top: node.getBoundingClientRect().top,
        scrollY,
      });
      if (time - start < 1150) requestAnimationFrame(sample);
      else window.__samplesSectionDone = true;
    };
    requestAnimationFrame(sample);
  });
  const top = await target.evaluate(
    (node) => node.getBoundingClientRect().top + scrollY - innerHeight * 0.45,
  );
  await scroll(fixture.page, top);
  await fixture.page.waitForFunction(() => window.__samplesSectionDone);
  const frames = await fixture.page.evaluate(
    () => window.__samplesSectionFrames,
  );
  await writeFile(
    `${evidence}/${engine}-${fixture.width}-${fixture.tone}-${kind}-frames.json`,
    `${JSON.stringify(frames, null, 2)}\n`,
  );
  assert.ok(
    frames.some(
      (frame) =>
        frame.state === "entering" &&
        frame.opacity > 0.02 &&
        frame.opacity < 0.95,
    ),
    `${kind} section paints intermediate opacity`,
  );
  if (kind === "rise")
    assert.ok(
      frames.some((frame) => {
        const shift = Number.parseFloat(frame.translate.split(" ").at(-1));
        return shift > 0.1 && shift < 12;
      }),
    );
  else assert.ok(frames.every((frame) => frame.translate === "none"));
  assert.equal(await target.getAttribute("data-page-reveal-state"), "complete");
  assert.equal(await visible(target), true);
  await fit(fixture.page);
  return frames;
}

async function rangeShortcuts(fixture) {
  if (fixture.width < 900) return;
  assert.equal(
    await fixture.page
      .locator("[data-samples-range-sticky]")
      .evaluate((node) => getComputedStyle(node).position),
    "sticky",
  );
  for (const { key } of SAMPLE_SET_CONTENTS) {
    const link = fixture.page.locator(`[data-sample-range-link="${key}"]`);
    await link.focus();
    await fixture.page.keyboard.press("Enter");
    await fixture.page.waitForFunction((value) => {
      const row = document.querySelector(`[data-sample-content="${value}"]`);
      const box = row.getBoundingClientRect();
      return (
        box.left >= -1 &&
        box.right <= innerWidth + 1 &&
        box.top < innerHeight &&
        box.bottom > 0 &&
        row.querySelector("h3") === document.activeElement &&
        document
          .querySelector(`[data-sample-range-link="${value}"]`)
          .getAttribute("aria-current") === "step"
      );
    }, key);
    assert.equal(
      await visible(fixture.page.locator(`[data-sample-content="${key}"]`)),
      true,
    );
  }
  assert.notEqual(
    await fixture.page
      .locator("[data-samples-range-track]")
      .evaluate((node) => getComputedStyle(node).transform),
    "none",
  );
}

async function editorContinuity(fixture) {
  const tools = fixture.page.locator("[data-sample-tasting-tools]");
  const notes = tools.locator('[name="notes"]');
  await notes.fill("Saved recipe: 2 g matcha, 60 ml water. 試飲記録。");
  await tools
    .getByRole("button", { name: "Save tasting card", exact: true })
    .click();
  await tools
    .getByRole("status")
    .getByText("Saved on this device.", { exact: true })
    .waitFor();
  const stored = await fixture.page.evaluate(
    (key) => localStorage.getItem(key),
    SAMPLE_TASTINGS_STORAGE_KEY,
  );
  const unsaved =
    "Unsaved second trial: keep the same water temperature. 未保存。";
  await notes.fill(unsaved);
  await fixture.page.evaluate((selector) => {
    window.__originalTastingNotes = document.querySelector(
      '[data-sample-tasting-tools] [name="notes"]',
    );
    window.__completedSampleGroups = new Set([
      ...document.querySelectorAll(
        `${selector} [data-page-enter-done], ${selector} [data-page-reveal-state="complete"]`,
      ),
    ]);
    window.__sampleReplays = [];
    document.addEventListener("animationstart", (event) => {
      if (window.__completedSampleGroups.has(event.target))
        window.__sampleReplays.push(event.animationName);
    });
  }, mainSelector);
  await fixture.page
    .getByRole("switch", { name: "Dark mode", exact: true })
    .first()
    .click();
  await tools.locator('[data-tasting-tea="barista"]').click();
  await tools.locator('[data-tasting-tea="ceremonial"]').click();
  assert.equal(await notes.inputValue(), unsaved);
  await tools
    .getByRole("button", { name: "Compare samples", exact: true })
    .click();
  await tools
    .locator("[data-tasting-comparison]")
    .getByText("Saved recipe: 2 g matcha, 60 ml water. 試飲記録。", {
      exact: true,
    })
    .waitFor();
  await tools
    .getByRole("button", { name: "Tasting card", exact: true })
    .click();
  await scroll(fixture.page, 0);
  await notes.scrollIntoViewIfNeeded();
  await fixture.page.evaluate(
    () =>
      new Promise((done) =>
        requestAnimationFrame(() => requestAnimationFrame(done)),
      ),
  );
  assert.equal(await notes.inputValue(), unsaved);
  assert.equal(
    await fixture.page.evaluate(
      (key) => localStorage.getItem(key),
      SAMPLE_TASTINGS_STORAGE_KEY,
    ),
    stored,
  );
  assert.equal(
    await notes.evaluate((node) => node === window.__originalTastingNotes),
    true,
  );
  assert.deepEqual(
    await fixture.page.evaluate(() => window.__sampleReplays),
    [],
    "Completed groups never replay after theme/editor/scroll changes",
  );
  assert.equal(await visible(tools.locator("form")), true);
  await fit(fixture.page);
  await fixture.page.screenshot({
    path: `${evidence}/${engine}-${fixture.width}-${fixture.tone}-editor.png`,
  });
}

async function run(name, settings, action) {
  if (filter && !filter.split(",").some((part) => name.includes(part))) return;
  const fixture = await setup(settings);
  try {
    await open(fixture);
    await action(fixture);
    await fit(fixture.page);
    assert.deepEqual(
      fixture.errors,
      [],
      "No browser exceptions, external requests or network writes",
    );
    const result = { engine, name, passed: true };
    results.push(result);
    await writeFile(
      `${evidence}/${engine}-${name}-result.json`,
      `${JSON.stringify(result, null, 2)}\n`,
    );
    console.log(`PASS ${engine}/${name}`);
  } catch (error) {
    await fixture.page
      .screenshot({ path: `${evidence}/${engine}-${name}-failure.png` })
      .catch(() => {});
    throw error;
  } finally {
    await fixture.context.close();
  }
}

try {
  for (const width of [390, 1440])
    for (const tone of ["light", "dark"])
      await run(`motion-${width}-${tone}`, { width, tone }, async (fixture) => {
        await entrance(fixture);
        const form = fixture.page.locator("[data-sample-tasting-tools] form");
        assert.equal(
          await form.getAttribute("data-page-reveal-state"),
          "pending",
        );
        await fixture.page.keyboard.press("Tab");
        await form
          .locator('[name="notes"]')
          .evaluate((node) => node.focus({ preventScroll: true }));
        assert.equal(
          await form.getAttribute("data-page-reveal-state"),
          "complete",
        );
        assert.equal(
          await visible(form),
          true,
          "Focus reveals a pending editor immediately",
        );
        const card = await reveal(
          fixture,
          '[data-sample-content="ceremonial"]',
          "fade",
        );
        await rangeShortcuts(fixture);
        const heading = await reveal(
          fixture,
          "[data-sample-tasting-tools] header[data-page-reveal]",
          "rise",
        );
        await writeFile(
          `${evidence}/${engine}-${width}-${tone}-scroll.json`,
          `${JSON.stringify({ card, heading }, null, 2)}\n`,
        );
        await editorContinuity(fixture);
      });

  for (const [name, settings] of [
    ["reduced-mobile", { width: 390, tone: "dark", reduced: true }],
    ["no-javascript-desktop", { width: 1440, javascript: false }],
    ["observer-failed-mobile", { width: 390, observer: "failed" }],
    [
      "observer-missing-desktop",
      { width: 1440, tone: "dark", observer: "missing" },
    ],
  ])
    await run(name, settings, async (fixture) => {
      // Browser rAF pollers do not run with scripting disabled. Read the real
      // CSS state from the host until the bounded first-paint entrance finishes.
      const deadline = Date.now() + 4000;
      while (
        !(await visible(fixture.page.locator(enterSelector))) &&
        Date.now() < deadline
      )
        await new Promise((done) => setTimeout(done, 50));
      assert.equal(await visible(fixture.page.locator(enterSelector)), true);
      assert.equal(await visible(fixture.page.locator(sectionSelector)), true);
      assert.equal(
        await fixture.page
          .locator(`${sectionSelector}[data-page-reveal-state="pending"]`)
          .count(),
        0,
      );
      const form = fixture.page.locator("[data-sample-tasting-tools] form");
      await form.scrollIntoViewIfNeeded();
      assert.equal(await visible(form), true);
      await fixture.page.screenshot({
        path: `${evidence}/${engine}-${name}.png`,
      });
    });
} finally {
  await browser.close();
  await writeFile(
    `${evidence}/${engine}${filter ? `-${filter.replace(/[^a-z0-9-]+/gi, "-")}` : ""}-results.json`,
    `${JSON.stringify(results, null, 2)}\n`,
  );
}
