/* Samples comparison and tasting cards: isolated catalog reads only. All
 * external traffic, unknown API routes and network writes are blocked. */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";
import { translate } from "../src/lib/i18n/index.ts";
import { SAMPLE_TASTINGS_STORAGE_KEY } from "../src/lib/sample-tastings.ts";

const playwright = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.SAMPLE_TASTING_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.SAMPLE_TASTING_EVIDENCE ?? ".local/sample-tasting-mobile-0207";
const filter = process.env.SAMPLE_TASTING_FILTER;
const engine = process.env.SAMPLE_TASTING_BROWSER ?? "chromium";
assert.ok(["chromium", "webkit"].includes(engine));
const destination = { countryCode: "US", currency: "USD" };
assert.ok(SAMPLE_SET_OFFER, "The reviewed sample offer is configured");

const products = [
  {
    id: "isolated-sample-set",
    handle: SAMPLE_SET_OFFER.productHandle,
    title: "Sample Set",
    description: "Isolated sample tasting fixture.",
    productCode: null,
    imageUrl: null,
    imageAlt: "",
    productUrl: null,
    isFixture: true,
    variants: [
      {
        id: `v1_${"s".repeat(43)}`,
        selectionId: "sample-set-20g",
        title: "3 × 20 g",
        options: SAMPLE_SET_OFFER.variants[0].options,
        available: true,
        priceMinor: 2900,
        currency: destination.currency,
        minimum: 1,
        maximum: 4,
        increment: 1,
      },
    ],
  },
  ...SAMPLE_SET_CONTENTS.map((item, index) => ({
    id: item.key,
    handle: item.productHandle,
    title: item.name,
    description: "Isolated sample tasting fixture.",
    productCode: item.productCode,
    imageUrl: null,
    imageAlt: "",
    productUrl: null,
    isFixture: true,
    variants: [
      {
        id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
        selectionId: `${item.key}-1kg`,
        title: "1 kg",
        options: [{ name: "Format", value: "1 kg" }],
        available: true,
        priceMinor: 6500,
        currency: destination.currency,
        minimum: 1,
        maximum: 4,
        increment: 1,
      },
    ],
  })),
];

await mkdir(evidence, { recursive: true });
const browser = await playwright[engine].launch(
  engine === "chromium"
    ? { channel: "chrome", headless: true }
    : { headless: true },
);
const results = [];

async function setup({
  width = 390,
  tone = "light",
  locale = "en",
  javaScriptEnabled = true,
} = {}) {
  const context = await browser.newContext({
    viewport: { width, height: width <= 760 ? 844 : 900 },
    hasTouch: width <= 760,
    isMobile: width <= 760,
    reducedMotion: "reduce",
    javaScriptEnabled,
    acceptDownloads: true,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: locale, url: baseURL },
  ]);
  const errors = [];
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (url.origin !== origin || !["GET", "HEAD"].includes(method)) {
      errors.push(
        `Unexpected external request or write: ${method} ${url.pathname}`,
      );
      return route.abort();
    }
    if (url.pathname === "/api/destination")
      return route.fulfill({
        json: {
          kind: "ready",
          preference: { countryCode: "US", source: "manual" },
          destination,
          countries: ["US", "SG"],
          reviewRequired: false,
        },
      });
    if (url.pathname === "/api/catalog")
      return route.fulfill({
        json: {
          status: "ready",
          destination,
          products,
          shopUrl: "https://example.invalid",
        },
      });
    if (url.pathname === "/api/cart")
      return route.fulfill({
        json: {
          kind: "empty",
          destination,
          destinationReviewRequired: false,
          checkoutEnabled: false,
        },
      });
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Unexpected API read: ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  return {
    context,
    page,
    errors,
    width,
    tone,
    locale,
    t: (source, values) => translate(locale, source, values),
  };
}

async function run(name, action) {
  if (filter && !filter.split(",").some((part) => name.includes(part))) return;
  const start = Date.now();
  await action();
  const result = {
    name,
    engine,
    passed: true,
    milliseconds: Date.now() - start,
  };
  results.push(result);
  await writeFile(
    `${evidence}/${engine}-${name}-result.json`,
    `${JSON.stringify(result, null, 2)}\n`,
  );
  console.log(`PASS ${engine}/${name}`);
}

async function assertNoOverflow(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "The document does not overflow horizontally",
  );
}

async function screenshot(fixture, suffix) {
  const scope = fixture.page.locator("[data-sample-tasting-tools]");
  await scope.scrollIntoViewIfNeeded();
  await scope.screenshot({
    path: `${evidence}/${engine}-${fixture.width}-${fixture.tone}-${fixture.locale}-${suffix}.png`,
  });
}

const tastingFixtures = {
  ceremonial: {
    preparation: "hot",
    matchaGrams: "2.125",
    waterMl: "70",
    milkMl: "0",
    notes: "Soft finish. Retest with 65 ml water. 試飲メモ。",
  },
  barista: {
    preparation: "iced",
    matchaGrams: "3",
    waterMl: "40",
    milkMl: "120",
    notes: "Oat milk, no sweetener. Compare again over ice.",
  },
  culinary: {
    preparation: "recipe",
    matchaGrams: "4.5",
    waterMl: "0",
    milkMl: "80",
    notes: "Small pudding batch. Keep recipe unchanged next time. 品尝记录。",
  },
};

function savedRecord(draft) {
  return {
    preparation: draft.preparation,
    matchaMg: Number(draft.matchaGrams) * 1000,
    waterMl: Number(draft.waterMl),
    milkMl: Number(draft.milkMl),
    notes: draft.notes,
  };
}

async function readSaved(page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  }, SAMPLE_TASTINGS_STORAGE_KEY);
}

