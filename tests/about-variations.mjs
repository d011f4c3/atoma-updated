/* Isolated About comparison checks. Only local assets and mocked commerce GETs
 * are allowed. No Shopify or payment operations are performed. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { aboutStudyContent } from "../src/lib/about-study-content.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL =
  process.env.ABOUT_VARIATIONS_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.ABOUT_VARIATIONS_EVIDENCE ??
  ".local/about-variations-0137/browser";
const filter = process.env.ABOUT_VARIATIONS_FILTER;
const directions = ["studio", "atlas", "notes"];
const roots = {
  studio: "[data-about-exploration]",
  atlas: "[data-about-atlas]",
  notes: "[data-about-notes]",
};
const labels = {
  studio: "01 / Studio",
  atlas: "02 / Atlas",
  notes: "03 / Notes",
};
const applicationCopy = {
  studio: [
    "selected for tea service",
    "selected for lattes",
    "selected for recipes and baking",
  ],
  atlas: ["With water", "With milk", "In a recipe"],
  notes: ["Tea service", "Lattes", "Recipes & baking"],
};
const product = {
  id: "barista",
  title: "Barista Matcha",
  handle: "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
  productCode: "UJI-00",
  description: "Local About comparison fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${"a".repeat(43)}`,
      title: "1 kg",
      available: true,
      priceMinor: 2400,
      currency: "JPY",
      options: [{ name: "Format", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
};
const cart = {
  totalQuantity: 1,
  subtotalLabel: "¥2,400",
  totalLabel: "¥2,400",
  lines: [
    {
      lineKey: `v1_${"b".repeat(43)}`,
      productHandle: product.handle,
      productTitle: product.title,
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

async function fit(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "Comparison and page must fit without horizontal overflow",
  );
}

async function checkImages(page, root) {
  const images = root.locator("main img");
  assert.ok(
    (await images.count()) > 0,
    "Every composition includes its own imagery",
  );
  for (const image of await images.all()) {
    if (!(await image.isVisible())) {
      // Studio deliberately hides its decorative texture on small screens.
      // Verify that asset without requiring hidden content to become visible
      // or changing the production element's lazy-loading behavior.
      assert.equal(
        await image.evaluate(async (node) => {
          const asset = new Image();
          asset.src = node.currentSrc || node.src;
          await asset.decode();
          return asset.naturalWidth > 0;
        }),
        true,
        "Responsive hidden image assets remain valid",
      );
      continue;
    }
    await image.scrollIntoViewIfNeeded();
    await eventually(
      () => image.evaluate((node) => node.complete && node.naturalWidth > 0),
      "All variation images should load",
    );
  }
  if (await root.locator("[data-mask-ready]").count())
    await root.locator('[data-mask-ready="true"]').waitFor();
  await fit(page);
}

async function reader(page, root, tone) {
  const trigger = root.getByRole("button", {
    name: "Read the field notes",
    exact: false,
  });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  const prior = { url: page.url(), scroll: await page.evaluate(() => scrollY) };
  await trigger.press("Enter");
  const dialog = page.locator("[data-origins-dialog][open]");
  await dialog.waitFor();
  assert.equal(await dialog.getAttribute("data-tone"), tone);
  await dialog
    .locator(`[data-origins-entry="${aboutStudyContent.fieldStory.slug}"]`)
    .waitFor();
  await dialog
    .getByRole("button", { name: "Back to About", exact: true })
    .waitFor();
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await page
    .locator("[data-origins-dialog] [data-origins-content]")
    .waitFor({ state: "detached" });
  await eventually(
    () => page.url() === prior.url,
    "Reader restores the selected direction query",
  );
  await eventually(
    () => trigger.evaluate((node) => node === document.activeElement),
    "Reader restores trigger focus",
  );
  assert.ok(
    Math.abs((await page.evaluate(() => scrollY)) - prior.scroll) <= 2,
    "Reader keeps the reading position",
  );
}

async function choose(page, direction) {
  const link = page
    .getByRole("navigation", { name: "About direction", exact: true })
    .getByRole("link", { name: labels[direction], exact: true });
  assert.equal(
    await link.getAttribute("href"),
    `/about-exploration?direction=${direction}`,
  );
  await link.focus();
  await link.press("Enter");
  await page.locator(`[data-about-variations="${direction}"]`).waitFor();
  assert.equal(new URL(page.url()).searchParams.get("direction"), direction);
  assert.equal(await link.getAttribute("aria-current"), "page");
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const signatures = new Map();
let activePage;
let activeName;
let passed = 0;
await mkdir(evidence, { recursive: true });
try {
  for (const width of [1366, 320])
    for (const tone of ["light", "dark"])
      for (const motion of ["no-preference", "reduce"])
        for (const direction of directions) {
          const name = `${width}-${tone}-${motion}-${direction}`;
          if (filter && !name.includes(filter)) continue;
          activeName = name;
          const context = await browser.newContext({
            viewport: { width, height: width === 320 ? 740 : 900 },
            reducedMotion: motion,
            hasTouch: width === 320,
            isMobile: width === 320,
          });
          await context.addCookies([
            { name: "atoma-theme", value: tone, url: baseURL },
            { name: "atoma-locale", value: "en", url: baseURL },
          ]);
          const errors = [];
          await context.route("**/*", async (route) => {
            const request = route.request();
            const url = new URL(request.url());
            if (
              url.origin !== origin ||
              !["GET", "HEAD"].includes(request.method())
            ) {
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
                  products: [product],
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
          activePage = page;
          page.setDefaultTimeout(12000);
          page.setDefaultNavigationTimeout(40000);
          page.on("pageerror", (error) => errors.push(error.message));
          await page.goto(
            `${baseURL}/about-exploration?direction=${direction}`,
            { waitUntil: "domcontentloaded" },
          );
          const comparison = page.locator(
            `[data-about-variations="${direction}"]`,
          );
          const root = page.locator(roots[direction]);
          await comparison.waitFor();
          await root.waitFor();
          await page.evaluate(() => document.fonts.ready);
          const cartButton = () =>
            page.getByRole("button", {
              name: "Open cart, 1 item",
              exact: true,
            });
          await cartButton().waitFor();
          assert.equal(await root.getAttribute("data-tone"), tone);
          assert.equal(
            await page
              .getByRole("navigation", { name: "About direction", exact: true })
              .getByRole("link", { name: labels[direction], exact: true })
              .getAttribute("aria-current"),
            "page",
          );
          assert.equal(
            await comparison
              .getByRole("link", { name: "Original", exact: false })
              .getAttribute("href"),
            "/about-exploration?direction=original",
          );
          const scales = await root
            .locator("main h1, main h2, main h3")
            .evaluateAll((nodes) =>
              nodes.map((node) =>
                Number.parseFloat(getComputedStyle(node).fontSize),
              ),
            );
          assert.ok(scales.length >= 4);
          assert.ok(
            Math.max(...scales) <= (width === 320 ? 48 : 88),
            `Heading scale stays compact: ${Math.max(...scales)}px`,
          );
          assert.equal(await root.locator("main h1").count(), 1);
          await fit(page);
          await page.screenshot({
            path: resolve(evidence, `${name}-opening.png`),
            animations: "disabled",
          });
          await checkImages(page, root);
          const accessible = await root.ariaSnapshot();
          for (const text of [
            "Ceremonial Matcha",
            "Barista Matcha",
            "Culinary Matcha",
            "WZKA-00",
            "UJI-00",
            "UJI-01",
          ])
            assert.ok(
              accessible.includes(text),
              `Product copy stays accessible: ${text}`,
            );
          for (const text of applicationCopy[direction])
            assert.ok(
              accessible.includes(text),
              `Application descriptions stay accessible: ${text}`,
            );
          assert.equal(
            await root
              .getByText(aboutStudyContent.provenanceNote, { exact: true })
              .count(),
            1,
          );
          assert.equal(
            await root
              .getByText(aboutStudyContent.community.note, { exact: true })
              .count(),
            1,
          );

          await scroll(page, 0);
          const signature = await root.locator("main").evaluate((node) => {
            const box = (element) => {
              const bounds = element.getBoundingClientRect();
              return [
                Math.round(bounds.x),
                Math.round(bounds.y + scrollY),
                Math.round(bounds.width),
                Math.round(bounds.height),
              ];
            };
            return {
              heading: node.querySelector("h1")?.textContent?.trim(),
              structure: [...node.children]
                .map(
                  (element) =>
                    `${element.tagName}:${element.querySelectorAll("figure,article,section").length}`,
                )
                .join("|"),
              images: [...node.querySelectorAll("img")].map((image) =>
                box(image.parentElement),
              ),
            };
          });
          const group = `${width}-${tone}-${motion}`;
          if (!signatures.has(group)) signatures.set(group, new Map());
          signatures.get(group).set(direction, signature);

          if (motion === "reduce") {
            const transforms = () =>
              root
                .locator("main img")
                .evaluateAll((nodes) =>
                  nodes.map((node) => [
                    getComputedStyle(node).transform,
                    getComputedStyle(node.parentElement).transform,
                  ]),
                );
            const before = await transforms();
            await scroll(
              page,
              await page.evaluate(
                () => document.documentElement.scrollHeight - innerHeight,
              ),
            );
            assert.deepEqual(
              await transforms(),
              before,
              "Reduced motion keeps image transforms static",
            );
            const hiddenContent = await root
              .locator("main p, main h1, main h2, main h3")
              .evaluateAll(
                (nodes) =>
                  nodes.filter(
                    (node) =>
                      getComputedStyle(node).visibility === "hidden" ||
                      Number(getComputedStyle(node).opacity) === 0,
                  ).length,
              );
            assert.equal(
              hiddenContent,
              0,
              "Reduced-motion editorial content stays visible",
            );
          }

          await reader(page, root, tone);
          await scroll(page, 0);
          const theme = page.getByRole("switch", {
            name: "Dark mode",
            exact: true,
          });
          await theme.focus();
          await theme.press("Space");
          const nextTone = tone === "light" ? "dark" : "light";
          await eventually(
            () =>
              root
                .getAttribute("data-tone")
                .then((value) => value === nextTone),
            "Theme changes in place",
          );
          const nextDirection =
            directions[(directions.indexOf(direction) + 1) % directions.length];
          await choose(page, nextDirection);
          const nextRoot = page.locator(roots[nextDirection]);
          assert.equal(
            await nextRoot.getAttribute("data-tone"),
            nextTone,
            "Changing direction retains the selected theme",
          );
          assert.equal(
            await cartButton().count(),
            1,
            "Changing direction preserves shared cart state",
          );
          await reader(page, nextRoot, nextTone);
          await page.goBack();
          await page
            .locator(`[data-about-variations="${direction}"]`)
            .waitFor();
          assert.equal(await root.getAttribute("data-tone"), nextTone);
          assert.equal(await cartButton().count(), 1);
          await fit(page);
          const shop = root.locator('main a[href="/shop"]').last();
          assert.equal(
            await shop.count(),
            1,
            "Each design has a real shop destination",
          );
          await shop.focus();
          await shop.press("Enter");
          await page.waitForURL(
            (url) => url.origin === origin && url.pathname === "/shop",
          );
          await cartButton().waitFor();
          assert.deepEqual(errors, []);
          passed++;
          console.log(
            `${name}: compact layout, images/content, themes, switching, reader and Shop continuity passed`,
          );
          await context.close();
        }
  for (const [group, values] of signatures) {
    if (values.size !== 3) continue;
    const entries = [...values.values()];
    assert.equal(
      new Set(entries.map((entry) => entry.heading)).size,
      3,
      `${group}: distinct editorial openings`,
    );
    assert.equal(
      new Set(entries.map((entry) => entry.structure)).size,
      3,
      `${group}: distinct content structures`,
    );
    assert.equal(
      new Set(entries.map((entry) => JSON.stringify(entry.images))).size,
      3,
      `${group}: distinct image arrangements, not palette variants`,
    );
  }
  if (!filter) {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 900 },
      reducedMotion: "reduce",
    });
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      assert.equal(url.origin, origin);
      assert.ok(["GET", "HEAD"].includes(request.method()));
      if (url.pathname === "/api/cart")
        return route.fulfill({
          json: { kind: "empty", checkoutEnabled: false },
        });
      return route.continue();
    });
    const page = await context.newPage();
    activePage = page;
    activeName = "fallback";
    for (const suffix of [
      "",
      "?direction=unknown",
      "?direction=notes&direction=atlas",
    ]) {
      await page.goto(`${baseURL}/about-exploration${suffix}`);
      await page
        .locator('[data-about-variations="studio"] [data-scale="compact"]')
        .waitFor();
      assert.equal(
        await page
          .getByRole("navigation", { name: "About direction", exact: true })
          .getByRole("link", { name: labels.studio, exact: true })
          .getAttribute("aria-current"),
        "page",
      );
    }
    await page.getByRole("link", { name: "Original", exact: false }).click();
    await page
      .locator('[data-about-variations="original"] [data-scale="original"]')
      .waitFor();
    assert.equal(new URL(page.url()).searchParams.get("direction"), "original");
    console.log(
      "Default/invalid/repeated-query fallback and original reference passed",
    );
    await context.close();
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
console.log(`${passed} About variation scenarios passed`);
