/* Central powder-field study: exact identity, native commerce entry and one
 * persistent renderer. All commerce reads are fixtures and writes are blocked. */
import assert from "node:assert/strict";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { translate } from "../src/lib/i18n/index.ts";
import { runHeroCxEntry } from "./hero-cx-entry.mjs";

const sources = {
  ceremonial: "/images/matcha/tea-service.jpg",
  barista: "/images/matcha/latte.jpg",
  culinary: "/images/matcha/culinary.jpg",
};
const powder = (page) => page.locator("[data-cx-field-powder]");
const scene = (page) => powder(page).locator('[data-material="matcha"]');
const link = (page, key) => page.locator(`[data-cx-product-link="${key}"]`);
async function assertPreview(page, key, eventually) {
  await eventually(
    async () => (await powder(page).getAttribute("data-preview")) === key,
    `${key} is the material preview`,
  );
  const image = scene(page).locator("img");
  await eventually(async () => {
    const src = new URL(await image.getAttribute("src"), page.url());
    return (src.searchParams.get("url") ?? src.pathname) === sources[key];
  }, `${key} uses its exact powder photograph`);
  assert.equal(await scene(page).getAttribute("data-stage"), "powder");
}
async function settled(page, eventually) {
  await eventually(
    async () => (await scene(page).getAttribute("aria-busy")) === "false",
    "The renderer or its fallback settles",
  );
}
async function retainCanvas(page) {
  await page.evaluate(() => {
    window.__fieldScene = document.querySelector(
      '[data-cx-field-powder] [data-material="matcha"]',
    );
    window.__fieldCanvas = window.__fieldScene.querySelector(
      "[data-scene-canvas]",
    );
  });
  assert.equal(await scene(page).locator("[data-scene-canvas]").count(), 1);
}
async function assertRetainedCanvas(page) {
  assert.equal(
    await page.evaluate(
      () =>
        window.__fieldScene ===
          document.querySelector(
            '[data-cx-field-powder] [data-material="matcha"]',
          ) &&
        window.__fieldCanvas ===
          window.__fieldScene.querySelector("[data-scene-canvas]"),
    ),
    true,
    "Preview/theme changes retain one mounted scene and canvas",
  );
}

