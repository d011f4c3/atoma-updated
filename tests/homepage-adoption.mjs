/* Homepage adoption keeps the approved concept and canonical commerce boundaries. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";
import { createHeroStudyFixture } from "./hero-cx-fixtures.mjs";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.NEW_HERO7_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.HOMEPAGE_ADOPTION_EVIDENCE ?? ".local/homepage-0252";
const header = (page) => page.locator("[data-new-hero7-header] header");
const panel = (page, key) =>
  page.locator(`[data-new-hero7-view="${key}"]:visible`);
async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}
async function ready(page, view) {
  await panel(page, view).waitFor();
  await page.locator("[data-hero-loader]").waitFor({ state: "detached" });
  await eventually(
    () => page.locator("footer [data-theme-switcher]").isEnabled(),
    "The adopted shell is hydrated",
  );
  await page.evaluate(() => document.fonts.ready);
}
async function rootLinks(page) {
  const links = {
    matcha: "/",
    shop: "/shop",
    samples: "/samples",
    origins: "/origins",
    about: "/about",
  };
  for (const [key, href] of Object.entries(links)) {
    assert.equal(
      await header(page)
        .locator(`[data-nav-action="${key}"]`)
        .getAttribute("href"),
      href,
    );
  }
  assert.equal(
    await header(page).locator("[data-nav-brand]").getAttribute("href"),
    "/",
  );
  assert.match(
    await header(page).locator('[data-nav-action="shop"]').innerText(),
    /WHOLESALE/i,
  );
  assert.match(
    await page.locator('[data-site-footer] nav a[href="/shop"]').innerText(),
    /WHOLESALE/i,
  );
  assert.equal(await page.locator("[data-site-footer]").count(), 1);
  assert.equal(
    await page.locator('[data-site-footer] a[href="/about"]').count(),
    1,
  );
  assert.equal(
    await page
      .locator(
        '[data-site-footer] a[aria-label="Manage subscriptions (opens in a new tab)"]',
      )
      .count(),
    1,
  );
  assert.equal(
    await page
      .locator("[data-site-footer] [data-footer-utility-preview] li")
      .count(),
    3,
  );
  assert.equal(
    await page.locator('a[href^="/new-hero7"]').count(),
    0,
    "Adopted views never send visitors into the saved study",
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
  );
}
async function geometry(page) {
  return page.evaluate(() =>
    Object.fromEntries(
      [
        'header[data-brand-part="header"]',
        "[data-new-hero7-first-view]",
        "[data-new-hero7-hero]",
        "h1",
        "[data-new-hero7-material]",
        '[data-new-hero7-jump="ceremonial"]',
        "[data-new-hero7-samples]",
        "[data-new-hero7-explore]",
      ].map((selector) => {
        const bounds = document.querySelector(selector).getBoundingClientRect();
        return [
          selector,
          {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
          },
        ];
      }),
    ),
  );
}
async function includeSmallFormats({ context }) {
  const products = SAMPLE_SET_CONTENTS.map((item, index) => ({
    id: item.key,
    handle: item.productHandle,
    title: item.name,
    productCode: item.productCode,
    description: "Isolated in-place format fixture.",
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
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
async function fixture(width, tone, options, run) {
  const test = await createHeroStudyFixture(
    browser,
    baseURL,
    width,
    tone,
    "en",
    options,
  );
  try {
    if (options.height)
      await test.page.setViewportSize({ width, height: options.height });
    await run(test);
    assert.deepEqual(
      test.errors,
      [],
      "No client errors or unexpected requests",
    );
    assert.deepEqual(test.writes, [], "No live commerce writes");
  } catch (error) {
    console.error("Homepage adoption failure at", test.page.url());
    await test.page.screenshot({
      path: `${evidence}/failure-${width}-${tone}.png`,
    });
    throw error;
  } finally {
    test.release();
    await test.context.close();
  }
}
await mkdir(evidence, { recursive: true });
const measurements = [];
try {
  if (process.env.HOMEPAGE_ADOPTION_FOCUS !== "compatibility") {
    for (const width of [1440, 390])
      for (const tone of ["light", "dark"]) {
        await fixture(width, tone, {}, async ({ page }) => {
          await page.goto(`${baseURL}/new-hero7`, {
            waitUntil: "domcontentloaded",
          });
          await ready(page, "home");
          const study = await geometry(page);
          assert.equal(
            await page.locator("[data-new-hero7-samples]").getAttribute("href"),
            "/new-hero7?view=samples",
          );
          assert.equal(
            await page.locator("[data-new-hero7-explore]").getAttribute("href"),
            "/new-hero7?view=matcha",
          );
          await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded" });
          await ready(page, "home");
          const home = await geometry(page);
          if (width < 761) {
            assert.deepEqual(
              home,
              study,
              "The adopted mobile hero preserves the study's geometry",
            );
          } else {
            for (const selector of [
              'header[data-brand-part="header"]',
              "[data-new-hero7-first-view]",
              "[data-new-hero7-hero]",
              '[data-new-hero7-jump="ceremonial"]',
            ]) {
              assert.deepEqual(
                home[selector],
                study[selector],
                "The smaller desktop title preserves the hero frame and application rail",
              );
            }
            assert.equal(home.h1.width, study.h1.width);
            assert.ok(
              home.h1.height < study.h1.height,
              "The adopted desktop title intentionally uses the smaller approved scale",
            );
          }
          measurements.push({ width, tone, study, home });
          await rootLinks(page);
          await page.screenshot({
            path: `${evidence}/${width}-${tone}-home.png`,
          });
          await page.evaluate(() => {
            window.__adoptedRoot = document.querySelector("[data-new-hero7]");
            window.__adoptedHeader = document.querySelector(
              "[data-new-hero7-header]",
            );
          });
          assert.equal(
            await page.locator("[data-new-hero7-samples]").getAttribute("href"),
            "/?view=samples",
          );
          await page.locator("[data-new-hero7-samples]").click();
          await ready(page, "samples");
          assert.equal(new URL(page.url()).pathname, "/");
          assert.equal(new URL(page.url()).searchParams.get("view"), "samples");
          await rootLinks(page);
          const quantity = panel(page, "samples").locator(
            'output[aria-label="Set quantity"]',
          );
          await panel(page, "samples")
            .getByRole("button", { name: "Increase quantity", exact: true })
            .click();
          await page
            .locator('[data-new-hero7-sample-tab="barista"]')
            .scrollIntoViewIfNeeded();
          const sampleScroll = await page.evaluate(() => scrollY);
          await page.locator('[data-new-hero7-sample-tab="barista"]').click();
          const sampleReader = page.locator(
            "[data-new-hero7-sample-dialog][open]",
          );
          await sampleReader.waitFor();
          assert.equal(
            await sampleReader.evaluate((node) => node.matches(":modal")),
            true,
          );
          assert.equal(await page.evaluate(() => scrollY), sampleScroll);
          await sampleReader.locator("[data-new-hero7-sample-back]").click();
          await sampleReader.waitFor({ state: "hidden" });
          assert.equal(await page.evaluate(() => scrollY), sampleScroll);
          assert.equal(await quantity.textContent(), "2");
          await page.goBack();
          await ready(page, "home");
          assert.equal(new URL(page.url()).pathname, "/");
          assert.equal(new URL(page.url()).searchParams.get("view"), null);
          await page.locator("[data-new-hero7-explore]").click();
          await ready(page, "matcha");
          await rootLinks(page);
          const trigger = page.locator(
            '[data-new-hero7-application="culinary"]',
          );
          await trigger.scrollIntoViewIfNeeded();
          const applicationScroll = await page.evaluate(() => scrollY);
          await trigger.click();
          const product = page.locator("[data-new-hero7-product-dialog][open]");
          await product.waitFor();
          assert.equal(
            await product.evaluate((node) => node.matches(":modal")),
            true,
          );
          assert.equal(new URL(page.url()).pathname, "/");
          assert.equal(
            new URL(page.url()).searchParams.get("application"),
            "culinary",
          );
          assert.equal(await page.evaluate(() => scrollY), applicationScroll);
          await product
            .getByRole("button", { name: "Increase quantity", exact: true })
            .click();
          await page.goBack();
          await product.waitFor({ state: "hidden" });
          assert.equal(await page.evaluate(() => scrollY), applicationScroll);
          await page.goForward();
          await product.waitFor();
          assert.equal(
            await product
              .locator("[data-new-hero-quantity]:visible")
              .textContent(),
            "2",
          );
          await product.locator("[data-new-hero7-product-close]").click();
          await product.waitFor({ state: "hidden" });
          await eventually(
            () => trigger.evaluate((node) => node === document.activeElement),
            "Closing the root popup restores its originating card",
          );
          assert.equal(
            await page.evaluate(
              () =>
                window.__adoptedRoot ===
                  document.querySelector("[data-new-hero7]") &&
                window.__adoptedHeader ===
                  document.querySelector("[data-new-hero7-header]"),
            ),
            true,
            "Root local selection keeps the same shell",
          );
          const origins = header(page).locator('[data-nav-action="origins"]');
          if (!(await origins.isVisible()))
            await header(page).locator("summary").click();
          const beforeOrigins = page.url();
          await origins.click();
          const originReader = page.locator("[data-origins-dialog][open]");
          await originReader.waitFor();
          assert.equal(
            await originReader.evaluate((node) => node.matches(":modal")),
            true,
          );
          await page.keyboard.press("Escape");
          await originReader.waitFor({ state: "hidden" });
          await eventually(
            () => Promise.resolve(page.url() === beforeOrigins),
            "Origins returns to the adopted selection URL",
          );
          const wholesale = header(page).locator('[data-nav-action="shop"]');
          if (!(await wholesale.isVisible()))
            await header(page).locator("summary").click();
          assert.match(await wholesale.innerText(), /WHOLESALE/i);
          await wholesale.click();
          await page.waitForURL((url) => url.pathname === "/shop");
          await page.goBack();
          await ready(page, "matcha");
          await rootLinks(page);
          console.log(
            `Adopted hero, root URLs, native learning, history and canonical navigation: ${width}-${tone}`,
          );
        });
      }
    await writeFile(
      `${evidence}/hero-geometry.json`,
      JSON.stringify(measurements, null, 2),
    );
    await fixture(
      1366,
      "dark",
      { holdMutation: true, height: 768 },
      async (test) => {
        const { page } = test;
        await page.goto(`${baseURL}/?view=samples`, {
          waitUntil: "domcontentloaded",
        });
        await ready(page, "samples");
        const add = panel(page, "samples").locator(
          "[data-sample-purchase] button[data-available]",
        );
        await eventually(
          () => add.isEnabled(),
          "The fixture sample order is available",
        );
        await add.click();
        await eventually(
          () => Promise.resolve(test.simulatedWrites.length === 1),
          "The isolated fixture received one order",
        );
        const before = page.url();
        for (const link of await page
          .locator("[data-new-hero7-header] a, [data-site-footer] a")
          .all())
          await link.evaluate((node) => node.click());
        assert.equal(
          page.url(),
          before,
          "Pending root orders guard local and canonical navigation",
        );
        assert.equal(
          await page.locator("[data-origins-dialog][open]").count(),
          0,
        );
        test.releaseMutation();
        await eventually(
          () => add.isEnabled(),
          "A rejected fixture order restores buying controls",
        );
        await header(page).locator("[data-nav-brand]").click();
        await ready(page, "home");
        await rootLinks(page);
        console.log("Adopted homepage pending-navigation guard passed");
      },
    );
    await fixture(1366, "light", {}, async (test) => {
      const { page } = test;
      await includeSmallFormats(test);
      await page.goto(`${baseURL}/new-hero7?view=matcha&application=barista`, {
        waitUntil: "domcontentloaded",
      });
      await ready(page, "matcha");
      const product = () =>
        page.locator("[data-new-hero7-product-dialog][open]");
      await product().waitFor();
      await product()
        .getByRole("button", { name: "100 g", exact: true })
        .click();
      await product()
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await product()
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await product().locator("[data-new-hero-product-link]:visible").click();
      const retail = page.locator(
        `[data-retail-product="${SAMPLE_SET_CONTENTS[1].productHandle}"]`,
      );
      await retail.waitFor();
      assert.equal(
        await retail.locator('output[aria-label="Quantity"]').textContent(),
        "3",
      );
      await page.locator("header [data-nav-brand]").click();
      await ready(page, "home");
      await page.locator("[data-new-hero7-explore]").click();
      await ready(page, "matcha");
      await page.locator('[data-new-hero7-application="barista"]').click();
      await product().waitFor();
      await product()
        .getByRole("button", { name: "100 g", exact: true })
        .click();
      while (
        (await product()
          .locator("[data-new-hero-quantity]:visible")
          .textContent()) !== "2"
      ) {
        const current = Number(
          await product()
            .locator("[data-new-hero-quantity]:visible")
            .textContent(),
        );
        await product()
          .getByRole("button", {
            name: current > 2 ? "Decrease quantity" : "Increase quantity",
            exact: true,
          })
          .click();
      }
      await product().locator("[data-new-hero-product-link]:visible").click();
      await retail.waitFor();
      await eventually(
        async () =>
          (await retail
            .locator('output[aria-label="Quantity"]')
            .textContent()) === "2",
        "Canonical product details retain the adopted quantity",
      );
      assert.equal(
        await retail
          .getByRole("button", { name: "100 g", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      await page.goBack();
      await product().waitFor();
      assert.equal(
        await product()
          .locator("[data-new-hero-quantity]:visible")
          .textContent(),
        "2",
      );
      await page.goBack();
      await product().waitFor({ state: "hidden" });
      await page.goBack();
      await ready(page, "home");
      await page.goBack();
      await retail.waitFor();
      await page.goBack();
      await ready(page, "matcha");
      await product().waitFor();
      assert.equal(new URL(page.url()).pathname, "/new-hero7");
      assert.equal(
        await product()
          .locator("[data-new-hero-quantity]:visible")
          .textContent(),
        "3",
        "The adopted order never overwrites the saved study's independent order",
      );
      assert.equal(
        await product()
          .getByRole("button", { name: "100 g", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      console.log(
        "Root/study independent product edits and canonical format/quantity handoff passed",
      );
    });
  }
  await fixture(1366, "dark", {}, async ({ page }) => {
    for (const item of SAMPLE_SET_CONTENTS) {
      await page.goto(`${baseURL}/?matcha=${item.productHandle}`, {
        waitUntil: "domcontentloaded",
      });
      await ready(page, "matcha");
      await page
        .locator(
          `[data-new-hero7-product-dialog][open] [data-new-hero-product="${item.key}"]`,
        )
        .waitFor();
      assert.equal(new URL(page.url()).pathname, "/");
      assert.equal(
        new URL(page.url()).searchParams.get("application"),
        item.key,
      );
    }
    await page
      .locator(
        "[data-new-hero7-product-dialog][open] [data-new-hero7-product-close]",
      )
      .click();
    await header(page).locator('[data-nav-action="origins"]').click();
    const origin = page.locator("[data-origins-dialog][open]");
    await origin.waitFor();
    await origin.getByRole("button", { name: /^Wazuka/i }).click();
    const exact = origin.locator(
      `a[href="/?matcha=${SAMPLE_SET_CONTENTS[0].productHandle}"]`,
    );
    await exact.waitFor();
    await exact.click();
    await origin.waitFor({ state: "hidden" });
    await page
      .locator(
        '[data-new-hero7-product-dialog][open] [data-new-hero-product="ceremonial"]',
      )
      .waitFor();
    assert.equal(
      new URL(page.url()).searchParams.get("application"),
      "ceremonial",
      "Same-path Origins links select their exact product after adoption",
    );
    for (const query of [
      "matcha=barista-matcha&matcha=culinary-matcha",
      "matcha=invalid%2Fhandle",
    ]) {
      await page.goto(`${baseURL}/?${query}`, {
        waitUntil: "domcontentloaded",
      });
      await ready(page, "home");
      assert.equal(
        await page.locator("[data-new-hero7-product-dialog][open]").count(),
        0,
      );
    }
    await page.goto(`${baseURL}/?matcha=barista-matcha&view=samples`, {
      waitUntil: "domcontentloaded",
    });
    await ready(page, "samples");
    await page.goto(`${baseURL}/?matcha=unknown-compatible-matcha`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForURL(
      (url) => url.pathname === "/shop/unknown-compatible-matcha",
    );
    console.log(
      "Legacy exact-product entries, same-path Origins handoff and safe query precedence passed",
    );
  });
  await fixture(390, "dark", {}, async ({ page }) => {
    await page.goto(
      `${baseURL}/?matcha=${SAMPLE_SET_CONTENTS[1].productHandle}&checkout=retry`,
      { waitUntil: "domcontentloaded" },
    );
    const cart = page.getByRole("dialog").filter({
      has: page.getByRole("button", { name: "Close cart", exact: true }),
    });
    await cart.waitFor();
    await cart
      .getByText(
        "Checkout couldn’t be opened. Reload your selection and try again.",
        { exact: true },
      )
      .waitFor();
    assert.equal(
      new URL(page.url()).searchParams.get("checkout"),
      null,
      "Global cart consumes the retry after the legacy redirect",
    );
    assert.equal(
      new URL(page.url()).searchParams.get("application"),
      "barista",
    );
    await page.keyboard.press("Escape");
    await cart.waitFor({ state: "hidden" });
    await page
      .locator(
        '[data-new-hero7-product-dialog][open] [data-new-hero-product="barista"]',
      )
      .waitFor();
    console.log(
      "Checkout retry survives legacy adoption redirects and returns to the exact product popup",
    );
  });
} finally {
  await browser.close();
}
