/* Shared approved hero, gallery comparison and complete selection flow. Commerce stays in isolated fixtures. */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";
import { translate } from "../src/lib/i18n/index.ts";
import { getProductApplicationImage } from "../src/lib/product-application-imagery.ts";
import { createHeroStudyFixture } from "./hero-cx-fixtures.mjs";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.NEW_HERO6_BASE_URL ?? "http://127.0.0.1:3100";
const evidence = process.env.NEW_HERO6_EVIDENCE ?? ".local/new-hero-0242";
const url = `${baseURL}/new-hero6`;
const pageRoot = (page) => page.locator("[data-new-hero6]");
const card = (page, key) => page.locator(`[data-new-hero-product="${key}"]`);
const add = (page, key) =>
  card(page, key).locator("[data-new-hero-add] button");
const quantity = (page, key) =>
  card(page, key).locator("[data-new-hero-quantity]");
const samplePurchase = (page) => page.locator("[data-sample-purchase]");
const sampleAdd = (page) =>
  samplePurchase(page).getByRole("button", {
    name: "Add to cart",
    exact: true,
  });
const increase = (page, key) =>
  card(page, key).getByRole("button", {
    name: "Increase quantity",
    exact: true,
  });
const profiles = process.env.NEW_HERO6_PROFILES?.split(",").filter(Boolean) ?? [
  "1440-light-en",
  "1440-dark-ja",
  "1200-light-en",
  "768-light-zh-Hans",
  "768-dark-zh-Hant",
  "390-light-ja",
  "390-dark-en",
  "360-light-zh-Hans",
  "320-dark-zh-Hant",
  "844x390-light-en",
];

async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function ready(page) {
  await pageRoot(page).waitFor();
  await eventually(
    async () =>
      (await page
        .locator('[data-new-hero-product][data-catalog-state="ready"]')
        .count()) === 3 &&
      (await add(page, "ceremonial").isEnabled()) &&
      (await samplePurchase(page)
        .locator('button[data-available="true"]')
        .count()) === 1 &&
      (await samplePurchase(page)
        .locator('button[data-available="true"]')
        .isEnabled()),
    "All three teas and the Sample Set expose current catalog controls",
  );
}

async function nativeEntries(page, locale) {
  assert.equal(
    await page.locator("[data-new-hero6-samples]").getAttribute("href"),
    "#hero6-samples",
  );
  assert.equal(
    await page.locator("[data-new-hero6-origin]").getAttribute("href"),
    "/origins",
    "The enhanced origin reader retains a native page destination",
  );
  assert.equal(
    await page.locator("[data-new-hero6-explore]").getAttribute("href"),
    "#hero6-applications",
  );
  assert.ok(
    (await page.locator("[data-new-hero6-samples]").textContent()).includes(
      translate(locale, "Start with the Sample Set"),
    ),
  );
  for (const identity of SAMPLE_SET_CONTENTS) {
    const product = card(page, identity.key);
    const jump = page.locator(`[data-new-hero6-jump="${identity.key}"]`);
    assert.equal(await jump.getAttribute("href"), `#new-hero6-${identity.key}`);
    const link = product.locator("[data-new-hero-product-link]");
    assert.equal(await product.getAttribute("id"), `new-hero6-${identity.key}`);
    assert.equal(
      await link.getAttribute("href"),
      `/shop/${identity.productHandle}`,
    );
    assert.ok(
      (await link.textContent()).includes(translate(locale, identity.name)),
    );
    assert.ok(
      (
        await product.locator("[data-new-hero-product-code]").textContent()
      ).includes(identity.productCode),
    );
    const reorder = page.locator(`[data-new-hero6-reorder="${identity.key}"]`);
    assert.equal(
      await reorder.getAttribute("href"),
      `/shop/${identity.productHandle}?format=1kg`,
    );
    assert.ok(
      (await reorder.textContent()).includes(translate(locale, identity.name)),
    );
    assert.ok((await reorder.textContent()).includes(identity.productCode));
  }
}

async function capture(page, name) {
  await page.locator("main img").evaluateAll(async (images) => {
    await Promise.all(
      images.map(async (image) => {
        image.loading = "eager";
        await image.decode().catch(() => {});
      }),
    );
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(evidence, `${name}-viewport.png`) });
  await page.screenshot({
    path: resolve(evidence, `${name}-page.png`),
    fullPage: true,
  });
}

