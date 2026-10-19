import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import test, { after } from "node:test";
import { createCartApplication } from "../src/lib/cart-application.ts";
import { formatStorefrontMoney } from "../src/lib/storefront-money.ts";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";

const adapter = import.meta.resolve("@jmm/shopify-storefront/server");
const { mapCatalogMoney } = await import(new URL("./money.js", adapter));
const { resolveStorefrontCurrency } = await import(
  new URL("./config.js", adapter)
);
const destination = (countryCode = "SG", currency = "SGD") => ({
  countryCode,
  currency,
});
const money = (minorUnits, currency) => ({ minorUnits, currency });
const handle = SAMPLE_SET_CONTENTS[0].productHandle;
const quantityRule = { minimum: 1, maximum: 20, increment: 1 };
const variantReference = "synthetic-variant";
const planReference = "synthetic-plan";
const reference = "synthetic-cart";
const lineKey = `v1_${"a".repeat(43)}`;
function plan(currency) {
  return {
    reference: planReference,
    name: "Every 4 weeks",
    description: null,
    deliveryInterval: "week",
    deliveryIntervalCount: 4,
    price: money(12001, currency),
  };
}
function product(currency, includePlans = true) {
  return {
    reference: "synthetic-product",
    handle,
    title: "Synthetic tea",
    description: "",
    requiresSellingPlan: false,
    purchaseStatus: "purchasable",
    image: null,
    variants: [
      {
        reference: variantReference,
        title: "1 kg",
        options: [{ name: "Size", value: "1 kg" }],
        price: money(12001, currency),
        quantityRule,
        sellingPlans: includePlans ? [plan(currency)] : [],
        purchaseStatus: "purchasable",
      },
    ],
  };
}
function cart(
  context,
  purchases = [
    [2, null],
    [3, planReference],
  ],
) {
  const lines = purchases.map(([quantity, recurring], index) => ({
    reference: `synthetic-line-${index}`,
    quantity,
    cost: {
      amountPerQuantity: money(12001, context.currency),
      totalAmount: money(12001 * quantity, context.currency),
    },
    merchandise: {
      reference: variantReference,
      productHandle: handle,
      productTitle: "Synthetic tea",
      title: "1 kg",
      options: [{ name: "Size", value: "1 kg" }],
      purchaseStatus: "purchasable",
      quantityRule,
      image: null,
    },
    instructions: { canRemove: true, canUpdateQuantity: true },
    sellingPlan: recurring ? plan(context.currency) : null,
  }));
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  return {
    reference,
    buyerCountryCode: context.countryCode,
    totalQuantity,
    cost: {
      subtotalAmount: money(totalQuantity * 12001, context.currency),
      totalAmount: money(totalQuantity * 12001, context.currency),
    },
    lines,
  };
}
function application(before, afterCart, expected = destination()) {
  let writes = 0;
  const write = async () => {
    writes++;
    return { kind: "success", cart: afterCart, warnings: [] };
  };
  return {
    writes: () => writes,
    app: createCartApplication({
      destination: expected,
      cartSource: {
        readCart: async () => before,
        updateBuyerCountry: write,
        createCart: write,
        addCartLine: write,
        updateCartLine: write,
        removeCartLine: write,
        readCheckout: async () => assert.fail("Unexpected checkout request"),
      },
      catalogSource: {
        readPublishedProductByHandle: async () => product(expected.currency),
      },
      createLineActionKey: () => lineKey,
      matchesLineActionKey: () => true,
      matchesVariantActionKey: (_key, _variant, selectedPlan) => !selectedPlan,
      classifyError: () => "ambiguous",
    }),
  };
}

