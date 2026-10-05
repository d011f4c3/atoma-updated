/* Adopted storefront footer checks. Every commerce request and write is mocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL =
  process.env.STOREFRONT_FOOTER_BASE_URL ?? "http://127.0.0.1:3100";
const screenshots = process.env.STOREFRONT_FOOTER_SCREENSHOTS;
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

async function setup(
  browser,
  width,
  height,
  tone = "light",
  contextOptions = {},
) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: width <= 760 ? "reduce" : "no-preference",
    ...contextOptions,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
  ]);
  const state = { actions: [], errors: [], gate: null, imageGate: null };
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
      const asset = url.searchParams.get("url") ?? url.pathname;
      if (asset.endsWith("/product-exploration/silver-bag-hero-v3.png"))
        await state.imageGate;
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
  try {
    await eventually(
      () => locator.evaluate((element) => element === document.activeElement),
      message,
    );
  } catch (error) {
    error.message += `; active element: ${await locator.evaluate(() => document.activeElement?.outerHTML.slice(0, 300))}`;
    throw error;
  }
}

async function assertNoOverflow(page) {
  const sizes = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(
    Math.max(sizes.document, sizes.body) <= sizes.viewport + 1,
    `The Directory footer must fit horizontally: ${JSON.stringify(sizes)}`,
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
  assert.ok(
    geometry.scrollY < 2,
    "The homepage must be at the top of the page",
  );
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
    "Footer navigation must retain the selected matcha",
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
    "Footer navigation and appearance changes must retain the mounted hero and renderer",
  );
}

async function assertFooter(page, tone) {
  const footer = page.locator("[data-site-footer]");
  await footer.waitFor();
  assert.equal(await footer.count(), 1, "Each storefront has one site footer");
  assert.equal(await footer.getAttribute("data-footer-direction"), "directory");
  await assertPlannedUtilities(footer);
  const geometry = await footer.evaluate((element) => {
    const main = document.querySelector("main");
    const bounds = element.getBoundingClientRect();
    const mainBounds = main.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      tag: element.tagName,
      insideMain: Boolean(element.closest("main")),
      followsMain: Boolean(
        main.compareDocumentPosition(element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
      footerTop: bounds.top,
      mainBottom: mainBounds.bottom,
      color: style.color,
      background: style.backgroundColor,
      position: style.position,
    };
  });
  assert.equal(geometry.tag, "FOOTER");
  assert.equal(geometry.insideMain, false);
  assert.equal(geometry.followsMain, true);
  assert.ok(
    geometry.footerTop >= geometry.mainBottom - 1,
    `The footer must follow the existing main content: ${JSON.stringify(geometry)}`,
  );
  assert.equal(
    geometry.position,
    "static",
    "The footer uses document scrolling",
  );
  assert.equal(
    geometry.color,
    tone === "light" ? "rgb(38, 59, 52)" : "rgb(233, 238, 242)",
  );
  assert.equal(
    geometry.background,
    tone === "light" ? "rgb(241, 245, 239)" : "rgb(8, 11, 17)",
  );
  await assertNoOverflow(page);
  return footer;
}

async function changeTheme(page, tone) {
  const control = page.getByRole("switch", { name: "Dark mode", exact: true });
  await eventually(
    () => control.isEnabled(),
    "The theme control must finish hydration",
  );
  if (
    (await control.getAttribute("aria-checked")) !== String(tone === "dark")
  ) {
    const previousURL = page.url();
    const main = await page.locator("main").elementHandle();
    await control.focus();
    await page.keyboard.press("Space");
    await page.locator(`main[data-tone="${tone}"]`).waitFor();
    assert.equal(page.url(), previousURL);
    assert.equal(
      await main.evaluate(
        (element) => element === document.querySelector("main"),
      ),
      true,
      "Appearance changes must retain the current page",
    );
  }
  assert.equal(
    (await page.context().cookies(baseURL)).find(
      (cookie) => cookie.name === "atoma-theme",
    )?.value,
    tone,
  );
  return assertFooter(page, tone);
}

async function revealFooter(page, footer, name) {
  await footer.scrollIntoViewIfNeeded();
  await page.evaluate(() =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    }),
  );
  await eventually(
    () =>
      footer.evaluate(
        (element) => element.getBoundingClientRect().bottom <= innerHeight + 1,
      ),
    "Normal scrolling must reach the bottom of the footer",
  );
  assert.ok(await page.evaluate(() => scrollY > 0));
  await capture(page, name);
}

async function backToTop(page, footer) {
  const action = footer.getByRole("button", { name: /^Back to top/ });
  await action.focus();
  await page.keyboard.press("Enter");
  await assertFocus(
    page.locator("main [data-nav-brand]"),
    "Back to top must move keyboard focus to the storefront brand",
  );
  await eventually(
    () => page.evaluate(() => scrollY < 2),
    "Back to top must restore the beginning of the page",
  );
}

async function openAndReturnOrigins(page, footer, tone, selected = false) {
  const previousURL = page.url();
  const origins = footer.getByRole("button", { name: /^Growing places/ });
  await origins.focus();
  await page.keyboard.press("Enter");
  const reader = page.getByRole("dialog", {
    name: "ATOMA Origins",
    exact: true,
  });
  await reader.waitFor();
  assert.equal(await reader.getAttribute("data-tone"), tone);
  assert.equal(new URL(page.url()).hash, "#origins");
  await reader
    .getByRole("button", {
      name: selected ? "Return to Barista Matcha" : /^Return to /,
      exact: selected,
    })
    .click();
  await reader.waitFor({ state: "hidden" });
  // Native dialog closure precedes the provider's close event and focus restore.
  await reader.locator("[data-origins-content]").waitFor({ state: "detached" });
  await assertFocus(origins, "Origins must restore focus to its footer entry");
  await eventually(
    () => page.url() === previousURL,
    "Origins must restore the page URL",
  );
  // Finish the browser's history traversal and native dialog focus restoration
  // before sending a new keyboard activation to another control.
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
  );
  await assertFocus(origins, "Origins return must settle on its footer entry");
}

async function homepageCase(browser, width, height) {
  const { context, page, state } = await setup(browser, width, height);
  let release;
  try {
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await page.locator("[data-renderer]").waitFor({ state: "attached" });
    await page.locator('main[data-concept="01"]:not([inert])').waitFor();
    let footer = await assertFooter(page, "light");
    await assertBelowFold(page);
    await capture(page, `${width}-initial-fold`);
    await page
      .getByRole("button", {
        name: "Explore matcha from the silver bag",
        exact: true,
      })
      .click();
    await page.locator("[data-embedded]").waitFor();
    await page
      .getByRole("group", { name: "Matcha to explore", exact: true })
      .getByRole("button", { name: "Select Barista Matcha", exact: true })
      .click();
    await selectView(page, "Shop");
    await page
      .getByRole("button", { name: "Increase quantity", exact: true })
      .click();
    await page.evaluate(() => {
      window.__footerHero = document.querySelector('main[data-concept="01"]');
      window.__footerRenderer = document.querySelector("[data-renderer]");
    });
    for (const tone of ["light", "dark"]) {
      footer = await changeTheme(page, tone);
      await assertSelection(page);
      await revealFooter(page, footer, `${width}-${tone}-directory`);
      await openAndReturnOrigins(page, footer, tone, true);
      await assertSelection(page);
      await backToTop(page, footer);
      await assertBelowFold(page);
      await assertSelection(page);
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
    const shop = footer.getByRole("link", { name: /^Shop matcha/ });
    assert.equal(await shop.getAttribute("aria-disabled"), "true");
    for (const name of [/^Growing places/, /^Back to top/])
      assert.equal(
        await footer.getByRole("button", { name }).isDisabled(),
        true,
      );
    await shop.focus();
    await page.keyboard.press("Enter");
    assert.equal(new URL(page.url()).pathname, "/");
    release();
    await eventually(
      () => footer.getByRole("button", { name: /^Back to top/ }).isEnabled(),
      "Footer controls must unlock after the mocked cart response",
    );
    await assertSelection(page);
    assert.equal(await shop.getAttribute("href"), "/shop");
    await shop.click();
    await page.waitForURL(`${baseURL}/shop`);
    await assertFooter(page, "dark");
    await page.reload({ waitUntil: "domcontentloaded" });
    await assertFooter(page, "dark");
    assert.deepEqual(state.errors, []);
    assert.equal(state.actions.length, 1);
  } catch (error) {
    await capture(page, `${width}-home-failure`);
    throw error;
  } finally {
    release?.();
    await context.close();
  }
}

async function canonicalCase(browser, width, height) {
  const { context, page, state } = await setup(browser, width, height);
  try {
    for (const path of ["/shop", `/shop/${products[1].handle}`, "/origins"]) {
      await page.goto(`${baseURL}${path}`, { waitUntil: "domcontentloaded" });
      if (path === "/shop")
        await page
          .getByRole("region", { name: "Matcha collection", exact: true })
          .waitFor();
      else if (path.startsWith("/shop/"))
        await page
          .getByRole("heading", { name: "Barista Matcha", exact: true })
          .waitFor();
      for (const tone of ["light", "dark"]) {
        const footer = await changeTheme(page, tone);
        const name =
          path === "/shop"
            ? "shop"
            : path === "/origins"
              ? "origins"
              : "product";
        await revealFooter(page, footer, `${width}-${tone}-${name}`);
        await openAndReturnOrigins(
          page,
          footer,
          tone,
          path.startsWith("/shop/"),
        );
        await backToTop(page, footer);
      }
    }
    assert.deepEqual(state.errors, []);
    assert.equal(state.actions.length, 0);
  } catch (error) {
    await capture(page, `${width}-canonical-failure`);
    throw error;
  } finally {
    await context.close();
  }
}

async function isolationCase(browser) {
  const { context, page, state } = await setup(browser, 1440, 900, "dark");
  try {
    for (const path of [
      "/concept-03",
      "/selector-study",
      "/shop-study",
      "/origins-study",
      "/color-study",
    ]) {
      await page.goto(`${baseURL}${path}`, { waitUntil: "domcontentloaded" });
      await page.locator("main").waitFor();
      assert.equal(
        await page.locator("[data-site-footer]").count(),
        0,
        `${path} must retain its saved composition`,
      );
    }
    await page.goto(`${baseURL}/footer-study`, {
      waitUntil: "domcontentloaded",
    });
    const footer = page.locator("[data-site-footer]");
    await page.locator("[data-renderer]").waitFor({ state: "attached" });
    await page
      .getByRole("combobox", { name: "Footer layout", exact: true })
      .selectOption("directory");
    assert.equal(
      await footer.count(),
      1,
      "The footer study must retain its own single footer",
    );
    assert.equal(
      await footer.getAttribute("data-footer-direction"),
      "directory",
    );
    await assertPlannedUtilities(footer);
    await page
      .getByRole("combobox", { name: "Study appearance", exact: true })
      .selectOption("light");
    assert.equal(
      (await context.cookies(baseURL)).find(
        (cookie) => cookie.name === "atoma-theme",
      )?.value,
      "dark",
    );
    assert.deepEqual(state.errors, []);
  } finally {
    await context.close();
  }
}

async function loadingCase(browser) {
  const { context, page, state } = await setup(browser, 1440, 900);
  let release;
  state.imageGate = new Promise((done) => {
    release = done;
  });
  try {
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await page.locator("[data-hero-loader]").waitFor();
    await page.locator("main[inert]").waitFor({ state: "attached" });
    const footer = page.locator("[data-site-footer]");
    assert.equal(
      await footer.isVisible(),
      false,
      "The footer must remain hidden while the hero blocks interaction",
    );
    for (let index = 0; index < 4; index++) {
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() =>
          Boolean(document.activeElement?.closest("[data-site-footer]")),
        ),
        false,
        "The loading screen must not expose footer tab stops",
      );
    }
    release();
    await page.locator("[data-hero-loader]").waitFor({ state: "detached" });
    await assertFooter(page, "light");
    assert.deepEqual(state.errors, []);
  } finally {
    release();
    await context.close();
  }

  const fallback = await setup(browser, 320, 740, "light", {
    javaScriptEnabled: false,
  });
  try {
    await fallback.page.goto(baseURL, { waitUntil: "domcontentloaded" });
    const footer = await assertFooter(fallback.page, "light");
    await revealFooter(fallback.page, footer, "320-no-javascript-footer");
    assert.equal(
      await footer
        .getByRole("link", { name: /^Shop matcha/ })
        .getAttribute("href"),
      "/shop",
    );
    assert.deepEqual(fallback.state.errors, []);
  } finally {
    await fallback.context.close();
  }
}

const cases = [
  [
    "desktop homepage scroll, themes, selection, navigation and cart guards",
    () => homepageCase(browser, 1440, 900),
  ],
  [
    "320px homepage scroll, themes, selection and reduced motion",
    () => homepageCase(browser, 320, 740),
  ],
  [
    "desktop canonical collection, product and Origins footers",
    () => canonicalCase(browser, 1440, 900),
  ],
  [
    "320px canonical collection, product and Origins footers",
    () => canonicalCase(browser, 320, 740),
  ],
  [
    "saved concepts and studies remain independent",
    () => isolationCase(browser),
  ],
  [
    "loader keyboard isolation and no-JavaScript footer fallback",
    () => loadingCase(browser),
  ],
].filter(
  ([name]) =>
    !process.env.STOREFRONT_FOOTER_FILTER ||
    new RegExp(process.env.STOREFRONT_FOOTER_FILTER).test(name),
);
assert.ok(
  cases.length,
  "STOREFRONT_FOOTER_FILTER must match at least one check",
);
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
  headless: true,
});
let failed = 0;
try {
  for (const [name, run] of cases) {
    try {
      await run();
      console.log(`PASS ${name}`);
    } catch (error) {
      failed++;
      console.error(`FAIL ${name}\n${error.stack}`);
    }
  }
} finally {
  await browser.close();
}
console.log(
  `${cases.length - failed}/${cases.length} storefront footer checks passed`,
);
if (failed) process.exitCode = 1;
