/* Designation and geographic provenance flows use an isolated public catalog. */
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
  process.env.ORIGIN_DESIGNATIONS_BASE_URL ?? "http://127.0.0.1:3100";
const evidence = process.env.ORIGIN_DESIGNATIONS_EVIDENCE;
const products = [
  ["culinary", "Culinary", "jmm-storefront-test-matcha", "Cafés & Baking"],
  [
    "barista",
    "Barista",
    "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
    "Lattes",
  ],
  [
    "ceremonial",
    "Premium",
    "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
    "Tea Service",
  ],
].map(([id, name, handle, application], index) => ({
  id,
  name: id === "ceremonial" ? "Ceremonial" : name,
  handle,
  title: `Japanese ${name} Matcha Powder for ${application} — 1 kg`,
  description: "Isolated designation browser fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: ["1 kg", "500 g"].map((title, format) => ({
    id: `v1_${String.fromCharCode(97 + index * 2 + format).repeat(43)}`,
    title,
    available: id !== "ceremonial",
    priceMinor: (index + 1) * (format ? 600 : 1200),
    currency: "JPY",
    options: [{ name: "Format", value: title }],
    minimum: 1,
    maximum: 4,
    increment: 1,
  })),
}));

async function eventually(check, message) {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function setup(browser, width, tone) {
  const context = await browser.newContext({
    viewport: { width, height: width === 320 ? 740 : 900 },
    reducedMotion: "reduce",
    hasTouch: width === 320,
    isMobile: width === 320,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
  ]);
  const errors = [];
  const writes = [];
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    try {
      if (!["GET", "HEAD"].includes(request.method())) {
        writes.push(`${request.method()} ${url.pathname}`);
        assert.fail("Commerce writes are forbidden in this browser fixture");
      }
      if (url.pathname.startsWith("/api/")) {
        assert.equal(url.origin, new URL(baseURL).origin);
        if (url.pathname === "/api/catalog")
          return route.fulfill({
            contentType: "application/json",
            json: {
              status: "ready",
              products,
              shopUrl: "https://example.invalid",
            },
          });
        if (url.pathname === "/api/cart")
          return route.fulfill({
            contentType: "application/json",
            json: { kind: "empty", checkoutEnabled: false },
          });
        assert.fail(`Unexpected API request: ${url.pathname}`);
      }
      return route.continue();
    } catch (error) {
      errors.push(error.message);
      return route.abort("blockedbyclient");
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  page.setDefaultNavigationTimeout(30_000);
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page, errors, writes };
}

async function capture(page, name) {
  if (!evidence) return;
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: resolve(evidence, `${name}.png`) });
}

async function assertNoOverflow(page, scope) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "The page must not overflow horizontally",
  );
  assert.equal(
    await scope.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
    true,
    "Designation content must not overflow its container",
  );
}

async function assertPhotograph(scope, source) {
  const photograph = scope.locator("img").first();
  const url = new URL(await photograph.getAttribute("src"), baseURL);
  assert.equal(url.searchParams.get("url") ?? url.pathname, source);
  await eventually(
    () =>
      photograph.evaluate(
        (element) => element.complete && element.naturalWidth > 0,
      ),
    "The selected editorial photograph must load successfully",
  );
}

async function assertDesignation(scope, placePreview = false) {
  await scope
    .getByRole("heading", {
      name: placePreview ? "Uji City" : "UJI",
      exact: true,
    })
    .waitFor();
  assert.match(await scope.textContent(), /tea designation/i);
  assert.match(await scope.textContent(), /not (?:yet )?(?:been )?published/i);
  assert.doesNotMatch(await scope.textContent(), /Grown in|Processed in/);
  assert.equal(
    await scope.locator("[data-origin-place]").count(),
    0,
    "Context geography must not be labeled as a product growing-place record",
  );
  if (placePreview) {
    assert.deepEqual(
      await scope
        .getByRole("list", { name: "Geographic hierarchy", exact: true })
        .locator("li")
        .allTextContents(),
      ["CountryJapan", "RegionKyoto", "LocalityUji City"],
      "Uji shows the same country, region and locality format as Wazuka",
    );
  } else {
    assert.equal(
      await scope.locator('[aria-label="Geographic hierarchy"]').count(),
      0,
    );
  }
}

