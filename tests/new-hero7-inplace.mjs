/* In-place seventh-concept views. Commerce is isolated by browser fixtures. */
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
const evidence = process.env.NEW_HERO7_EVIDENCE ?? ".local/new-hero-0244";
const views = ["home", "matcha", "samples"];
const profiles = process.env.NEW_HERO7_PROFILES?.split(",").filter(Boolean) ?? [
  "1440-light-en",
  "1440-dark-ja",
  "390-light-en",
  "390-dark-ja",
  "768-light-zh-Hans",
  "320-dark-zh-Hant",
];
const root = (page) => page.locator("[data-new-hero7]");
const viewNode = (page, view) =>
  page.locator(`[data-new-hero7-view="${view}"]:visible`);
const header = (page) => page.locator('header[data-brand-part="header"]');
const card = (page, key) =>
  viewNode(page, "matcha").locator(`[data-new-hero-product="${key}"]:visible`);
const productDialog = (page) =>
  page.locator("[data-new-hero7-product-dialog][open]");
const productClose = (page) =>
  productDialog(page).locator("[data-new-hero7-product-close]");
const application = (page, key) =>
  viewNode(page, "matcha").locator(`[data-new-hero7-application="${key}"]`);
const add = (page, key) =>
  card(page, key).locator("[data-new-hero-add] button");
const quantity = (page, key) =>
  card(page, key).locator("[data-new-hero-quantity]");
const increase = (page, key) =>
  card(page, key).getByRole("button", {
    name: "Increase quantity",
    exact: true,
  });
const sample = (page) => page.locator("[data-sample-purchase]:visible");
const sampleAdd = (page) => sample(page).locator("button[data-available]");
const path = (view, application) => {
  const params = new URLSearchParams();
  if (view !== "home") params.set("view", view);
  if (application) params.set("application", application);
  return `/new-hero7${params.size ? `?${params}` : ""}`;
};

async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function ready(page, view, skipCommerce = false) {
  await root(page).waitFor();
  await viewNode(page, view).waitFor();
  await eventually(
    () => page.locator("footer [data-theme-switcher]").isEnabled(),
    "Appearance controls are hydrated",
  );
  assert.equal(await page.locator("[data-new-hero7-view]:visible").count(), 1);
  assert.equal(await root(page).locator("h1:visible").count(), 1);
  assert.equal(
    await page.locator("[data-new-hero7-breadcrumb]:visible").count(),
    0,
    "Selection views keep one navigation layer",
  );
  if (view === "matcha") {
    const url = new URL(page.url());
    const selected =
      url.searchParams.get("application") ??
      (url.pathname === "/new-hero7/matcha" &&
      url.hash.startsWith("#new-hero7-")
        ? url.hash.replace("#new-hero7-", "")
        : null);
    if (selected) {
      await productDialog(page).waitFor();
      assert.equal(
        await productDialog(page).evaluate((node) => node.matches(":modal")),
        true,
        "Product learning uses the native modal layer",
      );
      await card(page, selected).waitFor();
      assert.equal(
        await viewNode(page, "matcha")
          .locator("[data-new-hero-product]:visible")
          .count(),
        1,
      );
      if (!skipCommerce)
        await eventually(
          () => add(page, selected).isEnabled(),
          "The selected product has usable buying controls inside the popup",
        );
    } else {
      await eventually(
        async () =>
          (await productDialog(page).count()) === 0 &&
          (await viewNode(page, "matcha")
            .locator("[data-new-hero-product]:visible")
            .count()) === 0,
        "The application gallery has no inline or open purchase form",
      );
    }
  }
  if (view === "samples")
    await eventually(
      () => sampleAdd(page).isEnabled(),
      "The Sample Set has usable buying controls",
    );
}

async function closeProduct(page, dismissal = "button") {
  const dialog = productDialog(page);
  if (!(await dialog.count())) return;
  if (dismissal === "Escape") await page.keyboard.press("Escape");
  else if (dismissal === "backdrop") await page.mouse.click(2, 2);
  else await productClose(page).click();
  await dialog.waitFor({ state: "hidden" });
}

async function chooseApplication(page, key, keyboard = false) {
  await closeProduct(page);
  const link = application(page, key);
  if (keyboard) {
    await link.focus();
    await page.keyboard.press("Enter");
  } else await link.click();
  await ready(page, "matcha");
  const url = new URL(page.url());
  assert.equal(
    url.pathname === "/new-hero7/matcha"
      ? url.hash.replace("#new-hero7-", "")
      : url.searchParams.get("application"),
    key,
  );
  assert.equal(await link.getAttribute("aria-expanded"), "true");
  await eventually(
    () =>
      productDialog(page).evaluate((node) =>
        node.contains(document.activeElement),
      ),
    "Opening an application moves focus into its popup without scrolling the gallery",
  );
}

