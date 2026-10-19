/* About flow checks. Network access is confined to local assets and mocked
 * commerce reads; the checks never write a cart or contact Shopify. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.ABOUT_STORIES_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.ABOUT_STORIES_EVIDENCE ?? ".local/about-laboratory-0145/browser";
const filter = process.env.ABOUT_STORIES_FILTER;
const cart = {
  totalQuantity: 1,
  subtotalLabel: "¥2,400",
  totalLabel: "¥2,400",
  lines: [
    {
      lineKey: `v1_${"b".repeat(43)}`,
      productHandle: "test-only-about-fixture",
      productTitle: "About fixture",
      variantTitle: "1 kg",
      options: [],
      quantity: 1,
      unitPriceLabel: "¥2,400",
      lineTotalLabel: "¥2,400",
      purchaseState: "purchasable",
      quantityRule: { minimum: 1, maximum: 4, increment: 1 },
      canUpdateQuantity: true,
      canRemove: true,
      image: null,
    },
  ],
};

async function eventually(check, message) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 35));
  }
  assert.fail(message);
}

async function scroll(page, top) {
  await page.evaluate(
    (value) => window.scrollTo({ top: value, behavior: "instant" }),
    top,
  );
  await page.evaluate(
    () =>
      new Promise((done) =>
        requestAnimationFrame(() => requestAnimationFrame(done)),
      ),
  );
}

async function settleScroll(page) {
  let previous = await page.evaluate(() => scrollY);
  let steady = 0;
  await eventually(async () => {
    const current = await page.evaluate(() => scrollY);
    steady = Math.abs(current - previous) <= 1 ? steady + 1 : 0;
    previous = current;
    return steady >= 4;
  }, "Native section navigation settles at its destination");
}

async function fit(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "About fits without horizontal scrolling",
  );
}

async function checkFlow(page, root, width) {
  await root.waitFor();
  const prefix =
    (await root.getAttribute("data-about-stories")) === "relationships"
      ? "relationships"
      : "about";
  assert.equal(
    await root.locator("main h1").count(),
    1,
    "The page has one clear opening title",
  );
  assert.equal(
    await root.getByRole("tablist").count(),
    0,
    "The story is a continuous page",
  );
  assert.equal(
    await root
      .getByRole("navigation", { name: "About entries", exact: true })
      .count(),
    0,
    "Reading does not require switching entries",
  );
  for (const id of [
    `${prefix}-approach`,
    `${prefix}-wazuka`,
    `${prefix}-technology`,
  ])
    await root.locator(`#${id}`).waitFor();
  const reading = await root.locator("main").innerText();
  for (const pattern of [
    /application/i,
    /flavou?r/i,
    /texture/i,
    /purpose|intend/i,
    /\bATOM\b/,
    /\bMATCHA\b/i,
    /\bGVJ\b/,
    /Wazuka/i,
    /weekend/i,
    /drone/i,
    /powersuit/i,
  ])
    assert.match(reading, pattern, `The story retains ${pattern}`);
  assert.match(
    await root.locator(`#${prefix}-wazuka`).innerText(),
    /first (field )?entry/i,
  );
  assert.match(
    await root.locator(`#${prefix}-technology`).innerText(),
    /story to follow|in preparation/i,
  );
  const scales = await root
    .locator("main h1, main h2, main h3")
    .evaluateAll((nodes) =>
      nodes.map((node) => Number.parseFloat(getComputedStyle(node).fontSize)),
    );
  const cap = width <= 760 ? 24 : 30;
  assert.ok(
    scales.length > 0 && Math.max(...scales) <= cap,
    `Editorial type remains within ${cap}px: ${Math.max(...scales)}px`,
  );
  const visible = await root
    .locator("main h1, main h2, main h3, main p")
    .evaluateAll((nodes) =>
      nodes.every((node) => {
        const box = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return (
          box.width > 0 &&
          box.height > 0 &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0
        );
      }),
    );
  assert.equal(
    visible,
    true,
    "All story copy is available in the reading flow",
  );
  const sections = await root.locator("main > section").evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return {
        top: box.top + scrollY,
        bottom: box.bottom + scrollY,
        height: box.height,
      };
    }),
  );
  assert.ok(
    sections.length >= 5,
    "Introduction, approach, harvest, technology and selection form distinct sections",
  );
  for (let index = 0; index < sections.length; index++) {
    assert.ok(
      sections[index].height > 0,
      "Each section occupies readable document space",
    );
    if (index)
      assert.ok(
        sections[index].top >= sections[index - 1].bottom - 1,
        "Sections follow one another without overlap",
      );
  }
  const nestedScroll = await root
    .locator("main, main *")
    .evaluateAll((nodes) =>
      nodes.some(
        (node) =>
          ["auto", "scroll"].includes(getComputedStyle(node).overflowY) &&
          node.clientHeight > 0 &&
          node.scrollHeight > node.clientHeight + 1,
      ),
    );
  assert.equal(
    nestedScroll,
    false,
    "Reading uses the document without internal scroll areas",
  );
  await fit(page);
}

async function checkImages(page, root) {
  const images = root.locator("main img");
  assert.ok(
    (await images.count()) >= 4,
    "Photography accompanies the opening and both grower stories",
  );
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await eventually(
      () => image.evaluate((node) => node.complete && node.naturalWidth > 0),
      "Archive placeholder photography loads",
    );
    const source = decodeURIComponent(await image.getAttribute("src"));
    assert.match(
      await image.getAttribute("alt"),
      source.includes("/origins/") ? /placeholder/i : /matcha|powder|tray/i,
      "Field archives are identified as provisional and material images are described accurately",
    );
    await fit(page);
  }
}

async function exploreStory(page, root) {
  const anchor =
    (await root.getAttribute("data-about-stories")) === "relationships"
      ? "#relationships-approach"
      : "#about-approach";
  const link = root.getByRole("link", {
    name: "Explore the story",
    exact: true,
  });
  assert.equal(await link.getAttribute("href"), anchor);
  await link.focus();
  await link.press("Enter");
  await eventually(
    () => new URL(page.url()).hash === anchor,
    "Section navigation updates the URL",
  );
  await eventually(
    () =>
      root.locator(anchor).evaluate((node) => {
        const box = node.getBoundingClientRect();
        return box.top < innerHeight && box.bottom > 0;
      }),
    "Keyboard section navigation reaches the approach",
  );
  await settleScroll(page);
  await page.goBack();
  await root.waitFor();
  assert.equal(
    new URL(page.url()).hash,
    "",
    "Browser Back restores the opening URL",
  );
}

async function toggleTheme(root, width, tone) {
  if (width <= 760) await root.locator("summary[data-nav-summary]").click();
  const theme = root.getByRole("switch", {
    name: width <= 760 ? "Dark mode in menu" : "Dark mode",
    exact: true,
  });
  await theme.focus();
  await theme.press("Space");
  const nextTone = tone === "light" ? "dark" : "light";
  await eventually(
    () => root.getAttribute("data-tone").then((value) => value === nextTone),
    "Theme changes in place",
  );
  if (width <= 760) await root.locator("summary[data-nav-summary]").click();
  return nextTone;
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
await mkdir(evidence, { recursive: true });
let activePage;
let activeName;
let passed = 0;

async function contextFor(
  width,
  tone,
  motion = "no-preference",
  javaScriptEnabled = true,
) {
  const context = await browser.newContext({
    viewport: { width, height: width <= 390 ? 844 : 900 },
    hasTouch: width <= 760,
    isMobile: width <= 390,
    reducedMotion: motion,
    javaScriptEnabled,
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
      errors.push("Unexpected remote request or commerce write");
      return route.abort();
    }
    if (url.pathname === "/api/cart")
      return route.fulfill({
        json: { kind: "ready", cart, checkoutEnabled: false },
      });
    if (url.pathname === "/api/catalog")
      return route.fulfill({
        json: {
          status: "ready",
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
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  activePage = page;
  return { context, page, errors };
}

try {
  for (const direction of ["sequence", "relationships"])
    for (const width of [1366, 675, 390, 320])
      for (const tone of ["light", "dark"]) {
        activeName = `${direction}-${width}-${tone}`;
        if (filter && !activeName.includes(filter)) continue;
        const { context, page, errors } = await contextFor(width, tone);
        await page.goto(`${baseURL}/about-exploration?direction=${direction}`);
        const root = page.locator(`[data-about-stories="${direction}"]`);
        await root.waitFor();
        await page.evaluate(() => document.fonts.ready);
        const cartButton = () =>
          page.getByRole("button", { name: "Open cart, 1 item", exact: true });
        await cartButton().waitFor();
        assert.equal(await root.getAttribute("data-tone"), tone);
        await checkFlow(page, root, width);
        await checkImages(page, root);
        await scroll(page, 0);
        await page.screenshot({
          path: resolve(evidence, `${activeName}-opening.png`),
          animations: "disabled",
        });
        await page.screenshot({
          path: resolve(evidence, `${activeName}-full.png`),
          fullPage: true,
          animations: "disabled",
        });
        await exploreStory(page, root);
        await scroll(page, 0);
        const nextTone = await toggleTheme(root, width, tone);
        await cartButton().waitFor();
        await checkFlow(page, root, width);
        const nextDirection =
          direction === "sequence" ? "relationships" : "sequence";
        const nextLabel =
          nextDirection === "sequence"
            ? "01 Material study"
            : "02 Working method";
        const nextConcept = root
          .getByRole("navigation", { name: "About concepts", exact: true })
          .getByRole("link", { name: nextLabel, exact: true });
        await nextConcept.focus();
        await nextConcept.press("Enter");
        const nextRoot = page.locator(
          `[data-about-stories="${nextDirection}"]`,
        );
        await nextRoot.waitFor();
        assert.equal(await nextRoot.getAttribute("data-tone"), nextTone);
        await cartButton().waitFor();
        await checkFlow(page, nextRoot, width);
        await page.goBack();
        await root.waitFor();
        assert.equal(await root.getAttribute("data-tone"), nextTone);
        const shop = root.getByRole("link", {
          name: "Explore matcha in the shop",
          exact: true,
        });
        assert.equal(await shop.getAttribute("href"), "/shop");
        await shop.focus();
        await shop.press("Enter");
        await page.waitForURL((url) => url.pathname === "/shop");
        await cartButton().waitFor();
        assert.equal(
          (await context.cookies()).find(
            (cookie) => cookie.name === "atoma-theme",
          )?.value,
          nextTone,
          "Shop navigation retains the selected theme",
        );
        await page.goBack();
        await root.waitFor();
        assert.equal(await root.getAttribute("data-tone"), nextTone);
        await cartButton().waitFor();
        await fit(page);
        assert.deepEqual(
          errors,
          [],
          "Reading and navigation produce no page errors or commerce writes",
        );
        passed++;
        console.log(
          `${activeName}: sequential reading, imagery, type, keyboard section link and theme/Shop/cart continuity passed`,
        );
        await context.close();
      }
  if (!filter) {
    for (const direction of ["sequence", "relationships"])
      for (const width of [1366, 320]) {
        activeName = `${direction}-${width}-reduced-motion`;
        const { context, page, errors } = await contextFor(
          width,
          "light",
          "reduce",
        );
        await page.goto(`${baseURL}/about-exploration?direction=${direction}`);
        const root = page.locator(`[data-about-stories="${direction}"]`);
        await checkFlow(page, root, width);
        await checkImages(page, root);
        const animated = await root.locator("main *").evaluateAll(
          (nodes) =>
            nodes.filter((node) => {
              const style = getComputedStyle(node);
              return (
                style.animationName !== "none" &&
                style.animationDuration
                  .split(",")
                  .some((value) => Number.parseFloat(value) > 0.01)
              );
            }).length,
        );
        assert.equal(
          animated,
          0,
          "Reduced motion disables editorial animation",
        );
        await exploreStory(page, root);
        assert.deepEqual(errors, []);
        await context.close();

        activeName = `${direction}-${width}-no-javascript`;
        const native = await contextFor(width, "light", "reduce", false);
        await native.page.goto(
          `${baseURL}/about-exploration?direction=${direction}`,
        );
        const nativeRoot = native.page.locator(
          `[data-about-stories="${direction}"]`,
        );
        await checkFlow(native.page, nativeRoot, width);
        await checkImages(native.page, nativeRoot);
        const menu = native.page.locator(
          "details[data-navigation-index][open]",
        );
        if (width <= 760 && (await menu.count()))
          await menu.locator("summary").click();
        await exploreStory(native.page, nativeRoot);
        assert.deepEqual(native.errors, []);
        await native.context.close();
        console.log(
          `${direction} ${width}px: the complete story and native anchor work with reduced motion and without JavaScript`,
        );
      }
    activeName = "flow-aliases-and-archive";
    const { context, page, errors } = await contextFor(1366, "light", "reduce");
    for (const suffix of [
      "",
      "?direction=about",
      "?direction=flow",
      "?direction=unknown",
      "?direction=notes&direction=atlas",
    ]) {
      await page.goto(`${baseURL}/about-exploration${suffix}`);
      await page.locator("[data-about-flow]").waitFor();
    }
    for (const suffix of [
      "?direction=company",
      "?direction=sequence",
      "?direction=film",
      "?direction=material",
    ]) {
      await page.goto(`${baseURL}/about-exploration${suffix}`);
      await page.locator('[data-about-stories="sequence"]').waitFor();
    }
    for (const suffix of [
      "?direction=connections",
      "?direction=desk",
      "?direction=relationships",
      "?direction=method",
    ]) {
      await page.goto(`${baseURL}/about-exploration${suffix}`);
      await page.locator('[data-about-stories="relationships"]').waitFor();
    }
    for (const direction of ["studio", "atlas", "notes", "original"]) {
      await page.goto(`${baseURL}/about-exploration?direction=${direction}`);
      await page.locator(`[data-about-variations="${direction}"]`).waitFor();
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      "Default/invalid URLs open About flow; all earlier explicit concepts remain accessible",
    );
  }
} catch (error) {
  if (activePage && !activePage.isClosed()) {
    console.error(`Failed ${activeName} at ${activePage.url()}`);
    await activePage.screenshot({
      path: resolve(evidence, `${activeName}-failure.png`),
      animations: "disabled",
    });
  }
  throw error;
} finally {
  await browser.close();
}
console.log(`${passed} About flow scenarios passed`);
