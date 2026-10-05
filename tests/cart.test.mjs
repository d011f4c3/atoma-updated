import assert from "node:assert/strict";
import test from "node:test";
import { createCartApplication } from "../src/lib/cart-application.ts";
import { parseCartRequest } from "../src/lib/cart-input.ts";

const VARIANT_KEY = `v1_${"a".repeat(43)}`;
const LINE_KEY = `v1_${"b".repeat(43)}`;
const money = (minorUnits) => ({ minorUnits, currency: "JPY" });
const rule = { minimum: 1, maximum: 10, increment: 1 };
function product(available = true) {
  return {
    reference: "product-reference",
    handle: "test-matcha",
    title: "[TEST ONLY] Matcha",
    description: "Interactive preview product",
    requiresSellingPlan: false,
    purchaseStatus: available ? "purchasable" : "not_purchasable",
    image: null,
    variants: [
      {
        reference: "variant-reference",
        title: "1 kg",
        options: [],
        price: money(10000),
        quantityRule: rule,
        sellingPlans: [],
        purchaseStatus: available ? "purchasable" : "not_purchasable",
      },
    ],
  };
}
function cart(quantity = 1) {
  return {
    reference: "cart-bearer-secret",
    totalQuantity: quantity,
    cost: {
      subtotalAmount: money(quantity * 10000),
      totalAmount: money(quantity * 10000),
    },
    lines:
      quantity === 0
        ? []
        : [
            {
              reference: "line-reference",
              quantity,
              cost: {
                amountPerQuantity: money(10000),
                totalAmount: money(quantity * 10000),
              },
              merchandise: {
                reference: "variant-reference",
                productHandle: "test-matcha",
                productTitle: "[TEST ONLY] Matcha",
                title: "1 kg",
                options: [],
                purchaseStatus: "purchasable",
                quantityRule: rule,
                image: null,
              },
              instructions: { canRemove: true, canUpdateQuantity: true },
              sellingPlan: null,
            },
          ],
  };
}
function setup({ available = true, ambiguous = false } = {}) {
  let writes = 0;
  let reads = 0;
  const mutate = async () => {
    writes += 1;
    if (ambiguous) throw new Error("unknown outcome");
    return { kind: "success", cart: cart(), warnings: [] };
  };
  const app = createCartApplication({
    cartSource: {
      readCart: async () => cart(),
      createCart: mutate,
      addCartLine: mutate,
      updateCartLine: mutate,
      removeCartLine: mutate,
      readCheckout: async () => null,
    },
    catalogSource: {
      readPublishedProductByHandle: async () => {
        reads += 1;
        return product(available);
      },
    },
    createLineActionKey: () => LINE_KEY,
    matchesLineActionKey: (key) => key === LINE_KEY,
    matchesVariantActionKey: (key) => key === VARIANT_KEY,
    classifyError: () => "ambiguous",
  });
  return { app, writes: () => writes, reads: () => reads };
}
const add = {
  productHandle: "test-matcha",
  variantKey: VARIANT_KEY,
  quantity: 1,
};

test("authorized test products add through a fresh product read", async () => {
  const s = setup();
  const result = await s.app.addLine(null, add);
  assert.equal(result.kind, "success");
  assert.equal(s.reads(), 1);
  assert.equal(s.writes(), 1);
  assert.equal(result.cart.totalQuantity, 1);
  assert.doesNotMatch(
    JSON.stringify(result),
    /cart-bearer-secret|variant-reference|line-reference/,
  );
});

test("fresh unavailable product rejects before a write", async () => {
  const s = setup({ available: false });
  assert.equal((await s.app.addLine(null, add)).kind, "rejected");
  assert.equal(s.writes(), 0);
});

test("quantity rules and unrecognized signed locators reject before a write", async () => {
  const s = setup();
  assert.equal(
    (await s.app.addLine(null, { ...add, quantity: 11 })).kind,
    "rejected",
  );
  assert.equal(
    (await s.app.addLine(null, { ...add, variantKey: LINE_KEY })).kind,
    "rejected",
  );
  assert.equal(s.writes(), 0);
});

test("ambiguous writes are attempted exactly once and never replayed", async () => {
  const s = setup({ ambiguous: true });
  assert.equal((await s.app.addLine(null, add)).kind, "ambiguous");
  assert.equal(s.writes(), 1);
});

test("line actions cannot resolve another cart's line locator", async () => {
  const s = setup();
  assert.equal(
    (await s.app.updateLine("cart", { lineKey: VARIANT_KEY, quantity: 2 }))
      .kind,
    "rejected",
  );
  assert.equal(
    (await s.app.removeLine("cart", { lineKey: VARIANT_KEY })).kind,
    "rejected",
  );
  assert.equal(s.writes(), 0);
});

test("JSON input accepts exact commands and rejects client prices/IDs/invalid quantities", () => {
  assert.deepEqual(parseCartRequest({ action: "add", ...add }), {
    action: "add",
    command: add,
  });
  for (const value of [
    { action: "add", ...add, price: 1 },
    { action: "add", ...add, quantity: "1" },
    { action: "add", ...add, quantity: 1.5 },
    { action: "add", ...add, quantity: 2147483648 },
    { action: "add", ...add, variantKey: "gid://shopify/ProductVariant/1" },
    { action: "checkout", checkoutUrl: "https://attacker.example" },
  ])
    assert.equal(parseCartRequest(value), null);
});
