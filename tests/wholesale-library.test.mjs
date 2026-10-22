import assert from "node:assert/strict";
import test from "node:test";
import { productCodeReferences } from "../src/lib/product-codes.ts";
import { translate } from "../src/lib/i18n/index.ts";
import {
  createWholesaleLibrary,
  searchWholesaleLibrary,
} from "../src/lib/wholesale-library.ts";

function variant(overrides = {}) {
  return {
    id: "one-kilogram",
    title: "1 kg",
    options: [{ name: "Size", value: "1 kg" }],
    priceMinor: 12000,
    currency: "USD",
    available: true,
    minimum: 1,
    increment: 1,
    maximum: null,
    ...overrides,
  };
}

function product(reference = productCodeReferences[0], overrides = {}) {
  return {
    id: reference.catalogHandle,
    handle: reference.catalogHandle,
    title: "Upstream product name",
    description: "",
    productCode: reference.code,
    productUrl: null,
    imageUrl: null,
    imageAlt: "",
    isFixture: true,
    variants: [variant()],
    ...overrides,
  };
}

test("library follows published range, excludes the set and keeps inputs intact", () => {
  const products = [
    product(productCodeReferences[2]),
    product(productCodeReferences[0]),
    product(undefined, { id: "samples", handle: "sample-set" }),
  ];
  const snapshot = structuredClone(products);
  const entries = createWholesaleLibrary(products);

  assert.deepEqual(
    entries.map((entry) => entry.productKey),
    ["culinary", "ceremonial"],
  );
  assert.equal(entries[0].name, "Culinary Matcha");
  assert.equal(entries[1].code, "WZKA-00");
  assert.equal(entries[1].profileKind, "sample");
  assert.equal(entries[1].product, products[1]);
  assert.equal(
    entries[1].href,
    `/shop/${encodeURIComponent(products[1].handle)}`,
  );
  assert.deepEqual(products, snapshot);
  assert.deepEqual(createWholesaleLibrary([]), []);
});

test("growing origin and tea designation remain distinct for the current range", () => {
  const entries = createWholesaleLibrary(
    productCodeReferences.map((reference) => product(reference)),
  );
  assert.deepEqual(entries[0].origin, { label: "Grown in", value: "Wazuka" });
  assert.deepEqual(entries[1].origin, {
    label: "Tea designation",
    value: "UJI",
  });
  assert.deepEqual(entries[2].origin, entries[1].origin);
  assert.deepEqual(
    searchWholesaleLibrary(entries, "Wazuka").map((entry) => entry.code),
    ["WZKA-00"],
  );
  assert.deepEqual(
    searchWholesaleLibrary(entries, "UJI designation").map(
      (entry) => entry.code,
    ),
    ["UJI-00", "UJI-01"],
  );
  assert.equal(searchWholesaleLibrary(entries, "Uji City").length, 0);
});

test("new products and study aliases never inherit profile or location claims", () => {
  const future = product(undefined, {
    id: "future",
    handle: "future-matcha",
    title: "Café No. 4 for Lattes",
    productCode: "NEW-04",
    imageUrl: "/images/new-published-matcha.webp",
    imageAlt: "Published product photograph",
  });
  const alias = product(undefined, {
    id: "alias",
    handle: "ceremonial-matcha",
    title: "Ceremonial Matcha",
    productCode: null,
  });
  const entries = createWholesaleLibrary([future, alias]);

  for (const entry of entries) {
    assert.equal(entry.productKey, undefined);
    assert.equal(entry.application, null);
    assert.equal(entry.flavour, null);
    assert.equal(entry.umami, null);
    assert.equal(entry.bitterness, null);
    assert.equal(entry.origin, null);
    assert.equal(entry.profileKind, null);
    assert.equal(entry.status, "ready");
    assert.equal(entry.offer.available, true);
  }
  assert.equal(entries[0].name, future.title);
  assert.equal(entries[0].code, "NEW-04");
  assert.equal(entries[0].materialImage, future.imageUrl);
  assert.equal(entries[0].materialAlt, future.imageAlt);
  assert.equal(entries[1].code, null);
  assert.equal(entries[1].materialImage, null);
  assert.deepEqual(searchWholesaleLibrary(entries, "Wazuka"), []);
  assert.equal(searchWholesaleLibrary(entries, "CAFE no. 4")[0], entries[0]);
});

