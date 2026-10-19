import assert from "node:assert/strict";
import test from "node:test";
import {
  isSampleSetHandle,
  matchaCatalogProducts,
} from "../src/lib/sample-catalog.ts";

const reference = {
  productHandle: "reviewed-sample-set-fixture",
  variants: [{ options: [{ name: "Format", value: "3 × 20 g" }] }],
};

function product(handle, title = "Matcha") {
  return {
    id: handle,
    handle,
    title,
    description: "Catalog separation fixture",
    imageUrl: null,
    imageAlt: "",
    productCode: null,
    productUrl: null,
    isFixture: true,
    variants: [],
  };
}

test("only the exact reviewed handle identifies the sample destination", () => {
  assert.equal(isSampleSetHandle(reference.productHandle, reference), true);
  for (const handle of [
    undefined,
    "",
    "sample-set",
    `${reference.productHandle}-other`,
    `${reference.productHandle} `,
    reference.productHandle.toUpperCase(),
  ]) {
    assert.equal(isSampleSetHandle(handle, reference), false);
  }
  assert.equal(isSampleSetHandle(reference.productHandle, null), false);
  assert.equal(
    isSampleSetHandle("", { ...reference, productHandle: "" }),
    false,
  );
});

test("tea selection excludes the reviewed set without changing published catalog data", () => {
  const first = product("ceremonial-fixture");
  const set = product(reference.productHandle, "Sample Set");
  const second = product("unmapped-tea-fixture");
  const published = Object.freeze([first, set, second]);
  const selected = matchaCatalogProducts(published, reference);
  assert.deepEqual(selected, [first, second]);
  assert.equal(selected[0], first);
  assert.equal(selected[1], second);
  assert.deepEqual(published, [first, set, second]);
  assert.deepEqual(matchaCatalogProducts([set], reference), []);
});

test("unknown teas and sample-like titles remain ordinary catalog products", () => {
  const products = [
    product("unmapped-tea", "Sample Set"),
    product(`${reference.productHandle}-other`, "Sample Set"),
    product(reference.productHandle.toUpperCase(), "Sample Set"),
  ];
  assert.deepEqual(matchaCatalogProducts(products, reference), products);
});

test("without an offer mapping no published product is silently filtered", () => {
  const products = [product(reference.productHandle, "Sample Set")];
  assert.deepEqual(matchaCatalogProducts(products, null), products);
  assert.deepEqual(matchaCatalogProducts([], reference), []);
});