async function layout(page, width, tone, locale) {
  assert.equal(await pageRoot(page).getAttribute("data-tone"), tone);
  assert.equal(await page.locator("html").getAttribute("lang"), locale);
  assert.equal(await pageRoot(page).locator("h1").count(), 1);
  assert.equal(
    (await pageRoot(page).locator("h1").textContent())
      .replace(/\s+/g, " ")
      .trim(),
    translate(locale, "Matcha for the way you make it."),
    "The hero retains the complete positioning in a single heading",
  );
  assert.equal(await page.locator("[data-new-hero6-hero]").count(), 1);
  assert.equal(await page.locator("[data-new-hero6-material]").count(), 1);
  assert.equal(
    await page.locator("[data-new-hero6-first-view] header").count(),
    1,
    "The header belongs to the contained first-view composition",
  );
  assert.equal(
    await page.locator("[data-new-hero6-hero]").evaluate((hero) => {
      const material = hero.querySelector("[data-new-hero6-material]");
      return ["samples", "explore"].every((entry) => {
        const action = hero.querySelector(`[data-new-hero6-${entry}]`);
        return Boolean(
          action &&
          material &&
          action.compareDocumentPosition(material) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
      });
    }),
    true,
    "The sample and application entries precede the artwork in reading order",
  );
  assert.ok(
    (await page.locator("[data-new-hero6-hero]").textContent()).includes(
      translate(
        locale,
        "AI composition reference · Product photography pending",
      ),
    ),
    "The illustrative material is labelled",
  );
  assert.equal(
    await page
      .locator('[data-new-hero-products][data-presentation="gallery"]')
      .count(),
    1,
  );
  assert.deepEqual(
    await page
      .locator("[data-new-hero6-section]")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.dataset.newHero6Section),
      ),
    ["applications", "samples", "origin", "supply"],
  );
  assert.equal(
    await page
      .locator('[data-hero-cx-study],[aria-label="Study controls"],canvas')
      .count(),
    0,
  );
  assert.deepEqual(
    await pageRoot(page)
      .locator(
        "main a [data-scramble-glyph],main button [data-scramble-glyph],main p [data-scramble-glyph]",
      )
      .evaluateAll((glyphs) =>
        glyphs
          .filter((glyph) => !glyph.closest('[data-scramble-policy="stable"]'))
          .map((glyph) => glyph.textContent),
      ),
    [],
    "Control labels and prose remain settled, including the shared header",
  );
  assert.equal(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
    ),
    true,
    "No horizontal overflow",
  );
  assert.deepEqual(
    await pageRoot(page)
      .locator(
        "h1,h2,h3,[data-new-hero-product-name],[data-new-hero-product-code],[data-new-hero-price],[data-new-hero-total]",
      )
      .evaluateAll((nodes) =>
        nodes
          .filter(
            (node) =>
              node.getClientRects().length &&
              node.scrollWidth > node.clientWidth + 1,
          )
          .map((node) => node.textContent),
      ),
    [],
    "Headings, product names, codes and prices fit",
  );
  const appearance = await pageRoot(page).evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      ink: style.color,
      surface: style.getPropertyValue("--color-surface").trim(),
      font: style.fontFamily,
    };
  });
  assert.equal(appearance.surface, tone === "light" ? "#f1f5ef" : "#080b11");
  assert.equal(
    appearance.ink,
    tone === "light" ? "rgb(38, 59, 52)" : "rgb(233, 238, 242)",
  );
  assert.ok(
    appearance.font.includes("atomaMono"),
    "Established mono typography",
  );
  const productCards = await page
    .locator("[data-new-hero-product]")
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const bounds = node.getBoundingClientRect();
        const figure = node.querySelector("[data-product-application-image]");
        const image = figure.firstElementChild;
        const imageBounds = image.getBoundingClientRect();
        const imageStyle = getComputedStyle(image);
        return {
          left: bounds.left,
          right: bounds.right,
          top: bounds.top,
          bottom: bounds.bottom,
          width: bounds.width,
          imageHeight: imageBounds.height,
          imageRadius: imageStyle.borderRadius,
          imageOverflow: imageStyle.overflow,
        };
      }),
    );
  assert.equal(productCards.length, 3);
  if (width >= 1200) {
    assert.ok(
      productCards.every(
        (bounds) =>
          Math.abs(bounds.top - productCards[0].top) <= 1 &&
          Math.abs(bounds.width - productCards[0].width) <= 1,
      ),
      "Desktop presents three equally sized application cards together",
    );
    for (let index = 1; index < productCards.length; index++) {
      assert.ok(
        productCards[index].left > productCards[index - 1].right,
        "Desktop application cards have a clear gap",
      );
    }
  }
  if (width <= 760) {
    for (let index = 1; index < productCards.length; index++) {
      assert.ok(
        productCards[index].top > productCards[index - 1].bottom,
        "Phone cards stack without concealing purchasing controls",
      );
    }
  }
  assert.ok(
    productCards.every((bounds) => bounds.imageHeight >= 160),
    "Application photograph frames remain substantial entrances into each card",
  );
  assert.ok(
    productCards.every(
      (bounds) =>
        parseFloat(bounds.imageRadius) >= 12 &&
        ["hidden", "clip"].includes(bounds.imageOverflow),
    ),
    "Application photographs have visibly rounded, clipped corners",
  );
  const controlRadii = await pageRoot(page).evaluate((root) => {
    const radius = (node) => getComputedStyle(node).borderRadius;
    const hero = radius(root.querySelector("[data-new-hero6-samples]"));
    const controls = [
      ...root.querySelectorAll(
        "[data-new-hero-format],[data-new-hero-add] button,[data-sample-purchase] button[data-available]",
      ),
      ...[...root.querySelectorAll("[data-new-hero-quantity]")].map(
        (output) => output.parentElement,
      ),
      root.querySelector("[data-sample-purchase] output").parentElement,
    ];
    return { hero, controls: controls.map(radius) };
  });
  assert.ok(
    controlRadii.hero === "6px",
    "The approved hero establishes a rounded control shape",
  );
  assert.ok(
    controlRadii.controls.every((radius) => radius === controlRadii.hero),
    "Product formats, Add to cart and quantity groups match hero button rounding",
  );
  const originFrame = await page
    .locator('[data-new-hero6-section="origin"] figure > div')
    .evaluate((node) => {
      const style = getComputedStyle(node);
      return { radius: style.borderRadius, overflow: style.overflow };
    });
  assert.ok(
    parseFloat(originFrame.radius) >= 12 &&
      ["hidden", "clip"].includes(originFrame.overflow),
    "The origin photograph also has rounded, clipped corners",
  );
  await nativeEntries(page, locale);
  await page.evaluate(() => window.scrollTo(0, 0));
  const geometry = await page.evaluate(() => {
    const bounds = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, height: rect.height };
    };
    return {
      viewportHeight: innerHeight,
      sample: bounds("[data-new-hero6-samples]"),
      explore: bounds("[data-new-hero6-explore]"),
      firstView: bounds("[data-new-hero6-first-view]"),
      applications: bounds('[data-new-hero6-section="applications"]'),
    };
  });
  const containment = await pageRoot(page).evaluate((root) => {
    const firstView = root.querySelector("[data-new-hero6-first-view]");
    const gradient = getComputedStyle(firstView, "::before");
    const rootStyle = getComputedStyle(root);
    const pageOverlay = getComputedStyle(root, "::before");
    const sectionGradients = [
      ...root.querySelectorAll("[data-new-hero6-section]"),
    ]
      .filter((section) =>
        [null, "::before", "::after"].some((pseudo) =>
          getComputedStyle(section, pseudo).backgroundImage.includes(
            "gradient",
          ),
        ),
      )
      .map((section) => section.dataset.newHero6Section);
    return {
      height: parseFloat(gradient.height),
      top: gradient.top,
      position: gradient.position,
      background: gradient.backgroundImage,
      mask: gradient.maskImage,
      firstViewPosition: getComputedStyle(firstView).position,
      pageBackground: rootStyle.backgroundImage,
      pageSurface: rootStyle.backgroundColor,
      pageOverlay: pageOverlay.backgroundImage,
      sectionGradients,
      containedSections: firstView.querySelectorAll("[data-new-hero6-section]")
        .length,
    };
  });
  assert.equal(containment.firstViewPosition, "relative");
  assert.equal(containment.position, "absolute");
  assert.equal(containment.top, "0px");
  assert.ok(containment.background.includes("gradient"));
  assert.equal(containment.mask, "none", "The first-view gradient is unmasked");
  assert.ok(
    Math.abs(containment.height - geometry.viewportHeight) <= 1,
    "The gradient ends at exactly one small viewport height",
  );
  assert.equal(containment.pageBackground, "none");
  assert.equal(containment.pageOverlay, "none");
  assert.equal(
    containment.pageSurface,
    tone === "light" ? "rgb(241, 245, 239)" : "rgb(8, 11, 17)",
    "The remaining page retains the flat storefront surface",
  );
  assert.deepEqual(containment.sectionGradients, []);
  assert.equal(containment.containedSections, 0);
  assert.ok(
    geometry.applications.top >= geometry.firstView.bottom - 1,
    "Product comparison follows the contained gradient composition",
  );
  if (width >= 1200 && geometry.viewportHeight >= 800) {
    assert.ok(
      Math.abs(geometry.firstView.height - geometry.viewportHeight) <= 2,
      "The desktop composition fits one viewport",
    );
  }
  for (const bounds of [geometry.sample, geometry.explore]) {
    assert.ok(
      bounds.bottom <= geometry.viewportHeight,
      "Both main entries fit the first viewport",
    );
    if (width <= 760)
      assert.ok(bounds.height >= 44, "Main touch entries are at least 44px");
  }
  for (const identity of SAMPLE_SET_CONTENTS) {
    const jump = page.locator(`[data-new-hero6-jump="${identity.key}"]`);
    assert.equal(await jump.isVisible(), true);
    assert.equal(
      await jump
        .getByText(`◇ ${identity.productCode}`, { exact: true })
        .evaluate((node) => getComputedStyle(node).color),
      appearance.ink,
      "Canonical product codes use the high-contrast ink at the gradient's base",
    );
    if (width <= 760)
      assert.ok(
        (await jump.boundingBox()).height >= 44,
        "Application entries are at least 44px on phones",
      );
  }
  for (const [index, identity] of SAMPLE_SET_CONTENTS.entries()) {
    const product = card(page, identity.key);
    const reference = getProductApplicationImage(identity.productHandle);
    await product.scrollIntoViewIfNeeded();
    assert.equal(
      await product.locator("[data-product-application-caption]").textContent(),
      translate(locale, reference.caption),
    );
    assert.ok(
      (await product.locator("[data-new-hero-price]").textContent()).startsWith(
        `¥${(6000 + index * 1000).toLocaleString("en")}`,
      ),
    );
    assert.equal(await add(page, identity.key).isEnabled(), true);
    assert.equal(
      await product.locator("[data-new-hero-product-link]").isVisible(),
      true,
    );
    if (width <= 760) {
      for (const control of await product
        .locator(
          "[data-new-hero-format],[data-new-hero-add] button,button[aria-label]",
        )
        .all()) {
        assert.ok(
          (await control.boundingBox()).height >= 44,
          "Commerce touch controls are at least 44px",
        );
        assert.equal(
          await control.evaluate(
            (node) =>
              getComputedStyle(node).visibility === "visible" &&
              Number(getComputedStyle(node).opacity) > 0,
          ),
          true,
        );
      }
      assert.ok(
        await product
          .locator("p")
          .filter({ hasText: translate(locale, reference.usage) })
          .evaluate(
            (node) => parseFloat(getComputedStyle(node).fontSize) >= 16,
          ),
        "Mobile product prose is at least 16px",
      );
    }
  }
  const sampleSection = page.locator('[data-new-hero6-section="samples"]');
  assert.equal(await sampleSection.getAttribute("id"), "hero6-samples");
  assert.equal(await sampleSection.getAttribute("tabindex"), "-1");
  assert.equal(await samplePurchase(page).count(), 1);
  assert.equal(
    await samplePurchase(page).getAttribute("aria-labelledby"),
    "hero6-sample-order",
  );
  await sampleSection.scrollIntoViewIfNeeded();
  assert.ok(
    (await samplePurchase(page).textContent()).includes("¥6,000"),
    "Sample Set pricing is available on the same page",
  );
  if (width <= 760) {
    for (const control of await samplePurchase(page).locator("button").all()) {
      assert.ok(
        (await control.boundingBox()).height >= 44,
        "Inline sample quantity and purchase controls are touch-sized",
      );
    }
    assert.equal(
      await samplePurchase(page)
        .locator("button:not([aria-label]),summary")
        .evaluateAll((nodes) =>
          nodes.every(
            (node) => parseFloat(getComputedStyle(node).fontSize) >= 16,
          ),
        ),
      true,
      "Mobile sample purchase and ordering-information labels are readable at 16px",
    );
  }
  for (const identity of SAMPLE_SET_CONTENTS) {
    const item = sampleSection
      .locator("li")
      .filter({ hasText: translate(locale, identity.name) });
    assert.ok((await item.textContent()).includes(`${identity.grams} g`));
    const pouch = sampleSection.locator(`[data-pouch="${identity.key}"]`);
    for (const element of [pouch, pouch.locator('img[alt=""]')]) {
      const bounds = await element.boundingBox();
      assert.ok(
        bounds && bounds.width >= 44 && bounds.height >= 44,
        "Every sample pouch has useful rendered bounds",
      );
    }
  }
  assert.equal(
    await sampleSection.evaluate((section) => {
      const entry = section.querySelector('a[href="/samples"]');
      const purchase = section.querySelector("[data-sample-purchase]");
      const inspection = section.querySelector("[data-pouch]");
      return Boolean(
        purchase &&
        entry &&
        inspection &&
        purchase.compareDocumentPosition(entry) &
          Node.DOCUMENT_POSITION_FOLLOWING &&
        entry.compareDocumentPosition(inspection) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }),
    true,
    "Sample purchase and optional details precede label inspection",
  );
  await sampleSection.locator('a[href="/samples"]').focus();
  await page.keyboard.press("Tab");
  assert.equal(
    await sampleSection
      .locator("[data-pouch]")
      .first()
      .evaluate((node) => document.activeElement === node),
    true,
    "Keyboard traversal reaches sample purchase before optional inspection",
  );
  return {
    ...geometry,
    ...appearance,
    containment,
    productCards,
    controlRadii,
  };
}

