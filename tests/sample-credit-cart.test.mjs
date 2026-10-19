import assert from "node:assert/strict";
import test from "node:test";
import { createCartApplication } from "../src/lib/cart-application.ts";
import { parseCartRequest } from "../src/lib/cart-input.ts";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";

const tea = SAMPLE_SET_CONTENTS[0].productHandle;
const credit = "TEST-SAMPLE-CREDIT";
const money = (minorUnits) => ({ minorUnits, currency: "JPY" });
const quantityRule = { minimum: 1, maximum: null, increment: 1 };
const options = [{ name: "Size", value: "1 kg" }];
function snapshot() {
  return {
    reference: "private-cart-bearer",
    buyerCountryCode: "US",
    totalQuantity: 1,
    cost: { subtotalAmount: money(10000), totalAmount: money(10000) },
    discountCodes: [],
    discountAllocations: [],
    lines: [
      {
        reference: "private-line",
        quantity: 1,
        sellingPlan: null,
        cost: { amountPerQuantity: money(10000), totalAmount: money(10000) },
        merchandise: {
          reference: "private-variant",
          productHandle: tea,
          productTitle: "Tea",
          title: "1 kg",
          options,
          purchaseStatus: "purchasable",
          quantityRule,
          image: null,
        },
        instructions: { canRemove: true, canUpdateQuantity: true },
      },
    ],
  };
}
function setup(before = snapshot()) {
  const writes = [];
  const catalogReads = [];
  const app = createCartApplication({
    destination: { countryCode: "US", currency: "JPY" },
    cartSource: {
      readCart: async () => before,
      // Even if an adapter retains this capability, the public application has
      // no command that can call it or infer customer eligibility from a cart.
      updateDiscountCodes: async (...args) => {
        writes.push(args);
        throw new Error("A public action must not apply sample credit");
      },
    },
    catalogSource: {
      readPublishedProductByHandle: async (handle) => {
        catalogReads.push(handle);
        return null;
      },
    },
    createLineActionKey: () => `v1_${"a".repeat(43)}`,
    matchesLineActionKey: () => false,
    matchesVariantActionKey: () => false,
    classifyError: () => "ambiguous",
  });
  return { app, writes, catalogReads };
}

test("the public cart boundary rejects the retired sample-credit action, including its old exact request", () => {
  for (const value of [
    { action: "apply-sample-credit" },
    { action: "apply-sample-credit", code: credit },
    { action: "apply-sample-credit", amount: 4500 },
    { action: "apply-sample-credit", cartId: "private" },
    { action: "apply-sample-credit", email: "synthetic@example.com" },
    { action: "apply-sample-credit", customerEligible: true },
    { action: "apply-sample-credit", quantity: 1 },
    { action: "apply-discount", code: credit },
    { action: "update-discount-codes", codes: [credit] },
  ]) {
    assert.equal(parseCartRequest(value), null);
  }
});

test("the cart application exposes no sample-credit mutation even if its adapter supports discount writes", () => {
  const { app, writes } = setup();
  assert.equal(Object.hasOwn(app, "applySampleCredit"), false);
  assert.equal(Object.hasOwn(app, "updateDiscountCodes"), false);
  assert.equal(writes.length, 0);
});

test("reading an existing discount retains authoritative totals without leaking codes or claiming sample eligibility", async () => {
  for (const applicable of [false, true]) {
    const before = snapshot();
    before.discountCodes = [
      { code: credit, applicable },
      { code: "PRIVATE-OTHER-PROMOTION", applicable: true },
    ];
    before.discountAllocations = [
      { code: credit, discountedAmount: money(applicable ? 4500 : 0) },
    ];
    // Read the provider's current total; do not recalculate it using the offer.
    before.cost.totalAmount = money(applicable ? 5375 : 9875);
    const original = structuredClone(before);
    const { app, writes, catalogReads } = setup(before);
    const result = await app.loadCart(before.reference);
    assert.equal(result.kind, "ready");
    assert.match(result.cart.totalLabel, applicable ? /5,375/ : /9,875/);
    assert.match(result.cart.subtotalLabel, /10,000/);
    assert.equal(result.cart.lines.length, 1);
    assert.equal(result.cart.lines[0].quantity, 1);
    assert.equal(Object.hasOwn(result.cart, "sampleCredit"), false);
    assert.doesNotMatch(
      JSON.stringify(result),
      /private-|TEST-SAMPLE-CREDIT|PRIVATE-OTHER-PROMOTION|discountCodes|discountAllocations|canApply|applicable/,
    );
    assert.deepEqual(
      before,
      original,
      "Reading does not remove existing discounts",
    );
    assert.equal(writes.length, 0);
    assert.equal(catalogReads.length, 0);
  }
});

test("cart reads remain compatible without optional discount data", async () => {
  const before = snapshot();
  delete before.discountCodes;
  delete before.discountAllocations;
  const { app, writes } = setup(before);
  const result = await app.loadCart(before.reference);
  assert.equal(result.kind, "ready");
  assert.equal(result.cart.totalLabel, result.cart.subtotalLabel);
  assert.equal(Object.hasOwn(result.cart, "sampleCredit"), false);
  assert.equal(writes.length, 0);
});
