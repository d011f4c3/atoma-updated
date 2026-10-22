/* Dedicated phone homepage: all three applications, direct learning and responsive access. */
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
  process.env.MOBILE_HOMEPAGE_EVIDENCE ?? ".local/mobile-trio/tests";
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

const application = (page, key) =>
  page.locator(`[data-mobile-hero-learn="${key}"]`);
const popup = (page) => page.locator("[data-new-hero7-home-product-dialog]");
const close = (page) => page.locator("[data-new-hero7-home-product-close]");
const product = (page, key) =>
  popup(page).locator(`[data-new-hero-product="${key}"]:visible`);
const quantity = (page, key) =>
  product(page, key).locator("[data-new-hero-quantity]");

async function inspectPhone(page, label, firstViewport = false) {
  assert.equal(await page.locator("h1:visible").count(), 1);
  assert.equal(await page.locator("[data-mobile-home-hero]").isVisible(), true);
  assert.equal(await page.locator("[data-new-hero7-hero]").isVisible(), false);
  assert.equal(
    await page.locator("[data-mobile-home-sections]").isVisible(),
    true,
  );
  assert.equal(
    await page.locator("[data-mobile-hero-application]:visible").count(),
    3,
    `${label}: the complete application range is visible together`,
  );
  assert.equal(
    await page.locator("[data-mobile-home-hero] [role=tablist]").count(),
    0,
    `${label}: application learning requires no intermediate selection`,
  );
  assert.equal(
    await page
      .locator("[data-mobile-home-hero] a, [data-mobile-home-hero] button")
      .count(),
    4,
    `${label}: the hero presents three products and one Sample Set action`,
  );
  assert.equal(
    await page.locator("[data-mobile-home-hero] p:not([role=status])").count(),
    1,
    `${label}: one concise introduction accompanies the hero`,
  );
  const introduction = page.locator("[data-mobile-home-hero] h1 + p");
  assert.equal(await introduction.isVisible(), true);
  assert.ok((await introduction.textContent()).trim().length > 0);
  assert.ok(
    await introduction.evaluate(
      (node) => parseFloat(getComputedStyle(node).fontSize) >= 16,
    ),
    `${label}: the restored introduction remains readable`,
  );
  if ((await page.locator("html").getAttribute("lang"))?.startsWith("en"))
    assert.equal(
      await introduction.textContent(),
      "Authentic Japanese matcha selected for tea service, lattes and recipes.",
    );
  for (const item of SAMPLE_SET_CONTENTS) {
    const learn = application(page, item.key);
    const code = learn.getByText(`◇ ${item.productCode}`, { exact: true });
    assert.equal(await code.isVisible(), true);
    assert.ok(
      (await learn.getAttribute("aria-label")).includes(item.productCode),
    );
    assert.equal(
      await code.evaluate((node) => {
        const label = node.previousElementSibling.getBoundingClientRect();
        const code = node.getBoundingClientRect();
        return label.height > 0 && code.top >= label.bottom - 1;
      }),
      true,
      `${label}: ${item.productCode} sits beneath its application name`,
    );
  }
  assert.deepEqual(
    await page
      .locator("[data-mobile-home-section]:visible")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-mobile-home-section")),
      ),
    ["origin"],
    `${label}: one concise Origins feature follows the hero`,
  );
  const geometry = await page.evaluate(() => {
    const hero = document.querySelector("[data-mobile-home-hero]");
    const rect = (node) => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height, bottom: y + height };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      rootFontSize: parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      ),
      scrollWidth: document.documentElement.scrollWidth,
      hero: rect(hero),
      heading: rect(hero.querySelector("h1")),
      preview: rect(hero.querySelector("[data-mobile-hero-preview]")),
      primary: rect(hero.querySelector("[data-mobile-hero-samples]")),
      actions: Array.from(hero.querySelectorAll("a,button")).map((node) => ({
        role: node.getAttribute("role") ?? node.tagName.toLowerCase(),
        label: node.getAttribute("data-mobile-hero-learn") ?? node.textContent,
        ...rect(node),
      })),
      applications: Array.from(
        hero.querySelectorAll("[data-mobile-hero-application]"),
      ).map((node) => ({
        key: node.getAttribute("data-mobile-hero-application"),
        image: rect(node.querySelector("img").parentElement),
        crop: getComputedStyle(node.querySelector("img")).left,
        ...rect(node),
      })),
    };
  });
  assert.ok(
    geometry.scrollWidth <= geometry.viewport.width + 1,
    `${label}: no horizontal overflow`,
  );
  if (firstViewport) {
    assert.ok(
      geometry.hero.bottom >= geometry.viewport.height - 1,
      `${label}: the hero fills the available first viewport beneath navigation`,
    );
    assert.ok(
      geometry.primary.bottom <= geometry.viewport.height + 1,
      `${label}: the Sample Set action stays visible within the full-height hero`,
    );
  }
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
  assert.equal(
    new Set(geometry.applications.map((item) => item.crop)).size,
    3,
    `${label}: each application shows its own crop`,
  );
  for (const item of geometry.applications) {
    assert.ok(
      item.image.width >= 96 && item.image.height >= 56,
      `${label}: ${item.key} has a substantial visible object`,
    );
    assert.ok(
      item.image.x >= -1 &&
        item.image.x + item.image.width <= geometry.viewport.width + 1,
      `${label}: the complete ${item.key} image fits the phone`,
    );
    if (geometry.rootFontSize <= 16)
      assert.ok(
        item.image.width <= geometry.viewport.width * 0.45 + 1,
        `${label}: ${item.key} remains compact within the mobile composition`,
      );
    if (firstViewport)
      assert.ok(
        item.y >= 0 && item.bottom <= geometry.viewport.height + 1,
        `${label}: ${item.key} and its label are visible in the first viewport`,
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
      await inspectPhone(page, "390-dark", true);
      const preview = page.locator("[data-mobile-hero-preview]");
      const initialURL = page.url();
      const initialScroll = await page.evaluate(() => scrollY);
      const initialHeight = (await preview.boundingBox()).height;

      for (const [index, item] of SAMPLE_SET_CONTENTS.entries()) {
        const learn = application(page, item.key);
        assert.match(
          await learn.getAttribute("aria-label"),
          new RegExp(item.name),
        );
        assert.equal(await learn.getAttribute("aria-haspopup"), "dialog");
        assert.equal(
          await learn.getAttribute("href"),
          `/?application=${item.key}`,
          "Every visible application directly opens its exact matcha",
        );
        const before = await learn.boundingBox();
        const object = await page
          .locator(`[data-mobile-hero-application="${item.key}"] img`)
          .evaluate((node) => {
            const box = node.parentElement.getBoundingClientRect();
            return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
          });
        await page.touchscreen.tap(object.x, object.y);
        await popup(page).waitFor({ state: "visible" });
        assert.equal(
          new URL(page.url()).searchParams.get("application"),
          item.key,
        );
        assert.equal(new URL(page.url()).searchParams.get("view"), null);
        assert.equal(await product(page, item.key).count(), 1);
        assert.equal(
          await product(page, item.key)
            .locator("[data-new-hero-product-name]")
            .textContent(),
          item.name,
          "The popup presents the requested canonical product",
        );
        assert.equal(
          await close(page).evaluate((node) => node === document.activeElement),
          true,
          "Product learning initially focuses Close",
        );
        assert.equal(
          await page.evaluate(() => scrollY),
          initialScroll,
          "Opening product learning leaves the hero in place",
        );
        assert.deepEqual(await learn.boundingBox(), before);
        for (let count = 0; count <= index; count++)
          await product(page, item.key)
            .getByRole("button", { name: "Increase quantity", exact: true })
            .click();
        assert.equal(
          await quantity(page, item.key).textContent(),
          `${index + 2}`,
        );
        if (index === 0) await close(page).tap();
        else if (index === 1) await page.keyboard.press("Escape");
        else await page.goBack();
        await popup(page).waitFor({ state: "hidden" });
        assert.equal(page.url(), initialURL);
        assert.equal(await page.evaluate(() => scrollY), initialScroll);
        assert.equal(
          await learn.evaluate((node) => node === document.activeElement),
          true,
          "Touch dismissal restores the exact application link",
        );
        assert.ok(
          Math.abs((await preview.boundingBox()).height - initialHeight) < 1,
          "The complete application composition stays stable",
        );
      }

      await application(page, "ceremonial").focus();
      for (const item of SAMPLE_SET_CONTENTS.slice(1)) {
        await page.keyboard.press("Tab");
        assert.equal(
          await application(page, item.key).evaluate(
            (node) => node === document.activeElement,
          ),
          true,
          "All three application links are reachable in natural keyboard order",
        );
      }
      await page.keyboard.press("Enter");
      await popup(page).waitFor({ state: "visible" });
      assert.equal(await product(page, "culinary").count(), 1);
      await page.keyboard.press("Escape");
      await popup(page).waitFor({ state: "hidden" });

      // Forward restores the product recorded in history even after focus moves.
      await application(page, "barista").focus();
      await page.goForward();
      await popup(page).waitFor({ state: "visible" });
      assert.equal(
        new URL(page.url()).searchParams.get("application"),
        "culinary",
      );
      assert.equal(await quantity(page, "culinary").textContent(), "4");
      await page.keyboard.press("Escape");
      await popup(page).waitFor({ state: "hidden" });
      assert.equal(
        await application(page, "culinary").evaluate(
          (node) => node === document.activeElement,
        ),
        true,
        "Forward dismissal restores the recorded product trigger",
      );

      {
        await page.locator("[data-mobile-hero-samples]").tap();
        await page.waitForFunction(
          () =>
            document
              .querySelector("[data-homepage]")
              ?.getAttribute("data-active-view") === "samples",
        );
        assert.equal(new URL(page.url()).searchParams.get("view"), "samples");
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
          await page.locator("[data-mobile-hero-application]:visible").count(),
          3,
          "Returning home restores all three applications",
        );
        assert.equal(
          await page
            .locator("[data-mobile-home-hero] h1")
            .evaluate((node) => node === document.activeElement),
          true,
        );
      }

      for (const [index, item] of SAMPLE_SET_CONTENTS.entries()) {
        const learn = application(page, item.key);
        await learn.scrollIntoViewIfNeeded();
        const top = await page.evaluate(() => scrollY);
        await learn.tap();
        await popup(page).waitFor({ state: "visible" });
        assert.equal(
          await quantity(page, item.key).textContent(),
          `${index + 2}`,
          "Each matcha retains its independent order across view navigation",
        );
        await close(page).tap();
        await popup(page).waitFor({ state: "hidden" });
        assert.equal(await page.evaluate(() => scrollY), top);
        assert.equal(
          await learn.evaluate((node) => node === document.activeElement),
          true,
        );
      }
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
        await inspectPhone(page, `${width}-${tone}-${locale}`, height >= 800);
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

  await run(
    "direct-entry-and-responsive-return",
    390,
    "light",
    "en",
    {},
    async ({ page }) => {
      await ready(page, "/?application=barista");
      await popup(page).waitFor({ state: "visible" });
      assert.equal(await product(page, "barista").count(), 1);
      await close(page).tap();
      await popup(page).waitFor({ state: "hidden" });
      assert.equal(new URL(page.url()).search, "");
      assert.equal(
        await application(page, "barista").evaluate(
          (node) => node === document.activeElement,
        ),
        true,
        "Direct product entry returns to the matching visible mobile link",
      );

      await application(page, "barista").tap();
      await popup(page).waitFor({ state: "visible" });
      await page.setViewportSize({ width: 1440, height: 900 });
      assert.equal(await product(page, "barista").count(), 1);
      await close(page).click();
      await popup(page).waitFor({ state: "hidden" });
      assert.equal(
        await page
          .locator('[data-new-hero7-home-application="barista"]')
          .evaluate((node) => node === document.activeElement),
        true,
        "A resized popup returns focus to the visible desktop application",
      );

      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await application(page, "culinary").tap();
      await popup(page).waitFor({ state: "visible" });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.setViewportSize({ width: 390, height: 844 });
      await close(page).tap();
      await popup(page).waitFor({ state: "hidden" });
      assert.equal(
        await application(page, "culinary").evaluate(
          (node) => node === document.activeElement,
        ),
        true,
        "Resizing back restores the exact mobile trigger",
      );
      assert.equal(await page.evaluate(() => scrollY), 0);
    },
  );

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

    await ready(page, "/?view=samples");
    const samples = page.locator('[data-new-hero7-view="samples"]:visible');
    const sampleOrder = samples.locator("[data-new-hero7-sample-purchase]");
    const setQuantity = sampleOrder.locator(
      'output[aria-label="Set quantity"]',
    );
    await sampleOrder
      .getByRole("button", { name: "Increase quantity", exact: true })
      .click();
    assert.equal(await setQuantity.textContent(), "2");
    const sampleTrigger = samples.locator(
      '[data-new-hero7-sample-tab="ceremonial"]',
    );
    await sampleTrigger.focus();
    await sampleTrigger.click();
    const sampleDialog = samples.locator("[data-new-hero7-sample-dialog]");
    await sampleDialog.waitFor({ state: "visible" });
    await page.setViewportSize({ width: 390, height: 844 });
    await sampleDialog.waitFor({ state: "visible" });
    assert.equal(
      await sampleDialog.evaluate(
        (node) => node.matches(":modal") && node.checkVisibility(),
      ),
      true,
      "An open desktop sample profile remains visible after resizing to mobile",
    );
    assert.equal(await setQuantity.textContent(), "2");
    await page.screenshot({
      path: `${evidence}/desktop-sample-profile-resized.png`,
    });
    await page.keyboard.press("Escape");
    await sampleDialog.waitFor({ state: "hidden" });
    assert.equal(await sampleTrigger.isVisible(), true);
    assert.equal(
      await sampleTrigger.evaluate((node) => node === document.activeElement),
      true,
      "Escape restores the exact visible sample trigger after responsive resizing",
    );
    assert.equal(
      await samples
        .getByRole("button", { name: "Inside the set", exact: true })
        .getAttribute("aria-expanded"),
      "true",
      "The mobile contents disclosure remains open around the returned trigger",
    );
    assert.equal(
      await setQuantity.textContent(),
      "2",
      "Responsive sample learning retains the selected set quantity",
    );

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
      await page.waitForFunction(() => {
        const images = Array.from(
          document.querySelectorAll("[data-mobile-hero-preview] img"),
        );
        return images.length === 3 && images.every((image) => image.complete);
      });
      assert.equal(await page.locator("[data-homepage][inert]").count(), 0);
      await application(page, "ceremonial").tap();
      await popup(page).waitFor({ state: "visible" });
      assert.equal(
        await product(page, "ceremonial").count(),
        1,
        "The three-object hero is interactive immediately after loading",
      );
      await close(page).tap();
      await popup(page).waitFor({ state: "hidden" });
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
      for (const item of SAMPLE_SET_CONTENTS) {
        await application(page, item.key).tap();
        await popup(page).waitFor({ state: "visible" });
        assert.equal(await product(page, item.key).count(), 1);
        await page.keyboard.press("Escape");
        await popup(page).waitFor({ state: "hidden" });
      }
    },
  );
  await writeFile(
    `${evidence}/report.json`,
    JSON.stringify({ results, geometries }, null, 2),
  );
} finally {
  await browser.close();
}
