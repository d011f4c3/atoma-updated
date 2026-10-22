import assert from "node:assert/strict";
import test from "node:test";
import {
  getProductComparison,
  getProductOfferSummary,
  hasDisplayPrice,
  productFormatLabel,
} from "../src/lib/product-comparison.ts";
import { productCodeReferences } from "../src/lib/product-codes.ts";
import { getProductContent } from "../src/lib/product-content.ts";
import { translate } from "../src/lib/i18n/index.ts";

function variant(overrides = {}) {
  return {
    id: "one-kilogram",
    title: "1 kg",
    options: [{ name: "Size", value: "1 kg" }],
    priceMinor: 1200,
    currency: "JPY",
    available: true,
    minimum: 1,
    increment: 1,
    maximum: null,
    ...overrides,
  };
}

function product(reference, overrides = {}) {
  return {
    id: reference.catalogHandle,
    handle: reference.catalogHandle,
    title: "An unrelated upstream title",
    description: "",
    productCode: reference.code,
    productUrl: null,
    imageUrl: null,
    imageAlt: "",
    isFixture: true,
    variants: [variant()],
    ...overrides,
  };
}

test("comparison keeps canonical identities, order and authored profile status", () => {
  const products = productCodeReferences.map((reference) => product(reference));
  const snapshot = structuredClone(products);
  const entries = getProductComparison([...products].reverse());
  assert.deepEqual(
    entries.map((entry) => [entry.key, entry.code]),
    [
      ["ceremonial", "WZKA-00"],
      ["barista", "UJI-00"],
      ["culinary", "UJI-01"],
    ],
  );
  entries.forEach((entry, index) => {
    const content = getProductContent(products[index]);
    assert.equal(entry.name, content.name);
    assert.equal(entry.application, content.application);
    assert.equal(entry.profileKind, "sample");
    assert.equal(entry.status, "ready");
    assert.equal(
      entry.href,
      `/shop/${encodeURIComponent(products[index].handle)}`,
    );
  });
  assert.deepEqual(products, snapshot);
});

test("missing, duplicate and study-alias records do not create a canonical offer", () => {
  const [ceremonial, barista, culinary] = productCodeReferences;
  const entries = getProductComparison([
    product(ceremonial),
    product(ceremonial, { id: "duplicate" }),
    product(barista, { handle: barista.studyAliases[0] }),
    product(culinary, { handle: "unknown", title: "Culinary Matcha" }),
  ]);
  assert.deepEqual(
    entries.map((entry) => entry.status),
    ["ambiguous", "missing", "missing"],
  );
  assert.ok(entries.every((entry) => entry.href === null));
  assert.ok(entries.every((entry) => entry.offer === null));
  assert.equal(entries.length, 3);
});

test("an alias cannot displace an exact canonical catalog record", () => {
  const reference = productCodeReferences[0];
  const result = getProductComparison([
    product(reference, {
      handle: reference.studyAliases[0],
      variants: [variant({ priceMinor: 1 })],
    }),
    product(reference),
  ])[0];
  assert.equal(result.status, "ready");
  assert.equal(result.offer.fromVariant.priceMinor, 1200);
});

test("starting price excludes unavailable formats and preserves literal format options", () => {
  const item = product(productCodeReferences[0], {
    variants: [
      variant({
        id: "small",
        title: "250 g",
        priceMinor: 100,
        available: false,
      }),
      variant({ id: "large", title: "2 kg", priceMinor: 2100 }),
      variant({
        id: "reviewed",
        title: "1 kg",
        priceMinor: 1200,
        options: [
          { name: "Size", value: "1 kg" },
          { name: "Pack", value: "Pouch" },
        ],
      }),
    ],
  });
  const summary = getProductOfferSummary(item);
  assert.equal(summary.available, true);
  assert.equal(summary.fromVariant.id, "reviewed");
  assert.equal(summary.formats.length, 3);
  assert.equal(summary.formats[0].available, false);
  assert.equal(
    productFormatLabel(summary.formats[2], "en"),
    "1 kg · Pack: Pouch",
  );
});

test("missing and default formats never infer pack size from the product title", () => {
  const item = product(productCodeReferences[0], {
    title: "Matcha — 1 kg",
    variants: [
      variant({
        title: "Default Title",
        options: [{ name: "Title", value: "Default Title" }],
        available: false,
      }),
    ],
  });
  const summary = getProductOfferSummary(item);
  assert.equal(summary.fromVariant, null);
  assert.equal(summary.available, false);
  assert.equal(productFormatLabel(summary.formats[0], "en"), "Standard format");
  const empty = getProductOfferSummary({ ...item, variants: [] });
  assert.deepEqual(empty.formats, []);
  assert.equal(empty.fromVariant, null);
  assert.equal(empty.available, false);
});

test("incomparable or unsafe prices never become a starting price", () => {
  for (const second of [
    variant({ id: "other-currency", currency: "SGD" }),
    variant({ id: "negative", priceMinor: -1 }),
    variant({ id: "negative-zero", priceMinor: -0 }),
    variant({ id: "fractional", priceMinor: 1.5 }),
    variant({ id: "unsafe", priceMinor: Number.MAX_SAFE_INTEGER + 1 }),
    variant({ id: "unsupported", currency: "EUR" }),
  ]) {
    const summary = getProductOfferSummary(
      product(productCodeReferences[0], {
        variants: [variant(), second],
      }),
    );
    assert.equal(summary.fromVariant, null);
  }
  assert.equal(hasDisplayPrice(variant({ priceMinor: 0 })), true);
  assert.equal(hasDisplayPrice(variant({ priceMinor: -0 })), false);
});

test("comparison extracts the intended profile values in each locale", () => {
  const products = productCodeReferences.map((reference) => product(reference));
  for (const locale of ["en", "zh-Hans", "zh-Hant", "ja"]) {
    const entries = getProductComparison(products, locale);
    entries.forEach((entry, index) => {
      const english = getProductContent(products[index]);
      for (const [key, label] of [
        ["flavour", "Flavour"],
        ["colour", "Colour"],
      ]) {
        const source = english.materialProfile.find(
          (property) => property.label === label,
        ).value;
        assert.equal(entry[key], translate(locale, source));
      }
      assert.equal(entry.name, getProductContent(products[index], locale).name);
      assert.equal(entry.code, productCodeReferences[index].code);
    });
  }
});
