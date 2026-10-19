/* Mobile About reveals: real animation/visibility checks with isolated read
 * fixtures. External traffic and all network writes are blocked. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const playwright = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.ABOUT_REVEALS_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const destination = { countryCode: "US", currency: "USD" };
const engine = process.env.ABOUT_REVEALS_BROWSER ?? "chromium";
const filter = process.env.ABOUT_REVEALS_FILTER;
const evidence =
  process.env.ABOUT_REVEALS_EVIDENCE ?? ".local/about-reveals-0206/browser";
assert.ok(["chromium", "webkit"].includes(engine));
const browser = await playwright[engine].launch(
  engine === "chromium"
    ? { channel: "chrome", headless: true }
    : { headless: true },
);
await mkdir(evidence, { recursive: true });
const results = [];
const heroSelector = "[data-about-enter]";
const revealSelector = "[data-about-reveal]";

async function setup({
  width = 390,
  tone = "light",
  reduced = false,
  javascript = true,
  observer = "normal",
  slowHero = false,
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
  let releaseHero = () => {};
  const heroGate = slowHero
    ? new Promise((done) => {
        releaseHero = done;
      })
    : null;
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      errors.push(
        `Unexpected external request or write: ${request.method()} ${url.pathname}`,
      );
      return route.abort();
    }
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
    if (url.pathname === "/api/cart")
      return route.fulfill({
        json: { kind: "empty", destination, checkoutEnabled: false },
      });
    if (url.pathname === "/api/catalog")
      return route.fulfill({
        json: {
          status: "ready",
          destination,
          products: [],
          shopUrl: "https://example.invalid",
        },
      });
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Unexpected API read: ${url.pathname}`);
      return route.abort();
    }
    if (
      slowHero &&
      request.resourceType() === "image" &&
      (url.searchParams.get("url") ?? url.pathname).includes(
        "/about/wazuka/field-contours.webp",
      )
    )
      await heroGate;
    return route.continue();
  });
  if (observer !== "normal") {
    await context.addInitScript((mode) => {
      if (mode === "missing") {
        delete window.IntersectionObserver;
        delete window.IntersectionObserverEntry;
      } else if (mode === "observe-failed") {
        const NativeObserver = window.IntersectionObserver;
        window.IntersectionObserver = class extends NativeObserver {
          observe(target) {
            if (target.hasAttribute("data-about-reveal"))
              throw new Error("Fixture IntersectionObserver.observe failure");
            return super.observe(target);
          }
        };
      } else {
        const NativeObserver = window.IntersectionObserver;
        window.IntersectionObserver = class extends NativeObserver {
          constructor(callback, options) {
            // Fail the reveal observer without breaking unrelated Next prefetch.
            if (options?.rootMargin === "0px 0px -24px 0px")
              throw new Error("Fixture IntersectionObserver failure");
            super(callback, options);
          }
        };
      }
    }, observer);
  }
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  return {
    context,
    page,
    errors,
    width,
    tone,
    reduced,
    javascript,
    slowHero,
    releaseHero,
  };
}

async function run(name, action) {
  if (filter && !filter.split(",").some((part) => name.includes(part))) return;
  const start = Date.now();
  await action();
  const result = {
    name,
    engine,
    passed: true,
    milliseconds: Date.now() - start,
  };
  results.push(result);
  await writeFile(
    `${evidence}/${engine}-${name}-result.json`,
    `${JSON.stringify(result, null, 2)}\n`,
  );
  console.log(`PASS ${engine}/${name}`);
}

async function fit(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "About has no horizontal document overflow",
  );
}

async function position(locator) {
  return locator.evaluate((node) => node.getBoundingClientRect().top + scrollY);
}

async function scroll(page, top) {
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

async function capture(fixture, suffix) {
  await fit(fixture.page);
  await fixture.page.screenshot({
    path: `${evidence}/${engine}-${fixture.width}-${fixture.tone}-${suffix}.png`,
  });
}

async function finish(fixture) {
  assert.deepEqual(
    fixture.errors,
    [],
    "No browser exceptions or external/network writes",
  );
  await fixture.context.close();
}

async function traceFirstPaint(fixture) {
  await fixture.context.addInitScript(
    ({ heroSelector, revealSelector }) => {
      const trace = { hero: [], images: [], animations: [], mutations: [] };
      window.__aboutRevealTrace = trace;
      let beginning = null;
      function sample(time) {
        const nodes = [...document.querySelectorAll(heroSelector)];
        if (nodes.length) {
          beginning ??= time;
          trace.hero.push({
            time: time - beginning,
            items: nodes.map((node) => {
              const style = getComputedStyle(node);
              return {
                opacity: Number(style.opacity),
                transform: style.transform,
                animation: style.animationName,
                duration: style.animationDuration,
                delay: style.animationDelay,
              };
            }),
          });
        }
        if (beginning === null || time - beginning < 1800)
          requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
      document.addEventListener(
        "load",
        (event) => {
          const image = event.target;
          if (
            !(image instanceof HTMLImageElement) ||
            !image.closest('[data-about-enter="photograph"]')
          )
            return;
          const start = performance.now();
          function sampleImage(time) {
            trace.images.push({
              time: time - start,
              opacity: Number(getComputedStyle(image).opacity),
              arriving: image.hasAttribute("data-about-image-arriving"),
            });
            if (time - start < 800) requestAnimationFrame(sampleImage);
          }
          requestAnimationFrame(sampleImage);
        },
        true,
      );
      document.addEventListener("animationstart", (event) => {
        const node = event.target;
        if (
          !(node instanceof Element) ||
          !node.matches(`${heroSelector}, ${revealSelector}`)
        )
          return;
        trace.animations.push({
          hero: node.matches(heroSelector),
          index: [
            ...document.querySelectorAll(
              node.matches(heroSelector) ? heroSelector : revealSelector,
            ),
          ].indexOf(node),
          name: event.animationName,
        });
      });
      new MutationObserver((records) => {
        for (const record of records) {
          const node = record.target;
          if (!(node instanceof Element) || !node.matches(revealSelector))
            continue;
          trace.mutations.push({
            index: [...document.querySelectorAll(revealSelector)].indexOf(node),
            attribute: record.attributeName,
            oldValue: record.oldValue,
            value: node.getAttribute(record.attributeName),
          });
        }
      }).observe(document, {
        subtree: true,
        attributes: true,
        attributeOldValue: true,
      });
    },
    { heroSelector, revealSelector },
  );
}

async function visibleRevealState(locator) {
  return locator.evaluateAll((nodes) =>
    nodes.map((node) => {
      const style = getComputedStyle(node);
      return {
        opacity: Number(style.opacity),
        visibility: style.visibility,
        transform: style.transform,
        animation: style.animationName,
      };
    }),
  );
}

async function waitVisible(locator) {
  const node = await locator.elementHandle();
  assert.ok(node);
  try {
    await locator.page().waitForFunction((element) => {
      const style = getComputedStyle(element);
      return (
        style.opacity === "1" &&
        style.visibility === "visible" &&
        (!element.hasAttribute("data-about-reveal") ||
          element.dataset.aboutRevealState === "complete")
      );
    }, node);
  } finally {
    await node.dispose();
  }
}

async function open(fixture, path = "/about") {
  await fixture.page.goto(`${baseURL}${path}`, {
    waitUntil: "domcontentloaded",
  });
  await fixture.page.locator("[data-about-page]").waitFor();
  if (fixture.javascript)
    await fixture.page.waitForFunction(
      () =>
        document.querySelector("[data-about-page] [data-theme-switcher]")
          ?.disabled === false,
    );
  if (!fixture.slowHero)
    await fixture.page.evaluate(() => document.fonts.ready);
}

async function assertHeroTrace(fixture) {
  await fixture.page.waitForFunction((selector) => {
    const nodes = [...document.querySelectorAll(selector)];
    return (
      nodes.length > 0 &&
      nodes.every((node) => getComputedStyle(node).opacity === "1")
    );
  }, heroSelector);
  const trace = await fixture.page.evaluate(
    () => window.__aboutRevealTrace.hero,
  );
  assert.ok(
    trace.length > 2,
    "The hero is sampled across real rendering frames",
  );
  assert.ok(
    trace.some((frame) =>
      frame.items.some((item) => item.opacity > 0 && item.opacity < 0.98),
    ),
    "Hero opacity visibly progresses between hidden and complete",
  );
  assert.ok(
    trace.some((frame) => frame.items.some((item) => item.opacity < 0.3)),
    "The first paint begins with a perceptible reveal",
  );
  assert.ok(
    trace.some((frame) =>
      frame.items.some((item) => item.transform !== "none"),
    ),
    "The hero uses its small entrance translation",
  );
  const animations = trace
    .flatMap((frame) => frame.items)
    .filter((item) => item.animation !== "none");
  assert.ok(animations.length > 0);
  for (const item of animations) {
    const duration = Number.parseFloat(item.duration) * 1000;
    const delay = Number.parseFloat(item.delay) * 1000;
    assert.ok(
      duration >= 640 && duration <= 800,
      `Hero duration stays within 640–800 ms: ${duration}`,
    );
    assert.ok(
      delay >= 0 && delay <= 180,
      `Hero delay stays within 180 ms: ${delay}`,
    );
  }
  const final = await visibleRevealState(fixture.page.locator(heroSelector));
  assert.ok(
    final.every((item) => item.opacity === 1 && item.visibility === "visible"),
  );
  await writeFile(
    `${evidence}/${engine}-${fixture.width}-${fixture.tone}-hero-trace.json`,
    JSON.stringify(trace, null, 2),
  );
}

async function assertNewRevealsStatic(page) {
  const states = await visibleRevealState(
    page.locator(`${heroSelector}, ${revealSelector}`),
  );
  assert.ok(states.length > 0);
  assert.ok(
    states.every(
      (state) =>
        state.opacity === 1 &&
        state.visibility === "visible" &&
        state.animation === "none",
    ),
    "New reveal effects are fully visible and static in fallback modes",
  );
}

async function modalRoundtrip(fixture) {
  const { page } = fixture;
  const trigger = page.locator('main article[data-about-story="harvest"] a');
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  const before = await page.evaluate(() => ({
    top: scrollY,
    url: location.href,
  }));
  await page.keyboard.press("Enter");
  const dialog = page.locator("[data-about-field-notes][open]");
  await dialog.waitFor();
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await page.waitForFunction(
    ({ top, url }) => location.href === url && Math.abs(scrollY - top) <= 2,
    before,
  );
  const triggerNode = await trigger.elementHandle();
  await page.waitForFunction(
    (node) => node === document.activeElement,
    triggerNode,
  );
  await triggerNode.dispose();
  assert.equal(
    await trigger.evaluate((node) => node === document.activeElement),
    true,
    "The reader restores its trigger focus",
  );
}

async function revealAll(fixture) {
  const { page } = fixture;
  const items = page.locator(revealSelector);
  const count = await items.count();
  assert.ok(count > 2, "Lower sections expose bounded reveal targets");
  const initial = await items.evaluateAll((nodes) =>
    nodes.map((node) => ({
      opacity: Number(getComputedStyle(node).opacity),
      top: node.getBoundingClientRect().top,
    })),
  );
  assert.ok(
    initial.some((node) => node.opacity === 0),
    "Offscreen sections wait for entry",
  );
  assert.ok(
    initial
      .filter((node) => node.opacity === 0)
      .every((node) => node.top >= fixture.page.viewportSize().height),
    "Only below-viewport sections start hidden",
  );
  let transient = false;
  for (let index = 0; index < count; index++) {
    const target = items.nth(index);
    await scroll(
      page,
      (await position(target)) - fixture.page.viewportSize().height * 0.65,
    );
    const frames = await target.evaluate(async (node) => {
      const frames = [];
      const start = performance.now();
      while (performance.now() - start < 850) {
        const style = getComputedStyle(node);
        frames.push({
          opacity: Number(style.opacity),
          transform: style.transform,
        });
        if (style.opacity === "1" && frames.length > 1) break;
        await new Promise(requestAnimationFrame);
      }
      return frames;
    });
    transient ||= frames.some(
      (frame) => frame.opacity > 0 && frame.opacity < 0.98,
    );
    await waitVisible(target);
  }
  assert.ok(
    transient,
    "A lower section visibly fades as it enters the viewport",
  );
  await fit(page);
  return count;
}

try {
  for (const [width, tone] of [
    [390, "light"],
    [320, "dark"],
  ]) {
    await run(`mobile-${width}-${tone}`, async () => {
      const fixture = await setup({ width, tone });
      try {
        await traceFirstPaint(fixture);
        await open(fixture);
        await assertHeroTrace(fixture);
        await capture(fixture, "hero-complete");
        const count = await revealAll(fixture);
        const before = await fixture.page.evaluate(
          () => window.__aboutRevealTrace.animations,
        );
        await scroll(fixture.page, 0);
        await scroll(
          fixture.page,
          await fixture.page.evaluate(
            () => document.documentElement.scrollHeight,
          ),
        );
        await fixture.page
          .getByRole("switch", { name: "Dark mode", exact: true })
          .last()
          .click();
        await fixture.page.waitForFunction(
          (tone) =>
            document
              .querySelector("[data-about-page]")
              ?.getAttribute("data-tone") !== tone,
          tone,
        );
        await modalRoundtrip(fixture);
        await fixture.page.evaluate(
          () =>
            new Promise((done) =>
              requestAnimationFrame(() => requestAnimationFrame(done)),
            ),
        );
        const after = await fixture.page.evaluate(
          () => window.__aboutRevealTrace,
        );
        assert.deepEqual(
          after.animations,
          before,
          "Scroll return, theme change and reader roundtrip never restart reveals",
        );
        assert.equal(
          after.mutations.filter(
            (mutation) =>
              mutation.attribute === "data-about-reveal-state" &&
              mutation.oldValue === "complete" &&
              mutation.value !== "complete",
          ).length,
          0,
          "Completed reveals are never hidden again",
        );
        assert.equal(
          await fixture.page
            .locator('[data-about-reveal-state="complete"]')
            .count(),
          count,
        );
        const starts = after.animations.filter((animation) => !animation.hero);
        assert.equal(
          new Set(starts.map((animation) => animation.index)).size,
          starts.length,
          "Each lower target animates at most once",
        );
        await capture(fixture, "community-complete");
        await finish(fixture);
      } catch (error) {
        await fixture.page
          .screenshot({
            path: `${evidence}/${engine}-${width}-${tone}-failure.png`,
          })
          .catch(() => {});
        throw error;
      } finally {
        await fixture.context.close();
      }
    });
  }

  await run("keyboard-immediate", async () => {
    const fixture = await setup();
    try {
      await open(fixture);
      await fixture.page.waitForFunction(
        () =>
          document.querySelector('[data-about-reveal-state="pending"] a') !==
          null,
      );
      const result = await fixture.page.evaluate(() => {
        const link = document.querySelector(
          '[data-about-reveal-state="pending"] a',
        );
        const target = link.closest("[data-about-reveal]");
        const wasBelow = target.getBoundingClientRect().top >= innerHeight;
        link.focus({ preventScroll: true });
        const style = getComputedStyle(target);
        return {
          wasBelow,
          focused: document.activeElement === link,
          state: target.dataset.aboutRevealState,
          opacity: style.opacity,
          transform: style.transform,
          animation: style.animationName,
        };
      });
      assert.deepEqual(
        result,
        {
          wasBelow: true,
          focused: true,
          state: "complete",
          opacity: "1",
          transform: "none",
          animation: "none",
        },
        "Keyboard focus synchronously reveals its target without an animation wait",
      );
      await fixture.page.evaluate(() => document.activeElement.blur());
      assert.equal(
        await fixture.page
          .locator('main article[data-about-story="harvest"]')
          .getAttribute("data-about-reveal-state"),
        "complete",
      );
      await finish(fixture);
    } finally {
      await fixture.context.close();
    }
  });

  await run("anchor-back-restoration", async () => {
    const fixture = await setup();
    try {
      await open(fixture, "/about#about-community");
      const community = fixture.page.locator("#about-community");
      await fixture.page.waitForFunction(() => {
        const box = document
          .querySelector("#about-community")
          .getBoundingClientRect();
        return box.top >= -1 && box.top < innerHeight;
      });
      assert.ok(
        (await visibleRevealState(community.locator(revealSelector))).every(
          (state) => state.opacity === 1 && state.animation === "none",
        ),
        "Deep-linked content is immediately complete",
      );
      const before = await fixture.page.evaluate(() => ({
        top: scrollY,
        url: location.href,
      }));
      await fixture.page.waitForLoadState("networkidle");
      await fixture.page.goto(`${baseURL}/shop`);
      await fixture.page.waitForLoadState("networkidle");
      await fixture.page.goBack({ waitUntil: "domcontentloaded" });
      await fixture.page.locator("[data-about-page]").waitFor();
      await fixture.page.waitForFunction(
        ({ top, url }) => location.href === url && Math.abs(scrollY - top) <= 4,
        before,
      );
      await fixture.page.waitForFunction(
        () =>
          document.querySelector("[data-about-page] [data-theme-switcher]")
            ?.disabled === false,
      );
      assert.equal(
        await fixture.page.locator(revealSelector).evaluateAll((nodes) =>
          nodes
            .filter((node) => {
              const box = node.getBoundingClientRect();
              return box.top < innerHeight && box.bottom > 0;
            })
            .every((node) => getComputedStyle(node).opacity === "1"),
        ),
        true,
        "History restoration never blanks the current reading position",
      );
      await capture(fixture, "history-restored");
      await finish(fixture);
    } finally {
      await fixture.context.close();
    }
  });

  await run("media-query-cancellation", async () => {
    const fixture = await setup();
    try {
      await open(fixture);
      const target = fixture.page
        .locator('[data-about-reveal-state="pending"]')
        .first();
      await target.waitFor();
      const node = await target.elementHandle();
      await scroll(fixture.page, (await position(target)) - 650);
      await fixture.page.waitForFunction(
        (element) => element.dataset.aboutRevealState === "entering",
        node,
      );
      await fixture.page.emulateMedia({ reducedMotion: "reduce" });
      await fixture.page.waitForFunction(() =>
        [...document.querySelectorAll("[data-about-reveal]")].every(
          (node) => node.dataset.aboutRevealState === "complete",
        ),
      );
      await assertNewRevealsStatic(fixture.page);
      await fixture.page.emulateMedia({ reducedMotion: "no-preference" });
      await fixture.page.setViewportSize({ width: 1440, height: 900 });
      await assertNewRevealsStatic(fixture.page);
      await fixture.page.setViewportSize({ width: 390, height: 844 });
      await assertNewRevealsStatic(fixture.page);
      assert.equal(
        await fixture.page
          .locator(
            '[data-about-reveal-state="pending"], [data-about-reveal-state="entering"]',
          )
          .count(),
        0,
        "Changing preferences and viewport never rearms completed content",
      );
      await node.dispose();
      await finish(fixture);
    } finally {
      await fixture.context.close();
    }
  });

  for (const spec of [
    { name: "mobile-reduced", width: 390, reduced: true },
    { name: "mobile-no-js", width: 390, javascript: false },
    { name: "desktop", width: 1440 },
    { name: "missing-observer", observer: "missing" },
    { name: "failed-observer", observer: "failed" },
    { name: "failed-observe", observer: "observe-failed" },
  ]) {
    await run(spec.name, async () => {
      const fixture = await setup(spec);
      try {
        await open(fixture);
        if (fixture.javascript)
          await fixture.page.waitForFunction(() =>
            [...document.querySelectorAll("[data-about-reveal]")].every(
              (node) => node.dataset.aboutRevealState === "complete",
            ),
          );
        await assertNewRevealsStatic(fixture.page);
        await fit(fixture.page);
        await capture(fixture, spec.name);
        await finish(fixture);
      } finally {
        await fixture.context.close();
      }
    });
  }

  await run("slow-hero-image", async () => {
    const fixture = await setup({ slowHero: true });
    try {
      await traceFirstPaint(fixture);
      await open(fixture);
      await assertHeroTrace(fixture);
      const photograph = fixture.page.locator(
        "[data-about-opening-photographs] img",
      );
      assert.equal(
        await photograph.evaluate(
          (image) => image.complete && image.naturalWidth > 0,
        ),
        false,
        "The held photograph is still unavailable while hero text finishes",
      );
      assert.ok(
        (
          await visibleRevealState(
            fixture.page.locator(
              '[data-about-enter="heading"], [data-about-enter="statement"]',
            ),
          )
        ).every((state) => state.opacity === 1),
      );
      fixture.releaseHero();
      await fixture.page.waitForFunction(() =>
        window.__aboutRevealTrace.images.some(
          (frame) =>
            frame.arriving && frame.opacity > 0 && frame.opacity < 0.98,
        ),
      );
      await fixture.page.waitForFunction(() => {
        const image = document.querySelector(
          "[data-about-opening-photographs] img",
        );
        return (
          image.complete &&
          image.naturalWidth > 0 &&
          !image.hasAttribute("data-about-image-arriving") &&
          getComputedStyle(image).opacity === "1"
        );
      });
      await writeFile(
        `${evidence}/${engine}-slow-image-trace.json`,
        JSON.stringify(
          await fixture.page.evaluate(() => window.__aboutRevealTrace.images),
          null,
          2,
        ),
      );
      await capture(fixture, "slow-image-complete");
      await finish(fixture);
    } finally {
      fixture.releaseHero();
      await fixture.context.close();
    }
  });
} finally {
  await browser.close();
  await writeFile(
    `${evidence}/${engine}${filter ? `-${filter.replace(/[^a-z0-9-]+/gi, "-")}` : ""}-results.json`,
    `${JSON.stringify(results, null, 2)}\n`,
  );
}