// Load the actual server/cache modules with a request-local, in-memory vendor
// boundary. No credentials, Shopify calls, orders or network access are needed.
const requests = new AsyncLocalStorage();
const bridgeSymbol = Symbol.for("atoma.destination-adversarial");
const currencies = { US: "USD", SG: "SGD" };
const catalogReads = [];
const bridge = {
  cookies: () => requests.getStore().cookies,
  headers: () => new Headers(),
  environment: () => ({ storeDomain: "h0cuaw-f7.myshopify.com" }),
  catalog(options) {
    return {
      readMarketContext: async ({ countryCode }) =>
        destination(countryCode, currencies[countryCode]),
      readPublishedCatalog: async ({ countryCode }) => {
        catalogReads.push([countryCode, options.currency]);
        await new Promise((resolve) => setImmediate(resolve));
        return { products: [product(options.currency, false)] };
      },
      readPublishedProductByHandle: async (_handle, context) => {
        assert.equal(options.currency, currencies[context.countryCode]);
        return product(options.currency, options.sellingPlansEnabled);
      },
    };
  },
  cart() {
    return requests.getStore().cartSource;
  },
};
globalThis[bridgeSymbol] = bridge;
const sourceUrl = (source) =>
  `data:text/javascript,${encodeURIComponent(source)}`;
const bridgeSource = `const b = globalThis[Symbol.for("atoma.destination-adversarial")];`;
const mocks = new Map([
  ["server-only", sourceUrl("export {};")],
  [
    "next/headers",
    sourceUrl(`${bridgeSource}
      export const cookies = async () => b.cookies();
      export const headers = async () => b.headers();`),
  ],
  [
    "@jmm/shopify-storefront/server",
    sourceUrl(`${bridgeSource}
      export const readStorefrontEnvironment = () => b.environment();
      export const createStorefrontCatalogClient = options => b.catalog(options);
      export const createStorefrontCartClient = options => b.cart(options);
      export const isStorefrontError = error => error?.code === "MUTATION_OUTCOME_UNKNOWN";`),
  ],
]);
const localLibrary = new URL("../src/lib/", import.meta.url).href;
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (mocks.has(specifier))
      return { url: mocks.get(specifier), shortCircuit: true };
    if (
      context.parentURL?.startsWith(localLibrary) &&
      specifier.startsWith(".") &&
      !specifier.endsWith(".ts")
    ) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(candidate))
        return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const environmentNames = [
  "JMM_CART_SESSION_SECRET",
  "SHOPIFY_STOREFRONT_SELLING_PLANS_ENABLED",
  "NODE_ENV",
];
const previousEnvironment = new Map(
  environmentNames.map((name) => [name, process.env[name]]),
);
process.env.JMM_CART_SESSION_SECRET = Buffer.alloc(32, 7).toString("base64");
process.env.SHOPIFY_STOREFRONT_SELLING_PLANS_ENABLED = "true";
process.env.NODE_ENV = "test";
const server = await import("../src/lib/cart-server.ts");
const { readCatalog } = await import("../src/lib/catalog-server.ts");
const session = await import("../src/lib/cart-session.ts");
const sealed = session.sealCartSession(
  {
    cartReference: reference,
    storeDomain: "h0cuaw-f7.myshopify.com",
    sellingPlansEnabled: true,
  },
  session.readCartSessionSecret(),
);
after(() => {
  hooks.deregister();
  delete globalThis[bridgeSymbol];
  for (const [name, value] of previousEnvironment)
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
});
function request(countryCode, initialCart = null) {
  const values = new Map([["atoma-shipping-country", countryCode]]);
  if (initialCart) values.set(session.cartSessionCookieName(false), sealed);
  const state = {
    snapshot: initialCart,
    writes: 0,
    cookies: {
      get: (key) => (values.has(key) ? { value: values.get(key) } : undefined),
      set: (key, value) => values.set(key, value),
    },
  };
  state.cartSource = {
    readCart: async () => state.snapshot,
    createCart: async (input, context) => {
      state.writes++;
      state.snapshot = cart(
        destination(context.countryCode, currencies[context.countryCode]),
        [[input.quantity, input.sellingPlanId ?? null]],
      );
      return { kind: "success", cart: state.snapshot, warnings: [] };
    },
    updateBuyerCountry: async () => assert.fail("Unexpected country write"),
  };
  return state;
}