async function assertReader(page, scope) {
  const reader = scope.locator('[data-origins-directory="uji-city"]');
  await reader.waitFor();
  await reader
    .getByRole("heading", { name: "Uji City", exact: true, level: 1 })
    .waitFor();
  await reader
    .getByRole("heading", { name: "UJI series", exact: true })
    .waitFor();
  assert.match(await reader.textContent(), /tea designation/i);
  assert.match(await reader.textContent(), /Uji City/);
  assert.match(await reader.textContent(), /Wazuka Town/);
  assert.match(await reader.textContent(), /not (?:yet )?(?:been )?published/i);
  assert.doesNotMatch(
    await reader.textContent(),
    /Grown in Uji|Processed in Uji/i,
  );
  assert.match(
    await reader.locator("figcaption").first().textContent(),
    /Kyoto/,
  );
  assert.doesNotMatch(
    await reader.locator("figcaption").first().textContent(),
    /Uji/i,
  );
  await assertPhotograph(reader, "/images/origins/uji-context-landscape.jpg");
  assert.equal(
    await scope.locator("[data-origins-designation]").count(),
    0,
    "Uji uses the existing location reader rather than a separate composition",
  );
  const links = reader.locator('a[href*="matcha="]');
  await eventually(
    async () => (await links.count()) === 2,
    "The designation lists exactly its two matchas",
  );
  assert.deepEqual(
    (
      await links.evaluateAll((items) =>
        items.map((item) => new URL(item.href).searchParams.get("matcha")),
      )
    ).sort(),
    products
      .slice(0, 2)
      .map((product) => product.handle)
      .sort(),
  );
  assert.doesNotMatch(
    await links.allTextContents().then((items) => items.join(" ")),
    /Ceremonial/,
  );
  await assertNoOverflow(page, reader);
  return reader;
}

async function presentation(scope, headingSelector, imageSelector) {
  return scope.evaluate(
    (element, selectors) => {
      const style = getComputedStyle(element);
      const heading = element.querySelector(selectors.heading);
      const headingStyle = getComputedStyle(heading);
      const photo = element.querySelector(selectors.image);
      const box = photo.getBoundingClientRect();
      return {
        className: element.className,
        background: style.backgroundColor,
        color: style.color,
        width: Math.round(element.getBoundingClientRect().width),
        heading: {
          className: heading.className,
          family: headingStyle.fontFamily,
          size: headingStyle.fontSize,
          weight: headingStyle.fontWeight,
          lineHeight: headingStyle.lineHeight,
        },
        photograph: {
          className: photo.className,
          width: Math.round(box.width),
          height: Math.round(box.height),
        },
      };
    },
    { heading: headingSelector, image: imageSelector },
  );
}

async function previewStructure(article) {
  return article.evaluate((element) =>
    [element, ...element.querySelectorAll("*")].map((node) => [
      node.tagName,
      node.className,
    ]),
  );
}

async function switchView(page, name) {
  await page
    .getByRole("group", { name: "Shopping mode", exact: true })
    .getByRole("button", { name, exact: true })
    .click();
  await page
    .locator(
      `[data-embedded][data-mode="${name === "Shop" ? "builder" : name === "Origin" ? "origins" : name.toLowerCase()}"]`,
    )
    .waitFor();
}

async function closeReader(page, trigger, product, method) {
  const dialog = page.locator("[data-origins-dialog][open]");
  if (method === "escape") await page.keyboard.press("Escape");
  else if (method === "outside") {
    const box = await dialog.boundingBox();
    assert.ok(
      box && box.x > 1,
      "The inset dialog leaves a dismissible backdrop",
    );
    if (page.viewportSize().width === 320)
      await page.touchscreen.tap(2, Math.max(2, box.y + box.height / 2));
    else await page.mouse.click(2, Math.max(2, box.y + box.height / 2));
  } else {
    await dialog
      .getByRole("button", {
        name: `Return to ${product.name} Matcha`,
        exact: true,
      })
      .click();
  }
  await dialog.waitFor({ state: "hidden" });
  await eventually(
    () => new URL(page.url()).hash === "",
    "Closing restores the previous URL",
  );
  await eventually(
    () => trigger.evaluate((element) => element === document.activeElement),
    "Closing returns focus to the designation trigger",
  );
}

