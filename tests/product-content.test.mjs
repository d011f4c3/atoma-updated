import assert from "node:assert/strict";
import test from "node:test";
import { getProductContent } from "../src/lib/product-content.ts";
import { getProductCode } from "../src/lib/product-codes.ts";
import { getOriginPreview } from "../src/lib/origin-preview.ts";

const products = [
  {
    handles: ["jmm-storefront-test-matcha", "culinary-matcha"],
    title: "Japanese Culinary Matcha Powder for Cafés & Baking — 1 kg",
    name: "Culinary Matcha",
    application: "Cafés & Baking",
    materialImage: "/images/matcha/culinary.jpg",
    code: "UJI-01",
  },
  {
    handles: [
      "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
      "barista-matcha",
    ],
    title: "Japanese Barista Matcha Powder for Lattes — 1 kg",
    name: "Barista Matcha",
    application: "Lattes",
    materialImage: "/images/matcha/latte.jpg",
    code: "UJI-00",
  },
  {
    handles: [
      "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
      "premium-matcha",
      "ceremonial-matcha",
    ],
    title: "Japanese Premium Matcha Powder for Tea Service — 1 kg",
    name: "Ceremonial Matcha",
    application: "Tea Service",
    materialImage: "/images/matcha/tea-service.jpg",
    code: "WZKA-00",
  },
];

const product = (handle, title) => ({ handle, title, description: "" });

test("exact product identities retain current English content across title changes and catalog order", () => {
  for (const order of [products, products.toReversed()]) {
    for (const expected of order) {
      // Existing literal-title behavior provides the current English baseline.
      const baseline = getProductContent(product("", expected.title));
      assert.equal(baseline.name, expected.name);
      assert.equal(baseline.application, expected.application);
      assert.equal(baseline.materialImage, expected.materialImage);
      assert.equal(baseline.materialProfile.length, 7);

      for (const handle of expected.handles) {
        for (const title of [
          expected.title,
          "抹茶・１キログラム",
          "Thé vert en poudre pour pâtisserie — 1 kg",
          "",
          "Unrelated Matcha for Tea Service",
          "Unrelated Matcha for Cafés & Baking",
          "Unrelated Matcha for Lattes",
        ]) {
          assert.deepEqual(getProductContent(product(handle, title)), baseline);
          assert.equal(getProductCode(handle), expected.code);
        }
      }
    }
  }
});

test("title changes cannot alter known product origin relationships or preview names", () => {
  for (const expected of products) {
    for (const handle of expected.handles) {
      const baseline = getOriginPreview(product(handle, expected.title));
      assert.equal(baseline.name, expected.name);
      assert.deepEqual(
        getOriginPreview(product(handle, "抹茶・１キログラム")),
        baseline,
      );
    }
  }
});

test("unknown handles and historical bag labels retain literal application content", () => {
  for (const handle of [
    "",
    "matcha-one",
    "culinary",
    "CULINARY-MATCHA",
    "barista-matcha ",
    "premium-matcha-2026",
  ]) {
    for (const expected of products) {
      const content = getProductContent(product(handle, expected.title));
      assert.equal(content.name, expected.name);
      assert.equal(content.application, expected.application);
      assert.equal(content.materialImage, expected.materialImage);
      assert.equal(getProductCode(handle), undefined);
    }
  }
  const bag = getProductContent(product("", "Barista Matcha for LATTES"));
  assert.equal(bag.application, "Lattes");
  assert.equal(bag.materialImage, "/images/matcha/latte.jpg");
});

test("unmapped names alone do not acquire an application or product-specific profile", () => {
  const general = getProductContent(undefined);
  assert.equal(general.name, "Your matcha");
  assert.equal(general.application, "Matcha selection");
  for (const title of ["Premium Matcha", "Culinary Matcha", "抹茶"]) {
    assert.deepEqual(getProductContent(product("unmapped", title)), {
      ...general,
      name: title === "Premium Matcha" ? "Ceremonial Matcha" : title,
    });
  }
  const unknown = getProductContent(
    product("unmapped", "Matcha for Frozen desserts — 1 kg"),
  );
  assert.equal(unknown.application, "Frozen desserts");
  assert.equal(unknown.labelUse, "FROZEN DESSERTS");
  assert.equal(unknown.materialImage, general.materialImage);
  assert.deepEqual(unknown.materialProfile, general.materialProfile);
});

test("inherited object keys cannot resolve application content", () => {
  const general = getProductContent(undefined);
  for (const application of ["constructor", "__proto__", "toString"]) {
    const content = getProductContent(
      product("unmapped", `Matcha for ${application}`),
    );
    assert.equal(content.application, application);
    assert.equal(content.labelUse, application.toUpperCase());
    assert.equal(content.materialImage, general.materialImage);
    assert.deepEqual(content.materialProfile, general.materialProfile);
    assert.equal(content.preparation, general.preparation);
  }
});
