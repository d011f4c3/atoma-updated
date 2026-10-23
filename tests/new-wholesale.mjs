/* Wholesale collection: compact browsing, direct ordering and optional learning. */
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
const baseURL = process.env.NEW_WHOLESALE_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.NEW_WHOLESALE_EVIDENCE ?? ".local/wholesale-0270/tests";
const requested = process.env.NEW_WHOLESALE_CASES?.split(",").filter(Boolean);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
await mkdir(evidence, { recursive: true });

const collection = (page) => page.locator("[data-new-wholesale]");
const cards = (page) => page.locator("[data-wholesale-product]:visible");
const trigger = (page, key) =>
  page.locator(`[data-wholesale-product-trigger="${key}"]:visible`).first();
const popup = (page) =>
  page.locator("dialog[data-wholesale-product-dialog][open]");
const close = (page) => popup(page).locator("[data-wholesale-product-close]");
const reader = (page) => popup(page).locator("[data-wholesale-product-scroll]");
const product = (page) =>
  popup(page).locator("[data-wholesale-learning-product]:visible");
const handle = (key) =>
  SAMPLE_SET_CONTENTS.find((item) => item.key === key).productHandle;
const card = (page, key) =>
  page.locator(`[data-wholesale-product="${handle(key)}"]:visible`);
const purchase = (page, key = "barista") =>
  card(page, key).locator("[data-wholesale-purchase]");
const quantity = (page, key = "barista") =>
  purchase(page, key).locator("[data-wholesale-quantity]");
const add = (page, key = "barista") =>
  purchase(page, key).locator("[data-wholesale-add] button");
const why = (page) => page.locator("[data-wholesale-why]");
const whyAction = (page) => page.locator("[data-wholesale-why-action]");
const imageMode = (page, mode) =>
  page.locator(`[data-wholesale-image-mode="${mode}"]`);

async function setImageMode(page, mode) {
  await imageMode(page, mode).click();
  await eventually(
    async () =>
      (await imageMode(page, mode).getAttribute("aria-pressed")) === "true" &&
      (new URL(page.url()).searchParams.get("image") ?? "application") === mode,
    "The chosen image mode is reflected in the control and URL",
  );
}

async function inspectImageToggle(page) {
  const width = page.viewportSize().width;
  const boxes = [];
  for (const mode of ["application", "powder"]) {
    const button = imageMode(page, mode);
    assert.ok(await button.getAttribute("aria-pressed"));
    const box = await button.boundingBox();
    assert.ok(
      box && box.width >= 44 && box.height >= 44,
      "Image choices retain comfortable touch targets",
    );
    assert.ok(
      box.x >= -1 && box.x + box.width <= width + 1,
      "Both image choices fit the configured viewport",
    );
    assert.ok(
      await button.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
      "The complete image-choice label remains readable",
    );
    boxes.push(box);
  }
  assert.ok(
    boxes[1].x >= boxes[0].x + boxes[0].width - 1 ||
      boxes[1].y >= boxes[0].y + boxes[0].height - 1,
    "Image-choice touch targets do not overlap",
  );
  await noOverflow(page);
}

async function inspectWhy(page) {
  assert.equal(await why(page).isVisible(), true);
  assert.equal(await why(page).getByRole("heading", { level: 2 }).count(), 1);
  const reasons = why(page).locator("[data-wholesale-why-reason]");
  assert.equal(await reasons.count(), 3);
  assert.equal(await whyAction(page).getAttribute("href"), "/samples");
  const geometry = await why(page).evaluate((section) => {
    const rect = (node) => {
      const box = node.getBoundingClientRect();
      return {
        x: box.x,
        y: box.y,
        right: box.right,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
      };
    };
    return {
      width: innerWidth,
      section: rect(section),
      collectionBottom: Math.max(
        ...Array.from(
          document.querySelectorAll("[data-wholesale-product]:not([hidden])"),
          (node) => node.getBoundingClientRect().bottom,
        ),
      ),
      reasons: Array.from(
        section.querySelectorAll("[data-wholesale-why-reason]"),
        (node) => ({
          ...rect(node),
          scrollWidth: node.scrollWidth,
          clientWidth: node.clientWidth,
          fontSize: parseFloat(
            getComputedStyle(node.querySelector("p")).fontSize,
          ),
        }),
      ),
      action: rect(section.querySelector("[data-wholesale-why-action]")),
    };
  });
  assert.ok(
    geometry.section.y >= geometry.collectionBottom,
    "Why ATOMA follows the visible matcha collection",
  );
  for (const [index, reason] of geometry.reasons.entries()) {
    assert.ok(
      reason.x >= -1 &&
        reason.right <= geometry.width + 1 &&
        reason.scrollWidth <= reason.clientWidth + 1,
      "Each reason remains contained without horizontal scrolling",
    );
    if (geometry.width <= 1000)
      assert.ok(
        reason.fontSize >= (geometry.width <= 760 ? 15 : 16),
        "Mobile reasons retain readable body text",
      );
    if (!index) continue;
    const previous = geometry.reasons[index - 1];
    assert.ok(
      geometry.width > 1000
        ? Math.abs(reason.y - previous.y) < 2 && reason.x >= previous.right
        : reason.y >= previous.bottom && Math.abs(reason.x - previous.x) < 2,
      "Reasons form a desktop row and a non-overlapping mobile stack",
    );
  }
  assert.ok(
    geometry.action.width >= 44 &&
      geometry.action.height >= 44 &&
      geometry.action.x >= -1 &&
      geometry.action.right <= geometry.width + 1,
    "The Sample Set action remains a reachable touch target",
  );
}

async function showOrder(page, key = "barista") {
  await purchase(page, key).waitFor({ state: "visible" });
  return purchase(page, key);
}

