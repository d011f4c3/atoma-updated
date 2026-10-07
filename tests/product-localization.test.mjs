import assert from "node:assert/strict";
import test from "node:test";
import { getProductContent } from "../src/lib/product-content.ts";
import { getProductFacts } from "../src/lib/product-details.ts";
import { productName } from "../src/lib/product-name.ts";
import { productCodeReferences } from "../src/lib/product-codes.ts";
import { translate } from "../src/lib/i18n/index.ts";

const translatedLocales = ["zh-Hans", "zh-Hant", "ja"];

function editorialStrings(value, key = "") {
  if (typeof value === "string") {
    return ["id", "profileKind", "materialImage"].includes(key) ? [] : [value];
  }
  if (Array.isArray(value))
    return value.flatMap((item) => editorialStrings(item));
  return value
    ? Object.entries(value).flatMap(([name, item]) =>
        editorialStrings(item, name),
      )
    : [];
}

test("every product profile and the neutral fallback have complete editorial translations", () => {
  const products = [
    undefined,
    ...productCodeReferences.map(({ catalogHandle }) => ({
      title: "An upstream title in any language",
      handle: catalogHandle,
      description: "",
    })),
  ];
  for (const product of products) {
    const english = getProductContent(product);
    assert.deepEqual(getProductContent(product, "en"), english);
    for (const locale of translatedLocales) {
      for (const source of editorialStrings(english)) {
        assert.notEqual(
          translate(locale, source),
          source,
          `${locale}: ${source}`,
        );
      }
      const content = getProductContent(product, locale);
      assert.equal(content.materialImage, english.materialImage);
      assert.equal(content.profileKind, english.profileKind);
      assert.equal(content.originNote, null);
      assert.deepEqual(
        content.sections.map(({ id }) => id),
        english.sections.map(({ id }) => id),
      );
      assert.equal(
        content.materialProfile.length,
        english.materialProfile.length,
      );
      assert.equal(content.lookFor.length, english.lookFor.length);
      assert.deepEqual(
        getProductContent(product),
        english,
        "Translation never mutates the English source",
      );
    }
  }
});

test("translated names follow stable handles despite upstream titles or language changes", () => {
  for (const { catalogHandle, studyAliases } of productCodeReferences) {
    const product = {
      title: "Original title",
      handle: catalogHandle,
      description: "",
    };
    for (const locale of translatedLocales) {
      const expected = getProductContent(product, locale).name;
      assert.equal(
        productName("不相关的标题", catalogHandle, locale),
        expected,
      );
      for (const handle of studyAliases) {
        assert.equal(productName("別の商品名", handle, locale), expected);
      }
    }
  }
  assert.equal(
    productName("Unmapped Single Origin", "unmapped", "ja"),
    "Unmapped Single Origin",
  );
  const unknown = getProductContent(
    {
      title: "Unknown Matcha for an unpublished application",
      handle: "unmapped",
      description: "",
    },
    "zh-Hans",
  );
  assert.equal(unknown.application, "an unpublished application");
  assert.equal(unknown.labelUse, "AN UNPUBLISHED APPLICATION");
  assert.equal(unknown.originNote, null);
});

test("localized product records keep exact codes and provisional facts distinct", () => {
  for (const { catalogHandle, code } of productCodeReferences) {
    for (const locale of translatedLocales) {
      const facts = getProductFacts(catalogHandle, undefined, locale);
      assert.equal(facts.published.length, 1);
      assert.equal(facts.published[0].key, "productCode");
      assert.equal(facts.published[0].value, code);
      assert.notEqual(facts.published[0].label, "Product code");
      assert.deepEqual(
        facts.placeholders.map(({ key }) => key),
        ["ingredients", "storage", "shelfLife"],
      );
      for (const placeholder of facts.placeholders) {
        assert.equal(placeholder.status, "provisional");
        assert.equal(placeholder.value, translate(locale, "To be confirmed"));
      }
      assert.equal(
        facts.unpublishedNote,
        translate(
          locale,
          "Further product details are awaiting supplier confirmation.",
        ),
      );
    }
  }
});

test("localization neither rewrites supplied published facts nor exposes draft values", () => {
  const record = {
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
  const records = {
    example: {
      ...record,
      ingredients: {
        value: "Supplier-published wording",
        status: "published",
        source: "Reviewed source",
      },
      storage: {
        value: "Private draft",
        status: "draft",
        source: "Draft source",
      },
    },
  };
  for (const locale of translatedLocales) {
    const facts = getProductFacts("example", records, locale);
    assert.equal(facts.published[0].value, "Supplier-published wording");
    assert.deepEqual(
      facts.placeholders.map(({ key }) => key),
      ["storage", "shelfLife"],
    );
    assert.doesNotMatch(JSON.stringify(facts), /Private draft/);
  }
});
