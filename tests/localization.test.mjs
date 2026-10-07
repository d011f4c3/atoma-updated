import assert from "node:assert/strict";
import test from "node:test";
import {
  locales,
  resolveLocale,
  translate,
  translationTables,
} from "../src/lib/i18n/index.ts";
import { localizedMetadata } from "../src/lib/i18n/metadata.ts";

const translatedLocales = ["zh-Hans", "zh-Hant", "ja"];
const dictionaryNames = ["shell", "products", "commerce", "origins"];

function placeholders(text) {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

test("locale preferences allow only the four approved languages with an English fallback", () => {
  assert.deepEqual(locales, ["en", "zh-Hans", "zh-Hant", "ja"]);
  for (const locale of locales) assert.equal(resolveLocale(locale), locale);
  for (const input of [
    undefined,
    null,
    "",
    "EN",
    "en-US",
    "zh",
    "zh-CN",
    "zh-TW",
    "ja-JP",
    "fr",
    "US",
    "SG",
    "JPY",
    "ja ",
    " zh-Hans",
    "__proto__",
    "constructor",
    "ja; Path=/",
    "<script>",
    {},
    ["ja"],
    0,
    false,
  ]) {
    assert.equal(resolveLocale(input), "en");
  }
});

test("every dictionary entry supplies all three translations without empty copy", () => {
  for (const [index, table] of translationTables.entries()) {
    assert.ok(Object.keys(table).length > 0, dictionaryNames[index]);
    for (const [source, entry] of Object.entries(table)) {
      assert.ok(source.trim(), `${dictionaryNames[index]} has an empty source`);
      assert.deepEqual(
        Object.keys(entry).sort(),
        [...translatedLocales].sort(),
        source,
      );
      for (const locale of translatedLocales) {
        assert.equal(typeof entry[locale], "string", `${locale}: ${source}`);
        assert.ok(entry[locale].trim(), `${locale}: ${source}`);
      }
    }
  }
});

test("source keys are unique across dictionaries and case-insensitive fallback", () => {
  const owners = new Map();
  const duplicates = [];
  for (const [index, table] of translationTables.entries()) {
    for (const source of Object.keys(table)) {
      const folded = source.toLowerCase();
      if (owners.has(folded)) {
        duplicates.push(
          `${source}: ${owners.get(folded)} / ${dictionaryNames[index]}`,
        );
      } else {
        owners.set(folded, dictionaryNames[index]);
      }
    }
  }
  assert.deepEqual(
    duplicates,
    [],
    `Ambiguous dictionary keys:\n${duplicates.join("\n")}`,
  );
});

test("translations preserve every interpolation placeholder and its multiplicity", () => {
  for (const table of translationTables) {
    for (const [source, entry] of Object.entries(table)) {
      for (const locale of translatedLocales) {
        assert.deepEqual(
          placeholders(entry[locale]),
          placeholders(source),
          `${locale}: ${source}`,
        );
      }
    }
  }
});

test("translation fallback and interpolation preserve supplied values and ignore inherited properties", () => {
  assert.equal(translate("en", "PRODUCT CODE"), "PRODUCT CODE");
  assert.equal(
    translate("ja", "PRODUCT CODE"),
    translate("ja", "Product code"),
  );
  assert.notEqual(translate("ja", "PRODUCT CODE"), "PRODUCT CODE");
  for (const locale of locales) {
    for (const source of [
      "Unmapped supplier wording",
      "__proto__",
      "constructor",
      "toString",
    ]) {
      assert.equal(translate(locale, source), source);
    }
    assert.equal(
      translate(locale, "Order {code}: {quantity} / {note}", {
        code: "UJI-00",
        quantity: 0,
        note: "",
      }),
      "Order UJI-00: 0 / ",
    );
    assert.equal(
      translate(locale, "Reference {reference}", {
        reference: "My kitchen / 1 kg / JPY {other}",
      }),
      "Reference My kitchen / 1 kg / JPY {other}",
    );
    assert.equal(translate(locale, "Unknown {missing}"), "Unknown {missing}");
    assert.equal(
      translate(
        locale,
        "Unknown {private}",
        Object.create({ private: "Inherited value" }),
      ),
      "Unknown {private}",
    );
    assert.equal(
      translate(locale, "{product} / Specifications", {
        product: "UJI-00",
      }).includes("UJI-00"),
      true,
    );
  }
});

test("localized metadata preserves the English baseline and only changes presentation text", () => {
  const baseline = {
    home: {
      title: "ATOMA — Matcha",
      description:
        "Matcha, clearly defined. A selection organised by profile, format and application, with precise specifications to guide your choice.",
    },
    shop: {
      title: "ATOMA — Shop matcha",
      description:
        "Explore the ATOMA matcha collection. Choose your format, quantity and matcha for the way you serve it.",
    },
    product: {
      title: "ATOMA — Matcha selection",
      description:
        "Explore the matcha, its specifications and origins. Choose your format and quantity.",
    },
  };
  for (const [page, english] of Object.entries(baseline)) {
    assert.deepEqual(localizedMetadata(page, "en"), english);
    for (const locale of translatedLocales) {
      const metadata = localizedMetadata(page, locale);
      assert.deepEqual(Object.keys(metadata).sort(), ["description", "title"]);
      assert.match(metadata.title, /^ATOMA/);
      assert.notEqual(metadata.title, english.title);
      assert.notEqual(metadata.description, english.description);
      assert.equal(metadata.title, translate(locale, english.title));
      assert.equal(
        metadata.description,
        translate(locale, english.description),
      );
      assert.deepEqual(localizedMetadata(page, "en"), english);
    }
  }
});
