import assert from "node:assert/strict";
import test from "node:test";
import {
  canPurchaseQuantity,
  initialSelection,
  money,
  quantityCeiling,
  restoredSelection,
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

test("returning to a matcha restores its format and quantity from current catalog data", () => {
  const first = variant({ id: "first-format" });
  const chosen = variant({ id: "chosen-format" });
  const item = product([first, chosen]);
  const saved = { productId: item.id, variantId: chosen.id, quantity: 6 };
  assert.deepEqual(restoredSelection(item, saved), saved);
  assert.deepEqual(restoredSelection(item, null), initialSelection(item));
  assert.deepEqual(
    restoredSelection({ ...item, id: "explicit-other-matcha" }, saved),
    initialSelection({ ...item, id: "explicit-other-matcha" }),
  );
});

test("restoring a selection rechecks missing formats, availability and quantity limits", () => {
  const first = variant({ id: "first-format" });
  const chosen = variant({ id: "chosen-format" });
  const saved = { productId: "matcha-one", variantId: chosen.id, quantity: 8 };
  for (const formats of [[first], [first, { ...chosen, available: false }]]) {
    const item = product(formats);
    assert.deepEqual(restoredSelection(item, saved), initialSelection(item));
  }
  const limited = product([first, { ...chosen, maximum: 4 }]);
  assert.deepEqual(restoredSelection(limited, saved), {
    ...saved,
    quantity: 2,
  });
  assert.equal(
    restoredSelection(product([chosen]), { ...saved, quantity: 3 }).quantity,
    chosen.minimum,
  );
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
  assert.equal(money(1200, "USD").replace(/\s/g, " "), "USD 12.00");
  assert.equal(money(0, "JPY"), "¥0");
});

test("a destination refresh replaces purchase keys and preserves one-time choice and quantity", async () => {
  const { refreshedSelection } =
    await import("../src/lib/product-selection.ts");
  const next = variant({
    id: "sg-key",
    selectionId: "same-format",
    currency: "SGD",
  });
  const saved = {
    productId: "matcha-one",
    variantId: "us-key",
    variantSelectionId: "same-format",
    quantity: 6,
  };
  assert.deepEqual(
    refreshedSelection(product([variant({ id: "other-format" }), next]), saved),
    { ...saved, variantId: "sg-key" },
  );
});

test("a destination refresh preserves recurring intent when a plan is absent", async () => {
  const { refreshedSelection, resolvePurchaseVariant } =
    await import("../src/lib/product-selection.ts");
  const next = variant({ id: "sg-key", selectionId: "same-format" });
  const saved = {
    productId: "matcha-one",
    variantId: "us-key",
    variantSelectionId: "same-format",
    quantity: 6,
    sellingPlanKey: "us-plan",
    sellingPlanSelectionId: "same-plan",
  };
  const refreshed = refreshedSelection(product([next]), saved);
  assert.equal(refreshed.quantity, 6);
  assert.equal(refreshed.sellingPlanKey, "us-plan");
  assert.equal(
    resolvePurchaseVariant(next, refreshed.sellingPlanKey),
    undefined,
  );
  const plan = {
    id: "sg-plan",
    selectionId: "same-plan",
    available: true,
    priceMinor: 1600,
    currency: "SGD",
  };
  assert.equal(
    refreshedSelection(product([{ ...next, sellingPlans: [plan] }]), saved)
      .sellingPlanKey,
    "sg-plan",
  );
});

test("a destination refresh never substitutes a missing format or silently lowers quantity", async () => {
  const { refreshedSelection } =
    await import("../src/lib/product-selection.ts");
  const saved = {
    productId: "matcha-one",
    variantId: "us-key",
    variantSelectionId: "same-format",
    quantity: 8,
  };
  assert.deepEqual(refreshedSelection(product([variant()]), saved), saved);
  const next = variant({
    id: "sg-key",
    selectionId: "same-format",
    maximum: 4,
  });
  const refreshed = refreshedSelection(product([next]), saved);
  assert.equal(refreshed.quantity, 8);
  assert.equal(canPurchaseQuantity(next, refreshed.quantity), false);
});