await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const measurements = [];
const baselinePath =
  process.env.NEW_HERO6_HERO_BASELINE ??
  ".local/new-hero-0240/measurements.json";
const baselineMeasurements = await readFile(baselinePath, "utf8")
  .then((data) => JSON.parse(data))
  .catch((error) => {
    if (error.code !== "ENOENT") throw error;
    return [];
  });
const heroComparisons = [];
async function fixture(profile, options, run) {
  const [rawWidth, tone, ...localeParts] = profile.split("-");
  const [width, height] = rawWidth.split("x").map(Number);
  const locale = localeParts.join("-");
  const test = await createHeroStudyFixture(
    browser,
    baseURL,
    width,
    tone,
    locale,
    options,
  );
  try {
    await options.beforeNavigation?.(test);
    if (height) await test.page.setViewportSize({ width, height });
    await test.page.goto(url, {
      waitUntil: options.holdScripts ? "commit" : "domcontentloaded",
    });
    if (!options.holdScripts) await ready(test.page);
    await run(test, { width, tone, locale });
    assert.deepEqual(
      test.errors,
      [],
      "No client or unexpected external request errors",
    );
    assert.deepEqual(test.writes, [], "No commerce writes reach the server");
  } finally {
    test.release();
    await test.context.close();
  }
}

