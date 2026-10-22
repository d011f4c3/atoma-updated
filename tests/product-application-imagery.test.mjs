import assert from "node:assert/strict";
import test from "node:test";
import { productCodeReferences } from "../src/lib/product-codes.ts";
import { getProductApplicationImage } from "../src/lib/product-application-imagery.ts";
import { translate } from "../src/lib/i18n/index.ts";

test("application imagery follows the exact tea identity across canonical handles and reviewed aliases", () => {
  const expected = {
    ceremonial: "/images/samples/prepared-matcha.webp",
    barista: "/images/applications/iced-matcha-latte-reference-v1.webp",
    culinary: "/images/applications/matcha-tea-cake-reference-v1.webp",
  };
  for (const reference of productCodeReferences) {
    const canonical = getProductApplicationImage(reference.catalogHandle);
    assert.equal(canonical?.src, expected[reference.productKey]);
    assert.equal(canonical?.approvalStatus, "product-photography-pending");
    assert.equal(
      canonical?.sourceKind,
      reference.productKey === "ceremonial"
        ? "client-reference"
        : "ai-generated-reference",
    );
    for (const alias of reference.studyAliases) {
      assert.deepEqual(getProductApplicationImage(alias), canonical);
    }
  }
});

test("unknown or lookalike products never inherit another tea's application image", () => {
  for (const handle of [
    "",
    undefined,
    "sample-set",
    "unknown-matcha",
    "ceremonial-matcha-copy",
    "barista",
    "Culinary-Matcha",
    "__proto__",
    "constructor",
  ]) {
    for (const collection of ["reference", "canonical"]) {
      assert.equal(
        getProductApplicationImage(handle, collection),
        undefined,
        `${collection}: ${String(handle)}`,
      );
    }
  }
});

test("the canonical collection opts into matching hero applications without changing saved references", () => {
  const expected = {
    ceremonial: "/images/applications/prepared-matcha-hero-v3.webp",
    barista: "/images/applications/iced-matcha-latte-hero-v3.webp",
    culinary: "/images/applications/matcha-wagashi-hero-v3.webp",
  };
  for (const reference of productCodeReferences) {
    const before = structuredClone(
      getProductApplicationImage(reference.catalogHandle),
    );
    const selected = getProductApplicationImage(
      reference.catalogHandle,
      "canonical",
    );
    assert.equal(selected?.src, expected[reference.productKey]);
    assert.notEqual(selected?.src, before.src);
    assert.equal(selected?.productKey, before.productKey);
    assert.equal(selected?.usage, before.usage);
    assert.equal(selected?.sourceKind, "ai-generated-reference");
    assert.equal(selected?.approvalStatus, "product-photography-pending");
    for (const alias of reference.studyAliases) {
      assert.deepEqual(
        getProductApplicationImage(alias, "canonical"),
        selected,
      );
      assert.deepEqual(getProductApplicationImage(alias), before);
    }
    assert.deepEqual(
      getProductApplicationImage(reference.catalogHandle),
      before,
    );
  }
});

test("canonical application descriptions are localized and the new confection is described as wagashi", () => {
  for (const reference of productCodeReferences) {
    const image = getProductApplicationImage(
      reference.catalogHandle,
      "canonical",
    );
    assert.ok(image?.alt);
    for (const locale of ["zh-Hans", "zh-Hant", "ja"]) {
      const localized = translate(locale, image.alt);
      assert.ok(localized.trim());
      assert.notEqual(
        localized,
        image.alt,
        `${reference.productKey}: ${locale}`,
      );
    }
    assert.doesNotMatch(image.alt, /AI-generated|reference|pending/i);
  }
  const confection = getProductApplicationImage("culinary-matcha", "canonical");
  assert.match(confection.alt, /wagashi.*dark ceramic saucer/i);
  assert.doesNotMatch(confection.alt, /cake|ivory/i);
  assert.match(getProductApplicationImage("culinary-matcha").alt, /cake/i);
});