async function blockStorageWrites(page, behavior = "throw") {
  await page.evaluate(
    ({ key, behavior }) => {
      const setItem = Storage.prototype.setItem;
      const removeItem = Storage.prototype.removeItem;
      Storage.prototype.setItem = function (name, value) {
        if (name !== key) return setItem.call(this, name, value);
        if (behavior === "throw")
          throw new DOMException(
            "Fixture storage unavailable",
            "QuotaExceededError",
          );
      };
      Storage.prototype.removeItem = function (name) {
        if (name !== key) return removeItem.call(this, name);
        if (behavior === "throw")
          throw new DOMException(
            "Fixture storage unavailable",
            "SecurityError",
          );
      };
    },
    { key: SAMPLE_TASTINGS_STORAGE_KEY, behavior },
  );
}

function scopeOf(fixture) {
  return fixture.page.locator("[data-sample-tasting-tools]");
}

function button(fixture, source) {
  return scopeOf(fixture).getByRole("button", {
    name: fixture.t(source),
    exact: true,
  });
}

async function openTools(fixture) {
  await fixture.page.goto(`${baseURL}/samples`);
  await scopeOf(fixture).waitFor();
  await fixture.page.evaluate(() => document.fonts.ready);
  await fixture.page.waitForFunction(
    () =>
      document.querySelector('[data-tasting-tea="ceremonial"]')?.disabled ===
      false,
  );
}

async function chooseTea(fixture, key) {
  await button(fixture, "Tasting card").click();
  await scopeOf(fixture).locator(`[data-tasting-tea="${key}"]`).click();
  assert.equal(
    await scopeOf(fixture)
      .locator(`[data-tasting-tea="${key}"]`)
      .getAttribute("aria-pressed"),
    "true",
  );
}

async function fillCard(fixture, key, draft = tastingFixtures[key]) {
  await chooseTea(fixture, key);
  const form = scopeOf(fixture).locator("form");
  await form.locator('[name="notes"]').fill(draft.notes);
  const recipe = form.locator("details");
  if ((await recipe.getAttribute("open")) === null)
    await recipe.locator("summary").click();
  await form.locator('[name="preparation"]').selectOption(draft.preparation);
  for (const field of ["matchaGrams", "waterMl", "milkMl"])
    await form.locator(`[name="${field}"]`).fill(draft[field]);
}

async function assertDraft(fixture, key, expected = tastingFixtures[key]) {
  await chooseTea(fixture, key);
  for (const field of [
    "notes",
    "preparation",
    "matchaGrams",
    "waterMl",
    "milkMl",
  ])
    assert.equal(
      await scopeOf(fixture).locator(`[name="${field}"]`).inputValue(),
      expected[field],
      `${key} retains ${field}`,
    );
}

async function saveCard(fixture, key, draft = tastingFixtures[key]) {
  await fillCard(fixture, key, draft);
  await button(fixture, "Save tasting card").click();
  await scopeOf(fixture)
    .getByRole("status")
    .getByText(fixture.t("Saved on this device."), { exact: true })
    .waitFor();
  assert.deepEqual(
    (await readSaved(fixture.page)).records[key],
    savedRecord(draft),
  );
}

async function openPreview(fixture) {
  const preview = scopeOf(fixture).locator("[data-tasting-preview]");
  if ((await preview.getAttribute("open")) === null)
    await preview.locator("summary").click();
  return preview;
}

async function comparison(fixture) {
  await button(fixture, "Compare samples").click();
  const scope = scopeOf(fixture).locator("[data-tasting-comparison]");
  await scope.waitFor({ state: "visible" });
  return {
    scope,
    first: scope.getByRole("combobox", {
      name: fixture.t("First matcha"),
      exact: true,
    }),
    second: scope.getByRole("combobox", {
      name: fixture.t("Second matcha"),
      exact: true,
    }),
  };
}

async function checkComparison(fixture) {
  const { scope, first, second } = await comparison(fixture);
  assert.equal(await first.inputValue(), "ceremonial");
  assert.equal(await second.inputValue(), "barista");
  await first.selectOption("barista");
  assert.equal(await first.inputValue(), "barista");
  assert.equal(
    await second.inputValue(),
    "ceremonial",
    "Selecting the other tea swaps the pair",
  );
  await second.selectOption("culinary");
  assert.equal(await first.inputValue(), "barista");
  assert.equal(await second.inputValue(), "culinary");
  assert.notEqual(await first.inputValue(), await second.inputValue());
  assert.equal(await scope.locator("thead th").count(), 2);
  for (const key of ["barista", "culinary"]) {
    const item = SAMPLE_SET_CONTENTS.find((tea) => tea.key === key);
    await scope
      .getByText(fixture.t(item.application), { exact: true })
      .waitFor();
  }
  await assertNoOverflow(fixture.page);
  if (fixture.width <= 760) await mobileComparisonGeometry(fixture);
  return scope;
}

async function finish(fixture) {
  assert.deepEqual(
    fixture.errors,
    [],
    "No browser exceptions or external/network writes",
  );
  await fixture.context.close();
}

