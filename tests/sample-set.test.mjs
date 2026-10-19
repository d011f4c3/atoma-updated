import assert from "node:assert/strict";
import test from "node:test";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_TOTAL_GRAMS,
  SAMPLE_SET_OFFER,
  resolveSampleSetOffer,
} from "../src/lib/sample-set.ts";
import { productCodeReferences } from "../src/lib/product-codes.ts";
import { canPurchaseQuantity } from "../src/lib/product-selection.ts";

const options = [{ name: "Format", value: "3 × 20 g" }];
const reference = {
  productHandle: "reviewed-sample-offer-fixture",
  variants: [{ options }],
};

function variant(overrides = {}) {
  return {
    id: "fixture-signed-variant-key",
    title: "Sample Set",
    available: true,
    priceMinor: 6123,
    currency: "JPY",
    options,
    minimum: 1,
    increment: 1,
    maximum: 5,
    ...overrides,
  };
}

function product(overrides = {}) {
  return {
    id: "sample-offer-fixture",
    handle: reference.productHandle,
    title: "Sample Set",
    description: "Test fixture only",
    imageUrl: null,
    imageAlt: "",
    productCode: null,
    productUrl: null,
    isFixture: true,
    variants: [variant()],
    ...overrides,
  };
}

function catalog(products = [product()], status = "ready") {
  return { status, products, shopUrl: "https://example.invalid" };
}