async function inspectOrder(page, key = "barista") {
  const order = await showOrder(page, key);
  assert.ok(
    await order.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    "Ordering needs no horizontal scrolling",
  );
  for (const control of await order
    .locator("button:visible, select:visible")
    .all()) {
    await control.scrollIntoViewIfNeeded();
    const box = await control.boundingBox();
    const width = page.viewportSize().width;
    assert.ok(
      box && box.height >= 44 && box.width >= 44,
      "Order controls retain comfortable touch targets",
    );
    assert.ok(
      box.x >= -1 && box.x + box.width <= width + 1,
      "Order controls fit the screen",
    );
  }
}

async function eventually(check, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function ready(page, path = "/wholesale", expected = 3) {
  await page.goto(`${baseURL}${path}`);
  await collection(page).waitFor();
  await page.evaluate(() => document.fonts.ready);
  if (expected !== null)
    await eventually(
      async () => (await cards(page).count()) === expected,
      `The collection shows ${expected} published matchas`,
    );
}

async function openSearch(page) {
  const input = page.locator("[data-wholesale-search]");
  if (!(await input.isVisible()))
    await page.locator("[data-wholesale-search-toggle]").click();
  await input.waitFor({ state: "visible" });
  if (page.viewportSize().width <= 760)
    assert.ok(
      await input.evaluate(
        (node) => parseFloat(getComputedStyle(node).fontSize) >= 16,
      ),
      "The mobile search field retains 16px type to avoid input zoom",
    );
  return input;
}

async function query(page, value, expected) {
  await (await openSearch(page)).fill(value);
  await eventually(
    async () =>
      (await cards(page).count()) === expected &&
      (new URL(page.url()).searchParams.get("q") ?? "") === value,
    `Search '${value}' has ${expected} results and is retained in the URL`,
  );
}

async function choose(page, key) {
  const control = trigger(page, key);
  await control.scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => scrollY);
  const url = page.url();
  await control.click();
  await popup(page).waitFor();
  assert.equal(
    await popup(page).evaluate((node) => node.matches(":modal")),
    true,
  );
  assert.equal(
    await product(page).getAttribute("data-wholesale-learning-product"),
    key,
  );
  assert.equal(new URL(page.url()).searchParams.get("matcha"), key);
  assert.equal(
    new URL(page.url()).searchParams.get("q"),
    new URL(url).searchParams.get("q"),
    "Opening a product preserves the collection query",
  );
  await eventually(
    () => close(page).evaluate((node) => node === document.activeElement),
    "Close receives initial focus",
  );
  assert.ok(Math.abs((await page.evaluate(() => scrollY)) - scroll) < 2);
  return { control, scroll, url };
}

async function returned(page, entry) {
  await popup(page).waitFor({ state: "detached" });
  await eventually(
    () => entry.control.evaluate((node) => node === document.activeElement),
    "Dismissal restores the exact product trigger",
  );
  assert.equal(page.url(), entry.url, "Dismissal restores the collection URL");
  assert.ok(
    Math.abs((await page.evaluate(() => scrollY)) - entry.scroll) < 2,
    "Dismissal preserves the collection scroll position",
  );
  assert.notEqual(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).overflow,
    ),
    "hidden",
    "Dismissal releases the reader scroll lock",
  );
}

async function noOverflow(page) {
  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  assert.ok(
    scrollWidth <= page.viewportSize().width + 1,
    "The collection does not overflow horizontally",
  );
}

async function inspectPopup(page) {
  const geometry = await popup(page).evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      right: rect.right,
      bottom: rect.bottom,
      width: innerWidth,
      height: innerHeight,
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
    };
  });
  assert.ok(
    geometry.x > 0 && geometry.y > 0,
    "The reader remains an inset popup",
  );
  assert.ok(
    geometry.right < geometry.width && geometry.bottom < geometry.height,
  );
  assert.ok(geometry.scrollWidth <= geometry.clientWidth + 1);
  assert.ok(
    await reader(page).evaluate(
      (node) => node.scrollWidth <= node.clientWidth + 1,
    ),
    "Reader content needs no horizontal scrolling",
  );
  assert.equal(
    await product(page).locator("[data-wholesale-profile] > div").count(),
    6,
    "The complete profile stays available in optional learning",
  );
  assert.equal(
    await popup(page).locator("[data-wholesale-purchase]").count(),
    0,
    "The collection owns purchasing without a duplicate form inside learning",
  );
  for (const target of [
    close(page),
    popup(page).locator("[data-wholesale-return-order]"),
  ]) {
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    const outer = await popup(page).boundingBox();
    assert.ok(box && outer && box.width >= 44 && box.height >= 44);
    assert.ok(
      box.x >= outer.x && box.x + box.width <= outer.x + outer.width + 1,
    );
    assert.ok(
      box.y >= outer.y && box.y + box.height <= outer.y + outer.height + 1,
    );
  }
}

async function snapshot(page, label, fullPage = false) {
  await page.addStyleTag({
    content:
      "nextjs-portal { display: none !important; } * { caret-color: transparent !important; }",
  });
  await page.evaluate(async (fullPage) => {
    await Promise.all(
      [...document.images]
        .filter((image) => {
          const box = image.getBoundingClientRect();
          return (
            box.width &&
            box.height &&
            (fullPage || (box.top < innerHeight && box.bottom > 0))
          );
        })
        .map((image) => image.decode().catch(() => {})),
    );
  }, fullPage);
  await page.screenshot({
    path: `${evidence}/${label}.png`,
    animations: "disabled",
    fullPage,
  });
}

function catalog({ soldOut = [], extra = [], status = "ready" } = {}) {
  const products = SAMPLE_SET_CONTENTS.map((item, index) => ({
    id: item.key,
    handle: item.productHandle,
    title: item.name,
    productCode: item.productCode,
    description: "Isolated wholesale browser fixture.",
    imageUrl: null,
    imageAlt: "",
    productUrl: null,
    isFixture: true,
    variants: [
      {
        id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
        title: "1 kg",
        available: !soldOut.includes(item.key),
        priceMinor: 6000 + index * 1000,
        currency: "JPY",
        options: [{ name: "Size", value: "1 kg" }],
        minimum: 1,
        maximum: 4,
        increment: 1,
      },
    ],
  }));
  return {
    status,
    shopUrl: "https://example.invalid",
    products:
      status === "ready"
        ? [
            ...products,
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
            ...extra,
          ]
        : [],
  };
}

