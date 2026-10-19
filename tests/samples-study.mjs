/* Isolated samples study: commerce reads are mocked and all writes are blocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.SAMPLES_STUDY_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence = process.env.SAMPLES_STUDY_EVIDENCE;
if (evidence) await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const handles = [
  "jmm-storefront-test-matcha",
  "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
  "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
];
const products = ["Culinary", "Barista", "Ceremonial"].map((name, index) => ({
  id: name.toLowerCase(),
  handle: handles[index],
  title: `${name} Matcha`,
  productCode: index === 2 ? "WZKA-00" : "UJI-00",
  description: "Isolated browser fixture.",
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
      currency: "JPY",
      options: [{ name: "Format", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));
for (const width of [1440, 768, 390, 320]) {
  const context = await browser.newContext({
    viewport: { width, height: width > 760 ? 900 : 844 },
    reducedMotion: "reduce",
  });
  await context.route("**/*", (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname === "/api/catalog")
      return route.fulfill({
        json: { status: "ready", products, shopUrl: "https://example.invalid" },
      });
    if (url.pathname === "/api/cart" && req.method() === "GET")
      return route.fulfill({ json: { kind: "empty", checkoutEnabled: false } });
    if (url.pathname.startsWith("/api/")) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/samples-study`);
  await page
    .getByRole("combobox", { name: "Sample entrance", exact: true })
    .waitFor();
  for (const tone of ["light", "dark"]) {
    await page
      .getByRole("combobox", { name: "Study appearance", exact: true })
      .selectOption(tone);
    for (const direction of ["selector", "tile", "panel", "footer"]) {
      await page
        .getByRole("combobox", { name: "Sample entrance", exact: true })
        .selectOption(direction);
      await page.waitForTimeout(300);
      const size = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      assert.ok(
        size.scroll <= size.client + 1,
        JSON.stringify({ width, tone, direction, size }),
      );
      assert.equal(await page.locator("main:visible").count(), 1);
      const entrance = page.locator(`[data-sample-entrance="${direction}"]`);
      await entrance.waitFor({ state: "visible" });
      assert.equal(await entrance.getAttribute("href"), "/samples");
      assert.equal(
        await page.locator("main:visible").getAttribute("data-exploring"),
        "true",
      );
      assert.equal(
        await page
          .locator("[data-embedded]")
          .getAttribute("data-sample-placement"),
        direction,
      );
      await entrance.scrollIntoViewIfNeeded();
      if (
        evidence &&
        ((width === 1440 && tone === "light") ||
          (width === 390 && tone === "dark"))
      )
        await page.screenshot({
          path: resolve(evidence, `${width}-${tone}-${direction}.png`),
          fullPage: true,
        });
    }
  }
  console.log(`Layout passed ${width}`);
  if (width === 1440) {
    await page
      .getByRole("combobox", { name: "Sample entrance", exact: true })
      .selectOption("selector");
    await page.locator("[data-embedded]").waitFor({ state: "visible" });
    await page
      .getByRole("button", { name: "Select Barista Matcha", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Select Barista Matcha", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await page
      .getByRole("group", { name: "Shopping mode", exact: true })
      .getByRole("button", { name: "Shop", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Increase quantity", exact: true })
      .click();
    await page
      .locator("[data-embedded]")
      .evaluate((el) => (el.dataset.studyPersistence = "kept"));
    for (const direction of ["panel", "footer", "tile", "selector"]) {
      await page
        .getByRole("combobox", { name: "Sample entrance", exact: true })
        .selectOption(direction);
    }
    assert.equal(
      await page
        .locator("[data-embedded]")
        .getAttribute("data-study-persistence"),
      "kept",
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Select Barista Matcha", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      await page.locator("main:visible").getAttribute("data-exploring"),
      "true",
    );
    assert.equal(
      Number(await page.getByLabel("Quantity", { exact: true }).textContent()),
      2,
    );
    assert.equal(
      await page.locator("[data-embedded]").getAttribute("data-mode"),
      "builder",
    );
    console.log(
      "Mounted selection, Shop view and quantity persisted through all four placements",
    );
    await page.goto(`${baseURL}/`);
    await page
      .locator('main[data-exploring="false"]')
      .waitFor({ state: "visible" });
    assert.equal(
      await page.locator("[data-sample-entrance]").count(),
      0,
      "The opening homepage must not render a sample promotion",
    );
    await page
      .locator('[data-brand-part="introduction"]')
      .getByRole("button", { name: "EXPLORE MATCHA", exact: true })
      .click();
    await page
      .locator('[data-sample-entrance="selector"]')
      .waitFor({ state: "visible" });
    await page
      .getByRole("button", { name: "Back to overview", exact: true })
      .click();
    await page
      .locator('main[data-exploring="false"]')
      .waitFor({ state: "visible" });
    assert.equal(
      await page.locator("[data-sample-entrance]").count(),
      0,
      "Closing Explore must remove its sample promotion",
    );
    console.log("Canonical samples appear only after Explore matcha");
    for (const [query, expected] of [
      ["collection", "panel"],
      ["unknown", "selector"],
      ["constructor", "selector"],
    ]) {
      await page.goto(`${baseURL}/samples-study?direction=${query}`);
      assert.equal(
        await page
          .getByRole("combobox", { name: "Sample entrance", exact: true })
          .inputValue(),
        expected,
      );
    }
    console.log("Earlier study links and unknown directions resolve safely");
  }
  await context.close();
}
await browser.close();
