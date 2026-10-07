import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  catalogTotalMinor,
  projectCatalog,
  unavailableCatalog,
} from "../src/lib/catalog-model.ts";
import { getProductDisplayIndex } from "../src/lib/product-display-index.ts";
import { getProductFacts } from "../src/lib/product-details.ts";

function snapshot(overrides = {}, variantOverrides = {}) {
  return {
    products: [
      {
        reference: "gid://shopify/Product/1",
        handle: "test-matcha",
        title: "[TEST ONLY] Matcha",
        description: "Design fixture; not for fulfillment.",
        requiresSellingPlan: false,
        purchaseStatus: "purchasable",
        image: {
          url: "https://cdn.shopify.com/s/files/test.png",
          altText: "Representative powder study",
        },
        variants: [
          {
            reference: "gid://shopify/ProductVariant/2",
            title: "1 kg",
            merchantSku: "PRIVATE-SKU",
            options: [{ name: "Size", value: "1 kg" }],
            price: { minorUnits: 10000, currency: "JPY" },
            quantityRule: { minimum: 2, increment: 2, maximum: 10 },
            purchaseStatus: "purchasable",
            ...variantOverrides,
          },
        ],
        ...overrides,
      },
    ],
  };
}

test("maps exact money and quantity rules and preserves fixture disclosure", () => {
  const catalog = projectCatalog(snapshot());
  assert.equal(catalog.status, "ready");
  assert.equal(catalog.products[0].isFixture, true);
  assert.match(catalog.products[0].title, /TEST ONLY/);
  assert.equal(catalog.products[0].variants[0].priceMinor, 10000);
  assert.equal(catalog.products[0].variants[0].minimum, 2);
  assert.equal(catalog.products[0].variants[0].available, true);
  assert.equal(catalog.products[0].productUrl, null);
  assert.equal(catalog.products[0].productCode, null);
  assert.doesNotMatch(
    JSON.stringify(catalog),
    /gid:\/\/shopify|PRIVATE-SKU|merchantSku|"reference"/,
  );
});

test("server, UI and published facts share codes without changing purchase locators or catalog data", () => {
  const knownCodes = [
    [
      "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
      "WZKA-00",
    ],
    ["test-only-japanese-barista-matcha-powder-for-lattes-1-kg", "UJI-00"],
    ["jmm-storefront-test-matcha", "UJI-01"],
  ];
  const products = knownCodes.map(
    ([handle], index) =>
      snapshot(
        {
          handle,
          title: `Localized title ${index}`,
          description: "Public copy",
        },
        {
          reference: `gid://shopify/ProductVariant/${index + 10}`,
          price: { minorUnits: 5000 + index, currency: "JPY" },
        },
      ).products[0],
  );
  const original = structuredClone(products);
  for (const order of [products, [...products].reverse()]) {
    const receivedReferences = [];
    const catalog = projectCatalog({ products: order }, (reference) => {
      receivedReferences.push(reference);
      return `signed-locator-${products.findIndex((product) => product.variants[0].reference === reference)}`;
    });
    for (const [index, product] of catalog.products.entries()) {
      const source = order[index];
      const code = knownCodes.find(([handle]) => handle === source.handle)[1];
      assert.equal(product.productCode, code);
      assert.equal(getProductDisplayIndex(product.handle), `[${code}]`);
      assert.equal(getProductFacts(product.handle).published[0].value, code);
      assert.equal(product.id, source.handle);
      assert.equal(product.handle, source.handle);
      assert.equal(product.title, source.title);
      assert.equal(product.description, source.description);
      assert.deepEqual(product.variants[0], {
        id: `signed-locator-${products.indexOf(source)}`,
        title: "1 kg",
        available: true,
        priceMinor: source.variants[0].price.minorUnits,
        currency: "JPY",
        options: [{ name: "Size", value: "1 kg" }],
        minimum: 2,
        maximum: 10,
        increment: 2,
      });
    }
    assert.deepEqual(
      receivedReferences,
      order.map((product) => product.variants[0].reference),
    );
    assert.doesNotMatch(
      JSON.stringify(catalog),
      /gid:\/\/shopify|PRIVATE-SKU|merchantSku|"reference"/,
    );
  }
  assert.deepEqual(products, original);
});