async function run(label, width, tone, locale, options, callback) {
  if (requested && !requested.includes(label)) return;
  const fixture = await createHeroStudyFixture(
    browser,
    baseURL,
    width,
    tone,
    locale,
    options,
  );
  try {
    await callback(fixture);
    assert.deepEqual(fixture.errors, [], `${label}: no client errors`);
    assert.deepEqual(fixture.writes, [], `${label}: no live commerce writes`);
    results.push(label);
    console.log(`New wholesale passed: ${label}`);
  } catch (error) {
    await fixture.page.screenshot({ path: `${evidence}/${label}-failure.png` });
    throw error;
  } finally {
    fixture.release();
    await fixture.context.close();
  }
}

try {
  for (const tone of ["light", "dark"]) {
    for (const width of [1440, 1280, 390, 320]) {
      await run(
        `library-${width}-${tone}`,
        width,
        tone,
        "en",
        {},
        async ({ page }) => {
          if (width === 1280)
            await page.setViewportSize({ width, height: 720 });
          if (width === 320) await page.setViewportSize({ width, height: 568 });
          await ready(page);
          assert.equal(await collection(page).locator("h1:visible").count(), 1);
          const boxes = await cards(page).evaluateAll((nodes) =>
            nodes.map((node) => {
              const { x, y, width, height } = node.getBoundingClientRect();
              return { x, y, width, height };
            }),
          );
          for (let index = 1; index < boxes.length; index++) {
            if (width > 1000) {
              assert.ok(
                Math.abs(boxes[index].y - boxes[0].y) < 2 &&
                  boxes[index].x >=
                    boxes[index - 1].x + boxes[index - 1].width - 1,
                "Desktop presents the three products in one compact comparison row",
              );
            } else {
              assert.ok(
                boxes[index].y >=
                  boxes[index - 1].y + boxes[index - 1].height - 1 &&
                  Math.abs(boxes[index].x - boxes[0].x) < 2 &&
                  Math.abs(boxes[index].width - boxes[0].width) < 2,
                "Mobile presents equal-width cards in one vertical scroll without overlap",
              );
            }
          }
          for (const item of SAMPLE_SET_CONTENTS) {
            assert.ok(
              (await card(page, item.key).textContent()).includes(item.name),
            );
            assert.ok(
              (await card(page, item.key).textContent()).includes(
                item.productCode,
              ),
            );
            const bounds = await trigger(page, item.key).boundingBox();
            assert.ok(bounds && bounds.height >= 44 && bounds.width >= 44);
            assert.match(
              await trigger(page, item.key).getAttribute("aria-label"),
              /Quick view/,
              "The compact learning control has an explicit accessible name",
            );
            for (const target of ["image", "name"])
              assert.equal(
                await card(page, item.key)
                  .locator(`[data-wholesale-direct-link="${target}"]`)
                  .getAttribute("href"),
                `/shop/${item.productHandle}`,
                "Product imagery and identity lead directly to the canonical product",
              );
            assert.equal(
              await purchase(page, item.key).isVisible(),
              true,
              "Ordering is available directly in every card without a disclosure",
            );
            assert.equal(await add(page, item.key).isEnabled(), true);
            const total = await purchase(page, item.key)
              .locator("[data-wholesale-total]")
              .evaluate((node) => {
                const bounds = node.parentElement.getBoundingClientRect();
                return { width: bounds.width, height: bounds.height };
              });
            assert.ok(
              total.width <= 1 || total.height <= 1,
              "A single-unit order avoids repeating its unit price as a total",
            );
            if (width > 1000) {
              const action = await add(page, item.key).boundingBox();
              assert.ok(
                action &&
                  action.y + action.height <= page.viewportSize().height,
                "Desktop purchase actions fit completely in the first viewport",
              );
            } else {
              const entry = card(page, item.key);
              const outer = await entry.boundingBox();
              const image = await entry
                .locator('[data-wholesale-direct-link="image"]')
                .boundingBox();
              const identity = await entry
                .locator('[data-wholesale-direct-link="name"]')
                .boundingBox();
              const order = await purchase(page, item.key).boundingBox();
              assert.ok(
                image.width >= outer.width * 0.9 &&
                  image.height >= (width <= 760 ? 144 : 160),
                "Mobile cards lead with a substantial image across their width",
              );
              assert.ok(
                identity.y >= image.y + image.height - 1 &&
                  order.y >= identity.y + identity.height - 1 &&
                  order.width >= image.width - 48,
                "Product identity and direct buying follow the image in one clear vertical card",
              );
            }
          }
          assert.equal(
            await cards(page).filter({ hasText: "Sample Set" }).count(),
            0,
            "The sample offer remains separate from the matcha collection",
          );
          assert.doesNotMatch(
            await collection(page).innerText(),
            /coming soon|temporary filters/i,
          );
          await noOverflow(page);
          await inspectWhy(page);
          await snapshot(page, `library-${width}-${tone}`, width < 760);
          await why(page).screenshot({
            path: `${evidence}/why-${width}-${tone}.png`,
            animations: "disabled",
          });
          assert.equal(
            await cards(page)
              .locator('[data-wholesale-image="application"]')
              .count(),
            3,
            "Known matchas show their application by default",
          );
          await inspectOrder(page);
          if (width < 760) {
            await snapshot(page, `order-${width}-${tone}`);
            assert.equal(
              await popup(page).count(),
              0,
              "Mobile ordering needs no popup",
            );
          }
        },
      );
    }
  }

  for (const tone of ["light", "dark"]) {
    for (const width of [1440, 390]) {
      await run(
        `image-toggle-${width}-${tone}`,
        width,
        tone,
        "en",
        {},
        async ({ page }) => {
          await ready(page);
          await eventually(
            () => add(page).isEnabled(),
            "The catalog is ready for ordering",
          );
          assert.equal(
            await imageMode(page, "application").getAttribute("aria-pressed"),
            "true",
          );
          await inspectImageToggle(page);
          await snapshot(page, `images-${width}-${tone}-application`);
          await setImageMode(page, "powder");
          assert.equal(
            await cards(page)
              .locator('[data-wholesale-image="powder"]')
              .count(),
            3,
          );
          for (const [key, photograph] of Object.entries({
            culinary: "culinary",
            barista: "latte",
            ceremonial: "tea-service",
          }))
            assert.equal(
              await card(page, key)
                .locator('[data-wholesale-image="powder"] img')
                .getAttribute("src"),
              `/images/matcha/${photograph}.jpg`,
              "Powder mode uses each product's approved photograph",
            );
          await eventually(
            async () =>
              (await cards(page)
                .locator(
                  '[data-wholesale-image="powder"] [data-pending="true"]',
                )
                .count()) === 0,
            "The approved powder photographs finish preparing",
          );
          await snapshot(page, `images-${width}-${tone}-powder`);

          await purchase(page)
            .getByRole("button", { name: "Increase quantity" })
            .click();
          await query(page, "barista", 1);
          const buyer = await purchase(page).elementHandle();
          await setImageMode(page, "application");
          await setImageMode(page, "powder");
          assert.equal(await quantity(page).textContent(), "2");
          assert.equal(await (await openSearch(page)).inputValue(), "barista");
          assert.equal(new URL(page.url()).searchParams.get("q"), "barista");
          assert.equal(
            await buyer.evaluate((node) => node.isConnected),
            true,
            "Changing imagery retains the mounted buyer and its selection",
          );
          for (const target of ["image", "name"])
            assert.equal(
              await card(page, "barista")
                .locator(`[data-wholesale-direct-link="${target}"]`)
                .getAttribute("href"),
              `/shop/${handle("barista")}`,
            );

          const entry = await choose(page, "barista");
          assert.equal(new URL(page.url()).searchParams.get("image"), "powder");
          await close(page).click();
          await returned(page, entry);
          assert.equal(
            await imageMode(page, "powder").getAttribute("aria-pressed"),
            "true",
          );
          if (width === 390 && tone === "dark") {
            await card(page, "barista")
              .locator('[data-wholesale-direct-link="name"]')
              .click();
            await page.waitForURL(`${baseURL}/shop/${handle("barista")}`);
            await page.goBack();
            await collection(page).waitFor();
            await eventually(
              async () => (await quantity(page).textContent()) === "2",
              "Product-page Back restores the exact wholesale order",
            );
            assert.equal(
              await imageMode(page, "powder").getAttribute("aria-pressed"),
              "true",
            );
            assert.equal(new URL(page.url()).searchParams.get("q"), "barista");
          }
          await query(page, "", 3);
          assert.equal(
            await cards(page)
              .locator('[data-wholesale-image="powder"]')
              .count(),
            3,
          );
          await setImageMode(page, "application");
          assert.equal(
            await cards(page)
              .locator('[data-wholesale-image="application"]')
              .count(),
            3,
          );
          assert.equal(await quantity(page).textContent(), "2");
          await inspectImageToggle(page);
        },
      );
    }
  }

  await run(
    "image-toggle-enlarged",
    320,
    "dark",
    "ja",
    {},
    async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await ready(page, "/wholesale?q=UJI-00&image=powder", 1);
      await page.addStyleTag({
        content: "html { font-size: 200% !important; }",
      });
      const invitation = collection(page).locator(
        'header[data-page-enter="text"] a[href="/samples"]',
      );
      const invitationBox = await invitation.boundingBox();
      assert.ok(
        invitationBox.x >= 0 &&
          invitationBox.x + invitationBox.width <= page.viewportSize().width &&
          (await invitation.evaluate(
            (node) => node.scrollWidth <= node.clientWidth + 1,
          )),
        "The enlarged Sample Set invitation fits its mobile column",
      );
      await invitation.screenshot({
        path: `${evidence}/images-320-dark-ja-enlarged-samples.png`,
        animations: "disabled",
      });
      assert.equal(
        await imageMode(page, "powder").getAttribute("aria-pressed"),
        "true",
        "A shared URL restores powder imagery directly",
      );
      await inspectImageToggle(page);
      await page
        .locator("[data-wholesale-image-toggle]")
        .scrollIntoViewIfNeeded();
      await snapshot(page, "images-320-dark-ja-enlarged-powder");
      await setImageMode(page, "application");
      assert.equal(new URL(page.url()).searchParams.get("q"), "UJI-00");
      assert.equal(await cards(page).count(), 1);
      await inspectImageToggle(page);
      await snapshot(page, "images-320-dark-ja-enlarged-application");
    },
  );

  await run("legacy-route", 1440, "light", "en", {}, async ({ page }) => {
    await ready(page, "/new-wholesale?q=latte&matcha=barista", 1);
    const url = new URL(page.url());
    assert.equal(url.pathname, "/wholesale");
    assert.equal(url.searchParams.get("q"), "latte");
    assert.equal(url.searchParams.get("matcha"), "barista");
    await popup(page).waitFor();
    assert.equal(
      await product(page).getAttribute("data-wholesale-learning-product"),
      "barista",
      "A shared study URL opens the same matcha on the adopted wholesale route",
    );
    await close(page).click();
    await popup(page).waitFor({ state: "detached" });
    assert.equal(page.url(), `${baseURL}/wholesale?q=latte`);
    await eventually(
      () =>
        trigger(page, "barista").evaluate(
          (node) => node === document.activeElement,
        ),
      "The redirected product returns focus to its visible collection entry",
    );
    const links = await collection(page)
      .locator('a[data-nav-action="shop"]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
    assert.ok(
      links.length > 0 && links.every((href) => href === "/wholesale"),
      "Storefront Wholesale navigation points to the adopted collection",
    );
    await page.goto(baseURL);
    assert.equal(
      await page
        .locator('a[data-nav-action="shop"]')
        .first()
        .getAttribute("href"),
      "/wholesale",
      "The canonical homepage opens the adopted Wholesale collection",
    );
    assert.equal(
      await page
        .locator('[data-storefront-footer] nav a[href="/wholesale"]')
        .count(),
      1,
      "The canonical homepage footer uses the same Wholesale destination",
    );
  });

  await run("search-and-return", 390, "light", "en", {}, async ({ page }) => {
    await ready(page);
    for (const [value, expected] of [
      ["latte", "barista"],
      ["WZKA-00", "ceremonial"],
      ["baking", "culinary"],
      ["barista", "barista"],
    ]) {
      await query(page, value, 1);
      assert.equal(
        await trigger(page, expected).count(),
        1,
        "Search matches names, codes and applications",
      );
    }
    await showOrder(page);
    await purchase(page)
      .getByRole("button", { name: "Increase quantity" })
      .click();
    assert.equal(await quantity(page).textContent(), "2");
    const total = await purchase(page)
      .locator("[data-wholesale-total]")
      .boundingBox();
    assert.ok(
      total && total.height >= 16,
      "A multi-unit order reveals its complete total",
    );
    assert.equal(
      await purchase(page).locator("[data-wholesale-total]").textContent(),
      "¥14,000",
      "The revealed total uses the published price and exact quantity",
    );
    await query(page, "ceremonial", 1);
    await query(page, "barista", 1);
    await showOrder(page);
    assert.equal(
      await quantity(page).textContent(),
      "2",
      "Search preserves each row's order",
    );
    const entry = await choose(page, "barista");
    await close(page).click();
    await returned(page, entry);
    assert.equal(await quantity(page).textContent(), "2");
    await page.reload();
    await collection(page).waitFor();
    assert.equal(
      await (await openSearch(page)).inputValue(),
      "barista",
      "Reloading preserves the query",
    );
    await query(page, "no-matching-tea", 0);
    await snapshot(page, "search-no-results");
    await page.locator("[data-wholesale-clear-search]:visible").last().click();
    await eventually(
      async () => (await cards(page).count()) === 3,
      "The no-results action restores the complete collection",
    );
    assert.equal(new URL(page.url()).searchParams.has("q"), false);
    const input = await openSearch(page);
    await input.focus();
    await page.keyboard.press("Escape");
    await eventually(
      () =>
        page
          .locator("[data-wholesale-search-toggle]")
          .evaluate((node) => node === document.activeElement),
      "Closing mobile search returns focus to its toggle",
    );
  });

  await run("why-sample-handoff", 390, "light", "en", {}, async ({ page }) => {
    await ready(page);
    await query(page, "barista", 1);
    await purchase(page)
      .getByRole("button", { name: "Increase quantity" })
      .click();
    await inspectWhy(page);
    await whyAction(page).scrollIntoViewIfNeeded();
    assert.equal(new URL(page.url()).searchParams.get("q"), "barista");
    assert.equal(
      await quantity(page).textContent(),
      "2",
      "Reading Why ATOMA leaves the selected order intact",
    );
    await whyAction(page).click();
    await page.waitForURL(`${baseURL}/samples`);
    await page.locator("[data-samples-page]").waitFor();
    await page.goBack();
    await collection(page).waitFor();
    await eventually(
      async () => (await quantity(page).textContent()) === "2",
      "Returning from the Sample Set restores the wholesale order",
    );
    assert.equal(new URL(page.url()).searchParams.get("q"), "barista");
    assert.equal(
      await cards(page).count(),
      1,
      "Returning from the Sample Set preserves the collection search",
    );
  });

  await run("dialog-history", 1440, "dark", "en", {}, async ({ page }) => {
    await ready(page);
    await showOrder(page, "ceremonial");
    await purchase(page, "ceremonial")
      .getByRole("button", { name: "Increase quantity" })
      .click();
    await purchase(page, "ceremonial")
      .getByRole("button", { name: "Increase quantity" })
      .click();
    assert.equal(await quantity(page, "ceremonial").textContent(), "3");
    let entry = await choose(page, "ceremonial");
    await inspectPopup(page);
    await product(page).locator("[data-wholesale-preparation] summary").click();
    assert.equal(
      await product(page)
        .locator("[data-wholesale-preparation]")
        .getAttribute("open"),
      "",
    );
    await snapshot(page, "desktop-dialog");
    await popup(page).locator("[data-wholesale-return-order]").click();
    await returned(page, entry);
    assert.equal(await quantity(page, "ceremonial").textContent(), "3");
    assert.equal(
      await quantity(page).textContent(),
      "1",
      "Products retain independent orders",
    );
    entry = await choose(page, "barista");
    await page.keyboard.press("Escape");
    await returned(page, entry);
    entry = await choose(page, "ceremonial");
    await page.mouse.click(2, 2);
    await returned(page, entry);
    entry = await choose(page, "ceremonial");
    await page.goBack();
    await returned(page, entry);
    await page.goForward();
    await popup(page).waitFor();
    await close(page).click();
    await returned(page, entry);
    assert.equal(await quantity(page, "ceremonial").textContent(), "3");
  });

  await run(
    "direct-product-return",
    390,
    "light",
    "en",
    {},
    async ({ page }) => {
      await ready(page, "/wholesale?q=latte", 1);
      await showOrder(page);
      await purchase(page)
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      await purchase(page)
        .getByRole("button", { name: "Increase quantity", exact: true })
        .click();
      const direct = card(page, "barista").locator(
        '[data-wholesale-direct-link="name"]',
      );
      await direct.click();
      await page.waitForURL(`${baseURL}/shop/${handle("barista")}`);
      const retail = page.locator(
        `[data-retail-product="${handle("barista")}"]`,
      );
      await retail.locator("[data-retail-purchase] output").waitFor();
      await eventually(
        async () =>
          (await retail
            .locator("[data-retail-purchase] output")
            .textContent()) === "3",
        "The exact row quantity accompanies a direct product visit",
      );
      assert.equal(await popup(page).count(), 0);
      await page.goBack();
      await collection(page).waitFor();
      await eventually(
        async () => (await cards(page).count()) === 1,
        "Back restores the filtered collection",
      );
      assert.equal(new URL(page.url()).searchParams.get("q"), "latte");
      await showOrder(page);
      assert.equal(
        await quantity(page).textContent(),
        "3",
        "The row order survives a canonical product visit and Back",
      );
      await noOverflow(page);
    },
  );

  await run("direct-and-resize", 390, "dark", "en", {}, async ({ page }) => {
    await ready(page, "/wholesale?q=latte&matcha=barista#library", 1);
    await popup(page).waitFor();
    await inspectPopup(page);
    await snapshot(page, "mobile-dialog");
    await close(page).click();
    await popup(page).waitFor({ state: "detached" });
    assert.equal(page.url(), `${baseURL}/wholesale?q=latte#library`);
    await eventually(
      () =>
        trigger(page, "barista").evaluate(
          (node) => node === document.activeElement,
        ),
      "A directly shared product returns to its visible collection entry",
    );
    await showOrder(page);
    await purchase(page)
      .getByRole("button", { name: "Increase quantity" })
      .click();
    const entry = await choose(page, "barista");
    await page.setViewportSize({ width: 1440, height: 900 });
    await inspectPopup(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.touchscreen.tap(2, 2);
    await returned(page, entry);
    assert.equal(
      await quantity(page).textContent(),
      "2",
      "Resizing and learning retain the row order",
    );
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width > 1000 ? 900 : 844 });
      assert.equal(await purchase(page).isVisible(), true);
      assert.equal(
        await quantity(page).textContent(),
        "2",
        "The same direct buyer retains its order across desktop and mobile layouts",
      );
    }
    await ready(page, "/wholesale?q=latte&matcha=ceremonial", 1);
    await popup(page).waitFor();
    await close(page).click();
    await popup(page).waitFor({ state: "detached" });
    await eventually(
      () =>
        page
          .locator(
            "[data-new-wholesale] h1, [data-wholesale-collection-heading]",
          )
          .evaluateAll((nodes) =>
            nodes.some(
              (node) =>
                node === document.activeElement && node.checkVisibility(),
            ),
          ),
      "A hidden product returns focus to a visible collection heading",
    );
  });

  await run(
    "unavailable",
    390,
    "light",
    "en",
    {},
    async ({ context, page }) => {
      await context.route("**/api/catalog", (route) =>
        route.fulfill({ json: catalog({ soldOut: ["barista"] }) }),
      );
      await ready(page);
      await showOrder(page);
      await add(page)
        .getByText("Currently unavailable", { exact: true })
        .waitFor();
      assert.equal(await add(page).isDisabled(), true);
      assert.equal(
        await purchase(page)
          .getByRole("button", { name: "Increase quantity" })
          .count(),
        0,
        "A single-format unavailable product offers no ineffective quantity control",
      );
      assert.equal(
        await add(page).innerText(),
        "Currently unavailable",
        "The disabled purchase action clearly states availability",
      );
      await inspectOrder(page);
      await snapshot(page, "unavailable");
      const entry = await choose(page, "barista");
      await inspectPopup(page);
      await close(page).click();
      await returned(page, entry);
      await showOrder(page, "culinary");
      assert.equal(
        await add(page, "culinary").isEnabled(),
        true,
        "One sold-out tea does not block other offers",
      );
    },
  );

  await run(
    "published-formats",
    390,
    "dark",
    "en",
    {},
    async ({ context, page }) => {
      const data = catalog();
      const tea = data.products.find((item) => item.id === "ceremonial");
      const original = tea.variants[0];
      tea.variants = [
        { ...original, available: false, minimum: 2, increment: 2, maximum: 6 },
        {
          ...original,
          id: `v1_${"z".repeat(43)}`,
          title: "100 g",
          options: [{ name: "Size", value: "100 g" }],
          priceMinor: 1000,
          minimum: 3,
          increment: 3,
          maximum: 9,
        },
      ];
      await context.route("**/api/catalog", (route) =>
        route.fulfill({ json: data }),
      );
      await ready(page);
      const order = await showOrder(page, "ceremonial");
      const formats = order.locator("select[data-wholesale-format]");
      assert.equal(
        await formats.inputValue(),
        tea.variants[1].id,
        "A published available format is selected initially",
      );
      assert.equal(await quantity(page, "ceremonial").textContent(), "3");
      const increase = order.getByRole("button", { name: "Increase quantity" });
      await increase.click();
      assert.equal(await quantity(page, "ceremonial").textContent(), "6");
      await increase.click();
      assert.equal(await quantity(page, "ceremonial").textContent(), "9");
      assert.equal(
        await increase.isDisabled(),
        true,
        "Published increments and maxima constrain ordering",
      );
      await formats.selectOption(original.id);
      assert.equal(await quantity(page, "ceremonial").textContent(), "2");
      assert.equal(await add(page, "ceremonial").isDisabled(), true);
      await formats.selectOption(tea.variants[1].id);
      assert.equal(await add(page, "ceremonial").isEnabled(), true);
      await inspectOrder(page, "ceremonial");
    },
  );

  await run(
    "catalog-loading",
    390,
    "light",
    "en",
    {},
    async ({ context, page }) => {
      let release;
      const gate = new Promise((done) => {
        release = done;
      });
      await context.route("**/api/catalog", async (route) => {
        await gate;
        await route.fulfill({ json: catalog() });
      });
      try {
        await ready(page, "/wholesale", null);
        const state = page.locator('[data-wholesale-status="loading"]');
        await state.waitFor();
        assert.equal(await cards(page).count(), 0);
        assert.match(await state.innerText(), /Loading/);
        assert.doesNotMatch(await state.innerText(), /unavailable/);
      } finally {
        release();
      }
      await eventually(
        async () => (await cards(page).count()) === 3,
        "The published collection appears after loading",
      );
      await showOrder(page);
      assert.equal(
        await add(page).isEnabled(),
        true,
        "The real offer is enabled after loading",
      );
    },
  );

  for (const status of ["empty", "unavailable"]) {
    await run(
      `catalog-${status}`,
      390,
      status === "empty" ? "dark" : "light",
      "en",
      {},
      async ({ context, page }) => {
        await context.route("**/api/catalog", (route) =>
          route.fulfill({ json: catalog({ status }) }),
        );
        await ready(page, "/wholesale", 0);
        await page
          .locator(
            `[data-wholesale-status="${status === "empty" ? "empty" : "error"}"]`,
          )
          .waitFor();
        assert.equal(
          await cards(page).count(),
          0,
          "A missing catalog never invents purchasable products",
        );
        assert.equal(
          await collection(page)
            .getByRole("button", { name: "Add to cart", exact: true })
            .count(),
          0,
        );
        await noOverflow(page);
        await snapshot(page, `catalog-${status}`);
        if (status === "unavailable") {
          await context.unroute("**/api/catalog");
          await collection(page)
            .getByRole("button", { name: /^Try again/ })
            .click();
          await eventually(
            async () => (await cards(page).count()) === 3,
            "Retry restores the collection",
          );
        }
      },
    );
  }

  await run(
    "future-catalog",
    1440,
    "light",
    "en",
    {},
    async ({ context, page }) => {
      const next = {
        ...catalog().products[0],
        id: "future-product-fixture",
        handle: "future-product-fixture",
        title: "Future collection fixture",
        productCode: "NXT-02",
        variants: [
          { ...catalog().products[0].variants[0], id: `v1_${"f".repeat(43)}` },
        ],
      };
      const future = Array.from({ length: 9 }, (_, index) =>
        index === 0
          ? next
          : {
              ...next,
              id: `future-product-fixture-${index}`,
              handle: `future-product-fixture-${index}`,
              title: `Future matcha fixture ${index + 1}`,
              productCode: `NXT-${String(index + 2).padStart(2, "0")}`,
              variants: [
                {
                  ...next.variants[0],
                  id: `v1_${String.fromCharCode(102 + index).repeat(43)}`,
                },
              ],
            },
      );
      await context.route("**/api/catalog", (route) =>
        route.fulfill({ json: catalog({ extra: future }) }),
      );
      await ready(page, "/wholesale", 12);
      const item = page.locator(
        '[data-wholesale-product="future-product-fixture"]:visible',
      );
      assert.ok((await item.textContent()).includes(next.title));
      assert.ok((await item.innerText()).includes(next.productCode));
      assert.doesNotMatch(
        await item.innerText(),
        /Wazuka|UJI|Ceremonial|Full · rounded|Gentle/i,
      );
      assert.equal(
        await item.locator('a[href="/shop/future-product-fixture"]').count(),
        2,
        "Future product imagery and identity have their real product destination",
      );
      assert.equal(
        await item.locator("[data-wholesale-add] button").isEnabled(),
        true,
        "A future published product supports ordering without custom UI changes",
      );
      await page.setViewportSize({ width: 1800, height: 1000 });
      const rows = await cards(page).evaluateAll((nodes) =>
        nodes.map((node) => {
          const { x, y, right, bottom } = node.getBoundingClientRect();
          const add = node
            .querySelector("[data-wholesale-add] button")
            .getBoundingClientRect();
          return { x, y, right, bottom, actionBottom: add.bottom };
        }),
      );
      for (let index = 1; index < rows.length; index++) {
        const column = index % 4;
        if (column > 0) {
          assert.ok(
            Math.abs(rows[index].y - rows[index - column].y) < 2 &&
              rows[index].x >= rows[index - 1].right - 1,
            "A twelve-product library uses four distinct columns on a wide desktop",
          );
          assert.ok(
            Math.abs(
              rows[index].actionBottom - rows[index - column].actionBottom,
            ) < 2,
            "Purchase actions align even when future products have less editorial content",
          );
        } else {
          assert.ok(
            rows[index].y >= rows[index - 4].bottom - 1 &&
              Math.abs(rows[index].x - rows[0].x) < 2,
            "Additional products continue on distinct rows without overlap",
          );
        }
      }
      await noOverflow(page);
      await snapshot(page, "future-catalog-wide");
      await page.setViewportSize({ width: 1440, height: 900 });
      await query(page, "NXT-02", 1);
      assert.equal(await item.isVisible(), true);
      await noOverflow(page);
      await snapshot(page, "future-catalog");
    },
  );

  await run(
    "ambiguous-catalog",
    1440,
    "dark",
    "en",
    {},
    async ({ context, page }) => {
      const duplicate = {
        ...catalog().products[0],
        id: "duplicate-product-fixture",
        title: "Ambiguous catalog fixture",
        productCode: "DUP-02",
      };
      await context.route("**/api/catalog", (route) =>
        route.fulfill({ json: catalog({ extra: [duplicate] }) }),
      );
      await ready(page, "/wholesale", 4);
      await query(page, "DUP-02", 1);
      assert.ok((await cards(page).textContent()).includes(duplicate.title));
      assert.equal(
        await cards(page).locator("[data-wholesale-purchase]").count(),
        0,
        "Ambiguous catalog handles never bind to an arbitrary order",
      );
      assert.doesNotMatch(
        await cards(page).innerText(),
        /Wazuka|Tea service|Clean green/i,
      );
    },
  );

  await run(
    "japanese-enlarged",
    320,
    "dark",
    "ja",
    {},
    async ({ context, page }) => {
      const data = catalog();
      for (const item of data.products)
        for (const variant of item.variants) {
          variant.currency = "USD";
          variant.priceMinor = 13000;
        }
      await context.route("**/api/catalog", (route) =>
        route.fulfill({ json: data }),
      );
      await context.route("**/api/destination", (route) =>
        route.fulfill({
          json: {
            kind: "ready",
            preference: { countryCode: "US", source: "default" },
            destination: { countryCode: "US", currency: "USD" },
            countries: ["US", "SG"],
            reviewRequired: false,
          },
        }),
      );
      await page.setViewportSize({ width: 320, height: 568 });
      await ready(page);
      await page.addStyleTag({
        content: "html { font-size: 200% !important; }",
      });
      await noOverflow(page);
      await inspectWhy(page);
      assert.equal(
        await why(page).getByRole("heading", { level: 2 }).textContent(),
        "ATOMAを選ぶ理由",
        "The new section follows the selected language",
      );
      await why(page).screenshot({
        path: `${evidence}/why-japanese-enlarged.png`,
        animations: "disabled",
      });
      await query(page, "UJI-00", 1);
      await quantity(page).locator("..").getByRole("button").last().click();
      assert.equal(await quantity(page).textContent(), "2");
      const total = await purchase(page)
        .locator("[data-wholesale-total]")
        .boundingBox();
      const bounds = await purchase(page).boundingBox();
      assert.ok(
        total &&
          total.height >= 32 &&
          total.x >= bounds.x - 1 &&
          total.x + total.width <= bounds.x + bounds.width + 1,
        "The enlarged multi-unit currency total remains readable inside the card",
      );
      const amountLines = await purchase(page)
        .locator("[data-wholesale-unit-price]")
        .evaluate((node) => {
          const text = Array.from(node.childNodes).find(
            (child) =>
              child.nodeType === Node.TEXT_NODE &&
              /\d[\d,]*\.\d{2}/.test(child.textContent),
          );
          const amount = text?.textContent.match(/\d[\d,]*\.\d{2}/);
          if (!amount) return 0;
          const range = document.createRange();
          range.setStart(text, amount.index);
          range.setEnd(text, amount.index + amount[0].length);
          return Array.from(range.getClientRects()).filter(
            (rect) => rect.width && rect.height,
          ).length;
        });
      assert.equal(
        amountLines,
        1,
        "The enlarged unit price keeps its numeric amount and decimal places on one line",
      );
      await inspectOrder(page);
      await snapshot(page, "japanese-order-enlarged");
      const entry = await choose(page, "barista");
      await product(page)
        .locator("[data-wholesale-preparation] summary")
        .click();
      await inspectPopup(page);
      for (const control of await popup(page)
        .locator("button:visible, summary:visible")
        .all()) {
        await control.scrollIntoViewIfNeeded();
        const bounds = await control.boundingBox();
        const outer = await popup(page).boundingBox();
        assert.ok(
          bounds.x >= outer.x - 1 &&
            bounds.x + bounds.width <= outer.x + outer.width + 1,
          "Enlarged Japanese controls fit the reader width",
        );
      }
      await snapshot(page, "japanese-enlarged");
      await close(page).click();
      await returned(page, entry);
      await noOverflow(page);
    },
  );

  await run(
    "pending-guard",
    390,
    "dark",
    "en",
    { holdMutation: true },
    async (test) => {
      const { page } = test;
      await ready(page);
      await showOrder(page);
      await purchase(page)
        .getByRole("button", { name: "Increase quantity" })
        .click();
      await add(page).click();
      await eventually(
        () => test.simulatedWrites.length === 1,
        "The isolated purchase attempt is held",
      );
      const current = page.url();
      assert.equal(await add(page).isDisabled(), true);
      assert.equal(
        await purchase(page)
          .getByRole("button", { name: "Increase quantity" })
          .isDisabled(),
        true,
        "The visible quantity controls stay locked during the purchase attempt",
      );
      await trigger(page, "barista").evaluate((node) => node.click());
      assert.equal(
        page.url(),
        current,
        "Pending commerce cannot be interrupted by product learning",
      );
      assert.equal(await popup(page).count(), 0);
      assert.equal(await whyAction(page).getAttribute("aria-disabled"), "true");
      await whyAction(page).evaluate((node) => node.click());
      assert.equal(
        page.url(),
        current,
        "Why ATOMA cannot interrupt a pending purchase with navigation",
      );
      assert.equal(
        await page.locator("[data-wholesale-search-toggle]").isDisabled(),
        true,
      );
      for (const mode of ["application", "powder"])
        assert.equal(await imageMode(page, mode).isDisabled(), true);
      await imageMode(page, "powder").evaluate((node) => node.click());
      assert.equal(
        page.url(),
        current,
        "Pending commerce keeps the imagery selection settled",
      );
      assert.equal(
        await imageMode(page, "application").getAttribute("aria-pressed"),
        "true",
      );
      test.releaseMutation();
      await eventually(
        () => add(page).isEnabled(),
        "A settled attempt releases the order guard",
      );
      assert.equal(await quantity(page).textContent(), "2");
      await setImageMode(page, "powder");
      assert.equal(
        await quantity(page).textContent(),
        "2",
        "Settled commerce releases the image toggle without resetting the order",
      );
      assert.equal(
        await purchase(page).locator("[data-wholesale-purchase-error]").count(),
        1,
        "Rejected purchase feedback belongs to the initiating row",
      );
    },
  );
} finally {
  await writeFile(
    `${evidence}/results.json`,
    `${JSON.stringify(results, null, 2)}\n`,
  );
  await browser.close();
}
