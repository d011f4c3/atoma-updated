import assert from "node:assert/strict";
import test from "node:test";
import {
  canPurchaseQuantity,
  initialSelection,
  money,
  quantityCeiling,
} from "../src/lib/product-selection.ts";

const variant = (overrides = {}) => ({
  id: "available-format",
  title: "1 kg",
  available: true,
  priceMinor: 1200,
  currency: "JPY",
  options: [],
  minimum: 2,
  increment: 2,
  maximum: 10,
  ...overrides,
});
const product = (variants) => ({
  id: "matcha-one",
  title: "Matcha One",
  description: "Selection test product",
  imageUrl: null,
  imageAlt: "",
  handle: "matcha-one",
  productUrl: null,
  isFixture: true,
  variants,
});

test("initial selection chooses the first available format at its minimum", () => {
  const unavailable = variant({
    id: "unavailable-format",
    available: false,
  });
  const available = variant({ minimum: 5, increment: 5, maximum: 15 });
  assert.deepEqual(initialSelection(product([unavailable, available])), {
    productId: "matcha-one",
    variantId: "available-format",
    quantity: 5,
  });
  const fallback = initialSelection(product([unavailable]));
  assert.equal(fallback.variantId, "unavailable-format");
  assert.equal(fallback.quantity, 2);
  assert.equal(canPurchaseQuantity(unavailable, fallback.quantity), false);
  assert.deepEqual(initialSelection(product([])), {
    productId: "matcha-one",
    variantId: "",
    quantity: 1,
  });
  assert.equal(canPurchaseQuantity(undefined, 1), false);
});

test("purchase quantity enforces minimum, increment and published maximum", () => {
  const format = variant();
  assert.equal(quantityCeiling(format), 10);
  for (const quantity of [2, 4, 10]) {
    assert.equal(canPurchaseQuantity(format, quantity), true);
  }
  for (const quantity of [0, 1, 3, 12, 2.5, NaN, Infinity, -2]) {
    assert.equal(canPurchaseQuantity(format, quantity), false);
  }
});

test("unbounded and free products still respect the GraphQL integer limit", () => {
  const free = variant({
    priceMinor: 0,
    minimum: 1,
    increment: 1,
    maximum: null,
  });
  assert.equal(quantityCeiling(free), 2_147_483_647);
  assert.equal(canPurchaseQuantity(free, 2_147_483_647), true);
  assert.equal(canPurchaseQuantity(free, 2_147_483_648), false);
  const paired = variant({ maximum: null });
  assert.equal(quantityCeiling(paired), 2_147_483_646);
  assert.equal(canPurchaseQuantity(paired, 2_147_483_646), true);
  assert.equal(canPurchaseQuantity(paired, 2_147_483_647), false);
});

test("money safety can lower the quantity ceiling below published limits", () => {
  const expensive = variant({
    priceMinor: Math.floor(Number.MAX_SAFE_INTEGER / 3) + 1,
    maximum: null,
  });
  assert.equal(quantityCeiling(expensive), 2);
  assert.equal(canPurchaseQuantity(expensive, 2), true);
  assert.equal(canPurchaseQuantity(expensive, 4), false);
  const unsafeMinimum = variant({ priceMinor: Number.MAX_SAFE_INTEGER });
  assert.ok(quantityCeiling(unsafeMinimum) < unsafeMinimum.minimum);
  assert.equal(
    canPurchaseQuantity(unsafeMinimum, unsafeMinimum.minimum),
    false,
  );
});

test("an initial minimum beyond the transport ceiling is never purchasable", () => {
  const format = variant({
    minimum: 2_147_483_648,
    increment: 1,
    maximum: null,
  });
  const selection = initialSelection(product([format]));
  assert.equal(selection.quantity, format.minimum);
  assert.equal(canPurchaseQuantity(format, selection.quantity), false);
});

test("money formats minor units using the currency's fraction digits", () => {
  assert.equal(money(1200, "JPY"), "¥1,200");
  assert.equal(money(1200, "USD"), "$12.00");
  assert.equal(money(0, "JPY"), "¥0");
});
