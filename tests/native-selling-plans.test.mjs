import assert from "node:assert/strict";
import test from "node:test";
import { projectCatalog } from "../src/lib/catalog-model.ts";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";

// Exercise the installed, hash-pinned patch at its shared catalog/cart boundary.
const adapter = import.meta.resolve("@jmm/shopify-storefront/server");
const { mapSellingPlanAllocation, mapSellingPlanConnection } = await import(
  new URL("./selling-plans.js", adapter)
);
const { mapCartRead, mapCartMutation } = await import(
  new URL("./cart-mapper.js", adapter)
);
const JPY = { code: "JPY", minorUnitExponent: 0 };
const money = (amount) => ({ amount: String(amount), currencyCode: "JPY" });
function allocation() {
  return {
    checkoutChargeAmount: money(12000),
    remainingBalanceChargeAmount: money(0),
    priceAdjustments: [],
    sellingPlan: {
      id: "synthetic-plan",
      name: "Every 4 weeks",
      description: null,
      recurringDeliveries: true,
      priceAdjustments: [],
      billingPolicy: {
        __typename: "SellingPlanRecurringBillingPolicy",
        interval: "WEEK",
        intervalCount: 4,
      },
      deliveryPolicy: {
        __typename: "SellingPlanRecurringDeliveryPolicy",
        interval: "WEEK",
        intervalCount: 4,
      },
    },
  };
}
const connection = (nodes) => ({ pageInfo: { hasNextPage: false }, nodes });
function cart(plan = allocation(), quantity = 2) {
  return {
    id: "synthetic-cart",
    totalQuantity: quantity,
    cost: {
      subtotalAmount: money(12000 * quantity),
      totalAmount: money(12000 * quantity),
    },
    lines: connection([
      {
        __typename: "CartLine",
        id: "synthetic-line",
        quantity,
        sellingPlanAllocation: plan,
        cost: {
          amountPerQuantity: money(12000),
          totalAmount: money(12000 * quantity),
        },
        merchandise: {
          __typename: "ProductVariant",
          id: "synthetic-variant",
          title: "1 kg",
          availableForSale: true,
          requiresComponents: false,
          selectedOptions: [{ name: "Size", value: "1 kg" }],
          quantityRule: { minimum: 1, maximum: 10, increment: 1 },
          product: {
            requiresSellingPlan: false,
            handle: SAMPLE_SET_CONTENTS[0].productHandle,
            title: "Synthetic tea",
          },
          image: null,
        },
        instructions: { canRemove: true, canUpdateQuantity: true },
        parentRelationship: null,
      },
    ]),
  };
}

test("native no-adjustment recurring plan maps the actual full checkout charge without inventing an adjustment", () => {
  const input = allocation(),
    before = structuredClone(input);
  const plan = mapSellingPlanAllocation(input, JPY);
  assert.equal(plan.price.minorUnits, 12000);
  assert.equal(plan.deliveryInterval, "week");
  assert.equal(plan.deliveryIntervalCount, 4);
  assert.deepEqual(input, before);
  assert.deepEqual(input.priceAdjustments, []);
  assert.ok(Object.isFrozen(plan));
  assert.ok(Object.isFrozen(plan.price));
  assert.equal(mapSellingPlanConnection(connection([input]), JPY).length, 1);
});

test("native path rejects prepaid, deferred, future-price and incomplete terms", () => {
  const cases = [
    (a) => {
      a.sellingPlan.recurringDeliveries = false;
    },
    (a) => {
      a.sellingPlan.billingPolicy.intervalCount = 8;
    },
    (a) => {
      a.sellingPlan.billingPolicy.interval = "MONTH";
    },
    (a) => {
      a.sellingPlan.deliveryPolicy = null;
    },
    (a) => {
      a.sellingPlan.billingPolicy = null;
    },
    (a) => {
      a.remainingBalanceChargeAmount = money(6000);
    },
    (a) => {
      a.sellingPlan.priceAdjustments = [{ orderCount: 3 }];
    },
    (a) => {
      a.sellingPlan.priceAdjustments = [{ orderCount: null }];
    },
  ];
  for (const change of cases) {
    const input = allocation();
    change(input);
    assert.equal(mapSellingPlanAllocation(input, JPY), null);
    assert.deepEqual(mapSellingPlanConnection(connection([input]), JPY), []);
    assert.throws(() =>
      mapCartRead({ cart: cart(input) }, JPY, "synthetic-cart", true),
    );
  }
});