test("Shopify decimals map exactly to JPY zero and USD/SGD two minor units", () => {
  for (const [currency, amount, expected] of [
    ["JPY", "4800.00", 4800],
    ["USD", "48.01", 4801],
    ["SGD", "0.01", 1],
    ["USD", "90071992547409.91", Number.MAX_SAFE_INTEGER],
  ]) {
    assert.deepEqual(
      mapCatalogMoney(
        { amount, currencyCode: currency },
        resolveStorefrontCurrency(currency),
        "fixture.price",
      ),
      money(expected, currency),
    );
  }
  for (const [currency, amount] of [
    ["JPY", "4800.01"],
    ["USD", "48.001"],
    ["SGD", "0.001"],
    ["USD", "90071992547409.92"],
  ])
    assert.throws(() =>
      mapCatalogMoney(
        { amount, currencyCode: currency },
        resolveStorefrontCurrency(currency),
        "fixture.price",
      ),
    );
});

test("money labels preserve every valid minor unit without floating rounding", () => {
  assert.equal(formatStorefrontMoney(money(4800, "JPY")), "¥4,800");
  for (const currency of ["USD", "SGD"]) {
    assert.equal(
      formatStorefrontMoney(money(4801, currency)).replaceAll("\u00a0", " "),
      `${currency} 48.01`,
    );
    assert.equal(
      formatStorefrontMoney(
        money(Number.MAX_SAFE_INTEGER, currency),
      ).replaceAll("\u00a0", " "),
      `${currency} 90,071,992,547,409.91`,
    );
  }
});

test("country changes retain one-time and recurring identities and quantities", async () => {
  const before = cart(destination("US", "USD"));
  const afterCart = cart(destination());
  afterCart.lines.reverse();
  const s = application(before, afterCart);
  const result = await s.app.updateDestination(reference, "SG");
  assert.equal(result.kind, "success");
  assert.deepEqual(result.cart.destination, destination());
  assert.deepEqual(
    result.cart.lines.map((line) => [line.quantity, line.sellingPlan?.name]),
    [
      [3, "Every 4 weeks"],
      [2, undefined],
    ],
  );
  assert.equal(result.sessionReference, reference);
  assert.equal(s.writes(), 1);
  assert.equal(result.cart.lines[0].sellingPlan.priceLabel, "SGD\u00a0120.01");
});

test("a lossy or incorrectly contextualized country response is ambiguous once", async () => {
  for (const change of [
    (value) => (value.buyerCountryCode = "US"),
    (value) => (value.cost.totalAmount.currency = "USD"),
    (value) => value.lines.pop(),
    (value) => (value.lines[1].sellingPlan = null),
    (value) => (value.lines[1].sellingPlan.reference = "another-plan"),
    (value) => value.lines[0].quantity++,
    (value) => value.lines.push(structuredClone(value.lines[0])),
  ]) {
    const changed = cart(destination());
    change(changed);
    const s = application(cart(destination("US", "USD")), changed);
    assert.deepEqual(await s.app.updateDestination(reference, "SG"), {
      kind: "ambiguous",
    });
    assert.equal(s.writes(), 1);
  }
});

test("stale cart country or currency blocks every commerce action before writes", async () => {
  for (const current of [destination("US", "SGD"), destination("SG", "JPY")]) {
    const s = application(cart(current), cart(destination()));
    for (const result of [
      await s.app.addLine(reference, {
        productHandle: handle,
        variantKey: lineKey,
        quantity: 1,
      }),
      await s.app.updateLine(reference, { lineKey, quantity: 1 }),
      await s.app.removeLine(reference, { lineKey }),
    ])
      assert.deepEqual(result, { kind: "rejected", reviewRequired: true });
    assert.deepEqual(await s.app.prepareCheckout(reference), { kind: "error" });
    assert.equal(s.writes(), 0);
  }
});

test("server purchase keys reject other countries, currencies and selection-only keys", async () => {
  const state = request("SG");
  await requests.run(state, async () => {
    for (const selectedPlan of [undefined, planReference]) {
      for (const staleKey of [
        server.createPublishedVariantActionKey(
          variantReference,
          selectedPlan,
          destination("US", "SGD"),
        ),
        server.createPublishedVariantActionKey(
          variantReference,
          selectedPlan,
          destination("SG", "JPY"),
        ),
        server.createCatalogSelectionKey(variantReference, selectedPlan),
      ]) {
        const result = await server.addCurrentCartLine({
          productHandle: handle,
          variantKey: staleKey,
          quantity: 1,
        });
        assert.equal(result.kind, "rejected");
      }
    }
    assert.equal(state.writes, 0);
    const result = await server.addCurrentCartLine({
      productHandle: handle,
      variantKey: server.createPublishedVariantActionKey(
        variantReference,
        planReference,
        destination(),
      ),
      quantity: 2,
    });
    assert.equal(result.kind, "success");
    assert.equal(state.writes, 1);
    assert.equal(result.cart.lines[0].sellingPlan.name, "Every 4 weeks");
    assert.equal(result.cart.lines[0].quantity, 2);
  });
});

