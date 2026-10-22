/* Canonical About navigation and localization. Commerce reads are mocked;
 * every external request and every write is blocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { translate } from "../src/lib/i18n/index.ts";
import { localizedMetadata } from "../src/lib/i18n/metadata.ts";
import {
  aboutFarmPhotographs,
  aboutFieldNotes,
  aboutPhotoStories,
} from "../src/lib/about-photo-stories.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.ABOUT_PAGE_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const destination = { countryCode: "US", currency: "USD" };
const evidence =
  process.env.ABOUT_PAGE_EVIDENCE ?? ".local/about-popup-motion-0158/browser";
const filter = process.env.ABOUT_PAGE_FILTER;
const locales = ["en", "ja", "zh-Hans", "zh-Hant"];
const products = [
  ["culinary", "jmm-storefront-test-matcha", "Culinary Matcha", "UJI-01"],
  [
    "barista",
    "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
    "Barista Matcha",
    "UJI-00",
  ],
  [
    "ceremonial",
    "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
    "Ceremonial Matcha",
    "WZKA-00",
  ],
].map(([id, handle, title, productCode], index) => ({
  id,
  handle,
  title,
  productCode,
  description: "Isolated About navigation fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
      title: "1 kg",
      available: true,
      priceMinor: 2400,
      currency: "USD",
      options: [{ name: "Format", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
    {
      id: `v1_${String.fromCharCode(100 + index).repeat(43)}`,
      title: "200 g",
      available: true,
      priceMinor: 700,
      currency: "USD",
      options: [{ name: "Format", value: "200 g" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));
const cart = {
  destination,
  totalQuantity: 1,
  subtotalLabel: "USD 24.00",
  totalLabel: "USD 24.00",
  lines: [
    {
      lineKey: `v1_${"b".repeat(43)}`,
      productHandle: "test-only-about-fixture",
      productTitle: "About selection",
      variantTitle: "1 kg",
      options: [],
      quantity: 1,
      unitPriceLabel: "USD 24.00",
      lineTotalLabel: "USD 24.00",
      purchaseState: "purchasable",
      quantityRule: { minimum: 1, maximum: 4, increment: 1 },
      canUpdateQuantity: true,
      canRemove: true,
      image: null,
    },
  ],
};
const mainCopy = [
  "About ATOMA",
  "Our approach to matcha",
  "Matcha,",
  "in detail.",
  "Selected for its flavour, texture and application.",
  "Connected to the people and places behind it.",
  "Our approach",
  "Character",
  "Application",
  "Origin",
  "Understand the matcha itself. Its flavour, its texture, and how it behaves in preparation.",
  "Selected for a specific use — from tea served with water to lattes and recipes.",
  "Look closer at place, process and people. The material becomes more specific as you go deeper.",
  "Matcha, selected and explained.",
  "About the company",
  "ATOMA helps businesses find matcha suited to what they make. We bring product selection, practical guidance and relationships with tea-growing communities into one connected approach.",
  "From tasting a sample to choosing matcha for regular use, we help buyers understand its character, its preparation and the people and processes behind it.",
  "Connections",
  "Understanding is shared.",
  "Matcha connects the people who grow it, process it and prepare it. We connect buyers with each step, building understanding and relationships from the growing place to the final preparation.",
  "Growing",
  "Working with tea",
  "Preparing",
  "People & place",
  "Our time in the community is one story. The origin of each matcha is recorded with the product.",
  "Community",
  "Stories from the places and communities we work with.",
  "Read story",
  "Find your matcha.",
  "Ceremonial",
  "Barista",
  "Culinary",
  "Explore the selection",
  aboutFarmPhotographs.contours.caption,
  ...aboutPhotoStories.flatMap((story) => [
    story.category,
    story.title,
    story.introduction,
  ]),
];

function fieldRecord(story) {
  return story.id === "harvest"
    ? {
        notes: [aboutFieldNotes.place, aboutFieldNotes.harvest],
        ids: ["place", "harvest"],
        photographs: story.photographs,
      }
    : {
        notes: [aboutFieldNotes.technology],
        ids: ["technology"],
        photographs: story.photographs,
      };
}

async function eventually(check, message) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
await mkdir(evidence, { recursive: true });
let activePage;
let activeName;
let passed = 0;

async function setup(width, tone, locale = "en") {
  const context = await browser.newContext({
    viewport: { width, height: width === 320 ? 740 : 900 },
    reducedMotion: "reduce",
    hasTouch: width === 320,
    isMobile: width === 320,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: locale, url: baseURL },
  ]);
  const errors = [];
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      errors.push("Unexpected external request or write");
      return route.abort();
    }
    if (url.pathname === "/api/destination")
      return route.fulfill({
        json: {
          kind: "ready",
          preference: {
            countryCode: destination.countryCode,
            source: "manual",
          },
          destination,
          countries: ["US", "SG"],
          reviewRequired: false,
        },
      });
    if (url.pathname === "/api/cart")
      return route.fulfill({
        json: { kind: "ready", cart, destination, checkoutEnabled: false },
      });
    if (url.pathname === "/api/catalog")
      return route.fulfill({
        json: {
          status: "ready",
          products,
          destination,
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

function cartButton(page, locale = "en") {
  return page.getByRole("button", {
    name: translate(locale, "Open cart, {count} item", { count: 1 }),
    exact: true,
  });
}

async function fit(page, scope = page.locator("main#about-top")) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "The page has no horizontal overflow",
  );
  assert.equal(
    await scope.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    true,
    "The reading surface has no horizontal overflow",
  );
}

async function imagesReady(scope, preserveComposition = false) {
  const images = scope.locator("img");
  assert.ok(await images.count(), "The reading surface includes photography");
  let visibleCount = 0;
  for (const image of await images.all()) {
    if (!(await image.isVisible())) continue;
    visibleCount++;
    await image.scrollIntoViewIfNeeded();
    await eventually(
      () => image.evaluate((node) => node.complete && node.naturalWidth > 0),
      "The photograph loads",
    );
    const decorative = await image.evaluate((node) =>
      Boolean(node.closest('[aria-hidden="true"]')),
    );
    if (decorative)
      assert.equal(
        await image.getAttribute("alt"),
        "",
        "Decorative previews do not repeat the story's alternative text",
      );
    else
      assert.ok(
        await image.getAttribute("alt"),
        "Photography has alternative text",
      );
    const source = await image.evaluate((node) => {
      const url = new URL(node.currentSrc);
      return url.searchParams.get("url") ?? url.pathname;
    });
    assert.ok(
      source.startsWith("/images/about/wazuka/") ||
        [
          "/images/matcha/tea-service.jpg",
          "/images/matcha/latte.jpg",
          "/images/matcha/culinary.jpg",
          "/images/samples/prepared-matcha.webp",
          "/images/about/preparation-whisk.webp",
        ].includes(source),
      "About uses the existing material, selection and Wazuka field photographs",
    );
    if (preserveComposition)
      assert.equal(
        await image.evaluate((node) => {
          const box = node.getBoundingClientRect();
          return (
            Math.abs(
              box.width / box.height - node.naturalWidth / node.naturalHeight,
            ) < 0.01
          );
        }),
        true,
        "The photo essay preserves landscape and portrait compositions",
      );
  }
  assert.ok(visibleCount > 0, "Photography remains visible at this viewport");
}

function assertTranslated(text, sources, locale) {
  for (const source of sources) {
    const expected = translate(locale, source);
    if (locale !== "en")
      assert.notEqual(
        expected,
        source,
        `A translation is available for ${source}`,
      );
    assert.ok(
      text.includes(expected),
      `The page displays ${locale}: ${source}`,
    );
  }
}

function headingStyle(heading) {
  return heading.evaluate((node) => {
    const style = getComputedStyle(node);
    return Object.fromEntries(
      [
        "fontFamily",
        "fontSize",
        "fontWeight",
        "lineHeight",
        "letterSpacing",
        "textTransform",
      ].map((property) => [property, style[property]]),
    );
  });
}

function actionStyle(action) {
  return action.evaluate((node) => {
    const style = getComputedStyle(node);
    const svg = node.querySelector("svg");
    const icon = svg && getComputedStyle(svg);
    return {
      control: Object.fromEntries(
        [
          "minHeight",
          "paddingTop",
          "paddingRight",
          "paddingBottom",
          "paddingLeft",
          "borderRadius",
          "borderTopWidth",
          "borderRightWidth",
          "borderBottomWidth",
          "borderLeftWidth",
          "borderTopStyle",
          "borderRightStyle",
          "borderBottomStyle",
          "borderLeftStyle",
          "borderTopColor",
          "borderRightColor",
          "borderBottomColor",
          "borderLeftColor",
          "backgroundColor",
          "color",
          "fontFamily",
          "fontSize",
          "fontWeight",
          "lineHeight",
          "letterSpacing",
        ].map((property) => [property, style[property]]),
      ),
      icon: svg && {
        viewBox: svg.getAttribute("viewBox"),
        hidden: svg.getAttribute("aria-hidden"),
        width: icon.width,
        height: icon.height,
        stroke: icon.stroke,
        strokeWidth: icon.strokeWidth,
        fill: icon.fill,
        paths: [...svg.querySelectorAll("path")].map((path) =>
          path.getAttribute("d"),
        ),
      },
    };
  });
}

async function stylesheetRestoration(page, tone) {
  await page.goto(baseURL);
  const hero = page.locator('[data-brand-part="hero"]');
  await hero.waitFor();
  assert.equal(await hero.getAttribute("data-tone"), tone);
  await eventually(
    async () => !(await hero.getAttribute("data-hero-loading")),
    "The canonical homepage is ready for its style reference",
  );
  await page.evaluate(() => document.fonts.ready);
  const introduction = hero.locator('[data-direction="specimen"]');
  const homeHeading = await headingStyle(introduction.locator("h1"));
  const homeAction = await actionStyle(
    introduction.locator('button[aria-controls="home-selection"]'),
  );
  assert.ok(homeAction.icon, "The canonical action includes its SVG arrow");

  await page.goto(`${baseURL}/shop`);
  const shop = page.locator("[data-sample-entry-shop]");
  await shop.waitFor();
  assert.equal(await shop.getAttribute("data-tone"), tone);
  await page.evaluate(() => document.fonts.ready);
  const shopHeading = await headingStyle(shop.locator("h1"));

  await page.goto(`${baseURL}/about`);
  const about = page.locator("[data-about-page]");
  await about.waitFor();
  assert.equal(await about.getAttribute("data-tone"), tone);
  await page.evaluate(() => document.fonts.ready);
  const aboutHeading = await headingStyle(about.locator("h1"));
  const { fontFamily: homeFamily, ...homeTitleMetrics } = homeHeading;
  const { fontFamily: aboutFamily, ...aboutTitleMetrics } = aboutHeading;
  assert.ok(homeFamily, "The reference heading has a computed font family");
  assert.deepEqual(
    aboutTitleMetrics,
    homeTitleMetrics,
    "About preserves the canonical homepage heading size, weight, leading and tracking at this viewport",
  );
  assert.equal(
    aboutFamily,
    homeAction.control.fontFamily,
    "About retains the established IBM mono family",
  );
  for (const selector of [
    '[data-about-cover] a[href="#about-purpose"]',
    '[data-about-selection-invitation] a[href="/wholesale"]',
  ]) {
    const action = about.locator(selector);
    assert.equal(await action.count(), 1);
    assert.deepEqual(
      await actionStyle(action),
      homeAction,
      `About uses the canonical homepage action and SVG: ${selector}`,
    );
  }
  await fit(page);
  if ([1440, 320].includes(page.viewportSize().width) && tone === "light") {
    await eventually(
      () =>
        about
          .locator("[data-about-opening-photographs] img")
          .evaluate((node) => node.complete && node.naturalWidth > 0),
      "The opening photograph is ready for the style-correction record",
    );
    await page.screenshot({
      path: resolve(evidence, `${activeName}-about-opening.png`),
      animations: "disabled",
    });
  }

  await page.goto(`${baseURL}/samples`);
  const samples = page.locator("[data-samples-page]");
  await samples.waitFor();
  assert.equal(await samples.getAttribute("data-tone"), tone);
  await page.evaluate(() => document.fonts.ready);
  assert.deepEqual(
    await headingStyle(samples.locator("h1")),
    shopHeading,
    "Samples preserves the canonical Shop heading size, weight, leading and tracking at this viewport",
  );
  for (const selector of [
    'a[href="#samples-contents"]',
    'section[aria-labelledby="samples-next"] a[href="/shop"]',
  ]) {
    const action = samples.locator(selector);
    await action.waitFor();
    assert.deepEqual(
      await actionStyle(action),
      homeAction,
      `Samples uses the canonical homepage action and SVG: ${selector}`,
    );
  }
  await fit(page, samples);
  console.log(
    `${activeName}: About/home ${aboutHeading.fontSize}, Samples/Shop ${shopHeading.fontSize}; heading leading/tracking and four homepage-style actions/SVGs match`,
  );
}

async function canonicalPage(page, locale, tone) {
  const root = page.locator("[data-about-page]");
  const main = page.locator("main#about-top");
  await root.waitFor();
  assert.equal(await root.getAttribute("data-tone"), tone);
  assert.equal(await main.getAttribute("lang"), locale);
  assert.equal(await page.locator("html").getAttribute("lang"), locale);
  assert.equal(await main.getByRole("heading", { level: 1 }).count(), 1);
  assert.equal(
    await root.locator('aside[aria-label="Design review notes"]').count(),
    0,
  );
  assert.equal(await root.locator('a[href*="about-exploration"]').count(), 0);
  assert.equal(
    await root
      .locator('header a[data-nav-action="about"]')
      .first()
      .getAttribute("aria-current"),
    "page",
  );
  assert.equal(await page.locator('footer a[href="/about"]').count(), 1);
  assert.equal(await page.locator("dialog[open]").count(), 0);
  const metadata = localizedMetadata("about", locale);
  await eventually(
    async () => (await page.title()) === metadata.title,
    "Localized About title is applied",
  );
  assert.equal(
    await page.locator('meta[name="description"]').getAttribute("content"),
    metadata.description,
  );
  assertTranslated(await main.textContent(), mainCopy, locale);
  assert.equal(
    await main.locator("[data-about-field-note], [data-field-note]").count(),
    0,
    "Individual field observations belong to their separate entries",
  );
  const reading = await main.textContent();
  for (const note of Object.values(aboutFieldNotes))
    assert.ok(
      !reading.includes(translate(locale, note.text)),
      "About summarizes the collection rather than reproducing an entry",
    );
  assert.doesNotMatch(
    reading,
    /archive placeholder|new shoot to be added|photography to be added/i,
  );
  assert.doesNotMatch(reading, /\bGVJ\b/, "Canonical About introduces ATOMA");
  assert.deepEqual(
    await main
      .locator("article[data-about-story]")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-about-story")),
      ),
    ["harvest", "technology"],
    "The harvest is the first entry in the Community collection",
  );
  assert.equal(
    await main
      .locator("[data-about-opening-photographs] img")
      .getAttribute("alt"),
    translate(locale, aboutFarmPhotographs.contours.alt),
    "About opens with the brand and a place photograph",
  );
  assert.equal(
    await main.locator("[data-about-opening-photographs] img").count(),
    1,
  );
  let previousBottom = 0;
  for (const id of [
    "about-purpose",
    "about-approach",
    "about-company",
    "about-community",
  ]) {
    const box = await main.locator(`#${id}`).evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return { top: rect.top + scrollY, bottom: rect.bottom + scrollY };
    });
    assert.ok(
      box.top >= previousBottom - 1,
      "About, approach and connections precede the Community collection",
    );
    previousBottom = box.bottom;
  }
  for (const story of aboutPhotoStories) {
    const link = main.locator(`article[data-about-story="${story.id}"] a`);
    assert.equal(await link.getAttribute("href"), `/field-notes/${story.slug}`);
    assert.ok((await link.getAttribute("aria-labelledby"))?.length);
    assert.equal(
      await link
        .getByText(translate(locale, "Read story"), { exact: true })
        .count(),
      1,
      "Each whole-card link includes its localized reading invitation",
    );
    assert.equal(
      await link.evaluate((node) => node.getBoundingClientRect().height >= 44),
      true,
      "Each entry is a native link with a usable touch target",
    );
    assert.deepEqual(
      await link.locator("img").evaluateAll((nodes) =>
        nodes.map((node) => {
          const url = new URL(node.currentSrc || node.src);
          return {
            src: url.searchParams.get("url") ?? url.pathname,
            alt: node.alt,
          };
        }),
      ),
      [
        {
          src: story.photographs[0].src,
          alt: translate(locale, story.photographs[0].alt),
        },
      ],
      "Each Community cover uses the first photograph from its shared story",
    );
  }
  await imagesReady(main);
  assert.equal(
    await main
      .locator('img[src*="matcha-macro"], img[srcset*="matcha-macro"]')
      .count(),
    0,
    "The removed material-study photographs stay outside canonical About",
  );
  for (const [id, photograph] of [
    ["character", aboutFarmPhotographs.leaves],
    [
      "application",
      {
        src: "/images/about/preparation-whisk.webp",
        alt: "A person holding a tea bowl with a bamboo whisk and tea scoop.",
      },
    ],
    ["origin", aboutFarmPhotographs.landscape],
  ]) {
    for (const [selector, alt] of [
      [`[data-approach-step="${id}"] img`, translate(locale, photograph.alt)],
      [`[data-approach-photo="${id}"] img`, ""],
    ])
      assert.deepEqual(
        await main.locator(selector).evaluateAll((nodes) =>
          nodes.map((node) => {
            const url = new URL(node.currentSrc || node.src);
            return {
              src: url.searchParams.get("url") ?? url.pathname,
              alt: node.alt,
            };
          }),
        ),
        [{ src: photograph.src, alt }],
        `${id} uses its selected photograph in both inline reading and the decorative scroll stage`,
      );
  }
  assert.deepEqual(
    await main.locator("[data-about-connections] img").evaluateAll((nodes) =>
      nodes.map((node) => {
        const url = new URL(node.currentSrc || node.src);
        return {
          src: url.searchParams.get("url") ?? url.pathname,
          alt: node.alt,
        };
      }),
    ),
    [
      aboutFarmPhotographs.leaves,
      aboutFarmPhotographs.team,
      {
        src: "/images/samples/prepared-matcha.webp",
        alt: "A bowl of prepared matcha on a woven mat.",
      },
    ].map(({ src, alt }) => ({ src, alt: translate(locale, alt) })),
    "Connections follows growing, working with tea and preparation with translated alternatives",
  );
  await fit(page);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: resolve(evidence, `${activeName}-full.png`),
    fullPage: true,
    animations: "disabled",
  });
}

async function localizedStories(page, locale, tone) {
  for (const story of aboutPhotoStories) {
    const record = fieldRecord(story);
    const trigger = page.locator(
      `main#about-top a[href="/field-notes/${story.slug}"]`,
    );
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    const before = { url: page.url(), top: await page.evaluate(() => scrollY) };
    assert.equal(await trigger.getAttribute("aria-haspopup"), "dialog");
    await trigger.press("Enter");
    const reader = page.locator("[data-about-field-notes][open]");
    await reader.waitFor();
    await eventually(
      () => new URL(page.url()).hash === `#field-note=${story.slug}`,
      "The entry opens in About history",
    );
    assert.equal(new URL(page.url()).pathname, "/about");
    assert.equal(await page.locator("[data-about-page]").count(), 1);
    assert.equal(await reader.getAttribute("data-tone"), tone);
    assert.equal(await reader.getAttribute("lang"), locale);
    assert.equal(
      await reader.getAttribute("data-presentation"),
      "field-record",
    );
    assert.equal(
      await reader.locator(`article[data-about-story="${story.id}"]`).count(),
      1,
    );
    assert.equal(
      await reader
        .getByRole("heading", {
          level: 2,
          name: translate(locale, story.title),
          exact: true,
        })
        .count(),
      1,
    );
    assertTranslated(
      await reader.textContent(),
      [
        "ATOMA / Community",
        "Back to About",
        story.title,
        story.category,
        story.introduction,
        "An ongoing record",
        "Our time in the community is one story. The origin of each matcha is recorded with the product.",
        ...record.notes.flatMap((note) => [
          note.category,
          note.text,
          ...("title" in note ? [note.title] : []),
        ]),
        ...record.photographs.map((photo) => photo.caption),
      ],
      locale,
    );
    assert.deepEqual(
      await reader
        .locator("[data-field-note]")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("data-field-note")),
        ),
      record.ids,
    );
    assert.deepEqual(
      await reader.locator("img").evaluateAll((nodes) =>
        nodes.map((node) => {
          const url = new URL(node.currentSrc || node.src);
          return {
            src: url.searchParams.get("url") ?? url.pathname,
            alt: node.alt,
          };
        }),
      ),
      record.photographs.map(({ src, alt }) => ({
        src,
        alt: translate(locale, alt),
      })),
      "The localized popup preserves its shared photo sequence and descriptive alternatives",
    );
    const metadata = localizedMetadata("about", locale);
    assert.equal(
      await page.title(),
      metadata.title,
      "Opening a popup retains About metadata",
    );
    assert.equal(
      await page.locator('meta[name="description"]').getAttribute("content"),
      metadata.description,
    );
    await imagesReady(reader, true);
    await fit(page, reader);
    const box = await reader.boundingBox();
    const viewport = page.viewportSize();
    assert.ok(
      box.x >= 10 &&
        box.y >= 10 &&
        box.x + box.width <= viewport.width - 10 &&
        box.y + box.height <= viewport.height - 10,
      "Translated popup content remains inset at this viewport",
    );
    assert.equal(
      await page.evaluate(() => scrollY),
      before.top,
      "Popup reading preserves About's position",
    );
    await reader.evaluate((node) =>
      node.scrollTo({ top: 0, behavior: "instant" }),
    );
    await page.screenshot({
      path: resolve(evidence, `${activeName}-${story.id}-popup.png`),
      animations: "disabled",
    });
    if (story.id === "harvest") await page.goBack();
    else
      await reader
        .getByRole("button", {
          name: translate(locale, "Back to About"),
          exact: true,
        })
        .click();
    await reader.waitFor({ state: "hidden" });
    await eventually(
      () => page.url() === before.url,
      "Closing a localized field note restores the About URL",
    );
    await eventually(
      () => trigger.evaluate((node) => node === document.activeElement),
      "Closing a localized field note restores its trigger focus",
    );
    await eventually(
      async () =>
        Math.abs((await page.evaluate(() => scrollY)) - before.top) <= 2,
      "Closing a localized field note restores About's reading position",
    );
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
  }
}

async function aboutLink(page) {
  let link = page.locator('header a[data-nav-action="about"]:visible');
  if (!(await link.count())) {
    await page.locator("summary[data-nav-summary]:visible").click();
    link = page.locator('header a[data-nav-action="about"]:visible');
  }
  assert.equal(await link.getAttribute("href"), "/about");
  await link.focus();
  await link.press("Enter");
  await page.waitForURL((url) => url.pathname === "/about");
  await page.locator("[data-about-page]").waitFor();
  assert.equal(await page.locator("dialog[open]").count(), 0);
}

async function checkCart(page) {
  await cartButton(page).click();
  const drawer = page.locator("dialog[open]");
  await drawer
    .getByRole("heading", { name: "About selection", exact: true })
    .waitFor();
  assert.equal(
    await drawer
      .getByLabel("About selection quantity", { exact: true })
      .innerText(),
    "1",
  );
  await drawer.getByRole("button", { name: "Close cart", exact: true }).click();
  await drawer.waitFor({ state: "hidden" });
}

async function openAboutOrigins(page, entrance) {
  if (entrance === "header") {
    let link = page.locator('header a[data-nav-action="origins"]:visible');
    if (!(await link.count())) {
      await page.locator("summary[data-nav-summary]:visible").click();
      link = page.locator('header a[data-nav-action="origins"]:visible');
    }
    await link.click();
  } else {
    await page
      .locator("footer")
      .getByRole("button", { name: /Growing places/ })
      .click();
  }
  const reader = page.locator("[data-origins-dialog][open]");
  await reader.waitFor();
  await reader
    .getByRole("button", { name: "Back to About", exact: true })
    .waitFor();
  assert.equal(
    await reader.getByRole("button", { name: /Return to .*Matcha/ }).count(),
    0,
    "Origins opened from About does not show the previous product return label",
  );
  return reader;
}

async function aboutOriginsRoundTrip(page, entrance) {
  const before = page.url();
  const reader = await openAboutOrigins(page, entrance);
  if (entrance === "header")
    await reader
      .getByRole("button", { name: "Back to About", exact: true })
      .click();
  else await page.keyboard.press("Escape");
  await reader.waitFor({ state: "hidden" });
  await eventually(
    () => page.url() === before,
    "Origins returns to the About URL",
  );
  await page.locator("[data-about-page]").waitFor();
}

async function navigation(page, context, tone) {
  await page.goto(`${baseURL}/`);
  await cartButton(page).waitFor();
  await page
    .getByRole("button", {
      name: "Explore matcha from the silver bag",
      exact: true,
    })
    .click();
  const selection = page.locator(
    '[data-homepage-product-choice="barista"]:not(:disabled)',
  );
  await selection.waitFor();
  await selection.click();
  await eventually(
    async () => (await selection.getAttribute("aria-pressed")) === "true",
    "The homepage selects the requested matcha",
  );
  const shopTab = page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name: "Shop", exact: true });
  await shopTab.click();
  const order = page.locator("[data-shop-exploration]");
  const format = order.getByRole("combobox", { name: "Format", exact: true });
  const formatId = products[1].variants[1].id;
  await format.selectOption(formatId);
  await order
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  assert.equal(
    await order.getByLabel("Quantity", { exact: true }).innerText(),
    "2",
  );
  await aboutLink(page);
  assert.equal(
    await page.locator("[data-about-page]").getAttribute("data-tone"),
    tone,
  );
  await checkCart(page);
  await aboutOriginsRoundTrip(page, "header");
  await aboutOriginsRoundTrip(page, "footer");
  await page.goBack();
  await selection.waitFor();
  assert.equal(
    await selection.getAttribute("aria-pressed"),
    "true",
    "Browser Back preserves the selected homepage matcha",
  );
  assert.equal(
    await shopTab.getAttribute("aria-pressed"),
    "true",
    "Browser Back restores the Shop information tab",
  );
  assert.equal(
    await format.inputValue(),
    formatId,
    "Browser Back restores the selected format",
  );
  assert.equal(
    await order.getByLabel("Quantity", { exact: true }).innerText(),
    "2",
    "Browser Back restores the selected quantity",
  );
  await checkCart(page);
  assert.equal(
    await page.locator('footer a[href="/about"]').getAttribute("href"),
    "/about",
  );

  await page.locator('footer a[href="/wholesale"]').click();
  await page.waitForURL((url) => url.pathname === "/wholesale");
  await cartButton(page).waitFor();
  await aboutLink(page);
  await checkCart(page);
  await page.goBack();
  await page.waitForURL((url) => url.pathname === "/wholesale");
  await checkCart(page);
  const footer = page.locator('footer a[href="/about"]');
  await footer.click();
  await page.waitForURL((url) => url.pathname === "/about");
  await page.locator("[data-about-page]").waitFor();
  assert.equal(
    await page.locator("[data-about-page]").getAttribute("data-tone"),
    tone,
  );
  assert.equal(
    (await context.cookies()).find((cookie) => cookie.name === "atoma-theme")
      ?.value,
    tone,
  );
  const origins = await openAboutOrigins(page, "header");
  await origins
    .getByRole("searchbox", { name: "Find a place", exact: true })
    .fill("Wazuka");
  await origins.locator('[data-origin-place="wazuka"]').click();
  const explicitHandle = products[2].handle;
  await origins.locator(`a[href="/?matcha=${explicitHandle}"]`).click();
  await page.waitForURL(
    (url) =>
      url.pathname === "/" && url.searchParams.get("matcha") === explicitHandle,
  );
  await page
    .locator('[data-homepage-product-choice="ceremonial"]:not(:disabled)')
    .waitFor();
  assert.equal(
    await page
      .locator('[data-homepage-product-choice="ceremonial"]')
      .getAttribute("aria-pressed"),
    "true",
    "An explicit matcha link overrides the remembered homepage product",
  );
  await checkCart(page);
  await page.locator("header [data-nav-brand]").click();
  await page.waitForURL((url) => url.pathname === "/" && !url.search);
  await eventually(
    async () =>
      (await page
        .locator('[data-homepage-product-choice="ceremonial"]')
        .getAttribute("aria-pressed")) === "true",
    "Removing a direct-product query retains the current selection",
  );
}

async function fieldNoteOrigins(page) {
  for (const story of aboutPhotoStories) {
    await page.goto(`${baseURL}/field-notes/${story.slug}`);
    const root = page.locator(`[data-field-note-page="${story.id}"]`);
    await root.waitFor();
    await cartButton(page).waitFor();
    const previousTone = await root.getAttribute("data-tone");
    let theme = root.getByRole("switch", { name: "Dark mode", exact: true });
    const menu = root.locator("summary[data-nav-summary]");
    let openedMenu = false;
    if (!(await theme.isVisible())) {
      await menu.click();
      openedMenu = true;
      theme = root.getByRole("switch", {
        name: "Dark mode in menu",
        exact: true,
      });
    }
    await theme.focus();
    await theme.press("Space");
    const tone = previousTone === "light" ? "dark" : "light";
    await eventually(
      async () => (await root.getAttribute("data-tone")) === tone,
      "The field-note theme switches in place",
    );
    if (openedMenu) await menu.click();

    for (const entrance of ["header", "footer"]) {
      let trigger;
      if (entrance === "header") {
        trigger = page.locator('header a[data-nav-action="origins"]:visible');
        if (!(await trigger.count())) {
          await page.locator("summary[data-nav-summary]:visible").click();
          trigger = page.locator('header a[data-nav-action="origins"]:visible');
        }
      } else
        trigger = page
          .locator("footer")
          .getByRole("button", { name: /Growing places/ });
      await trigger.scrollIntoViewIfNeeded();
      await trigger.focus();
      const before = {
        url: page.url(),
        top: await page.evaluate(() => scrollY),
      };
      await trigger.press("Enter");
      const reader = page.locator("[data-origins-dialog][open]");
      await reader.waitFor();
      const back = reader.getByRole("button", {
        name: "Back to story",
        exact: true,
      });
      await back.waitFor();
      assert.equal(
        await reader
          .getByRole("button", { name: /Return to .*Matcha|Back to About/ })
          .count(),
        0,
        "Origins identifies the field-note return destination",
      );
      if (entrance === "header") await back.click();
      else await page.keyboard.press("Escape");
      await reader.waitFor({ state: "hidden" });
      await eventually(
        () => page.url() === before.url,
        "Origins returns to the same field-note URL",
      );
      await eventually(
        async () =>
          Math.abs((await page.evaluate(() => scrollY)) - before.top) <= 2,
        "Origins returns to the field-note reading position",
      );
      assert.equal(await root.getAttribute("data-tone"), tone);
      await fit(page, page.locator("main#field-note-top"));
    }
    const beforeHistory = page.url();
    await aboutLink(page);
    assert.equal(
      await page.locator("[data-about-page]").getAttribute("data-tone"),
      tone,
    );
    await page.goBack();
    await root.waitFor();
    assert.equal(page.url(), beforeHistory);
    assert.equal(
      await root.getAttribute("data-tone"),
      tone,
      "Browser Back retains the chosen field-note theme",
    );
  }
}

try {
  if (!filter || filter === "styles")
    for (const width of [1440, 1366, 675, 390, 320])
      for (const tone of ["light", "dark"]) {
        activeName = `${width}-${tone}-styles`;
        const { context, page, errors } = await setup(width, tone);
        await stylesheetRestoration(page, tone);
        assert.deepEqual(errors, []);
        await context.close();
        passed++;
      }
  for (const width of [1440, 320])
    for (const tone of ["light", "dark"]) {
      activeName = `${width}-${tone}-navigation`;
      if (
        !filter ||
        (filter !== "localization" && activeName.includes(filter))
      ) {
        const { context, page, errors } = await setup(width, tone);
        await navigation(page, context, tone);
        assert.deepEqual(errors, []);
        await context.close();
        passed++;
        console.log(
          `${activeName}: canonical header/footer, menu, Back, selection and cart passed`,
        );
      }
      for (const locale of locales) {
        activeName = `${width}-${tone}-${locale}`;
        if (filter && filter !== "localization" && !activeName.includes(filter))
          continue;
        const { context, page, errors } = await setup(width, tone, locale);
        await page.goto(`${baseURL}/about`);
        await canonicalPage(page, locale, tone);
        await localizedStories(page, locale, tone);
        const next = locales[(locales.indexOf(locale) + 1) % locales.length];
        await page
          .locator("[data-language-switcher]:visible")
          .first()
          .selectOption(next);
        await eventually(
          async () =>
            (await page.locator("main#about-top").getAttribute("lang")) ===
            next,
          "About switches language in place",
        );
        assertTranslated(
          await page.locator("main#about-top").textContent(),
          mainCopy,
          next,
        );
        await eventually(
          async () =>
            (await page.title()) === localizedMetadata("about", next).title,
          "In-place locale changes update About metadata",
        );
        assert.equal(new URL(page.url()).pathname, "/about");
        assert.equal(
          (await context.cookies()).find(
            (cookie) => cookie.name === "atoma-locale",
          )?.value,
          next,
        );
        assert.deepEqual(errors, []);
        await context.close();
        passed++;
        console.log(
          `${activeName}: localized About/popups, history return, metadata, images, fit and in-place language passed`,
        );
      }
    }
  if (!filter || filter === "field-note-origins") {
    for (const width of [1440, 320]) {
      activeName = `${width}-field-note-origins`;
      const { context, page, errors } = await setup(width, "light");
      await fieldNoteOrigins(page);
      assert.deepEqual(errors, []);
      await context.close();
      passed++;
      console.log(
        `${activeName}: both entries, header/footer Origins, return/scroll, theme and browser history passed`,
      );
    }
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
console.log(`${passed} canonical About adoption scenarios passed`);
