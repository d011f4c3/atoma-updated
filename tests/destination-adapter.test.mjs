import assert from "node:assert/strict";
import test from "node:test";

const adapter = import.meta.resolve("@jmm/shopify-storefront/server");
const { resolveStorefrontCurrency } = await import(
  new URL("./config.js", adapter)
);
const { createStorefrontCatalogClientWithDependencies } = await import(
  new URL("./client.js", adapter)
);
const { createStorefrontCartClientWithDependencies } = await import(
  new URL("./cart-client.js", adapter)
);
const { mapCartRead } = await import(new URL("./cart-mapper.js", adapter));
const environment = {
  storeDomain: "example.myshopify.com",
  privateAccessToken: "synthetic-private-token",
};
const connection = (nodes) => ({
  pageInfo: { hasNextPage: false, endCursor: null },
  nodes,
});
const money = (amount = "125.50", currencyCode = "USD") => ({
  amount,
  currencyCode,
});
function rawCart(countryCode = "US", currency = "USD") {
  const amount = currency === "JPY" ? "12550" : "125.50";
  return {
    id: "synthetic-cart",
    totalQuantity: 1,
    buyerIdentity: { countryCode },
    cost: {
      subtotalAmount: money(amount, currency),
      totalAmount: money(amount, currency),
    },
    lines: connection([
      {
        __typename: "CartLine",
        id: "synthetic-line",
        quantity: 1,
        parentRelationship: null,
        instructions: { canRemove: true, canUpdateQuantity: true },
        cost: {
          amountPerQuantity: money(amount, currency),
          totalAmount: money(amount, currency),
        },
        merchandise: {
          __typename: "ProductVariant",
          id: "synthetic-variant",
          title: "1 kg",
          requiresComponents: false,
          availableForSale: true,
          selectedOptions: [{ name: "Size", value: "1 kg" }],
          quantityRule: { minimum: 1, maximum: null, increment: 1 },
          image: null,
          product: { requiresSellingPlan: false, handle: "tea", title: "Tea" },
        },
      },
    ]),
    checkoutUrl: "https://example.myshopify.com/checkouts/synthetic",
  };
}
function transport(answer) {
  const calls = [];
  return {
    calls,
    dependencies: {
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
  };
}

test("adapter admits only reviewed exact JPY/USD/SGD minor-unit policies", () => {
  for (const [code, exponent] of [
    ["JPY", 0],
    ["USD", 2],
    ["SGD", 2],
  ]) {
    const policy = resolveStorefrontCurrency(code);
    assert.equal(policy.code, code);
    assert.equal(policy.minorUnitExponent, exponent);
  }
  for (const code of ["EUR", "usd", "constructor", undefined])
    assert.throws(() => resolveStorefrontCurrency(code));
});

test("contextual localization reports Shopify currency, including actual JPY for US, without conversion", async () => {
  const t = transport(() => ({
    localization: {
      country: { isoCode: "US", currency: { isoCode: "JPY" } },
      availableCountries: [{ isoCode: "US" }, { isoCode: "SG" }],
    },
  }));
  const client = createStorefrontCatalogClientWithDependencies(
    { environment, currency: "JPY", maxRetries: 0 },
    t.dependencies,
  );
  assert.deepEqual(await client.readMarketContext({ countryCode: "US" }), {
    countryCode: "US",
    currency: "JPY",
  });
  assert.equal(t.calls[0].variables.country, "US");
  assert.match(t.calls[0].query, /@inContext\(country: \$country\)/);
});

test("unsupported localization and silent country fallback are rejected", async () => {
  for (const country of [
    { isoCode: "JP", currency: { isoCode: "JPY" } },
    { isoCode: "US", currency: { isoCode: "EUR" } },
  ]) {
    const t = transport(() => ({
      localization: { country, availableCountries: [{ isoCode: "US" }] },
    }));
    const client = createStorefrontCatalogClientWithDependencies(
      { environment, currency: "JPY", maxRetries: 0 },
      t.dependencies,
    );
    await assert.rejects(client.readMarketContext({ countryCode: "US" }));
  }
});

test("published catalog and product reads carry requested context", async () => {
  const t = transport((request) =>
    request.query.includes("query JmmPublishedProduct")
      ? { product: null }
      : { products: connection([]) },
  );
  const client = createStorefrontCatalogClientWithDependencies(
    { environment, currency: "SGD", maxRetries: 0 },
    t.dependencies,
  );
  assert.deepEqual(await client.readPublishedCatalog({ countryCode: "SG" }), {
    products: [],
  });
  assert.equal(
    await client.readPublishedProductByHandle("tea", { countryCode: "SG" }),
    null,
  );
  assert.equal(t.calls.length, 2);
  for (const request of t.calls) {
    assert.equal(request.variables.country, "SG");
    assert.match(request.query, /@inContext\(country: \$country\)/);
  }
});

test("destination-aware Cart reads reconcile actual supported currency and legacy country without relabeling", () => {
  const defaultPolicy = resolveStorefrontCurrency("JPY");
  for (const [country, currency] of [
    ["US", "USD"],
    ["SG", "SGD"],
    ["JP", "JPY"],
    [null, "JPY"],
  ]) {
    const cart = mapCartRead(
      { cart: rawCart(country, currency) },
      defaultPolicy,
      "synthetic-cart",
      false,
      true,
    );
    assert.equal(cart.buyerCountryCode, country);
    assert.equal(cart.cost.totalAmount.currency, currency);
    assert.equal(cart.cost.totalAmount.minorUnits, 12550);
    assert.equal(cart.lines[0].cost.totalAmount.minorUnits, 12550);
    assert.doesNotMatch(JSON.stringify(cart), /synthetic-cart/);
  }
  for (const mutate of [
    (cart) => {
      cart.cost.totalAmount.currencyCode = "EUR";
    },
    (cart) => {
      cart.lines.nodes[0].cost.amountPerQuantity.currencyCode = "SGD";
    },
    (cart) => {
      cart.cost.totalAmount.amount = "125.501";
    },
    (cart) => {
      delete cart.buyerIdentity.countryCode;
    },
  ]) {
    const cart = rawCart();
    mutate(cart);
    assert.throws(() =>
      mapCartRead({ cart }, defaultPolicy, "synthetic-cart", false, true),
    );
  }
});

test("Cart creation sends buyer country and country mutation uses the existing Cart exactly once", async () => {
  const t = transport((request) => ({
    [request.query.includes("JmmCartCreate")
      ? "cartCreate"
      : "cartBuyerIdentityUpdate"]: {
      cart: rawCart(),
      userErrors: [],
      warnings: [],
    },
  }));
  const client = createStorefrontCartClientWithDependencies(
    { environment, currency: "USD", destinationContextEnabled: true },
    t.dependencies,
  );
  const created = await client.createCart(
    { merchandiseId: "synthetic-variant", quantity: 1 },
    { countryCode: "US" },
  );
  assert.equal(created.cart.buyerCountryCode, "US");
  assert.deepEqual(t.calls[0].variables.input.buyerIdentity, {
    countryCode: "US",
  });
  const updated = await client.updateBuyerCountry("synthetic-cart", "US");
  assert.equal(updated.kind, "success");
  assert.equal(t.calls.length, 2);
  assert.equal(t.calls[1].variables.cartId, "synthetic-cart");
  assert.deepEqual(t.calls[1].variables.buyerIdentity, { countryCode: "US" });
  assert.doesNotMatch(t.calls[1].query, /@inContext/);
});

test("buyer country mutation never retries an ambiguous write and rejects unknown country before dispatch", async () => {
  const t = transport(() => {
    throw new Error("synthetic network failure");
  });
  const client = createStorefrontCartClientWithDependencies(
    {
      environment,
      currency: "USD",
      destinationContextEnabled: true,
      maxRetries: 3,
    },
    t.dependencies,
  );
  await assert.rejects(client.updateBuyerCountry("synthetic-cart", "GB"));
  assert.equal(t.calls.length, 0);
  await assert.rejects(
    client.updateBuyerCountry("synthetic-cart", "US"),
    (error) => error.code === "MUTATION_OUTCOME_UNKNOWN",
  );
  assert.equal(t.calls.length, 1);
});

test("checkout snapshot carries actual buyer country and currency while keeping URL non-enumerable", async () => {
  const t = transport(() => ({ cart: rawCart() }));
  const client = createStorefrontCartClientWithDependencies(
    { environment, currency: "USD", destinationContextEnabled: true },
    t.dependencies,
  );
  const checkout = await client.readCheckout(
    "synthetic-cart",
    "example.myshopify.com",
  );
  assert.equal(checkout.buyerCountryCode, "US");
  assert.equal(checkout.currency, "USD");
  assert.doesNotMatch(JSON.stringify(checkout), /checkouts|checkoutUrl/);
});
