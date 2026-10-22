/* Separate hero customer-experience study. Commerce reads are isolated fixtures;
 * external requests and writes are blocked, including checkout and cart changes. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { cartProduct, createHeroStudyFixture } from "./hero-cx-fixtures.mjs";
import { translate } from "../src/lib/i18n/index.ts";
import { oneKilogramProductUrl } from "../src/lib/sample-journey.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.HERO_CX_STUDY_BASE_URL ?? "http://127.0.0.1:3100";
const studyURL = `${baseURL}/hero-cx-study`;
const evidence =
  process.env.HERO_CX_STUDY_EVIDENCE ?? ".local/hero-cx-study-0230/after";
const profiles = process.env.HERO_CX_STUDY_PROFILES?.split(",").filter(
  Boolean,
) ?? [
  "1440-light-en",
  "1440-dark-ja",
  "768-light-zh-Hans",
  "768-dark-zh-Hant",
  "390-light-ja",
  "390-dark-en",
  "360-light-zh-Hans",
  "320-dark-zh-Hant",
];
const keys = ["ceremonial", "barista", "culinary"];
const foldMeasurements = [];
const applicationSources = {
  ceremonial: "/images/samples/prepared-matcha.webp",
  barista: "/images/applications/iced-matcha-latte-reference-v1.webp",
  culinary: "/images/applications/matcha-tea-cake-reference-v1.webp",
};
const layouts = ["invitation", "directory", "guided"];
const rangeSource =
  "/images/applications/matcha-range-composition-reference-v1.webp";
const startStep = {
  invitation: "intro",
  directory: "application",
  guided: "application",
};

await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });

async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

const setup = (width, tone, locale, options) =>
  createHeroStudyFixture(browser, baseURL, width, tone, locale, options);

const study = (page) => page.locator("[data-hero-cx-study]");
const choice = (page, key) => page.locator(`[data-cx-choice="${key}"]`);
async function step(page, value) {
  await eventually(
    async () => (await study(page).getAttribute("data-step")) === value,
    `The study reaches its ${value} step`,
  );
}
async function selectLayout(page, value) {
  await page.locator("[data-cx-layout]").selectOption(value);
  await eventually(
    async () => (await study(page).getAttribute("data-layout")) === value,
    `${value} layout is selected`,
  );
  await step(page, startStep[value]);
  assert.equal(new URL(page.url()).searchParams.get("layout"), value);
}
async function noOverflow(page, width) {
  await page.evaluate(() => document.fonts.ready);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "No horizontal page overflow",
  );
  const clipped = await study(page)
    .locator("h1,h2,p,a,button,select,figcaption")
    .evaluateAll((nodes) =>
      nodes
        .filter(
          (node) =>
            node.getClientRects().length &&
            node.scrollWidth > node.clientWidth + 1,
        )
        .map((node) => node.textContent),
    );
  assert.deepEqual(clipped, [], "Visible copy and controls do not clip");
  assert.equal(
    await study(page)
      .locator(
        "[data-cx-samples] [data-scramble-glyph], [data-cx-choice] [data-scramble-glyph], [data-cx-intent] [data-scramble-glyph], [data-cx-one-kilogram] [data-scramble-glyph]",
      )
      .count(),
    0,
    "Customer controls remain plain text",
  );
  if (width <= 760) {
    const undersized = await study(page)
      .locator(
        "[data-cx-samples],[data-cx-choice],[data-cx-intent],[data-cx-one-kilogram]",
      )
      .evaluateAll((nodes) =>
        nodes
          .filter(
            (node) =>
              node.getClientRects().length &&
              parseFloat(getComputedStyle(node).fontSize) < 14,
          )
          .map((node) => node.textContent),
      );
    assert.deepEqual(
      undersized,
      [],
      "Mobile customer actions are at least 14px",
    );
    const nestedScroll = await study(page)
      .locator("main section,main article,main p")
      .evaluateAll((nodes) =>
        nodes
          .filter(
            (node) =>
              node.getClientRects().length &&
              ["auto", "scroll"].includes(getComputedStyle(node).overflowY) &&
              node.scrollHeight > node.clientHeight + 1,
          )
          .map((node) => node.tagName),
      );
    assert.deepEqual(
      nestedScroll,
      [],
      "Mobile reading uses continuous page scrolling",
    );
  }
}
async function firstScreen(page, selector) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const bounds = await page.locator(selector).first().boundingBox();
  assert.ok(
    bounds &&
      bounds.y >= 0 &&
      bounds.y + bounds.height <= page.viewportSize().height,
    "The starting action fits the first screen",
  );
}
async function sampleContext(page, locale) {
  const links = page.locator("[data-cx-samples]");
  for (const link of await links.all()) {
    assert.equal(await link.getAttribute("href"), "/samples");
    assert.equal(
      await link
        .locator("..")
        .getByText(translate(locale, "Three matcha · 20 g each"), {
          exact: true,
        })
        .isVisible(),
      true,
      "Sample contents stay next to their action",
    );
  }
}
async function assertProduct(
  page,
  key,
  locale,
  primary = "samples",
  focus = true,
) {
  await step(page, "product");
  await eventually(
    async () => (await study(page).getAttribute("data-selected")) === key,
    `The product selection updates to ${key}`,
  );
  const product = SAMPLE_SET_CONTENTS.find((item) => item.key === key);
  const summary = page.locator(`[data-cx-product="${key}"]`);
  await summary.waitFor();
  const layout = await study(page).getAttribute("data-layout");
  const identity =
    layout === "directory"
      ? page.locator(`[data-cx-directory-row="${key}"]`)
      : page.locator("[data-cx-layout-guided] > header");
  assert.ok((await identity.textContent()).includes(product.productCode));
  assert.ok(
    (await identity.textContent()).includes(translate(locale, product.name)),
  );
  assert.equal(
    await page.locator("[data-cx-one-kilogram]").getAttribute("href"),
    oneKilogramProductUrl(product.productHandle),
  );
  assert.equal(await page.locator("[data-cx-primary]").count(), 1);
  assert.equal(
    await page.locator("[data-cx-primary]").getAttribute("data-cx-primary"),
    primary,
  );
  await sampleContext(page, locale);
  if (focus)
    await eventually(
      () =>
        page.evaluate(() =>
          document.activeElement?.matches(
            "#cx-heading,[data-cx-product-heading]",
          ),
        ),
      "A newly opened product receives heading focus",
    );
}
async function guidedChoices(page, locale, selectedKey) {
  assert.equal(await page.locator("[data-cx-intent]").count(), 0);
  assert.equal(await page.locator("[data-cx-choice]").count(), 3);
  const applications = {
    ceremonial: "Tea service",
    barista: "Lattes",
    culinary: "Recipes & baking",
  };
  for (const key of keys) {
    const product = SAMPLE_SET_CONTENTS.find((item) => item.key === key);
    const text = await choice(page, key).textContent();
    assert.equal(await choice(page, key).isVisible(), true);
    assert.ok(text.includes(translate(locale, applications[key])));
    assert.ok(text.includes(translate(locale, product.name)));
    assert.equal(
      await choice(page, key).getAttribute("aria-pressed"),
      String(key === selectedKey),
    );
  }
  assert.equal(
    await page.locator("[data-cx-guided-sample-entry]").isVisible(),
    true,
  );
  assert.equal(await page.locator("[data-cx-primary]").count(), 1);
  assert.equal(
    await page.locator("[data-cx-primary]").getAttribute("data-cx-primary"),
    "samples",
  );
  await sampleContext(page, locale);
  await guidedProgress(page, "01");
}

async function guidedExplanation(page, key, locale) {
  const explanation = page.locator("[data-cx-choice-explanation]");
  assert.equal(await explanation.isVisible(), true);
  const explanations = {
    ceremonial: "For tea served with water.",
    barista: "For hot and iced matcha lattes.",
    culinary: "For baking, desserts and café recipes.",
  };
  if (locale !== "en")
    assert.notEqual(translate(locale, explanations[key]), explanations[key]);
  assert.equal(
    (await explanation.textContent()).trim(),
    translate(locale, explanations[key]),
  );
  assert.equal(
    (await page.locator("[data-cx-sample-explanation]").textContent()).trim(),
    translate(
      locale,
      "The Sample Set includes all three matcha. Compare them in your own recipes, then choose your 1 kg matcha.",
    ),
  );
  await guidedProgress(page, "02");
}
async function guidedProgress(page, number) {
  const progress = page.locator("[data-cx-guided-progress]");
  assert.equal(await progress.locator("li").count(), 2);
  const current = progress.locator('[aria-current="step"]');
  assert.equal(await current.count(), 1);
  assert.ok((await current.textContent()).includes(number));
}
async function assertProductImage(page, key, locale) {
  const image = page.locator(`[data-product-application-image="${key}"]`);
  await image.scrollIntoViewIfNeeded();
  await eventually(
    async () => (await image.getAttribute("data-image-state")) === "ready",
    `${key} reference loads`,
  );
  const src = new URL(await image.locator("img").getAttribute("src"), baseURL);
  assert.equal(
    src.searchParams.get("url") ?? src.pathname,
    applicationSources[key],
  );
  assert.ok((await image.locator("img").getAttribute("alt")).trim());
  assert.equal(
    (
      await image.locator("[data-product-application-caption]").textContent()
    ).trim(),
    translate(
      locale,
      key === "ceremonial"
        ? "Application reference · Product photography pending"
        : "AI application reference · Product photography pending",
    ),
  );
}
async function capture(page, name) {
  await page.screenshot({
    path: resolve(evidence, `${name}.png`),
    fullPage: true,
  });
}
async function assertRange(page, locale) {
  const range = page.locator("[data-cx-range-image]");
  assert.equal(await range.count(), 1, "Invitation uses one unified scene");
  await range.scrollIntoViewIfNeeded();
  await eventually(
    async () => (await range.getAttribute("data-image-state")) === "ready",
    "The unified range reference loads",
  );
  const src = new URL(await range.locator("img").getAttribute("src"), baseURL);
  assert.equal(src.searchParams.get("url") ?? src.pathname, rangeSource);
  assert.equal(
    await range.locator("img").getAttribute("alt"),
    translate(
      locale,
      "A bowl of matcha, an iced latte and a slice of matcha cake on one neutral surface. AI composition reference.",
    ),
  );
  assert.equal(
    (await range.locator("figcaption").textContent()).trim(),
    translate(locale, "AI composition reference · Product photography pending"),
  );
  assert.equal(await range.locator("a,button,[role=button]").count(), 0);
  const geometry = await page.evaluate(() => {
    const heading = document.querySelector("#cx-heading");
    const image = document.querySelector("[data-cx-range-image]");
    const actions = document.querySelector("[data-cx-actions]");
    const h = heading.getBoundingClientRect();
    return {
      alignment: getComputedStyle(heading).textAlign,
      headingCenter: h.x + h.width / 2,
      pageCenter: innerWidth / 2,
      imageTop: image.getBoundingClientRect().top,
      actionBottom: actions.getBoundingClientRect().bottom,
    };
  });
  assert.equal(geometry.alignment, "center");
  assert.ok(Math.abs(geometry.headingCenter - geometry.pageCenter) < 2);
  assert.ok(geometry.actionBottom <= geometry.imageTop);
  await page.evaluate(() => window.scrollTo(0, 0));
}
function clean(test) {
  assert.deepEqual(test.errors, []);
  assert.deepEqual(test.writes, []);
}

async function layoutShape(page, layout) {
  assert.equal(await page.locator(`[data-cx-layout-${layout}]`).count(), 1);
  for (const other of layouts.filter((item) => item !== layout))
    assert.equal(await page.locator(`[data-cx-layout-${other}]`).count(), 0);
  assert.equal(
    await page
      .locator("[data-cx-material],[data-cx-visual],[data-cx-triptych]")
      .count(),
    0,
    "Whole-page studies do not retain the rejected hero controls or composition",
  );
  if (layout === "directory") {
    const rows = page.locator("[data-cx-directory-row]");
    assert.equal(await rows.count(), 3);
    const boxes = await rows.evaluateAll((nodes) =>
      nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, bottom: r.bottom };
      }),
    );
    assert.ok(
      boxes.every(
        (box) =>
          Math.abs(box.x - boxes[0].x) <= 1 &&
          Math.abs(box.width - boxes[0].width) <= 1,
      ),
      "Directory rows share one full-width track",
    );
    assert.ok(
      boxes.slice(1).every((box, index) => box.y >= boxes[index].bottom - 1),
      "Directory is a vertical row layout",
    );
  } else if (
    layout === "guided" &&
    (await study(page).getAttribute("data-step")) !== "product"
  ) {
    assert.equal(
      await page.locator("[data-cx-layout-guided] img").count(),
      0,
      "The Guided application stage focuses on one decision without imagery",
    );
  }
}

try {
  for (const [index, profile] of profiles.entries()) {
    const match = /^(\d+)-(light|dark)-(en|ja|zh-Hans|zh-Hant)$/.exec(profile);
    assert.ok(match, `Unsupported profile: ${profile}`);
    const [, rawWidth, tone, locale] = match;
    const width = Number(rawWidth);
    const test = await setup(width, tone, locale);
    const { page } = test;
    try {
      await page.goto(`${studyURL}?layout=invitation&tone=${tone}`, {
        waitUntil: "networkidle",
      });
      await step(page, "intro");
      await layoutShape(page, "invitation");
      await noOverflow(page, width);
      await sampleContext(page, locale);
      assert.equal(
        await page.locator("[data-cx-primary]").getAttribute("data-cx-primary"),
        "samples",
      );
      await firstScreen(page, "[data-cx-samples]");
      assert.equal(
        await page
          .locator(
            '[data-cx-layout-invitation] a[href="/shop#product-comparison"]',
          )
          .count(),
        1,
        "Invitation has a native link to the full Shop comparison",
      );
      await assertRange(page, locale);
      await capture(page, `${profile}-invitation`);
      await selectLayout(page, "directory");
      await layoutShape(page, "directory");
      await noOverflow(page, width);
      await firstScreen(page, "[data-cx-choice]");
      await capture(page, `${profile}-directory`);
      const exhaustive = locale === "en" && (width === 1440 || width === 390);
      const testedKeys = exhaustive ? keys : [keys[index % keys.length]];
      for (const key of testedKeys) {
        await choice(page, key).click();
        await assertProduct(page, key, locale, "samples", false);
        assert.equal(
          await page
            .locator("[data-cx-directory-row] [data-cx-product]")
            .count(),
          1,
          "Only one Directory row is expanded",
        );
        assert.equal(
          await choice(page, key).getAttribute("aria-expanded"),
          "true",
        );
        assert.equal(
          await choice(page, key).evaluate(
            (node) => node === document.activeElement,
          ),
          true,
          "Opening a Directory row retains focus on its toggle",
        );
        await assertProductImage(page, key, locale);
        await noOverflow(page, width);
        if (key === testedKeys.at(-1))
          await capture(page, `${profile}-directory-product`);
        await page.locator("[data-cx-back]").click();
        await step(page, "application");
        assert.equal(await page.locator("[data-cx-product]").count(), 0);
      }
      const lastTea = testedKeys.at(-1);
      await selectLayout(page, "guided");
      assert.equal(
        await study(page).getAttribute("data-selected"),
        lastTea,
        "Layout switching preserves tea",
      );
      await layoutShape(page, "guided");
      await noOverflow(page, width);
      await guidedChoices(page, locale, lastTea);
      await firstScreen(page, "[data-cx-choice]");
      foldMeasurements.push({
        profile,
        ...(await page
          .locator("[data-cx-guided-sample-entry] [data-cx-samples]")
          .evaluate((node) => ({
            sampleActionBottom: node.getBoundingClientRect().bottom,
            viewportHeight: innerHeight,
            choices: [...document.querySelectorAll("[data-cx-choice]")].map(
              (choice) => ({
                key: choice.getAttribute("data-cx-choice"),
                bottom: choice.getBoundingClientRect().bottom,
              }),
            ),
          }))),
      });
      await capture(page, `${profile}-guided-choice`);
      for (const key of testedKeys) {
        await choice(page, key).click();
        await assertProduct(page, key, locale);
        await guidedExplanation(page, key, locale);
        assert.equal(
          await page
            .locator("[data-cx-layout-guided] [data-product-application-image]")
            .count(),
          1,
        );
        await assertProductImage(page, key, locale);
        if (width <= 760) {
          const bounds = await page.evaluate(() => ({
            actions: document
              .querySelector("[data-cx-actions]")
              .getBoundingClientRect().bottom,
            image: document
              .querySelector(
                "[data-cx-layout-guided] [data-product-application-image]",
              )
              .getBoundingClientRect().top,
          }));
          assert.ok(
            bounds.actions <= bounds.image,
            "Guided mobile actions precede the selected photograph",
          );
        }
        await noOverflow(page, width);
        await capture(page, `${profile}-guided-${key}`);
        const originalURL = new URL(page.url());
        const alternate = tone === "light" ? "dark" : "light";
        await page.locator("[data-cx-tone]").selectOption(alternate);
        await eventually(
          async () =>
            (await study(page).getAttribute("data-tone")) === alternate,
          "Appearance changes in place",
        );
        for (const param of ["layout", "tea", "step"])
          assert.equal(
            new URL(page.url()).searchParams.get(param),
            originalURL.searchParams.get(param),
            `Tone preserves ${param}`,
          );
        assert.equal(new URL(page.url()).searchParams.has("intent"), false);
        await page.locator("[data-cx-tone]").selectOption(tone);
        await eventually(
          async () => (await study(page).getAttribute("data-tone")) === tone,
          "Appearance restores in place",
        );
        await page.locator("[data-cx-back]").click();
        await step(page, "application");
        await guidedChoices(page, locale, key);
        await eventually(
          () =>
            page
              .locator("#cx-heading")
              .evaluate((node) => node === document.activeElement),
          "Change application returns focus to the question",
        );
      }
      await page.locator("[data-cx-restart]").click();
      await step(page, "application");
      await guidedChoices(page, locale, testedKeys.at(-1));
      await selectLayout(page, "invitation");
      await layoutShape(page, "invitation");
      clean(test);
      console.log(
        `${profile}: three whole-page layouts, images, product priority, Back, restart, tone and no overflow passed`,
      );
    } catch (error) {
      await capture(page, `failure-${profile}`);
      console.error({
        profile,
        url: page.url(),
        state: await study(page).evaluate((node) => ({ ...node.dataset })),
        errors: test.errors,
        writes: test.writes,
      });
      throw error;
    } finally {
      test.release();
      await test.context.close();
    }
  }

  await writeFile(
    resolve(evidence, "guided-first-screen.json"),
    JSON.stringify(foldMeasurements, null, 2),
  );

  if (process.env.HERO_CX_STUDY_SKIP_EDGE !== "1") {
    const hydration = await setup(360, "light", "en", { holdScripts: true });
    try {
      const { page } = hydration;
      await page.goto(`${studyURL}?layout=guided&tone=light`, {
        waitUntil: "commit",
      });
      await study(page).waitFor();
      assert.equal(await study(page).getAttribute("data-layout"), "guided");
      assert.equal(await study(page).getAttribute("data-step"), "application");
      await eventually(
        async () => hydration.scriptRequests() > 0,
        "Client scripts are held before hydration",
      );
      assert.equal(await page.locator("[data-cx-layout]").isDisabled(), true);
      assert.equal(await page.locator("[data-cx-restart]").isDisabled(), true);
      for (const key of keys)
        assert.equal(await choice(page, key).isDisabled(), true);
      const primary = page.locator("[data-cx-samples]");
      assert.equal(await primary.getAttribute("aria-disabled"), null);
      await primary.click({ noWaitAfter: true });
      await eventually(
        async () => new URL(page.url()).pathname === "/samples",
        "The native Sample Set link works before hydration",
      );
      hydration.releaseScripts();
      await page.locator("[data-samples-page]").waitFor();
      clean(hydration);
      console.log(
        "Before hydration, JavaScript controls are honestly disabled while the native Sample Set link works",
      );
    } finally {
      hydration.release();
      await hydration.context.close();
    }

    for (const width of [1440, 390, 320]) {
      const photos = await setup(width, "dark", "en");
      try {
        const { page } = photos;
        await page.goto(`${studyURL}?layout=directory&tone=dark`, {
          waitUntil: "networkidle",
        });
        const tapPhoto = async (key) => {
          await assertProductImage(page, key, "en");
          const image = page.locator(
            `[data-product-application-image="${key}"] img`,
          );
          await image.scrollIntoViewIfNeeded();
          const bounds = await image.boundingBox();
          assert.ok(bounds);
          const x = bounds.x + bounds.width / 2;
          const y = bounds.y + bounds.height / 2;
          if (width < 500) await page.touchscreen.tap(x, y);
          else await page.mouse.click(x, y);
        };
        await tapPhoto("barista");
        await assertProduct(page, "barista", "en", "samples", false);
        await tapPhoto("barista");
        await step(page, "application");
        assert.equal(await page.locator("[data-cx-product]").count(), 0);
        await tapPhoto("barista");
        await assertProduct(page, "barista", "en", "samples", false);
        await noOverflow(page, width);
        await page.locator("[data-cx-samples]").click();
        await page.locator("[data-samples-page]").waitFor();
        await page.goBack();
        await assertProduct(page, "barista", "en", "samples", false);
        await page.locator("[data-cx-one-kilogram]").click();
        await page
          .locator(`[data-retail-product="${cartProduct.handle}"]`)
          .waitFor();
        assert.equal(new URL(page.url()).search, "?format=1kg");
        await page.goBack();
        await assertProduct(page, "barista", "en", "samples", false);
        await capture(page, `${width}-dark-en-directory-photo-target`);
        clean(photos);
        console.log(
          `${width}px Directory photograph activates one row toggle; expanded Sample Set/1kg links navigate independently`,
        );
      } finally {
        photos.release();
        await photos.context.close();
      }
    }

    const navigation = await setup(1440, "dark", "en");
    try {
      const { page } = navigation;
      await page.goto(`${studyURL}?layout=guided`, {
        waitUntil: "networkidle",
      });
      await step(page, "application");
      assert.equal(await study(page).getAttribute("data-layout"), "guided");
      await guidedChoices(page, "en");
      for (const [flow, layout] of [
        ["samples", "invitation"],
        ["application", "directory"],
        ["guided", "guided"],
      ]) {
        await page.goto(`${studyURL}?flow=${flow}`, {
          waitUntil: "networkidle",
        });
        assert.equal(
          await study(page).getAttribute("data-layout"),
          layout,
          "Legacy flow bookmarks map to the corresponding whole-page layout",
        );
        await step(page, startStep[layout]);
      }
      await page.goto(
        `${studyURL}?layout=guided&tone=light&tea=barista&step=product&intent=reorder`,
        { waitUntil: "networkidle" },
      );
      await assertProduct(page, "barista", "en", "samples", false);
      await guidedExplanation(page, "barista", "en");
      await page.locator("[data-cx-tone]").selectOption("dark");
      await eventually(
        async () => !new URL(page.url()).searchParams.has("intent"),
        "A legacy reorder intent is removed on interaction",
      );
      await page.reload({ waitUntil: "networkidle" });
      await assertProduct(page, "barista", "en", "samples", false);
      for (const key of keys) {
        await page.goto(`${studyURL}?layout=guided&tone=dark`, {
          waitUntil: "networkidle",
        });
        await step(page, "application");
        await choice(page, key).focus();
        await page.keyboard.press("Enter");
        await assertProduct(page, key, "en");
        const product = SAMPLE_SET_CONTENTS.find((item) => item.key === key);
        await page.locator("[data-cx-one-kilogram]").click();
        await page
          .locator(`[data-retail-product="${product.productHandle}"]`)
          .waitFor();
        assert.equal(
          `${new URL(page.url()).pathname}${new URL(page.url()).search}`,
          oneKilogramProductUrl(product.productHandle),
        );
        await page
          .getByRole("button", { name: "Open cart, 2 items", exact: true })
          .click();
        const dialog = page.locator("dialog[open]");
        await dialog.waitFor();
        assert.ok((await dialog.innerText()).includes("¥14,000"));
        await dialog
          .getByRole("button", { name: "Close cart", exact: true })
          .click();
        await page.goBack();
        await assertProduct(page, key, "en", "samples", false);
        assert.equal(await study(page).getAttribute("data-layout"), "guided");
        await page.locator("[data-cx-back]").click();
        await step(page, "application");
        await guidedChoices(page, "en", key);
        await page.reload({ waitUntil: "networkidle" });
        await guidedChoices(page, "en", key);
      }
      clean(navigation);
      console.log(
        "Invalid and legacy URLs, deep links, reload, keyboard, exact three-product 1kg destinations and cart-preserving browser Back passed",
      );
    } finally {
      navigation.release();
      await navigation.context.close();
    }

    for (const layout of layouts) {
      const held = await setup(360, "light", "en", {
        holdImages: true,
        holdDestination: true,
      });
      try {
        const { page } = held;
        await page.goto(`${studyURL}?layout=${layout}&tone=light`, {
          waitUntil: "domcontentloaded",
        });
        await step(page, startStep[layout]);
        if (layout === "invitation") {
          await eventually(
            async () => held.imageRequests() > 0,
            "Invitation image is held pending",
          );
          await firstScreen(page, "[data-cx-samples]");
        } else {
          await choice(page, "barista").click();
          await assertProduct(
            page,
            "barista",
            "en",
            "samples",
            layout === "guided",
          );
          await eventually(
            async () => held.imageRequests() > 0,
            "Application imagery is held pending",
          );
        }
        const primary = page.locator("[data-cx-primary]");
        assert.equal(await primary.getAttribute("aria-disabled"), null);
        await primary.click();
        await page.locator("[data-samples-page]").waitFor();
        clean(held);
        console.log(
          `${layout}: actions work while images and initial destination reads remain pending`,
        );
      } catch (error) {
        await capture(held.page, `failure-held-${layout}`);
        console.error({
          layout,
          url: held.page.url(),
          state: await study(held.page).evaluate((node) => ({
            ...node.dataset,
          })),
          controls: await study(held.page)
            .locator("button,select")
            .evaluateAll((nodes) =>
              nodes.map((node) => ({
                text: node.textContent,
                disabled: node.disabled,
              })),
            ),
          errors: held.errors,
        });
        throw error;
      } finally {
        held.release();
        await held.context.close();
      }
    }

    const failed = await setup(390, "dark", "en", { failImages: true });
    try {
      const { page } = failed;
      await page.goto(`${studyURL}?layout=invitation&tone=dark`, {
        waitUntil: "networkidle",
      });
      await step(page, "intro");
      await page
        .locator('[data-cx-range-image][data-image-state="failed"]')
        .waitFor();
      assert.equal(
        await page
          .locator("[data-cx-range-image] [data-product-application-fallback]")
          .isVisible(),
        true,
      );
      await firstScreen(page, "[data-cx-samples]");
      await capture(page, "390-dark-en-failed-invitation");
      await selectLayout(page, "directory");
      await eventually(
        async () =>
          (await page
            .locator(
              '[data-product-application-image][data-image-state="failed"]',
            )
            .count()) === 3,
        "Three Directory photographs fail independently",
      );
      for (const key of keys) {
        await choice(page, key).click();
        await assertProduct(page, key, "en", "samples", false);
        assert.equal(
          await page
            .locator(
              `[data-product-application-image="${key}"] [data-product-application-fallback]`,
            )
            .isVisible(),
          true,
        );
      }
      await capture(page, "390-dark-en-failed-directory");
      await selectLayout(page, "guided");
      await choice(page, "culinary").click();
      await assertProduct(page, "culinary", "en");
      await page
        .locator(
          '[data-product-application-image="culinary"][data-image-state="failed"]',
        )
        .waitFor();
      await capture(page, "390-dark-en-failed-guided");
      clean(failed);
      console.log(
        "Failed application photography preserves product identities, readable fallbacks and navigation",
      );
    } finally {
      failed.release();
      await failed.context.close();
    }

    const locked = await setup(390, "light", "en", { holdMutation: true });
    try {
      const { page } = locked;
      await page.goto(`${studyURL}?layout=guided&tone=light`, {
        waitUntil: "networkidle",
      });
      await page.locator("[data-cx-cart]").click();
      const dialog = page.locator("dialog[open]");
      await dialog
        .getByRole("button", { name: /Increase .* quantity/ })
        .click();
      await eventually(
        async () => locked.simulatedWrites.length === 1,
        "One cart mutation is intercepted locally",
      );
      assert.deepEqual(locked.simulatedWrites, [
        { action: "update", lineKey: "retained-barista", quantity: 3 },
      ]);
      await dialog
        .getByRole("button", { name: "Close cart", exact: true })
        .click();
      assert.equal(await page.locator("[data-cx-layout]").isDisabled(), true);
      for (const key of keys)
        assert.equal(await choice(page, key).isDisabled(), true);
      assert.equal(
        await page.locator("[data-cx-samples]").getAttribute("aria-disabled"),
        "true",
      );
      const before = page.url();
      await page.locator("[data-cx-samples]").dispatchEvent("click");
      await choice(page, "barista").dispatchEvent("click");
      assert.equal(
        page.url(),
        before,
        "A pending mutation prevents native navigation",
      );
      locked.releaseMutation();
      await eventually(
        async () => !(await page.locator("[data-cx-layout]").isDisabled()),
        "Rejected fixture mutation releases navigation lock",
      );
      await page.locator("[data-cx-samples]").click();
      await page.locator("[data-samples-page]").waitFor();
      clean(locked);
      console.log(
        "A locally intercepted cart write locks study navigation until rejection; no mutation reaches a server",
      );
    } finally {
      locked.release();
      await locked.context.close();
    }

    for (const [width, tone] of [
      [1440, "light"],
      [390, "dark"],
    ]) {
      const canonical = await setup(width, tone, "en");
      try {
        const { page } = canonical;
        await page.goto(baseURL, { waitUntil: "networkidle" });
        assert.equal(await study(page).count(), 0);
        assert.equal(
          await page
            .getByRole("heading", {
              name: "Matcha for the way you make it.",
              exact: true,
            })
            .isVisible(),
          true,
        );
        assert.equal(
          await page
            .locator('[data-silver-bag][data-appearance="hero"]')
            .isVisible(),
          true,
        );
        await capture(page, `canonical-${width}-${tone}-en`);
        clean(canonical);
      } finally {
        canonical.release();
        await canonical.context.close();
      }
    }
    console.log("Canonical homepage remains independent");
  }
} finally {
  await browser.close();
}
