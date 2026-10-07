import assert from "node:assert/strict";
import test from "node:test";
import { productName } from "../src/lib/product-name.ts";
import { getProductKey } from "../src/lib/product-codes.ts";

test("the Shopify Premium title retains the owner's Ceremonial display name", () => {
  assert.equal(
    productName(
      "[TEST ONLY] Japanese Premium Matcha Powder for Tea Service — 1 kg",
    ),
    "Ceremonial Matcha",
  );
  assert.equal(productName("Premium Matcha"), "Ceremonial Matcha");
  assert.equal(productName("Ceremonial Matcha"), "Ceremonial Matcha");
});

test("the display alias leaves the rest of the published range unchanged", () => {
  assert.equal(
    productName("Japanese Culinary Matcha Powder for Cafés & Baking — 1 kg"),
    "Culinary Matcha",
  );
  assert.equal(
    productName("Japanese Barista Matcha Powder for Lattes — 1 kg"),
    "Barista Matcha",
  );
});

test("Premium is not rewritten within unrelated product names", () => {
  assert.equal(productName("Premium Green Tea"), "Premium Green Tea");
  assert.equal(productName("Super Premium Matcha"), "Super Premium Matcha");
});

test("known names and keys survive translated, blank and contradictory catalog titles", () => {
  const products = [
    [
      "ceremonial",
      "Ceremonial Matcha",
      [
        "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
        "premium-matcha",
        "ceremonial-matcha",
      ],
    ],
    [
      "barista",
      "Barista Matcha",
      [
        "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
        "barista-matcha",
      ],
    ],
    [
      "culinary",
      "Culinary Matcha",
      ["jmm-storefront-test-matcha", "culinary-matcha"],
    ],
  ];
  for (const order of [products, products.toReversed()]) {
    for (const [key, name, handles] of order) {
      for (const handle of handles) {
        assert.equal(getProductKey(handle), key);
        for (const title of [
          "抹茶・１キログラム",
          "Thé vert en poudre pour pâtisserie — 1 kg",
          "",
          "Another Matcha for Lattes",
        ]) {
          assert.equal(productName(title, handle), name);
        }
      }
    }
  }
});

test("unknown and lookalike handles retain literal title formatting without acquiring an identity", () => {
  for (const handle of [
    undefined,
    "",
    "unmapped-matcha",
    "CULINARY-MATCHA",
    "barista-matcha ",
    "premium-matcha-2026",
    "constructor",
    "__proto__",
    "toString",
  ]) {
    if (handle !== undefined) assert.equal(getProductKey(handle), undefined);
    assert.equal(productName("抹茶", handle), "抹茶");
    assert.equal(productName("Premium Green Tea", handle), "Premium Green Tea");
    assert.equal(
      productName(
        "Japanese Premium Matcha Powder for Tea Service — 1 kg",
        handle,
      ),
      "Ceremonial Matcha",
    );
  }
});