async function mobileGeometry(fixture) {
  const measured = await scopeOf(fixture).evaluate((scope) => {
    const bounds = scope.getBoundingClientRect();
    const visible = (node) => {
      if (
        !node.getClientRects().length ||
        getComputedStyle(node).visibility === "hidden"
      )
        return false;
      for (
        let parent = node.parentElement;
        parent && parent !== scope;
        parent = parent.parentElement
      ) {
        if (
          parent instanceof HTMLDetailsElement &&
          !parent.open &&
          !parent.querySelector(":scope > summary")?.contains(node)
        )
          return false;
      }
      return true;
    };
    const overflow = [
      ...scope.querySelectorAll(
        "input, select, textarea, button, summary, table, th, td, form, article, p, label",
      ),
    ]
      .filter(visible)
      .filter((node) => {
        const box = node.getBoundingClientRect();
        return (
          box.width > 2 &&
          (box.left < bounds.left - 1 ||
            box.right > bounds.right + 1 ||
            node.scrollWidth > node.clientWidth + 1)
        );
      })
      .map((node) => ({
        tag: node.tagName,
        name: node.getAttribute("name"),
        width: node.clientWidth,
        scrollWidth: node.scrollWidth,
      }));
    const smallTargets = [
      ...scope.querySelectorAll("button, input, select, textarea, summary"),
    ]
      .filter(visible)
      .filter((node) => {
        const box = node.getBoundingClientRect();
        return box.width < 43.9 || box.height < 43.9;
      })
      .map((node) => ({
        tag: node.tagName,
        name: node.getAttribute("name"),
        height: node.getBoundingClientRect().height,
      }));
    const fields = [...scope.querySelectorAll("input, select, textarea")]
      .filter(visible)
      .map((node) => Number.parseFloat(getComputedStyle(node).fontSize));
    const context = document.createElement("canvas").getContext("2d");
    const selectedOptions = [...scope.querySelectorAll("select")]
      .filter(visible)
      .map((node) => {
        const style = getComputedStyle(node);
        context.font = style.font;
        return {
          text: node.selectedOptions[0]?.text ?? "",
          textWidth: context.measureText(node.selectedOptions[0]?.text ?? "")
            .width,
          available:
            node.clientWidth -
            Number.parseFloat(style.paddingLeft) -
            Number.parseFloat(style.paddingRight) -
            28,
        };
      });
    return { overflow, smallTargets, fields, selectedOptions };
  });
  assert.deepEqual(
    measured.overflow,
    [],
    "Visible controls, reading blocks and cells fit their container",
  );
  assert.deepEqual(
    measured.smallTargets,
    [],
    "Every visible control has a 44 px touch target",
  );
  assert.ok(
    measured.fields.length > 0 && measured.fields.every((font) => font >= 16),
    "Mobile fields retain at least 16 px type",
  );
  for (const option of measured.selectedOptions)
    assert.ok(
      option.textWidth <= option.available + 1,
      `Selected label fits with native arrow space: ${option.text}`,
    );
  await assertNoOverflow(fixture.page);
  return measured;
}

function comparisonRow(fixture, label) {
  return scopeOf(fixture)
    .locator("[data-tasting-comparison] tr")
    .filter({
      has: fixture.page.getByRole("rowheader", {
        name: fixture.t(label),
        exact: true,
      }),
    });
}

async function comparisonSemantics(fixture) {
  const comparison = scopeOf(fixture).locator("[data-tasting-comparison]");
  const table = comparison.getByRole("table", {
    name: fixture.t("Compare your samples"),
    exact: true,
  });
  assert.equal(
    await table.count(),
    1,
    "Responsive comparison retains a named table",
  );
  assert.equal(await table.getByRole("columnheader").count(), 2);
  const associations = await table
    .locator('tbody tr:has(th[scope="row"])')
    .evaluateAll((rows) =>
      rows.map((row) => {
        const heading = row.querySelector('th[scope="row"]');
        return [...row.querySelectorAll("td")].every((cell) => {
          const ids = (cell.getAttribute("headers") ?? "").split(/\s+/);
          const headers = ids.map((id) => document.getElementById(id));
          return (
            heading.id &&
            ids.includes(heading.id) &&
            headers.every(Boolean) &&
            headers.some((node) => node.getAttribute("scope") === "col")
          );
        });
      }),
    );
  assert.ok(
    associations.length === 4 && associations.every(Boolean),
    "Every comparison value retains its row and tea column associations",
  );
  return table;
}

async function mobileComparisonGeometry(fixture) {
  const table = await comparisonSemantics(fixture);
  const tableBounds = await table.boundingBox();
  const selects = scopeOf(fixture).locator("[data-tasting-comparison] select");
  const first = await selects.nth(0).boundingBox();
  const second = await selects.nth(1).boundingBox();
  assert.ok(
    second.y >= first.y + first.height,
    "Tea selectors occupy distinct labeled rows",
  );
  for (const label of ["Application", "Sample size", "Recipe"]) {
    const row = comparisonRow(fixture, label);
    const heading = await row.getByRole("rowheader").boundingBox();
    const cells = await row.getByRole("cell").all();
    assert.equal(cells.length, 2);
    assert.ok(
      heading.width >= tableBounds.width - 2,
      `${label} has its own full-width label`,
    );
    for (const cell of cells) {
      const box = await cell.boundingBox();
      assert.ok(
        box.width >= tableBounds.width * 0.44,
        `${label} values have useful reading width`,
      );
      assert.ok(
        box.y >= heading.y + heading.height - 1,
        `${label} values follow the label`,
      );
      assert.ok(
        await cell.evaluate(
          (node) => Number.parseFloat(getComputedStyle(node).fontSize) >= 14,
        ),
      );
    }
  }
  const notes = comparisonRow(fixture, "Your notes").getByRole("cell");
  const boxes = await notes.evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      const paragraph = node.querySelector("p");
      const style = getComputedStyle(paragraph);
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        font: Number.parseFloat(style.fontSize),
        lineHeight: Number.parseFloat(style.lineHeight),
        clipped:
          paragraph.scrollHeight > paragraph.clientHeight + 1 ||
          paragraph.scrollWidth > paragraph.clientWidth + 1,
      };
    }),
  );
  assert.equal(boxes.length, 2);
  assert.ok(
    boxes[1].y >= boxes[0].y + boxes[0].height,
    "Long notes are stacked rather than squeezed into narrow columns",
  );
  for (const box of boxes) {
    assert.ok(
      box.width >= tableBounds.width - 2,
      "Each tasting note uses the table width",
    );
    assert.ok(
      box.font >= 14 && box.lineHeight / box.font >= 1.6,
      "Notes have readable body size and line spacing",
    );
    assert.equal(
      box.clipped,
      false,
      "Complete notes remain readable without clipping",
    );
  }
  await mobileGeometry(fixture);
}

