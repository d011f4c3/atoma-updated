/* Local visual-scroll regression. Commerce reads are mocked; remote requests
 * and all writes are blocked. The images, CSS and scrolling behavior are real. */
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
  process.env.ABOUT_EXPLORATION_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.ABOUT_EXPLORATION_EVIDENCE ??
  ".local/about-exploration-0136/browser";
const filter = process.env.ABOUT_EXPLORATION_FILTER;
const product = {
  id: "barista",
  title: "Japanese Barista Matcha Powder for Lattes — 1 kg",
  handle: "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
  productCode: "UJI-00",
  description: "Isolated About exploration fixture.",
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
    await new Promise((done) => setTimeout(done, 40));
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
    "No horizontal page overflow",
  );
  const header = page.locator(
    '[data-about-exploration] [data-brand-part="header"]',
  );
  assert.equal(
    await header.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    true,
    "Shared header fits its container",
  );
}

async function normalFlow(slides) {
  assert.equal(await slides.count(), 3);
  const measurements = await slides.evaluateAll((nodes) =>
    nodes.map((node) => {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      return {
        position: style.position,
        visibility: style.visibility,
        opacity: Number(style.opacity),
        top: box.top,
        bottom: box.bottom,
        height: box.height,
      };
    }),
  );
  for (let index = 0; index < measurements.length; index++) {
    const item = measurements[index];
    assert.ok(
      !["absolute", "fixed"].includes(item.position),
      "Application copy stays in document flow",
    );
    assert.notEqual(item.visibility, "hidden");
    assert.equal(item.opacity, 1);
    assert.ok(item.height > 100);
    if (index)
      assert.ok(
        item.top >= measurements[index - 1].bottom - 1,
        "Application paragraphs do not overlap",
      );
  }
}

async function imagesReady(page, root) {
  const images = root.locator("main img");
  assert.equal(await images.count(), 3);
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await eventually(
      () => image.evaluate((node) => node.complete && node.naturalWidth > 0),
      "Each About photograph must load",
    );
  }
  await root.locator('[data-mask-ready="true"]').waitFor();
  assert.ok(
    await root
      .locator("[data-mask-ready] img")
      .evaluate((node) => getComputedStyle(node).maskImage.startsWith("url(")),
    "The hero powder mask is ready",
  );
}

