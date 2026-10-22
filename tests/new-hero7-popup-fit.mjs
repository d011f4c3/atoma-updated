/* Product learning and buying stay inside the popup. Commerce is isolated. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { createHeroStudyFixture } from "./hero-cx-fixtures.mjs";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.NEW_HERO7_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.NEW_HERO7_EVIDENCE ?? ".local/new-hero-0251/popup-fit";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const profiles = [
  { width: 1440, height: 900, tone: "light", locale: "en" },
  {
    width: 1512,
    height: 709,
    tone: "dark",
    locale: "en",
    deviceScaleFactor: 2,
  },
  { width: 1366, height: 768, tone: "dark", locale: "en" },
  { width: 1280, height: 600, tone: "light", locale: "en" },
  { width: 900, height: 600, tone: "dark", locale: "en" },
  { width: 768, height: 1024, tone: "light", locale: "en" },
  { width: 844, height: 390, tone: "dark", locale: "en" },
  { width: 390, height: 844, tone: "light", locale: "en" },
  { width: 390, height: 844, tone: "dark", locale: "ja" },
  { width: 320, height: 740, tone: "light", locale: "en", textScale: 2 },
];
const requested = process.env.NEW_HERO7_PROFILES?.split(",").filter(Boolean);
const label = ({ width, height, tone, locale, textScale = 1 }) =>
  `${width}x${height}-${tone}-${locale}-${textScale}x`;
const selected = requested
  ? profiles.filter((profile) => requested.includes(label(profile)))
  : profiles;
const hooks = (view) => {
  const prefix = view === "home" ? "data-new-hero7-home" : "data-new-hero7";
  return {
    dialog: `[${prefix}-product-dialog][open]`,
    close: `[${prefix}-product-close]`,
    back: `[${prefix}-product-back]`,
    trigger: (key) => `[${prefix}-application="${key}"]`,
  };
};
async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function catalog(context, failed = false) {
  await context.route("**/api/catalog", (route) =>
    route.fulfill({
      json: failed
        ? {
            status: "unavailable",
            products: [],
            shopUrl: "https://example.invalid",
          }
        : {
            status: "ready",
            shopUrl: "https://example.invalid",
            products: SAMPLE_SET_CONTENTS.map((item, index) => ({
              id: item.key,
              handle: item.productHandle,
              title: item.name,
              productCode: item.productCode,
              description: "Isolated popup fit fixture.",
              imageUrl: null,
              imageAlt: "",
              productUrl: null,
              isFixture: true,
              variants: ["1 kg", "100 g"].map((title, offset) => ({
                id: `v1_${String.fromCharCode(97 + index + offset * 3).repeat(43)}`,
                title,
                available: item.key !== "culinary",
                priceMinor:
                  offset === 0 ? 6000 + index * 1000 : 1000 + index * 100,
                currency: "JPY",
                options: [{ name: "Size", value: title }],
                minimum: 1,
                maximum: 4,
                increment: 1,
              })),
            })),
          },
    }),
  );
}
async function fixture(profile, failed, run) {
  const test = await createHeroStudyFixture(
    browser,
    baseURL,
    profile.width,
    profile.tone,
    profile.locale,
    { deviceScaleFactor: profile.deviceScaleFactor },
  );
  try {
    await test.page.setViewportSize({
      width: profile.width,
      height: profile.height,
    });
    await catalog(test.context, failed);
    await run(test);
    assert.deepEqual(
      test.errors,
      [],
      "No client errors or unexpected requests",
    );
    assert.deepEqual(test.writes, [], "No commerce writes reach the server");
  } finally {
    test.release();
    await test.context.close();
  }
}
async function load(page, profile, view) {
  await page.goto(
    `${baseURL}/new-hero7${view === "home" ? "" : view === "matcha-direct" ? "/matcha" : "?view=matcha"}`,
    {
      waitUntil: "domcontentloaded",
    },
  );
  await eventually(
    () => page.locator("footer [data-theme-switcher]").isEnabled(),
    "Hydration is ready",
  );
  await page.evaluate(() => document.fonts.ready);
  if (profile.textScale)
    await page.addStyleTag({
      content: `html { font-size: ${profile.textScale * 100}% !important; }`,
    });
}
async function withinPopup(locator, dialog, close, description, whole = true) {
  const bounds = await locator.boundingBox();
  const popup = await dialog.boundingBox();
  const closeBounds = await close.boundingBox();
  assert.ok(bounds, `${description} is visible`);
  assert.ok(
    bounds.x >= popup.x - 1 &&
      bounds.x + bounds.width <= popup.x + popup.width + 1,
    `${description} fits the popup width`,
  );
  if (whole)
    assert.ok(
      bounds.y >= closeBounds.y + closeBounds.height &&
        bounds.y + bounds.height <= popup.y + popup.height + 1,
      `${description} is fully visible below the popup header (${JSON.stringify(bounds)} inside ${JSON.stringify(popup)})`,
    );
  else
    assert.ok(
      bounds.y + bounds.height <= popup.y + popup.height + 1 &&
        bounds.y + bounds.height > closeBounds.y + closeBounds.height,
      `${description}'s final line is reachable inside the popup`,
    );
}
async function closeVisible(dialog, close) {
  const bounds = await close.boundingBox();
  const popup = await dialog.boundingBox();
  assert.ok(
    bounds.y >= popup.y && bounds.y + bounds.height <= popup.y + popup.height,
    `Dismissal remains visible while product content scrolls: ${JSON.stringify({ control: await close.textContent(), bounds, popup })}`,
  );
  assert.ok(
    bounds.x >= popup.x && bounds.x + bounds.width <= popup.x + popup.width,
  );
  assert.ok(bounds.width >= 44 && bounds.height >= 44);
  assert.equal(
    await close.evaluate((node) => {
      const box = node.getBoundingClientRect();
      const hit = document.elementFromPoint(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );
      return hit === node || node.contains(hit);
    }),
    true,
    "Close remains a real unobstructed pointer target after content scrolls",
  );
}
async function noOverflow(page, dialog) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
  );
  assert.equal(
    await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    true,
    `Product content never overflows the popup horizontally: ${JSON.stringify(
      await dialog.evaluate((node) => ({
        width: node.clientWidth,
        scroll: node.scrollWidth,
        overflowing: [...node.querySelectorAll("*")]
          .filter(
            (child) =>
              child.checkVisibility() &&
              child.scrollWidth > child.clientWidth + 1,
          )
          .map((child) => ({
            tag: child.tagName,
            className: child.className,
            width: child.clientWidth,
            scroll: child.scrollWidth,
          }))
          .slice(0, 20),
      })),
    )}`,
  );
}