test("an uncertain committed destination write reconciles by read without replay", async () => {
  const state = request("US", cart(destination("US", "USD")));
  state.cartSource.updateBuyerCountry = async (cartReference, countryCode) => {
    assert.equal(cartReference, reference);
    assert.equal(countryCode, "SG");
    state.writes++;
    state.snapshot = cart(destination());
    throw Object.assign(new Error("Synthetic interrupted response"), {
      code: "MUTATION_OUTCOME_UNKNOWN",
    });
  };
  await requests.run(state, async () => {
    assert.deepEqual(await server.changeCurrentDestination("SG"), {
      kind: "ambiguous",
    });
    assert.equal(state.cookies.get("atoma-shipping-country").value, "US");
    const reconciled = await server.loadCurrentDestination();
    assert.equal(reconciled.kind, "ready");
    assert.equal(reconciled.reviewRequired, false);
    assert.deepEqual(reconciled.destination, destination());
    assert.equal(state.cookies.get("atoma-shipping-country").value, "SG");
    assert.equal(
      state.cookies.get(session.cartSessionCookieName(false)).value,
      sealed,
    );
    assert.equal(state.writes, 1);
    assert.deepEqual(
      state.snapshot.lines.map((line) => line.quantity),
      [2, 3],
    );
  });
});

test("concurrent catalog requests and later cached reads stay country-isolated", async (t) => {
  const [us, sg, duplicateUS] = await Promise.all([
    requests.run(request("US"), readCatalog),
    requests.run(request("SG"), readCatalog),
    requests.run(request("US"), readCatalog),
  ]);
  assert.equal(us.status, "ready");
  assert.equal(sg.status, "ready");
  assert.deepEqual(us.destination, destination("US", "USD"));
  assert.deepEqual(sg.destination, destination());
  assert.equal(us.products[0].variants[0].currency, "USD");
  assert.equal(sg.products[0].variants[0].currency, "SGD");
  assert.notEqual(us.products[0].variants[0].id, sg.products[0].variants[0].id);
  assert.equal(
    us.products[0].variants[0].selectionId,
    sg.products[0].variants[0].selectionId,
  );
  assert.equal(
    us.products[0].variants[0].sellingPlans[0].selectionId,
    sg.products[0].variants[0].sellingPlans[0].selectionId,
  );
  assert.strictEqual(duplicateUS, us);
  assert.strictEqual(await requests.run(request("SG"), readCatalog), sg);
  assert.deepEqual(catalogReads.sort(), [
    ["SG", "SGD"],
    ["US", "USD"],
  ]);

  // A Shopify configuration change may make both markets return shop currency.
  // Equal currency must not merge their country-specific catalogs or keys.
  const later = Date.now() + 31_000;
  t.mock.method(Date, "now", () => later);
  currencies.US = "JPY";
  currencies.SG = "JPY";
  try {
    const [usJPY, sgJPY] = await Promise.all([
      requests.run(request("US"), readCatalog),
      requests.run(request("SG"), readCatalog),
    ]);
    assert.deepEqual(usJPY.destination, destination("US", "JPY"));
    assert.deepEqual(sgJPY.destination, destination("SG", "JPY"));
    assert.notEqual(
      usJPY.products[0].variants[0].id,
      sgJPY.products[0].variants[0].id,
    );
    assert.notEqual(
      usJPY.products[0].variants[0].id,
      us.products[0].variants[0].id,
    );
    assert.equal(catalogReads.length, 4);
    assert.strictEqual(await requests.run(request("SG"), readCatalog), sgJPY);
    assert.equal(catalogReads.length, 4);
  } finally {
    currencies.US = "USD";
    currencies.SG = "SGD";
  }
});
