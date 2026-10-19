/* Samples use mocked catalog reads. External traffic and all writes are blocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { translate } from "../src/lib/i18n/index.ts";
import { localizedMetadata } from "../src/lib/i18n/metadata.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.SAMPLES_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence = process.env.SAMPLES_EVIDENCE ?? ".local/samples-0157/browser";
const filters = (process.env.SAMPLES_FILTER ?? "").split(",").filter(Boolean);
const locales = ["en", "ja", "zh-Hans", "zh-Hant"];
const products = SAMPLE_SET_CONTENTS.map((item, index) => ({
  id: item.key,
  handle: item.productHandle,
  title: item.name,
  productCode: item.productCode,
  description: "Isolated samples browser fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
      title: "1 kg",
      available: item.key === "culinary",
      priceMinor: 6123,
      currency: "JPY",
      options: [{ name: "Size", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));
const copy = [
  "Three matcha.",
  "One starting point.",
  "Try the range in your own preparations, with 20 g of each matcha.",
  "Inside the set",
  "One set contains all three matcha.",
  "60 g total",
  "Sample Set",
  "Order the set",
  "See what's included",
  "Ordering is not open yet.",
  "Price, shipping and dispatch details will appear here when the set is available.",
  "Found your matcha?",
  "Compare each sample in the preparation it is selected for, then explore a larger format.",
  "Explore the 1 kg collection",
];

async function eventually(check, message) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
let activePage;
let activeName;
let passed = 0;

async function setup(
  width,
  tone,
  locale = "en",
  initialMode = "ready",
  javaScriptEnabled = true,
  reducedMotion = "reduce",
) {
  const context = await browser.newContext({
    viewport: { width, height: width < 500 ? 800 : 900 },
    reducedMotion,
    hasTouch: width < 500,
    isMobile: width < 500,
    javaScriptEnabled,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: locale, url: baseURL },
  ]);
  const errors = [];
  let mode = initialMode;
  let catalogReads = 0;
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      errors.push("Unexpected external request or write");
      return route.abort();
    }
    if (url.pathname === "/api/cart")
      return route.fulfill({ json: { kind: "empty", checkoutEnabled: false } });
    if (url.pathname === "/api/catalog") {
      catalogReads++;
      if (mode === "network") return route.abort("failed");
      if (mode === "failed")
        return route.fulfill({
          status: 503,
          json: { status: "unavailable", products: [] },
        });
      const ambiguous = {
        ...products[0],
        id: "sample-set-fixture",
        handle: "sample-set",
        title: "Sample Set — 3 × 20 g",
        variants: ["first", "second"].map((id) => ({
          ...products[0].variants[0],
          id,
          title: "3 × 20 g",
          available: true,
          options: [{ name: "Size", value: "3 × 20 g" }],
        })),
      };
      return route.fulfill({
        json: {
          status: mode === "empty" ? "empty" : "ready",
          products:
            mode === "empty" || mode === "absent"
              ? []
              : mode === "ambiguous"
                ? [...products, ambiguous]
                : products,
          shopUrl: "https://example.invalid",
        },
      });
    }
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
  return {
    context,
    page,
    errors,
    setMode: (next) => (mode = next),
    reads: () => catalogReads,
  };
}

async function fit(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "No page overflow",
  );
  assert.equal(
    await page
      .locator("[data-samples-page]")
      .evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    true,
    "The samples surface fits",
  );
}

async function noPurchase(page) {
  await page.locator("[data-sample-unavailable]").waitFor();
  assert.equal(await page.locator("[data-sample-order]").count(), 0);
  const unavailable = page.locator("[data-sample-unavailable]");
  assert.equal(await unavailable.locator("button").count(), 0);
  assert.equal(
    await unavailable.locator('a[href="#samples-contents"]').count(),
    1,
    "The unavailable set provides a useful contents link",
  );
  assert.doesNotMatch(
    await page.locator("[data-samples-page]").innerText(),
    /[¥￥$]|JPY|4,800|1,000|6,123/,
    "No illustrative or unrelated product price is presented as the set price",
  );
}

async function materialSilhouettesFit(page) {
  const bounds = await page
    .locator("[data-sample-gallery]")
    .evaluate(async (gallery) => {
      const stage = gallery.firstElementChild;
      const frame = stage.getBoundingClientRect();
      const results = [];
      for (const material of gallery.querySelectorAll(
        "[data-sample-material]",
      )) {
        if (Number(getComputedStyle(material).opacity) === 0) continue;
        const image = material.querySelector("img");
        const source = getComputedStyle(image)
          .maskImage.replace(/^url\(["']?/, "")
          .replace(/["']?\)$/, "");
        const mask = new Image();
        mask.src = source;
        await mask.decode();
        const canvas = document.createElement("canvas");
        canvas.width = mask.naturalWidth;
        canvas.height = mask.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(mask, 0, 0);
        const pixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data;
        let left = canvas.width,
          right = 0,
          top = canvas.height,
          bottom = 0;
        for (let y = 0; y < canvas.height; y++)
          for (let x = 0; x < canvas.width; x++)
            if (pixels[(y * canvas.width + x) * 4 + 3] > 0) {
              left = Math.min(left, x);
              right = Math.max(right, x + 1);
              top = Math.min(top, y);
              bottom = Math.max(bottom, y + 1);
            }
        const box = image.getBoundingClientRect();
        const scale = Math.min(
          box.width / canvas.width,
          box.height / canvas.height,
        );
        const x = box.left + (box.width - canvas.width * scale) / 2;
        const y = box.top + (box.height - canvas.height * scale) / 2;
        results.push({
          key: material.dataset.sampleMaterial,
          left: x + left * scale - frame.left,
          right: frame.right - x - right * scale,
          top: y + top * scale - frame.top,
          bottom: frame.bottom - y - bottom * scale,
        });
      }
      return { scrollLeft: stage.scrollLeft, silhouettes: results };
    });
  assert.equal(
    bounds.scrollLeft,
    0,
    "The material frame cannot accumulate horizontal scrolling",
  );
  for (const { key, ...edges } of bounds.silhouettes)
    for (const [edge, space] of Object.entries(edges))
      assert.ok(
        space >= -1,
        `${key} powder silhouette fits the ${edge} edge: ${space.toFixed(2)}px`,
      );
}

async function canonical(page, width, tone, locale) {
  await page.goto(`${baseURL}/samples`);
  const main = page.locator("[data-samples-page]");
  await noPurchase(page);
  assert.equal(await main.getAttribute("data-tone"), tone);
  assert.equal(await page.locator("html").getAttribute("lang"), locale);
  assert.equal(await main.getByRole("heading", { level: 1 }).count(), 1);
  assert.equal(
    await main.locator("h1").innerText(),
    translate(locale, "Sample Set"),
  );
  assert.equal(await main.locator("[data-sample-material]").count(), 3);
  const gallery = main.locator("[data-sample-gallery]");
  assert.equal(await gallery.count(), 1);
  assert.equal(await gallery.getAttribute("data-preview"), "all");
  assert.deepEqual(
    await gallery
      .locator("[data-sample-gallery-choice]")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.dataset.sampleGalleryChoice),
      ),
    ["all", ...SAMPLE_SET_CONTENTS.map((item) => item.key)],
  );
  assert.equal(await gallery.locator('button[aria-pressed="true"]').count(), 1);
  assert.equal(
    await gallery
      .locator("[data-sample-gallery-controls]")
      .getAttribute("aria-label"),
    translate(locale, "Preview a matcha"),
  );
  for (const [key, label] of [
    ["all", "All three"],
    ...SAMPLE_SET_CONTENTS.map((item) => [
      item.key,
      item.name.replace(/ Matcha$/, ""),
    ]),
  ])
    assert.equal(
      await gallery
        .locator(`[data-sample-gallery-choice="${key}"]`)
        .innerText(),
      translate(locale, label),
    );
  for (const button of await gallery
    .locator("button[data-sample-gallery-choice]")
    .all())
    assert.equal(
      await button.evaluate((node) => getComputedStyle(node).borderRadius),
      "6px",
      "Gallery choices retain the site’s 6px button radius",
    );
  assert.equal(await main.locator("[data-sample-content]").count(), 3);
  assert.equal(await main.locator("[data-sample-purchase]").count(), 1);
  assert.equal(
    await main.locator("[data-sample-purchase] h2").innerText(),
    translate(locale, "Order the set"),
  );
  assert.equal(
    await main.evaluate((node) => {
      const parts = [
        node.querySelector("h1"),
        node.querySelector("[data-sample-material]"),
        node.querySelector("[data-sample-purchase]"),
        node.querySelector("[data-sample-content]"),
      ];
      return parts.every(
        (part, index) =>
          part &&
          (index === 0 ||
            Boolean(
              parts[index - 1].compareDocumentPosition(part) &
              Node.DOCUMENT_POSITION_FOLLOWING,
            )),
      );
    }),
    true,
    "Reading order is introduction, material, purchase, contents",
  );
  if (width < 500) {
    const opening = await main.evaluate((node) => {
      const h1 = node.querySelector("h1").getBoundingClientRect();
      const material = node
        .querySelector("[data-sample-gallery]")
        .getBoundingClientRect();
      const purchase = node
        .querySelector("[data-sample-purchase]")
        .getBoundingClientRect();
      const contents = node
        .querySelector("#samples-contents")
        .getBoundingClientRect();
      return {
        ordered:
          h1.bottom <= material.top &&
          material.bottom <= purchase.top &&
          purchase.bottom <= contents.top,
      };
    });
    assert.equal(
      opening.ordered,
      true,
      "Mobile visual order matches reading order",
    );
  }
  assert.equal(
    await main
      .locator('[data-nav-action="samples"]')
      .getAttribute("aria-current"),
    "page",
  );
  assert.equal(await page.locator('footer a[href="/samples"]').count(), 1);
  assert.ok((await main.textContent()).includes("3 × 20 g"));
  for (const source of copy) {
    const translated = translate(locale, source);
    if (locale !== "en") assert.notEqual(translated, source);
    assert.ok(
      (await main.textContent()).includes(translated),
      `${locale}: ${source}`,
    );
  }
  await eventually(
    async () =>
      (await page.title()) === localizedMetadata("samples", locale).title,
    "Localized page title",
  );
  assert.equal(
    await page.locator('meta[name="description"]').getAttribute("content"),
    localizedMetadata("samples", locale).description,
  );
  for (const item of SAMPLE_SET_CONTENTS) {
    const sample = main.locator(`[data-sample-content="${item.key}"]`);
    for (const expected of [
      translate(locale, item.name),
      translate(locale, item.application),
      item.productCode,
      "20 g",
    ])
      assert.ok((await sample.textContent()).includes(expected));
    assert.ok(
      (await sample
        .locator("h3")
        .evaluate((node) => parseFloat(getComputedStyle(node).fontSize))) >= 14,
      "Each matcha name remains readable",
    );
    assert.equal(
      await sample.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
      true,
      "Each contents row fits",
    );
    const image = main.locator(`[data-sample-material="${item.key}"] img`);
    await image.scrollIntoViewIfNeeded();
    await eventually(
      () =>
        image.evaluate(
          (node) =>
            node.complete &&
            node.naturalWidth > 0 &&
            getComputedStyle(node).opacity === "1",
        ),
      "Material photograph loads and becomes visible",
    );
    assert.equal(
      await image.getAttribute("alt"),
      translate(locale, item.imageAlt),
    );
    assert.equal(
      new URL(await image.getAttribute("src"), baseURL).pathname,
      item.image,
    );
    assert.equal(
      await image.evaluate((node) => getComputedStyle(node).objectFit),
      "contain",
    );
  }
  await materialSilhouettesFit(page);
  const preparation = main.getByAltText(
    translate(locale, "A bowl of prepared matcha on a woven mat."),
    { exact: true },
  );
  assert.equal(await preparation.count(), 1);
  await preparation.scrollIntoViewIfNeeded();
  await eventually(
    () =>
      preparation.evaluate((node) => node.complete && node.naturalWidth > 0),
    "The preparation photograph loads with a translated description",
  );
  assert.ok(
    (await main
      .locator("h1")
      .evaluate((node) => parseFloat(getComputedStyle(node).fontSize))) <=
      (width < 500 ? 24 : 30),
  );
  const contentsLink = main.getByRole("link", {
    name: translate(locale, "See what's included"),
    exact: false,
  });
  await contentsLink.focus();
  await page.keyboard.press("Enter");
  await page.waitForURL((url) => url.hash === "#samples-contents");
  assert.equal(
    await page
      .locator("#samples-contents")
      .evaluate((node) => node === document.activeElement),
    true,
    "The contents link moves keyboard focus to the visible contents heading",
  );
  await fit(page);
  await main.locator("h1").click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: resolve(evidence, `${activeName}.png`),
    fullPage: true,
    animations: "disabled",
  });
}

async function navLink(page, action) {
  await page
    .locator("[data-theme-switcher]:not(:disabled)")
    .first()
    .waitFor({ state: "attached" });
  const link = page.locator(`header [data-nav-action="${action}"]`);
  if (!(await link.isVisible()))
    await page.locator("[data-nav-summary]").click();
  await link.waitFor({ state: "visible" });
  return link;
}

async function galleryInteraction(fixture, reduced, locale = "en") {
  const { page } = fixture;
  await page.goto(`${baseURL}/samples`);
  await noPurchase(page);
  const gallery = page.locator("[data-sample-gallery]");
  await gallery.waitFor();
  const materials = new Map();
  for (const item of SAMPLE_SET_CONTENTS) {
    const material = gallery.locator(`[data-sample-material="${item.key}"]`);
    materials.set(item.key, await material.elementHandle());
    await eventually(
      () =>
        material
          .locator("[data-masked]")
          .evaluate(
            (node) =>
              node.dataset.masked === "true" &&
              node.dataset.pending === "false",
          ),
      "Every gallery material finishes masking before interaction",
    );
  }
  const reads = fixture.reads();
  for (const key of [...SAMPLE_SET_CONTENTS.map((item) => item.key), "all"]) {
    const choice = gallery.locator(`[data-sample-gallery-choice="${key}"]`);
    await choice.scrollIntoViewIfNeeded();
    if (page.viewportSize().width >= 500) await choice.focus();
    const before = await page.evaluate(() => {
      const gallery = document
        .querySelector("[data-sample-gallery]")
        .getBoundingClientRect();
      return {
        width: gallery.width,
        height: gallery.height,
        top: gallery.top + scrollY,
        scroll: scrollY,
        document: document.documentElement.scrollHeight,
        purchase:
          document
            .querySelector("[data-sample-purchase]")
            .getBoundingClientRect().top + scrollY,
        contents:
          document
            .querySelector("[data-sample-content]")
            .getBoundingClientRect().top + scrollY,
      };
    });
    if (page.viewportSize().width < 500) await choice.tap();
    else await page.keyboard.press("Space");
    await eventually(
      async () => (await gallery.getAttribute("data-preview")) === key,
      "The gallery previews the requested material",
    );
    assert.equal(await choice.getAttribute("aria-pressed"), "true");
    assert.equal(
      await gallery.locator('button[aria-pressed="true"]').count(),
      1,
    );
    if (page.viewportSize().width >= 500)
      assert.equal(
        await choice.evaluate((node) => node === document.activeElement),
        true,
        "Preview choices retain keyboard focus",
      );
    const samples = await page.evaluate(async () => {
      const measurements = [];
      const deadline = performance.now() + 700;
      do {
        await new Promise((done) => requestAnimationFrame(done));
        const gallery = document.querySelector("[data-sample-gallery]");
        const box = gallery.getBoundingClientRect();
        measurements.push({
          width: box.width,
          height: box.height,
          top: box.top + scrollY,
          scroll: scrollY,
          document: document.documentElement.scrollHeight,
          purchase:
            document
              .querySelector("[data-sample-purchase]")
              .getBoundingClientRect().top + scrollY,
          contents:
            document
              .querySelector("[data-sample-content]")
              .getBoundingClientRect().top + scrollY,
          masked: [...gallery.querySelectorAll("[data-masked]")].every(
            (node) =>
              node.dataset.masked === "true" &&
              node.dataset.pending === "false" &&
              getComputedStyle(node.querySelector("img")).maskImage !== "none",
          ),
          appearance: [...gallery.querySelectorAll("[data-sample-material]")]
            .map((node) => {
              const style = getComputedStyle(node);
              return `${style.transform}:${style.opacity}`;
            })
            .join("|"),
        });
      } while (performance.now() < deadline);
      return measurements;
    });
    for (const sample of samples) {
      assert.equal(
        sample.masked,
        true,
        "Preview transitions keep the prepared masks and never expose raw photographs",
      );
      for (const property of Object.keys(before))
        assert.ok(
          Math.abs(sample[property] - before[property]) <= 1,
          `${key} preview preserves ${property}: ${before[property]} → ${sample[property]}`,
        );
    }
    assert.equal(
      new Set(samples.map((sample) => sample.appearance)).size > 1,
      !reduced,
      reduced
        ? "Reduced motion changes the gallery immediately"
        : "Normal motion transitions the material photographs without moving the layout",
    );
    for (const [materialKey, handle] of materials) {
      const material = gallery.locator(
        `[data-sample-material="${materialKey}"]`,
      );
      assert.equal(
        await gallery
          .locator(`[data-sample-material="${materialKey}"]`)
          .evaluate((node, original) => node === original, handle),
        true,
        "The three material nodes stay mounted throughout preview changes",
      );
      const visible = key === "all" || key === materialKey;
      assert.equal(
        await material.getAttribute("aria-hidden"),
        String(!visible),
      );
      assert.equal(
        await material.evaluate((node) => getComputedStyle(node).opacity),
        visible ? "1" : "0",
        "The selected preview agrees with the visible material",
      );
    }
    assert.equal(await gallery.locator("[data-sample-material]").count(), 3);
    assert.ok(
      (await gallery.innerText()).includes(
        translate(locale, "One set contains all three matcha."),
      ),
      "Individual previews keep the full set contents clear",
    );
    assert.deepEqual(
      fixture.reads(),
      reads,
      "Gallery previews do not reload commerce data",
    );
    await materialSilhouettesFit(page);
    if (reduced)
      assert.equal(
        await gallery.evaluate(
          (node) =>
            node
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === "running").length,
        ),
        0,
        "Reduced motion leaves no running gallery transitions",
      );
    await noPurchase(page);
    await fit(page);
  }
  await gallery.screenshot({
    path: resolve(evidence, `${activeName}-gallery.png`),
    animations: "disabled",
  });
}

async function originsRoundTrip(page, locale, entrance) {
  const before = page.url();
  const trigger =
    entrance === "header"
      ? await navLink(page, "origins")
      : page.locator("footer").getByRole("button", {
          name: new RegExp(translate(locale, "Growing places")),
        });
  await trigger.click();
  const dialog = page.locator("[data-origins-dialog][open]");
  await dialog.waitFor();
  const back = dialog.getByRole("button", {
    name: translate(locale, "Back to samples"),
    exact: true,
  });
  await back.waitFor();
  assert.equal(await dialog.getAttribute("data-tone"), "dark");
  await back.click();
  await dialog.waitFor({ state: "hidden" });
  await eventually(
    () => page.url() === before,
    "Origins returns to the samples URL",
  );
  await noPurchase(page);
}

async function navigation(page, context) {
  await page.goto(`${baseURL}/`);
  await page
    .getByRole("button", {
      name: "Explore matcha from the silver bag",
      exact: true,
    })
    .waitFor();
  assert.equal(await page.locator('[data-nav-action="samples"]').count(), 0);
  assert.equal(await page.locator('footer a[href="/samples"]').count(), 0);
  assert.equal(await page.locator("[data-sample-entry]:visible").count(), 0);
  await page
    .getByRole("button", {
      name: "Explore matcha from the silver bag",
      exact: true,
    })
    .click();
  const choice = page.locator('[data-homepage-product-choice="culinary"]');
  await choice.click();
  const shopTab = page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name: "Shop", exact: true });
  await shopTab.click();
  const order = page.locator("[data-shop-exploration]");
  await order
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  const sampleRail = page.locator(
    '[data-stage-selectors] [data-sample-entry="rail"]',
  );
  assert.equal(await sampleRail.count(), 1);
  await sampleRail.click();
  await page.waitForURL((url) => url.pathname === "/samples");
  await noPurchase(page);
  await page.goBack();
  await choice.waitFor();
  assert.equal(await choice.getAttribute("aria-pressed"), "true");
  assert.equal(await shopTab.getAttribute("aria-pressed"), "true");
  assert.equal(
    await order.getByLabel("Quantity", { exact: true }).innerText(),
    "2",
    "Returning from samples preserves the existing matcha order",
  );
  await (await navLink(page, "samples")).click();
  await page.waitForURL((url) => url.pathname === "/samples");
  await noPurchase(page);
  await page.locator("[data-theme-switcher]:visible").first().click();
  await eventually(
    async () =>
      (await page.locator("[data-samples-page]").getAttribute("data-tone")) ===
      "dark",
    "Theme switches in place",
  );
  await page
    .locator("[data-language-switcher]:visible")
    .first()
    .selectOption("ja");
  await eventually(
    async () => (await page.locator("html").getAttribute("lang")) === "ja",
    "Locale switches in place",
  );
  await originsRoundTrip(page, "ja", "header");
  await originsRoundTrip(page, "ja", "footer");
  await page
    .getByRole("link", {
      name: translate("ja", "Explore the 1 kg collection"),
      exact: false,
    })
    .click();
  await page.waitForURL((url) => url.pathname === "/shop");
  const entry = page.locator('[data-sample-entry="collection"]');
  await entry.waitFor({ state: "visible" });
  assert.equal(await entry.count(), 1);
  assert.equal(await entry.getAttribute("href"), "/samples");
  await entry.click();
  await page.waitForURL((url) => url.pathname === "/samples");
  await noPurchase(page);
  await (await navLink(page, "shop")).click();
  await page.waitForURL((url) => url.pathname === "/shop");
  await page.locator('footer a[href="/samples"]').click();
  await page.waitForURL((url) => url.pathname === "/samples");
  await noPurchase(page);
  assert.equal(
    await page.locator("[data-samples-page]").getAttribute("data-tone"),
    "dark",
  );
  assert.equal(await page.locator("html").getAttribute("lang"), "ja");
  const cookies = await context.cookies();
  assert.equal(
    cookies.find((item) => item.name === "atoma-theme")?.value,
    "dark",
  );
  assert.equal(
    cookies.find((item) => item.name === "atoma-locale")?.value,
    "ja",
  );
  await page.reload();
  await noPurchase(page);
  assert.equal(
    await page.locator("[data-samples-page]").getAttribute("data-tone"),
    "dark",
  );
  assert.equal(await page.locator("html").getAttribute("lang"), "ja");
  await fit(page);
}

async function run(name, options, test) {
  if (filters.length && !filters.some((filter) => name.includes(filter)))
    return;
  activeName = name;
  const fixture = await setup(...options);
  try {
    await test(fixture);
    assert.deepEqual(fixture.errors, []);
    passed++;
    console.log(`${name}: passed`);
  } catch (error) {
    await fixture.page.screenshot({
      path: resolve(evidence, `${name}-failure.png`),
      fullPage: true,
      animations: "disabled",
    });
    throw error;
  } finally {
    await fixture.context.close();
  }
}

try {
  for (const width of [1440, 320])
    for (const reduced of [false, true])
      await run(
        `${width}-gallery-${reduced ? "reduced" : "motion"}`,
        [
          width,
          "light",
          "en",
          "ready",
          true,
          reduced ? "reduce" : "no-preference",
        ],
        (fixture) => galleryInteraction(fixture, reduced),
      );

  await run(
    "320-gallery-motion-ja",
    [320, "dark", "ja", "ready", true, "no-preference"],
    (fixture) => galleryInteraction(fixture, false, "ja"),
  );

  for (const width of [1440, 768, 390, 320])
    for (const tone of ["light", "dark"])
      for (const locale of width === 320 || width === 1440 ? locales : ["en"])
        await run(
          `${width}-${tone}-${locale}`,
          [width, tone, locale],
          ({ page }) => canonical(page, width, tone, locale),
        );

  for (const mode of ["absent", "empty", "ambiguous", "failed", "network"])
    await run(
      `catalog-${mode}`,
      [320, "light", "en", mode],
      async (fixture) => {
        const { page } = fixture;
        await page.goto(`${baseURL}/samples`);
        if (mode === "failed" || mode === "network") {
          const retry = page.getByRole("button", { name: /Try again/ });
          await retry.waitFor();
          await retry.focus();
          const reads = fixture.reads();
          fixture.setMode("ready");
          await page.keyboard.press("Enter");
          await noPurchase(page);
          assert.ok(fixture.reads() > reads, "Retry requests a fresh catalog");
          assert.equal(
            await page
              .locator("#samples-purchase")
              .evaluate((node) => node === document.activeElement),
            true,
            "Retry keeps keyboard focus on the purchase heading",
          );
        } else await noPurchase(page);
        await fit(page);
      },
    );

  for (const width of [1440, 320])
    await run(`${width}-navigation`, [width, "light"], ({ page, context }) =>
      navigation(page, context),
    );

  await run(
    "320-no-js",
    [320, "light", "en", "ready", false],
    async ({ page }) => {
      await page.goto(`${baseURL}/samples`);
      const main = page.locator("[data-samples-page]");
      assert.equal(await main.locator("[data-sample-content]").count(), 3);
      assert.equal(await main.locator("[data-sample-material]").count(), 3);
      assert.ok((await main.innerText()).includes("3 × 20 g"));
      assert.ok(
        (await main.innerText()).includes(
          "Enable JavaScript to check availability and order.",
        ),
      );
      assert.equal(await main.locator("[data-sample-order]").count(), 0);
      for (const image of await main.locator("img").all()) {
        if (
          await image.evaluate((node) =>
            Boolean(node.closest('[aria-hidden="true"]')),
          )
        ) {
          assert.equal(await image.getAttribute("alt"), "");
          continue;
        }
        await image.scrollIntoViewIfNeeded();
        await eventually(
          () =>
            image.evaluate(
              (node) =>
                node.complete &&
                node.naturalWidth > 0 &&
                getComputedStyle(node).opacity === "1",
            ),
          "Static material images remain visible without JavaScript",
        );
        assert.notEqual(await image.getAttribute("alt"), null);
        if (!(await image.getAttribute("alt")))
          assert.equal(
            await image.evaluate((node) =>
              Boolean(node.closest('[aria-hidden="true"]')),
            ),
            true,
            "Empty image alternatives are reserved for decorative material",
          );
      }
      await fit(page);
      await page.screenshot({
        path: resolve(evidence, "320-no-js.png"),
        fullPage: true,
      });
    },
  );
} catch (error) {
  if (activePage && !activePage.isClosed())
    await activePage.screenshot({
      path: resolve(evidence, `${activeName}-failure.png`),
      animations: "disabled",
    });
  console.error(`Failed ${activeName}`);
  throw error;
} finally {
  await browser.close();
}
console.log(`${passed} samples scenarios passed; all writes blocked`);