await mkdir(evidence, { recursive: true });
try {
  for (const profile of selected) {
    await fixture(profile, false, async ({ page }) => {
      for (const view of [
        "home",
        "matcha",
        ...([1366, 390].includes(profile.width) && profile.locale === "en"
          ? ["matcha-direct"]
          : []),
      ]) {
        await load(page, profile, view);
        const hook = hooks(view);
        if (view !== "home" && profile.width >= 1366) {
          for (const item of SAMPLE_SET_CONTENTS) {
            const bounds = await page
              .locator(hook.trigger(item.key))
              .boundingBox();
            assert.ok(
              bounds.y >= 0 && bounds.y + bounds.height <= profile.height,
              "All three application choices fit the first desktop viewport",
            );
          }
        }
        for (const item of SAMPLE_SET_CONTENTS) {
          const trigger = page.locator(hook.trigger(item.key));
          await trigger.scrollIntoViewIfNeeded();
          const before = await page.evaluate(() => scrollY);
          const triggerBounds = await trigger.boundingBox();
          await trigger.click();
          const dialog = page.locator(hook.dialog);
          const close = dialog.locator(hook.close);
          const product = dialog.locator(
            `[data-new-hero-product="${item.key}"]:visible`,
          );
          await dialog.waitFor();
          assert.equal(
            await dialog.evaluate((node) => node.matches(":modal")),
            true,
            "Product details use a native modal on each entry path",
          );
          await eventually(
            () =>
              product
                .getAttribute("data-catalog-state")
                .then((state) => state === "ready"),
            "The product fixture is ready",
          );
          assert.equal(
            await dialog.locator("[data-new-hero-product]:visible").count(),
            1,
          );
          assert.ok(
            Math.abs((await page.evaluate(() => scrollY)) - before) <= 2,
          );
          assert.deepEqual(await trigger.boundingBox(), triggerBounds);
          await closeVisible(dialog, close);
          await closeVisible(dialog, dialog.locator(hook.back));
          await noOverflow(page, dialog);
          const add = product.locator("[data-new-hero-add] button");
          const available = item.key !== "culinary";
          await eventually(
            async () =>
              (
                await product.locator("[data-new-hero-price]").textContent()
              ).trim() !== "—",
            "Destination-aware fixture prices are settled",
          );
          if (available)
            await eventually(
              () => add.isEnabled(),
              "Available fixture order controls are ready",
            );
          assert.equal(
            await add.isEnabled(),
            available,
            "Actual catalog availability controls purchase access",
          );
          assert.equal(
            await product.locator("[data-new-hero-format]").count(),
            2,
          );
          const required = product.locator(
            "[data-new-hero-product-name], [data-new-hero-product-code], [data-new-hero-product-overview], summary, [data-new-hero-price], [data-new-hero-format], [data-new-hero-quantity], [data-new-hero-total], [data-new-hero-add] button",
          );
          assert.equal(
            await product.locator("[data-new-hero-product-overview]").count(),
            1,
          );
          const swatch = product.locator("[data-new-hero-product-swatch]");
          const applicationImage = product.locator(
            "[data-product-application-image]",
          );
          assert.equal(await swatch.locator("img").count(), 1);
          await eventually(
            () =>
              swatch
                .locator('[data-masked="true"]')
                .count()
                .then((count) => count === 1),
            "The canonical powder mask removes the photograph's rectangular background",
          );
          const swatchBounds = await swatch.boundingBox();
          const applicationBounds = await applicationImage.boundingBox();
          assert.ok(
            applicationBounds.y >= swatchBounds.y + swatchBounds.height,
            "The application photo follows the matcha swatch",
          );
          if (profile.width >= 1000) {
            const profileBounds = await product
              .locator("summary")
              .boundingBox();
            assert.ok(
              profileBounds.x >= swatchBounds.x + swatchBounds.width,
              "Preparation & profile sits to the right of the images",
            );
          }
          await product.locator("img").evaluateAll(async (nodes) =>
            Promise.all(
              nodes.map(async (image) => {
                image.loading = "eager";
                await image.decode().catch(() => {});
              }),
            ),
          );
          if (profile.width >= 1000) {
            const photo = await product
              .locator("[data-product-application-image] img")
              .boundingBox();
            assert.ok(
              photo.height <= 301,
              "Desktop application photography stays compact",
            );
            for (const control of await required.all())
              await withinPopup(
                control,
                dialog,
                close,
                `${label(profile)} ${view}/${item.key} ${(await control.getAttribute("data-new-hero-product-name")) ?? (await control.getAttribute("data-new-hero-format")) ?? (await control.evaluate((node) => node.tagName))}`,
              );
            await page.screenshot({
              path: resolve(
                evidence,
                `${label(profile)}-${view}-${item.key}-default.png`,
              ),
            });
          } else {
            for (const control of await required.all()) {
              await control.evaluate((node) =>
                node.scrollIntoView({ block: "end", behavior: "instant" }),
              );
              await withinPopup(
                control,
                dialog,
                close,
                `${view}/${item.key} mobile control`,
                false,
              );
              await closeVisible(dialog, close);
            }
          }
          const smallFormat = product.locator("[data-new-hero-format]").last();
          await smallFormat.click();
          assert.equal(await smallFormat.getAttribute("aria-pressed"), "true");
          const increase = product.locator('[aria-label="Increase quantity"]');
          if (profile.locale === "en") {
            assert.equal(await increase.isEnabled(), available);
            if (available) {
              await increase.click();
              assert.equal(
                await product.locator("[data-new-hero-quantity]").textContent(),
                "2",
              );
            }
          }
          const details = product.locator(
            `[data-new-hero-product-profile="${item.key}"]`,
          );
          const popupBeforeExpansion = await dialog.boundingBox();
          const closeBeforeExpansion = await close.boundingBox();
          await details.locator("summary").click();
          assert.equal(await details.getAttribute("open"), "");
          assert.equal(await details.locator("dd").count(), 7);
          if (profile.width >= 1000) {
            assert.deepEqual(
              await dialog.boundingBox(),
              popupBeforeExpansion,
              "Expanding learning keeps the desktop popup in place",
            );
            assert.deepEqual(
              await close.boundingBox(),
              closeBeforeExpansion,
              "Expanding learning keeps Close in place",
            );
          }
          for (const control of await product
            .locator(
              "[data-new-hero-price], [data-new-hero-format], [data-new-hero-quantity], [data-new-hero-total], [data-new-hero-add] button",
            )
            .all()) {
            await control.evaluate((node) =>
              node.scrollIntoView({ block: "end", behavior: "instant" }),
            );
            await withinPopup(
              control,
              dialog,
              close,
              "Purchase stays reachable after expanding the shared content scrollport",
            );
            await closeVisible(dialog, close);
          }
          const scrollports = await dialog.evaluate((node) =>
            [...node.querySelectorAll("*")]
              .filter(
                (child) =>
                  child.checkVisibility() &&
                  child.scrollHeight > child.clientHeight + 1 &&
                  /auto|scroll/.test(getComputedStyle(child).overflowY),
              )
              .map((child) =>
                child.hasAttribute("data-new-hero7-product-scroll"),
              ),
          );
          assert.ok(
            scrollports.every(Boolean) && scrollports.length <= 1,
            "Product content has only one scrolling pane beneath fixed dismissal controls",
          );
          const last = details.locator("p").last();
          await last.evaluate((node) =>
            node.scrollIntoView({ block: "end", behavior: "instant" }),
          );
          await withinPopup(
            last,
            dialog,
            close,
            "The complete preparation guidance",
            false,
          );
          await closeVisible(dialog, close);
          await noOverflow(page, dialog);
          assert.ok(
            Math.abs((await page.evaluate(() => scrollY)) - before) <= 2,
            "Learning inside the popup never scrolls the gallery",
          );
          await add.evaluate((node) =>
            node.scrollIntoView({ block: "end", behavior: "instant" }),
          );
          await withinPopup(
            add,
            dialog,
            close,
            "Purchase remains reachable after reading the profile",
          );
          await closeVisible(dialog, close);
          if (item.key === "ceremonial")
            await page.screenshot({
              path: resolve(evidence, `${label(profile)}-${view}-expanded.png`),
            });
          await (
            item.key === "ceremonial" ? dialog.locator(hook.back) : close
          ).click();
          await dialog.waitFor({ state: "hidden" });
          await eventually(
            () => trigger.evaluate((node) => node === document.activeElement),
            "Closing returns focus to the initiating card",
          );
          assert.ok(
            Math.abs((await page.evaluate(() => scrollY)) - before) <= 2,
          );
          assert.deepEqual(await trigger.boundingBox(), triggerBounds);
        }
      }
    });
    console.log(
      `Popup fit, multiformat/availability, expanded profiles and stable gallery: ${label(profile)}`,
    );
  }

  await fixture(profiles[0], false, async ({ page }) => {
    for (const view of ["home", "matcha"]) {
      await load(page, profiles[0], view);
      const hook = hooks(view);
      const trigger = page.locator(hook.trigger("barista"));
      await trigger.click();
      const dialog = page.locator(hook.dialog);
      const close = dialog.locator(hook.close);
      await dialog.waitFor();
      const details = dialog.locator(
        '[data-new-hero-product-profile="barista"]',
      );
      await details.locator("summary").click();
      for (const viewport of [
        { width: 900, height: 600 },
        { width: 768, height: 1024 },
        { width: 844, height: 390 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(viewport);
        const before = await page.evaluate(() => scrollY);
        await details
          .locator("p")
          .last()
          .evaluate((node) =>
            node.scrollIntoView({ block: "end", behavior: "instant" }),
          );
        await closeVisible(dialog, close);
        await closeVisible(dialog, dialog.locator(hook.back));
        await noOverflow(page, dialog);
        assert.equal(
          await page.evaluate(() => scrollY),
          before,
          "Resized popup content never scrolls the underlying view",
        );
        assert.equal(
          await dialog.evaluate((node) => node.matches(":modal")),
          true,
        );
        await page.screenshot({
          path: resolve(
            evidence,
            `${view}-resized-${viewport.width}x${viewport.height}.png`,
          ),
        });
      }
      await close.click();
      await dialog.waitFor({ state: "hidden" });
      await eventually(
        () => trigger.evaluate((node) => node === document.activeElement),
        "Closing after resize restores the original trigger",
      );
    }
  });
  console.log(
    "Fixed popup dismissal remains visible and clickable through internal scrolling and live resizing",
  );

  const profile = profiles.find((entry) => entry.width === 1366);
  await fixture(profile, true, async ({ page }) => {
    for (const view of ["home", "matcha"]) {
      await load(page, profile, view);
      const hook = hooks(view);
      await page.locator(hook.trigger("barista")).click();
      const dialog = page.locator(hook.dialog);
      const close = dialog.locator(hook.close);
      const product = dialog.locator('[data-new-hero-product="barista"]');
      await eventually(
        () =>
          product
            .getAttribute("data-catalog-state")
            .then((state) => state === "unavailable"),
        "Unavailable catalog state is shown",
      );
      assert.equal(await product.locator("[data-new-hero-format]").count(), 0);
      assert.equal(
        await product.locator("[data-new-hero-add] button").isDisabled(),
        true,
      );
      assert.equal(
        await product.locator("[data-new-hero-price]").textContent(),
        "—",
      );
      await withinPopup(
        product.locator("[data-new-hero-add] button"),
        dialog,
        close,
        "Unavailable purchase feedback",
      );
      await withinPopup(
        dialog.getByRole("button", { name: "Try again", exact: true }),
        dialog,
        close,
        "Catalog retry action",
      );
      await noOverflow(page, dialog);
      await closeVisible(dialog, close);
      await close.click();
      await dialog.waitFor({ state: "hidden" });
    }
  });
  console.log(
    "Unavailable catalogs keep learning and honest purchase feedback usable in both popups",
  );
} finally {
  await browser.close();
}