test("native path keeps strict money, bounded connections and malformed cadence validation", () => {
  for (const change of [
    (a) => {
      a.checkoutChargeAmount.amount = "12000.5";
    },
    (a) => {
      a.checkoutChargeAmount.amount = "-1";
    },
    (a) => {
      a.checkoutChargeAmount.amount = "9007199254740992";
    },
    (a) => {
      a.checkoutChargeAmount.currencyCode = "USD";
    },
    (a) => {
      a.sellingPlan.deliveryPolicy.intervalCount = 0;
    },
    (a) => {
      a.priceAdjustments = null;
    },
  ]) {
    const input = allocation();
    change(input);
    assert.throws(() => mapSellingPlanAllocation(input, JPY));
  }
  assert.throws(() =>
    mapSellingPlanConnection(
      { pageInfo: { hasNextPage: true }, nodes: [allocation()] },
      JPY,
    ),
  );
  assert.throws(() =>
    mapSellingPlanConnection(connection([allocation(), allocation()]), JPY),
  );
});

test("explicit adjusted allocations retain all existing charge and future-price guards", () => {
  const input = allocation();
  input.priceAdjustments = [
    { price: money(12000), perDeliveryPrice: money(12000) },
  ];
  input.sellingPlan.priceAdjustments = [{ orderCount: null }];
  assert.equal(mapSellingPlanAllocation(input, JPY).price.minorUnits, 12000);
  for (const change of [
    (a) => {
      a.checkoutChargeAmount = money(6000);
    },
    (a) => {
      a.priceAdjustments[0].perDeliveryPrice = money(3000);
    },
    (a) => {
      a.priceAdjustments.push(structuredClone(a.priceAdjustments[0]));
    },
    (a) => {
      a.sellingPlan.priceAdjustments[0].orderCount = 2;
    },
  ]) {
    const changed = structuredClone(input);
    change(changed);
    assert.equal(mapSellingPlanAllocation(changed, JPY), null);
  }
});

test("catalog policy admits the native price only when it matches the fresh approved regular 1 kg offer", () => {
  const plan = mapSellingPlanAllocation(allocation(), JPY);
  const product = {
    handle: SAMPLE_SET_CONTENTS[0].productHandle,
    title: "Synthetic tea",
    description: "",
    image: null,
    requiresSellingPlan: false,
    purchaseStatus: "purchasable",
    variants: [
      {
        reference: "synthetic-variant",
        title: "1 kg",
        options: [{ name: "Size", value: "1 kg" }],
        price: { minorUnits: 12000, currency: "JPY" },
        quantityRule: { minimum: 1, maximum: 10, increment: 1 },
        purchaseStatus: "purchasable",
        sellingPlans: [plan],
      },
    ],
  };
  const project = () =>
    projectCatalog({ products: [product] }, (_variant, selected) =>
      selected ? "opaque-plan-key" : "opaque-variant-key",
    ).products[0].variants[0];
  assert.equal(project().sellingPlans.length, 1);
  product.variants[0].price.minorUnits = 13000;
  assert.equal(project().sellingPlans, undefined);
});

test("catalog and cart share native support; quantity changes retain plan and capability-off cannot downgrade it", () => {
  const current = cart();
  const mapped = mapCartRead({ cart: current }, JPY, "synthetic-cart", true);
  assert.equal(mapped.lines[0].sellingPlan.reference, "synthetic-plan");
  assert.equal(mapped.lines[0].sellingPlan.price.minorUnits, 12000);
  const updated = mapCartMutation(
    {
      cartLinesUpdate: {
        cart: cart(allocation(), 3),
        userErrors: [],
        warnings: [],
      },
    },
    "cartLinesUpdate",
    JPY,
    "synthetic-cart",
    true,
  );
  assert.equal(updated.kind, "success");
  assert.equal(updated.cart.lines[0].quantity, 3);
  assert.equal(updated.cart.lines[0].sellingPlan.reference, "synthetic-plan");
  assert.throws(() =>
    mapCartRead({ cart: current }, JPY, "synthetic-cart", false),
  );
});