async function navigate(page, view, keyboard = false) {
  await closeProduct(page);
  const reader = page.locator("[data-new-hero7-sample-dialog][open]");
  if (await reader.count())
    await reader.locator("[data-new-hero7-sample-close]").click();
  if (await viewNode(page, view).count()) return;
  const activate = async (link) => {
    if (keyboard) {
      await link.focus();
      await page.keyboard.press("Enter");
    } else await link.click();
  };
  if (view === "samples" && (await viewNode(page, "matcha").count())) {
    await activate(
      viewNode(page, "matcha").locator('[data-new-hero7-next="samples"]'),
    );
  } else {
    if (!(await viewNode(page, "home").count())) {
      await activate(header(page).locator("[data-nav-brand]"));
      await ready(page, "home");
    }
    if (view !== "home")
      await activate(
        page.locator(
          view === "samples"
            ? "[data-new-hero7-samples]"
            : "[data-new-hero7-explore]",
        ),
      );
  }
  await ready(page, view);
  assert.equal(new URL(page.url()).pathname, "/new-hero7");
  assert.equal(
    new URL(page.url()).searchParams.get("view"),
    view === "home" ? null : view,
  );
}

async function markShell(page) {
  await page.evaluate(() => {
    window.__sevenTestShell = {
      root: document.querySelector("[data-new-hero7]"),
      header: document.querySelector('header[data-brand-part="header"]'),
      document: document.documentElement,
    };
  });
}

async function sameShell(page) {
  assert.equal(
    await page.evaluate(() => {
      const saved = window.__sevenTestShell;
      return Boolean(
        saved &&
        saved.document === document.documentElement &&
        saved.root === document.querySelector("[data-new-hero7]") &&
        saved.header ===
          document.querySelector('header[data-brand-part="header"]') &&
        saved.header.isConnected,
      );
    }),
    true,
    "The same document, frame and header remain mounted",
  );
}

function watchNavigation(page) {
  const requests = [];
  const watch = (request) => {
    const url = new URL(request.url());
    if (
      request.isNavigationRequest() ||
      ((url.pathname === "/new-hero7" ||
        url.pathname.startsWith("/new-hero7/")) &&
        (url.searchParams.has("_rsc") || request.headers().rsc === "1"))
    )
      requests.push(`${request.resourceType()} ${url.pathname}`);
  };
  page.on("request", watch);
  return {
    requests,
    stop: () => page.off("request", watch),
  };
}

async function noOverflow(page, label) {
  if (await productDialog(page).count()) {
    assert.equal(
      await productDialog(page).evaluate(
        (node) => node.scrollWidth <= node.clientWidth + 1,
      ),
      true,
      `${label} keeps popup content within its scrolling viewport`,
    );
  }
  assert.equal(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
    ),
    true,
    `${label} fits the viewport`,
  );
  const clipped = await root(page)
    .locator(
      "h1:visible,h2:visible,h3:visible,[data-new-hero-product-code]:visible,[data-new-hero-price]:visible,[data-new-hero-total]:visible",
    )
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => node.scrollWidth > node.clientWidth + 1)
        .map((node) => node.textContent),
    );
  assert.deepEqual(
    clipped,
    [],
    `${label} keeps headings, codes and prices readable`,
  );
}

async function capture(page, label) {
  await page.locator("main img:visible").evaluateAll(async (images) => {
    await Promise.all(
      images.map(async (image) => {
        image.loading = "eager";
        await image.decode().catch(() => {});
      }),
    );
  });
  const popupOpen = (await productDialog(page).count()) > 0;
  if (!popupOpen) await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: resolve(evidence, `${label}.png`),
    fullPage: !popupOpen,
  });
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

