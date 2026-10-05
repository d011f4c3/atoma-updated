/* Origins layouts use an isolated public catalog; every commerce write is blocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.ORIGINS_STUDY_BASE_URL ?? "http://127.0.0.1:3100";
const screenshots = process.env.ORIGINS_STUDY_SCREENSHOTS;
const layouts = ["sheet", "split", "index", "panorama", "record"];
const products = [
  {
    id: "culinary",
    handle: "jmm-storefront-test-matcha",
    title: "Japanese Culinary Matcha Powder for Cafés & Baking — 1 kg",
  },
  {
    id: "barista",
    handle: "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
    title: "Japanese Barista Matcha Powder for Lattes — 1 kg",
  },
  {
    id: "premium",
    handle: "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
    title: "Japanese Premium Matcha Powder for Tea Service — 1 kg",
  },
].map((product, index) => ({
  ...product,
  description: "Public catalog content from an isolated browser fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
      title: "1 kg",
      available: true,
      priceMinor: (index + 1) * 1200,
      currency: "JPY",
      options: [{ name: "Format", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));

async function setup(browser, width, height, catalog = products) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: width > 760 ? "no-preference" : "reduce",
  });
  const state = { errors: [], catalogReads: 0, writes: [] };
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    try {
      assert.ok(
        ["GET", "HEAD"].includes(request.method()),
        "This exploration must not write to commerce",
      );
      if (url.pathname.startsWith("/api/")) {
        assert.equal(url.origin, new URL(baseURL).origin);
        if (url.pathname === "/api/catalog") {
          state.catalogReads++;
          return route.fulfill({
            contentType: "application/json",
            json: {
              status: "ready",
              products: catalog,
              shopUrl: "https://example.invalid",
            },
          });
        }
        if (url.pathname === "/api/cart")
          return route.fulfill({
            contentType: "application/json",
            json: {
              kind: "empty",
              checkoutEnabled: false,
            },
          });
        assert.fail(`Unexpected API request: ${url.pathname}`);
      }
      return route.continue();
    } catch (error) {
      if (!["GET", "HEAD"].includes(request.method()))
        state.writes.push(url.pathname);
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

async function capture(page, name) {
  if (!screenshots) return;
  await eventually(
    () =>
      page
        .locator("[data-scramble-glyph]")
        .evaluateAll((glyphs) =>
          glyphs.every(
            (glyph) =>
              !glyph.getClientRects().length ||
              glyph.textContent === glyph.previousElementSibling?.textContent,
          ),
        ),
    "Visible text must settle before screenshots",
  );
  await mkdir(screenshots, { recursive: true });
  await page.screenshot({ path: resolve(screenshots, `${name}.png`) });
}

async function assertNoOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(
    Math.max(dimensions.document, dimensions.body) <= dimensions.viewport + 1,
    `No horizontal clipping: ${JSON.stringify(dimensions)}`,
  );
}

async function assertGrowerPlaceholder(scope) {
  const placeholder = scope.locator("[data-grower-placeholder]");
  assert.equal(await placeholder.count(), 1);
  assert.equal(await placeholder.isVisible(), true);
  assert.equal(
    await placeholder
      .getByRole("heading", { name: "Grower information", exact: true })
      .isVisible(),
    true,
  );
  assert.match(
    await placeholder.textContent(),
    /Grower details are not currently shared\./,
  );
  assert.equal(await placeholder.locator("a, button").count(), 0);
  const markup = await scope.evaluate((element) => element.outerHTML);
  assert.equal(
    /hayashi|hatakeyama|kitani/i.test(markup),
    false,
    "Origins must not disclose prior grower or partner identities in text, attributes or links",
  );
}

async function setStorefrontTone(page, tone) {
  const control = page.getByRole("switch", { name: "Dark mode", exact: true });
  await control.waitFor();
  if ((await control.getAttribute("aria-checked")) !== String(tone === "dark"))
    await control.click();
  await page.locator(`main[data-storefront-theme="${tone}"]`).waitFor();
}

async function reportFailure(page, state, name) {
  console.error(
    JSON.stringify({
      url: page.url(),
      ...state,
      ui: await page
        .locator("[data-origins-study], [data-embedded]")
        .evaluateAll((elements) =>
          elements.map((element) => ({ ...element.dataset })),
        ),
    }),
  );
  await capture(page, `${name}-failure`);
}

async function selectView(page, name) {
  const control = page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name, exact: true });
  await control.click();
  await page
    .locator(
      `[data-embedded][data-mode="${name === "Shop" ? "builder" : name.toLowerCase()}"]`,
    )
    .waitFor();
  // Silver-bag section changes keep their navigation control focused while the
  // material settles. Saved study scenes retain their heading-focus contract.
  if (
    (await page
      .locator("[data-embedded]")
      .getAttribute("data-material-object")) === "silver-bag"
  ) {
    assert.equal(
      await control.evaluate((element) => element === document.activeElement),
      true,
      "The silver-bag view transition must retain its section control focus",
    );
    return;
  }
  await eventually(
    () =>
      page
        .locator("[data-selection-controls] h2")
        .evaluateAll((headings) =>
          headings.some(
            (heading) =>
              heading.getClientRects().length > 0 &&
              heading === document.activeElement,
          ),
        ),
    "The selected view must finish moving focus to its visible heading",
  );
}

async function selectProduct(page, name) {
  const choice = page
    .getByRole("group", { name: "Matcha to explore", exact: true })
    .getByRole("button", { name: `Select ${name} Matcha`, exact: true });
  await choice.click();
  assert.equal(await choice.getAttribute("aria-pressed"), "true");
}

async function assertStorefront(page) {
  const header = page.locator(
    'main > header[data-navigation-variant="default"]',
  );
  await header.waitFor();
  await header.scrollIntoViewIfNeeded();
  const products = page.getByRole("group", {
    name: "Matcha to explore",
    exact: true,
  });
  assert.equal(
    await products.evaluate((element) =>
      Boolean(element.closest("[data-selection-controls]")),
    ),
    false,
  );
  const bounds = await products.boundingBox();
  const mobile = page.viewportSize().width <= 760;
  const controls = await (
    mobile
      ? page.getByRole("group", { name: "Shopping mode", exact: true })
      : page.locator("[data-selection-controls]")
  ).boundingBox();
  assert.ok(bounds && controls);
  assert.ok(
    mobile
      ? bounds.y + bounds.height <= controls.y + 1
      : bounds.x + bounds.width <= controls.x + 1,
    "Final Slides must remain separate from the right-side section controls",
  );
  const menu = header.locator('summary[aria-label="Menu"]');
  if (mobile) {
    await menu.focus();
    await page.keyboard.press("Enter");
    await header.locator("[data-navigation-index][open]").waitFor();
  }
  for (const control of await header.locator("[data-nav-action]").all()) {
    assert.equal(await control.isVisible(), true);
    assert.equal(
      await control.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return element.contains(
          document.elementFromPoint(
            box.x + box.width / 2,
            box.y + box.height / 2,
          ),
        );
      }),
      true,
      "Storefront navigation must accept pointer input",
    );
  }
  if (mobile) {
    await page.keyboard.press("Escape");
    assert.equal(
      await menu.evaluate((element) => element === document.activeElement),
      true,
    );
    assert.equal(
      await header.locator("[data-navigation-index]").getAttribute("open"),
      null,
    );
  }
}

async function assertPreview(page, layout, name) {
  const preview = page.locator(`[data-origin-preview="${layout}"]`);
  await preview.waitFor();
  assert.equal(
    await preview.locator("[data-homepage-product-name]").textContent(),
    `${name} Matcha`,
  );
  const place = preview.locator('[data-origin-place="wazuka"]');
  assert.equal(await preview.locator("[data-origin-place]").count(), 1);
  assert.equal(
    await place
      .getByRole("heading", { name: "Wazuka", exact: true })
      .isVisible(),
    true,
  );
  assert.match(await place.textContent(), /Grown in/);
  const geography = place.getByRole("list", {
    name: "Geographic hierarchy",
    exact: true,
  });
  assert.deepEqual(
    await geography
      .locator("li")
      .evaluateAll((items) => items.map((item) => item.textContent)),
    ["CountryJapan", "RegionKyoto", "LocalityWazuka"],
  );
  const photograph = place.getByRole("img");
  assert.equal(await photograph.count(), 1);
  await eventually(
    () =>
      photograph.evaluate((image) => image.complete && image.naturalWidth > 0),
    "The contextual origin photograph must load inline",
  );
  assert.match(await photograph.getAttribute("alt"), /tea|field/i);
  const caption = place.locator("figcaption");
  assert.match(await caption.textContent(), /Kyoto/);
  const aboutRegion = place.getByRole("button", {
    name: "About Wazuka",
    exact: true,
  });
  assert.equal(await aboutRegion.isVisible(), true);
  assert.equal(
    await preview.locator('a[href*=".pdf"]').count(),
    0,
    "Regional information stays inside the Origins experience",
  );
  const landscape = aboutRegion.locator("..");
  assert.match(await landscape.textContent(), /Wazuka River valley/);
  assert.ok(
    (await caption.textContent()).trim().length > 20,
    "Photography needs its contextual observation, not just a place title",
  );
  assert.equal(
    await page
      .getByRole("dialog", { name: "ATOMA Origins", exact: true })
      .count(),
    0,
  );
  await preview.evaluate((element) => {
    for (
      let parent = element.parentElement;
      parent;
      parent = parent.parentElement
    )
      parent.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  for (const visibleContent of [
    preview.locator("[data-homepage-product-name]"),
    photograph,
    caption,
    geography,
    landscape,
    ...(["panorama", "record"].includes(layout)
      ? [
          preview.getByRole("button", {
            name: "Explore the growing region",
            exact: true,
          }),
          preview.getByRole("button", {
            name: "Shop this matcha",
            exact: true,
          }),
        ]
      : []),
  ]) {
    const bounds = await visibleContent.boundingBox();
    const viewport = page.viewportSize();
    assert.ok(
      bounds &&
        bounds.y >= -1 &&
        bounds.y + bounds.height <= viewport.height + 1,
      `Origin identity, photograph, geography and new layout actions must be visible without opening a modal: ${JSON.stringify(bounds)}`,
    );
  }
  await assertNoOverflow(page);
  return preview;
}

const cases = [1366, 320].map((width) => [
  `origins study ${width}: inline evidence, layouts and order continuity`,
  async (browser) => {
    const { context, page, state } = await setup(
      browser,
      width,
      width === 1366 ? 768 : 700,
    );
    try {
      await page.goto(`${baseURL}/origins-study`, {
        waitUntil: "domcontentloaded",
      });
      const experience = page.locator("[data-embedded]");
      await page.locator('[data-origin-preview="panorama"]').waitFor();
      const layout = page.getByRole("combobox", {
        name: "Origins layout",
        exact: true,
      });
      assert.equal(await layout.inputValue(), "panorama");
      assert.deepEqual(
        await layout
          .locator("option")
          .evaluateAll((options) => options.map((option) => option.value)),
        ["current", ...layouts],
      );
      assert.equal(await experience.getAttribute("data-mode"), "origins");
      assert.equal(
        await experience.getAttribute("data-selector-placement"),
        "left",
      );
      assert.equal(
        await experience.getAttribute("data-selector-variant"),
        "slides",
      );
      assert.equal(
        await experience.getAttribute("data-section-selector-variant"),
        "tabs",
      );
      await assertStorefront(page);
      await assertPreview(page, "panorama", "Culinary");
      for (const name of ["Ceremonial", "Barista"]) {
        await selectProduct(page, name);
        await assertPreview(page, "panorama", name);
      }
      await page
        .locator('[data-origin-preview="panorama"]')
        .getByRole("button", { name: "Shop this matcha", exact: true })
        .click();
      await page.locator('[data-embedded][data-mode="builder"]').waitFor();
      await page
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      const quantity = page.getByLabel("Quantity", { exact: true });
      assert.equal(Number(await quantity.textContent()), 2);
      await selectView(page, "Origins");
      const reads = state.catalogReads;
      await page.locator("[data-renderer]").waitFor({ state: "attached" });
      await page.evaluate(() => {
        window.__originsScene = document.querySelector("[data-renderer]");
        window.__originsLabel = document.querySelector("[data-label-card]");
      });
      for (const style of layouts) {
        await layout.selectOption(style);
        for (const tone of ["dark", "light"]) {
          await page
            .getByRole("link", {
              name: `${tone === "light" ? "Light" : "Dark"} mode`,
              exact: true,
            })
            .click();
          await page
            .locator(`[data-origins-study][data-tone="${tone}"]`)
            .waitFor();
          assert.equal(new URL(page.url()).pathname, "/origins-study");
          assert.equal(await experience.getAttribute("data-mode"), "origins");
          assert.equal(await layout.inputValue(), style);
          await assertPreview(page, style, "Barista");
          await capture(page, `${width}-${style}-${tone}`);
          await selectView(page, "Shop");
          assert.equal(
            Number(await quantity.textContent()),
            2,
            "Layout, view and theme changes must preserve the order quantity",
          );
          await selectView(page, "Origins");
        }
      }
      assert.equal(state.catalogReads, reads);
      assert.equal(
        await page.evaluate(
          () =>
            window.__originsScene ===
              document.querySelector("[data-renderer]") &&
            window.__originsLabel ===
              document.querySelector("[data-label-card]"),
        ),
        true,
        "Layout comparison must not remount the material scene",
      );
      const trigger = page
        .locator('[data-origin-preview="record"]')
        .getByRole("button", {
          name: "Explore the growing region",
          exact: true,
        });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog", {
        name: "ATOMA Origins",
        exact: true,
      });
      await dialog.waitFor();
      await dialog
        .getByRole("heading", { name: "People & work", exact: true })
        .waitFor();
      await assertGrowerPlaceholder(dialog);
      assert.match(new URL(page.url()).hash, /origins/);
      await dialog
        .getByRole("button", { name: "Return to Barista Matcha", exact: true })
        .click();
      await dialog.waitFor({ state: "hidden" });
      await eventually(
        () => new URL(page.url()).hash === "",
        "Returning restores the study URL",
      );
      assert.equal(
        await trigger.evaluate((element) => element === document.activeElement),
        true,
      );
      await assertPreview(page, "record", "Barista");
      await selectView(page, "Shop");
      assert.equal(Number(await quantity.textContent()), 2);
      await layout.selectOption("current");
      assert.equal(Number(await quantity.textContent()), 2);
      await selectView(page, "Origins");
      assert.equal(await page.locator("[data-origin-preview]").count(), 0);
      assert.match(
        await page
          .locator('[data-homepage-view-panel="origins"]')
          .textContent(),
        /Wazuka/,
      );
      assert.deepEqual(state.writes, []);
      assert.deepEqual(state.errors, []);
    } catch (error) {
      await reportFailure(page, state, String(width));
      throw error;
    } finally {
      await context.close();
    }
  },
]);

cases.push([
  "origins adoption: unknown origin stays honest and homepage state survives the region reader",
  async (browser) => {
    const catalog = products.map((product, index) =>
      index ? product : { ...product, handle: "unmapped-culinary-matcha" },
    );
    const { context, page, state } = await setup(browser, 320, 700, catalog);
    try {
      await page.goto(`${baseURL}/origins-study`, {
        waitUntil: "domcontentloaded",
      });
      const layout = page.getByRole("combobox", {
        name: "Origins layout",
        exact: true,
      });
      await page.locator('[data-origin-preview="panorama"]').waitFor();
      assert.equal(await layout.inputValue(), "panorama");
      for (const style of layouts) {
        await layout.selectOption(style);
        const preview = page.locator(`[data-origin-preview="${style}"]`);
        assert.match(
          await preview.textContent(),
          /Origin details are not yet available for this matcha/,
        );
        assert.equal(
          await preview.locator("[data-origin-place], img").count(),
          0,
          "A familiar product title cannot invent an origin or attach a regional photograph",
        );
        assert.doesNotMatch(
          await preview.textContent(),
          /Wazuka|Kyoto|Grown in/,
        );
        assert.equal(
          await preview
            .getByRole("button", { name: "Browse origins", exact: true })
            .isVisible(),
          true,
        );
        await assertNoOverflow(page);
      }
      await page.goto(`${baseURL}/selector-study`, {
        waitUntil: "domcontentloaded",
      });
      await page.locator('[data-homepage-view-panel="overview"]').waitFor();
      const experience = page.locator("[data-embedded]");
      assert.equal(await experience.getAttribute("data-mode"), "overview");
      assert.equal(
        await experience.getAttribute("data-selector-placement"),
        "left",
      );
      assert.equal(
        await experience.getAttribute("data-selector-variant"),
        "slides",
      );
      assert.equal(
        await experience.getAttribute("data-section-selector-variant"),
        "tabs",
      );
      await selectView(page, "Origins");
      await page.locator('[data-origin-preview="split"]').waitFor();
      assert.deepEqual(state.writes, []);
      assert.deepEqual(state.errors, []);
    } catch (error) {
      await reportFailure(page, state, "unknown-defaults");
      throw error;
    } finally {
      await context.close();
    }

    for (const [width, height, tone] of [
      [1366, 768, "dark"],
      [320, 700, "light"],
    ]) {
      const { context, page, state } = await setup(browser, width, height);
      try {
        await page.goto(baseURL, { waitUntil: "domcontentloaded" });
        await page.locator("[data-renderer]").waitFor({ state: "attached" });
        await setStorefrontTone(page, tone);
        await page
          .getByRole("button", {
            name: "Explore matcha from the silver bag",
            exact: true,
          })
          .click();
        await page.locator('main[data-handoff="complete"]').waitFor();
        const experience = page.locator("[data-embedded]");
        assert.equal(await experience.getAttribute("data-mode"), "overview");
        assert.equal(
          await experience.getAttribute("data-selector-placement"),
          "left",
        );
        assert.equal(
          await experience.getAttribute("data-selector-variant"),
          "slides",
        );
        assert.equal(
          await experience.getAttribute("data-section-selector-variant"),
          "tabs",
        );
        assert.equal(
          await page
            .getByRole("combobox", { name: "Origins layout", exact: true })
            .count(),
          0,
        );
        await selectProduct(page, "Barista");
        await selectView(page, "Shop");
        await page
          .getByRole("button", { name: "Increase quantity", exact: true })
          .click();
        const quantity = page.getByLabel("Quantity", { exact: true });
        assert.equal(Number(await quantity.textContent()), 2);
        await page.evaluate(() => {
          window.__adoptedOriginsScene =
            document.querySelector("[data-renderer]");
        });
        await selectView(page, "Origins");
        await assertPreview(page, "panorama", "Barista");
        await capture(page, `adopted-${width}-${tone}`);
        const otherTone = tone === "dark" ? "light" : "dark";
        await setStorefrontTone(page, otherTone);
        assert.equal(new URL(page.url()).pathname, "/");
        assert.equal(await experience.getAttribute("data-mode"), "origins");
        const preview = await assertPreview(page, "panorama", "Barista");
        const trigger = preview.getByRole("button", {
          name: "About Wazuka",
          exact: true,
        });
        await trigger.focus();
        await page.keyboard.press("Enter");
        const dialog = page.getByRole("dialog", {
          name: "ATOMA Origins",
          exact: true,
        });
        await dialog.waitFor();
        assert.equal(
          context.pages().length,
          1,
          "About the region must not open an external tab",
        );
        assert.equal(await dialog.getAttribute("data-tone"), otherTone);
        await dialog
          .getByRole("heading", { name: "Wazuka", exact: true, level: 1 })
          .waitFor();
        await dialog
          .getByRole("heading", { name: "People & work", exact: true })
          .waitFor();
        await assertGrowerPlaceholder(dialog);
        await dialog
          .getByRole("button", {
            name: "Return to Barista Matcha",
            exact: true,
          })
          .click();
        await dialog.waitFor({ state: "hidden" });
        await eventually(
          () => new URL(page.url()).hash === "",
          "Returning restores the homepage URL",
        );
        assert.equal(
          await trigger.evaluate(
            (element) => element === document.activeElement,
          ),
          true,
        );
        assert.equal(new URL(page.url()).pathname, "/");
        assert.equal(await experience.getAttribute("data-tone"), otherTone);
        assert.equal(
          await experience.getAttribute("data-selector-placement"),
          "left",
          "Returning from Origins must preserve the homepage placement",
        );
        await assertPreview(page, "panorama", "Barista");
        assert.equal(
          await page.evaluate(
            () =>
              window.__adoptedOriginsScene ===
              document.querySelector("[data-renderer]"),
          ),
          true,
          "Opening Origins, switching theme and returning from the reader must retain the mounted material scene",
        );
        assert.equal(
          await page
            .locator('main[data-concept="01"]')
            .getAttribute("data-handoff"),
          "complete",
        );
        await capture(page, `adopted-${width}-${otherTone}`);
        await selectView(page, "Shop");
        assert.equal(
          Number(await quantity.textContent()),
          2,
          "The adopted Origins layout, theme switch and reader return must preserve the order",
        );
        assert.deepEqual(state.writes, []);
        assert.deepEqual(state.errors, []);
      } catch (error) {
        await reportFailure(page, state, `adopted-${width}`);
        throw error;
      } finally {
        await context.close();
      }
    }
  },
]);

cases.push([
  "origins disclosure: global and regional placeholders in both themes",
  async (browser) => {
    for (const [tone, width, height] of [
      ["dark", 1366, 768],
      ["light", 390, 844],
    ]) {
      const { context, page, state } = await setup(browser, width, height);
      try {
        await page.goto(`${baseURL}/origins`, {
          waitUntil: "domcontentloaded",
        });
        const directory = page.locator("[data-origins-directory]");
        await directory.waitFor();
        await eventually(
          () =>
            directory
              .getByRole("heading", {
                name: "Growing places",
                exact: true,
                level: 1,
              })
              .evaluate((element) => element === document.activeElement),
          "The Origins directory must finish its initial focus before navigation",
        );
        await setStorefrontTone(page, tone);
        assert.equal(await directory.getAttribute("data-tone"), tone);
        assert.equal(
          await directory.getAttribute("data-origins-directory"),
          "all",
        );
        assert.equal(
          await directory
            .getByRole("heading", { name: "Growers", exact: true })
            .isVisible(),
          true,
        );
        await assertGrowerPlaceholder(directory);
        await assertNoOverflow(page);
        await directory
          .locator("[data-grower-placeholder]")
          .scrollIntoViewIfNeeded();
        await capture(page, `growers-${tone}-global`);
        await directory
          .getByRole("button", { name: "Wazuka", exact: true })
          .click();
        await page.locator('[data-origins-directory="wazuka"]').waitFor();
        await directory
          .getByRole("heading", { name: "Wazuka", exact: true, level: 1 })
          .waitFor();
        await assertGrowerPlaceholder(directory);
        const work = directory.getByRole("heading", {
          name: "People & work",
          exact: true,
        });
        await directory
          .getByRole("button", { name: "People & work", exact: true })
          .click();
        assert.equal(
          await work.evaluate((element) => element === document.activeElement),
          true,
          "The regional work jump still reaches its section",
        );
        await assertNoOverflow(page);
        await directory
          .locator("[data-grower-placeholder]")
          .scrollIntoViewIfNeeded();
        await capture(page, `growers-${tone}-regional`);
        assert.deepEqual(state.writes, []);
        assert.deepEqual(state.errors, []);
      } catch (error) {
        await reportFailure(page, state, `growers-${tone}`);
        throw error;
      } finally {
        await context.close();
      }
    }
  },
]);

cases.push([
  "origins directory: search-first popout preserves places, reading and selected order",
  async (browser) => {
    for (const [width, height] of [
      [1366, 768],
      [320, 700],
    ]) {
      for (const tone of ["light", "dark"]) {
        const { context, page, state } = await setup(browser, width, height);
        try {
          await page.goto(`${baseURL}/?matcha=${products[1].handle}`, {
            waitUntil: "domcontentloaded",
          });
          const selectedProduct = page
            .getByRole("group", { name: "Matcha to explore", exact: true })
            .getByRole("button", {
              name: "Select Barista Matcha",
              exact: true,
            });
          await eventually(
            async () =>
              (await selectedProduct.getAttribute("aria-pressed")) === "true",
            "The requested matcha must be selected before opening Origins",
          );
          await setStorefrontTone(page, tone);
          await selectView(page, "Shop");
          await page
            .getByRole("button", { name: "Increase quantity", exact: true })
            .click();
          const quantity = page.getByLabel("Quantity", { exact: true });
          assert.equal(Number(await quantity.textContent()), 2);
          await page.evaluate(() => {
            window.__directoryScene = document.querySelector("[data-renderer]");
          });

          const header = page.locator(
            'main > header[data-navigation-variant="default"]',
          );
          const menu = header.locator("[data-nav-summary]");
          if (width <= 760) await menu.click();
          const trigger = header.locator('[data-nav-action="origins"]');
          await trigger.focus();
          await page.keyboard.press("Enter");
          const dialog = page.getByRole("dialog", {
            name: "ATOMA Origins",
            exact: true,
          });
          await dialog.waitFor();
          assert.equal(await dialog.getAttribute("data-tone"), tone);
          const directory = dialog.locator('[data-origins-directory="all"]');
          const title = directory.getByRole("heading", {
            name: "Growing places",
            exact: true,
            level: 1,
          });
          await eventually(
            () =>
              title.evaluate((element) => element === document.activeElement),
            "Opening the directory must focus its primary heading",
          );
          const search = directory.getByRole("searchbox", {
            name: "Find a place",
            exact: true,
          });
          const firstPlace = directory.locator('[data-origin-place="kyoto"]');
          for (const element of [title, search, firstPlace]) {
            const bounds = await element.boundingBox();
            const frame = await dialog.boundingBox();
            assert.ok(
              bounds &&
                frame &&
                bounds.x >= frame.x &&
                bounds.x + bounds.width <= frame.x + frame.width + 1 &&
                bounds.y >= frame.y &&
                bounds.y + bounds.height <=
                  Math.min(height, frame.y + frame.height) + 1,
              "Growing places, search and the first result must be visible immediately",
            );
          }
          assert.equal(
            await directory.locator("figure").count(),
            0,
            "The global directory must not put a photographic hero ahead of places",
          );
          assert.equal(
            await dialog.evaluate(
              (element) => element.scrollWidth <= element.clientWidth + 1,
            ),
            true,
            "The popout must not overflow horizontally",
          );
          await assertGrowerPlaceholder(directory);
          await capture(page, `directory-${width}-${tone}`);

          await search.fill("wAzUkA");
          const found = directory.locator('[data-origin-place="wazuka"]');
          await found.waitFor();
          await found.click();
          await dialog.locator('[data-origins-directory="wazuka"]').waitFor();
          await dialog
            .getByRole("button", { name: "All origins", exact: true })
            .click();
          await directory.waitFor();
          assert.equal(await search.inputValue(), "wAzUkA");
          await found.waitFor();

          await search.fill("no-such-growing-place");
          assert.equal(
            await directory.locator("[data-origin-place]").count(),
            0,
          );
          await directory
            .getByText("No places found. Try another name.", { exact: true })
            .waitFor();
          const clear = directory.getByRole("button", {
            name: "Clear place search",
            exact: true,
          });
          await clear.click();
          assert.equal(await search.inputValue(), "");
          assert.equal(
            await search.evaluate(
              (element) => element === document.activeElement,
            ),
            true,
            "Clearing a search must return keyboard focus to the search field",
          );
          await firstPlace.waitFor();

          await search.fill("Kyoto");
          const reading = directory.getByRole("button", {
            name: /In the fields\./,
          });
          await reading.click();
          await dialog
            .locator('[data-origins-entry="kyoto-field-observations"]')
            .waitFor();
          await dialog
            .getByRole("button", { name: "All origins", exact: true })
            .click();
          await directory.waitFor();
          assert.equal(await search.inputValue(), "Kyoto");
          await eventually(
            () =>
              reading.evaluate((element) => element === document.activeElement),
            "Returning from a field entry must restore its search-result trigger",
          );
          await assertNoOverflow(page);
          await page.keyboard.press("Escape");
          await dialog.waitFor({ state: "hidden" });
          const returnFocus = width <= 760 ? menu : trigger;
          await eventually(
            () =>
              returnFocus.evaluate(
                (element) => element === document.activeElement,
              ),
            "Escape must restore focus to the Origins entry or mobile menu",
          );
          await eventually(
            () => new URL(page.url()).hash === "",
            "Closing the popout must restore the previous URL",
          );
          assert.equal(
            await selectedProduct.getAttribute("aria-pressed"),
            "true",
          );
          assert.equal(Number(await quantity.textContent()), 2);
          assert.equal(
            await page.evaluate(
              () =>
                window.__directoryScene ===
                document.querySelector("[data-renderer]"),
            ),
            true,
            "Browsing places must retain the mounted product scene",
          );
          assert.deepEqual(state.writes, []);
          assert.deepEqual(state.errors, []);
        } catch (error) {
          await reportFailure(page, state, `directory-${width}-${tone}`);
          throw error;
        } finally {
          await context.close();
        }
      }
    }
  },
]);

const selected = cases.filter(
  ([name]) =>
    !process.env.ORIGINS_STUDY_FILTER ||
    new RegExp(process.env.ORIGINS_STUDY_FILTER).test(name),
);
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  headless: true,
});
let failed = 0;
try {
  for (const [name, run] of selected) {
    try {
      await run(browser);
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
  `${selected.length - failed}/${selected.length} origins checks passed`,
);
if (failed) process.exitCode = 1;
