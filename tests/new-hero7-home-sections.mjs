/* Shared home sections, with all commerce isolated by browser fixtures. */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
  process.env.NEW_HERO7_EVIDENCE ?? ".local/new-hero-0250/sections";
const baselinePath =
  process.env.NEW_HERO7_HERO_BASELINE ??
  "tests/fixtures/new-hero7-hero-metrics.json";
const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
const profiles = process.env.NEW_HERO7_PROFILES?.split(",").filter(Boolean);
const selectedBaseline = profiles
  ? baseline.filter((item) => profiles.includes(item.label))
  : baseline;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const sourceSectionKeys = ["applications", "samples", "origin", "supply"];
const sectionKeys = ["samples", "applications", "origin", "supply"];
const home = (page) => page.locator('[data-new-hero7-view="home"]:visible');
const lower = (page) => home(page).locator("[data-new-hero7-home-sections]");
const section = (page, key) =>
  lower(page).locator(`[data-new-hero-section="${key}"]`);
const productDialog = (page) =>
  lower(page).locator("[data-new-hero7-home-product-dialog][open]");
const productClose = (page) =>
  productDialog(page).locator("[data-new-hero7-home-product-close]");
const application = (page, key) =>
  lower(page).locator(`[data-new-hero7-home-application="${key}"]`);
const product = (page, key) =>
  lower(page)
    .locator("[data-new-hero7-home-product-dialog]")
    .locator(`[data-new-hero-product="${key}"]`);
const add = (page, key) =>
  product(page, key).locator("[data-new-hero-add] button");
const quantity = (page, key) =>
  product(page, key).locator("[data-new-hero-quantity]");
const header = (page) => page.locator('header[data-brand-part="header"]');
const normalize = (value) =>
  value.replace(/[↗↑]/g, "").replace(/\s+/g, " ").trim();

