import assert from "node:assert/strict";
import test from "node:test";
import { getProductDisplayIndex } from "../src/lib/product-display-index.ts";

const knownHandles = [
  ["jmm-storefront-test-matcha", "[WZKA-00]"],
  ["culinary-matcha", "[WZKA-00]"],
  ["test-only-japanese-barista-matcha-powder-for-lattes-1-kg", "[WZKA-01]"],
  ["barista-matcha", "[WZKA-01]"],
  [
    "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
    "[WZKA-02]",
  ],
  ["premium-matcha", "[WZKA-02]"],
  ["ceremonial-matcha", "[WZKA-02]"],
];

test("proposed product codes remain attached to handles when catalog order changes", () => {
  for (const order of [knownHandles, [...knownHandles].reverse()])
    for (const [handle, code] of order)
      assert.equal(getProductDisplayIndex(handle), code);
});

test("unknown and lookalike handles receive no invented code", () => {
  for (const handle of [
    "",
    "new-matcha",
    "ceremonial-matcha-2026",
    "CULINARY-MATCHA",
    "constructor",
    "__proto__",
    "toString",
  ])
    assert.equal(getProductDisplayIndex(handle), undefined);
});