async function checkDirectory(page, label) {
  await page.goto(`${baseURL}/origins`, { waitUntil: "domcontentloaded" });
  const directory = page.locator('[data-origins-directory="all"]');
  const ready = async () => {
    const heading = directory.getByRole("heading", {
      name: "Growing places",
      exact: true,
      level: 1,
    });
    await eventually(
      () => heading.evaluate((element) => element === document.activeElement),
      "The existing location directory focuses its heading before navigation",
    );
  };
  await ready();
  assert.equal(
    await directory.locator("[data-origin-designation]").count(),
    0,
    "The original directory has no inserted designation group",
  );
  const search = directory.getByRole("searchbox", {
    name: "Find a place",
    exact: true,
  });
  assert.equal(await search.isVisible(), true);
  await search.fill("Uji");
  const ujiRow = directory.locator('[data-origin-place="uji-city"]');
  await ujiRow.waitFor();
  await assertPhotograph(ujiRow, "/images/origins/uji-context-landscape.jpg");
  await search.fill("");
  const kyotoRow = directory.locator('[data-origin-place="kyoto"]');
  await eventually(
    async () => /3 matchas/.test(await kyotoRow.textContent()),
    "The Kyoto directory count includes its UJI series and Wazuka matchas",
  );
  await capture(page, `${label}-origins-directory`);
  await kyotoRow.click();
  const kyoto = page.locator('[data-origins-directory="kyoto"]');
  await kyoto.waitFor();
  const kyotoMatchas = kyoto.locator('a[href*="matcha="]');
  const handles = (links) =>
    links.evaluateAll((items) =>
      items.map((item) => new URL(item.href).searchParams.get("matcha")),
    );
  await eventually(
    async () => (await kyotoMatchas.count()) === products.length,
    "Kyoto lists all three matchas, including the unavailable Ceremonial fixture",
  );
  assert.deepEqual(
    await handles(kyotoMatchas),
    products.map((product) => product.handle),
    "The regional product list preserves catalog order and has no duplicates",
  );
  for (const [index, product] of products.entries()) {
    const text = await kyotoMatchas.nth(index).textContent();
    assert.match(text, new RegExp(`${product.name} Matcha`));
    assert.match(
      text,
      product.id === "ceremonial"
        ? /Wazuka \/ Tea service/i
        : /UJI tea designation \//,
      "Regional cards retain each product's own origin or designation",
    );
    assert.doesNotMatch(text, product.id === "ceremonial" ? /UJI/ : /Wazuka/);
    assert.match(
      text,
      product.variants.some((variant) => variant.available)
        ? /View matcha/
        : /Unavailable/,
      "Availability remains independent of inclusion in the regional list",
    );
  }
  const typeFilter = kyoto.getByRole("combobox", {
    name: "Matcha type",
    exact: true,
  });
  for (const [index, type] of [
    "culinary",
    "barista",
    "tea-service",
  ].entries()) {
    await typeFilter.selectOption(type);
    await eventually(
      async () =>
        JSON.stringify(await handles(kyotoMatchas)) ===
        JSON.stringify([products[index].handle]),
      `The ${type} filter resolves its exact regional product`,
    );
  }
  await typeFilter.selectOption("");
  await eventually(
    async () => (await kyotoMatchas.count()) === products.length,
    "All types restores the complete regional product list",
  );
  assert.deepEqual(
    await handles(kyotoMatchas),
    products.map((product) => product.handle),
  );
  await kyoto
    .getByRole("heading", { name: "Matcha from Kyoto", exact: true })
    .evaluate((element) =>
      element.scrollIntoView({ behavior: "instant", block: "start" }),
    );
  await assertNoOverflow(page, kyoto);
  await capture(page, `${label}-kyoto-matchas`);
  await kyoto
    .getByRole("navigation", { name: "Place path", exact: true })
    .getByRole("button", { name: "Japan", exact: true })
    .click();
  const japan = page.locator('[data-origins-directory="japan"]');
  const japanMatchas = japan.locator('a[href*="matcha="]');
  await eventually(
    async () => (await japanMatchas.count()) === products.length,
    "The Japan ancestor includes all regional matchas",
  );
  assert.deepEqual(
    await handles(japanMatchas),
    products.map((product) => product.handle),
  );
  await japan
    .getByRole("navigation", { name: "Place path", exact: true })
    .getByRole("button", { name: "Origins", exact: true })
    .click();
  await directory.getByRole("button", { name: "Wazuka", exact: true }).click();
  const place = page.locator('[data-origins-directory="wazuka"]');
  await place.waitFor();
  assert.deepEqual(
    await place
      .getByRole("navigation", { name: "Place path", exact: true })
      .locator('button, [aria-current="page"]')
      .allTextContents(),
    ["Origins", "Japan", "Kyoto", "Wazuka"],
  );
  const geographicMatchas = place.locator('a[href*="matcha="]');
  await eventually(
    async () => (await geographicMatchas.count()) === 1,
    "Wazuka lists only Ceremonial",
  );
  assert.equal(
    new URL(
      await geographicMatchas.first().getAttribute("href"),
      baseURL,
    ).searchParams.get("matcha"),
    products[2].handle,
  );
  await page.evaluate(() => document.fonts.ready);
  await assertPhotograph(place, "/images/origins/field-landscape.webp");
  const originalPlacePresentation = await presentation(
    place,
    "h1",
    "figure img",
  );
  await capture(page, `${label}-wazuka`);
  await place
    .getByRole("navigation", { name: "Place path", exact: true })
    .getByRole("button", { name: "Origins", exact: true })
    .click();
  await directory
    .getByRole("button", { name: "Uji City", exact: true })
    .click();
  const city = await assertReader(page, page);
  await eventually(
    () =>
      city
        .getByRole("heading", { name: "Uji City", exact: true, level: 1 })
        .evaluate((element) => element === document.activeElement),
    "Opening Uji City focuses the existing place heading",
  );
  assert.deepEqual(
    await city
      .getByRole("navigation", { name: "Place path", exact: true })
      .locator('button, [aria-current="page"]')
      .allTextContents(),
    ["Origins", "Japan", "Kyoto", "Uji City"],
    "Uji City and Wazuka remain separate municipalities directly under Kyoto",
  );
  assert.deepEqual(
    await presentation(city, "h1", "figure img"),
    originalPlacePresentation,
    "Uji preserves the original location theme, heading typography and photograph geometry",
  );
  await city
    .getByRole("heading", { name: "Uji City", exact: true, level: 1 })
    .scrollIntoViewIfNeeded();
  await capture(page, `${label}-uji-city`);
  for (const product of products.slice(0, 2)) {
    await page.goto(`${baseURL}/origins`, { waitUntil: "domcontentloaded" });
    await ready();
    await directory
      .getByRole("button", { name: "Uji City", exact: true })
      .click();
    const reader = await assertReader(page, page);
    await reader
      .getByRole("link", { name: new RegExp(`${product.name} Matcha`) })
      .click();
    await page.waitForURL(
      (url) =>
        url.pathname === "/" &&
        url.searchParams.get("matcha") === product.handle,
    );
    const selected = page.getByRole("button", {
      name: `Select ${product.name} Matcha`,
      exact: true,
    });
    await eventually(
      async () => (await selected.getAttribute("aria-pressed")) === "true",
      "The UJI series link selects its exact matcha",
    );
  }
}