try {
  for (const profile of profiles) {
    await fixture(profile, {}, async ({ page }, { width, tone, locale }) => {
      measurements.push({
        profile,
        ...(await layout(page, width, tone, locale)),
      });
      const previous = baselineMeasurements.find(
        (item) => item.profile === profile,
      );
      if (previous) {
        const current = measurements.at(-1);
        const fields = ["sample", "explore", "firstView"];
        const deltas = Object.fromEntries(
          fields.map((field) => [
            field,
            Object.fromEntries(
              Object.keys(previous[field]).map((key) => [
                key,
                current[field][key] - previous[field][key],
              ]),
            ),
          ]),
        );
        heroComparisons.push({ profile, deltas });
        assert.deepEqual(
          Object.fromEntries(fields.map((field) => [field, current[field]])),
          Object.fromEntries(fields.map((field) => [field, previous[field]])),
          "The shared hero retains the exact approved first-view and entry geometry",
        );
      }
      await capture(page, profile);
      await page.locator("[data-new-hero6-explore]").click();
      assert.equal(new URL(page.url()).hash, "#hero6-applications");
      await eventually(async () => {
        const bounds = await page.locator("#hero6-applications").boundingBox();
        return bounds.y >= 0 && bounds.y < 160;
      }, "Application entry reaches product buying controls");
      for (const identity of SAMPLE_SET_CONTENTS) {
        await page.locator(`[data-new-hero6-jump="${identity.key}"]`).click();
        assert.equal(new URL(page.url()).hash, `#new-hero6-${identity.key}`);
        await eventually(async () => {
          const bounds = await card(page, identity.key).boundingBox();
          return bounds.y >= 0 && bounds.y < 160;
        }, "Each application entry reaches its own purchasing controls");
      }
      await page.locator("[data-new-hero6-samples]").click();
      assert.equal(new URL(page.url()).hash, "#hero6-samples");
      assert.equal(new URL(page.url()).pathname, "/new-hero6");
      await eventually(async () => {
        const section = page.locator("#hero6-samples");
        const bounds = await section.boundingBox();
        return (
          bounds.y >= 0 &&
          bounds.y < 160 &&
          (await section.evaluate((node) => document.activeElement === node))
        );
      }, "The primary entry reaches and focuses the inline sample order section");
    });
    console.log(`New hero 6 layout, palette and entries: ${profile}`);
  }

  await fixture("390-light-en", { holdScripts: true }, async (test) => {
    const { page } = test;
    await pageRoot(page).waitFor();
    await eventually(
      () => test.scriptRequests() > 0,
      "Hydration scripts are held",
    );
    await nativeEntries(page, "en");
    assert.equal(test.catalogReads(), 0);
    assert.equal(await page.locator("header details[open]").count(), 0);
    await page.locator("[data-new-hero6-explore]").click();
    assert.equal(new URL(page.url()).hash, "#hero6-applications");
    await page.locator('[data-new-hero6-jump="barista"]').click();
    assert.equal(new URL(page.url()).hash, "#new-hero6-barista");
    await page.locator("[data-new-hero6-samples]").click();
    assert.equal(new URL(page.url()).hash, "#hero6-samples");
    assert.equal(await samplePurchase(page).count(), 1);
    test.releaseScripts();
    await ready(page);
  });
  console.log(
    "Native sample, application and exact product links before hydration",
  );

  await fixture("390-light-en", {}, async (test) => {
    const { page } = test;
    await increase(page, "ceremonial").click();
    await increase(page, "culinary").click();
    await increase(page, "barista").click();
    await increase(page, "barista").click();
    assert.equal(await quantity(page, "barista").textContent(), "3");
    await samplePurchase(page)
      .getByRole("button", { name: "Increase quantity", exact: true })
      .click();
    const reads = test.catalogReads();
    await page.locator("footer [data-theme-switcher]").click();
    assert.equal(await pageRoot(page).getAttribute("data-tone"), "dark");
    await page.locator("footer [data-language-switcher]").selectOption("ja");
    assert.equal(await quantity(page, "barista").textContent(), "3");
    assert.equal(test.catalogReads(), reads);
    await page.locator("footer [data-language-switcher]").selectOption("en");
    await card(page, "barista").locator("[data-new-hero-product-link]").click();
    const retail = page.locator(
      `[data-retail-product="${SAMPLE_SET_CONTENTS[1].productHandle}"]`,
    );
    await retail.waitFor();
    await eventually(
      async () =>
        (await retail
          .getByRole("button", { name: "1 kg", exact: true })
          .getAttribute("aria-pressed")) === "true" &&
        (await retail
          .locator('output[aria-label="Quantity"]')
          .textContent()) === "3",
      "Selected format and quantity continue into the product page",
    );
    await page.goBack();
    await ready(page);
    assert.equal(
      await samplePurchase(page)
        .locator('output[aria-label="Set quantity"]')
        .textContent(),
      "2",
      "Returning from a tea product also retains the sample quantity",
    );
    for (const [key, expected] of [
      ["ceremonial", "2"],
      ["barista", "3"],
      ["culinary", "2"],
    ]) {
      assert.equal(
        await quantity(page, key).textContent(),
        expected,
        "Returning from a product retains every independently configured tea",
      );
    }
    await page
      .locator('[data-new-hero6-section="samples"] a[href="/samples"]')
      .click();
    await eventually(
      () => new URL(page.url()).pathname === "/samples",
      "Optional Sample Set details remain available",
    );
    await page.goBack();
    await ready(page);
    assert.equal(
      await samplePurchase(page)
        .locator('output[aria-label="Set quantity"]')
        .textContent(),
      "2",
      "Sample details and Back retain the inline sample quantity",
    );
    for (const [key, expected] of [
      ["ceremonial", "2"],
      ["barista", "3"],
      ["culinary", "2"],
    ]) {
      assert.equal(
        await quantity(page, key).textContent(),
        expected,
        "Sample Set details and Back preserve the entire comparison",
      );
    }
    await page.locator('[data-new-hero6-reorder="culinary"]').click();
    const reordered = page.locator(
      `[data-retail-product="${SAMPLE_SET_CONTENTS[2].productHandle}"]`,
    );
    await reordered.waitFor();
    assert.equal(new URL(page.url()).searchParams.get("format"), "1kg");
    await eventually(
      async () =>
        (await reordered
          .getByRole("button", { name: "1 kg", exact: true })
          .getAttribute("aria-pressed")) === "true",
      "Repeat-order entry selects the named one-kilogram product",
    );
  });
  console.log(
    "Theme/locale continuity, independent tea choices, details/Back and exact 1 kg repeat order",
  );

  await fixture(
    "390-light-en",
    {
      beforeNavigation: async ({ context }) => {
        const products = SAMPLE_SET_CONTENTS.map((item, index) => ({
          id: item.key,
          handle: item.productHandle,
          title: item.name,
          productCode: item.productCode,
          description: "Isolated multi-format selection fixture.",
          imageUrl: null,
          imageAlt: "",
          productUrl: null,
          isFixture: true,
          variants: ["1 kg", "100 g"].map((title, format) => ({
            id: `v1_${String.fromCharCode(97 + index + format * 3).repeat(43)}`,
            title,
            available: true,
            priceMinor: format === 0 ? 6000 + index * 1000 : 1000 + index * 100,
            currency: "JPY",
            options: [{ name: "Size", value: title }],
            minimum: 1,
            maximum: 4,
            increment: 1,
          })),
        }));
        await context.route("**/api/catalog", (route) =>
          route.fulfill({
            json: {
              status: "ready",
              products: [
                {
                  ...products[0],
                  id: "sample-set",
                  handle: SAMPLE_SET_OFFER.productHandle,
                  title: "Sample Set",
                  productCode: null,
                  variants: [
                    {
                      ...products[0].variants[0],
                      id: `v1_${"s".repeat(43)}`,
                      title: "3 × 20 g",
                      options: SAMPLE_SET_OFFER.variants[0].options,
                    },
                  ],
                },
                ...products,
              ],
              shopUrl: "https://example.invalid",
            },
          }),
        );
      },
    },
    async ({ page }) => {
      for (const key of ["ceremonial", "barista"]) {
        await card(page, key)
          .getByRole("button", { name: "100 g", exact: true })
          .click();
        await increase(page, key).click();
      }
      await increase(page, "barista").click();
      await card(page, "barista")
        .locator("[data-new-hero-product-link]")
        .click();
      const retail = page.locator(
        `[data-retail-product="${SAMPLE_SET_CONTENTS[1].productHandle}"]`,
      );
      await retail.waitFor();
      await eventually(
        async () =>
          (await retail
            .getByRole("button", { name: "100 g", exact: true })
            .getAttribute("aria-pressed")) === "true" &&
          (await retail
            .locator('output[aria-label="Quantity"]')
            .textContent()) === "3",
        "The selected alternate format and quantity reach the named product",
      );
      await page.goBack();
      await ready(page);
      for (const [key, expectedQuantity] of [
        ["ceremonial", "2"],
        ["barista", "3"],
      ]) {
        assert.equal(
          await card(page, key)
            .getByRole("button", { name: "100 g", exact: true })
            .getAttribute("aria-pressed"),
          "true",
          "Each product keeps its own selected format after Back",
        );
        assert.equal(await quantity(page, key).textContent(), expectedQuantity);
      }
      await page.locator('[data-new-hero6-reorder="ceremonial"]').click();
      const repeat = page.locator(
        `[data-retail-product="${SAMPLE_SET_CONTENTS[0].productHandle}"]`,
      );
      await repeat.waitFor();
      await eventually(
        async () =>
          (await repeat
            .getByRole("button", { name: "1 kg", exact: true })
            .getAttribute("aria-pressed")) === "true",
        "Explicit wholesale links override a remembered small-format preference",
      );
    },
  );
  console.log(
    "Independent alternate formats and quantity survive Back; repeat links still select 1 kg",
  );

  await fixture("390-light-en", {}, async (test) => {
    const { page } = test;
    const simulatedAdds = [];
    await test.context.route("**/api/cart", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      const action = route.request().postDataJSON();
      simulatedAdds.push(action);
      assert.equal(action.action, "add");
      const isSample = action.productHandle === SAMPLE_SET_OFFER.productHandle;
      assert.ok(
        isSample ||
          action.productHandle === SAMPLE_SET_CONTENTS[0].productHandle,
        "Only the expressly activated fixture products can be added",
      );
      assert.equal(
        action.variantKey,
        `v1_${(isSample ? "s" : "a").repeat(43)}`,
      );
      const total = `¥${(6000 * action.quantity).toLocaleString("en")}`;
      return route.fulfill({
        json: {
          kind: "success",
          checkoutEnabled: false,
          cart: {
            totalQuantity: action.quantity,
            subtotalLabel: total,
            totalLabel: total,
            lines: [
              {
                lineKey: "inline-purchase-fixture",
                productHandle: action.productHandle,
                productTitle: isSample
                  ? "Sample Set"
                  : SAMPLE_SET_CONTENTS[0].name,
                variantTitle: isSample ? "3 × 20 g" : "1 kg",
                options: isSample
                  ? SAMPLE_SET_OFFER.variants[0].options
                  : [{ name: "Size", value: "1 kg" }],
                quantity: action.quantity,
                unitPriceLabel: "¥6,000",
                lineTotalLabel: total,
                purchaseState: "purchasable",
                quantityRule: { minimum: 1, maximum: 4, increment: 1 },
                canUpdateQuantity: true,
                canRemove: true,
                image: null,
              },
            ],
          },
        },
      });
    });
    await increase(page, "ceremonial").click();
    await page.locator("[data-new-hero6-samples]").focus();
    await page.keyboard.press("Enter");
    assert.equal(new URL(page.url()).hash, "#hero6-samples");
    await eventually(
      () => sampleAdd(page).isEnabled(),
      "Inline Sample Set has real purchasing controls",
    );
    await samplePurchase(page)
      .getByRole("button", { name: "Increase quantity", exact: true })
      .click();
    assert.equal(
      await samplePurchase(page)
        .locator('output[aria-label="Set quantity"]')
        .textContent(),
      "2",
    );
    const addButton = sampleAdd(page);
    await addButton.focus();
    await addButton.evaluate((node) => {
      node.click();
      node.click();
    });
    const cart = page.getByRole("dialog").filter({
      has: page.getByRole("button", { name: "Close cart", exact: true }),
    });
    await cart.waitFor();
    assert.deepEqual(simulatedAdds, [
      {
        action: "add",
        productHandle: SAMPLE_SET_OFFER.productHandle,
        variantKey: `v1_${"s".repeat(43)}`,
        quantity: 2,
      },
    ]);
    assert.ok((await cart.textContent()).includes("Sample Set"));
    assert.ok((await cart.textContent()).includes("¥12,000"));
    assert.equal(new URL(page.url()).pathname, "/new-hero6");
    await page.screenshot({
      path: resolve(evidence, "390-inline-sample-cart.png"),
    });
    await cart.getByRole("button", { name: "Close cart", exact: true }).click();
    await eventually(
      () => addButton.evaluate((node) => document.activeElement === node),
      "Closing the cart returns focus to the inline Add to cart button",
    );
    assert.equal(await quantity(page, "ceremonial").textContent(), "2");
    assert.equal(
      await samplePurchase(page)
        .locator('output[aria-label="Set quantity"]')
        .textContent(),
      "2",
    );
    assert.equal(simulatedAdds.length, 1, "No automatic purchase replay");
    const teaAdd = add(page, "ceremonial");
    await teaAdd.focus();
    await page.keyboard.press("Enter");
    await cart.waitFor();
    assert.equal(simulatedAdds.length, 2);
    assert.deepEqual(simulatedAdds[1], {
      action: "add",
      productHandle: SAMPLE_SET_CONTENTS[0].productHandle,
      variantKey: `v1_${"a".repeat(43)}`,
      quantity: 2,
    });
    assert.ok((await cart.textContent()).includes(SAMPLE_SET_CONTENTS[0].name));
    await page.keyboard.press("Escape");
    await eventually(
      () => teaAdd.evaluate((node) => document.activeElement === node),
      "Escape from the cart returns focus to the activated product panel",
    );
    assert.equal(await quantity(page, "ceremonial").textContent(), "2");
  });
  console.log(
    "Inline sample/product orders, duplicate guard, fixture carts and focus return",
  );

  await fixture("390-dark-en", {}, async ({ page }) => {
    await increase(page, "ceremonial").click();
    await increase(page, "barista").click();
    const originLink = page.locator("[data-new-hero6-origin]");
    await originLink.scrollIntoViewIfNeeded();
    await originLink.focus();
    const scrollBefore = await page.evaluate(() => scrollY);
    const urlBefore = page.url();
    const reader = page.locator("[data-origins-dialog][open]");
    for (const dismissal of ["Escape", "Back"]) {
      await originLink.click();
      await reader.waitFor();
      assert.equal(new URL(page.url()).pathname, "/new-hero6");
      assert.equal(new URL(page.url()).hash, "#origins");
      assert.equal(await reader.getAttribute("data-tone"), "dark");
      assert.equal(
        await reader.locator('[data-origins-directory="wazuka"]').count(),
        1,
        "Origin entry opens the relevant growing place",
      );
      if (dismissal === "Escape") await page.keyboard.press("Escape");
      else await page.goBack();
      await reader.waitFor({ state: "hidden" });
      await eventually(
        () => originLink.evaluate((node) => document.activeElement === node),
        `${dismissal} returns focus to the origin entry`,
      );
      await eventually(
        () => page.url() === urlBefore,
        "Reader restores the previous URL",
      );
      assert.ok(
        Math.abs((await page.evaluate(() => scrollY)) - scrollBefore) <= 2,
        `${dismissal} restores the underlying scroll position`,
      );
      assert.equal(await quantity(page, "ceremonial").textContent(), "2");
      assert.equal(await quantity(page, "barista").textContent(), "2");
    }
  });
  console.log(
    "Contextual Wazuka reader, Escape/Back, scroll and focus restoration",
  );

  await fixture("390-dark-en", { holdMutation: true }, async (test) => {
    const { page } = test;
    await increase(page, "culinary").click();
    await add(page, "culinary").click();
    await eventually(
      () => test.simulatedWrites.length === 1,
      "Explicit add reaches isolated fixture",
    );
    assert.deepEqual(test.simulatedWrites[0], {
      action: "add",
      productHandle: SAMPLE_SET_CONTENTS[2].productHandle,
      variantKey: `v1_${"c".repeat(43)}`,
      quantity: 2,
    });
    for (const identity of SAMPLE_SET_CONTENTS)
      assert.equal(await add(page, identity.key).isDisabled(), true);
    assert.equal(await sampleAdd(page).isDisabled(), true);
    const heldURL = page.url();
    for (const selector of [
      "[data-new-hero6-samples]",
      "[data-new-hero6-explore]",
      '[data-new-hero6-reorder="ceremonial"]',
      '[data-new-hero6-jump="barista"]',
      "[data-new-hero6-origin]",
      "[data-new-hero6-sample-details]",
      '[data-new-hero-product="ceremonial"] [data-new-hero-product-link]',
    ]) {
      await page.locator(selector).evaluate((node) => node.click());
    }
    assert.equal(
      page.url(),
      heldURL,
      "Pending cart operation locks navigation",
    );
    test.releaseMutation();
    await card(page, "culinary")
      .locator("[data-new-hero-purchase-error]")
      .waitFor();
    assert.equal(await add(page, "culinary").isEnabled(), true);
    assert.equal(
      await page.locator("[data-new-hero-purchase-error]").count(),
      1,
    );
    assert.equal(test.simulatedWrites.length, 1);
  });
  console.log(
    "Exact cart request, pending-operation locks and inline rejection recovery",
  );

  await fixture("1440-dark-en", {}, async ({ page }) => {
    assert.equal(
      await page.evaluate(
        () => matchMedia("(prefers-reduced-motion: reduce)").matches,
      ),
      true,
    );
    const link = page.locator("[data-new-hero6-samples]");
    await link.focus();
    assert.equal(
      await link.evaluate(
        (node) =>
          document.activeElement === node &&
          parseFloat(getComputedStyle(node).outlineWidth) >= 2,
      ),
      true,
    );
    await page.keyboard.press("Enter");
    await eventually(
      () => new URL(page.url()).hash === "#hero6-samples",
      "Keyboard entry reaches the inline Sample Set",
    );
  });
  console.log("Keyboard Sample Set entry and reduced motion");

  await fixture("320-light-en", {}, async ({ page }) => {
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    assert.equal(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
      true,
      "200% text enlargement on a narrow phone causes no horizontal scrolling",
    );
    const firstView = await page
      .locator("[data-new-hero6-first-view]")
      .boundingBox();
    const applications = await page
      .locator('[data-new-hero6-section="applications"]')
      .boundingBox();
    assert.ok(
      applications.y >= firstView.y + firstView.height - 1,
      "Enlarged hero copy expands the first view without covering products",
    );
    for (const selector of [
      "[data-new-hero6-samples]",
      "[data-new-hero6-explore]",
      "[data-new-hero6-jump]",
      "[data-new-hero6-sample-details]",
      "[data-new-hero6-content] h2",
      "[data-new-hero6-content] h3",
      "[data-new-hero-product] > header",
      "[data-new-hero-product-name]",
      "[data-new-hero-price]",
      "[data-new-hero-total]",
      "[data-new-hero-format]",
      "[data-new-hero-add] button",
      "[data-sample-order] button",
      "[data-sample-order] output",
      "[data-sample-order] summary",
    ]) {
      for (const control of await page.locator(selector).all()) {
        await control.scrollIntoViewIfNeeded();
        assert.equal(await control.isVisible(), true);
        assert.equal(
          await control.evaluate(
            (node) =>
              node.scrollWidth <= node.clientWidth + 1 &&
              node.scrollHeight <= node.clientHeight + 1,
          ),
          true,
          `Enlarged ${selector} remains readable without clipping`,
        );
      }
    }
    await capture(page, "320-light-en-text-200-percent");
  });
  console.log("Narrow-phone 200% text enlargement retains readable controls");

  await fixture("390-light-en", { holdImages: true }, async (test) => {
    const { page } = test;
    const material = page.locator("[data-new-hero6-material]");
    await eventually(() => test.imageRequests() > 0, "Hero imagery is held");
    assert.equal(await material.getAttribute("data-image-state"), "loading");
    await nativeEntries(page, "en");
    assert.equal(await add(page, "barista").isEnabled(), true);
    await page.locator('[data-new-hero6-jump="barista"]').click();
    assert.equal(new URL(page.url()).hash, "#new-hero6-barista");
    test.releaseImages();
    await eventually(
      async () => (await material.getAttribute("data-image-state")) === "ready",
      "Hero material resolves without gating selection",
    );
  });
  console.log(
    "Delayed hero imagery leaves application and purchase entries usable",
  );

  await fixture(
    "320-dark-en",
    { failImages: true, reducedMotion: "no-preference" },
    async ({ page }) => {
      const material = page.locator("[data-new-hero6-material]");
      await eventually(
        async () =>
          (await material.getAttribute("data-image-state")) === "failed",
        "Failed hero material exposes its fallback",
      );
      const heroFallback = page.locator("[data-new-hero6-image-fallback]");
      assert.equal(await heroFallback.isVisible(), true);
      assert.equal(
        await heroFallback.evaluate(
          (node) =>
            node.scrollWidth <= node.clientWidth &&
            node.scrollHeight <= node.clientHeight,
        ),
        true,
        "The hero fallback remains readable on the smallest phone",
      );
      for (const identity of SAMPLE_SET_CONTENTS) {
        const product = card(page, identity.key);
        await product.scrollIntoViewIfNeeded();
        const fallback = product.locator("[data-product-application-fallback]");
        await fallback.waitFor();
        assert.equal(
          await fallback.evaluate(
            (node) =>
              node.scrollWidth <= node.clientWidth &&
              node.scrollHeight <= node.clientHeight,
          ),
          true,
          "Mobile image fallback remains readable",
        );
        assert.equal(await add(page, identity.key).isEnabled(), true);
      }
      await nativeEntries(page, "en");
      await capture(page, "320-dark-en-image-fallback");
    },
  );
  console.log("Failed imagery does not obscure labels or buying controls");
  if (heroComparisons.length)
    await writeFile(
      resolve(evidence, "hero-geometry-comparison.json"),
      `${JSON.stringify(heroComparisons, null, 2)}\n`,
    );
  if (measurements.length)
    await writeFile(
      resolve(evidence, "measurements.json"),
      `${JSON.stringify(measurements, null, 2)}\n`,
    );
} finally {
  await browser.close();
}