async function readerRoundTrip(page, root, tone) {
  const trigger = root.getByRole("button", {
    name: "Read the field notes",
    exact: false,
  });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  const before = { url: page.url(), top: await page.evaluate(() => scrollY) };
  await trigger.press("Enter");
  const reader = page.locator("[data-origins-dialog][open]");
  await reader.waitFor();
  assert.equal(await reader.getAttribute("data-tone"), tone);
  await reader
    .locator(`[data-origins-entry="${aboutStudyContent.fieldStory.slug}"]`)
    .waitFor();
  await reader
    .getByRole("button", { name: "Back to About", exact: true })
    .waitFor();
  await page.keyboard.press("Tab");
  assert.equal(
    await reader.evaluate((node) => node.contains(document.activeElement)),
    true,
    "Keyboard focus stays inside the Origins reader",
  );
  await page.keyboard.press("Escape");
  await reader.waitFor({ state: "hidden" });
  await page
    .locator("[data-origins-dialog] [data-origins-content]")
    .waitFor({ state: "detached" });
  await eventually(
    () => page.url() === before.url,
    "Origins reader restores the exploration URL",
  );
  await eventually(
    () => trigger.evaluate((node) => node === document.activeElement),
    "Reader returns keyboard focus to its trigger",
  );
  assert.ok(
    Math.abs((await page.evaluate(() => scrollY)) - before.top) <= 2,
    "Origins reader preserves the reading position",
  );
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
let activePage;
let activeName;
let passed = 0;
await mkdir(evidence, { recursive: true });
try {
  for (const width of [1366, 390, 320]) {
    for (const tone of ["light", "dark"]) {
      for (const motion of ["no-preference", "reduce"]) {
        const name = `${width}-${tone}-${motion}`;
        if (filter && !name.includes(filter)) continue;
        activeName = name;
        const context = await browser.newContext({
          viewport: { width, height: width === 320 ? 740 : 900 },
          reducedMotion: motion,
          hasTouch: width < 760,
          isMobile: width < 760,
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
            errors.push("Unexpected remote request or write");
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
        await page.goto(`${baseURL}/about-exploration`, {
          waitUntil: "domcontentloaded",
        });
        const root = page.locator("[data-about-exploration]");
        const stage = root.locator("div[data-active]");
        const slides = stage.locator("article");
        await root.waitFor();
        await page.evaluate(() => document.fonts.ready);
        await root.locator(`[data-mask-ready="true"]`).waitFor();
        await page
          .getByRole("button", { name: "Open cart, 1 item", exact: true })
          .waitFor();
        assert.equal(await root.getAttribute("data-tone"), tone);
        await eventually(
          () =>
            root
              .getAttribute("data-motion")
              .then((value) => value === (motion === "reduce" ? "off" : "on")),
          "Motion preference is applied",
        );
        const heading = root.getByRole("heading", {
          name: "A closer look.",
          exact: true,
        });
        await heading.waitFor();
        const heroBox = await heading.boundingBox();
        assert.ok(
          heroBox.y >= 0 &&
            heroBox.y + heroBox.height <= (width === 320 ? 740 : 900),
          "Hero heading is visible in the opening viewport",
        );
        await fit(page);
        await page.screenshot({
          path: resolve(evidence, `${name}-hero.png`),
          animations: "disabled",
        });
        await imagesReady(page, root);
        assert.equal(
          await root
            .getByText(aboutStudyContent.provenanceNote, { exact: true })
            .count(),
          1,
        );
        assert.equal(
          await root
            .getByText(aboutStudyContent.community.status, { exact: true })
            .count(),
          1,
        );

        if (width > 760 && motion === "no-preference") {
          const dimensions = await stage.evaluate((node) => ({
            top: node.getBoundingClientRect().top + scrollY,
            travel: node.getBoundingClientRect().height - innerHeight,
          }));
          assert.ok(
            dimensions.travel > 400,
            "Desktop application sequence has scrolling room",
          );
          const observed = [];
          for (const [index, progress] of [
            [0, 0.05],
            [1, 0.5],
            [2, 0.95],
          ]) {
            await scroll(page, dimensions.top + dimensions.travel * progress);
            await eventually(
              () =>
                stage
                  .getAttribute("data-active")
                  .then((value) => value === String(index)),
              `Scrolling selects application ${index + 1}`,
            );
            const actual = await root.evaluate((node) =>
              Number(node.style.getPropertyValue("--application-progress")),
            );
            assert.ok(Math.abs(actual - progress) < 0.04);
            observed.push(
              await stage
                .locator("img")
                .evaluate((node) => getComputedStyle(node).transform),
            );
            await slides.nth(index).waitFor({ state: "visible" });
            await eventually(
              () =>
                slides
                  .nth(index)
                  .evaluate(
                    (node) => Number(getComputedStyle(node).opacity) > 0.99,
                  ),
              "The selected application is fully readable after its transition",
            );
            const accessible = await stage.ariaSnapshot();
            for (const title of [
              "Room for character.",
              "Part of the everyday.",
              "An ingredient with intent.",
            ]) {
              assert.ok(
                accessible.includes(title),
                "Every application remains available to assistive reading at every scroll position",
              );
            }
            await fit(page);
            await page.screenshot({
              path: resolve(evidence, `${name}-application-${index + 1}.png`),
              animations: "disabled",
            });
          }
          assert.notEqual(
            observed[0],
            observed[2],
            "Application image responds to scroll",
          );
        } else {
          await normalFlow(slides);
          for (const slide of await slides.all()) {
            await slide.scrollIntoViewIfNeeded();
            assert.equal(await slide.getByRole("heading").isVisible(), true);
            await fit(page);
          }
        }

        if (motion === "reduce") {
          const transforms = () =>
            root.locator("main img").evaluateAll((nodes) =>
              nodes.map((node) => ({
                image: getComputedStyle(node).transform,
                wrapper: getComputedStyle(node.parentElement).transform,
              })),
            );
          await scroll(page, 0);
          const before = await transforms();
          await scroll(
            page,
            await root
              .getByRole("heading", {
                name: "Relationships take time.",
                exact: true,
              })
              .evaluate((node) => node.getBoundingClientRect().top + scrollY),
          );
          assert.deepEqual(
            await transforms(),
            before,
            "Reduced motion keeps image transforms stable while scrolling",
          );
          assert.equal(
            await root.evaluate((node) =>
              node.style.getPropertyValue("--application-progress"),
            ),
            "",
            "Reduced motion does not run scroll choreography",
          );
          const revealStyles = await root
            .locator("[data-reveal]")
            .evaluateAll((nodes) =>
              nodes.map((node) => ({
                opacity: getComputedStyle(node).opacity,
                visibility: getComputedStyle(node).visibility,
              })),
            );
          assert.ok(
            revealStyles.every(
              (style) => style.opacity === "1" && style.visibility !== "hidden",
            ),
            "Reduced motion exposes all editorial passages",
          );
        }

        await readerRoundTrip(page, root, tone);
        await scroll(page, 0);
        const themeSwitch = page.getByRole("switch", {
          name: "Dark mode",
          exact: true,
        });
        if (width <= 760 && !(await themeSwitch.isVisible())) {
          await root.locator("[data-nav-summary]").focus();
          await page.keyboard.press("Enter");
        }
        const visibleSwitch = (await themeSwitch.isVisible())
          ? themeSwitch
          : page.getByRole("switch", {
              name: "Dark mode in menu",
              exact: true,
            });
        await visibleSwitch.focus();
        await visibleSwitch.press("Space");
        const nextTone = tone === "light" ? "dark" : "light";
        await eventually(
          () =>
            root.getAttribute("data-tone").then((value) => value === nextTone),
          "Keyboard theme control switches in place",
        );
        assert.equal(
          (await context.cookies()).find(
            (cookie) => cookie.name === "atoma-theme",
          )?.value,
          nextTone,
        );
        assert.equal(
          await page
            .getByRole("button", { name: "Open cart, 1 item", exact: true })
            .count(),
          1,
          "Theme and reader preserve the cart count",
        );
        if (width <= 760) await page.keyboard.press("Escape");
        await fit(page);
        const shop = root
          .getByRole("region", { name: "Explore the matcha collection" })
          .getByRole("link", { name: "Explore matcha", exact: false });
        assert.equal(await shop.getAttribute("href"), "/shop");
        assert.equal(
          await root.locator('[data-nav-action="shop"]').getAttribute("href"),
          "/shop",
        );
        await shop.focus();
        await shop.press("Enter");
        await page.waitForURL(
          (url) => url.origin === origin && url.pathname === "/shop",
        );
        await page
          .getByRole("button", { name: "Open cart, 1 item", exact: true })
          .waitFor();
        assert.deepEqual(errors, []);
        passed++;
        console.log(
          `${name}: images, layout/motion, keyboard/theme, Origins return and Shop/cart continuity passed`,
        );
        await context.close();
      }
    }
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
console.log(`${passed} About exploration scenarios passed`);