await runHeroCxEntry({
  layout: "field",
  envPrefix: "HERO_CX_FIELD",
  defaultEvidence: ".local/hero-cx-study-0233/after",
  isDefault: true,
  primaryImageSelector: "[data-cx-field-powder]",
  allowCanvas: true,
  clippingSelector:
    "h1,[data-cx-samples],[data-cx-application-name],[data-cx-application-product]",
  async checkImage({ page, locale, eventually }) {
    assert.equal(await scene(page).count(), 1);
    const key = await powder(page).getAttribute("data-preview");
    assert.ok(
      Object.hasOwn(sources, key),
      "Preview has an exact known product identity",
    );
    await assertPreview(page, key, eventually);
    await settled(page, eventually);
    assert.equal(
      await scene(page).getAttribute("data-renderer"),
      "webgl",
      "The standard browser profile exercises the actual renderer",
    );
    assert.equal(await scene(page).locator("[data-scene-canvas]").count(), 1);
    const item = SAMPLE_SET_CONTENTS.find((product) => product.key === key);
    assert.equal(
      await scene(page).getAttribute("aria-label"),
      translate(locale, "{name} powder, formed from its material photograph.", {
        name: translate(locale, item.name),
      }),
    );
    assert.equal(
      (await page.locator("[data-cx-hero-reference]").textContent()).trim(),
      translate(locale, "Matcha / Material study"),
    );
  },
  async checkSpecific({ page, hero, width }) {
    assert.equal(
      await hero
        .locator(
          "[data-silver-bag], [data-cx-application-image], [data-cx-hero-image]",
        )
        .count(),
      0,
      "The field does not reuse the former tray-and-thumbnail layout",
    );
    assert.equal(
      await hero
        .locator(
          "a [data-scramble-glyph],button [data-scramble-glyph],p [data-scramble-glyph]",
        )
        .count(),
      0,
      "Controls and supporting text remain settled",
    );
    assert.equal(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      true,
    );
    for (const control of await hero
      .locator("[data-cx-samples],[data-cx-product-link]")
      .all()) {
      assert.equal(
        await control.evaluate((node) => {
          const box = node.getBoundingClientRect();
          return node.contains(
            document.elementFromPoint(
              box.x + box.width / 2,
              box.y + box.height / 2,
            ),
          );
        }),
        true,
        "Every native entry remains unobstructed by the central material",
      );
    }
    assert.deepEqual(
      await hero.locator("[data-cx-product-link] > span").evaluateAll((nodes) =>
        nodes.flatMap((node) => {
          const rect = node.getBoundingClientRect();
          return rect.left < 0 ||
            rect.right > innerWidth + 1 ||
            rect.top < 0 ||
            rect.bottom > innerHeight + 1
            ? [node.textContent]
            : [];
        }),
      ),
      [],
      "Application text and intentionally offset arrows remain inside the viewport",
    );
    if (width <= 760) {
      const controls = hero.locator(
        "[data-cx-samples],[data-cx-application-name]",
      );
      for (const control of await controls.all())
        assert.ok(
          await control.evaluate(
            (node) => parseFloat(getComputedStyle(node).fontSize) >= 14,
          ),
          "Mobile actions remain at least14px",
        );
    }
  },
  async checkFailedScene({ page, eventually }) {
    await eventually(
      async () =>
        (await scene(page).getAttribute("data-renderer")) === "fallback" &&
        (await scene(page).getAttribute("data-photograph-failed")) === "true",
      "Failed image reads produce the truthful material fallback",
    );
    await settled(page, eventually);
    assert.equal(await scene(page).locator("[data-scene-canvas]").count(), 0);
    assert.ok((await scene(page).textContent()).includes("Matcha powder"));
  },
  async checkEdges({ setup, url, eventually, clean, capture }) {
    for (const reducedMotion of ["no-preference", "reduce"]) {
      const test = await setup(1440, "light", "en", { reducedMotion });
      try {
        const { page } = test;
        await page.goto(`${url}&tea=barista`, { waitUntil: "networkidle" });
        await settled(page, eventually);
        await assertPreview(page, "barista", eventually);
        await retainCanvas(page);
        const before = page.url();
        const reads = test.catalogReads();
        for (const key of ["ceremonial", "culinary", "barista"]) {
          await link(page, key).hover();
          await assertPreview(page, key, eventually);
          assert.equal(
            page.url(),
            before,
            "Optional hover preview does not change the committed URL",
          );
          await assertRetainedCanvas(page);
        }
        await page.mouse.move(1, 1);
        await assertPreview(page, "barista", eventually);
        await link(page, "ceremonial").focus();
        await link(page, "culinary").hover();
        await assertPreview(page, "culinary", eventually);
        await page.mouse.move(1, 1);
        await assertPreview(page, "ceremonial", eventually);
        await page.locator("[data-cx-samples]").focus();
        await assertPreview(page, "barista", eventually);
        for (const key of [
          "culinary",
          "ceremonial",
          "barista",
          "culinary",
          "barista",
          "ceremonial",
        ])
          await link(page, key).focus();
        await assertPreview(page, "ceremonial", eventually);
        await assertRetainedCanvas(page);
        assert.equal(
          page.url(),
          before,
          "Keyboard preview does not commit a different product",
        );
        assert.equal(
          test.catalogReads(),
          reads,
          "Visual application preview does not refetch commerce data",
        );
        await page.locator("[data-cx-tone]").selectOption("dark");
        await eventually(
          async () =>
            (await page
              .locator("[data-hero-cx-study]")
              .getAttribute("data-tone")) === "dark",
          "Theme changes in place",
        );
        await assertRetainedCanvas(page);
        await link(page, "culinary").focus();
        await assertPreview(page, "culinary", eventually);
        await page.keyboard.press("Enter");
        const product = SAMPLE_SET_CONTENTS.find(
          (item) => item.key === "culinary",
        );
        await page
          .locator(`[data-retail-product="${product.productHandle}"]`)
          .waitFor();
        await page.goBack();
        await assertPreview(page, "culinary", eventually);
        assert.equal(new URL(page.url()).searchParams.get("tea"), "culinary");
        clean(test);
      } finally {
        test.release();
        await test.context.close();
      }
    }
    console.log(
      "Hover, keyboard, rapid preview, exact powder mapping and persistent canvas pass with normal and reduced motion",
    );

    const mobile = await setup(390, "light", "en");
    try {
      const { page } = mobile;
      await page.goto(url, { waitUntil: "networkidle" });
      await settled(page, eventually);
      await link(page, "barista").dispatchEvent("pointerenter", {
        pointerType: "touch",
      });
      await assertPreview(page, "ceremonial", eventually);
      await retainCanvas(page);
      for (const key of ["ceremonial", "barista", "culinary"]) {
        await link(page, key).focus();
        await assertPreview(page, key, eventually);
        await assertRetainedCanvas(page);
        await page.evaluate(
          () =>
            new Promise((done) =>
              requestAnimationFrame(() => requestAnimationFrame(done)),
            ),
        );
        await capture(page, `390-light-en-preview-${key}`);
      }
      await link(page, "barista").tap();
      const product = SAMPLE_SET_CONTENTS.find(
        (item) => item.key === "barista",
      );
      await page
        .locator(`[data-retail-product="${product.productHandle}"]`)
        .waitFor();
      await page.goBack();
      await assertPreview(page, "barista", eventually);
      clean(mobile);
    } finally {
      mobile.release();
      await mobile.context.close();
    }
    console.log(
      "All three mobile powder previews and direct touch product entry passed",
    );

    const unsupported = await setup(390, "dark", "en");
    try {
      const { context, page } = unsupported;
      await context.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (kind, ...options) {
          if (/webgl/.test(kind)) return null;
          return original.call(this, kind, ...options);
        };
      });
      // Next's local diagnostic POST is handled in memory, never sent to a server.
      await context.route("**/__nextjs_original-stack-frames", (route) =>
        route.fulfill({ status: 204, body: "" }),
      );
      await page.goto(url, { waitUntil: "networkidle" });
      await eventually(
        async () =>
          (await scene(page).getAttribute("data-renderer")) === "fallback",
        "Unsupported WebGL activates the image fallback",
      );
      await settled(page, eventually);
      for (const key of ["ceremonial", "barista", "culinary"]) {
        await link(page, key).focus();
        await assertPreview(page, key, eventually);
        await settled(page, eventually);
        assert.equal(
          await scene(page).locator("[data-scene-canvas]").count(),
          0,
        );
        assert.equal(
          await scene(page).locator("img").getAttribute("data-masked"),
          "true",
        );
      }
      await capture(page, "390-dark-en-webgl-fallback");
      await page.locator("[data-cx-samples]").click();
      await page.locator("[data-samples-page]").waitFor();
      clean(unsupported);
    } finally {
      unsupported.release();
      await unsupported.context.close();
    }

    const lost = await setup(1440, "light", "en");
    try {
      const { page } = lost;
      await page.goto(url, { waitUntil: "networkidle" });
      await settled(page, eventually);
      await scene(page)
        .locator("[data-scene-canvas]")
        .evaluate((canvas) => {
          const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
          const loss = gl?.getExtension("WEBGL_lose_context");
          if (!loss)
            throw new Error("WebGL context loss extension unavailable");
          loss.loseContext();
        });
      await eventually(
        async () =>
          (await scene(page).getAttribute("data-renderer")) === "fallback",
        "Context loss releases the renderer and activates the photo fallback",
      );
      await link(page, "barista").focus();
      await assertPreview(page, "barista", eventually);
      await settled(page, eventually);
      assert.equal(await scene(page).locator("[data-scene-canvas]").count(), 0);
      await page.locator("[data-cx-samples]").click();
      await page.locator("[data-samples-page]").waitFor();
      clean(lost);
    } finally {
      lost.release();
      await lost.context.close();
    }
    console.log(
      "Unavailable WebGL and actual context loss preserve the photo fallback and immediate native navigation",
    );
  },
});
