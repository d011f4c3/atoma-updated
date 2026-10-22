import assert from "node:assert/strict";
import test from "node:test";
import {
  isCanonicalMotionRoute,
  permitsPageReveal,
  permitsScramble,
} from "../src/lib/canonical-motion-policy.ts";

const canonical = [
  "/",
  "/new-hero",
  "/new-hero2",
  "/new-hero3",
  "/new-hero4",
  "/new-hero5",
  "/new-hero6",
  "/new-hero7",
  "/new-hero7/matcha",
  "/new-hero7/samples",
  "/new-hero7/origins",
  "/new-hero7/wholesale",
  "/shop",
  "/shop/",
  "/wholesale",
  "/wholesale/",
  "/shop/jmm-storefront-test-matcha",
  "/samples",
  "/about",
  "/origins",
  "/field-notes/wazuka",
];
const studies = [
  "/new-hero7-other",
  "/new-hero7/unknown",
  "/hero-cx-study",
  "/shop-filter-study",
  "/purchase-button-study",
  "/purchase-button-study/samples",
  "/about-study",
  "/origins-study",
  "/concept-02",
  "/shopper",
  "/wholesale-study",
  null,
];

test("canonical motion policy covers public journeys without capturing saved studies", () => {
  canonical.forEach((path) =>
    assert.equal(isCanonicalMotionRoute(path), true, path),
  );
  studies.forEach((path) =>
    assert.equal(isCanonicalMotionRoute(path), false, String(path)),
  );
});

test("authored menu, supporting-copy and heading effects are allowed across routes", () => {
  for (const pathname of [...canonical, ...studies]) {
    for (const context of [
      { interactive: false, insideHeading: false, insideControl: false },
      { interactive: true, insideHeading: false, insideControl: true },
      { interactive: false, insideHeading: true, insideControl: true },
      { interactive: true, insideHeading: true, insideControl: false },
      { interactive: false, insideHeading: true, insideControl: false },
    ]) {
      assert.equal(permitsScramble(pathname, context), true, String(pathname));
    }
  }
});

test("live outputs and explicitly stable data remain settled on every route", () => {
  for (const pathname of [...canonical, ...studies]) {
    assert.equal(
      permitsScramble(pathname, {
        interactive: false,
        insideHeading: false,
        insideControl: false,
        stableData: true,
      }),
      false,
      String(pathname),
    );
  }
});

test("canonical entrances restore authored text, imagery and mixed groups", () => {
  const photograph = {
    visualTreatment: true,
    hasMedia: true,
    hasText: false,
    hasControl: false,
  };
  for (const pathname of canonical) {
    assert.equal(permitsPageReveal(pathname, photograph), true);
    for (const context of [
      { ...photograph, hasText: true },
      { ...photograph, hasMedia: false },
      { ...photograph, visualTreatment: false },
      {
        visualTreatment: false,
        hasMedia: false,
        hasText: true,
        hasControl: false,
      },
    ]) {
      assert.equal(permitsPageReveal(pathname, context), true, pathname);
    }
  }
});

test("canonical controls never wait for a text or photograph entrance", () => {
  for (const pathname of canonical) {
    for (const visualTreatment of [true, false]) {
      for (const hasMedia of [true, false]) {
        assert.equal(
          permitsPageReveal(pathname, {
            visualTreatment,
            hasMedia,
            hasText: true,
            hasControl: true,
          }),
          false,
          pathname,
        );
      }
    }
  }
});

test("saved study entrances retain mixed text and image presentation", () => {
  for (const pathname of studies) {
    assert.equal(
      permitsPageReveal(pathname, {
        visualTreatment: false,
        hasMedia: true,
        hasText: true,
        hasControl: true,
      }),
      true,
    );
  }
});