test("intended contents retain the three canonical identities and 60 g net weight", () => {
  assert.deepEqual(
    SAMPLE_SET_CONTENTS.map(({ key, grams }) => [key, grams]),
    [
      ["ceremonial", 20],
      ["barista", 20],
      ["culinary", 20],
    ],
  );
  assert.equal(SAMPLE_SET_TOTAL_GRAMS, 60);
  assert.equal(
    SAMPLE_SET_CONTENTS.reduce((total, item) => total + item.grams, 0),
    SAMPLE_SET_TOTAL_GRAMS,
  );
  for (const item of SAMPLE_SET_CONTENTS) {
    const known = productCodeReferences.find(
      (entry) => entry.productKey === item.key,
    );
    assert.equal(item.productHandle, known.catalogHandle);
    assert.equal(item.productCode, known.code);
    assert.match(item.image, /^\/images\/matcha\//);
    assert.ok(item.imageAlt);
  }
});

test("the reviewed set cannot resolve without its exact published catalog offer", () => {
  assert.equal(resolveSampleSetOffer(catalog()), null);
  assert.equal(resolveSampleSetOffer(catalog([])), null);
  assert.equal(resolveSampleSetOffer(catalog(), null), null);
  const actual = product({
    handle: SAMPLE_SET_OFFER.productHandle,
    variants: [variant({ options: SAMPLE_SET_OFFER.variants[0].options })],
  });
  assert.equal(resolveSampleSetOffer(catalog([actual])).product, actual);
  assert.equal(
    resolveSampleSetOffer(catalog([{ ...actual, variants: [variant()] }])),
    null,
  );
});

test("the current offer rejects the obsolete 3 × 30 g set even on the canonical handle", () => {
  const obsolete = variant({
    options: [{ name: "Set", value: "3 × 30 g" }],
  });
  const current = variant({
    id: "current-20g-set-key",
    options: [{ name: "Set", value: "3 × 20 g" }],
  });
  const offer = product({
    handle: SAMPLE_SET_OFFER.productHandle,
    variants: [obsolete],
  });

  assert.equal(resolveSampleSetOffer(catalog([offer])), null);
  assert.deepEqual(
    resolveSampleSetOffer(
      catalog([{ ...offer, variants: [obsolete, current] }]),
    ).variants,
    [current],
  );
});

test("missing catalog, missing offer and unavailable catalog fail closed", () => {
  for (const value of [
    null,
    undefined,
    catalog([], "empty"),
    catalog([], "unavailable"),
    catalog([]),
    catalog([product()], "unavailable"),
  ]) {
    assert.equal(resolveSampleSetOffer(value, reference), null);
  }
});

test("titles, ordering and lookalike handles cannot identify the approved offer", () => {
  for (const handle of [
    `${reference.productHandle}-other`,
    reference.productHandle.toUpperCase(),
    `${reference.productHandle} `,
    ...SAMPLE_SET_CONTENTS.map((item) => item.productHandle),
  ]) {
    assert.equal(
      resolveSampleSetOffer(catalog([product({ handle })]), reference),
      null,
    );
  }
  const actual = product({ title: "抹茶のお試しセット" });
  const resolved = resolveSampleSetOffer(
    catalog([product({ handle: "unrelated" }), actual]),
    reference,
  );
  assert.equal(resolved.product, actual);
});

test("only the complete exact reviewed options identify a format", () => {
  for (const changedOptions of [
    [],
    [{ name: "Format", value: "1 kg" }],
    [{ name: "format", value: "3 × 20 g" }],
    [...options, { name: "Size", value: "1 kg" }],
    [...options, ...options],
  ]) {
    assert.equal(
      resolveSampleSetOffer(
        catalog([
          product({ variants: [variant({ options: changedOptions })] }),
        ]),
        reference,
      ),
      null,
    );
  }
});

test("multiple option pairs match independently of source order", () => {
  const packaging = { name: "Packaging", value: "Set" };
  const actual = variant({ options: [packaging, ...options] });
  const resolved = resolveSampleSetOffer(
    catalog([product({ variants: [actual] })]),
    {
      ...reference,
      variants: [{ options: [...options, packaging] }],
    },
  );
  assert.equal(resolved.variants[0], actual);
});

test("ambiguous products, variants and repeated references cannot authorize an offer", () => {
  assert.equal(
    resolveSampleSetOffer(catalog([product(), product()]), reference),
    null,
  );
  for (const variants of [
    [variant(), variant({ id: "another-key" })],
    [variant(), variant({ options: [{ name: "Format", value: "1 kg" }] })],
  ]) {
    assert.equal(
      resolveSampleSetOffer(catalog([product({ variants })]), reference),
      null,
    );
  }
  for (const variants of [
    [],
    [{ options: [] }],
    [...reference.variants, ...reference.variants],
  ]) {
    assert.equal(
      resolveSampleSetOffer(catalog(), { ...reference, variants }),
      null,
    );
  }
});

test("returned offers preserve current price, action key and quantity rules", () => {
  const actual = variant({
    priceMinor: 7032,
    minimum: 2,
    increment: 2,
    maximum: 6,
  });
  const resolved = resolveSampleSetOffer(
    catalog([product({ variants: [actual] })]),
    reference,
  );
  assert.equal(resolved.variants[0], actual);
  assert.equal(resolved.variants[0].priceMinor, 7032);
  assert.equal(resolved.variants[0].id, "fixture-signed-variant-key");
  assert.equal(canPurchaseQuantity(resolved.variants[0], 2), true);
  assert.equal(canPurchaseQuantity(resolved.variants[0], 4), true);
  assert.equal(canPurchaseQuantity(resolved.variants[0], 1), false);
  assert.equal(canPurchaseQuantity(resolved.variants[0], 3), false);
  assert.equal(canPurchaseQuantity(resolved.variants[0], 8), false);
});

test("a sold-out reviewed format stays resolved but cannot be purchased", () => {
  const actual = variant({ available: false });
  const resolved = resolveSampleSetOffer(
    catalog([product({ variants: [actual] })]),
    reference,
  );
  assert.equal(resolved.variants[0], actual);
  assert.equal(canPurchaseQuantity(resolved.variants[0], 1), false);
});

test("unreviewed formats are excluded, and a missing reviewed format fails closed", () => {
  const secondOptions = [{ name: "Format", value: "3 × 20 g gift set" }];
  const actual = product({
    variants: [
      variant(),
      variant({ id: "second-reviewed-key", options: secondOptions }),
      variant({
        id: "unreviewed-key",
        options: [{ name: "Format", value: "1 kg" }],
      }),
    ],
  });
  const reviewed = {
    ...reference,
    variants: [...reference.variants, { options: secondOptions }],
  };
  const resolved = resolveSampleSetOffer(catalog([actual]), reviewed);
  assert.deepEqual(resolved.variants, actual.variants.slice(0, 2));
  assert.equal(resolveSampleSetOffer(catalog(), reviewed), null);
});
