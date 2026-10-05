/* Footer comparisons use an isolated catalog and mocked cart writes. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.FOOTER_STUDY_BASE_URL ?? "http://127.0.0.1:3100";
const screenshots = process.env.FOOTER_STUDY_SCREENSHOTS;
const layouts = ["index", "colophon", "compact", "rail", "directory"];
const products = [
  ["culinary", "Culinary", "jmm-storefront-test-matcha", "a", 1200],
  [
    "barista",
    "Barista",
    "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
    "b",
    2400,
  ],
  [
    "premium",
    "Premium",
    "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
    "c",
    3600,
  ],
].map(([id, title, handle, letter, priceMinor]) => ({
  id,
  title: `Japanese ${title} Matcha Powder — 1 kg`,
  handle,
  description: "Catalog content supplied by this isolated browser fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${letter.repeat(43)}`,
      title: "1 kg",
      available: true,
      priceMinor,
      currency: "JPY",
      options: [{ name: "Format", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));

async function setup(browser, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: width <= 760 ? "reduce" : "no-preference",
  });
  await context.addCookies([
    { name: "atoma-theme", value: "dark", url: baseURL },
  ]);
  await context.addInitScript(() => {
    window.__footerThemeWrites = [];
    const cookie = Object.getOwnPropertyDescriptor(
      Document.prototype,
      "cookie",
    );
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => cookie.get.call(document),
      set: (value) => {
        if (value.startsWith("atoma-theme="))
          window.__footerThemeWrites.push(value);
        cookie.set.call(document, value);
      },
    });
  });
  const state = { actions: [], errors: [], gate: null };
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const respond = (json) =>
      route.fulfill({ status: 200, contentType: "application/json", json });
    try {
      if (url.pathname.startsWith("/api/")) {
        assert.equal(url.origin, new URL(baseURL).origin);
        if (url.pathname === "/api/catalog" && request.method() === "GET")
          return respond({
            status: "ready",
            products,
            shopUrl: "https://example.invalid",
          });
        if (url.pathname === "/api/cart" && request.method() === "GET")
          return respond({ kind: "empty", checkoutEnabled: false });
        if (url.pathname === "/api/cart" && request.method() === "POST") {
          const action = request.postDataJSON();
          state.actions.push(action);
          assert.equal(action.action, "add");
          assert.equal(action.productHandle, products[1].handle);
          assert.equal(action.variantKey, products[1].variants[0].id);
          assert.equal(action.quantity, 2);
          if (state.gate) await state.gate;
          return respond({ kind: "rejected", checkoutEnabled: false });
        }
        assert.fail(
          `Unexpected API request: ${request.method()} ${url.pathname}`,
        );
      }
      assert.ok(
        ["GET", "HEAD"].includes(request.method()),
        "All writes must use the mocked cart",
      );
      return route.continue();
    } catch (error) {
      state.errors.push(error.message);
      return route.abort("blockedbyclient");
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  page.setDefaultNavigationTimeout(30_000);
  page.on("pageerror", (error) => state.errors.push(error.message));
  return { context, page, state };
}

async function eventually(check, message) {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function assertFocus(locator, message) {
  await eventually(
    () => locator.evaluate((element) => element === document.activeElement),
    message,
  );
}

async function assertNoOverflow(page) {
  const sizes = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(
    Math.max(sizes.document, sizes.body) <= sizes.viewport + 1,
    `The footer study must fit horizontally: ${JSON.stringify(sizes)}`,
  );
}

async function assertBelowFold(page) {
  const geometry = await page.evaluate(() => ({
    scrollY,
    viewport: innerHeight,
    heroHeight: document
      .querySelector('main[data-concept="01"]')
      .getBoundingClientRect().height,
    footerTop: document
      .querySelector("[data-site-footer]")
      .getBoundingClientRect().top,
  }));
  assert.ok(geometry.scrollY < 2, "The study must be at the top of the page");
  assert.ok(
    geometry.heroHeight >= geometry.viewport - 1,
    `The homepage must retain its full viewport composition: ${JSON.stringify(geometry)}`,
  );
  assert.ok(
    geometry.footerTop >= geometry.viewport - 1,
    `The footer must remain below the initial viewport: ${JSON.stringify(geometry)}`,
  );
}

async function assertPlannedUtilities(footer) {
  const preview = footer.locator("[data-footer-utility-preview]");
  assert.equal(await preview.count(), 1);
  for (const label of ["Privacy policy", "Terms", "Contact"])
    assert.equal(await preview.getByText(label, { exact: true }).count(), 1);
  assert.doesNotMatch(await preview.textContent(), /planned links/i);
  assert.deepEqual(
    await preview.evaluate((element) =>
      [element, ...element.querySelectorAll("*")]
        .filter(
          (node) =>
            node.matches(
              'a, button, input, select, textarea, [role="link"], [role="button"]',
            ) || node.tabIndex >= 0,
        )
        .map((node) => node.outerHTML),
    ),
    [],
    "Planned utility destinations must not become links, buttons or tab stops",
  );
}

async function capture(page, name) {
  if (!screenshots) return;
  await mkdir(screenshots, { recursive: true });
  await page.screenshot({ path: resolve(screenshots, `${name}.png`) });
}

async function selectView(page, name) {
  await page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name, exact: true })
    .click();
  const mode = name === "Shop" ? "builder" : name.toLowerCase();
  await page.locator(`[data-embedded][data-mode="${mode}"]`).waitFor();
}

async function assertSelection(page) {
  assert.equal(
    await page
      .getByRole("group", { name: "Matcha to explore", exact: true })
      .getByRole("button", { name: "Select Barista Matcha", exact: true })
      .getAttribute("aria-pressed"),
    "true",
    "Footer comparisons must retain the selected matcha",
  );
  assert.equal(
    Number(await page.getByLabel("Quantity", { exact: true }).textContent()),
    2,
  );
  assert.equal(
    await page.evaluate(
      () =>
        window.__footerHero ===
          document.querySelector('main[data-concept="01"]') &&
        window.__footerRenderer === document.querySelector("[data-renderer]"),
    ),
    true,
    "Footer layout and appearance changes must retain the mounted hero and renderer",
  );
}

async function assertIndependentTheme(context, page) {
  assert.equal(
    (await context.cookies(baseURL)).find(
      (cookie) => cookie.name === "atoma-theme",
    )?.value,
    "dark",
    "Study appearance must preserve the storefront preference",
  );
  assert.deepEqual(
    await page.evaluate(() => window.__footerThemeWrites),
    [],
    "Study appearance must never write the persistent theme cookie",
  );
}

async function runCase(browser, width, height) {
  const { context, page, state } = await setup(browser, width, height);
  let release;
  try {
    await page.goto(`${baseURL}/footer-study`, {
      waitUntil: "domcontentloaded",
    });
    const study = page.locator("[data-footer-study]");
    const footer = page.locator("[data-site-footer]");
    const layout = page.getByRole("combobox", {
      name: "Footer layout",
      exact: true,
    });
    const appearance = page.getByRole("combobox", {
      name: "Study appearance",
      exact: true,
    });
    const viewFooter = page.getByRole("button", {
      name: "View footer",
      exact: true,
    });
    await study.waitFor();
    assert.equal(await study.getAttribute("data-footer-direction"), "index");
    assert.equal(await study.getAttribute("data-tone"), "light");
    assert.equal(await footer.evaluate((element) => element.tagName), "FOOTER");
    assert.equal(
      await footer.evaluate((element) => Boolean(element.closest("main"))),
      false,
    );
    const enter = page.getByRole("button", {
      name: "Explore matcha from the silver bag",
      exact: true,
    });
    await page.locator("[data-renderer]").waitFor({ state: "attached" });
    await assertBelowFold(page);
    await capture(page, `${width}-initial-fold`);
    await enter.click();
    const experience = page.locator("[data-embedded]");
    await experience.waitFor();
    for (const [attribute, value] of [
      ["data-material-object", "silver-bag"],
      ["data-selector-placement", "left"],
      ["data-selector-variant", "slides"],
      ["data-section-selector-variant", "tabs"],
      ["data-shop-preview-variant", "refined"],
    ])
      assert.equal(await experience.getAttribute(attribute), value);
    await page.locator("[data-renderer]").waitFor({ state: "attached" });
    await page
      .getByRole("group", { name: "Matcha to explore", exact: true })
      .getByRole("button", { name: "Select Barista Matcha", exact: true })
      .click();
    await selectView(page, "Origins");
    await page.locator('[data-origin-preview="panorama"]').waitFor();
    await selectView(page, "Shop");
    await page
      .getByRole("button", { name: "Increase quantity", exact: true })
      .click();
    await page.evaluate(() => {
      window.__footerHero = document.querySelector('main[data-concept="01"]');
      window.__footerRenderer = document.querySelector("[data-renderer]");
    });

    for (const tone of ["light", "dark"]) {
      await appearance.selectOption(tone);
      for (const direction of layouts) {
        await layout.selectOption(direction);
        assert.equal(
          await study.getAttribute("data-footer-direction"),
          direction,
        );
        assert.equal(
          await footer.getAttribute("data-footer-direction"),
          direction,
        );
        assert.equal(await study.getAttribute("data-tone"), tone);
        assert.equal(
          await page
            .locator('main[data-concept="01"]')
            .getAttribute("data-tone"),
          tone,
        );
        await assertSelection(page);
        await assertIndependentTheme(context, page);
        await assertPlannedUtilities(footer);
        await viewFooter.click();
        await assertFocus(
          footer,
          "View footer must focus the footer for keyboard visitors",
        );
        await eventually(
          () =>
            footer.evaluate((element) => {
              const bounds = element.getBoundingClientRect();
              const toolbar = document
                .querySelector("[data-footer-study] > header")
                .getBoundingClientRect();
              return (
                bounds.top >= toolbar.bottom - 1 &&
                bounds.top <=
                  Math.max(toolbar.bottom + 12, innerHeight - bounds.height) +
                    1 &&
                scrollY > 0
              );
            }),
          "View footer must expose the footer below the sticky study toolbar",
        );
        await assertNoOverflow(page);
        await capture(page, `${width}-${tone}-${direction}`);
        await page.evaluate(() =>
          window.scrollTo({ top: document.documentElement.scrollHeight }),
        );
        await eventually(
          () =>
            footer.evaluate((element) => {
              const bounds = element.getBoundingClientRect();
              const toolbar = document
                .querySelector("[data-footer-study] > header")
                .getBoundingClientRect();
              return (
                bounds.bottom <= innerHeight + 1 &&
                bounds.bottom > toolbar.bottom
              );
            }),
          "Visitors must be able to scroll to the footer's bottom on every layout",
        );
        await capture(page, `${width}-${tone}-${direction}-bottom`);
        const nav = footer.getByRole("navigation", {
          name: "Footer navigation",
          exact: true,
        });
        assert.equal(
          await nav
            .getByRole("link", { name: /^Shop matcha/ })
            .getAttribute("href"),
          "/shop",
        );
        const origins = nav.getByRole("button", {
          name: /^Growing places/,
        });
        await origins.focus();
        await page.keyboard.press("Enter");
        const reader = page.getByRole("dialog", {
          name: "ATOMA Origins",
          exact: true,
        });
        await reader.waitFor();
        assert.equal(await reader.getAttribute("data-tone"), tone);
        await reader
          .getByRole("button", {
            name: "Return to Barista Matcha",
            exact: true,
          })
          .click();
        await reader.waitFor({ state: "hidden" });
        await assertFocus(
          origins,
          "Origins must restore focus to the footer entry",
        );
        assert.equal(new URL(page.url()).pathname, "/footer-study");
        await eventually(
          () => new URL(page.url()).hash === "",
          "Origins must restore the study URL",
        );
        await assertSelection(page);
        await footer.getByRole("button", { name: /^Back to top/ }).click();
        await assertFocus(
          page.locator("h1#footer-study-top"),
          "Back to top must focus the study heading",
        );
        await eventually(
          () => page.evaluate(() => window.scrollY < 2),
          "Back to top must reach the beginning of the study",
        );
        await assertBelowFold(page);
      }
    }

    state.gate = new Promise((done) => {
      release = done;
    });
    await page
      .getByRole("button", { name: "Add to cart", exact: true })
      .click();
    await eventually(
      () => state.actions.length === 1,
      "The selected order must reach the mocked cart",
    );
    assert.equal(await layout.isDisabled(), true);
    assert.equal(await appearance.isDisabled(), true);
    const shop = footer.getByRole("link", { name: /^Shop matcha/ });
    assert.equal(await shop.getAttribute("aria-disabled"), "true");
    assert.equal(
      await footer
        .getByRole("button", { name: /^Growing places/ })
        .isDisabled(),
      true,
    );
    await shop.focus();
    await page.keyboard.press("Enter");
    assert.equal(
      new URL(page.url()).pathname,
      "/footer-study",
      "Pending cart writes must block footer navigation",
    );
    release();
    await eventually(
      () => layout.isEnabled(),
      "Study controls must unlock after the mocked cart response",
    );
    await assertSelection(page);
    await assertIndependentTheme(context, page);
    await shop.click();
    await page.waitForURL(`${baseURL}/shop`);
    assert.deepEqual(state.errors, []);
    assert.equal(state.actions.length, 1);
  } catch (error) {
    console.error(
      JSON.stringify({
        url: page.url(),
        errors: state.errors,
        actions: state.actions.length,
      }),
    );
    await capture(page, `${width}-failure`);
    throw error;
  } finally {
    release?.();
    await context.close();
  }
}

const cases = [
  [
    "desktop layouts, independent themes, selection and footer navigation",
    1440,
    900,
  ],
  ["phone layouts, reduced motion, selection and footer navigation", 320, 740],
].filter(
  ([name]) =>
    !process.env.FOOTER_STUDY_FILTER ||
    new RegExp(process.env.FOOTER_STUDY_FILTER).test(name),
);
assert.ok(cases.length, "FOOTER_STUDY_FILTER must match at least one check");
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
  headless: true,
});
let failed = 0;
try {
  for (const [name, width, height] of cases) {
    try {
      await runCase(browser, width, height);
      console.log(`PASS ${name}`);
    } catch (error) {
      failed++;
      console.error(`FAIL ${name}\n${error.stack}`);
    }
  }
} finally {
  await browser.close();
}
console.log(`${cases.length - failed}/${cases.length} Footer checks passed`);
if (failed) process.exitCode = 1;
