/* Saved finished-application study keeps explicit routing as new studies land. */
import assert from "node:assert/strict";
import { translate } from "../src/lib/i18n/index.ts";
import { runHeroCxEntry } from "./hero-cx-entry.mjs";

await runHeroCxEntry({
  layout: "applications",
  envPrefix: "HERO_CX_APPLICATIONS",
  defaultEvidence: ".local/hero-cx-study-0231/after",
  failedImageText: "Application image unavailable.",
  async checkImage({ page, locale, hero, study, baseURL, eventually }) {
    const frame = hero.locator("[data-cx-hero-image]");
    await eventually(
      async () => (await frame.getAttribute("data-image-state")) === "ready",
      "Hero photograph loads",
    );
    const image = frame.locator("img");
    assert.equal(await image.count(), 1);
    const tone = await study.getAttribute("data-tone");
    const source =
      tone === "dark"
        ? "/images/applications/matcha-hero-applications-v2-dark.webp"
        : "/images/applications/matcha-hero-applications-v2.webp";
    assert.equal(await frame.getAttribute("data-image-source"), source);
    const src = new URL(await image.getAttribute("src"), baseURL);
    assert.equal(src.searchParams.get("url") ?? src.pathname, source);
    const alt =
      "Composition reference showing prepared matcha, an iced latte and matcha cake.";
    assert.equal(await image.getAttribute("alt"), translate(locale, alt));
    if (locale !== "en") assert.notEqual(translate(locale, alt), alt);
    assert.equal(
      (await hero.locator("[data-cx-hero-reference]").textContent()).trim(),
      translate(
        locale,
        "AI composition reference · Product photography pending",
      ),
    );
    assert.equal(await page.locator("[data-cx-layout-material]").count(), 0);
  },
});
