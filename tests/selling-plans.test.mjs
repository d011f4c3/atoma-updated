import assert from "node:assert/strict";
import test from "node:test";
import {
  approvedSellingPlanProduct,
  readProductPurchaseOptions,
  sellingPlansEnabled,
} from "../src/lib/selling-plan-policy.ts";
import { projectCatalog } from "../src/lib/catalog-model.ts";
import {
  canPurchaseQuantity,
  resolvePurchaseVariant,
  restoredSelection,
} from "../src/lib/product-selection.ts";
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";

const handle = SAMPLE_SET_CONTENTS[0].productHandle;
function product() {
  return {
    handle,
    reference: "private-product",
    title: "Matcha",
    description: "",
    image: null,
    requiresSellingPlan: false,
    purchaseStatus: "purchasable",
    variants: [
      {
        reference: "private-variant",
        title: "1 kg",
        options: [{ name: "Size", value: "1 kg" }],
        price: { minorUnits: 12000, currency: "JPY" },
        quantityRule: { minimum: 1, maximum: 10, increment: 1 },
        purchaseStatus: "purchasable",
        sellingPlans: [
          {
            reference: "private-plan",
            name: "Every 4 weeks",
            description: null,
            deliveryInterval: "week",
            deliveryIntervalCount: 4,
            price: { minorUnits: 12000, currency: "JPY" },
          },
        ],
      },
    ],
  };
}
const key = (_variant, plan) =>
  plan ? "opaque-subscription" : "opaque-one-time";

test("local recurring capability requires the explicit verified flag, never production", () => {
  for (const environment of [
    {},
    { NODE_ENV: "development" },
    {
      NODE_ENV: "production",
      SHOPIFY_STOREFRONT_SELLING_PLANS_ENABLED: "true",
    },
    {
      NODE_ENV: "development",
      SHOPIFY_STOREFRONT_SELLING_PLANS_ENABLED: "TRUE",
    },
  ])
    assert.equal(sellingPlansEnabled(environment), false);
  for (const NODE_ENV of ["development", "test"])
    assert.equal(
      sellingPlansEnabled({
        NODE_ENV,
        SHOPIFY_STOREFRONT_SELLING_PLANS_ENABLED: "true",
      }),
      true,
    );
});

test("only reviewed tea, unambiguous 1 kg and actual four-week regular-price allocations are admitted", () => {
  const original = product();
  const before = structuredClone(original);
  assert.equal(
    approvedSellingPlanProduct(original).variants[0].sellingPlans.length,
    1,
  );
  assert.deepEqual(original, before);
  const cases = [
    (p) => {
      p.handle = SAMPLE_SET_OFFER.productHandle;
    },
    (p) => {
      p.handle += "-other";
    },
    (p) => {
      p.variants[0].options[0].value = "200 g";
    },
    (p) => {
      p.variants[0].options[0].value = "1 kg case";
    },
    (p) => {
      p.variants.push(structuredClone(p.variants[0]));
    },
    (p) => {
      p.variants[0].sellingPlans[0].deliveryInterval = "month";
    },
    (p) => {
      p.variants[0].sellingPlans[0].deliveryIntervalCount = 1;
    },
    (p) => {
      p.variants[0].sellingPlans[0].price.minorUnits = 11000;
    },
    (p) => {
      p.variants[0].sellingPlans[0].price.currency = "USD";
    },
  ];
  for (const change of cases) {
    const p = product();
    change(p);
    assert.equal(
      approvedSellingPlanProduct(p).variants.flatMap((v) => v.sellingPlans)
        .length,
      0,
    );
  }
});

test("public recurring projection uses opaque variant-plan keys and current prices, never raw references", () => {
  const p = product();
  const publicProduct = projectCatalog({ products: [p] }, key).products[0];
  const variant = publicProduct.variants[0],
    plan = variant.sellingPlans[0];
  assert.equal(variant.available, true);
  assert.equal(variant.id, "opaque-one-time");
  assert.equal(plan.id, "opaque-subscription");
  assert.equal(plan.priceMinor, 12000);
  assert.equal(plan.deliveryInterval, "week");
  assert.equal(plan.deliveryIntervalCount, 4);
  assert.doesNotMatch(
    JSON.stringify(publicProduct),
    /private-product|private-variant|private-plan|reference/,
  );
  assert.equal(
    projectCatalog({ products: [p] }).products[0].variants[0].sellingPlans,
    undefined,
  );
  p.requiresSellingPlan = true;
  const required = projectCatalog({ products: [p] }, key).products[0]
    .variants[0];
  assert.equal(required.available, false);
  assert.equal(required.sellingPlans[0].available, true);
  p.purchaseStatus = "not_purchasable";
  assert.equal(
    projectCatalog({ products: [p] }, key).products[0].variants[0]
      .sellingPlans[0].available,
    false,
  );
});

test("failed allocation access preserves one-time data while successful unpublication is authoritative", async () => {
  let baseReads = 0,
    planReads = 0;
  const base = async () => {
    baseReads++;
    return product();
  };
  const denied = async () => {
    planReads++;
    throw new Error("private vendor error");
  };
  const fallback = await readProductPurchaseOptions(handle, true, base, denied);
  assert.equal(fallback.variants[0].sellingPlans.length, 0);
  assert.equal(fallback.variants[0].price.minorUnits, 12000);
  assert.deepEqual([baseReads, planReads], [1, 1]);
  assert.equal(
    await readProductPurchaseOptions(handle, true, base, async () => null),
    null,
  );
  assert.equal(baseReads, 1);
  await readProductPurchaseOptions(
    SAMPLE_SET_OFFER.productHandle,
    true,
    base,
    denied,
  );
  await readProductPurchaseOptions(handle, false, base, denied);
  assert.deepEqual([baseReads, planReads], [3, 1]);
});

test("a selected subscription preserves identity on refresh and can never fall back to one-time", () => {
  const p = projectCatalog({ products: [product()] }, key).products[0],
    variant = p.variants[0];
  const selection = {
    productId: p.id,
    variantId: variant.id,
    quantity: 3,
    sellingPlanKey: "opaque-subscription",
  };
  assert.deepEqual(restoredSelection(p, selection), selection);
  assert.equal(resolvePurchaseVariant(variant, null), variant);
  const recurring = resolvePurchaseVariant(variant, selection.sellingPlanKey);
  assert.equal(recurring.id, "opaque-subscription");
  assert.equal(canPurchaseQuantity(recurring, 3), true);
  variant.sellingPlans = [];
  assert.equal(
    resolvePurchaseVariant(variant, selection.sellingPlanKey),
    undefined,
  );
  assert.equal(
    restoredSelection(p, selection).sellingPlanKey,
    selection.sellingPlanKey,
  );
  p.variants = [];
  assert.equal(
    restoredSelection(p, selection).sellingPlanKey,
    selection.sellingPlanKey,
  );
});