async function checkHomepage(page, product, tone, label) {
  await page.goto(`${baseURL}/?matcha=${product.handle}`, {
    waitUntil: "domcontentloaded",
  });
  const selected = page.getByRole("button", {
    name: `Select ${product.name} Matcha`,
    exact: true,
  });
  await eventually(
    async () => (await selected.getAttribute("aria-pressed")) === "true",
    "The requested matcha is selected",
  );
  await page
    .getByRole("button", { name: "Select Ceremonial Matcha", exact: true })
    .click();
  await switchView(page, "Origin");
  const preview = page.locator('[data-origin-preview="panorama"]');
  const geographic = preview.locator('[data-origin-place="wazuka"]');
  await geographic.waitFor();
  await page.evaluate(() => document.fonts.ready);
  const originalPreview = await presentation(preview, "h3", "figure img");
  const originalStructure = await previewStructure(geographic);
  await assertPhotograph(geographic, "/images/origins/field-landscape.webp");
  const originalCaption = await geographic
    .locator("figcaption > span")
    .first()
    .textContent();
  await capture(page, `${label}-${product.id}-comparison-wazuka`);
  await selected.click();
  await switchView(page, "Shop");
  await page
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  const quantity = page.getByLabel("Quantity", { exact: true });
  assert.equal(Number(await quantity.textContent()), 2);
  await page.evaluate(() => {
    window.__designationScene = document.querySelector("[data-renderer]");
  });
  await switchView(page, "Origin");
  const designation = page.locator('[data-origin-designation="uji-tea"]');
  await assertDesignation(designation, true);
  assert.deepEqual(
    await presentation(preview, "h3", "figure img"),
    originalPreview,
    "UJI preserves the original Panorama theme, heading typography and photograph geometry",
  );
  assert.deepEqual(
    await previewStructure(designation),
    originalStructure,
    "UJI uses the same Panorama DOM and CSS classes as the geographic record",
  );
  assert.equal(
    await designation.locator("figcaption > span").first().textContent(),
    originalCaption,
    "The photograph keeps its exact Kyoto editorial caption",
  );
  await assertPhotograph(
    designation,
    "/images/origins/uji-context-landscape.jpg",
  );
  assert.equal(
    await designation.locator("figcaption > span").last().textContent(),
    "Shade cloth stretches across the foreground, with tea rows and wooded hills beyond.",
  );
  assert.deepEqual(
    await designation
      .getByRole("list", {
        name: "Geographic hierarchy",
        exact: true,
      })
      .locator("li")
      .allTextContents(),
    ["CountryJapan", "RegionKyoto", "LocalityUji City"],
  );
  assert.equal(
    await designation
      .getByRole("button", { name: "Explore Uji", exact: true })
      .isVisible(),
    true,
  );
  const trigger = designation.getByRole("button", {
    name: "About Uji",
    exact: true,
  });
  for (const method of ["button", "escape", "outside"]) {
    const opening =
      method === "escape"
        ? designation.getByRole("button", { name: "Explore Uji", exact: true })
        : trigger;
    await opening.click();
    const dialog = page.locator("[data-origins-dialog][open]");
    await dialog.waitFor();
    assert.equal(await dialog.getAttribute("data-tone"), tone);
    await assertReader(page, dialog);
    if (method === "button")
      await capture(page, `${label}-${product.id}-home-reader`);
    await closeReader(page, opening, product, method);
    assert.equal(await selected.getAttribute("aria-pressed"), "true");
    assert.equal(
      await page.evaluate(
        () =>
          window.__designationScene ===
          document.querySelector("[data-renderer]"),
      ),
      true,
    );
  }
  await switchView(page, "Shop");
  assert.equal(
    Number(await quantity.textContent()),
    2,
    "Designation browsing preserves quantity",
  );
  await switchView(page, "Origin");
  await assertNoOverflow(page, designation);
  await capture(page, `${label}-${product.id}-home-preview`);
}

