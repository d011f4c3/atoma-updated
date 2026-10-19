import assert from "node:assert/strict";
import test from "node:test";
import {
  isSampleJourneyProductHandle,
  oneKilogramProductUrl,
  parseSavedMatcha,
  resolveOneKilogramVariant,
  serializeSavedMatcha,
} from "../src/lib/sample-journey.ts";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { canPurchaseQuantity } from "../src/lib/product-selection.ts";

function variant(overrides = {}) {
  return {
    id: "current-signed-key",
    title: "1 kg",
    available: true,
    priceMinor: 12345,
    currency: "JPY",
    options: [{ name: "Size", value: "1 kg" }],
    minimum: 1,
    maximum: 6,
    increment: 1,
    ...overrides,
  };
}

const handle = SAMPLE_SET_CONTENTS[0].productHandle;

test("one kilogram resolves only exact canonical size options with ordinary spacing", () => {
  for (const name of ["Size", "Format", "Weight", "Net weight", " SIZE "]) {
    for (const value of [
      "1 kg",
      "1kg",
      "1 KG",
      " 1  kg ",
      "1\u00a0kg",
      "1000g",
      "1000 g",
    ]) {
      const current = variant({ options: [{ name, value }] });
      assert.equal(resolveOneKilogramVariant({ variants: [current] }), current);
    }
  }
});

test("a title, a case containing one-kilogram pouches, or an unrelated option cannot select a pack", () => {
  for (const value of [
    "200 g",
    "10 kg",
    "5 × 1 kg",
    "1 kg × 5",
    "1 kg pouch",
    "1kg / 200g",
    "1000 mg",
    "1000g + 30g",
    "1.0 kg",
    "1 kg subscription",
  ]) {
    assert.equal(
      resolveOneKilogramVariant({
        variants: [variant({ options: [{ name: "Size", value }] })],
      }),
      null,
    );
  }
  for (const options of [
    [],
    [{ name: "Title", value: "1 kg" }],
    [{ name: "Pack", value: "1 kg" }],
    [
      { name: "Size", value: "1 kg" },
      { name: "Case", value: "5 pouches" },
    ],
    [
      { name: "Size", value: "1 kg" },
      { name: "Size", value: "1 kg" },
    ],
  ]) {
    assert.equal(
      resolveOneKilogramVariant({ variants: [variant({ options })] }),
      null,
    );
  }
});

test("missing and ambiguous one-kilogram formats never substitute another variant", () => {
  const small = variant({
    id: "small",
    title: "200 g",
    options: [{ name: "Size", value: "200 g" }],
  });
  const kilogram = variant();
  for (const product of [
    null,
    undefined,
    { variants: [] },
    { variants: [small] },
    { variants: [kilogram, variant({ id: "second-kilogram" })] },
    {
      variants: [
        kilogram,
        variant({ id: "sold-out-kilogram", available: false }),
      ],
    },
    { variants: [kilogram, { ...small, id: kilogram.id }] },
  ]) {
    assert.equal(resolveOneKilogramVariant(product), null);
  }
  assert.equal(
    resolveOneKilogramVariant({ variants: [small, kilogram] }),
    kilogram,
  );
});

test("reordering retains the current price, availability, quantity rules and action key only", () => {
  const old = variant();
  const current = variant({
    id: "fresh-signed-key",
    priceMinor: 23456,
    minimum: 2,
    increment: 2,
    maximum: 4,
  });
  assert.equal(resolveOneKilogramVariant({ variants: [old] }), old);
  const resolved = resolveOneKilogramVariant({ variants: [current] });
  assert.equal(resolved, current);
  assert.equal(resolved.priceMinor, 23456);
  assert.equal(resolved.id, "fresh-signed-key");
  assert.equal(canPurchaseQuantity(resolved, 1), false);
  assert.equal(canPurchaseQuantity(resolved, 2), true);
  const soldOut = { ...current, available: false };
  assert.equal(resolveOneKilogramVariant({ variants: [soldOut] }), soldOut);
  assert.equal(canPurchaseQuantity(soldOut, 2), false);
});

test("saved choices and reorder URLs accept only the three canonical sample-content handles", () => {
  for (const item of SAMPLE_SET_CONTENTS) {
    assert.equal(isSampleJourneyProductHandle(item.productHandle), true);
    assert.equal(
      oneKilogramProductUrl(item.productHandle),
      `/shop/${item.productHandle}?format=1kg`,
    );
    const saved = serializeSavedMatcha(item.productHandle);
    assert.deepEqual(JSON.parse(saved), {
      version: 1,
      productHandle: item.productHandle,
    });
    assert.deepEqual(parseSavedMatcha(saved), {
      version: 1,
      productHandle: item.productHandle,
    });
  }
  for (const value of [
    "",
    "sample-set",
    "premium-matcha",
    handle.toUpperCase(),
    `${handle} `,
    `${handle}?price=1`,
    `${handle}/../samples`,
    "https://example.invalid/checkout",
    "//example.invalid",
  ]) {
    assert.equal(isSampleJourneyProductHandle(value), false);
    assert.equal(oneKilogramProductUrl(value), null);
    assert.equal(serializeSavedMatcha(value), null);
  }
});

test("untrusted device records cannot supply price, cart state, URLs or unknown schema fields", () => {
  const valid = { version: 1, productHandle: handle };
  for (const value of [
    null,
    "",
    "not json",
    "null",
    "1",
    JSON.stringify([valid]),
    JSON.stringify({ ...valid, version: 2 }),
    JSON.stringify({ ...valid, version: "1" }),
    JSON.stringify({ ...valid, productHandle: {} }),
    JSON.stringify({ ...valid, productHandle: "unknown" }),
    JSON.stringify({ productHandle: handle }),
    ...[
      "priceMinor",
      "quantity",
      "variantId",
      "cartId",
      "checkoutUrl",
      "url",
      "__proto__",
    ].map((key) => JSON.stringify({ ...valid, [key]: "untrusted" })),
    `${" ".repeat(512)}${JSON.stringify(valid)}`,
  ]) {
    assert.equal(parseSavedMatcha(value), null);
  }
  for (const value of [undefined, null, 1, [], {}, new String(handle)]) {
    assert.equal(isSampleJourneyProductHandle(value), false);
  }
});
