/* Sample title studies: mocked catalog/cart reads; writes and external traffic blocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { translate } from "../src/lib/i18n/index.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.SAMPLE_TITLES_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.SAMPLE_TITLES_EVIDENCE ?? ".local/sample-titles-0151";
const filter = process.env.SAMPLE_TITLES_FILTER;
const layouts = ["glance", "rows", "folio"];
const titles = ["current", "plain", "register", "rule", "tab", "quantity"];
const products = SAMPLE_SET_CONTENTS.map((item, index) => ({
  id: item.key,
  handle: item.productHandle,
  title: item.name,
  productCode: item.productCode,
  description: "Isolated sample-page study fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
      title: "1 kg",
      available: true,
      priceMinor: 6123,
      currency: "JPY",
      options: [{ name: "Size", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));

await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
let passed = 0;

async function eventually(check, message) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function setup(width, locale = "en", cookieTone = "light") {
  const context = await browser.newContext({
    viewport: { width, height: width < 500 ? 800 : 900 },
    reducedMotion: "reduce",
    hasTouch: width < 500,
    isMobile: width < 500,
  });
  await context.addCookies([
    { name: "atoma-theme", value: cookieTone, url: baseURL },
    { name: "atoma-locale", value: locale, url: baseURL },
  ]);
  const errors = [];
  let mode = "ready";
  let catalogReads = 0;
  let cartReads = 0;
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      errors.push(`Unexpected external request or write: ${request.method()}`);
      return route.abort();
    }
    if (url.pathname === "/api/cart") {
      cartReads++;
      return route.fulfill({ json: { kind: "empty", checkoutEnabled: false } });
    }
    if (url.pathname === "/api/catalog") {
      catalogReads++;
      return mode === "failed"
        ? route.fulfill({
            status: 503,
            json: { status: "unavailable", products: [] },
          })
        : route.fulfill({
            json: {
              status: "ready",
              products,
              shopUrl: "https://example.invalid",
            },
          });
    }
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Unexpected API request: ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  return {
    context,
    page,
    errors,
    setMode: (next) => (mode = next),
    reads: () => ({ catalog: catalogReads, cart: cartReads }),
    cookieTone,
  };
}

async function fit(page, selector) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "No horizontal overflow",
  );
  const surfaces = page.locator(selector);
  for (const node of await surfaces.all()) {
    assert.equal(
      await node.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
      true,
      `${selector} is not clipped`,
    );
  }
}

async function isolatedTheme(fixture) {
  assert.equal(
    (await fixture.context.cookies()).find(
      (cookie) => cookie.name === "atoma-theme",
    )?.value,
    fixture.cookieTone,
    "Study theme leaves the canonical preference unchanged",
  );
}

async function purchase(page, locale = "en") {
  await page.locator("[data-sample-unavailable]").waitFor();
  const panel = page.locator("[data-sample-purchase]");
  assert.equal(await panel.count(), 1);
  assert.equal(await panel.getAttribute("aria-labelledby"), "samples-purchase");
  const title = page.locator("#samples-purchase");
  assert.equal(await title.count(), 1);
  assert.equal(await title.evaluate((element) => element.tagName), "H2");
  assert.equal(await title.getAttribute("tabindex"), "-1");
  assert.equal(
    (await title.innerText()).toLowerCase(),
    translate(locale, "Sample Set").toLowerCase(),
  );
  assert.equal(await panel.getByRole("heading", { level: 2 }).count(), 1);
  assert.ok((await panel.innerText()).includes("3 × 20 g"));
  assert.ok(
    (await panel.innerText()).includes(translate(locale, "60 g total")),
  );
  assert.equal(await panel.locator("[data-sample-order]").count(), 0);
  assert.equal(
    await panel.locator("[data-sample-unavailable] button").isDisabled(),
    true,
  );
  assert.doesNotMatch(await panel.innerText(), /[¥￥$]|JPY|4,800|1,000|6,123/);
  await fit(page, "[data-sample-purchase], #samples-purchase");
}

async function screenshot(page, name) {
  await page.screenshot({
    path: resolve(evidence, `${name}.png`),
    fullPage: true,
    animations: "disabled",
  });
}

async function run(name, args, check) {
  if (filter && !name.includes(filter)) return;
  const fixture = await setup(...args);
  try {
    await check(fixture);
    assert.deepEqual(fixture.errors, []);
    passed++;
    console.log(`${name}: passed`);
  } catch (error) {
    await screenshot(fixture.page, `${name}-failure`);
    throw error;
  } finally {
    await fixture.context.close();
  }
}

try {
  for (const width of [320, 1440])
    await run(`board-${width}`, [width], async (fixture) => {
      const { page } = fixture;
      await page.goto(`${baseURL}/samples-title-study`);
      const board = page.locator("[data-sample-title-study]");
      await board.waitFor();
      const appearance = page.getByRole("combobox", {
        name: "Study appearance",
        exact: true,
      });
      for (const tone of ["light", "dark"]) {
        await appearance.selectOption(tone);
        assert.equal(await board.getAttribute("data-tone"), tone);
        assert.equal(await board.locator("[data-sample-title]").count(), 12);
        for (const treatment of titles) {
          const previews = board.locator(`[data-sample-title="${treatment}"]`);
          assert.equal(
            await previews.count(),
            2,
            `${treatment} has full and compact examples`,
          );
          assert.equal(
            await previews.filter({ has: page.locator("h2") }).count(),
            2,
          );
          assert.equal(
            await board
              .locator(`[data-sample-title="${treatment}"][data-compact]`)
              .count(),
            1,
          );
          for (const preview of await previews.all()) {
            assert.ok((await preview.textContent()).includes("3 × 20 g"));
            assert.ok((await preview.textContent()).includes("60 g total"));
            assert.equal(
              await preview
                .getByRole("heading", {
                  level: 2,
                  name: "Sample Set",
                  exact: true,
                })
                .count(),
              1,
            );
          }
          const links = await board.locator("a").evaluateAll(
            (nodes, treatment) =>
              nodes
                .filter((node) => {
                  const url = new URL(node.href);
                  return (
                    url.pathname === "/samples-page-study" &&
                    url.searchParams.get("layout") === "glance" &&
                    url.searchParams.get("title") === treatment
                  );
                })
                .map((node) => node.getAttribute("href")),
            treatment,
          );
          assert.ok(
            links.length >= 1,
            `${treatment} links to its in-context view`,
          );
        }
        await fit(
          page,
          "[data-sample-title-study], [data-sample-title], [data-sample-title] h2",
        );
        await isolatedTheme(fixture);
        await screenshot(page, `board-${width}-${tone}`);
      }
    });

  for (const width of [320, 1440])
    await run(`context-${width}`, [width], async (fixture) => {
      const { page } = fixture;
      await page.goto(`${baseURL}/samples-page-study`);
      await purchase(page);
      const titlesSelect = page.getByRole("combobox", {
        name: "Panel title",
        exact: true,
      });
      const appearance = page.getByRole("combobox", {
        name: "Study appearance",
        exact: true,
      });
      const layoutSelect = page.getByRole("combobox", {
        name: "Page layout",
        exact: true,
      });
      const study = page.locator("[data-samples-page-study]");
      const initialReads = fixture.reads();
      const navigationCount = await page.evaluate(
        () => performance.getEntriesByType("navigation").length,
      );
      const purchaseNode = await page
        .locator("[data-sample-purchase]")
        .elementHandle();
      for (const tone of ["light", "dark"]) {
        await appearance.selectOption(tone);
        for (const layout of layouts) {
          await layoutSelect.selectOption(layout);
          for (const treatment of titles) {
            await titlesSelect.selectOption(treatment);
            assert.equal(
              await study.getAttribute("data-title-treatment"),
              treatment,
            );
            assert.equal(await study.getAttribute("data-layout"), layout);
            await purchase(page);
            assert.equal(
              await page
                .locator("[data-sample-purchase]")
                .evaluate((node, initial) => node === initial, purchaseNode),
              true,
              "Title changes preserve the purchase component",
            );
            assert.deepEqual(
              fixture.reads(),
              initialReads,
              "Title/layout changes do not refetch commerce",
            );
            assert.equal(
              await page.evaluate(
                () => performance.getEntriesByType("navigation").length,
              ),
              navigationCount,
            );
            await fit(page, "[data-samples-page-study], [data-sample-title]");
            await isolatedTheme(fixture);
            if (layout === "glance" || treatment === "register")
              await screenshot(
                page,
                `context-${width}-${tone}-${layout}-${treatment}`,
              );
          }
        }
      }
      await page.bringToFront();
      await titlesSelect.focus();
      assert.equal(
        await titlesSelect.evaluate((node) => node === document.activeElement),
        true,
        "Keyboard focus reaches the title selector",
      );
      // Native macOS selects support typeahead consistently; Home does not
      // select the first option on the desktop control.
      await page.keyboard.press("r");
      await page.keyboard.press("Enter");
      await eventually(
        async () =>
          (await study.getAttribute("data-title-treatment")) === "register",
        "Title selector is keyboard operable",
      );
      assert.equal(
        await titlesSelect.evaluate((node) => node === document.activeElement),
        true,
      );
    });

  for (const locale of ["ja", "zh-Hant"])
    await run(`localized-${locale}`, [320, locale], async (fixture) => {
      const { page } = fixture;
      await page.goto(`${baseURL}/samples-title-study`);
      await page.locator("[data-sample-title-study]").waitFor();
      for (const title of await page.locator("[data-sample-title]").all()) {
        assert.ok(
          (await title.textContent()).includes(translate(locale, "Sample Set")),
        );
        assert.ok(
          (await title.textContent()).includes(translate(locale, "60 g total")),
        );
      }
      await fit(
        page,
        "[data-sample-title-study], [data-sample-title], [data-sample-title] h2",
      );
      await screenshot(page, `board-320-${locale}`);
      await page.goto(`${baseURL}/samples-page-study?layout=folio`);
      await purchase(page, locale);
      const selector = page.getByRole("combobox", {
        name: "Panel title",
        exact: true,
      });
      for (const treatment of titles) {
        await selector.selectOption(treatment);
        await purchase(page, locale);
        await fit(page, "[data-samples-page-study], [data-sample-title]");
        await screenshot(page, `context-320-${locale}-folio-${treatment}`);
      }
    });

  await run("retry-and-canonical", [320], async (fixture) => {
    const { page } = fixture;
    fixture.setMode("failed");
    await page.goto(
      `${baseURL}/samples-page-study?layout=folio&title=register`,
    );
    await page.getByRole("button", { name: /Try again/ }).waitFor();
    await page
      .getByRole("combobox", { name: "Panel title", exact: true })
      .selectOption("quantity");
    const retry = page.getByRole("button", { name: /Try again/ });
    await retry.focus();
    const before = fixture.reads().catalog;
    fixture.setMode("ready");
    await page.keyboard.press("Enter");
    await purchase(page);
    assert.ok(fixture.reads().catalog > before);
    assert.equal(
      await page
        .locator("#samples-purchase")
        .evaluate((node) => node === document.activeElement),
      true,
      "Retry restores focus to the current actual heading",
    );
    assert.equal(
      await page
        .locator("[data-samples-page-study]")
        .getAttribute("data-title-treatment"),
      "quantity",
    );
    await page.goto(`${baseURL}/samples`);
    await purchase(page);
    assert.equal(
      await page.locator("[data-sample-title]").count(),
      0,
      "Canonical page does not receive a title treatment",
    );
    const canonical = await page
      .locator("[data-sample-purchase]")
      .evaluate((node) =>
        [...node.children]
          .slice(0, 3)
          .map((child) => ({ tag: child.tagName, id: child.id })),
      );
    assert.deepEqual(
      canonical,
      [
        { tag: "P", id: "" },
        { tag: "H2", id: "samples-purchase" },
        { tag: "P", id: "" },
      ],
      "Canonical p/h2/p structure remains unchanged",
    );
  });

  await run("query-fallbacks", [320], async ({ page }) => {
    for (const treatment of titles) {
      await page.goto(
        `${baseURL}/samples-page-study?layout=glance&title=${treatment}`,
      );
      await purchase(page);
      assert.equal(
        await page
          .locator("[data-samples-page-study]")
          .getAttribute("data-title-treatment"),
        treatment,
      );
    }
    for (const query of [
      "",
      "title=unknown",
      "title=__proto__",
      "title=constructor",
      "title=prototype",
      "title=REGISTER",
      "title=register&title=quantity",
    ]) {
      await page.goto(
        `${baseURL}/samples-page-study?layout=folio${query ? `&${query}` : ""}`,
      );
      await purchase(page);
      assert.equal(
        await page
          .locator("[data-samples-page-study]")
          .getAttribute("data-title-treatment"),
        "current",
        `${query} falls back to Current`,
      );
      assert.equal(
        await page
          .locator("[data-samples-page-study]")
          .getAttribute("data-layout"),
        "folio",
      );
      await fit(page, "[data-samples-page-study]");
    }
  });
} finally {
  await browser.close();
}
console.log(`${passed} sample-title scenarios passed; all writes blocked`);
