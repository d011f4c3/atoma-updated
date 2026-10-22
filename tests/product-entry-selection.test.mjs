import assert from "node:assert/strict";
import test from "node:test";
import { productEntrySelection } from "../src/lib/product-entry-selection.ts";
import { canPurchaseQuantity } from "../src/lib/product-selection.ts";

const small = {
  id: "small-key",
  selectionId: "small-pack",
  title: "100 g",
  options: [{ name: "Format", value: "100 g" }],
  priceMinor: 1200,
  currency: "JPY",
  available: true,
  minimum: 1,
  increment: 1,
  maximum: 10,
};
const kilogram = {
  ...small,
  id: "kilogram-key",
  selectionId: "kilogram-pack",
  title: "1 kg",
  options: [{ name: "Format", value: "1 kg" }],
  minimum: 2,
  increment: 2,
};
const tea = {
  id: "tea-one",
  handle: "tea-one",
  title: "Tea one",
  description: "",
  imageUrl: null,
  imageAlt: "",
  productCode: null,
  productUrl: null,
  isFixture: true,
  variants: [small, kilogram],
};
const saved = {
  productId: tea.id,
  variantId: small.id,
  variantSelectionId: small.selectionId,
  quantity: 3,
};
function enter(overrides = {}) {
  return productEntrySelection({
    products: [tea],
    current: null,
    saved,
    initialProductHandle: tea.handle,
    ...overrides,
  });
}

test("ordinary same-product entry restores the chosen format and quantity", () => {
  assert.deepEqual(enter(), saved);
  const other = { ...tea, id: "other", handle: "other" };
  assert.deepEqual(
    enter({ products: [tea, other], initialProductHandle: other.handle }),
    {
      productId: other.id,
      variantId: small.id,
      variantSelectionId: small.selectionId,
      quantity: small.minimum,
    },
  );
});

test("an explicit 1 kg entry overrides the saved smaller pack and quantity", () => {
  assert.deepEqual(enter({ initialFormat: "1kg" }), {
    productId: tea.id,
    variantId: kilogram.id,
    variantSelectionId: kilogram.selectionId,
    quantity: kilogram.minimum,
  });
});

test("missing or ambiguous 1 kg remains unselected instead of using another pack", () => {
  for (const variants of [
    [small],
    [small, kilogram, { ...kilogram, id: "second-kilogram" }],
    [small, kilogram, { ...kilogram }],
  ]) {
    const selection = enter({
      products: [{ ...tea, variants }],
      initialFormat: "1kg",
    });
    assert.deepEqual(selection, {
      productId: tea.id,
      variantId: "",
      quantity: 1,
    });
    assert.deepEqual(
      enter({ current: selection, initialFormat: "1kg" }),
      selection,
      "a later refresh does not silently replace unresolved entry intent",
    );
  }
});

test("an unavailable exact pack remains selected and cannot be purchased", () => {
  const unavailable = { ...kilogram, available: false };
  const selection = enter({
    products: [{ ...tea, variants: [small, unavailable] }],
    initialFormat: "1kg",
  });
  assert.equal(selection.variantId, unavailable.id);
  assert.equal(canPurchaseQuantity(unavailable, selection.quantity), false);
});

test("destination refresh retains a local replacement instead of reapplying the URL", () => {
  const refreshedSmall = { ...small, id: "new-small-key", currency: "SGD" };
  assert.deepEqual(
    enter({
      products: [{ ...tea, variants: [refreshedSmall, kilogram] }],
      current: saved,
      initialFormat: "1kg",
    }),
    { ...saved, variantId: refreshedSmall.id },
  );
});

test("ordinary entry preserves unavailable or missing saved intent for explicit replacement", () => {
  for (const variants of [
    [kilogram],
    [{ ...small, available: false }, kilogram],
  ]) {
    assert.deepEqual(enter({ products: [{ ...tea, variants }] }), saved);
  }
  assert.deepEqual(enter({ products: [], current: null, saved: null }), {
    productId: "",
    variantId: "",
    quantity: 1,
  });
});
