import assert from "node:assert/strict";
import test from "node:test";
import { getProductDisplayIndex } from "../src/lib/product-display-index.ts";
import { getProductCode } from "../src/lib/product-codes.ts";

const knownHandles = [
  ["jmm-storefront-test-matcha", "[UJI-01]"],
  ["culinary-matcha", "[UJI-01]"],
  ["test-only-japanese-barista-matcha-powder-for-lattes-1-kg", "[UJI-00]"],
  ["barista-matcha", "[UJI-00]"],
  [
    "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
    "[WZKA-00]",
  ],
  ["premium-matcha", "[WZKA-00]"],
  ["ceremonial-matcha", "[WZKA-00]"],
];

test("approved codes and their bracketed labels stay attached to exact handles and study aliases", () => {
  for (const order of [knownHandles, [...knownHandles].reverse()])
    for (const [handle, code] of order) {
      assert.equal(getProductDisplayIndex(handle), code);
      assert.equal(getProductCode(handle), code.slice(1, -1));
    }
});

test("unknown and lookalike handles receive no invented code", () => {
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
    assert.equal(getProductDisplayIndex(handle), undefined);
    assert.equal(getProductCode(handle), undefined);
  }
});
