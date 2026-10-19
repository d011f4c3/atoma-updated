/* About reading and navigation checks. Commerce reads use an isolated fixture;
 * external requests and every write are blocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  aboutFarmPhotographs,
  aboutFieldNotes,
  aboutPhotoStories,
} from "../src/lib/about-photo-stories.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.ABOUT_FLOW_BASE_URL ?? "http://127.0.0.1:3100";
const origin = new URL(baseURL).origin;
const evidence =
  process.env.ABOUT_FLOW_EVIDENCE ?? ".local/about-popup-motion-0158/browser";
const filter = process.env.ABOUT_FLOW_FILTER;
const readerOnly = process.env.ABOUT_FLOW_READER_ONLY === "1";
const cart = {
  totalQuantity: 1,
  subtotalLabel: "¥2,400",
  totalLabel: "¥2,400",
  lines: [
    {
      lineKey: `v1_${"b".repeat(43)}`,
      productHandle: "test-only-about-fixture",
      productTitle: "About selection",
      variantTitle: "1 kg",
      options: [],
      quantity: 1,
      unitPriceLabel: "¥2,400",
      lineTotalLabel: "¥2,400",
      purchaseState: "purchasable",
      quantityRule: { minimum: 1, maximum: 4, increment: 1 },
      canUpdateQuantity: true,
      canRemove: true,
      image: null,
    },
  ],
};

async function eventually(check, message) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function scroll(page, top) {
  await page.evaluate(
    (value) => window.scrollTo({ top: value, behavior: "instant" }),
    top,
  );
  // Keep settling outside the page: disabled JavaScript also disables rAF callbacks.
  await settleScroll(page);
}

async function settleScroll(page) {
  let previous = await page.evaluate(() => scrollY);
  let steady = 0;
  await eventually(async () => {
    const current = await page.evaluate(() => scrollY);
    steady = Math.abs(current - previous) <= 1 ? steady + 1 : 0;
    previous = current;
    return steady >= 4;
  }, "Section navigation settles at its destination");
}

async function fit(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "About fits without horizontal scrolling",
  );
}

async function checkReading(page, width) {
  const main = page.locator("main#about-top");
  await main.waitFor();
  assert.equal(await main.getByRole("heading", { level: 1 }).count(), 1);
  assert.equal(await main.getByRole("tablist").count(), 0);
  const reading = await main.innerText();
  for (const pattern of [
    /character/i,
    /application/i,
    /origin/i,
    /flavou?r/i,
    /texture/i,
    /\bATOMA\b/,
    /\bMATCHA\b/i,
    /Wazuka/i,
  ])
    assert.match(reading, pattern, `About preserves its content: ${pattern}`);
  const content = await main.textContent();
  for (const sentence of [
    "Matcha, selected and explained.",
    "About the company",
    "ATOMA helps businesses find matcha suited to what they make. We bring product selection, practical guidance and relationships with tea-growing communities into one connected approach.",
    "From tasting a sample to choosing matcha for regular use, we help buyers understand its character, its preparation and the people and processes behind it.",
    "Understanding is shared.",
    "Matcha connects the people who grow it, process it and prepare it. We connect buyers with each step, building understanding and relationships from the growing place to the final preparation.",
    "Growing",
    "Working with tea",
    "Preparing",
    "Community",
    "Stories from the places and communities we work with.",
  ])
    assert.ok(
      content.includes(sentence),
      `About conveys the company, its approach and connections: ${sentence}`,
    );
  assert.doesNotMatch(reading, /\bGVJ\b/, "Canonical About introduces ATOMA");
  assert.doesNotMatch(
    reading,
    /\bATOM\s*\+\s*MATCHA\b|Understanding the parts that shape the whole\./,
  );
  const approach = await main.locator("#about-approach").innerText();
  for (const sentence of [
    "Understand the matcha itself. Its flavour, its texture, and how it behaves in preparation.",
    "Selected for a specific use — from tea served with water to lattes and recipes.",
    "Look closer at place, process and people. The material becomes more specific as you go deeper.",
  ])
    assert.ok(
      approach.includes(sentence),
      "Our approach uses the requested copy",
    );
  assert.match(
    reading,
    /The origin of each matcha is recorded with the product\./,
    "The field record remains separate from product provenance",
  );
  assert.doesNotMatch(reading, /archive placeholder|new shoot to be added/i);
  assert.equal(
    await main.locator("[data-about-field-note], [data-field-note]").count(),
    0,
    "Field observations are published in their own entries",
  );
  for (const note of Object.values(aboutFieldNotes))
    assert.ok(
      !reading.includes(note.text),
      "About introduces the field-note collection without becoming the harvest feature",
    );
  assert.equal(
    await main
      .locator("[data-about-opening-photographs] img")
      .getAttribute("alt"),
    aboutFarmPhotographs.contours.alt,
    "The brand opening uses the place photograph, not the harvest story",
  );
  assert.equal(
    await main
      .locator('img[src*="matcha-macro"], img[srcset*="matcha-macro"]')
      .count(),
    0,
    "About excludes the removed material-study imagery",
  );
  assert.doesNotMatch(content, /Material study/i);
  for (const story of aboutPhotoStories) {
    const link = main.locator(`article[data-about-story="${story.id}"] a`);
    assert.equal(await link.getAttribute("href"), `/field-notes/${story.slug}`);
    assert.ok((await link.textContent()).includes("Read story"));
    assert.deepEqual(
      await link.locator("img").evaluateAll((nodes) =>
        nodes.map((node) => {
          const url = new URL(node.currentSrc || node.src);
          return {
            src: url.searchParams.get("url") ?? url.pathname,
            alt: node.alt,
          };
        }),
      ),
      [{ src: story.photographs[0].src, alt: story.photographs[0].alt }],
      "The Community card uses its story's opening photograph",
    );
    assert.equal(
      await link.locator("figure, h3, p").count(),
      3,
      "The photograph, title and introduction belong to the entry link",
    );
    assert.equal(
      await link.evaluate(
        (node) =>
          Math.abs(
            node.getBoundingClientRect().width -
              node.parentElement.getBoundingClientRect().width,
          ) <= 1 &&
          Math.abs(
            node.getBoundingClientRect().height -
              node.parentElement.getBoundingClientRect().height,
          ) <= 1,
      ),
      true,
      "The full field-note card is clickable",
    );
  }
  const rows = await main
    .locator("article[data-about-story]")
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return {
          left: box.left,
          right: box.right,
          top: box.top,
          bottom: box.bottom,
          width: box.width,
        };
      }),
    );
  if (width <= 760)
    assert.ok(
      rows[1].top >= rows[0].bottom - 1,
      "The two field notes read in consecutive rows on a phone",
    );
  else
    assert.ok(
      Math.abs(rows[0].top - rows[1].top) <= 1 &&
        rows[1].left >= rows[0].right - 1,
      "The two field-note covers sit alongside one another on desktop",
    );
  assert.ok(
    Math.abs(rows[0].width - rows[1].width) <= 1,
    "The field notes receive equal reading width",
  );
  assert.equal(
    await main
      .locator("article[data-about-story]")
      .first()
      .getAttribute("data-about-story"),
    "harvest",
    "The harvest is the first photographic entry",
  );
  const headings = await main.locator("h2, h3").evaluateAll((nodes) =>
    nodes.map((node) => ({
      principle: node.matches("#about-approach h3"),
      text: node.textContent,
      size: Number.parseFloat(getComputedStyle(node).fontSize),
    })),
  );
  // The primary title is compared with the live canonical homepage in the
  // focused stylesheet check; it must follow that page's responsive clamp.
  for (const { principle, text, size } of headings)
    assert.equal(
      size,
      principle ? 14 : 20,
      `About preserves the established section/principle hierarchy: ${text}`,
    );
  const narrative = await main
    .locator(
      "[data-about-cover] p, #about-purpose p, #about-approach p, #about-company p, article[data-about-story] p",
    )
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        text: node.textContent,
        size: Number.parseFloat(getComputedStyle(node).fontSize),
      })),
    );
  assert.ok(
    narrative.length >= 10,
    "Narrative type is checked across sections",
  );
  for (const { text, size } of narrative)
    assert.equal(
      size,
      14,
      `About keeps its narrative body scale on desktop and phone: ${text}`,
    );
  assert.equal(
    await main.locator("h1, h2, h3, p").evaluateAll((nodes) =>
      nodes.every((node) => {
        const box = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return (
          box.width > 0 &&
          box.height > 0 &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0
        );
      }),
    ),
    true,
    "The complete narrative is readable without operating a selector",
  );
  let previousBottom = 0;
  for (const id of [
    "about-purpose",
    "about-approach",
    "about-company",
    "about-community",
  ]) {
    const section = main.locator(`#${id}`);
    await section.waitFor();
    const box = await section.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return {
        top: rect.top + scrollY,
        bottom: rect.bottom + scrollY,
        height: rect.height,
      };
    });
    assert.ok(box.height > 0, `${id} has room in the reading flow`);
    assert.ok(
      box.top >= previousBottom - 1,
      "About sections continue down the page without overlapping",
    );
    previousBottom = box.bottom;
  }
  assert.equal(
    await main
      .locator("*")
      .evaluateAll((nodes) =>
        nodes.some(
          (node) =>
            ["auto", "scroll"].includes(getComputedStyle(node).overflowY) &&
            node.clientHeight > 0 &&
            node.scrollHeight > node.clientHeight + 1,
        ),
      ),
    false,
    "Reading uses normal page scrolling",
  );
  await fit(page);
}

async function imagesReady(page) {
  const images = page.locator("main img");
  assert.ok(
    (await images.count()) >= 3,
    "Photography accompanies the narrative",
  );
  for (const image of await images.all()) {
    if (!(await image.isVisible())) continue;
    await image.scrollIntoViewIfNeeded();
    await eventually(
      () => image.evaluate((node) => node.complete && node.naturalWidth > 0),
      "About photography loads",
    );
    assert.notEqual(await image.getAttribute("alt"), null);
    await fit(page);
  }
}

async function captureEditorialSections(page, tone) {
  if (!process.env.ABOUT_FLOW_CAPTURE_SECTIONS) return;
  await page.mouse.move(0, 0);
  for (const [id, name] of [
    ["about-company", "connections"],
    ["about-community", "field-notes"],
  ]) {
    const section = page.locator(`main#about-top #${id}`);
    // Tall element screenshots may reveal offscreen children while capturing.
    // Let their real entrances finish before the screenshot changes the viewport.
    for (const reveal of await section.locator("[data-about-reveal]").all()) {
      await reveal.scrollIntoViewIfNeeded();
      await eventually(
        async () =>
          (await reveal.getAttribute("data-about-revealed")) === "true",
        "The section entrance has been observed before its screenshot",
      );
    }
    await scroll(
      page,
      await section.evaluate(
        (node) => node.getBoundingClientRect().top + scrollY,
      ),
    );
    await eventually(
      () =>
        section.evaluate(
          (node) =>
            !node
              .getAnimations({ subtree: true })
              .some((animation) => animation.playState === "running"),
        ),
      "The section entrances settle before its screenshot",
    );
    await section.screenshot({
      path: resolve(
        evidence,
        `${page.viewportSize().width}-${tone}-${name}.png`,
      ),
      animations: "disabled",
    });
  }
}

async function sectionNavigation(page) {
  const fieldLink = page
    .locator('main#about-top a[href="#about-community"]')
    .first();
  const anchor = (await fieldLink.isVisible())
    ? "#about-community"
    : "#about-approach";
  const link = page.locator(`main#about-top a[href="${anchor}"]`).first();
  assert.equal(
    await link.isVisible(),
    true,
    "An in-page reading link is visible",
  );
  await link.focus();
  await link.press("Enter");
  await eventually(
    () => new URL(page.url()).hash === anchor,
    "Keyboard section navigation updates the URL",
  );
  await settleScroll(page);
  assert.equal(
    await page.locator(anchor).evaluate((node) => {
      const box = node.getBoundingClientRect();
      return box.top < innerHeight && box.bottom > 0;
    }),
    true,
    "The selected About section is reached through its native anchor",
  );
  await page.goBack();
  await page.locator("[data-about-flow]").waitFor();
  assert.equal(new URL(page.url()).hash, "", "Back restores the opening URL");
}

async function fieldNoteRoundTrip(
  page,
  tone,
  storyId = "harvest",
  returnVia = "browser",
) {
  const trace = (step) => {
    if (process.env.ABOUT_FLOW_TRACE)
      console.log(`${activeName}/${storyId}: ${step}`);
  };
  const story = aboutPhotoStories.find((entry) => entry.id === storyId);
  const trigger = page.locator(
    `main#about-top a[href="/field-notes/${story.slug}"]`,
  );
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  await settleScroll(page);
  trace("entry link ready");
  const before = { url: page.url(), top: await page.evaluate(() => scrollY) };
  trace(
    `entry state ${JSON.stringify({ ...before, fonts: await page.evaluate(() => document.fonts.status) })}`,
  );
  await trigger.press("Enter");
  trace("entry link activated");
  await page.waitForURL((url) => url.pathname === `/field-notes/${story.slug}`);
  const root = page.locator(`[data-field-note-page="${storyId}"]`);
  const main = page.locator("main#field-note-top");
  await root.waitFor();
  trace("entry rendered");
  assert.equal(await root.getAttribute("data-tone"), tone);
  assert.equal(await main.getAttribute("lang"), "en");
  assert.equal(
    await main
      .getByRole("heading", { level: 1, name: story.title, exact: true })
      .count(),
    1,
  );
  assert.equal(
    await page.locator("dialog[open]").count(),
    0,
    "A field-note entry uses its own native page",
  );
  assert.notEqual(
    await page.evaluate(() => getComputedStyle(document.body).overflowY),
    "hidden",
    "The entry uses normal page scrolling",
  );
  const ids = storyId === "harvest" ? ["place", "harvest"] : ["technology"];
  assert.deepEqual(
    await main
      .locator("[data-field-note]")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-field-note")),
      ),
    ids,
  );
  for (const id of ids) {
    const observation = main.locator(`[data-field-note="${id}"]`);
    assert.ok(
      (await observation.innerText()).includes(aboutFieldNotes[id].text),
      "The entry's field observations are readable without a selector",
    );
  }
  await imagesReady(page);
  trace("entry photographs loaded");
  assert.deepEqual(
    await main.locator("[data-field-note-photo] img").evaluateAll((nodes) =>
      nodes.map((node) => {
        const url = new URL(node.currentSrc || node.src);
        return {
          src: url.searchParams.get("url") ?? url.pathname,
          alt: node.alt,
        };
      }),
    ),
    story.photographs.map(({ src, alt }) => ({ src, alt })),
    "The standalone reader presents every shared story photograph in order",
  );
  assert.equal(
    await main.locator("[data-field-note-photo] img").evaluateAll((nodes) =>
      nodes.every((node) => {
        const box = node.getBoundingClientRect();
        return (
          Math.abs(
            box.width / box.height - node.naturalWidth / node.naturalHeight,
          ) < 0.01
        );
      }),
    ),
    true,
    "The standalone entry preserves full landscape and portrait compositions",
  );
  assert.equal(
    await main.locator("h1, h2, p").evaluateAll((nodes) =>
      nodes.every((node) => {
        const box = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return (
          box.width > 0 &&
          box.height > 0 &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0
        );
      }),
    ),
    true,
    "All entry text is readable without opening a popup",
  );
  for (const link of await main.locator("[data-field-note-back]").all())
    assert.equal(await link.getAttribute("href"), "/about#about-community");
  await scroll(page, 0);
  trace("entry ready for capture");
  await page.screenshot({
    path: resolve(evidence, `${activeName}-${tone}-${storyId}-entry.png`),
    fullPage: true,
    animations: "disabled",
    timeout: 15000,
  });
  trace("entry captured");
  if (returnVia === "browser") {
    await page.goBack();
    await page.locator("[data-about-flow]").waitFor();
    trace(
      `return state ${JSON.stringify({ url: page.url(), top: await page.evaluate(() => scrollY), fonts: await page.evaluate(() => document.fonts.status) })}`,
    );
    assert.equal(
      page.url(),
      before.url,
      "Browser Back returns to the About entry point",
    );
    await eventually(
      async () =>
        Math.abs((await page.evaluate(() => scrollY)) - before.top) <= 2,
      "Browser Back restores the entry position",
    );
  } else {
    const back = main.locator("[data-field-note-back]").first();
    await back.focus();
    await back.press("Enter");
    trace("return link activated");
    await page.waitForURL(
      (url) => url.pathname === "/about" && url.hash === "#about-community",
    );
    await page.locator("[data-about-page]").waitFor();
    await settleScroll(page);
    assert.equal(
      await page.locator("#about-community").evaluate((node) => {
        const box = node.getBoundingClientRect();
        return box.top < innerHeight && box.bottom > 0;
      }),
      true,
      "The keyboard return link reaches the Field notes collection",
    );
  }
  await fit(page);
  trace("return verified");
}

async function popupRoundTrip(page, tone, storyId, returnVia) {
  const trace = async (step) => {
    if (process.env.ABOUT_FLOW_TRACE)
      console.log(
        `${activeName}/${storyId}/${returnVia}: ${step} ${JSON.stringify(await page.evaluate(() => ({ url: location.href, state: history.state?.atomaAboutStory, top: scrollY })))}`,
      );
  };
  const story = aboutPhotoStories.find((entry) => entry.id === storyId);
  const trigger = page.locator(
    `main#about-top a[href="/field-notes/${story.slug}"]`,
  );
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  await settleScroll(page);
  const before = { url: page.url(), top: await page.evaluate(() => scrollY) };
  await trace("before");
  assert.equal(await trigger.getAttribute("aria-haspopup"), "dialog");
  await trigger.press("Enter");
  const reader = page.locator("[data-about-field-notes][open]");
  await reader.waitFor();
  await eventually(
    () => new URL(page.url()).hash === `#field-note=${story.slug}`,
    "Opening a field note creates its About history entry",
  );
  assert.equal(new URL(page.url()).pathname, new URL(before.url).pathname);
  assert.equal(
    await page.evaluate(() => history.state.atomaAboutStory),
    story.slug,
  );
  assert.equal(await trigger.getAttribute("aria-expanded"), "true");
  assert.equal(await reader.getAttribute("data-tone"), tone);
  assert.equal(await reader.getAttribute("data-presentation"), "field-record");
  assert.equal(await reader.getAttribute("lang"), "en");
  const title = reader.getByRole("heading", {
    level: 2,
    name: story.title,
    exact: true,
  });
  await eventually(
    () => title.evaluate((node) => document.activeElement === node),
    "The field-note title receives initial focus",
  );
  assert.equal(
    await reader.locator(`article[data-about-story="${storyId}"]`).count(),
    1,
  );
  const close = reader.getByRole("button", {
    name: "Back to About",
    exact: true,
  });
  for (const key of ["Tab", "Shift+Tab"]) {
    await title.focus();
    await page.keyboard.press(key);
    assert.equal(
      await (
        key === "Tab" ? close : reader.locator("[data-record-jump]").last()
      ).evaluate((node) => node === document.activeElement),
      true,
      "Tab from the focused title reaches the appropriate popup boundary",
    );
    await page.keyboard.press(key);
    assert.equal(
      await reader.evaluate((node) => node.contains(document.activeElement)),
      true,
      "Keyboard focus stays inside the field note",
    );
  }
  const chapters =
    storyId === "harvest"
      ? ["place", "harvest", "closing"]
      : ["tools", "technology", "closing"];
  assert.deepEqual(
    await reader
      .locator("[data-record-jump]")
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.recordJump)),
    chapters,
  );
  const openedURL = page.url();
  for (const chapter of chapters) {
    const jump = reader.locator(`[data-record-jump="${chapter}"]`);
    await jump.focus();
    await jump.press("Enter");
    await eventually(
      async () => (await jump.getAttribute("aria-current")) === "step",
      `${chapter} becomes the current local chapter`,
    );
    const section = reader.locator(`[data-record-chapter="${chapter}"]`);
    assert.equal(
      await section.evaluate((node) => {
        const dialog = node.closest("dialog").getBoundingClientRect();
        const box = node.getBoundingClientRect();
        return box.bottom > dialog.top && box.top < dialog.bottom;
      }),
      true,
      "A chapter shortcut reveals its section inside the reader",
    );
    assert.equal(
      page.url(),
      openedURL,
      "Local chapter navigation preserves the About history entry",
    );
    assert.equal(
      await page.evaluate(() => scrollY),
      before.top,
      "Chapter navigation does not move the About page",
    );
  }
  const ids = storyId === "harvest" ? ["place", "harvest"] : ["technology"];
  assert.deepEqual(
    await reader
      .locator("[data-field-note]")
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.fieldNote)),
    ids,
  );
  for (const id of ids)
    assert.ok((await reader.innerText()).includes(aboutFieldNotes[id].text));
  assert.deepEqual(
    await reader.locator("[data-field-note-photo] img").evaluateAll((nodes) =>
      nodes.map((node) => {
        const url = new URL(node.currentSrc || node.src);
        return {
          src: url.searchParams.get("url") ?? url.pathname,
          alt: node.alt,
        };
      }),
    ),
    story.photographs.map(({ src, alt }) => ({ src, alt })),
    "The popup presents the same complete photograph sequence as the standalone reader",
  );
  for (const image of await reader
    .locator("[data-field-note-photo] img")
    .all()) {
    await image.scrollIntoViewIfNeeded();
    await eventually(
      () => image.evaluate((node) => node.complete && node.naturalWidth > 0),
      "The popup photograph loads",
    );
    assert.equal(
      await image.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return (
          Math.abs(
            box.width / box.height - node.naturalWidth / node.naturalHeight,
          ) < 0.01
        );
      }),
      true,
      "The popup preserves complete landscape and portrait photographs",
    );
  }
  assert.ok(
    await reader.evaluate((node) => node.scrollTop > 0),
    "The photo essay scrolls inside the popup",
  );
  assert.equal(
    await page.evaluate(() => scrollY),
    before.top,
    "Reading leaves the About page at its entry position",
  );
  await reader.evaluate((node) =>
    node.scrollTo({ top: 0, behavior: "instant" }),
  );
  await eventually(
    () =>
      reader.evaluate(
        (node) =>
          !node
            .getAnimations({ subtree: true })
            .some((animation) => animation.playState === "running"),
      ),
    "Popup entrance animation settles",
  );
  const box = await reader.boundingBox();
  const viewport = page.viewportSize();
  assert.ok(
    box.x >= 10 &&
      box.y >= 10 &&
      box.x + box.width <= viewport.width - 10 &&
      box.y + box.height <= viewport.height - 10,
    "The popup leaves a tappable backdrop on all four sides",
  );
  assert.equal(
    await reader.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    true,
    "The popup has no horizontal overflow",
  );
  await fit(page);
  const outside = { x: Math.min(4, box.x / 2), y: box.y + box.height / 2 };
  const inside = { x: box.x + 4, y: box.y + Math.min(60, box.height / 2) };
  await page.mouse.click(inside.x, inside.y);
  await page.mouse.move(inside.x, inside.y);
  await page.mouse.down();
  await page.mouse.move(outside.x, outside.y, { steps: 4 });
  await page.mouse.up();
  assert.equal(
    await reader.evaluate(
      (node) => node.open && node.dataset.closing !== "true",
    ),
    true,
    "Dragging from content to the backdrop does not dismiss the popup",
  );
  assert.equal(
    await page.evaluate(() =>
      [document.body, document.documentElement].some((node) =>
        ["hidden", "clip"].includes(getComputedStyle(node).overflowY),
      ),
    ),
    true,
    "The popup locks background scrolling",
  );
  await page.mouse.move(outside.x, outside.y);
  await page.mouse.wheel(0, 300);
  await settleScroll(page);
  assert.equal(await page.evaluate(() => scrollY), before.top);
  await page.evaluate(() => getSelection()?.removeAllRanges());
  await page.screenshot({
    path: resolve(evidence, `${activeName}-${tone}-${storyId}-popup.png`),
    animations: "disabled",
  });

  async function restored() {
    await reader.waitFor({ state: "hidden" });
    await trace("hidden");
    await eventually(
      () => page.url() === before.url,
      "Dismissal restores the preceding About URL",
    );
    await eventually(
      () => trigger.evaluate((node) => node === document.activeElement),
      "Dismissal restores entry-link focus",
    );
    await eventually(
      async () =>
        Math.abs((await page.evaluate(() => scrollY)) - before.top) <= 2,
      "Dismissal restores the About reading position",
    );
    await eventually(
      () =>
        page.evaluate(
          () =>
            document.body.style.overflow !== "hidden" &&
            document.documentElement.style.overflow !== "hidden",
        ),
      "Dismissal unlocks page scrolling",
    );
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
  }
  await trace("before dismissal");
  if (returnVia === "browser") {
    await page.goBack();
    await restored();
    await page.goForward();
    await reader.waitFor();
    assert.equal(
      new URL(page.url()).hash,
      `#field-note=${story.slug}`,
      "Forward reopens the same field note",
    );
    await title.waitFor();
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          addEventListener(
            "popstate",
            () => {
              history.forward();
              resolve();
            },
            { once: true },
          );
          history.back();
        }),
    );
    await eventually(
      () => new URL(page.url()).hash === `#field-note=${story.slug}`,
      "Immediate Back then Forward restores the field-note history entry",
    );
    await reader.waitFor();
    await eventually(
      () => title.evaluate((node) => node === document.activeElement),
      "The reopened reader receives focus",
    );
    await page.keyboard.press("Escape");
  } else if (returnVia === "escape") await page.keyboard.press("Escape");
  else if (returnVia === "outside") {
    if (viewport.width <= 760) await page.touchscreen.tap(outside.x, outside.y);
    else await page.mouse.click(outside.x, outside.y);
  } else await close.click();
  await restored();
}

async function staticApproach(page) {
  const approach = page.locator("[data-about-approach]");
  assert.equal(
    await approach.getAttribute("data-approach-mode"),
    null,
    "The approach does not depend on a scrolling mode",
  );
  assert.deepEqual(
    await approach
      .locator("[data-approach-step]")
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.approachStep)),
    ["character", "application", "origin"],
  );
  assert.equal(
    await approach.locator("[data-approach-step]").evaluateAll((nodes) =>
      nodes.every((node) => {
        const style = getComputedStyle(node);
        const box = node.getBoundingClientRect();
        return (
          box.height > 0 &&
          style.visibility !== "hidden" &&
          Number(style.opacity) === 1 &&
          style.position !== "sticky"
        );
      }),
    ),
    true,
    "All three approach explanations remain readable without scrolling a selector",
  );
}

async function panoramaMotion(page, expands) {
  const panorama = page.locator("[data-about-panorama]");
  const photograph = panorama.locator("[data-about-parallax]");
  const panoramaTop = await panorama.evaluate(
    (node) => node.getBoundingClientRect().top + scrollY,
  );
  let entranceClip;
  for (const [position, top] of [
    ["entrance", panoramaTop - page.viewportSize().height * 0.8],
    ["viewport top", panoramaTop],
  ]) {
    await scroll(page, top);
    const coverage = await photograph.evaluate((node) => {
      const frame = node.getBoundingClientRect();
      const image = node.querySelector("img").getBoundingClientRect();
      return {
        top: frame.top - image.top,
        right: image.right - frame.right,
        bottom: image.bottom - frame.bottom,
        left: frame.left - image.left,
      };
    });
    for (const [edge, overhang] of Object.entries(coverage))
      assert.ok(
        overhang >= -0.5,
        `Panorama covers its ${edge} edge at ${position}: ${overhang.toFixed(2)}px`,
      );
    const clip = await photograph.evaluate(
      (node) => getComputedStyle(node).clipPath,
    );
    if (position === "entrance") entranceClip = clip;
    else if (expands)
      assert.notEqual(
        clip,
        entranceClip,
        "The panorama opens inside its reserved frame as it enters view",
      );
    else
      assert.equal(
        clip,
        entranceClip,
        "Compact and reduced-motion panorama framing stays still",
      );
  }
}

async function motion(page, reduced = false) {
  const root = page.locator("[data-about-flow]");
  const stationary = reduced || page.viewportSize().width <= 760;
  await eventually(
    async () =>
      (await root.getAttribute("data-about-motion")) ===
      (stationary ? "reduced" : "ready"),
    "About honors system and compact motion preferences",
  );
  await page.evaluate(() => document.fonts.ready);
  const layout = () =>
    root.locator("main > section").evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return { top: box.top + scrollY, height: box.height };
      }),
    );
  const before = await layout();
  await staticApproach(page);
  await panoramaMotion(page, !stationary);
  const photograph = root.locator("[data-about-parallax]").first();
  await photograph.scrollIntoViewIfNeeded();
  await settleScroll(page);
  const offset = await photograph.evaluate((node) =>
    node.style.getPropertyValue("--photo-offset"),
  );
  const transform = await photograph
    .locator("img")
    .evaluate((node) => getComputedStyle(node).transform);
  await scroll(page, (await page.evaluate(() => scrollY)) + 120);
  if (stationary) {
    assert.equal(
      await photograph.evaluate((node) =>
        node.style.getPropertyValue("--photo-offset"),
      ),
      "",
    );
    assert.equal(
      await photograph
        .locator("img")
        .evaluate((node) => getComputedStyle(node).transform),
      transform,
      "Compact and reduced-motion photography stays still while scrolling",
    );
    if (reduced) assert.equal(transform, "none");
  } else {
    await eventually(
      async () =>
        (await photograph.evaluate((node) =>
          node.style.getPropertyValue("--photo-offset"),
        )) !== offset,
      "The photograph moves subtly with scrolling",
    );
    assert.notEqual(
      await photograph
        .locator("img")
        .evaluate((node) => getComputedStyle(node).transform),
      transform,
      "Scroll motion changes the photograph inside its frame",
    );
  }
  assert.ok(
    await root.evaluate(
      (node) => Number(node.style.getPropertyValue("--about-progress")) > 0,
    ),
    "The reading line follows page progress",
  );
  if (page.viewportSize().width > 760) {
    await page.mouse.move(0, 0);
    await page.keyboard.press("Tab");
    for (const story of aboutPhotoStories) {
      const link = root.locator(`article[data-about-story="${story.id}"] a`);
      const alternate = link.locator('figure [aria-hidden="true"]');
      assert.equal(await alternate.locator("img").getAttribute("alt"), "");
      const before = await link.boundingBox();
      await link.focus();
      await eventually(
        () =>
          alternate.evaluate((node) => getComputedStyle(node).opacity === "1"),
        "Keyboard focus reveals the additional field-note photograph",
      );
      const after = await link.boundingBox();
      assert.ok(
        Math.abs(before.width - after.width) <= 1 &&
          Math.abs(before.height - after.height) <= 1,
        "The photo preview stays within the story’s reserved row",
      );
      await link.evaluate((node) => node.blur());
      await eventually(
        () =>
          alternate.evaluate((node) => getComputedStyle(node).opacity === "0"),
        "The entry photograph returns when focus leaves",
      );
    }
  }
  assert.equal(
    await root.evaluate(
      (node) =>
        node
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === "running").length,
    ),
    0,
    "Reading does not trigger hidden-content entrance animations",
  );
  const after = await layout();
  assert.equal(before.length, after.length);
  for (const [index, box] of after.entries())
    assert.ok(
      Math.abs(box.top - before[index].top) <= 1 &&
        Math.abs(box.height - before[index].height) <= 1,
      "About motion preserves section geometry and does not shift the reading flow",
    );
  await scroll(page, 0);
}

async function toggleTheme(page, tone) {
  const root = page.locator("[data-about-flow]");
  let control = root.getByRole("switch", { name: "Dark mode", exact: true });
  const menu = root.locator("summary[data-nav-summary]");
  let openedMenu = false;
  if (!(await control.isVisible())) {
    await menu.focus();
    await menu.press("Enter");
    openedMenu = true;
    control = root.getByRole("switch", {
      name: "Dark mode in menu",
      exact: true,
    });
  }
  await control.focus();
  await control.press("Space");
  const nextTone = tone === "light" ? "dark" : "light";
  await eventually(
    () => root.getAttribute("data-tone").then((value) => value === nextTone),
    "Keyboard theme switching updates About in place",
  );
  if (openedMenu) await menu.click();
  return nextTone;
}

function cartButton(page) {
  return page.getByRole("button", { name: "Open cart, 1 item", exact: true });
}

async function commerceContinuity(page, context, tone) {
  await cartButton(page).waitFor();
  await cartButton(page).click();
  const drawer = page.locator("dialog[open]");
  await drawer
    .getByRole("heading", { name: "About selection", exact: true })
    .waitFor();
  assert.equal(
    await drawer
      .getByLabel("About selection quantity", { exact: true })
      .innerText(),
    "1",
  );
  await drawer.getByRole("button", { name: "Close cart", exact: true }).click();
  await drawer.waitFor({ state: "hidden" });
  await eventually(
    () => cartButton(page).evaluate((node) => node === document.activeElement),
    "The cart close event finishes restoring focus before keyboard navigation",
  );
  const shop = page.locator('main#about-top a[href="/shop"]').last();
  await shop.focus();
  await shop.press("Enter");
  await page.waitForURL((url) => url.pathname === "/shop");
  await cartButton(page).waitFor();
  assert.equal(
    (await context.cookies()).find((cookie) => cookie.name === "atoma-theme")
      ?.value,
    tone,
    "Shop navigation keeps the chosen theme",
  );
  await page.goBack();
  const root = page.locator("[data-about-flow]");
  await root.waitFor();
  assert.equal(await root.getAttribute("data-tone"), tone);
  await cartButton(page).waitFor();
  await fit(page);
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
await mkdir(evidence, { recursive: true });
let activePage;
let activeName;
let passed = 0;

async function contextFor(
  width,
  tone,
  motion = "no-preference",
  javascript = true,
) {
  const context = await browser.newContext({
    viewport: {
      width,
      height: width === 320 ? 740 : width === 390 ? 844 : 900,
    },
    hasTouch: width <= 760,
    isMobile: width <= 390,
    reducedMotion: motion,
    javaScriptEnabled: javascript,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: "en", url: baseURL },
  ]);
  const errors = [];
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      errors.push("Unexpected remote request or commerce write");
      return route.abort();
    }
    if (url.pathname === "/api/cart")
      return route.fulfill({
        json: { kind: "ready", cart, checkoutEnabled: false },
      });
    if (url.pathname === "/api/catalog")
      return route.fulfill({
        json: {
          status: "ready",
          products: [],
          shopUrl: "https://example.invalid",
        },
      });
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Unexpected API ${url.pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  activePage = page;
  return { context, page, errors };
}

try {
  for (const width of [1440, 768, 390, 320])
    for (const tone of ["light", "dark"]) {
      activeName = `${width}-${tone}`;
      if (filter && !activeName.includes(filter)) continue;
      if (
        readerOnly &&
        !(
          (width === 1440 && tone === "light") ||
          (width === 390 && tone === "dark")
        )
      )
        continue;
      const { context, page, errors } = await contextFor(width, tone);
      await page.goto(
        `${baseURL}/${readerOnly ? "about" : "about-exploration"}`,
      );
      const root = page.locator(
        readerOnly ? "[data-about-page]" : "[data-about-flow]",
      );
      await root.waitFor();
      await page.evaluate(() => document.fonts.ready);
      await cartButton(page).waitFor();
      assert.equal(await root.getAttribute("data-tone"), tone);
      if (readerOnly) {
        await popupRoundTrip(
          page,
          tone,
          "harvest",
          width === 1440 ? "browser" : "outside",
        );
        await popupRoundTrip(
          page,
          tone,
          "technology",
          width === 1440 ? "button" : "escape",
        );
        assert.deepEqual(
          errors,
          [],
          "No page errors, remote requests or writes",
        );
        passed++;
        await context.close();
        console.log(
          `${activeName}: chapter navigation, photographs, history, dismissal, focus and scroll passed`,
        );
        continue;
      }
      await motion(page);
      if (width === 1440 && tone === "light") {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await motion(page, true);
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await motion(page);
      }
      await checkReading(page, width);
      await imagesReady(page);
      await scroll(page, 0);
      await page.screenshot({
        path: resolve(evidence, `${activeName}-opening.png`),
        animations: "disabled",
      });
      await page.screenshot({
        path: resolve(evidence, `${activeName}-full.png`),
        fullPage: true,
        animations: "disabled",
      });
      await sectionNavigation(page);
      await popupRoundTrip(page, tone, "harvest", "browser");
      await popupRoundTrip(page, tone, "technology", "button");
      await scroll(page, 0);
      const nextTone = await toggleTheme(page, tone);
      await checkReading(page, width);
      await popupRoundTrip(page, nextTone, "harvest", "outside");
      await popupRoundTrip(page, nextTone, "technology", "escape");
      await commerceContinuity(page, context, nextTone);
      if (process.env.ABOUT_FLOW_CAPTURE_SECTIONS) {
        await captureEditorialSections(page, nextTone);
        await scroll(page, 0);
        await toggleTheme(page, nextTone);
        await captureEditorialSections(page, tone);
      }
      assert.deepEqual(errors, [], "No page errors, remote requests or writes");
      passed++;
      console.log(
        `${activeName}: reading, images, motion, anchors, popup history/dismissal/focus/scroll and theme/cart/Shop continuity passed`,
      );
      await context.close();
    }

  // Run remaining native/reduced-motion/route checks independently after a fix.
  if (!readerOnly && (!filter || filter === "auxiliary")) {
    for (const width of [1440, 320]) {
      activeName = `${width}-reduced-motion`;
      const { context, page, errors } = await contextFor(
        width,
        "light",
        "reduce",
      );
      await page.goto(`${baseURL}/about-exploration`);
      await motion(page, true);
      await checkReading(page, width);
      await imagesReady(page);
      assert.equal(
        await page.locator("main#about-top *").evaluateAll(
          (nodes) =>
            nodes.filter((node) => {
              const style = getComputedStyle(node);
              return (
                style.animationName !== "none" &&
                style.animationDuration
                  .split(",")
                  .some((value) => Number.parseFloat(value) > 0.01)
              );
            }).length,
        ),
        0,
        "Reduced motion disables editorial animation",
      );
      await sectionNavigation(page);
      await popupRoundTrip(page, "light", "harvest", "browser");
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`${width}px: reduced-motion entry navigation passed`);

      activeName = `${width}-no-javascript`;
      const native = await contextFor(width, "light", "reduce", false);
      await native.page.goto(`${baseURL}/about-exploration`);
      await staticApproach(native.page, false);
      assert.equal(
        await native.page
          .locator("[data-about-flow]")
          .getAttribute("data-about-motion"),
        null,
        "No-JavaScript reading does not depend on enhancement state",
      );
      await checkReading(native.page, width);
      await imagesReady(native.page);
      await sectionNavigation(native.page);
      console.log(`${width}px: native About reading and anchors passed`);
      await fieldNoteRoundTrip(native.page, "light", "harvest", "link");
      console.log(`${width}px: native harvest entry and return passed`);
      // Native fragment navigation returns to its anchor. Check browser scroll
      // restoration independently from a plain About URL.
      await native.page.goto(`${baseURL}/about`);
      await fieldNoteRoundTrip(native.page, "light", "technology", "browser");
      assert.deepEqual(native.errors, []);
      await native.context.close();
      console.log(
        `${width}px: native reading/anchors and reduced motion passed`,
      );
    }

    activeName = "direct-urls";
    const { context, page, errors } = await contextFor(1440, "light", "reduce");
    for (const story of aboutPhotoStories) {
      await page.goto(`${baseURL}/about#field-note=${story.slug}`);
      const reader = page.locator("[data-about-field-notes][open]");
      await reader.waitFor();
      assert.equal(
        await reader.locator(`article[data-about-story="${story.id}"]`).count(),
        1,
        "A direct About field-note hash opens the requested popup",
      );
      await page.keyboard.press("Escape");
      await reader.waitFor({ state: "hidden" });
      await eventually(
        () =>
          new URL(page.url()).pathname === "/about" &&
          new URL(page.url()).hash === "#about-community",
        "Closing a direct hash stays on About instead of leaving the site",
      );
      await eventually(
        () =>
          page.evaluate(
            () =>
              document.body.style.overflow !== "hidden" &&
              document.documentElement.style.overflow !== "hidden",
          ),
        "Direct-hash dismissal releases scroll locking",
      );
    }
    await page.goto(`${baseURL}/about#field-note=not-a-published-entry`);
    await page.locator("[data-about-page]").waitFor();
    await motion(page, true);
    assert.equal(
      await page.locator("[data-about-field-notes][open]").count(),
      0,
      "An unknown field-note hash does not open a reader",
    );
    for (const direction of ["flow", "about"]) {
      await page.goto(`${baseURL}/about-exploration?direction=${direction}`);
      await page.locator("[data-about-flow]").waitFor();
      await checkReading(page, 1440);
    }
    for (const direction of ["company", "sequence", "film", "material"]) {
      await page.goto(`${baseURL}/about-exploration?direction=${direction}`);
      await page.locator('[data-about-stories="sequence"]').waitFor();
    }
    for (const direction of [
      "connections",
      "relationships",
      "desk",
      "method",
    ]) {
      await page.goto(`${baseURL}/about-exploration?direction=${direction}`);
      await page.locator('[data-about-stories="relationships"]').waitFor();
    }
    for (const direction of ["studio", "atlas", "notes", "original"]) {
      await page.goto(`${baseURL}/about-exploration?direction=${direction}`);
      await page.locator(`[data-about-variations="${direction}"]`).waitFor();
    }
    const missing = await page.goto(
      `${baseURL}/field-notes/not-a-published-entry`,
    );
    assert.equal(
      missing.status(),
      404,
      "An unknown field-note slug returns 404",
    );
    assert.equal(await page.locator("[data-field-note-page]").count(), 0);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      "About direct URLs and earlier explicit concept URLs remain available",
    );
  }
} catch (error) {
  if (activePage && !activePage.isClosed()) {
    console.error(`Failed ${activeName} at ${activePage.url()}`);
    await activePage.screenshot({
      path: resolve(evidence, `${activeName}-failure.png`),
      animations: "disabled",
    });
  }
  throw error;
} finally {
  await browser.close();
}
console.log(`${passed} About flow viewport/theme scenarios passed`);
