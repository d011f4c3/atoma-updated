import assert from "node:assert/strict";
import test from "node:test";
import {
  getProductFacts,
  getProductFormats,
  productFactRecords,
} from "../src/lib/product-details.ts";

const emptyRecord = {
  productCode: null,
  ingredients: null,
  material: null,
  cultivar: null,
  harvest: null,
  lot: null,
  storage: null,
  shelfLife: null,
  certifications: null,
  evidence: null,
};

function fact(value, status = "published", source = "Reviewed test source") {
  return { value, status, source };
}

test("current product facts remain unpublished without inference from a handle", () => {
  assert.deepEqual(productFactRecords, {});
  for (const handle of [
    "culinary-matcha",
    "premium-japanese-matcha",
    "organic-certified-SKU-001",
    "unknown",
  ]) {
    const details = getProductFacts(handle);
    assert.deepEqual(details.published, []);
    assert.equal(
      details.unpublishedNote,
      "Product code, ingredients, material, cultivar, harvest, lot, storage, shelf life, certifications and supporting evidence have not yet been published for this matcha.",
    );
  }
});

test("factual content requires exact handle, publication and a nonblank source", () => {
  const records = {
    "matcha-one": {
      ...emptyRecord,
      productCode: fact("Reviewed product code"),
      ingredients: fact("Reviewed ingredients"),
      material: fact("Draft material", "draft"),
      cultivar: fact("Private verified cultivar", "verified"),
      harvest: fact("Unsupported harvest", "published", "  "),
      storage: fact("  "),
      certifications: fact("Unsupported certification", "published", "  "),
    },
  };
  const details = getProductFacts("matcha-one", records);
  assert.deepEqual(details.published, [
    {
      key: "productCode",
      label: "Product code",
      value: "Reviewed product code",
    },
    { key: "ingredients", label: "Ingredients", value: "Reviewed ingredients" },
  ]);
  assert.doesNotMatch(details.unpublishedNote, /ingredients/i);
  assert.match(details.unpublishedNote, /^Material, cultivar, harvest/);
  assert.deepEqual(getProductFacts("MATCHA-ONE", records).published, []);
  assert.deepEqual(getProductFacts("matcha-two", records).published, []);
  assert.deepEqual(getProductFacts("toString", records).published, []);
});

test("unpublished and inherited records never become product facts", () => {
  const inherited = Object.create({
    "matcha-one": { ...emptyRecord, ingredients: fact("Inherited claim") },
  });
  assert.deepEqual(getProductFacts("matcha-one", inherited).published, []);
  const revoked = {
    "matcha-one": {
      ...emptyRecord,
      ingredients: fact("Revoked claim", "draft"),
    },
  };
  assert.deepEqual(getProductFacts("matcha-one", revoked).published, []);
});

test("published facts render selectively without blank rows or stale missing labels", () => {
  const complete = Object.fromEntries(
    Object.keys(emptyRecord).map((key) => [key, fact(`Reviewed ${key}`)]),
  );
  const details = getProductFacts("matcha-one", { "matcha-one": complete });
  assert.equal(details.published.length, 10);
  assert.equal(details.unpublishedNote, null);

  const partial = getProductFacts("matcha-one", {
    "matcha-one": { ...complete, evidence: null },
  });
  assert.equal(partial.published.length, 9);
  assert.equal(
    partial.unpublishedNote,
    "Supporting evidence has not yet been published for this matcha.",
  );
});

test("product codes and certifications require sourced publication and retain exact values", () => {
  const record = {
    ...emptyRecord,
    productCode: fact("  Reviewed-Code/001  "),
    certifications: fact("Reviewed certificate · limited scope"),
  };
  const details = getProductFacts("matcha-one", { "matcha-one": record });
  assert.deepEqual(details.published, [
    { key: "productCode", label: "Product code", value: "Reviewed-Code/001" },
    {
      key: "certifications",
      label: "Certifications",
      value: "Reviewed certificate · limited scope",
    },
  ]);
  assert.doesNotMatch(details.unpublishedNote, /product code|certifications/i);
  const unpublished = getProductFacts("matcha-one", {
    "matcha-one": {
      ...record,
      productCode: { ...record.productCode, status: "draft" },
      certifications: { ...record.certifications, status: "verified" },
    },
  });
  assert.deepEqual(unpublished.published, []);

  const complete = Object.fromEntries(
    Object.keys(emptyRecord).map((key) => [key, fact(`Reviewed ${key}`)]),
  );
  assert.equal(
    getProductFacts("matcha-one", {
      "matcha-one": { ...complete, certifications: null },
    }).unpublishedNote,
    "Certifications have not yet been published for this matcha.",
  );
});

test("formats keep canonical options, money and actual per-variant availability", () => {
  const product = {
    title: "Matcha — 1 kg",
    variants: [
      {
        id: "small",
        title: "250 g",
        available: true,
        priceMinor: 2499,
        currency: "JPY",
        options: [
          { name: "Size", value: "250 g" },
          { name: "Pack", value: "Pouch" },
        ],
      },
      {
        id: "large",
        title: "2 kg",
        available: false,
        priceMinor: 18350,
        currency: "JPY",
        options: [{ name: "Size", value: "2 kg" }],
      },
    ],
  };
  const original = structuredClone(product);
  assert.deepEqual(getProductFormats(product), [
    {
      id: "small",
      label: "250 g",
      available: true,
      priceMinor: 2499,
      currency: "JPY",
      options: [{ name: "Pack", value: "Pouch" }],
    },
    {
      id: "large",
      label: "2 kg",
      available: false,
      options: [],
      priceMinor: 18350,
      currency: "JPY",
    },
  ]);
  assert.deepEqual(product, original);
});

test("default and missing variants do not manufacture a format from the title", () => {
  assert.deepEqual(
    getProductFormats({
      title: "Matcha — 1 kg",
      variants: [
        {
          id: "default",
          title: "Default Title",
          available: false,
          priceMinor: 0,
          currency: "JPY",
          options: [{ name: "Title", value: "Default Title" }],
        },
      ],
    }),
    [
      {
        id: "default",
        label: "Standard format",
        available: false,
        priceMinor: 0,
        currency: "JPY",
        options: [],
      },
    ],
  );
  assert.deepEqual(getProductFormats({ variants: [] }), []);
});