async function feedbackBesideAction(fixture, status, action) {
  await status.waitFor({ state: "visible" });
  const statusNode = await status.elementHandle();
  await fixture.page.waitForFunction((node) => {
    const box = node.getBoundingClientRect();
    return box.top >= 0 && box.bottom <= innerHeight + 1;
  }, statusNode);
  await statusNode.dispose();
  const statusBox = await status.boundingBox();
  const actionBox = await action.boundingBox();
  assert.ok(
    statusBox.y >= actionBox.y + actionBox.height - 1 &&
      statusBox.y <= actionBox.y + actionBox.height + 100,
    "Feedback appears beside its action instead of below the whole workspace",
  );
  assert.ok(
    statusBox.y >= 0 &&
      statusBox.y + statusBox.height <= fixture.page.viewportSize().height + 1,
    "Action feedback is immediately in the current viewport",
  );
}

try {
  for (const [width, tone, locale] of [
    [320, "light", "en"],
    [390, "dark", "en"],
    [1440, "light", "en"],
    [320, "light", "ja"],
    [320, "dark", "zh-Hans"],
    [320, "light", "zh-Hant"],
  ]) {
    await run(`layout-${width}-${tone}-${locale}`, async () => {
      const fixture = await setup({ width, tone, locale });
      try {
        await openTools(fixture);
        assert.equal(
          await readSaved(fixture.page),
          null,
          "Initial rendering does not save",
        );
        await screenshot(fixture, "default-editor");
        if (width <= 760) await mobileGeometry(fixture);
        await checkComparison(fixture);
        assert.equal(
          await readSaved(fixture.page),
          null,
          "Comparison does not save",
        );
        await fillCard(fixture, "barista");
        assert.equal(
          await readSaved(fixture.page),
          null,
          "Editing does not save",
        );
        await chooseTea(fixture, "ceremonial");
        await assertDraft(fixture, "barista");
        for (const { key } of SAMPLE_SET_CONTENTS) await saveCard(fixture, key);
        assert.deepEqual(
          (await readSaved(fixture.page)).records,
          Object.fromEntries(
            Object.entries(tastingFixtures).map(([key, draft]) => [
              key,
              savedRecord(draft),
            ]),
          ),
        );
        await fixture.page.reload();
        await fixture.page.waitForFunction(
          () =>
            document.querySelector('[data-tasting-tea="ceremonial"]')
              ?.disabled === false,
        );
        for (const { key } of SAMPLE_SET_CONTENTS)
          await assertDraft(fixture, key);
        await openPreview(fixture);
        await assertNoOverflow(fixture.page);
        if (width <= 760) await mobileGeometry(fixture);
        await screenshot(fixture, "card");
        const compare = await checkComparison(fixture);
        for (const key of ["barista", "culinary"])
          await compare
            .getByText(tastingFixtures[key].notes, { exact: true })
            .waitFor();
        await screenshot(fixture, "comparison");
        await compare
          .getByRole("button", {
            name: fixture.t("Edit {matcha} card", {
              matcha: fixture.t(
                SAMPLE_SET_CONTENTS.find((tea) => tea.key === "barista").name,
              ),
            }),
            exact: true,
          })
          .click();
        await fixture.page.waitForFunction(
          () => document.activeElement?.getAttribute("name") === "notes",
        );
        await button(fixture, "Clear saved card").click();
        assert.equal(
          await button(fixture, "Save tasting card").evaluate(
            (node) => node === document.activeElement,
          ),
          true,
          "Clearing a saved card restores focus to Save tasting card",
        );
        const remaining = await readSaved(fixture.page);
        assert.deepEqual(Object.keys(remaining.records).sort(), [
          "ceremonial",
          "culinary",
        ]);
        assert.equal(
          await scopeOf(fixture).locator('[name="notes"]').inputValue(),
          "",
        );
        await fixture.page.reload();
        await fixture.page.waitForFunction(
          () =>
            document.querySelector('[data-tasting-tea="ceremonial"]')
              ?.disabled === false,
        );
        await chooseTea(fixture, "barista");
        assert.equal(
          await scopeOf(fixture).locator('[name="notes"]').inputValue(),
          "",
        );
        for (const key of ["ceremonial", "culinary"])
          await assertDraft(fixture, key);
        await finish(fixture);
      } catch (error) {
        await fixture.page
          .screenshot({
            path: `${evidence}/${engine}-failure-${width}-${tone}-${locale}.png`,
            fullPage: true,
          })
          .catch(() => {});
        throw error;
      } finally {
        await fixture.context.close();
      }
    });
  }

  for (const [width, tone, locale] of [
    [320, "light", "en"],
    [320, "dark", "ja"],
    [320, "light", "zh-Hans"],
  ]) {
    await run(`mobile-long-notes-${width}-${tone}-${locale}`, async () => {
      const fixture = await setup({ width, tone, locale });
      const notes = {
        ceremonial:
          "A consistent recipe makes the finish and texture easier to compare. "
            .repeat(12)
            .slice(0, 600),
        barista:
          "香りと旨味を比べる。牛乳の量を一定にして記録する。比较香气与口感，保持相同配方。"
            .repeat(20)
            .slice(0, 600),
        culinary: "MATCHA".repeat(100),
      };
      try {
        await openTools(fixture);
        for (const { key } of SAMPLE_SET_CONTENTS)
          await saveCard(fixture, key, {
            ...tastingFixtures[key],
            notes: notes[key],
          });
        await chooseTea(fixture, "culinary");
        const preview = await openPreview(fixture);
        await mobileGeometry(fixture);
        const prep = await scopeOf(fixture)
          .locator('[name="preparation"]')
          .boundingBox();
        const form = scopeOf(fixture).locator("form");
        const formBox = await form.boundingBox();
        assert.ok(
          prep.width >= formBox.width - 2,
          "Preparation occupies its own full-width row",
        );
        const quantities = await scopeOf(fixture)
          .locator(
            'input[name="matchaGrams"], input[name="waterMl"], input[name="milkMl"]',
          )
          .evaluateAll((nodes) =>
            nodes.map((node) => ({
              top: node.getBoundingClientRect().top,
              left: node.getBoundingClientRect().left,
            })),
          );
        assert.ok(
          quantities.every(
            (box) =>
              Math.abs(box.top - quantities[0].top) < 1 &&
              box.top >= prep.y + prep.height,
          ),
          "The three recipe quantities share one row below Preparation",
        );
        const save = button(fixture, "Save tasting card");
        assert.ok((await save.boundingBox()).width >= formBox.width - 2);
        await save.evaluate((node) => {
          const box = node.getBoundingClientRect();
          scrollTo({
            top: box.top + scrollY - innerHeight + box.height + 4,
            behavior: "instant",
          });
        });
        await save.click();
        const editorStatus = form.getByRole("status");
        await editorStatus
          .getByText(fixture.t("Saved on this device."), { exact: true })
          .waitFor();
        await feedbackBesideAction(
          fixture,
          editorStatus,
          button(fixture, "Clear saved card"),
        );
        assert.notEqual(
          await preview.getAttribute("open"),
          null,
          "Saving keeps an expanded preview open",
        );
        await fixture.page.screenshot({
          path: `${evidence}/${engine}-${width}-${locale}-save-feedback.png`,
        });
        await fixture.page.evaluate(() =>
          Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: {
              writeText: async (text) => {
                window.__tastingCopiedText = text;
              },
            },
          }),
        );
        const copy = button(fixture, "Copy card");
        const download = button(fixture, "Download card");
        assert.ok(
          (await copy.boundingBox()).width >= formBox.width - 2 &&
            (await download.boundingBox()).width >= formBox.width - 2,
          "Export actions span the mobile card width",
        );
        await copy.evaluate((node) =>
          node.scrollIntoView({ block: "center", behavior: "instant" }),
        );
        await copy.click();
        const exportStatus = preview.getByRole("status");
        await exportStatus
          .getByText(fixture.t("Card copied."), { exact: true })
          .waitFor();
        await feedbackBesideAction(fixture, exportStatus, download);
        assert.ok(
          (
            await fixture.page.evaluate(() => window.__tastingCopiedText)
          ).includes(notes.culinary),
        );
        await fixture.page.screenshot({
          path: `${evidence}/${engine}-${width}-${locale}-export-feedback.png`,
        });
        const pair = await comparison(fixture);
        await mobileComparisonGeometry(fixture);
        await pair.first.selectOption("culinary");
        await mobileComparisonGeometry(fixture);
        const noteCells = comparisonRow(fixture, "Your notes").getByRole(
          "cell",
        );
        for (const [index, key] of ["culinary", "barista"].entries()) {
          const cell = noteCells.nth(index);
          assert.equal(await cell.locator("p").textContent(), notes[key]);
          await cell
            .getByText(
              fixture.t(
                SAMPLE_SET_CONTENTS.find((tea) => tea.key === key).name.replace(
                  / Matcha$/,
                  "",
                ),
              ),
              { exact: true },
            )
            .waitFor();
        }
        await screenshot(fixture, "long-note-comparison");
        await writeFile(
          `${evidence}/${engine}-${width}-${locale}-comparison-accessibility.txt`,
          await pair.scope.ariaSnapshot(),
        );
        await pair.scope
          .getByRole("button", {
            name: fixture.t("Edit {matcha} card", {
              matcha: fixture.t(
                SAMPLE_SET_CONTENTS.find((tea) => tea.key === "barista").name,
              ),
            }),
            exact: true,
          })
          .click();
        await fixture.page.waitForFunction(
          () => document.activeElement?.getAttribute("name") === "notes",
        );
        assert.equal(
          await scopeOf(fixture).locator('[name="notes"]').inputValue(),
          notes.barista,
        );
        await finish(fixture);
      } catch (error) {
        await fixture.page
          .screenshot({
            path: `${evidence}/${engine}-${width}-${locale}-long-note-failure.png`,
          })
          .catch(() => {});
        throw error;
      } finally {
        await fixture.context.close();
      }
    });
  }

  await run("validation-and-export", async () => {
    const fixture = await setup({ width: 390, tone: "dark" });
    try {
      await openTools(fixture);
      await button(fixture, "Save tasting card").click();
      await scopeOf(fixture)
        .getByRole("status")
        .getByText("Add a note or recipe before saving.", { exact: true })
        .waitFor();
      assert.equal(await readSaved(fixture.page), null);
      await fillCard(fixture, "ceremonial", {
        ...tastingFixtures.ceremonial,
        matchaGrams: "2.1234",
      });
      await button(fixture, "Save tasting card").click();
      assert.equal(
        await scopeOf(fixture)
          .locator('[name="matchaGrams"]')
          .getAttribute("aria-invalid"),
        "true",
      );
      assert.equal(
        await readSaved(fixture.page),
        null,
        "Invalid quantities do not save",
      );
      await fillCard(fixture, "ceremonial");
      const preview = await openPreview(fixture);
      await preview
        .getByText(tastingFixtures.ceremonial.notes, { exact: true })
        .waitFor();
      await fixture.page.evaluate(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async () => {
              throw new DOMException(
                "Fixture clipboard denied",
                "NotAllowedError",
              );
            },
          },
        });
      });
      await button(fixture, "Copy card").click();
      const fallback = preview.getByRole("textbox", {
        name: "Card text",
        exact: true,
      });
      await fallback.waitFor({ state: "visible" });
      const text = await fallback.inputValue();
      assert.ok(text.includes("ATOMA / Tasting card"));
      assert.ok(text.includes(tastingFixtures.ceremonial.notes));
      assert.ok(text.includes("2.125 g"));
      assert.ok(text.includes("Your personal tasting notes"));
      await fixture.page.waitForFunction(() => {
        const node = document.querySelector(
          "[data-tasting-preview] textarea[readonly]",
        );
        return (
          node === document.activeElement &&
          node.selectionStart === 0 &&
          node.selectionEnd === node.value.length
        );
      });
      assert.equal(
        await fallback.evaluate(
          (node) =>
            node === document.activeElement &&
            node.selectionStart === 0 &&
            node.selectionEnd === node.value.length,
        ),
        true,
      );
      await screenshot(fixture, "copy-fallback");
      await fixture.page.evaluate(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (text) => {
              window.__tastingCopiedText = text;
            },
          },
        });
      });
      await button(fixture, "Copy card").click();
      await scopeOf(fixture)
        .getByRole("status")
        .getByText("Card copied.", { exact: true })
        .waitFor();
      assert.equal(
        await fixture.page.evaluate(() => window.__tastingCopiedText),
        text,
      );
      const [download] = await Promise.all([
        fixture.page.waitForEvent("download"),
        button(fixture, "Download card").click(),
      ]);
      assert.match(download.suggestedFilename(), /\.png$/i);
      const downloadPath = `${evidence}/${engine}-exported-tasting-card.png`;
      await download.saveAs(downloadPath);
      assert.equal(await download.failure(), null);
      await preview
        .getByRole("status")
        .getByText("Download started.", { exact: true })
        .waitFor();
      await feedbackBesideAction(
        fixture,
        preview.getByRole("status"),
        button(fixture, "Download card"),
      );
      const png = await readFile(downloadPath);
      assert.deepEqual(
        [...png.subarray(0, 8)],
        [137, 80, 78, 71, 13, 10, 26, 10],
      );
      assert.ok(
        png.readUInt32BE(16) >= 600,
        "Export is a real, legible PNG canvas",
      );
      assert.ok(png.readUInt32BE(20) >= 600);
      assert.equal(
        await readSaved(fixture.page),
        null,
        "Copy and download do not silently save",
      );
      await finish(fixture);
    } finally {
      await fixture.context.close();
    }
  });

  await run("download-palette-in-place", async () => {
    const fixture = await setup({ width: 390, tone: "dark" });
    try {
      await openTools(fixture);
      await saveCard(fixture, "ceremonial");
      const stored = await readSaved(fixture.page);
      const notes =
        "Soft finish; repeat this recipe. 抹茶の試飲記録。\n"
          .repeat(16)
          .slice(0, 570) + "\nFinal note: keep this recipe.";
      await scopeOf(fixture).locator('[name="notes"]').fill(notes);
      const preview = await openPreview(fixture);
      await fixture.page.evaluate(() => {
        window.__tastingOriginalRoot = document.querySelector(
          "[data-sample-tasting-tools]",
        );
        window.__tastingOriginalNotes = document.querySelector(
          '[data-sample-tasting-tools] [name="notes"]',
        );
        const fillText = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function (...args) {
          if (window.__tastingCaptureDrawing)
            window.__tastingImageText.push({
              text: String(args[0]),
              x: args[1],
              y: args[2],
              font: this.font,
            });
          return fillText.apply(this, args);
        };
      });
      const exports = [];
      for (const [index, tone] of ["dark", "light", "dark"].entries()) {
        if (index) {
          await fixture.page
            .getByRole("switch", { name: "Dark mode", exact: true })
            .first()
            .click();
          await fixture.page.waitForFunction(
            (expected) =>
              document.querySelector("[data-samples-page]")?.dataset.tone ===
              expected,
            tone,
          );
        }
        const palette = await preview.locator("article").evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            surface: style.backgroundColor,
            ink: style.color,
            muted: getComputedStyle(node.querySelector("dt")).color,
          };
        });
        await fixture.page.evaluate(() => {
          window.__tastingImageText = [];
          window.__tastingCaptureDrawing = true;
        });
        const [download] = await Promise.all([
          fixture.page.waitForEvent("download"),
          button(fixture, "Download card").click(),
        ]);
        const path = `${evidence}/${engine}-theme-${index + 1}-${tone}.png`;
        await download.saveAs(path);
        assert.equal(await download.failure(), null);
        const rendered = await fixture.page.evaluate(() => {
          window.__tastingCaptureDrawing = false;
          return window.__tastingImageText;
        });
        const notesStart = rendered.findIndex(
          (line) => line.text === "Your notes",
        );
        const notesEnd = rendered.findIndex(
          (line) => line.text === "Your personal tasting notes",
        );
        assert.ok(notesStart >= 0 && notesEnd > notesStart);
        const noteLines = rendered.slice(notesStart + 1, notesEnd);
        assert.equal(
          noteLines
            .map((line) => line.text)
            .join("")
            .replace(/\s/gu, ""),
          notes.replace(/\s/gu, ""),
          "The complete current note is laid out, including its final line",
        );
        for (const text of [
          "ATOMA",
          "Tasting card",
          "Ceremonial Matcha",
          SAMPLE_SET_CONTENTS.find((item) => item.key === "ceremonial")
            .productCode,
          "2.125 g",
          "70 ml",
        ])
          assert.ok(rendered.some((line) => line.text === text));
        const png = await readFile(path);
        const pixels = await fixture.page.evaluate(
          async ({ data, palette, lastNote }) => {
            const image = new Image();
            image.src = `data:image/png;base64,${data}`;
            await image.decode();
            const canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0);
            const decoded = context.getImageData(
              0,
              0,
              image.width,
              image.height,
            ).data;
            const colorCanvas = document.createElement("canvas");
            colorCanvas.width = colorCanvas.height = 1;
            const colorContext = colorCanvas.getContext("2d");
            const rgb = (color) => {
              colorContext.clearRect(0, 0, 1, 1);
              colorContext.fillStyle = color;
              colorContext.fillRect(0, 0, 1, 1);
              return [...colorContext.getImageData(0, 0, 1, 1).data];
            };
            const expected = Object.fromEntries(
              Object.entries(palette).map(([key, color]) => [key, rgb(color)]),
            );
            const pixel = (x, y) => {
              const offset = (y * image.width + x) * 4;
              return [...decoded.slice(offset, offset + 4)];
            };
            const count = (color, left, top, right, bottom) => {
              let found = 0;
              for (let y = Math.floor(top); y < Math.ceil(bottom); y++)
                for (let x = left; x < right; x++)
                  if (
                    pixel(x, y).every(
                      (channel, index) => Math.abs(channel - color[index]) <= 2,
                    )
                  )
                    found++;
              return found;
            };
            const luminance = (rgba) =>
              rgba.slice(0, 3).reduce((total, value, index) => {
                const normalized = value / 255;
                const linear =
                  normalized <= 0.04045
                    ? normalized / 12.92
                    : ((normalized + 0.055) / 1.055) ** 2.4;
                return total + linear * [0.2126, 0.7152, 0.0722][index];
              }, 0);
            const surfaceLuminance = luminance(pixel(0, 0));
            const inkLuminance = luminance(expected.ink);
            return {
              width: image.width,
              height: image.height,
              expected,
              corners: [
                pixel(0, 0),
                pixel(image.width - 1, 0),
                pixel(0, image.height - 1),
                pixel(image.width - 1, image.height - 1),
              ],
              headingInk: count(expected.ink, 72, 72, 340, 132),
              headingMuted: count(expected.muted, 72, 165, 600, 230),
              finalNoteInk: count(
                expected.ink,
                72,
                lastNote.y - 30,
                image.width - 72,
                lastNote.y + 10,
              ),
              contrast:
                (Math.max(surfaceLuminance, inkLuminance) + 0.05) /
                (Math.min(surfaceLuminance, inkLuminance) + 0.05),
            };
          },
          {
            data: png.toString("base64"),
            palette,
            lastNote: noteLines.findLast((line) => line.text.trim()),
          },
        );
        const background =
          tone === "dark" ? [18, 25, 35, 255] : [248, 250, 246, 255];
        assert.deepEqual(pixels.expected.surface, background);
        assert.deepEqual(pixels.corners, Array(4).fill(background));
        assert.ok(pixels.headingInk > 100, "Decoded PNG contains palette ink");
        assert.ok(pixels.headingMuted > 30, "Decoded PNG contains muted text");
        assert.ok(
          pixels.finalNoteInk > 50,
          "The final note is visible in PNG pixels",
        );
        assert.ok(
          pixels.contrast >= 7,
          "Exported text contrasts with its actual background",
        );
        assert.equal(pixels.width, 1200);
        assert.ok(rendered.every((line) => line.y < pixels.height - 50));
        exports.push({ tone, path, pixels, rendered });
        assert.equal(await preview.getAttribute("open"), "");
        assert.equal(
          await scopeOf(fixture).locator('[name="notes"]').inputValue(),
          notes,
        );
        assert.deepEqual(await readSaved(fixture.page), stored);
        assert.equal(
          await fixture.page.evaluate(
            () =>
              document.querySelector("[data-sample-tasting-tools]") ===
                window.__tastingOriginalRoot &&
              document.querySelector(
                '[data-sample-tasting-tools] [name="notes"]',
              ) === window.__tastingOriginalNotes,
          ),
          true,
          "Changing theme preserves the mounted editor and current draft",
        );
      }
      for (const item of exports.slice(1)) {
        assert.deepEqual(item.rendered, exports[0].rendered);
        assert.equal(item.pixels.height, exports[0].pixels.height);
      }
      assert.deepEqual(exports[2].pixels, exports[0].pixels);
      await writeFile(
        `${evidence}/${engine}-download-palette-pixels.json`,
        `${JSON.stringify(exports, null, 2)}\n`,
      );
      await finish(fixture);
    } finally {
      await fixture.context.close();
    }
  });

  await run("mobile-late-clipboard-result", async () => {
    const fixture = await setup({ width: 390 });
    try {
      await openTools(fixture);
      await fillCard(fixture, "ceremonial");
      const preview = await openPreview(fixture);
      await fixture.page.evaluate(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: () =>
              new Promise((resolve) => {
                window.__resolveTastingClipboard = resolve;
              }),
          },
        });
      });
      await button(fixture, "Copy card").click();
      await fixture.page.waitForFunction(
        () => typeof window.__resolveTastingClipboard === "function",
      );
      await preview.locator("summary").focus();
      await preview.locator("summary").press("Enter");
      assert.equal(await preview.getAttribute("open"), null);
      await fixture.page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      const before = await fixture.page.evaluate(() => {
        window.__tastingFocusBeforeCopyResolution = document.activeElement;
        return { x: scrollX, y: scrollY };
      });
      await fixture.page.evaluate(() => window.__resolveTastingClipboard());
      await fixture.page.waitForFunction(() =>
        document
          .querySelector('[data-tasting-preview] [role="status"]')
          ?.textContent.includes("Card copied."),
      );
      await fixture.page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      assert.deepEqual(
        await fixture.page.evaluate(() => ({ x: scrollX, y: scrollY })),
        before,
        "A late clipboard result does not scroll after its preview closes",
      );
      assert.equal(
        await fixture.page.evaluate(
          () =>
            document.activeElement ===
            window.__tastingFocusBeforeCopyResolution,
        ),
        true,
        "A late clipboard result preserves the focused disclosure summary",
      );
      assert.equal(await preview.getAttribute("open"), null);
      assert.equal(await readSaved(fixture.page), null);
      await finish(fixture);
    } finally {
      await fixture.context.close();
    }
  });

  for (const behavior of ["throw", "noop"]) {
    await run(`storage-${behavior}`, async () => {
      const fixture = await setup({ width: 320 });
      try {
        await openTools(fixture);
        await saveCard(fixture, "ceremonial");
        await saveCard(fixture, "barista");
        const prior = await readSaved(fixture.page);
        await blockStorageWrites(fixture.page, behavior);
        const changed = {
          ...tastingFixtures.barista,
          notes: "An unsaved update that must stay available.",
        };
        await fillCard(fixture, "barista", changed);
        await button(fixture, "Save tasting card").click();
        await scopeOf(fixture)
          .getByRole("status")
          .getByText(
            "Your card could not be saved on this device. You can still copy or download it.",
            { exact: true },
          )
          .waitFor();
        assert.deepEqual(await readSaved(fixture.page), prior);
        await button(fixture, "Compare samples").click();
        await scopeOf(fixture)
          .getByRole("status")
          .getByText(
            "Device storage is unavailable. You can still copy or download a card.",
            { exact: true },
          )
          .waitFor();
        await assertDraft(fixture, "barista", changed);
        await chooseTea(fixture, "ceremonial");
        await button(fixture, "Clear saved card").click();
        await scopeOf(fixture)
          .getByRole("status")
          .getByText("Your saved card could not be cleared.", { exact: true })
          .waitFor();
        assert.deepEqual(await readSaved(fixture.page), prior);
        await assertDraft(fixture, "ceremonial");
        await assertDraft(fixture, "barista", changed);
        const preview = await openPreview(fixture);
        await fixture.page.evaluate(() =>
          Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText: async () => {} },
          }),
        );
        await button(fixture, "Copy card").click();
        await preview
          .getByRole("status")
          .getByText("Card copied.", { exact: true })
          .waitFor();
        await preview.locator("summary").click();
        await scopeOf(fixture)
          .getByRole("status")
          .getByText(
            "Device storage is unavailable. You can still copy or download a card.",
            { exact: true },
          )
          .waitFor();
        await button(fixture, "Compare samples").click();
        await scopeOf(fixture)
          .getByRole("status")
          .getByText(
            "Device storage is unavailable. You can still copy or download a card.",
            { exact: true },
          )
          .waitFor();
        await screenshot(fixture, `storage-${behavior}`);
        await finish(fixture);
      } finally {
        await fixture.context.close();
      }
    });
  }

  await run("storage-read-blocked", async () => {
    const fixture = await setup({ width: 320 });
    try {
      await fixture.context.addInitScript((key) => {
        const getItem = Storage.prototype.getItem;
        Storage.prototype.getItem = function (name) {
          if (name === key)
            throw new DOMException("Fixture storage blocked", "SecurityError");
          return getItem.call(this, name);
        };
      }, SAMPLE_TASTINGS_STORAGE_KEY);
      await openTools(fixture);
      await scopeOf(fixture)
        .getByRole("status")
        .getByText(
          "Device storage is unavailable. You can still copy or download a card.",
          { exact: true },
        )
        .waitFor();
      await fillCard(fixture, "culinary");
      await button(fixture, "Save tasting card").click();
      await scopeOf(fixture)
        .getByRole("status")
        .getByText(
          "Your card could not be saved on this device. You can still copy or download it.",
          { exact: true },
        )
        .waitFor();
      await assertDraft(fixture, "culinary");
      await openPreview(fixture);
      assert.equal(await button(fixture, "Download card").isEnabled(), true);
      await finish(fixture);
    } finally {
      await fixture.context.close();
    }
  });

  await run("cross-tab-persistence", async () => {
    const fixture = await setup({ width: 1440 });
    try {
      await openTools(fixture);
      await saveCard(fixture, "ceremonial");
      const second = { ...fixture, page: await fixture.context.newPage() };
      second.page.on("pageerror", (error) =>
        fixture.errors.push(error.message),
      );
      await openTools(second);
      await assertDraft(second, "ceremonial");
      await saveCard(second, "culinary");
      await fixture.page.waitForFunction(
        () =>
          document.querySelector(
            '[data-tasting-tea="culinary"] [aria-label]',
          ) !== null,
      );
      await assertDraft(fixture, "culinary");
      await chooseTea(second, "ceremonial");
      await button(second, "Clear saved card").click();
      await fixture.page.waitForFunction(
        () =>
          document.querySelector(
            '[data-tasting-tea="ceremonial"] [aria-label]',
          ) === null,
      );
      assert.deepEqual(Object.keys((await readSaved(fixture.page)).records), [
        "culinary",
      ]);
      await assertDraft(fixture, "culinary");
      await finish(fixture);
    } finally {
      await fixture.context.close();
    }
  });

  await run("no-javascript", async () => {
    const fixture = await setup({ width: 320, javaScriptEnabled: false });
    try {
      await fixture.page.goto(`${baseURL}/samples`);
      const scope = scopeOf(fixture);
      await scope.waitFor();
      await scope
        .getByText(
          "Enable JavaScript to save and compare your tasting cards.",
          { exact: true },
        )
        .waitFor();
      assert.equal(
        await button(fixture, "Save tasting card").isEnabled(),
        false,
      );
      assert.equal(await button(fixture, "Compare samples").isEnabled(), false);
      await scope.locator("[data-tasting-preview] summary").click();
      await scope
        .locator("[data-tasting-preview]")
        .getByText("Tea with water", { exact: true })
        .waitFor();
      assert.equal(await button(fixture, "Copy card").isEnabled(), false);
      assert.equal(await button(fixture, "Download card").isEnabled(), false);
      await assertNoOverflow(fixture.page);
      await screenshot(fixture, "no-javascript");
      await finish(fixture);
    } finally {
      await fixture.context.close();
    }
  });
} finally {
  await browser.close();
  await writeFile(
    `${evidence}/${engine}${filter ? `-${filter.replace(/[^a-z0-9-]+/gi, "-")}` : ""}-results.json`,
    `${JSON.stringify(results, null, 2)}\n`,
  );
}
