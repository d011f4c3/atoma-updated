/* Shared native-entry hero checks: isolated public reads, no external requests or
 * live writes. The one simulated mutation is held and rejected locally. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { translate } from "../src/lib/i18n/index.ts";
import { createHeroStudyFixture } from "./hero-cx-fixtures.mjs";

export async function runHeroCxEntry({
  layout,
  envPrefix,
  defaultEvidence,
  isDefault = false,
  primaryImageSelector = "[data-cx-hero-image]",
  allowCanvas = false,
  clippingSelector = "h1,[data-cx-samples],[data-cx-product-link],figcaption",
  failedImageText,
  checkImage,
  checkSpecific,
  checkFailedScene,
  checkFailure,
  checkEdges,
}) {
  const { chromium } = await import(
    process.env.PLAYWRIGHT_MODULE
      ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
      : "playwright"
  );
  const baseURL = process.env.HERO_CX_STUDY_BASE_URL ?? "http://127.0.0.1:3100";
  const studyURL = `${baseURL}/hero-cx-study`;
  const url = `${studyURL}?layout=${layout}`;
  const evidence = process.env[`${envPrefix}_EVIDENCE`] ?? defaultEvidence;
  const profiles = process.env[`${envPrefix}_PROFILES`]
    ?.split(",")
    .filter(Boolean) ?? [
    "1440-light-en",
    "1440-dark-ja",
    "768-light-zh-Hans",
    "768-dark-zh-Hant",
    "390-light-ja",
    "390-dark-en",
    "360-light-zh-Hans",
    "320-dark-zh-Hant",
  ];
  const visualOnly = process.env[`${envPrefix}_VISUAL_ONLY`] === "1";
  const keys = SAMPLE_SET_CONTENTS.map((item) => item.key);
  const applications = {
    ceremonial: "Tea service",
    barista: "Lattes",
    culinary: "Recipes & baking",
  };
  const measurements = [];
  await mkdir(evidence, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const setup = (width, tone, locale, options) =>
    createHeroStudyFixture(browser, baseURL, width, tone, locale, options);
  const study = (page) => page.locator("[data-hero-cx-study]");
  const hero = (page) => page.locator(`[data-cx-layout-${layout}]`);
  const productLink = (page, key) =>
    page.locator(`[data-cx-product-link="${key}"]`);
  const productURL = (product) =>
    `/shop/${encodeURIComponent(product.productHandle)}`;
  async function eventually(check, message) {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (await check()) return;
      await new Promise((done) => setTimeout(done, 40));
    }
    assert.fail(message);
  }
  function clean(test) {
    assert.deepEqual(test.errors, []);
    assert.deepEqual(test.writes, []);
  }
  async function ready(page) {
    await hero(page).waitFor();
    assert.equal(await study(page).getAttribute("data-layout"), layout);
  }
  async function capture(page, name) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: resolve(evidence, `${name}-viewport.png`),
      fullPage: false,
    });
    await page.screenshot({
      path: resolve(evidence, `${name}-page.png`),
      fullPage: true,
    });
  }
  async function geometry(page) {
    await page.evaluate(() => window.scrollTo(0, 0));
    return page.evaluate(
      ({ layout, primaryImageSelector }) => {
        const heroNode = document.querySelector(`[data-cx-layout-${layout}]`);
        const controls = document.querySelector(
          '[aria-label="Study controls"]',
        );
        const h = heroNode.getBoundingClientRect();
        const c = controls.getBoundingClientRect();
        const sample = heroNode
          .querySelector("[data-cx-samples]")
          .getBoundingClientRect();
        const photo = heroNode
          .querySelector(primaryImageSelector)
          .getBoundingClientRect();
        const links = [
          ...heroNode.querySelectorAll("[data-cx-product-link]"),
        ].map((node) => ({
          key: node.dataset.cxProductLink,
          bottom: node.getBoundingClientRect().bottom,
        }));
        return {
          heroTop: h.top,
          heroBottom: h.bottom,
          controlsTop: c.top,
          sampleBottom: sample.bottom,
          imageTop: photo.top,
          visibleImageHeight: Math.max(
            0,
            Math.min(photo.bottom, innerHeight) - Math.max(photo.top, 0),
          ),
          viewportHeight: innerHeight,
          links,
          follows: Boolean(
            heroNode.compareDocumentPosition(controls) &
            Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        };
      },
      { layout, primaryImageSelector },
    );
  }
  async function assertHero(page, locale, width, bounds) {
    await ready(page);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      true,
      "No horizontal page overflow",
    );
    assert.equal(await hero(page).locator("h1").count(), 1);
    assert.equal(
      await hero(page).locator(primaryImageSelector).count(),
      1,
      "One primary material or application image",
    );
    assert.equal(
      await hero(page)
        .locator(
          "[data-silver-bag],[data-cx-choice],[data-cx-intent],[data-cx-back],[data-cx-guided-progress]" +
            (allowCanvas ? "" : ",canvas"),
        )
        .count(),
      0,
      "The hero provides direct application entry without a quiz or packaging stage",
    );
    assert.equal(await hero(page).locator("[data-cx-primary]").count(), 1);
    const sample = hero(page).locator("[data-cx-samples]");
    assert.equal(await sample.getAttribute("data-cx-primary"), "samples");
    assert.equal(await sample.getAttribute("href"), "/samples");
    assert.equal(
      await sample
        .locator("..")
        .getByText(translate(locale, "Three matcha · 20 g each"), {
          exact: true,
        })
        .isVisible(),
      true,
    );
    for (const product of SAMPLE_SET_CONTENTS) {
      const link = productLink(page, product.key);
      assert.equal(await link.count(), 1);
      assert.equal(await link.getAttribute("href"), productURL(product));
      const text = await link.textContent();
      assert.ok(
        text.includes(translate(locale, product.name)),
        `${product.key} has its exact product name`,
      );
      assert.ok(
        text.includes(translate(locale, applications[product.key])),
        `${product.key} has its application label`,
      );
      assert.ok(
        text.includes(product.productCode),
        `${product.key} has its canonical code`,
      );
    }
    const clipping = await hero(page)
      .locator(clippingSelector)
      .evaluateAll((nodes) =>
        nodes
          .filter(
            (node) =>
              node.getClientRects().length &&
              node.scrollWidth > node.clientWidth + 1,
          )
          .map((node) => node.textContent),
      );
    assert.deepEqual(
      clipping,
      [],
      "Headline, actions and product labels do not clip",
    );
    assert.equal(
      bounds.follows,
      true,
      "Reviewer controls follow the actual hero",
    );
    assert.ok(bounds.controlsTop >= bounds.heroBottom - 1);
    assert.ok(
      bounds.sampleBottom <= bounds.viewportHeight,
      "The Sample Set action fits the first viewport",
    );
    assert.ok(
      bounds.visibleImageHeight > 0,
      "The first viewport includes the primary image",
    );
    assert.ok(
      bounds.links.every((link) => link.bottom <= bounds.viewportHeight),
      "All three application entries fit the first viewport",
    );
    if (width <= 760) {
      const innerScroll = await hero(page)
        .locator("section,article,p")
        .evaluateAll((nodes) =>
          nodes
            .filter(
              (node) =>
                ["auto", "scroll"].includes(getComputedStyle(node).overflowY) &&
                node.scrollHeight > node.clientHeight + 1,
            )
            .map((node) => node.tagName),
        );
      assert.deepEqual(
        innerScroll,
        [],
        "Mobile content uses normal page scrolling",
      );
    }
  }
  async function assertImage(page, locale) {
    await checkImage({
      page,
      locale,
      hero: hero(page),
      study: study(page),
      baseURL,
      eventually,
    });
  }
  async function assertSelected(page, key) {
    await ready(page);
    await eventually(
      async () =>
        (await page
          .locator(`[data-cx-application="${key}"]`)
          .getAttribute("data-selected")) === "true",
      `Browser Back preserves ${key}`,
    );
    assert.equal(new URL(page.url()).searchParams.get("tea"), key);
  }
  async function visitProduct(page, key, keyboard = false) {
    const product = SAMPLE_SET_CONTENTS.find((item) => item.key === key);
    if (keyboard) {
      await productLink(page, key).focus();
      await page.keyboard.press("Enter");
    } else await productLink(page, key).click();
    await page
      .locator(`[data-retail-product="${product.productHandle}"]`)
      .waitFor();
    assert.equal(new URL(page.url()).pathname, productURL(product));
    assert.equal(
      new URL(page.url()).search,
      "",
      "Ordinary product links do not silently force a pack",
    );
  }

  try {
    for (const profile of profiles) {
      const match = /^(\d+)-(light|dark)-(en|ja|zh-Hans|zh-Hant)$/.exec(
        profile,
      );
      assert.ok(match, `Unsupported profile ${profile}`);
      const [, size, tone, locale] = match;
      const width = Number(size);
      const test = await setup(width, tone, locale);
      const { page } = test;
      try {
        await page.goto(`${url}&tone=${tone}`, { waitUntil: "networkidle" });
        await ready(page);
        await page.evaluate(() => document.fonts.ready);
        await assertImage(page, locale);
        const bounds = await geometry(page);
        measurements.push({ profile, ...bounds });
        await capture(page, `${profile}-${layout}`);
        if (!visualOnly) {
          await assertHero(page, locale, width, bounds);
          if (checkSpecific)
            await checkSpecific({
              page,
              locale,
              width,
              hero: hero(page),
              study: study(page),
              eventually,
            });
          const key = keys[profiles.indexOf(profile) % keys.length];
          await visitProduct(page, key);
          await page.goBack();
          await assertSelected(page, key);
          await page.reload({ waitUntil: "networkidle" });
          await assertSelected(page, key);
          const alternate = tone === "light" ? "dark" : "light";
          await page.locator("[data-cx-tone]").selectOption(alternate);
          await eventually(
            async () =>
              (await study(page).getAttribute("data-tone")) === alternate,
            "Theme changes in place",
          );
          await assertSelected(page, key);
          await assertImage(page, locale);
        }
        clean(test);
        console.log(
          `${profile}: ${visualOnly ? "visual captures ready" : "hero, native links, imagery and selection passed"}`,
        );
      } catch (error) {
        await capture(page, `failure-${profile}`);
        console.error({
          profile,
          url: page.url(),
          errors: test.errors,
          writes: test.writes,
        });
        throw error;
      } finally {
        test.release();
        await test.context.close();
      }
    }
    if (measurements.length)
      await writeFile(
        resolve(evidence, `${layout}-geometry.json`),
        JSON.stringify(measurements, null, 2),
      );

    if (!visualOnly && process.env[`${envPrefix}_SKIP_EDGE`] !== "1") {
      const navigation = await setup(1440, "dark", "en");
      try {
        const { page } = navigation;
        await page.goto(
          `${studyURL}?layout=${isDefault ? "invalid" : layout}&tea=invalid&tone=invalid&intent=reorder&step=product`,
          { waitUntil: "networkidle" },
        );
        await ready(page);
        assert.equal(await study(page).getAttribute("data-tone"), "dark");
        for (const key of keys) {
          await visitProduct(page, key, true);
          await page
            .getByRole("button", { name: "Open cart, 2 items", exact: true })
            .click();
          const dialog = page.locator("dialog[open]");
          await dialog.waitFor();
          assert.ok((await dialog.innerText()).includes("¥14,000"));
          await dialog
            .getByRole("button", { name: "Close cart", exact: true })
            .click();
          await page.goBack();
          await assertSelected(page, key);
        }
        await page.locator("[data-cx-samples]").click();
        await page.locator("[data-samples-page]").waitFor();
        await page.goBack();
        await assertSelected(page, keys.at(-1));
        for (const savedLayout of [
          "guided",
          "directory",
          "invitation",
          "applications",
          "material",
          "field",
        ].filter((candidate) => candidate !== layout)) {
          await page.locator("[data-cx-layout]").selectOption(savedLayout);
          await page.locator(`[data-cx-layout-${savedLayout}]`).waitFor();
          assert.equal(await hero(page).count(), 0);
        }
        await page.locator("[data-cx-layout]").selectOption(layout);
        await assertSelected(page, keys.at(-1));
        clean(navigation);
        console.log(
          "Three exact product paths, keyboard, cart, Sample Set and saved alternatives passed",
        );
      } finally {
        navigation.release();
        await navigation.context.close();
      }

      for (const target of ["samples", "barista"]) {
        const hydration = await setup(390, "light", "en", {
          holdScripts: true,
        });
        try {
          const { page } = hydration;
          await page.goto(isDefault ? studyURL : url, { waitUntil: "commit" });
          await ready(page);
          await eventually(
            async () => hydration.scriptRequests() > 0,
            "JavaScript is held before hydration",
          );
          const link =
            target === "samples"
              ? page.locator("[data-cx-samples]")
              : productLink(page, target);
          assert.equal(await link.getAttribute("aria-disabled"), null);
          await link.click({ noWaitAfter: true });
          const path =
            target === "samples"
              ? "/samples"
              : productURL(
                  SAMPLE_SET_CONTENTS.find((item) => item.key === target),
                );
          await eventually(
            async () => new URL(page.url()).pathname === path,
            `${target} native link works before hydration`,
          );
          hydration.releaseScripts();
          clean(hydration);
        } finally {
          hydration.release();
          await hydration.context.close();
        }
      }
      console.log("Native Sample Set and product links work before hydration");

      for (const options of [
        { holdImages: true, holdDestination: true },
        { failImages: true },
      ]) {
        const images = await setup(360, "dark", "en", options);
        try {
          const { page } = images;
          await page.goto(url, {
            waitUntil: options.failImages ? "networkidle" : "domcontentloaded",
          });
          await ready(page);
          await eventually(
            async () => images.imageRequests() > 0,
            "Hero imagery is requested",
          );
          await eventually(
            async () => await page.locator("[data-cx-layout]").isEnabled(),
            "Stateful navigation is hydrated while images and destination reads remain pending",
          );
          if (options.failImages) {
            if (checkFailedScene) {
              await checkFailedScene({ page, hero: hero(page), eventually });
            } else {
              await hero(page)
                .locator('[data-cx-hero-image][data-image-state="failed"]')
                .waitFor();
              assert.equal(
                (
                  await page
                    .locator("[data-cx-hero-image-fallback]")
                    .textContent()
                ).trim(),
                failedImageText,
              );
            }
            if (checkFailure)
              await checkFailure({ page, hero: hero(page), eventually });
            await capture(page, "360-dark-en-failed-imagery");
          }
          await visitProduct(page, "culinary");
          await page.goBack({ waitUntil: "domcontentloaded" });
          await assertSelected(page, "culinary");
          await page.locator("[data-cx-samples]").click();
          await page.locator("[data-samples-page]").waitFor();
          clean(images);
        } catch (error) {
          await capture(
            images.page,
            `failure-${options.failImages ? "failed" : "held"}-image`,
          );
          console.error({
            url: images.page.url(),
            errors: images.errors,
            writes: images.writes,
          });
          throw error;
        } finally {
          images.release();
          await images.context.close();
        }
      }
      console.log(
        "Slow/failed hero imagery and held destination reads preserve native navigation",
      );

      const locked = await setup(390, "light", "en", { holdMutation: true });
      try {
        const { page } = locked;
        await page.goto(url, { waitUntil: "networkidle" });
        await page.locator("[data-cx-cart]").click();
        const dialog = page.locator("dialog[open]");
        await dialog
          .getByRole("button", { name: /Increase .* quantity/ })
          .click();
        await eventually(
          async () => locked.simulatedWrites.length === 1,
          "A cart update is intercepted locally",
        );
        await dialog
          .getByRole("button", { name: "Close cart", exact: true })
          .click();
        const before = page.url();
        for (const link of [
          page.locator("[data-cx-samples]"),
          ...keys.map((key) => productLink(page, key)),
        ]) {
          assert.equal(await link.getAttribute("aria-disabled"), "true");
          await link.dispatchEvent("click");
          assert.equal(
            page.url(),
            before,
            "Pending mutation locks every native entry",
          );
        }
        locked.releaseMutation();
        await eventually(
          async () =>
            (await page
              .locator("[data-cx-samples]")
              .getAttribute("aria-disabled")) === null,
          "Rejected fixture mutation releases navigation",
        );
        clean(locked);
        console.log(
          "Mutation locks cover every hero entry without sending writes to a server",
        );
      } finally {
        locked.release();
        await locked.context.close();
      }
      if (checkEdges)
        await checkEdges({ setup, url, studyURL, capture, eventually, clean });
    }
  } finally {
    await browser.close();
  }
}