test("code projection takes precedence while exact references supply missing codes", () => {
  const entries = createWholesaleLibrary([
    product(productCodeReferences[0], { productCode: null }),
    product(productCodeReferences[1], { productCode: " UJI-REVISED " }),
  ]);
  assert.equal(entries[0].code, "WZKA-00");
  assert.equal(entries[1].code, "UJI-REVISED");
});

test("duplicate handles fail closed without displacing an unrelated valid offer", () => {
  const [ceremonial, barista] = productCodeReferences;
  const entries = createWholesaleLibrary([
    product(ceremonial),
    product(ceremonial, { id: "duplicate" }),
    product(barista),
  ]);
  for (const entry of entries.slice(0, 2)) {
    assert.equal(entry.status, "ambiguous");
    assert.equal(entry.productKey, undefined);
    assert.equal(entry.offer, null);
    assert.equal(entry.href, null);
    assert.equal(entry.origin, null);
    assert.equal(entry.flavour, null);
  }
  assert.equal(entries[2].status, "ready");
  assert.equal(entries[2].offer.fromVariant.priceMinor, 12000);
});

test("published offers retain availability and prices per format without pack inference", () => {
  const [reference] = productCodeReferences;
  const entry = createWholesaleLibrary([
    product(reference, {
      variants: [
        variant({ id: "out-of-stock", available: false, priceMinor: 1 }),
        variant({ id: "one-kilogram", priceMinor: 12000 }),
        variant({ id: "two-kilograms", title: "2 kg", priceMinor: 22000 }),
      ],
    }),
  ])[0];
  assert.equal(entry.offer.fromVariant.id, "one-kilogram");
  assert.equal(entry.offer.fromVariant.priceMinor, 12000);
  assert.equal(entry.offer.fromVariant.currency, "USD");
  assert.equal(entry.offer.formats.length, 3);
  assert.equal(entry.offer.formats[0].available, false);

  const unavailable = createWholesaleLibrary([
    product(reference, { variants: [variant({ available: false })] }),
  ])[0];
  assert.equal(unavailable.offer.available, false);
  assert.equal(unavailable.offer.fromVariant, null);

  const unknownPack = createWholesaleLibrary([
    product(reference, {
      title: "1 kg in a title is not a verified format",
      variants: [variant({ title: "Default Title", options: [] })],
    }),
  ])[0];
  assert.equal(unknownPack.offer.formats[0].label, "Standard format");
});

test("search supports localized names, stable codes, applications and empty recovery", () => {
  const products = productCodeReferences.map((reference) => product(reference));
  for (const locale of ["en", "ja", "zh-Hans", "zh-Hant"]) {
    const entries = createWholesaleLibrary(products, locale);
    const tea = entries[0];
    assert.equal(tea.name, translate(locale, "Ceremonial Matcha"));
    assert.equal(tea.origin.label, translate(locale, "Grown in"));
    assert.equal(searchWholesaleLibrary(entries, tea.name)[0], tea);
    assert.equal(searchWholesaleLibrary(entries, "  wzka-00  ")[0], tea);
    assert.equal(searchWholesaleLibrary(entries, "tea service")[0], tea);
    assert.equal(
      searchWholesaleLibrary(entries, entries[1].application)[0],
      entries[1],
    );
    assert.equal(searchWholesaleLibrary(entries, "ceremonial wzka-00")[0], tea);
    assert.deepEqual(searchWholesaleLibrary(entries, "   "), entries);
    assert.deepEqual(searchWholesaleLibrary(entries, "not-in-the-library"), []);
    assert.deepEqual(searchWholesaleLibrary(entries, "barista WZKA-00"), []);
  }
});