async function checkRetail(page, product, tone, label) {
  await page.goto(`${baseURL}/shop/${product.handle}`, {
    waitUntil: "domcontentloaded",
  });
  const main = page.locator(`main[data-retail-product="${product.handle}"]`);
  const purchase = main.getByRole("region", {
    name: `Purchase ${product.name} Matcha`,
    exact: true,
  });
  await purchase.waitFor();
  const format = purchase.getByRole("button", { name: "500 g", exact: true });
  await format.click();
  await purchase
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  const quantity = purchase.getByLabel("Quantity", { exact: true });
  assert.equal(Number(await quantity.textContent()), 2);
  const origins = main.locator("[data-retail-origins]");
  await origins.locator("summary").click();
  await assertDesignation(origins);
  const trigger = origins.getByRole("button", {
    name: "About Uji",
    exact: true,
  });
  for (const method of ["button", "escape", "outside"]) {
    await trigger.click();
    const dialog = page.locator("[data-origins-dialog][open]");
    await dialog.waitFor();
    assert.equal(await dialog.getAttribute("data-tone"), tone);
    await assertReader(page, dialog);
    await closeReader(page, trigger, product, method);
    assert.equal(Number(await quantity.textContent()), 2);
    assert.equal(await format.getAttribute("aria-pressed"), "true");
    assert.equal(await origins.evaluate((element) => element.open), true);
    assert.equal(new URL(page.url()).pathname, `/shop/${product.handle}`);
  }
  await assertNoOverflow(page, origins);
  await capture(page, `${label}-${product.id}-retail`);
}

const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  headless: true,
});
let passed = 0;
let total = 0;
try {
  for (const width of [1366, 320]) {
    for (const tone of ["light", "dark"]) {
      const label = `${width}-${tone}`;
      if (
        process.env.ORIGIN_DESIGNATIONS_FILTER &&
        !label.includes(process.env.ORIGIN_DESIGNATIONS_FILTER)
      )
        continue;
      total++;
      const { context, page, errors, writes } = await setup(
        browser,
        width,
        tone,
      );
      try {
        await checkDirectory(page, label);
        for (const product of products.slice(0, 2)) {
          await checkHomepage(page, product, tone, label);
          await checkRetail(page, product, tone, label);
        }
        assert.deepEqual(errors, [], "No browser or unexpected network errors");
        assert.deepEqual(writes, [], "No commerce writes occurred");
        passed++;
        console.log(
          `PASS ${label}: Kyoto/Japan 3-matcha rollup, origin labels, availability, type filters, original layouts, UJI series and purchase continuity`,
        );
      } catch (error) {
        console.error(`FAIL ${label}\n${error.stack}`);
        await capture(page, `${label}-failure`);
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
console.log(`${passed}/${total} designation browser cases passed`);
if (!total || passed !== total) process.exitCode = 1;