async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}
async function hydrated(page) {
  await eventually(
    () => page.locator("footer [data-theme-switcher]").isEnabled(),
    "The latest experience is hydrated",
  );
}
async function ready(page) {
  await home(page).waitFor();
  await hydrated(page);
  for (const item of SAMPLE_SET_CONTENTS)
    await application(page, item.key).waitFor();
}
async function openProduct(page, key, keyboard = false) {
  const trigger = application(page, key);
  if (keyboard) {
    await trigger.focus();
    await page.keyboard.press("Enter");
  } else await trigger.click();
  await productDialog(page).waitFor();
  await eventually(
    () => add(page, key).isEnabled(),
    "The Home popup has usable purchase controls",
  );
  assert.equal(new URL(page.url()).searchParams.get("view"), null);
  assert.equal(new URL(page.url()).searchParams.get("application"), key);
  assert.equal(await trigger.getAttribute("aria-expanded"), "true");
  await eventually(
    () =>
      productClose(page).evaluate((node) => node === document.activeElement),
    "Opening the Home product focuses its close button",
  );
}
async function closeProduct(page, dismissal = "button") {
  const dialog = productDialog(page);
  if (dismissal === "Escape") await page.keyboard.press("Escape");
  else if (dismissal === "backdrop") await page.mouse.click(2, 2);
  else await productClose(page).click();
  await dialog.waitFor({ state: "hidden" });
  await eventually(
    () => !new URL(page.url()).searchParams.has("application"),
    "Closing the Home product restores its gallery URL",
  );
}
async function uniqueIds(page) {
  assert.deepEqual(
    await page.locator("[id]").evaluateAll((nodes) => {
      const seen = new Set();
      return nodes
        .map((node) => node.id)
        .filter((id) => {
          if (seen.has(id)) return true;
          seen.add(id);
          return false;
        });
    }),
    [],
    "Retained home, sample and popup content have unique IDs",
  );
}
function watchNavigation(page) {
  const requests = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      request.isNavigationRequest() ||
      (url.pathname.startsWith("/new-hero7") && url.searchParams.has("_rsc"))
    )
      requests.push(url.pathname);
  });
  return requests;
}
async function sameDocument(page) {
  assert.equal(
    await page.evaluate(
      () => window.__homeSectionsDocument === document.documentElement,
    ),
    true,
    "The home journey stays in the same document",
  );
}
async function markDocument(page) {
  await page.evaluate(() => {
    window.__homeSectionsDocument = document.documentElement;
  });
}
async function capture(page, label, fullPage = true) {
  await page.locator("main img:visible").evaluateAll(async (nodes) =>
    Promise.all(
      nodes.map(async (image) => {
        image.loading = "eager";
        await image.decode().catch(() => {});
      }),
    ),
  );
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: resolve(evidence, `${label}.png`), fullPage });
}
async function fixture(profile, options, run) {
  const [rawWidth, tone, ...locale] = profile.split("-");
  const test = await createHeroStudyFixture(
    browser,
    baseURL,
    Number(rawWidth),
    tone,
    locale.join("-"),
    options,
  );
  try {
    await options.beforeNavigation?.(test);
    if (options.viewportHeight)
      await test.page.setViewportSize({
        width: Number(rawWidth),
        height: options.viewportHeight,
      });
    await test.page.goto(`${baseURL}${options.route ?? "/new-hero7"}`, {
      waitUntil: "domcontentloaded",
    });
    await hydrated(test.page);
    if (!options.route && !options.unavailable) await ready(test.page);
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
async function formats({ context }) {
  const products = SAMPLE_SET_CONTENTS.map((item, index) => ({
    id: item.key,
    handle: item.productHandle,
    title: item.name,
    productCode: item.productCode,
    description: "Isolated home section fixture.",
    imageUrl: null,
    imageAlt: "",
    productUrl: null,
    isFixture: true,
    variants: ["1 kg", "100 g"].map((title, offset) => ({
      id: `v1_${String.fromCharCode(97 + index + offset * 3).repeat(43)}`,
      title,
      available: true,
      priceMinor: offset === 0 ? 6000 + index * 1000 : 1000 + index * 100,
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
        shopUrl: "https://example.invalid",
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
      },
    }),
  );
}

await mkdir(evidence, { recursive: true });
try {
  const measured = [];
  for (const { label, metrics } of selectedBaseline) {
    await fixture(label, {}, async ({ page, context }) => {
      await page
        .locator('[data-new-hero7-material][data-image-state="ready"]')
        .waitFor();
      await page.evaluate(() => document.fonts.ready);
      for (const [selector, expected] of Object.entries(metrics)) {
        const actual = (await home(page).locator(selector).count())
          ? await home(page).locator(selector).boundingBox()
          : await page.locator(selector).boundingBox();
        for (const dimension of ["x", "y", "width", "height"])
          assert.ok(
            Math.abs(actual[dimension] - expected[dimension]) <= 1,
            `${label} preserves ${selector} ${dimension}: ${actual[dimension]} vs ${expected[dimension]}`,
          );
      }
      const first = await page
        .locator("[data-new-hero7-first-view]")
        .boundingBox();
      const added = await lower(page).boundingBox();
      assert.ok(
        added.y >= first.y + first.height - 1,
        "Added content begins after the unchanged first view",
      );
      assert.deepEqual(
        await lower(page)
          .locator("[data-new-hero-section]")
          .evaluateAll((nodes) =>
            nodes.map((node) => node.dataset.newHeroSection),
          ),
        sectionKeys,
      );
      assert.equal(
        await lower(page).locator("[data-new-hero-product]:visible").count(),
        0,
        "Home begins with three learning cards and no exposed purchase forms",
      );
      await uniqueIds(page);
      assert.equal(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth + 1,
        ),
        true,
      );
      assert.equal(
        await section(page, "origin")
          .locator('a[href="/new-hero7?view=matcha"]')
          .count(),
        1,
        "The latest preparation CTA enters its in-place application view",
      );
      for (const identity of SAMPLE_SET_CONTENTS) {
        assert.equal(
          await product(page, identity.key).getAttribute("id"),
          `new-hero7-home-${identity.key}`,
        );
        assert.equal(
          await section(page, "supply")
            .locator(`[data-new-hero-reorder="${identity.key}"]`)
            .getAttribute("href"),
          `/shop/${identity.productHandle}?format=1kg`,
        );
      }
      const radii = await lower(page).evaluate((node) => ({
        sections: [...node.querySelectorAll("[data-new-hero-section]")].map(
          (item) => getComputedStyle(item).borderTopLeftRadius,
        ),
        products: [...node.querySelectorAll("[data-new-hero-product]")].map(
          (item) => getComputedStyle(item).borderTopLeftRadius,
        ),
        cards: [
          ...node.querySelectorAll("[data-new-hero7-home-application]"),
        ].map((item) => getComputedStyle(item).borderTopLeftRadius),
        buttons: [
          ...node.querySelectorAll(
            '[data-new-hero7-home-application] [class*="learnMore"], [data-new-hero-section="samples"] a[href="/new-hero7?view=samples"], [data-new-hero-section="supply"] a[href="/new-hero7?view=matcha"]',
          ),
        ]
          .filter((item) => item.checkVisibility())
          .map((item) => getComputedStyle(item).borderTopLeftRadius),
        images: [
          ...node.querySelectorAll(
            '[data-product-application-image] img, [data-new-hero-section="origin"] img',
          ),
        ]
          .filter((item) => item.checkVisibility())
          .map((item) =>
            Math.max(
              ...[item, item.parentElement, item.parentElement?.parentElement]
                .filter(Boolean)
                .map((parent) =>
                  parseFloat(getComputedStyle(parent).borderTopLeftRadius),
                ),
            ),
          ),
      }));
      assert.ok(radii.sections.every((radius) => parseFloat(radius) === 0));
      assert.ok(radii.products.every((radius) => parseFloat(radius) === 0));
      assert.ok(radii.cards.every((radius) => parseFloat(radius) === 0));
      assert.ok(radii.buttons.length >= 5 && radii.images.length >= 4);
      assert.ok(
        radii.buttons.every((radius) => parseFloat(radius) > 0),
        "Home buttons keep rounded corners",
      );
      assert.ok(
        radii.images.every((radius) => radius > 0),
        "Home photographs keep rounded corners",
      );
      const sampleVisual = section(page, "samples").locator(
        "[data-new-hero-sample-visual]",
      );
      assert.deepEqual(
        await sampleVisual.evaluate((node) => ({
          color: getComputedStyle(node).backgroundColor,
          image: getComputedStyle(node).backgroundImage,
        })),
        { color: "rgba(0, 0, 0, 0)", image: "none" },
        "The sample pouches float on the page without an image panel",
      );
      assert.equal(await sampleVisual.locator("[data-pouch]").count(), 3);
      if (page.viewportSize().width >= 1100) {
        const originBounds = await section(page, "origin").boundingBox();
        const originPhoto = await section(page, "origin")
          .locator("img")
          .boundingBox();
        assert.ok(
          originPhoto.width >= originBounds.width * 0.95,
          "The desktop Origin photograph spans its information row",
        );
      }
      const joinY = Math.round(added.y + (await page.evaluate(() => scrollY)));
      const join = await page.screenshot({
        path: resolve(evidence, `${label}-background-join.png`),
        fullPage: true,
        clip: {
          x: 0,
          y: joinY - 2,
          width: page.viewportSize().width,
          height: 4,
        },
      });
      const joinDifference = await page.evaluate(
        async (data) => {
          const image = new Image();
          image.src = data;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0);
          return [
            8,
            Math.floor(image.width / 4),
            Math.floor(image.width / 2),
            image.width - 9,
          ].map((x) => {
            const before = context.getImageData(x, 1, 1, 1).data;
            const after = context.getImageData(x, 2, 1, 1).data;
            return Math.max(
              ...[0, 1, 2].map((channel) =>
                Math.abs(before[channel] - after[channel]),
              ),
            );
          });
        },
        `data:image/png;base64,${join.toString("base64")}`,
      );
      assert.ok(
        joinDifference.every((delta) => delta <= 4),
        `The hero background continues across the section join (${joinDifference.join(",")})`,
      );
      await capture(page, `${label}-home`);
      measured.push({ label, firstView: first, lower: added });
      // Compare customer-visible lower content to its canonical source in a separate tab.
      if (label === "1440-light-en" || label === "390-dark-ja") {
        const source = await context.newPage();
        try {
          await source.goto(`${baseURL}/new-hero`, {
            waitUntil: "domcontentloaded",
          });
          for (const item of SAMPLE_SET_CONTENTS)
            await eventually(
              () =>
                source
                  .locator(
                    `[data-new-hero-product="${item.key}"] [data-new-hero-add] button`,
                  )
                  .isEnabled(),
              "Source products are ready",
            );
          assert.deepEqual(
            await source
              .locator("[data-new-hero-section]")
              .evaluateAll((nodes) =>
                nodes.map((node) => node.dataset.newHeroSection),
              ),
            sourceSectionKeys,
          );
          for (const key of ["samples", "origin"])
            assert.equal(
              normalize(await section(page, key).innerText()).replace(
                /^\d\d \/ /,
                "",
              ),
              normalize(
                await source
                  .locator(`[data-new-hero-section="${key}"]`)
                  .innerText(),
              ).replace(/^\d\d \/ /, ""),
              `The latest ${key} section retains the original content`,
            );
          assert.equal(
            await source
              .locator("[data-new-hero-explore]")
              .getAttribute("href"),
            "#applications",
          );
          assert.equal(
            await source
              .locator(
                '[data-new-hero-section="origin"] a[href="#applications"]',
              )
              .count(),
            1,
          );
          for (const item of SAMPLE_SET_CONTENTS) {
            assert.equal(
              await source
                .locator(`[data-new-hero-jump="${item.key}"]`)
                .getAttribute("href"),
              `#new-hero-${item.key}`,
            );
            assert.equal(
              await source.locator(`#new-hero-${item.key}`).count(),
              1,
              "The source product anchor retains its real target",
            );
          }
          for (const id of [
            "applications",
            "applications-heading",
            "new-samples-heading",
            "new-origin-heading",
            "new-supply-heading",
            "new-reorder-heading",
          ])
            assert.equal(
              await source.locator(`#${id}`).count(),
              1,
              "The extracted source section keeps its original public ID",
            );
          assert.equal(
            await source
              .locator('[data-new-hero-section="samples"] a[href="/samples"]')
              .count(),
            1,
          );
          assert.equal(
            await source
              .locator('[data-new-hero-section="origin"] a[href="/origins"]')
              .count(),
            1,
          );
          assert.equal(
            await source
              .locator('[data-new-hero-section="supply"] a[href="/shop"]')
              .count(),
            1,
          );
          assert.equal(
            await source
              .locator('[data-new-hero-products][data-compact="true"]')
              .count(),
            0,
            "The source retains its original product scale",
          );
          if (label === "1440-light-en") {
            const sourceSupply = source.locator(
              '[data-new-hero-section="supply"]',
            );
            assert.equal(
              await sourceSupply.locator("h2").textContent(),
              "From your first taste to your next order.",
            );
            assert.deepEqual(
              await sourceSupply.locator("ol h3").allTextContents(),
              [
                "Taste in your recipes",
                "Choose your format",
                "Return to your matcha",
              ],
              "The source keeps all four original sections, including its existing supply content",
            );
            assert.equal(
              await section(page, "supply").locator("h2").textContent(),
              "Find your matcha.",
            );
            assert.deepEqual(
              (
                await section(page, "supply").locator("ol h3").allTextContents()
              ).map((text) => text.replace(/^\d{2}\s*/, "")),
              ["Sample", "Choose", "Reorder"],
              "The latest process is a concise three-step journey",
            );
            assert.equal(
              await section(page, "supply")
                .locator("ol > li:last-child [data-new-hero-reorder]")
                .count(),
              3,
              "Exact product reorders are integrated into the final step",
            );
            assert.equal(
              await section(page, "supply")
                .locator('a[href="/new-hero7?view=samples"]')
                .count(),
              1,
            );
            assert.equal(
              await section(page, "supply")
                .locator('a[href="/new-hero7?view=matcha"]')
                .count(),
              1,
            );
          }
        } finally {
          await source.close();
        }
      }
    });
    console.log(
      `Unchanged hero, original sections, IDs and rounding: ${label}`,
    );
  }
  await writeFile(
    resolve(evidence, "home-metrics.json"),
    `${JSON.stringify(measured, null, 2)}\n`,
  );

  if (process.env.NEW_HERO7_GEOMETRY_ONLY !== "1") {
    for (const [profile, height] of [
      ["1440-light-en", 900],
      ["1366-dark-en", 768],
    ]) {
      await fixture(
        profile,
        { beforeNavigation: formats, viewportHeight: height },
        async ({ page }) => {
          const applications = section(page, "applications");
          await applications.evaluate((node) =>
            scrollTo({
              top: node.getBoundingClientRect().top + scrollY,
              behavior: "instant",
            }),
          );
          const bounds = await applications.boundingBox();
          assert.ok(
            Math.abs(bounds.y) <= 1,
            "The application section is aligned at the top of the viewport",
          );
          const heading = await applications
            .locator("h2:visible")
            .boundingBox();
          assert.ok(heading.y >= 0 && heading.y + heading.height <= height);
          for (const item of SAMPLE_SET_CONTENTS) {
            const controlBounds = await application(
              page,
              item.key,
            ).boundingBox();
            assert.ok(
              controlBounds.y >= 0 &&
                controlBounds.y + controlBounds.height <= height,
              `${profile} shows all three complete learning cards in one viewport`,
            );
            assert.equal(
              await application(page, item.key).getAttribute("aria-haspopup"),
              "dialog",
            );
          }
          assert.equal(
            await applications
              .locator("[data-new-hero-product]:visible")
              .count(),
            0,
          );
          await page.screenshot({
            path: resolve(
              evidence,
              `${profile}-${height}-applications-fit.png`,
            ),
          });
        },
      );
      console.log(
        `All three complete learning cards fit together: ${profile} / ${height}px`,
      );
    }

    for (const profile of ["1440-light-en", "390-dark-en"]) {
      await fixture(
        profile,
        { beforeNavigation: formats },
        async ({ page }) => {
          await markDocument(page);
          const requests = watchNavigation(page);
          for (const [index, item] of SAMPLE_SET_CONTENTS.entries()) {
            const trigger = application(page, item.key);
            await trigger.scrollIntoViewIfNeeded();
            const before = await page.evaluate(() => scrollY);
            const bounds = await trigger.boundingBox();
            await openProduct(page, item.key, index === 0);
            assert.equal(
              await lower(page)
                .locator("[data-new-hero-product]:visible")
                .count(),
              1,
            );
            assert.ok(
              Math.abs((await page.evaluate(() => scrollY)) - before) <= 2,
            );
            assert.deepEqual(
              await trigger.boundingBox(),
              bounds,
              "Opening does not move the gallery card",
            );
            const popupBounds = await productDialog(page).boundingBox();
            assert.ok(popupBounds.x > 0 && popupBounds.y > 0);
            assert.ok(
              popupBounds.x + popupBounds.width < page.viewportSize().width,
            );
            assert.ok(
              popupBounds.y + popupBounds.height < page.viewportSize().height,
            );
            await product(page, item.key)
              .getByRole("button", { name: "100 g", exact: true })
              .click();
            for (let amount = 0; amount <= index; amount++)
              await product(page, item.key)
                .getByRole("button", { name: "Increase quantity", exact: true })
                .click();
            await product(page, item.key).locator("summary").first().click();
            assert.doesNotMatch(
              await product(page, item.key).innerText(),
              /Illustrative profiles|Final specifications pending/,
              "Product learning omits internal reference-status notes",
            );
            await product(page, item.key).evaluate((node) => {
              window.__homeProductNodes ??= new Map();
              window.__homeProductNodes.set(node.dataset.newHeroProduct, node);
            });
            assert.equal(
              await productDialog(page).evaluate((node) => {
                const active = document.activeElement;
                document
                  .querySelector("[data-new-hero7-home-application]")
                  .focus();
                return (
                  active === document.activeElement &&
                  node.contains(document.activeElement)
                );
              }),
              true,
              "The underlying Home stays inert while its product is open",
            );
            await closeProduct(page, ["Escape", "backdrop", "button"][index]);
            await eventually(
              () => trigger.evaluate((node) => node === document.activeElement),
              "Dismissal restores the exact Home card focus",
            );
            assert.ok(
              Math.abs((await page.evaluate(() => scrollY)) - before) <= 2,
            );
            assert.deepEqual(
              await trigger.boundingBox(),
              bounds,
              "Closing does not move the gallery card",
            );
            assert.equal(await trigger.getAttribute("aria-expanded"), "false");
          }
          for (const [index, item] of SAMPLE_SET_CONTENTS.entries()) {
            await openProduct(page, item.key);
            assert.equal(
              await quantity(page, item.key).textContent(),
              String(index + 2),
            );
            assert.equal(
              await product(page, item.key)
                .getByRole("button", { name: "100 g", exact: true })
                .getAttribute("aria-pressed"),
              "true",
            );
            assert.equal(
              await product(page, item.key)
                .locator("details")
                .first()
                .getAttribute("open"),
              "",
            );
            assert.equal(
              await product(page, item.key).evaluate(
                (node) =>
                  window.__homeProductNodes.get(node.dataset.newHeroProduct) ===
                  node,
              ),
              true,
            );
            await closeProduct(page);
          }
          const trigger = application(page, "barista");
          await trigger.scrollIntoViewIfNeeded();
          const before = await page.evaluate(() => scrollY);
          await openProduct(page, "barista");
          await page.goBack();
          await productDialog(page).waitFor({ state: "hidden" });
          await eventually(
            () => trigger.evaluate((node) => node === document.activeElement),
            "Back restores Home card focus",
          );
          assert.ok(
            Math.abs((await page.evaluate(() => scrollY)) - before) <= 2,
          );
          await page.goForward();
          await productDialog(page).waitFor();
          assert.equal(await quantity(page, "barista").textContent(), "3");
          assert.ok(
            Math.abs((await page.evaluate(() => scrollY)) - before) <= 2,
          );
          await closeProduct(page);
          await uniqueIds(page);
          await sameDocument(page);
          assert.deepEqual(
            requests,
            [],
            "Home popup changes never navigate or request server components",
          );
        },
      );
      console.log(
        `Home product learning, retained independent orders and no-jolt dismissal/history: ${profile}`,
      );
    }

    await fixture(
      "390-light-en",
      { route: "/new-hero7?application=culinary" },
      async ({ page }) => {
        await ready(page);
        await productDialog(page).waitFor();
        await eventually(
          () => add(page, "culinary").isEnabled(),
          "Direct Home application purchase is ready",
        );
        assert.equal(await home(page).isVisible(), true);
        await closeProduct(page);
        assert.equal(new URL(page.url()).pathname, "/new-hero7");
        assert.equal(new URL(page.url()).search, "");
        await eventually(
          () =>
            application(page, "culinary").evaluate(
              (node) => node === document.activeElement,
            ),
          "A direct entry dismisses to its own Home card",
        );
        assert.equal(
          await page.evaluate(() => scrollY),
          0,
          "Direct popup dismissal does not jump to the lower card",
        );
      },
    );
    console.log(
      "Direct Home product URLs dismiss in place without leaving Home",
    );

    await fixture(
      "390-light-en",
      { beforeNavigation: formats },
      async (test) => {
        const { page } = test;
        await markDocument(page);
        const requests = watchNavigation(page);
        await openProduct(page, "barista");
        await product(page, "barista")
          .getByRole("button", { name: "100 g", exact: true })
          .click();
        await product(page, "barista")
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        await product(page, "barista").evaluate((node) => {
          window.__homeProduct = node;
        });
        await closeProduct(page);
        for (const [key, view] of [
          ["samples", "samples"],
          ["origin", "matcha"],
          ["supply", "samples"],
          ["supply", "matcha"],
        ]) {
          const link = section(page, key).locator(
            `a[href="/new-hero7?view=${view}"]`,
          );
          assert.equal(await link.count(), 1);
          await link.scrollIntoViewIfNeeded();
          const before = await page.evaluate(() => scrollY);
          await link.click();
          await page
            .locator(`[data-new-hero7-view="${view}"]:visible`)
            .waitFor();
          assert.equal(new URL(page.url()).searchParams.get("view"), view);
          await page.goBack();
          await ready(page);
          await eventually(
            async () =>
              Math.abs((await page.evaluate(() => scrollY)) - before) <= 2,
            "Back restores the lower home section scroll position",
          );
          assert.equal(await quantity(page, "barista").textContent(), "2");
          assert.equal(
            await product(page, "barista")
              .getByRole("button", {
                name: "100 g",
                exact: true,
                includeHidden: true,
              })
              .getAttribute("aria-pressed"),
            "true",
          );
          assert.equal(
            await product(page, "barista").evaluate(
              (node) => node === window.__homeProduct,
            ),
            true,
          );
          await sameDocument(page);
        }
        await page.locator('[data-new-hero7-jump="barista"]').click();
        const popup = page.locator("[data-new-hero7-product-dialog][open]");
        await popup.waitFor();
        const popupProduct = popup.locator('[data-new-hero-product="barista"]');
        await eventually(
          () => popupProduct.locator("[data-new-hero-add] button").isEnabled(),
          "The popup order is ready",
        );
        assert.equal(
          await popupProduct.locator("[data-new-hero-quantity]").textContent(),
          "1",
          "Home and Matcha product popups have independent order state",
        );
        assert.equal(
          await popupProduct
            .getByRole("button", { name: "1 kg", exact: true })
            .getAttribute("aria-pressed"),
          "true",
        );
        await uniqueIds(page);
        await page.goBack();
        await ready(page);
        assert.equal(await quantity(page, "barista").textContent(), "2");
        assert.deepEqual(
          requests,
          [],
          "Home section links and hero product entries stay in place",
        );
      },
    );
    console.log(
      "Lower CTA history and independent mounted orders stay continuous",
    );

    await fixture(
      "390-light-en",
      { route: "/new-hero7?view=matcha" },
      async ({ page }) => {
        await header(page).locator("[data-nav-brand]").click();
        await ready(page);
        const trigger = lower(page).getByRole("button", {
          name: "Inspect Ceremonial Matcha label",
          exact: true,
        });
        await trigger.click();
        const inspection = lower(page).locator(
          "[data-sample-label-dialog][open]",
        );
        await inspection.waitFor();
        await page.goBack();
        await page.locator('[data-new-hero7-view="matcha"]:visible').waitFor();
        await page
          .locator("[data-sample-label-dialog][open]")
          .waitFor({ state: "hidden" });
        await eventually(
          () =>
            page.evaluate(
              () =>
                getComputedStyle(document.documentElement).overflow !==
                  "hidden" &&
                getComputedStyle(document.body).overflow !== "hidden",
            ),
          "Leaving the home foil inspection releases its scroll lock",
        );
        await eventually(
          () =>
            page
              .locator('[data-new-hero7-view="matcha"] h1')
              .evaluate((node) => node === document.activeElement),
          "Hidden home inspection does not steal incoming view focus",
        );
        await page.goForward();
        await ready(page);
        assert.equal(
          await lower(page).locator("[data-sample-label-dialog][open]").count(),
          0,
        );
        await uniqueIds(page);
      },
    );
    console.log(
      "Leaving a home foil inspection closes its retained dialog and releases scroll/focus",
    );

    await fixture("390-light-en", {}, async (test) => {
      const { page, context } = test;
      const orders = [];
      await context.route("**/api/cart", (route) => {
        if (route.request().method() !== "POST") return route.fallback();
        const action = route.request().postDataJSON();
        orders.push(action);
        return route.fulfill({
          json: {
            kind: "success",
            checkoutEnabled: false,
            cart: {
              totalQuantity: action.quantity,
              subtotalLabel: "¥14,000",
              totalLabel: "¥14,000",
              lines: [
                {
                  lineKey: "home-section-fixture",
                  productHandle: action.productHandle,
                  productTitle: SAMPLE_SET_CONTENTS[1].name,
                  variantTitle: "1 kg",
                  options: [{ name: "Size", value: "1 kg" }],
                  quantity: action.quantity,
                  unitPriceLabel: "¥7,000",
                  lineTotalLabel: "¥14,000",
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
      await application(page, "barista").scrollIntoViewIfNeeded();
      const galleryScroll = await page.evaluate(() => scrollY);
      await openProduct(page, "barista");
      await product(page, "barista")
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      const button = add(page, "barista");
      await button.scrollIntoViewIfNeeded();
      await button.focus();
      const scroll = await page.evaluate(() => scrollY);
      await button.evaluate((node) => {
        node.click();
        node.click();
      });
      const cart = page.getByRole("dialog").filter({
        has: page.getByRole("button", { name: "Close cart", exact: true }),
      });
      await cart.waitFor();
      assert.ok((await cart.textContent()).includes("¥14,000"));
      assert.deepEqual(orders, [
        {
          action: "add",
          productHandle: SAMPLE_SET_CONTENTS[1].productHandle,
          variantKey: `v1_${"b".repeat(43)}`,
          quantity: 2,
        },
      ]);
      assert.equal(await home(page).isVisible(), true);
      await page.keyboard.press("Escape");
      await cart.waitFor({ state: "hidden" });
      await eventually(
        () => button.evaluate((node) => node === document.activeElement),
        "Cart dismissal returns focus to the initiating lower purchase action",
      );
      assert.ok(
        Math.abs((await page.evaluate(() => scrollY)) - scroll) <= 2,
        "Cart dismissal preserves the lower product's scroll position",
      );
      assert.equal(await quantity(page, "barista").textContent(), "2");
      assert.equal(await productDialog(page).isVisible(), true);
      await closeProduct(page);
      await eventually(
        () =>
          application(page, "barista").evaluate(
            (node) => node === document.activeElement,
          ),
        "Closing the purchased product returns to its Home card",
      );
      assert.ok(
        Math.abs((await page.evaluate(() => scrollY)) - galleryScroll) <= 2,
      );
    });
    console.log(
      "A lower product fixture order opens cart once and returns to the same purchase position",
    );

    await fixture("390-dark-en", { holdMutation: true }, async (test) => {
      const { page } = test;
      await openProduct(page, "culinary");
      await product(page, "culinary")
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      const button = add(page, "culinary");
      await button.evaluate((node) => {
        node.click();
        node.click();
      });
      await eventually(
        () => Promise.resolve(test.simulatedWrites.length === 1),
        "One explicit lower-section fixture order is submitted",
      );
      const before = page.url();
      await page.keyboard.press("Escape");
      await page.mouse.click(2, 2);
      assert.equal(await productDialog(page).isVisible(), true);
      assert.equal(await productClose(page).isDisabled(), true);
      for (const link of await lower(page).locator("a").all())
        await link.evaluate((node) => node.click());
      for (const control of await lower(page)
        .getByRole("button", { name: /^Inspect / })
        .all())
        await control.evaluate((node) => node.click());
      assert.equal(
        page.url(),
        before,
        "Pending home orders guard section links and native anchors",
      );
      assert.equal(
        await page.locator("[data-sample-label-dialog][open]").count(),
        0,
      );
      assert.deepEqual(test.simulatedWrites, [
        {
          action: "add",
          productHandle: SAMPLE_SET_CONTENTS[2].productHandle,
          variantKey: `v1_${"c".repeat(43)}`,
          quantity: 2,
        },
      ]);
      test.releaseMutation();
      await eventually(
        () => button.isEnabled(),
        "Rejected fixture order restores the home controls",
      );
      assert.equal(await quantity(page, "culinary").textContent(), "2");
      await closeProduct(page);
    });
    console.log(
      "Lower purchase controls submit exact fixture orders once and guard navigation while pending",
    );

    await fixture("320-light-en", {}, async ({ page }) => {
      await page.addStyleTag({
        content: "html { font-size: 200% !important; }",
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
      );
      await openProduct(page, "culinary");
      assert.equal(
        await productDialog(page).evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1,
        ),
        true,
        "Home popup content fits at 200% text",
      );
      await productDialog(page).evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });
      const dialogBounds = await productDialog(page).boundingBox();
      const closeBounds = await productClose(page).boundingBox();
      assert.ok(
        closeBounds.y >= dialogBounds.y &&
          closeBounds.y + closeBounds.height <=
            dialogBounds.y + dialogBounds.height,
      );
      await closeProduct(page);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
      );
    });
    console.log("Home cards and popup remain usable at 320px with 200% text");
  }
} finally {
  await browser.close();
}
