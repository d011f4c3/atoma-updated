import assert from "node:assert/strict";
import test from "node:test";
import {
  matchesShopCategory,
  SHOP_CATEGORIES,
} from "../src/lib/shop-category-filter.ts";
import { matchaCatalogProducts } from "../src/lib/sample-catalog.ts";

const knownHandles = [
  [
    "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
    "ceremonial",
  ],
  ["ceremonial-matcha", "ceremonial"],
  ["premium-matcha", "ceremonial"],
  ["test-only-japanese-barista-matcha-powder-for-lattes-1-kg", "barista"],
  ["barista-matcha", "barista"],
  ["jmm-storefront-test-matcha", "culinary"],
  ["culinary-matcha", "culinary"],
];

test("categories preserve exact product identity, including reviewed study aliases", () => {
  assert.deepEqual(
    SHOP_CATEGORIES.map(({ value }) => value),
    ["all", "ceremonial", "barista", "culinary"],
  );
  for (const [handle, expected] of knownHandles) {
    for (const { value } of SHOP_CATEGORIES) {
      assert.equal(
        matchesShopCategory(handle, value),
        value === "all" || value === expected,
        `${handle} / ${value}`,
      );
    }
  }
});

test("unknown and lookalike handles remain visible only in All matcha", () => {
  for (const handle of [
    "",
    "new-matcha",
    "ceremonial-matcha-2026",
    "barista-matcha ",
    "CULINARY-MATCHA",
    "constructor",
    "__proto__",
    "toString",
  ]) {
    for (const { value } of SHOP_CATEGORIES) {
      assert.equal(matchesShopCategory(handle, value), value === "all");
    }
  }
});

test("filtering preserves catalog order, objects and unavailable products", () => {
  const products = Object.freeze([
    Object.freeze({
      id: "second-barista",
      handle: "barista-matcha",
      title: "A renamed product",
      variants: [{ available: false }],
    }),
    Object.freeze({
      id: "unknown",
      handle: "unmapped-matcha",
      title: "Ceremonial Matcha for tea service",
      productCode: "WZKA-00",
      variants: [{ available: true }],
    }),
    Object.freeze({
      id: "first-barista",
      handle: "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
      title: "Culinary Matcha",
      variants: [{ available: true }, { available: true }],
    }),
  ]);
  const selected = products.filter((product) =>
    matchesShopCategory(product.handle, "barista"),
  );
  assert.deepEqual(
    selected.map(({ id }) => id),
    ["second-barista", "first-barista"],
  );
  assert.equal(selected[0], products[0]);
  assert.equal(selected[1], products[2]);
  assert.deepEqual(
    products.filter((product) =>
      matchesShopCategory(product.handle, "ceremonial"),
    ),
    [],
  );
  assert.deepEqual(
    products.filter((product) => matchesShopCategory(product.handle, "all")),
    products,
  );
  assert.equal(products.length, 3);
});

test("match counts apply after sample-set separation and count products, not formats", () => {
  const reference = {
    productHandle: "reviewed-sample-set-fixture",
    variants: [{ options: [{ name: "Format", value: "3 × 20 g" }] }],
  };
  const published = Object.freeze([
    { handle: "culinary-matcha", variants: [] },
    { handle: reference.productHandle, variants: [{ available: true }] },
    { handle: "new-matcha", variants: [] },
    {
      handle: "barista-matcha",
      variants: [{ available: true }, { available: false }],
    },
  ]);
  const products = matchaCatalogProducts(published, reference);
  const counts = Object.fromEntries(
    SHOP_CATEGORIES.map(({ value }) => [
      value,
      products.filter((product) => matchesShopCategory(product.handle, value))
        .length,
    ]),
  );
  assert.deepEqual(counts, {
    all: 3,
    ceremonial: 0,
    barista: 1,
    culinary: 1,
  });
  assert.equal(published.length, 4);
});