await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const measurements = [];
async function fixture(profile, initialView, options, run) {
  const [rawWidth, tone, ...localeParts] = profile.split("-");
  const width = Number(rawWidth);
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
    await test.page.goto(
      `${baseURL}${options.route ?? path(initialView, options.application)}`,
      {
        waitUntil: options.holdScripts ? "commit" : "domcontentloaded",
      },
    );
    if (!options.holdScripts)
      await ready(test.page, initialView, options.unavailable);
    await run(test, { width, tone, locale });
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

try {
  for (const profile of profiles) {
    await fixture(
      profile,
      "home",
      {},
      async ({ page }, { width, tone, locale }) => {
        await markShell(page);
        const navigation = watchNavigation(page);
        for (const view of views) {
          if (view !== "home") await navigate(page, view);
          await sameShell(page);
          await noOverflow(page, `${profile}/${view}`);
          assert.equal(await root(page).getAttribute("data-tone"), tone);
          assert.equal(await page.locator("html").getAttribute("lang"), locale);
          await capture(page, `${profile}-${view}`);
          if (view === "matcha") {
            if (width === 1440) {
              for (const control of await viewNode(page, "matcha")
                .locator("[data-new-hero7-application]")
                .all()) {
                const bounds = await control.boundingBox();
                assert.ok(
                  bounds.y >= 0 &&
                    bounds.y + bounds.height <= page.viewportSize().height,
                  "Desktop application choices are fully visible in the first viewport",
                );
              }
            }
            await chooseApplication(page, "barista");
            await noOverflow(page, `${profile}/application popup`);
            await capture(page, `${profile}-application-popup`);
            await closeProduct(page);
          }
          measurements.push({
            profile,
            view,
            width,
            height: await page.evaluate(
              () => document.documentElement.scrollHeight,
            ),
          });
        }
        await navigate(page, "home");
        await sameShell(page);
        navigation.stop();
        assert.deepEqual(
          navigation.requests,
          [],
          "Switching all views makes no document or concept RSC navigation requests",
        );
      },
    );
    await writeFile(
      resolve(evidence, "inplace-measurements.json"),
      `${JSON.stringify(measurements, null, 2)}\n`,
    );
    console.log(`In-place views and stable shell: ${profile}`);
  }

  for (const profile of ["1512-dark-en", "1920-light-en"]) {
    await fixture(profile, "matcha", {}, async ({ page }) => {
      for (const entry of ["query", "direct"]) {
        for (const view of ["matcha", "samples"]) {
          await page.goto(
            `${baseURL}${entry === "query" ? path(view) : `/new-hero7/${view}`}`,
            { waitUntil: "domcontentloaded" },
          );
          await ready(page, view);
          const head = await header(page).boundingBox();
          const content = await viewNode(page, view).boundingBox();
          const title = await viewNode(page, view).locator("h1").boundingBox();
          assert.ok(
            Math.abs(head.x - content.x) <= 1 &&
              Math.abs(head.x + head.width - content.x - content.width) <= 1,
            `${profile}/${entry}/${view} content shares both header gutters`,
          );
          assert.ok(
            Math.abs(head.x - title.x) <= 1,
            `${profile}/${entry}/${view} title aligns with the brand`,
          );
          if (view === "samples" && entry === "query") {
            await eventually(
              () =>
                viewNode(page, view)
                  .locator("[data-masked]")
                  .evaluateAll(
                    (nodes) =>
                      nodes.length > 0 &&
                      nodes.every((node) => node.dataset.masked === "true"),
                  ),
              "Final sample powder masks are ready",
            );
            await capture(page, `aligned-${profile}-samples`);
          }
          if (view === "matcha") {
            await chooseApplication(page, "barista");
            const back = await productDialog(page)
              .locator("[data-new-hero7-product-back]")
              .boundingBox();
            const bodyLeft = await productDialog(page)
              .locator("[data-new-hero7-product-scroll]")
              .evaluate(
                (node) =>
                  node.getBoundingClientRect().x +
                  parseFloat(getComputedStyle(node).paddingLeft),
              );
            assert.ok(
              Math.abs(back.x - bodyLeft) <= 1,
              "Popup Back aligns with the product body's left gutter",
            );
            await closeProduct(page);
          }
        }
      }
    });
  }
  console.log(
    "All inner views align with the header at1512px and1920px on query and dedicated routes",
  );

  await fixture("390-light-en", "home", {}, async ({ page }) => {
    await markShell(page);
    const navigation = watchNavigation(page);
    await page.locator('[data-new-hero7-jump="barista"]').click();
    await ready(page, "matcha");
    assert.equal(
      new URL(page.url()).searchParams.get("application"),
      "barista",
    );
    await eventually(
      () =>
        productDialog(page).evaluate((node) =>
          node.contains(document.activeElement),
        ),
      "The requested application popup receives keyboard focus",
    );
    const bounds = await productDialog(page).boundingBox();
    assert.ok(
      bounds.y > 0 && bounds.x > 0 && bounds.x + bounds.width < 390,
      "The requested application opens in an inset mobile popup",
    );
    await page.goBack();
    await ready(page, "home");
    await page.goForward();
    await ready(page, "matcha");
    await navigate(page, "samples", true);
    assert.equal(
      await header(page).locator("details").getAttribute("open"),
      null,
      "Mobile navigation closes after keyboard selection",
    );
    await eventually(
      () =>
        viewNode(page, "samples")
          .locator("h1")
          .evaluate((node) => document.activeElement === node),
      "A changed view announces its heading through focus",
    );
    await page.evaluate(() => scrollTo(0, 350));
    const sampleScroll = await page.evaluate(() => scrollY);
    // Activating an offscreen header through Playwright would first scroll to it.
    await header(page)
      .locator("[data-nav-brand]")
      .first()
      .evaluate((node) => node.click());
    await ready(page, "home");
    await page.goBack();
    await ready(page, "samples");
    await eventually(
      async () =>
        Math.abs((await page.evaluate(() => scrollY)) - sampleScroll) <= 2,
      "Browser Back restores the selected view's scroll position",
    );
    await sameShell(page);
    assert.deepEqual(navigation.requests, []);
    navigation.stop();
    await page.reload({ waitUntil: "domcontentloaded" });
    await ready(page, "samples");
    assert.equal(new URL(page.url()).searchParams.get("view"), "samples");
  });
  console.log(
    "Application focus, keyboard menu, Back/Forward and reload retain the selected view",
  );

  await fixture("390-light-en", "matcha", {}, async ({ page }) => {
    await markShell(page);
    const navigation = watchNavigation(page);
    await chooseApplication(page, "barista");
    await increase(page, "barista").click();
    await closeProduct(page);
    for (const to of ["samples", "home", "matcha"]) {
      await navigate(page, to);
      await sameShell(page);
    }
    await chooseApplication(page, "barista");
    assert.equal(await quantity(page, "barista").textContent(), "2");
    await navigate(page, "home");
    await viewNode(page, "home")
      .locator('[data-new-hero7-jump="ceremonial"]')
      .click();
    await ready(page, "matcha");
    assert.equal(
      new URL(page.url()).searchParams.get("application"),
      "ceremonial",
    );
    await eventually(
      () =>
        productDialog(page).evaluate((node) =>
          node.contains(document.activeElement),
        ),
      "The hero product link opens its matching product popup",
    );
    await closeProduct(page);
    await eventually(
      () =>
        application(page, "ceremonial").evaluate(
          (node) => node === document.activeElement,
        ),
      "Closing an external product entry restores its matching card, not the previously visited application",
    );
    await page.goBack();
    await ready(page, "home");
    await sameShell(page);
    assert.deepEqual(navigation.requests, []);
    navigation.stop();
  });
  console.log(
    "Contextual sample and application journeys preserve the shell and selections",
  );

  await fixture(
    "390-light-en",
    "matcha",
    { beforeNavigation: includeSmallFormats },
    async (test) => {
      const { page } = test;
      const keys = SAMPLE_SET_CONTENTS.map((item) => item.key);
      await markShell(page);
      const navigation = watchNavigation(page);
      assert.equal(
        await application(page, "ceremonial").getAttribute("aria-expanded"),
        "false",
      );
      assert.equal(
        await viewNode(page, "matcha")
          .locator("[data-new-hero-product]:visible")
          .count(),
        0,
      );
      assert.equal(
        await viewNode(page, "matcha")
          .locator("[data-new-hero7-application]")
          .count(),
        3,
      );
      for (const key of keys) {
        assert.equal(
          await application(page, key).getAttribute("aria-haspopup"),
          "dialog",
          "Application controls announce that they open a popup",
        );
        const bounds = await application(page, key).boundingBox();
        assert.ok(
          bounds.width >= 44 && bounds.height >= 44,
          "Mobile application choices have generous tap targets",
        );
      }
      for (const [index, key] of keys.entries()) {
        const trigger = application(page, key);
        await trigger.scrollIntoViewIfNeeded();
        await trigger.focus();
        const before = await page.evaluate(() => scrollY);
        const triggerBefore = await trigger.boundingBox();
        await chooseApplication(page, key, true);
        const bounds = await productDialog(page).boundingBox();
        const viewport = page.viewportSize();
        assert.ok(bounds.x >= 8 && bounds.y >= 8);
        assert.ok(bounds.x + bounds.width <= viewport.width - 8);
        assert.ok(bounds.y + bounds.height <= viewport.height - 8);
        assert.equal(
          await page.evaluate(() => scrollY),
          before,
          "Opening a product never moves the underlying gallery",
        );
        assert.deepEqual(
          await trigger.boundingBox(),
          triggerBefore,
          "Opening a popup leaves the tapped card in the same place",
        );
        assert.equal(
          await card(page, key)
            .locator("[data-new-hero-product-name]")
            .textContent(),
          SAMPLE_SET_CONTENTS[index].name,
          "The popup presents the chosen canonical product",
        );
        const profile = card(page, key).locator(
          `[data-new-hero-product-profile="${key}"]`,
        );
        await profile.locator("summary").focus();
        await page.keyboard.press("Enter");
        assert.equal(await profile.getAttribute("open"), "");
        assert.equal(await profile.locator("dd:visible").count(), 7);
        assert.ok(
          (await profile.textContent()).includes(
            {
              ceremonial: "Keep the matcha dose, water quantity",
              barista: "Use your usual milk and sweetener.",
              culinary: "For baked recipes, compare the finished items",
            }[key],
          ),
        );
        assert.equal(
          await card(page, key)
            .getByText("Illustrative profiles · Final specifications pending", {
              exact: true,
            })
            .evaluateAll(
              (nodes) => nodes.filter((node) => node.checkVisibility()).length,
            ),
          0,
          "Product learning omits internal reference-status notes",
        );
        await card(page, key)
          .getByRole("button", { name: "100 g", exact: true })
          .click();
        for (let count = 0; count <= index; count++)
          await increase(page, key).click();
        for (const other of keys.filter((candidate) => candidate !== key)) {
          assert.equal(await card(page, other).count(), 0);
          assert.equal(
            await application(page, other).getAttribute("aria-expanded"),
            "false",
          );
          assert.equal(
            await viewNode(page, "matcha")
              .locator(`[data-new-hero-product="${other}"]`)
              .locator("a,button,input,select,textarea")
              .evaluateAll((controls) =>
                controls.every((control) => !control.checkVisibility()),
              ),
            true,
          );
        }
        // Native dialogs may hand off to browser chrome before cycling back;
        // the inert background must never receive focus in either direction.
        const visibleControls = productDialog(page).locator(
          "a:visible,button:visible,summary:visible",
        );
        for (const [edge, direction] of [
          [visibleControls.last(), "Tab"],
          [visibleControls.first(), "Shift+Tab"],
        ]) {
          await edge.focus();
          await page.keyboard.press(direction);
          assert.equal(
            await productDialog(page).evaluate(
              (node) =>
                node.contains(document.activeElement) ||
                document.activeElement === document.body,
            ),
            true,
            "Tab navigation cannot enter the inert gallery",
          );
          if (
            await page.evaluate(() => document.activeElement === document.body)
          )
            await page.keyboard.press(direction);
          assert.equal(
            await productDialog(page).evaluate((node) =>
              node.contains(document.activeElement),
            ),
            true,
            "Focus returns to the native popup after browser chrome",
          );
        }
        const focusBeforeBackgroundAttempt = await productDialog(page).evaluate(
          (node) => {
            const active = document.activeElement;
            document.querySelector("[data-new-hero7-application]")?.focus();
            return (
              active === document.activeElement &&
              node.contains(document.activeElement)
            );
          },
        );
        assert.equal(
          focusBeforeBackgroundAttempt,
          true,
          "The background application card cannot take focus while the dialog is open",
        );
        await noOverflow(page, `Popup ${key}`);
        if (index === 0) {
          await viewNode(page, "matcha")
            .locator("[data-new-hero-product]")
            .evaluateAll((nodes) => {
              window.__applicationProductNodes = new Map(
                nodes.map((node) => [node.dataset.newHeroProduct, node]),
              );
            });
        }
        await closeProduct(page, ["Escape", "backdrop", "button"][index]);
        await eventually(
          () => trigger.evaluate((node) => node === document.activeElement),
          "Closing restores focus to the exact application card",
        );
        assert.ok(
          Math.abs((await page.evaluate(() => scrollY)) - before) <= 2,
          "Closing preserves the gallery scroll position",
        );
        assert.deepEqual(await trigger.boundingBox(), triggerBefore);
        assert.equal(
          await viewNode(page, "matcha")
            .locator("[data-new-hero-product]:visible")
            .count(),
          0,
        );
        assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      }
      const reads = test.catalogReads();
      for (const [index, key] of keys.entries()) {
        await chooseApplication(page, key);
        assert.equal(
          await quantity(page, key).textContent(),
          String(index + 2),
        );
        assert.equal(
          await card(page, key)
            .getByRole("button", { name: "100 g", exact: true })
            .getAttribute("aria-pressed"),
          "true",
        );
        assert.equal(
          await card(page, key)
            .locator(`[data-new-hero-product-profile="${key}"]`)
            .getAttribute("open"),
          "",
        );
        assert.equal(
          await card(page, key).evaluate(
            (node) =>
              window.__applicationProductNodes.get(
                node.dataset.newHeroProduct,
              ) === node,
          ),
          true,
          "Closing and reopening preserves each mounted purchase form",
        );
        await closeProduct(page);
      }
      await application(page, "barista").scrollIntoViewIfNeeded();
      const historyScroll = await page.evaluate(() => scrollY);
      await chooseApplication(page, "barista");
      await page.goBack();
      await ready(page, "matcha");
      assert.equal(
        await productDialog(page).count(),
        0,
        "Back closes the product popup",
      );
      assert.ok(
        Math.abs((await page.evaluate(() => scrollY)) - historyScroll) <= 2,
      );
      await page.goForward();
      await ready(page, "matcha");
      assert.equal(
        await quantity(page, "barista").textContent(),
        "3",
        "Forward reopens the retained order",
      );
      assert.ok(
        Math.abs((await page.evaluate(() => scrollY)) - historyScroll) <= 2,
      );
      await closeProduct(page);
      assert.equal(
        test.catalogReads(),
        reads,
        "Reopening product popups reuses the catalog",
      );
      await sameShell(page);
      navigation.stop();
      assert.deepEqual(
        navigation.requests,
        [],
        "Opening and closing applications stays in the same document",
      );
    },
  );
  console.log(
    "Application popups preserve gallery geometry, scroll, focus, independent orders and history",
  );

  await fixture(
    "390-dark-en",
    "matcha",
    {
      unavailable: true,
      beforeNavigation: async ({ context }) => {
        await context.route("**/api/catalog", (route) =>
          route.fulfill({
            json: {
              status: "unavailable",
              products: [],
              shopUrl: "https://example.invalid",
            },
          }),
        );
      },
    },
    async ({ page }) => {
      for (const identity of SAMPLE_SET_CONTENTS) {
        await closeProduct(page);
        await application(page, identity.key).click();
        await card(page, identity.key).waitFor();
        assert.equal(
          await viewNode(page, "matcha")
            .locator("[data-new-hero-product]:visible")
            .count(),
          1,
        );
        assert.equal(
          await card(page, identity.key)
            .getByRole("heading", {
              level: 2,
              name: identity.name,
              exact: true,
            })
            .isVisible(),
          true,
        );
        const profile = card(page, identity.key).locator(
          "[data-new-hero-product-profile]",
        );
        await profile.locator("summary").click();
        assert.equal(await profile.locator("dd:visible").count(), 7);
        assert.equal(await add(page, identity.key).isDisabled(), true);
        assert.equal(
          await card(page, identity.key)
            .locator("[data-new-hero-format]")
            .count(),
          0,
        );
      }
    },
  );
  console.log(
    "All application profiles remain available without inventing purchasable formats when the catalog is unavailable",
  );

  await fixture(
    "390-dark-en",
    "matcha",
    { route: "/new-hero7/matcha#new-hero7-culinary" },
    async ({ page }) => {
      await markShell(page);
      const navigation = watchNavigation(page);
      assert.equal(await card(page, "culinary").count(), 1);
      await increase(page, "culinary").click();
      await closeProduct(page);
      const link = application(page, "barista");
      assert.equal(
        await link.getAttribute("href"),
        "/new-hero7/matcha#new-hero7-barista",
      );
      await link.click();
      await ready(page, "matcha");
      assert.equal(new URL(page.url()).hash, "#new-hero7-barista");
      assert.equal(await card(page, "barista").count(), 1);
      await page.goBack();
      await ready(page, "matcha");
      assert.equal(new URL(page.url()).hash, "");
      assert.equal(await productDialog(page).count(), 0);
      await page.goForward();
      await ready(page, "matcha");
      assert.equal(await card(page, "barista").count(), 1);
      await closeProduct(page);
      await chooseApplication(page, "culinary");
      assert.equal(await quantity(page, "culinary").textContent(), "2");
      await closeProduct(page);
      await chooseApplication(page, "barista");
      await sameShell(page);
      navigation.stop();
      assert.deepEqual(navigation.requests, []);
      await page.reload({ waitUntil: "domcontentloaded" });
      await ready(page, "matcha");
      assert.equal(await card(page, "barista").count(), 1);
    },
  );
  console.log(
    "Dedicated matcha routes resolve and switch exact hash applications with history and retained order state",
  );

  await fixture(
    "390-light-en",
    "matcha",
    { holdScripts: true, route: "/new-hero7/matcha" },
    async (test) => {
      const { page } = test;
      const trigger = application(page, "barista");
      await trigger.waitFor();
      await page.evaluate(() => document.fonts.ready);
      await trigger.scrollIntoViewIfNeeded();
      const before = await page.evaluate(() => scrollY);
      assert.equal(
        await trigger.getAttribute("href"),
        "/new-hero7/matcha#new-hero7-barista",
      );
      await trigger.click({ noWaitAfter: true });
      await eventually(
        () =>
          Promise.resolve(new URL(page.url()).hash === "#new-hero7-barista"),
        "The native product hash works before hydration",
      );
      assert.equal(
        await page.evaluate(() => scrollY),
        before,
        "A native hash never scrolls to a hidden product reader",
      );
      test.releaseScripts();
      await ready(page, "matcha");
      assert.equal(
        await productDialog(page).evaluate((node) => node.matches(":modal")),
        true,
      );
      assert.equal(
        await page.evaluate(() => scrollY),
        before,
        "Hydration opens the native popup without a gallery jump",
      );
      await closeProduct(page);
      assert.equal(new URL(page.url()).hash, "");
    },
  );
  console.log(
    "Dedicated product hashes become actual popups without a pre-hydration scroll jump",
  );

  await fixture("390-light-en", "home", { holdScripts: true }, async (test) => {
    const { page } = test;
    await root(page).waitFor();
    await eventually(
      () => test.scriptRequests() > 0,
      "Hydration is held for native query entry",
    );
    const link = page.locator("[data-new-hero7-explore]");
    assert.equal(await link.getAttribute("href"), path("matcha"));
    assert.equal(test.catalogReads(), 0);
    await link.click({ noWaitAfter: true });
    await page.waitForURL(`${baseURL}${path("matcha")}`, {
      waitUntil: "commit",
    });
    await viewNode(page, "matcha").waitFor();
    assert.equal(
      test.catalogReads(),
      0,
      "Direct query views render before client catalog requests",
    );
    assert.equal(
      await header(page)
        .locator('[data-nav-action="matcha"]')
        .first()
        .getAttribute("href"),
      "/new-hero7",
    );
    test.releaseScripts();
    await ready(page, "matcha");
  });
  console.log(
    "Native query links and direct view rendering work before hydration",
  );

  await fixture(
    "390-light-en",
    "matcha",
    { application: "culinary", beforeNavigation: includeSmallFormats },
    async (test) => {
      const { page } = test;
      for (const key of ["ceremonial", "barista"]) {
        await chooseApplication(page, key);
        await card(page, key)
          .getByRole("button", { name: "100 g", exact: true })
          .click();
        await increase(page, key).click();
      }
      await increase(page, "barista").click();
      await navigate(page, "samples");
      await sample(page)
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await navigate(page, "home");
      await navigate(page, "matcha");
      await chooseApplication(page, "ceremonial");
      assert.equal(await quantity(page, "ceremonial").textContent(), "2");
      for (const key of ["ceremonial", "barista"]) {
        await chooseApplication(page, key);
        assert.equal(
          await card(page, key)
            .getByRole("button", { name: "100 g", exact: true })
            .getAttribute("aria-pressed"),
          "true",
          "Each product retains its own format between views",
        );
      }
      assert.equal(await quantity(page, "barista").textContent(), "3");
      const reads = test.catalogReads();
      await closeProduct(page);
      await page.locator("footer [data-theme-switcher]").click();
      await page.locator("footer [data-language-switcher]").selectOption("ja");
      assert.equal(await root(page).getAttribute("data-tone"), "dark");
      await chooseApplication(page, "barista");
      assert.equal(await quantity(page, "barista").textContent(), "3");
      assert.equal(
        test.catalogReads(),
        reads,
        "Appearance changes preserve the catalog",
      );
      await closeProduct(page);
      await page.locator("footer [data-language-switcher]").selectOption("en");
      await chooseApplication(page, "barista");
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
            .locator('output[aria-label="Quantity"]')
            .textContent()) === "3",
        "Canonical product details keep the selected quantity",
      );
      assert.equal(
        await retail
          .getByRole("button", { name: "100 g", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      await page.goBack();
      await ready(page, "matcha");
      assert.equal(await quantity(page, "barista").textContent(), "3");
      await navigate(page, "samples");
      assert.equal(
        await sample(page)
          .locator('output[aria-label="Set quantity"]')
          .textContent(),
        "2",
      );
      await navigate(page, "home");
      for (const identity of SAMPLE_SET_CONTENTS)
        assert.equal(
          await page
            .locator(`[data-new-hero-reorder="${identity.key}"]`)
            .getAttribute("href"),
          `/shop/${identity.productHandle}?format=1kg`,
        );
      await page.locator('[data-new-hero-reorder="barista"]').click();
      await retail.waitFor();
      await eventually(
        async () =>
          (await retail
            .getByRole("button", { name: "1 kg", exact: true })
            .getAttribute("aria-pressed")) === "true",
        "The explicit repeat link overrides a remembered smaller format",
      );
    },
  );
  console.log(
    "Deep entry, independent quantities, appearance changes, canonical details and repeat-order destinations",
  );

  await fixture("390-light-en", "samples", {}, async (test) => {
    const { page } = test;
    const orders = [];
    await test.context.route("**/api/cart", (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      const action = route.request().postDataJSON();
      orders.push(action);
      const isSample = action.productHandle === SAMPLE_SET_OFFER.productHandle;
      const title = isSample ? "Sample Set" : SAMPLE_SET_CONTENTS[0].name;
      const total = `¥${(action.quantity * 6000).toLocaleString("en")}`;
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
                lineKey: "in-place-fixture-order",
                productHandle: action.productHandle,
                productTitle: title,
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
    await markShell(page);
    const drawer = page.getByRole("dialog").filter({
      has: page.getByRole("button", { name: "Close cart", exact: true }),
    });
    for (const view of ["samples", "matcha"]) {
      if (view === "matcha") {
        await navigate(page, "matcha");
        await chooseApplication(page, "ceremonial");
      }
      if (view === "samples")
        await sample(page)
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
      else await increase(page, "ceremonial").click();
      const button =
        view === "samples" ? sampleAdd(page) : add(page, "ceremonial");
      await button.focus();
      await button.evaluate((node) => {
        node.click();
        node.click();
      });
      await drawer.waitFor();
      assert.ok((await drawer.textContent()).includes("¥12,000"));
      assert.equal(await viewNode(page, view).count(), 1);
      await page.keyboard.press("Escape");
      await eventually(
        () => button.evaluate((node) => node === document.activeElement),
        "Cart dismissal returns focus to its visible purchase control",
      );
      await sameShell(page);
    }
    assert.deepEqual(orders, [
      {
        action: "add",
        productHandle: SAMPLE_SET_OFFER.productHandle,
        variantKey: `v1_${"s".repeat(43)}`,
        quantity: 2,
      },
      {
        action: "add",
        productHandle: SAMPLE_SET_CONTENTS[0].productHandle,
        variantKey: `v1_${"a".repeat(43)}`,
        quantity: 2,
      },
    ]);
    // Browser history can dismiss the lower product while its cart remains open.
    await add(page, "ceremonial").click();
    await drawer.waitFor();
    await page.goBack();
    await ready(page, "matcha");
    assert.equal(await productDialog(page).count(), 0);
    assert.equal(await drawer.isVisible(), true);
    assert.equal(
      await page.evaluate(
        () =>
          getComputedStyle(document.documentElement).overflow === "hidden" ||
          getComputedStyle(document.body).overflow === "hidden",
      ),
      true,
      "The cart retains its scroll lock when history closes the lower popup",
    );
    await page.keyboard.press("Escape");
    await drawer.waitFor({ state: "hidden" });
    await eventually(
      () =>
        page.evaluate(
          () =>
            getComputedStyle(document.documentElement).overflow !== "hidden" &&
            getComputedStyle(document.body).overflow !== "hidden",
        ),
      "Closing the remaining cart releases every popup scroll lock",
    );
    await chooseApplication(page, "ceremonial");
    await add(page, "ceremonial").click();
    await drawer.waitFor();
    await page.goBack();
    await ready(page, "matcha");
    await page.goForward();
    await eventually(
      () =>
        Promise.resolve(
          new URL(page.url()).searchParams.get("application") === "ceremonial",
        ),
      "Forward restores the product URL while the cart remains open",
    );
    assert.equal(
      await productDialog(page).count(),
      0,
      "History cannot reopen a product above the active cart",
    );
    assert.equal(await drawer.isVisible(), true);
    assert.equal(
      await drawer.evaluate((node) => node.contains(document.activeElement)),
      true,
      "The active cart keeps keyboard focus during product history traversal",
    );
    await drawer
      .getByRole("button", { name: "Close cart", exact: true })
      .click();
    await drawer.waitFor({ state: "hidden" });
    await ready(page, "matcha");
    assert.equal(await quantity(page, "ceremonial").textContent(), "2");
    await eventually(
      () =>
        productDialog(page).evaluate((node) =>
          node.contains(document.activeElement),
        ),
      "The deferred product popup opens and receives focus after cart dismissal",
    );
    await closeProduct(page);
    await eventually(
      () =>
        page.evaluate(
          () =>
            getComputedStyle(document.documentElement).overflow !== "hidden" &&
            getComputedStyle(document.body).overflow !== "hidden",
        ),
      "Deferred popup dismissal releases both scroll locks",
    );
    await navigate(page, "samples");
    await navigate(page, "matcha");
    assert.equal(orders.length, 4, "Retained views never replay an order");
  });
  console.log(
    "Sample and product fixture orders retain the visible view, prevent duplicates and restore focus",
  );

  for (const view of ["matcha", "samples"]) {
    await fixture("390-dark-en", view, { holdMutation: true }, async (test) => {
      const { page } = test;
      await markShell(page);
      if (view === "matcha") await chooseApplication(page, "barista");
      const button = view === "matcha" ? add(page, "barista") : sampleAdd(page);
      await button.click();
      await eventually(
        () => test.simulatedWrites.length === 1,
        "Only the held fixture receives the explicit order",
      );
      const before = page.url();
      for (const link of await root(page).locator("a:visible").all())
        await link.evaluate((node) => node.click());
      assert.equal(
        page.url(),
        before,
        "Pending cart mutation blocks view and route changes",
      );
      assert.equal(await viewNode(page, view).count(), 1);
      assert.equal(await button.isDisabled(), true);
      if (view === "matcha") {
        await page.keyboard.press("Escape");
        assert.equal(
          await productDialog(page).count(),
          1,
          "A pending order keeps its product popup open",
        );
        assert.equal(page.url(), before);
      }
      assert.equal(test.simulatedWrites.length, 1);
      assert.deepEqual(test.simulatedWrites[0], {
        action: "add",
        productHandle:
          view === "matcha"
            ? SAMPLE_SET_CONTENTS[1].productHandle
            : SAMPLE_SET_OFFER.productHandle,
        variantKey: `v1_${(view === "matcha" ? "b" : "s").repeat(43)}`,
        quantity: 1,
      });
      test.releaseMutation();
      await eventually(
        () => button.isEnabled(),
        "Rejected fixture order restores controls",
      );
      await navigate(page, view === "matcha" ? "samples" : "matcha");
      await sameShell(page);
    });
  }
  console.log(
    "Pending cart mutations guard in-place navigation and recover after rejection",
  );

  await fixture("390-light-en", "matcha", {}, async ({ page }) => {
    await markShell(page);
    await navigate(page, "samples");
    await page
      .getByRole("button", {
        name: "Inspect Ceremonial Matcha label",
        exact: true,
      })
      .click();
    const inspection = page.locator("[data-sample-label-dialog][open]");
    await inspection.waitFor();
    await page.goBack();
    await ready(page, "matcha");
    await inspection.waitFor({ state: "hidden" });
    await eventually(
      () =>
        page.evaluate(
          () =>
            getComputedStyle(document.documentElement).overflow !== "hidden" &&
            getComputedStyle(document.body).overflow !== "hidden",
        ),
      "Leaving an inspected panel releases the page scroll lock",
    );
    await eventually(
      () =>
        viewNode(page, "matcha")
          .locator("h1")
          .evaluate((node) => node === document.activeElement),
      "An outgoing inspection cannot steal focus from the incoming view",
    );
    await chooseApplication(page, "barista");
    await increase(page, "barista").click();
    assert.equal(await quantity(page, "barista").textContent(), "2");
    await sameShell(page);
    await navigate(page, "samples");
    assert.equal(
      await page.locator("[data-sample-label-dialog][open]").count(),
      0,
      "Returning to Samples does not reopen its dismissed inspection",
    );
  });
  console.log(
    "Browser Back dismisses the outgoing panel inspection without retaining scroll locks or focus",
  );

  await fixture("320-light-en", "home", {}, async ({ page }) => {
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    for (const view of views) {
      if (view !== "home") await navigate(page, view);
      await noOverflow(page, `320px / 200% text / ${view}`);
      if (view === "matcha") {
        await chooseApplication(page, "ceremonial");
        await noOverflow(page, "320px / 200% text / application popup");
      }
      for (const control of await root(page)
        .locator(
          "[data-new-hero-format]:visible,[data-new-hero-add] button:visible,[data-sample-purchase] button:visible,[data-sample-purchase] output:visible,[data-new-hero-reorder]:visible",
        )
        .all()) {
        await control.scrollIntoViewIfNeeded();
        assert.equal(
          await control.evaluate(
            (node) =>
              node.scrollWidth <= node.clientWidth + 1 &&
              node.scrollHeight <= node.clientHeight + 1,
          ),
          true,
          "Enlarged buying controls remain readable",
        );
      }
      if (view === "matcha") {
        await noOverflow(page, "320px / 200% text / scrolled popup");
        const popupBounds = await productDialog(page).boundingBox();
        const closeBounds = await productClose(page).boundingBox();
        assert.ok(
          closeBounds.y >= popupBounds.y &&
            closeBounds.y + closeBounds.height <=
              popupBounds.y + popupBounds.height,
          "The close control stays reachable after enlarged purchase controls scroll",
        );
      }
      const motion = await viewNode(page, view).evaluate((node) => ({
        reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        moving: node
          .getAnimations({ subtree: true })
          .filter(
            (animation) =>
              animation.playState === "running" &&
              animation.effect?.getComputedTiming().duration > 1,
          ).length,
      }));
      assert.equal(motion.reduced, true);
      assert.equal(
        motion.moving,
        0,
        "Reduced motion disables view entrance animation",
      );
      await capture(page, `320-light-en-${view}-text-200-percent`);
    }
  });
  console.log(
    "All views remain readable at 320px with 200% text and reduced motion",
  );
} finally {
  await browser.close();
}
