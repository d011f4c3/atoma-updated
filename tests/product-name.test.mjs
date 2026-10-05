import assert from "node:assert/strict";
import test from "node:test";
import { productName } from "../src/lib/product-name.ts";

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
