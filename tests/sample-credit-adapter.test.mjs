import assert from "node:assert/strict";
import test from "node:test";

const adapter = import.meta.resolve("@jmm/shopify-storefront/server");
const { createStorefrontCartClientWithDependencies } = await import(
  new URL("./cart-client.js", adapter)
);
const environment = {
  storeDomain: "example.myshopify.com",
  privateAccessToken: "synthetic-private-token",
};
const money = (amount = "100.00", currencyCode = "USD") => ({
  amount,
  currencyCode,
});
function rawCart() {
  return {
    id: "synthetic-cart",
    buyerIdentity: { countryCode: "US" },
    totalQuantity: 1,
    discountCodes: [{ code: "TEST-SAMPLE-CREDIT", applicable: true }],
    discountAllocations: [{ __typename: "CartAutomaticDiscountAllocation" }],
    cost: { subtotalAmount: money(), totalAmount: money("71.00") },
    lines: {
      pageInfo: { hasNextPage: false },
      nodes: [
        {
          __typename: "CartLine",
          id: "synthetic-line",
          quantity: 1,
          parentRelationship: null,
          instructions: { canRemove: true, canUpdateQuantity: true },
          discountAllocations: [
            {
              __typename: "CartCodeDiscountAllocation",
              code: "TEST-SAMPLE-CREDIT",
              discountedAmount: money("29.00"),
            },
          ],
          cost: { amountPerQuantity: money(), totalAmount: money("71.00") },
          merchandise: {
            __typename: "ProductVariant",
            id: "synthetic-variant",
            title: "1 kg",
            requiresComponents: false,
            availableForSale: true,
            selectedOptions: [{ name: "Size", value: "1 kg" }],
            quantityRule: { minimum: 1, maximum: null, increment: 1 },
            image: null,
            product: {
              requiresSellingPlan: false,
              handle: "tea",
              title: "Tea",
            },
          },
        },
      ],
    },
  };
}
function setup(answer, enabled = true) {
  const calls = [];
  const client = createStorefrontCartClientWithDependencies(
    {
      environment,
      currency: "USD",
      destinationContextEnabled: true,
      discountCodesEnabled: enabled,
      maxRetries: 3,
    },
    {
      fetchApi: async (_url, options) => {
        const request = JSON.parse(options.body);
        calls.push(request);
        const data = await answer(request);
        return new Response(JSON.stringify({ data }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-API-Version": "2026-07",
          },
        });
      },
      sleep: async () => {},
      random: () => 0,
    },
  );
  return { client, calls };
}

test("discount-aware Cart read projects validated codes and monetary allocations without changing the buyer destination", async () => {
  const { client, calls } = setup(() => ({ cart: rawCart() }));
  const cart = await client.readCart("synthetic-cart");
  assert.deepEqual(cart.discountCodes, [
    { code: "TEST-SAMPLE-CREDIT", applicable: true },
  ]);
  assert.deepEqual(cart.discountAllocations, [
    {
      code: "TEST-SAMPLE-CREDIT",
      discountedAmount: { currency: "USD", minorUnits: 2900 },
    },
  ]);
  assert.equal(cart.buyerCountryCode, "US");
  assert.equal(cart.cost.totalAmount.minorUnits, 7100);
  assert.match(calls[0].query, /discountCodes \{ code applicable \}/);
  assert.equal(
    (calls[0].query.match(/on CartCodeDiscountAllocation/g) ?? []).length,
    2,
  );
  assert.doesNotMatch(JSON.stringify(cart), /synthetic-cart/);
});

test("discount list update uses one mutation and returns the same validated cart projection", async () => {
  const { client, calls } = setup(() => ({
    cartDiscountCodesUpdate: { cart: rawCart(), userErrors: [], warnings: [] },
  }));
  const result = await client.updateDiscountCodes("synthetic-cart", [
    "EXISTING",
    "TEST-SAMPLE-CREDIT",
  ]);
  assert.equal(result.kind, "success");
  assert.equal(result.cart.discountCodes[0].applicable, true);
  assert.equal(calls.length, 1);
  assert.match(
    calls[0].query,
    /cartDiscountCodesUpdate\(cartId: \$cartId, discountCodes: \$discountCodes\)/,
  );
  assert.deepEqual(calls[0].variables.discountCodes, [
    "EXISTING",
    "TEST-SAMPLE-CREDIT",
  ]);
  assert.equal(calls[0].variables.cartId, "synthetic-cart");
  assert.doesNotMatch(calls[0].query, /buyerIdentityUpdate|@inContext/);
});

test("discount mutation rejects malformed input and disabled capability before dispatch", async () => {
  const { client, calls } = setup(() => {
    throw new Error("must not dispatch");
  });
  for (const codes of [
    "CODE",
    [""],
    [" CODE"],
    ["CODE\n"],
    ["x".repeat(256)],
    ["CODE", "code"],
    Array.from({ length: 251 }, (_, n) => `C-${n}`),
  ]) {
    await assert.rejects(client.updateDiscountCodes("synthetic-cart", codes));
  }
  assert.equal(calls.length, 0);
  const disabled = setup(() => {
    throw new Error("must not dispatch");
  }, false);
  await assert.rejects(
    disabled.client.updateDiscountCodes("synthetic-cart", [
      "TEST-SAMPLE-CREDIT",
    ]),
  );
  assert.equal(disabled.calls.length, 0);
});

test("discount reads reject incomplete, duplicate or invalid allocation data", async () => {
  for (const mutate of [
    (cart) => {
      delete cart.discountCodes;
    },
    (cart) => {
      cart.discountCodes[0].applicable = "true";
    },
    (cart) => {
      cart.discountCodes.push({
        code: "test-sample-credit",
        applicable: false,
      });
    },
    (cart) => {
      delete cart.lines.nodes[0].discountAllocations;
    },
    (cart) => {
      cart.lines.nodes[0].discountAllocations[0].discountedAmount =
        money("29.001");
    },
    (cart) => {
      cart.lines.nodes[0].discountAllocations[0].discountedAmount = money(
        "29.00",
        "SGD",
      );
    },
    (cart) => {
      cart.lines.nodes[0].discountAllocations[0].__typename =
        "UnknownAllocation";
    },
  ]) {
    const cart = rawCart();
    mutate(cart);
    const { client } = setup(() => ({ cart }));
    await assert.rejects(client.readCart("synthetic-cart"));
  }
});

test("discount transport failures and malformed accepted results stay ambiguous with exactly one attempt", async () => {
  for (const answer of [
    () => {
      throw new Error("synthetic network error");
    },
    () => ({
      cartDiscountCodesUpdate: {
        cart: { ...rawCart(), id: "different-cart" },
        userErrors: [],
        warnings: [],
      },
    }),
    () => ({
      cartDiscountCodesUpdate: {
        cart: { ...rawCart(), discountCodes: null },
        userErrors: [],
        warnings: [],
      },
    }),
  ]) {
    const { client, calls } = setup(answer);
    await assert.rejects(
      client.updateDiscountCodes("synthetic-cart", ["TEST-SAMPLE-CREDIT"]),
      (error) => error.code === "MUTATION_OUTCOME_UNKNOWN",
    );
    assert.equal(calls.length, 1);
  }
});
