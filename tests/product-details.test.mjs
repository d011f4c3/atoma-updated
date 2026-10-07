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

const pendingNote =
  "Further product details are awaiting supplier confirmation.";
const placeholders = [
  {
    key: "ingredients",
    label: "Ingredients",
    value: "To be confirmed",
    status: "provisional",
  },
  {
    key: "storage",
    label: "Storage",
    value: "To be confirmed",
    status: "provisional",
  },
  {
    key: "shelfLife",
    label: "Shelf life",
    value: "To be confirmed",
    status: "provisional",
  },
];

test("approved product codes publish from the shared reference without inventing other facts", () => {
  const knownCodes = [
    [
      "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
      "WZKA-00",
    ],
    ["premium-matcha", "WZKA-00"],
    ["ceremonial-matcha", "WZKA-00"],
    ["test-only-japanese-barista-matcha-powder-for-lattes-1-kg", "UJI-00"],
    ["barista-matcha", "UJI-00"],
    ["jmm-storefront-test-matcha", "UJI-01"],
    ["culinary-matcha", "UJI-01"],
  ];
  for (const [handle, code] of knownCodes) {
    const details = getProductFacts(handle);
    assert.deepEqual(details.published, [
      { key: "productCode", label: "Product code", value: code },
    ]);
    assert.match(productFactRecords[handle].productCode.source, /2026-10-06/);
    assert.equal(details.unpublishedNote, pendingNote);
    assert.deepEqual(details.placeholders, placeholders);
    assert.equal(productFactRecords[handle].ingredients, null);
    assert.equal(productFactRecords[handle].storage, null);
    assert.equal(productFactRecords[handle].shelfLife, null);
  }
});

test("unknown product facts remain unpublished without inference from a handle", () => {
  for (const handle of [
    "premium-japanese-matcha",
    "organic-certified-SKU-001",
    "CULINARY-MATCHA",
    "ceremonial-matcha-2026",
    "__proto__",
    "unknown",
  ]) {
    const details = getProductFacts(handle);
    assert.deepEqual(details.published, []);
    assert.equal(details.unpublishedNote, pendingNote);
    assert.deepEqual(details.placeholders, placeholders);
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
  assert.equal(details.unpublishedNote, pendingNote);
  assert.deepEqual(details.placeholders, placeholders.slice(1));
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
  assert.deepEqual(details.placeholders, []);

  const partial = getProductFacts("matcha-one", {
    "matcha-one": { ...complete, evidence: null },
  });
  assert.equal(partial.published.length, 9);
  assert.equal(partial.unpublishedNote, pendingNote);
  assert.deepEqual(partial.placeholders, []);
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
    pendingNote,
  );
});

test("provisional rows never reveal draft, verified, unsourced or inherited supplier values", () => {
  const records = {
    "matcha-one": {
      ...emptyRecord,
      ingredients: fact("Private draft ingredients", "draft"),
      storage: fact("Private verified storage", "verified"),
      shelfLife: fact("Unsupported shelf life", "published", " "),
    },
  };
  const result = getProductFacts("matcha-one", records);
  assert.deepEqual(result.published, []);
  assert.deepEqual(result.placeholders, placeholders);
  assert.doesNotMatch(JSON.stringify(result), /Private|Unsupported/);
  const inherited = Object.create({
    "matcha-one": {
      ...emptyRecord,
      ingredients: fact("Inherited ingredients"),
      storage: fact("Inherited storage"),
      shelfLife: fact("Inherited shelf life"),
    },
  });
  assert.deepEqual(
    getProductFacts("matcha-one", inherited).placeholders,
    placeholders,
  );
});

test("reviewed publication replaces each provisional row without changing other placeholders", () => {
  for (const { key } of placeholders) {
    const records = {
      "matcha-one": { ...emptyRecord, [key]: fact(`Reviewed ${key}`) },
    };
    const result = getProductFacts("matcha-one", records);
    assert.deepEqual(
      result.placeholders,
      placeholders.filter((row) => row.key !== key),
    );
    assert.deepEqual(result.published, [
      {
        key,
        label: placeholders.find((row) => row.key === key).label,
        value: `Reviewed ${key}`,
      },
    ]);
    assert.equal(result.unpublishedNote, pendingNote);
    assert.equal(
      Object.values(records["matcha-one"]).some(
        (value) => value?.value === "To be confirmed",
      ),
      false,
    );
  }
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
