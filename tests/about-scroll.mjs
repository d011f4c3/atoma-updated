/* Focused About scroll-story smoke. Reads are isolated; all writes and external
 * traffic are blocked. Run only one desktop and one phone, plus static fallbacks. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.ABOUT_FLOW_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const destination = { countryCode: "US", currency: "USD" };
const evidence =
  process.env.ABOUT_SCROLL_EVIDENCE ?? ".local/about-scroll-0163/browser";
const filter = process.env.ABOUT_SCROLL_FILTER;
const browser = await chromium.launch({ channel: "chrome", headless: true });
await mkdir(evidence, { recursive: true });
let activePage;
let activeName;

async function eventually(check, message) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function setup(width, tone, reduced = false, javascript = true) {
  const context = await browser.newContext({
    viewport: { width, height: width < 500 ? 844 : 900 },
    hasTouch: width < 500,
    isMobile: width < 500,
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
      errors.push("Unexpected external request or write");
      return route.abort();
    }
    if (url.pathname === "/api/destination")
      return route.fulfill({
        json: {
          kind: "ready",
          preference: {
            countryCode: destination.countryCode,
            source: "manual",
          },
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
      errors.push(`Unexpected API ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on("pageerror", (error) => errors.push(error.message));
  activePage = page;
  await page.goto(`${baseURL}/about`);
  await page.locator("[data-about-page]").waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.equal(
    await page.locator("[data-about-page]").getAttribute("data-tone"),
    tone,
  );
  return { context, page, errors };
}

async function scroll(page, top) {
  await page.evaluate(
    (value) => scrollTo({ top: value, behavior: "instant" }),
    Math.max(0, top),
  );
  let previous = await page.evaluate(() => scrollY);
  let steady = 0;
  await eventually(async () => {
    const current = await page.evaluate(() => scrollY);
    steady = Math.abs(current - previous) < 1 ? steady + 1 : 0;
    previous = current;
    return steady >= 4;
  }, "Native page scrolling settles");
}

const topOf = (node) =>
  node.evaluate((element) => element.getBoundingClientRect().top + scrollY);
const variable = (node, name) =>
  node.evaluate(
    (element, key) => Number.parseFloat(element.style.getPropertyValue(key)),
    name,
  );

async function fit(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "About has no horizontal document overflow",
  );
  assert.equal(
    await page
      .locator("[data-about-field-viewport]")
      .evaluate((node) => node.scrollLeft),
    0,
    "The field viewport does not accumulate native horizontal scrolling",
  );
}

async function photos(scope) {
  for (const image of await scope.locator("img").all()) {
    if (!(await image.isVisible())) continue;
    await eventually(
      () => image.evaluate((node) => node.complete && node.naturalWidth > 0),
      "Visible photography loads",
    );
    const decorative = await image.evaluate((node) =>
      Boolean(node.closest('[aria-hidden="true"]')),
    );
    if (!decorative)
      assert.ok(
        await image.getAttribute("alt"),
        "Photography retains descriptive alternative text",
      );
  }
}

async function capture(page, name) {
  await fit(page);
  await page.screenshot({
    path: resolve(evidence, `${activeName}-${name}.png`),
    animations: "disabled",
  });
}

async function popup(page, story, viaPointer, dismiss) {
  const trigger = page.locator(`main article[data-about-story="${story}"] a`);
  const before = { top: await page.evaluate(() => scrollY), url: page.url() };
  const destination = await trigger.getAttribute("href");
  const trace = async (step) => {
    if (process.env.ABOUT_SCROLL_TRACE)
      console.log(
        `${activeName}/${story}/${step}: ${JSON.stringify({ url: page.url(), before, ...(await page.evaluate(() => ({ top: scrollY, history: history.length, entry: history.state?.atomaAboutStory }))) })}`,
      );
  };
  await trace("before");
  if (viaPointer) {
    const box = await trigger.locator("figure").boundingBox();
    const viewport = page.viewportSize();
    const x =
      (Math.max(0, box.x) + Math.min(viewport.width, box.x + box.width)) / 2;
    const y =
      (Math.max(0, box.y) + Math.min(viewport.height, box.y + box.height)) / 2;
    if (viewport.width < 500) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
  } else await page.keyboard.press("Enter");
  const dialog = page.locator("[data-about-field-notes][open]");
  await dialog.waitFor();
  await trace("open");
  await eventually(
    () =>
      new URL(page.url()).hash ===
      `#field-note=${destination.split("/").at(-1)}`,
    "The field note opens in About history",
  );
  assert.equal(new URL(page.url()).pathname, "/about");
  assert.equal(
    await dialog.locator(`article[data-about-story="${story}"]`).count(),
    1,
  );
  await eventually(
    () => dialog.evaluate((node) => node.contains(document.activeElement)),
    "Focus enters the popup",
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await dialog.evaluate((node) => node.contains(document.activeElement)),
    true,
  );
  for (const image of await dialog
    .locator("[data-field-note-photo] img")
    .all()) {
    await image.scrollIntoViewIfNeeded();
    await eventually(
      () => image.evaluate((node) => node.complete && node.naturalWidth > 0),
      "Reader photographs load",
    );
  }
  assert.ok(
    Math.abs((await page.evaluate(() => scrollY)) - before.top) <= 2,
    "Reading leaves the background at its entry position",
  );
  const box = await dialog.boundingBox();
  assert.ok(
    box.x >= 10 &&
      box.y >= 10 &&
      box.x + box.width <= page.viewportSize().width - 10,
    "The reader remains an inset popup",
  );
  if (dismiss === "escape") await page.keyboard.press("Escape");
  else
    await dialog
      .getByRole("button", { name: "Back to About", exact: true })
      .click();
  await dialog.waitFor({ state: "hidden" });
  await trace("closed");
  await eventually(
    () => page.url() === before.url,
    "Closing returns to the preceding About URL",
  );
  await eventually(
    () => trigger.evaluate((node) => node === document.activeElement),
    "Closing restores entry focus",
  );
  await eventually(
    async () =>
      Math.abs((await page.evaluate(() => scrollY)) - before.top) <= 2,
    `Closing restores the native reading position ${before.top}`,
  );
  assert.equal(
    await page.evaluate(() =>
      [document.body, document.documentElement].some(
        (node) => node.style.overflow === "hidden",
      ),
    ),
    false,
    "Closing releases background scroll lock",
  );
  await fit(page);
}

async function smoke(page, desktop) {
  const root = page.locator("[data-about-page]");
  await eventually(
    async () =>
      (await root.getAttribute("data-about-motion")) ===
      (desktop ? "ready" : "reduced"),
    "The viewport selects its motion presentation",
  );
  const cover = root.locator("[data-about-cover]");
  await photos(cover);
  await capture(page, "opening");
  const layout = () =>
    root
      .locator(
        "[data-about-cover], #about-purpose, [data-about-approach], [data-about-connections], [data-about-field-rail]",
      )
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const box = node.getBoundingClientRect();
          return { top: box.top + scrollY, height: box.height };
        }),
      );
  const before = await layout();
  if (desktop) {
    await scroll(page, await topOf(cover));
    const initial = await cover
      .locator("figure")
      .evaluate((node) => getComputedStyle(node).transform);
    await scroll(
      page,
      (await topOf(cover)) + page.viewportSize().height * 0.25,
    );
    assert.ok((await variable(cover, "--cover-progress")) > 0.25);
    assert.notEqual(
      await cover
        .locator("figure")
        .evaluate((node) => getComputedStyle(node).transform),
      initial,
      "The opening photograph recedes as the journey approaches",
    );
    assert.equal(
      await cover
        .locator("section")
        .evaluate((node) => getComputedStyle(node).position),
      "sticky",
    );
  }
  const approach = root.locator("[data-about-approach]");
  const progress = [];
  const wipes = [];
  for (const id of ["character", "application", "origin"]) {
    const step = approach.locator(`[data-approach-step="${id}"]`);
    const target = await step.evaluate((node) => {
      const box = node.getBoundingClientRect();
      return box.top + scrollY + (box.height - innerHeight) / 2;
    });
    await scroll(page, target);
    await photos(desktop ? approach.locator("[data-approach-stage]") : step);
    assert.equal(await approach.getAttribute("data-step"), id);
    progress.push(await variable(approach, "--approach-progress"));
    if (desktop)
      wipes.push(
        await approach
          .locator(
            `[data-approach-photo="${id === "character" ? "application" : id}"]`,
          )
          .evaluate((node) => getComputedStyle(node).clipPath),
      );
    if (id === "application") await capture(page, "approach-mid");
  }
  if (desktop) {
    assert.ok(
      progress[0] < 0.05 &&
        progress[1] > 0.45 &&
        progress[1] < 0.55 &&
        progress[2] > 0.95,
      "Native scrolling advances all three approach photographs",
    );
    assert.notEqual(
      wipes[0],
      wipes[1],
      "The application photograph wipes across its stage",
    );
    assert.equal(
      await approach
        .locator("[data-approach-stage]")
        .evaluate((node) => getComputedStyle(node).position),
      "sticky",
    );
  } else
    assert.equal(
      await approach.locator("[data-approach-stage]").isVisible(),
      false,
    );

  const connections = root.locator("[data-about-connections]");
  await scroll(
    page,
    (await topOf(connections)) - page.viewportSize().height * 0.85,
  );
  const firstLine = await connections
    .locator('path[pathLength="1"]')
    .first()
    .evaluate((node) => getComputedStyle(node).strokeDashoffset);
  await scroll(page, await topOf(connections));
  await photos(connections);
  const lastLine = await connections
    .locator('path[pathLength="1"]')
    .first()
    .evaluate((node) => getComputedStyle(node).strokeDashoffset);
  if (desktop)
    assert.notEqual(
      firstLine,
      lastLine,
      "Scrolling draws the connection between photographs",
    );
  else assert.equal(Number.parseFloat(lastLine), 0);

  const rail = root.locator("[data-about-field-rail]");
  const track = rail.locator("[data-about-field-track]");
  if (desktop) {
    const start = await topOf(rail);
    const distance = await rail.evaluate(
      (node) => node.getBoundingClientRect().height - innerHeight,
    );
    await scroll(page, start);
    const initial = await track.evaluate(
      (node) => getComputedStyle(node).transform,
    );
    await scroll(page, start + distance / 2);
    await photos(rail);
    assert.ok((await variable(rail, "--field-offset")) > 0);
    assert.notEqual(
      await track.evaluate((node) => getComputedStyle(node).transform),
      initial,
      "Vertical scrolling advances the photographic field-note rail",
    );
    await capture(page, "field-mid");
    await popup(page, "harvest", true, "escape");
    await page.keyboard.press("Tab");
    const second = rail.locator('article[data-about-story="technology"] a');
    assert.equal(
      await second.evaluate((node) => node === document.activeElement),
      true,
      "Tab reaches the second field entry",
    );
    await eventually(
      async () => (await variable(rail, "--field-progress")) > 0.99,
      "Keyboard focus maps the second entry to native scroll position",
    );
    const box = await second.boundingBox();
    assert.ok(
      box.x >= -1 && box.x + box.width <= page.viewportSize().width + 1,
      "The complete second entry is visible to keyboard users",
    );
    await popup(page, "technology", false, "button");
  } else {
    assert.equal(
      await track.evaluate((node) => getComputedStyle(node).transform),
      "none",
    );
    for (const story of ["harvest", "technology"]) {
      const entry = rail.locator(`article[data-about-story="${story}"]`);
      await scroll(page, await topOf(entry));
      await photos(entry);
      if (story === "harvest") await capture(page, "field-mid");
      await popup(page, story, true, story === "harvest" ? "button" : "escape");
    }
  }
  const after = await layout();
  assert.equal(after.length, before.length);
  for (const [index, box] of after.entries())
    assert.ok(
      Math.abs(box.top - before[index].top) <= 1 &&
        Math.abs(box.height - before[index].height) <= 1,
      "The scroll story preserves reserved document geometry",
    );
  await fit(page);
}

async function fallback(page, javascript) {
  const root = page.locator("[data-about-page]");
  if (!javascript)
    console.log(
      "No-JS photograph geometry",
      await root
        .locator(
          "[data-about-opening-photographs], article[data-about-story] figure",
        )
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const box = node.getBoundingClientRect();
            return { height: box.height, width: box.width };
          }),
        ),
    );
  if (javascript)
    await eventually(
      async () => (await root.getAttribute("data-about-motion")) === "reduced",
      "Reduced motion selects natural reading flow",
    );
  else assert.equal(await root.getAttribute("data-about-motion"), null);
  assert.equal(
    await root.locator("[data-about-opening-photographs] img").isVisible(),
    true,
    "The static opening keeps its photograph visible",
  );
  assert.notEqual(
    await root
      .locator("[data-about-cover] > section")
      .evaluate((node) => getComputedStyle(node).position),
    "sticky",
  );
  assert.equal(
    await root.locator("[data-approach-stage]").isVisible(),
    false,
    "Static reading uses the inline approach photographs",
  );
  for (const step of await root.locator("[data-approach-step]").all()) {
    await scroll(page, await topOf(step));
    assert.ok(await step.locator("p").isVisible());
    await photos(step);
  }
  const track = root.locator("[data-about-field-track]");
  assert.equal(
    await track.evaluate((node) => getComputedStyle(node).transform),
    "none",
  );
  const entries = root.locator("article[data-about-story]");
  const boxes = await entries.evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom };
    }),
  );
  assert.ok(
    boxes[1].top >= boxes[0].bottom,
    "Both entries remain in natural reading order",
  );
  for (const entry of await entries.all()) {
    await scroll(page, await topOf(entry));
    assert.equal(
      await entry.locator("img").first().isVisible(),
      true,
      "Each static field note keeps its photograph visible",
    );
    await photos(entry);
    assert.ok(
      (await entry.locator("a").getAttribute("href")).startsWith(
        "/field-notes/",
      ),
    );
  }
  await fit(page);
}

try {
  for (const spec of [
    { name: "1440-light-motion", width: 1440, tone: "light" },
    { name: "390-dark-motion", width: 390, tone: "dark" },
    { name: "1440-reduced", width: 1440, tone: "light", reduced: true },
    { name: "1440-no-js", width: 1440, tone: "light", javascript: false },
  ]) {
    if (filter && !spec.name.includes(filter)) continue;
    activeName = spec.name;
    const fixture = await setup(
      spec.width,
      spec.tone,
      spec.reduced,
      spec.javascript,
    );
    if (spec.reduced || spec.javascript === false)
      await fallback(fixture.page, spec.javascript !== false);
    else await smoke(fixture.page, spec.width >= 900);
    assert.deepEqual(
      fixture.errors,
      [],
      "No page errors, external requests or writes",
    );
    await fixture.context.close();
    console.log(`${spec.name}: passed`);
  }
} catch (error) {
  if (activePage && !activePage.isClosed())
    await activePage.screenshot({
      path: resolve(evidence, `${activeName}-failure.png`),
      animations: "disabled",
    });
  throw error;
} finally {
  await browser.close();
}
