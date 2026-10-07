/* Isolated About study checks. Commerce reads are mocked; writes are blocked. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { aboutStudyContent } from "../src/lib/about-study-content.ts";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const baseURL = process.env.ABOUT_STUDY_BASE_URL ?? "http://127.0.0.1:3100";
const evidence =
  process.env.ABOUT_STUDY_EVIDENCE ?? ".local/about-layouts-0133";
const filter = process.env.ABOUT_STUDY_FILTER;
const directions = [
  "fieldnotes",
  "compact",
  "ledger",
  "columns",
  "broadside",
  "sequence",
];
const directionLabels = {
  fieldnotes: "Fieldnotes",
  compact: "Map",
  ledger: "Chapters",
  columns: "Index",
  broadside: "Broadside",
  sequence: "Sequence",
};
const product = {
  id: "barista",
  title: "Japanese Barista Matcha Powder for Lattes — 1 kg",
  handle: "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
  productCode: "UJI-00",
  description: "Isolated About study browser fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${"b".repeat(43)}`,
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
};

async function eventually(check, message) {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  assert.fail(message);
}

async function setup(browser, width, tone, motion = "reduce") {
  const context = await browser.newContext({
    viewport: { width, height: width === 320 ? 740 : 900 },
    reducedMotion: motion,
    hasTouch: width === 320,
    isMobile: width === 320,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: "en", url: baseURL },
  ]);
  const errors = [];
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    try {
      assert.ok(
        ["GET", "HEAD"].includes(request.method()),
        `Writes are forbidden: ${request.method()} ${url.pathname}`,
      );
      if (url.pathname.startsWith("/api/")) {
        assert.equal(url.origin, new URL(baseURL).origin);
        if (url.pathname === "/api/catalog")
          return route.fulfill({
            contentType: "application/json",
            json: {
              status: "ready",
              products: [product],
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
  page.setDefaultNavigationTimeout(40_000);
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page, errors };
}

async function ready(page, path = "/about-study") {
  const cartRead = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/cart",
  );
  await page.goto(`${baseURL}${path}`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-about-study]").waitFor();
  await cartRead;
  await page.evaluate(() => document.fonts.ready);
}

async function direction(page, value) {
  const select = page.getByRole("combobox", {
    name: "About direction",
    exact: true,
  });
  if (await select.isVisible()) await select.selectOption(value);
  else {
    const button = page
      .getByRole("group", { name: "About direction", exact: true })
      .getByRole("button", {
        name: directionLabels[value],
        exact: true,
      });
    await button.focus();
    await button.press("Enter");
  }
  await page.locator(`[data-about-study][data-direction="${value}"]`).waitFor();
  assert.equal(
    new URL(page.url()).searchParams.get("direction") ?? "fieldnotes",
    value,
  );
}

async function fit(page, article) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    "The study fits the viewport without horizontal scrolling",
  );
  for (const locator of [article, page.locator("[data-brand-part='header']")]) {
    assert.equal(
      await locator.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
      true,
      `Article and storefront header content fit their containers: ${JSON.stringify(
        await locator.evaluate((element) => ({
          tag: element.tagName,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
        })),
      )}`,
    );
  }
}

async function capture(page, name, fullPage = true) {
  await mkdir(evidence, { recursive: true });
  await page.screenshot({
    path: resolve(evidence, `${name}.png`),
    fullPage,
  });
}

const sectionCopies = {
  approach: [
    aboutStudyContent.approachTitle,
    ...aboutStudyContent.principles.map((item) => item.text),
  ],
  place: [
    aboutStudyContent.placeTitle,
    aboutStudyContent.placeBody,
    aboutStudyContent.provenanceNote,
  ],
  community: [
    aboutStudyContent.community.title,
    aboutStudyContent.community.body,
    aboutStudyContent.community.note,
  ],
};

async function passages(scope, copies) {
  for (const copy of copies) {
    const passage = scope.getByText(copy, { exact: true });
    assert.equal(
      await passage.count(),
      1,
      "Each subject includes its shared passage once",
    );
    assert.equal(
      await passage.isVisible(),
      true,
      "The selected subject's copy can be read",
    );
  }
}

async function textStyle(scope, copy) {
  return scope.getByText(copy, { exact: true }).evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      fontFamily: style.fontFamily,
    };
  });
}

async function subjectCopy(article, subject, types) {
  const section = article.locator(`[data-about-section="${subject}"]`);
  assert.equal(await section.isVisible(), true);
  const disclosure = article.locator(
    `details[data-about-disclosure="${subject}"]`,
  );
  const scope = (await disclosure.count()) ? disclosure : section;
  await passages(scope, sectionCopies[subject]);
  const body =
    subject === "approach"
      ? aboutStudyContent.principles[0].text
      : subject === "place"
        ? aboutStudyContent.placeBody
        : aboutStudyContent.community.body;
  types[subject] = await textStyle(section, body);
  if (subject === "community") {
    const status = scope.getByText(aboutStudyContent.community.status, {
      exact: false,
    });
    assert.equal(
      await status.isVisible(),
      true,
      "Community activity remains identified as future intent",
    );
    const heading = await scope
      .getByRole("heading", {
        name: aboutStudyContent.community.title,
        exact: true,
      })
      .elementHandle();
    assert.equal(
      await status.evaluate(
        (element, title) =>
          Boolean(
            element.compareDocumentPosition(title) &
            Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        heading,
      ),
      true,
      "Future intent precedes community copy",
    );
  }
}

async function activate(locator, mobile, key = "Enter") {
  if (mobile) {
    assert.ok(
      (await locator.boundingBox()).height >= 44,
      "Interactive subjects have usable touch targets",
    );
    await locator.tap();
  } else {
    await locator.focus();
    await locator.press(key);
  }
}

async function experienceState(article) {
  return article.evaluate((element) => ({
    disclosures: [
      ...element.querySelectorAll("details[data-about-disclosure]"),
    ].map((node) => ({
      subject: node.dataset.aboutDisclosure,
      open: node.open,
    })),
    selected: [...element.querySelectorAll("[data-about-subject-button]")].map(
      (node) => ({
        subject: node.dataset.aboutSubjectButton,
        expanded: node.getAttribute("aria-expanded"),
      }),
    ),
    steps: [...element.querySelectorAll("[data-about-sequence-step]")].map(
      (node) => ({
        subject: node.dataset.aboutSequenceStep,
        current: node.getAttribute("aria-current"),
      }),
    ),
  }));
}

async function initialExperience(article, value) {
  assert.equal(await article.getByRole("tablist").count(), 0);
  assert.equal(await article.getByRole("tabpanel").count(), 0);
  const sections = ["approach", "place", "community"].map((subject) =>
    article.locator(`[data-about-section="${subject}"]`),
  );
  for (let index = 0; index < sections.length; index++) {
    assert.equal(await sections[index].count(), 1);
    if (index > 0) {
      const next = await sections[index].elementHandle();
      assert.equal(
        await sections[index - 1].evaluate(
          (element, node) =>
            Boolean(
              element.compareDocumentPosition(node) &
              Node.DOCUMENT_POSITION_FOLLOWING,
            ),
          next,
        ),
        true,
        "Chapter DOM order remains approach, place, community",
      );
    }
  }
  if (value === "fieldnotes" || value === "broadside") {
    for (const section of sections)
      assert.equal(await section.isVisible(), true);
  } else if (value === "sequence") {
    assert.equal(await sections[0].isVisible(), true);
    for (const section of sections.slice(1))
      assert.equal(await section.isVisible(), false);
    assert.equal(
      await article
        .locator('[data-about-sequence-step="approach"]')
        .getAttribute("aria-current"),
      "step",
    );
    assert.equal(
      await article
        .getByRole("button", { name: "Previous section", exact: true })
        .isDisabled(),
      true,
      "Sequence starts at its first section",
    );
    assert.equal(
      await article
        .getByRole("button", { name: "Next section", exact: true })
        .isEnabled(),
      true,
    );
  } else if (value === "columns") {
    const buttons = article.locator("[data-about-subject-button]");
    assert.equal(await buttons.count(), 4);
    assert.equal(
      await article
        .locator('[data-about-subject-button][aria-expanded="true"]')
        .count(),
      0,
    );
    for (const section of sections)
      assert.equal(await section.isVisible(), false);
    assert.equal(
      await article
        .getByText(aboutStudyContent.lead, { exact: true })
        .isVisible(),
      false,
    );
  } else {
    const details = article.locator("details[data-about-disclosure]");
    assert.equal(await details.count(), 3);
    assert.equal(
      await details.evaluateAll((nodes) => nodes.every((node) => !node.open)),
      true,
      "Map and Chapters start with closed native disclosures",
    );
    assert.equal(
      await article
        .getByText(aboutStudyContent.placeBody, { exact: true })
        .isVisible(),
      false,
    );
    assert.equal(
      await article
        .getByText(aboutStudyContent.community.body, { exact: true })
        .isVisible(),
      false,
    );
  }
  return article.evaluate((element) => {
    const nodes = [
      ...element.querySelectorAll(
        "h1, nav, summary, [data-about-subject-button], [data-about-sequence-step], [data-about-field-stage], [data-about-section]",
      ),
    ];
    const structure = nodes.map((node) => {
      const ancestry = [];
      for (
        let parent = node.parentElement;
        parent && parent !== element;
        parent = parent.parentElement
      )
        ancestry.unshift(parent.tagName);
      return [node.tagName, node.getAttribute("data-about-section"), ancestry];
    });
    const opening = nodes
      .filter((node) => node.checkVisibility())
      .map((node) => {
        const rect = node.getBoundingClientRect();
        if (rect.top >= innerHeight || rect.bottom <= 0) return null;
        return [
          node.tagName,
          Math.round((rect.x / innerWidth) * 8),
          Math.round((Math.max(0, rect.y) / innerHeight) * 12),
          Math.round((rect.width / innerWidth) * 8),
          Math.round(
            ((Math.min(rect.bottom, innerHeight) - Math.max(0, rect.top)) /
              innerHeight) *
              12,
          ),
        ];
      })
      .filter(Boolean);
    return { structure, opening };
  });
}

async function exploreExperience(page, article, value, mobile, label) {
  const types = {};
  if (value === "sequence") {
    const previous = article.getByRole("button", {
      name: "Previous section",
      exact: true,
    });
    const next = article.getByRole("button", {
      name: "Next section",
      exact: true,
    });
    const subjects = ["approach", "place", "community"];
    const steps = article.locator("[data-about-sequence-step]");
    assert.equal(await steps.count(), subjects.length);

    async function selected(subject, focusExpected = true) {
      const button = article.locator(`[data-about-sequence-step="${subject}"]`);
      const panelId = await button.getAttribute("aria-controls");
      assert.ok(panelId, "Each numbered step identifies its reading section");
      const section = article.locator(`[id="${panelId}"]`);
      assert.equal(await section.getAttribute("data-about-section"), subject);
      assert.equal(await section.isVisible(), true);
      assert.equal(await button.getAttribute("aria-current"), "step");
      assert.equal(
        await article
          .locator('[data-about-sequence-step][aria-current="step"]')
          .count(),
        1,
        "Exactly one reading step is current",
      );
      assert.equal(
        await article.locator("[data-about-section]:visible").count(),
        1,
        "Sequence displays one section at a time",
      );
      if (focusExpected)
        await eventually(
          () =>
            section
              .locator("h2")
              .evaluate((element) => element === document.activeElement),
          "Changing a reading step moves keyboard focus to its heading",
        );
      await subjectCopy(article, subject, types);
      await fit(page, article);
    }

    await selected("approach", false);
    await passages(article, [aboutStudyContent.lead]);
    types.lead = await textStyle(article, aboutStudyContent.lead);
    await activate(next, mobile);
    await selected("place");
    await capture(page, `${label}-${value}-place-open`);
    await activate(next, mobile, "Space");
    await selected("community");
    assert.equal(
      await next.isDisabled(),
      true,
      "The last step has no next section",
    );
    await capture(page, `${label}-${value}-community-open`);
    await activate(previous, mobile);
    await selected("place");
    await activate(previous, mobile, "Space");
    await selected("approach");
    assert.equal(
      await previous.isDisabled(),
      true,
      "The first step has no previous section",
    );

    // Direct numbered controls can skip ahead and return in any order.
    for (const subject of ["community", "approach", "place"]) {
      await activate(
        article.locator(`[data-about-sequence-step="${subject}"]`),
        mobile,
      );
      await selected(subject);
    }
  } else if (value === "columns") {
    for (const subject of ["about", "approach", "community", "place"]) {
      const button = article.locator(
        `[data-about-subject-button="${subject}"]`,
      );
      const panelId = await button.getAttribute("aria-controls");
      assert.ok(panelId, "Index controls identify their inline passage");
      await activate(button, mobile);
      assert.equal(await button.getAttribute("aria-expanded"), "true");
      const panel = article.locator(`[id="${panelId}"]`);
      assert.equal(await panel.isVisible(), true);
      assert.equal(
        await article
          .locator('[data-about-subject-button][aria-expanded="true"]')
          .count(),
        1,
      );
      if (subject === "about") {
        await passages(panel, [aboutStudyContent.lead]);
        types.lead = await textStyle(panel, aboutStudyContent.lead);
      } else await subjectCopy(article, subject, types);
      await capture(page, `${label}-${value}-${subject}-open`);
      const close = panel.getByRole("button", {
        name: `Close ${subject === "approach" ? "selection" : subject}`,
        exact: true,
      });
      await activate(close, mobile);
      assert.equal(await panel.isVisible(), false);
      assert.equal(
        await button.evaluate((element) => element === document.activeElement),
        true,
        "Closing an Index passage restores its tile focus",
      );
      assert.equal(await button.getAttribute("aria-expanded"), "false");
    }
    await activate(
      article.locator('[data-about-subject-button="place"]'),
      mobile,
    );
  } else {
    if (value !== "ledger") {
      await passages(article, [aboutStudyContent.lead]);
      types.lead = await textStyle(article, aboutStudyContent.lead);
    }
    for (const subject of ["approach", "place", "community"]) {
      if (value !== "fieldnotes" && value !== "broadside") {
        const details = article.locator(
          `details[data-about-disclosure="${subject}"]`,
        );
        const summary = details.locator(":scope > summary");
        await activate(summary, mobile);
        assert.equal(await details.evaluate((node) => node.open), true);
        await subjectCopy(article, subject, types);
        await activate(summary, mobile, "Space");
        assert.equal(
          await details.evaluate((node) => node.open),
          false,
          "A subject can be collapsed again with native controls",
        );
        await activate(summary, mobile);
      }
      await subjectCopy(article, subject, types);
      if (value === "ledger" && subject === "approach") {
        await passages(article, [aboutStudyContent.lead]);
        types.lead = await textStyle(article, aboutStudyContent.lead);
      }
    }
    await capture(page, `${label}-${value}-expanded`);
  }
  for (const style of Object.values(types))
    assert.ok(
      parseFloat(style.fontSize) >= 12,
      "Shared body copy remains readable",
    );
  const body = [
    aboutStudyContent.lead,
    ...aboutStudyContent.principles.map((item) => item.text),
    aboutStudyContent.placeBody,
    aboutStudyContent.provenanceNote,
    aboutStudyContent.community.body,
    aboutStudyContent.community.note,
  ]
    .join(" ")
    .split(/\s+/u).length;
  assert.ok(
    body < 302 * 0.75,
    "Reading depth stays shorter than the earlier long draft",
  );
  const photograph = await article
    .getByRole("img", {
      name: aboutStudyContent.fieldStory.imageAlt,
      exact: true,
    })
    .elementHandle();
  assert.ok(photograph);
  await photograph.scrollIntoViewIfNeeded();
  await eventually(
    () =>
      photograph.evaluate((image) => image.complete && image.naturalWidth > 0),
    "The shared field photograph loads in every experience",
  );
  await fit(page, article);
  await reducedCaption(page, article);
  return { types, photograph, state: await experienceState(article) };
}

function compareExperiences(records) {
  for (const value of directions.slice(1))
    assert.deepEqual(
      records[value].types,
      records.fieldnotes.types,
      "Body typography stays consistent across six experiences",
    );
  for (const aspect of ["structure", "opening"])
    assert.equal(
      new Set(
        directions.map((value) =>
          JSON.stringify(records[value].composition[aspect]),
        ),
      ).size,
      directions.length,
      `All six experiences have distinct ${aspect} on this viewport`,
    );
}

async function reducedCaption(page, article) {
  const caption = article.locator("[data-about-field-story]");
  if (!(await caption.locator("[data-scramble-glyph]").count())) {
    const text = await caption.innerText();
    await caption.hover();
    await caption.focus();
    assert.equal(
      await caption.innerText(),
      text,
      "The plain reader label remains stable with reduced motion",
    );
    return;
  }
  await caption.evaluate((element) => {
    const settled = () =>
      [...element.querySelectorAll("[data-scramble-glyph]")].every(
        (glyph) =>
          glyph.textContent === glyph.previousElementSibling?.textContent,
      );
    const probe = {
      settled: settled(),
      changed: false,
      observer: new MutationObserver(() => {
        probe.changed ||= !settled();
      }),
    };
    probe.observer.observe(element, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    window.__aboutCaptionProbe = probe;
  });
  await caption.hover();
  await caption.focus();
  await page.waitForTimeout(650);
  assert.deepEqual(
    await page.evaluate(() => {
      const probe = window.__aboutCaptionProbe;
      probe.observer.disconnect();
      return { settled: probe.settled, changed: probe.changed };
    }),
    { settled: true, changed: false },
    "The fieldnotes label stays settled on hover and focus under reduced motion",
  );
}

async function fieldReader(page, article, value, tone) {
  const trigger = article.locator("[data-about-field-story]");
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  const scroll = await page.evaluate(() => window.scrollY);
  const priorURL = page.url();
  await trigger.press("Enter");
  const dialog = page.locator("[data-origins-dialog][open]");
  await dialog.waitFor();
  assert.equal(await dialog.getAttribute("data-tone"), tone);
  await dialog
    .locator(`[data-origins-entry="${aboutStudyContent.fieldStory.slug}"]`)
    .waitFor();
  await dialog
    .getByRole("button", { name: "Back to About", exact: true })
    .waitFor();
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  // Native close hides the dialog before React's close handler releases its
  // content and restores focus. Wait for both phases before the next keypress.
  await page
    .locator("[data-origins-dialog] [data-origins-content]")
    .waitFor({ state: "detached" });
  await eventually(() => page.url() === priorURL, "Reader restores study URL");
  await eventually(
    () => trigger.evaluate((element) => element === document.activeElement),
    "Reader returns focus to its story trigger",
  );
  assert.equal(
    await page.locator("[data-about-study]").getAttribute("data-direction"),
    value,
  );
  assert.ok(
    Math.abs((await page.evaluate(() => window.scrollY)) - scroll) <= 2,
    "Reader returns to the previous reading position",
  );
}

async function canonicalAbout(page, mobile) {
  await page.goto(`${baseURL}/?matcha=${product.handle}`, {
    waitUntil: "domcontentloaded",
  });
  const choice = page.locator(`[data-homepage-product-choice="${product.id}"]`);
  await choice.waitFor();
  await page.locator("[data-scene-canvas]").waitFor({ state: "attached" });
  const header = page.locator("main[data-concept='01'] > header");
  const menu = header.locator("[data-nav-summary]");
  const trigger = header.getByRole("button", {
    name: "About ATOMA",
    exact: true,
  });
  const priorURL = page.url();
  for (const method of ["escape", "outside"]) {
    if (mobile) await menu.click();
    await trigger.click();
    const dialog = page
      .locator("dialog[open]")
      .filter({ has: page.locator("[data-about-content]") });
    await dialog.waitFor();
    assert.equal(page.url(), priorURL, "About remains an in-place popup");
    if (method === "escape") await page.keyboard.press("Escape");
    else await page.mouse.click(2, 2);
    await dialog.waitFor({ state: "hidden" });
    await eventually(
      () =>
        (mobile ? menu : trigger).evaluate(
          (element) => element === document.activeElement,
        ),
      "About returns focus to the original navigation",
    );
    assert.equal(await choice.getAttribute("aria-pressed"), "true");
    assert.equal(page.url(), priorURL);
    assert.equal(await page.locator("[data-about-study]").count(), 0);
  }
}

async function runCase(browser, width, tone) {
  const { context, page, errors } = await setup(browser, width, tone);
  const label = `${width}-${tone}`;
  try {
    await ready(page, "/about-study");
    const root = page.locator("[data-about-study]");
    assert.equal(await root.getAttribute("data-storefront-theme"), tone);
    assert.equal(
      await root.getAttribute("data-direction"),
      "fieldnotes",
      "Fieldnotes is the default study direction",
    );
    const controls = page.getByRole("combobox", {
      name: "About direction",
      exact: true,
    });
    if (await controls.isVisible())
      assert.deepEqual(
        await controls
          .locator("option")
          .evaluateAll((options) => options.map((option) => option.value)),
        directions,
      );
    else
      assert.deepEqual(
        await page
          .getByRole("group", { name: "About direction", exact: true })
          .getByRole("button")
          .allTextContents(),
        directions.map((value) => directionLabels[value]),
        "The study retains the original four and adds two layouts",
      );
    const robots = page.locator('meta[name="robots"]');
    assert.ok((await robots.getAttribute("content")).includes("noindex"));
    const records = {};
    const theme = page.getByRole("switch", {
      name: "Dark mode in About study",
      exact: true,
    });
    for (const value of directions) {
      await direction(page, value);
      const article = page.locator(`[data-about-direction="${value}"]`);
      await article.waitFor();
      assert.equal(
        await page.locator("[data-about-direction]:visible").count(),
        1,
      );
      assert.equal(await article.locator("h1").count(), 1);
      if (value === "broadside" || value === "sequence")
        assert.equal(
          await article
            .locator("[data-about-composition]")
            .getAttribute("data-about-composition"),
          value,
          "Each new direction renders its own composition",
        );
      assert.equal(
        await article.evaluate((element) => element.closest("[lang]")?.lang),
        "en",
      );
      await fit(page, article);
      await capture(page, `${label}-${value}`);
      const composition = await initialExperience(article, value);
      await capture(page, `${label}-${value}-initial-viewport`, false);
      records[value] = {
        ...(await exploreExperience(
          page,
          article,
          value,
          width === 320,
          label,
        )),
        composition,
      };
      assert.equal(
        await page.locator("[data-confirmed-community-story]").count(),
        0,
        "No unsupported community activity is published as a completed story",
      );
      await fieldReader(page, article, value, tone);
      assert.deepEqual(
        await experienceState(article),
        records[value].state,
        "Reader and theme changes preserve the open subjects",
      );
      assert.equal(
        await records[value].photograph.evaluate((image) => image.isConnected),
        true,
      );
      await theme.click();
      const opposite = tone === "light" ? "dark" : "light";
      await eventually(
        async () =>
          (await root.getAttribute("data-storefront-theme")) === opposite,
        "Local study palette switches in place",
      );
      assert.equal(await root.getAttribute("data-direction"), value);
      assert.deepEqual(
        await experienceState(article),
        records[value].state,
        "Reader and theme changes preserve the open subjects",
      );
      assert.equal(
        await records[value].photograph.evaluate((image) => image.isConnected),
        true,
      );
      assert.equal(
        (await context.cookies()).find(
          (cookie) => cookie.name === "atoma-theme",
        ).value,
        tone,
        "Local study theme does not alter the storefront preference",
      );
      await fieldReader(page, article, value, opposite);
      await theme.click();
      await eventually(
        async () => (await root.getAttribute("data-storefront-theme")) === tone,
        "Local study palette can return without resetting its direction",
      );
      await fit(page, article);
    }
    compareExperiences(records);
    for (const value of directions) {
      await ready(page, `/about-study?direction=${value}`);
      assert.equal(
        await page.locator("[data-about-study]").getAttribute("data-direction"),
        value,
        "Each saved direction opens directly by URL",
      );
      await initialExperience(
        page.locator(`[data-about-direction="${value}"]`),
        value,
      );
    }
    await canonicalAbout(page, width === 320);
    assert.deepEqual(errors, []);
  } catch (error) {
    await capture(page, `${label}-failure`);
    throw error;
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  headless: true,
});
let passed = 0;
try {
  for (const width of [1366, 320]) {
    for (const tone of ["light", "dark"]) {
      if (filter && !`${width}-${tone}`.includes(filter)) continue;
      await runCase(browser, width, tone);
      passed++;
      console.log(
        `PASS ${width}-${tone}: six About layouts, shorter shared copy and typography, distinct experiences, disclosure, tile and sequence controls, loaded imagery, reader and theme continuity, original popup`,
      );
    }
  }
} finally {
  await browser.close();
}
console.log(`${passed} About study browser cases passed`);
