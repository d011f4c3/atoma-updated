/* Material study shares native-navigation contracts and adds exact reference
 * imagery, bounded pointer movement and system reduced-motion coverage. */
import assert from "node:assert/strict";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { getProductApplicationImage } from "../src/lib/product-application-imagery.ts";
import { translate } from "../src/lib/i18n/index.ts";
import { runHeroCxEntry } from "./hero-cx-entry.mjs";

const source = "/images/hero/matcha-tray-concept-02.webp";
const alt =
  "An overhead view of fine green matcha in a shallow rectangular metal tray.";
const motionValues = (motion) =>
  motion.evaluate((node) =>
    ["--material-x", "--material-y", "--material-rotate"].map(
      (property) =>
        Number.parseFloat(node.style.getPropertyValue(property)) || 0,
    ),
  );

await runHeroCxEntry({
  layout: "material",
  envPrefix: "HERO_CX_MATERIAL",
  defaultEvidence: ".local/hero-cx-study-0232/after",
  failedImageText: "Material image unavailable.",
  async checkImage({ locale, hero, baseURL, eventually }) {
    const frame = hero.locator("[data-cx-hero-image]");
    await eventually(
      async () => (await frame.getAttribute("data-image-state")) === "ready",
      "The material tray loads",
    );
    assert.equal(await frame.getAttribute("data-image-source"), source);
    const image = frame.locator("img");
    assert.equal(await image.count(), 1);
    const src = new URL(await image.getAttribute("src"), baseURL);
    assert.equal(src.searchParams.get("url") ?? src.pathname, source);
    assert.equal(await image.getAttribute("alt"), translate(locale, alt));
    if (locale !== "en") assert.notEqual(translate(locale, alt), alt);
    for (const product of SAMPLE_SET_CONTENTS) {
      const reference = getProductApplicationImage(product.productHandle);
      const link = hero.locator(`[data-cx-product-link="${product.key}"]`);
      const thumbnail = link.locator(
        `[data-cx-application-image="${product.key}"]`,
      );
      await eventually(
        async () =>
          (await thumbnail.getAttribute("data-image-state")) === "ready",
        `${product.key} reference loads`,
      );
      assert.equal(
        await thumbnail.getAttribute("data-image-source"),
        reference.src,
      );
      const thumb = thumbnail.locator("img");
      const thumbSrc = new URL(await thumb.getAttribute("src"), baseURL);
      assert.equal(
        thumbSrc.searchParams.get("url") ?? thumbSrc.pathname,
        reference.src,
      );
      assert.equal(
        await thumb.getAttribute("alt"),
        translate(locale, reference.alt),
      );
    }
    assert.equal(
      (await hero.locator("[data-cx-hero-reference]").textContent()).trim(),
      translate(
        locale,
        "Bowl photo · Latte & cake AI references · Product photography pending",
      ),
    );
    assert.equal(
      await hero
        .locator("[data-cx-material-motion] > svg[aria-hidden='true']")
        .count(),
      1,
      "Decorative specimen field preserves the material presentation",
    );
  },
  async checkSpecific({ hero, eventually, width, locale }) {
    const motion = hero.locator("[data-cx-material-motion]");
    await eventually(
      async () =>
        (await motion.getAttribute("data-motion-enabled")) === "false",
      "Matrix profiles respect reduced motion",
    );
    assert.deepEqual(await motionValues(motion), [0, 0, 0]);
    assert.equal(
      await hero
        .locator(
          "a [data-scramble-glyph],button [data-scramble-glyph],p [data-scramble-glyph]",
        )
        .count(),
      0,
      "Navigation and supporting text do not scramble",
    );
    if (width <= 760) {
      const fontSize = (locator) =>
        locator.evaluate((node) =>
          Number.parseFloat(getComputedStyle(node).fontSize),
        );
      assert.ok(
        (await fontSize(hero.locator("[data-cx-samples]"))) >= 14,
        "The primary action uses at least 14 px type on mobile",
      );
      assert.ok(
        (await fontSize(
          hero.getByText(
            translate(
              locale,
              "Japanese matcha for tea service, lattes and recipes.",
            ),
            { exact: true },
          ),
        )) >= 16,
        "The mobile explanation uses at least 16 px type",
      );
      assert.ok(
        (await fontSize(hero.locator("[data-cx-hero-reference]"))) >= 12,
        "Reference provenance stays readable on mobile",
      );
      for (const name of await hero
        .locator("[data-cx-application-name]")
        .all()) {
        assert.ok((await fontSize(name)) >= 14);
      }
    }
  },
  async checkFailure({ hero, eventually }) {
    for (const product of SAMPLE_SET_CONTENTS) {
      const thumbnail = hero.locator(
        `[data-cx-application-image="${product.key}"]`,
      );
      await eventually(
        async () =>
          (await thumbnail.getAttribute("data-image-state")) === "failed",
        `${product.key} has a truthful failed-image state`,
      );
      assert.equal(await thumbnail.locator("img").count(), 0);
      const fallback = thumbnail.locator(
        "[data-cx-application-image-fallback]",
      );
      assert.equal(await fallback.getAttribute("role"), "img");
      assert.equal(
        await fallback.getAttribute("aria-label"),
        "Application image unavailable.",
      );
      assert.equal((await fallback.textContent()).trim(), "—");
      assert.equal(
        await fallback.evaluate(
          (node) =>
            node.scrollWidth <= node.clientWidth + 1 &&
            node.scrollHeight <= node.clientHeight + 1,
        ),
        true,
        "The compact image fallback fits its thumbnail",
      );
      assert.equal(
        await hero
          .locator(`[data-cx-product-link="${product.key}"]`)
          .getAttribute("aria-disabled"),
        null,
      );
    }
  },
  async checkEdges({ setup, url, eventually, clean }) {
    const normal = await setup(1440, "light", "en", {
      reducedMotion: "no-preference",
    });
    try {
      const { page } = normal;
      await page.goto(url, { waitUntil: "networkidle" });
      const motion = page.locator("[data-cx-material-motion]");
      await eventually(
        async () =>
          (await motion.getAttribute("data-motion-enabled")) === "true",
        "Fine-pointer motion activates under the system preference",
      );
      const bounds = await motion.boundingBox();
      assert.ok(bounds?.width && bounds.height);
      const topRight = { x: bounds.x + bounds.width - 2, y: bounds.y + 2 };
      await page.mouse.move(topRight.x, topRight.y);
      await eventually(
        async () => (await motionValues(motion))[0] > 0,
        "Pointer movement reaches the material",
      );
      let values = await motionValues(motion);
      assert.ok(
        Math.abs(values[0]) <= 10 &&
          Math.abs(values[1]) <= 6 &&
          Math.abs(values[2]) <= 1,
        "Pointer transform stays bounded",
      );
      assert.notEqual(
        await page
          .locator("[data-cx-hero-image]")
          .evaluate((node) => getComputedStyle(node).transform),
        "none",
        "CSS applies material movement",
      );
      await motion.dispatchEvent("pointermove", {
        pointerType: "mouse",
        clientX: bounds.x + bounds.width * 5,
        clientY: bounds.y + bounds.height * 5,
      });
      assert.deepEqual(
        await motionValues(motion),
        [10, 6, 1],
        "Outside coordinates remain clamped",
      );
      await motion.dispatchEvent("pointercancel");
      assert.deepEqual(await motionValues(motion), [0, 0, 0]);
      await page.mouse.move(bounds.x + 2, bounds.y + 2);
      await page.mouse.move(1, 1);
      assert.deepEqual(
        await motionValues(motion),
        [0, 0, 0],
        "Pointer leave resets the material",
      );
      await page.mouse.move(topRight.x, topRight.y);
      await page.evaluate(() => window.dispatchEvent(new Event("blur")));
      assert.deepEqual(
        await motionValues(motion),
        [0, 0, 0],
        "Window blur resets the material",
      );
      await page.mouse.move(bounds.x + 2, bounds.y + 2);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await eventually(
        async () =>
          (await motion.getAttribute("data-motion-enabled")) === "false",
        "Changing the system preference disables motion in place",
      );
      values = await motionValues(motion);
      assert.deepEqual(values, [0, 0, 0]);
      await page.mouse.move(topRight.x, topRight.y);
      assert.deepEqual(
        await motionValues(motion),
        [0, 0, 0],
        "Reduced motion remains stationary",
      );
      await page.evaluate(() => {
        window.__materialNode = document.querySelector("[data-cx-hero-image]");
      });
      await page.locator("[data-cx-tone]").selectOption("dark");
      await eventually(
        async () =>
          (await page
            .locator("[data-hero-cx-study]")
            .getAttribute("data-tone")) === "dark",
        "Theme changes in place",
      );
      assert.equal(
        await page.evaluate(
          () =>
            window.__materialNode ===
            document.querySelector("[data-cx-hero-image]"),
        ),
        true,
        "Theme preserves the mounted material image",
      );
      const links = page.locator("[data-cx-samples],[data-cx-product-link]");
      const textBefore = await links.allTextContents();
      for (const link of await links.all()) {
        await link.focus();
        await link.hover();
      }
      await page.waitForTimeout(400);
      assert.deepEqual(
        await links.allTextContents(),
        textBefore,
        "Control labels stay stable during focus and hover",
      );
      clean(normal);
    } finally {
      normal.release();
      await normal.context.close();
    }
    const touch = await setup(390, "dark", "en", {
      reducedMotion: "no-preference",
    });
    try {
      const { page } = touch;
      await page.goto(url, { waitUntil: "networkidle" });
      const motion = page.locator("[data-cx-material-motion]");
      await eventually(
        async () =>
          (await motion.getAttribute("data-motion-enabled")) === "false",
        "Coarse pointer does not activate material motion",
      );
      await motion.dispatchEvent("pointermove", {
        pointerType: "touch",
        clientX: 100,
        clientY: 300,
      });
      assert.deepEqual(await motionValues(motion), [0, 0, 0]);
      assert.equal(
        await page.locator("[data-cx-samples]").getAttribute("aria-disabled"),
        null,
      );
      clean(touch);
    } finally {
      touch.release();
      await touch.context.close();
    }
    console.log(
      "Bounded pointer, reset, reduced-motion, touch, mounted material and stable-label checks passed",
    );
  },
});