test("unknown and lookalike handles never inherit a vendor code or derive one from titles", () => {
  for (const handle of [
    "new-matcha",
    "barista-matcha-2026",
    "CULINARY-MATCHA",
    "constructor",
    "__proto__",
  ]) {
    const product = projectCatalog(
      snapshot({ handle, title: "Ceremonial Matcha", productCode: "WZKA-00" }),
    ).products[0];
    assert.equal(product.productCode, null);
  }
});

test("does not infer online publication from a handle or fixture availability", () => {
  const product = projectCatalog(snapshot()).products[0];
  assert.equal(product.productUrl, null);
  assert.equal(product.isFixture, true);
});

test("keeps empty and service unavailable distinct", () => {
  assert.equal(projectCatalog({ products: [] }).status, "empty");
  assert.deepEqual(unavailableCatalog().products, []);
  assert.equal(unavailableCatalog().status, "unavailable");
});

test("selling-plan-only and unavailable variants cannot appear purchasable", () => {
  assert.equal(
    projectCatalog(snapshot({ requiresSellingPlan: true })).products[0]
      .variants[0].available,
    false,
  );
  assert.equal(
    projectCatalog(snapshot({}, { purchaseStatus: "not_purchasable" }))
      .products[0].variants[0].available,
    false,
  );
});

test("rejects fractional, unsafe, negative and out-of-policy money", () => {
  for (const minorUnits of [1.1, -1, -0, Number.MAX_SAFE_INTEGER + 1, NaN]) {
    assert.throws(() =>
      projectCatalog(snapshot({}, { price: { minorUnits, currency: "JPY" } })),
    );
  }
  assert.throws(() =>
    projectCatalog(
      snapshot({}, { price: { minorUnits: 1000, currency: "USD" } }),
    ),
  );
});

test("rejects invalid quantity rules instead of manufacturing valid choices", () => {
  for (const quantityRule of [
    { minimum: 0, increment: 1, maximum: null },
    { minimum: 1, increment: 0, maximum: null },
    { minimum: 1, increment: 2, maximum: null },
    { minimum: 2, increment: 2, maximum: 1 },
    { minimum: 2, increment: 2, maximum: 5 },
  ]) {
    assert.throws(() => projectCatalog(snapshot({}, { quantityRule })));
  }
});

test("totals respect minimum, increments, maximum and safe integer arithmetic", () => {
  const variant = projectCatalog(snapshot()).products[0].variants[0];
  assert.equal(catalogTotalMinor(variant, 4), 40000);
  for (const quantity of [0, 1, 3, 12, 2.5, NaN]) {
    assert.equal(catalogTotalMinor(variant, quantity), null);
  }
  assert.equal(
    catalogTotalMinor({ ...variant, priceMinor: Number.MAX_SAFE_INTEGER }, 2),
    null,
  );
});

test("rejects non-Shopify, non-HTTPS, and credential-bearing image URLs", () => {
  for (const url of [
    "http://cdn.shopify.com/image.png",
    "https://attacker.example/image.png",
    "https://user:password@cdn.shopify.com/image.png",
    "javascript:alert(1)",
  ]) {
    assert.equal(
      projectCatalog(snapshot({ image: { url, altText: null } })).products[0]
        .imageUrl,
      null,
    );
  }
});

test("route uses only server-side catalog reads and returns explicit failures", () => {
  const server = readFileSync("src/lib/catalog-server.ts", "utf8");
  const route = readFileSync("src/app/api/catalog/route.ts", "utf8");
  assert.match(server, /import "server-only"/);
  assert.doesNotMatch(server, /createStorefrontCartClient|console\./);
  assert.match(route, /503/);
  assert.match(route, /"Cache-Control": "no-store"/);
});
