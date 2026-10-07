import assert from "node:assert/strict";
import test from "node:test";
import { getOriginPreview } from "../src/lib/origin-preview.ts";
import { FIELD_ENTRIES } from "../src/lib/origins-content.ts";
import { ORIGINS_GRAPH } from "../src/lib/origins-model.ts";
import { translate } from "../src/lib/i18n/index.ts";

const nonEnglish = ["zh-Hans", "zh-Hant", "ja"];
const product = (handle) => ({ handle, title: "Localized catalog title" });

test("published Origins display copy has translations without modifying source records", () => {
  const source = JSON.stringify({ FIELD_ENTRIES, ORIGINS_GRAPH });
  const displayCopy = [
    ...ORIGINS_GRAPH.places.flatMap((place) => [place.name, place.description]),
    ...ORIGINS_GRAPH.types.map((type) => type.label),
    ...ORIGINS_GRAPH.designations.flatMap((designation) => [
      designation.summary,
      ...designation.explanation,
      designation.productNote,
    ]),
    ...FIELD_ENTRIES.flatMap((entry) => [
      entry.region,
      entry.title,
      entry.dek,
      entry.imageAlt,
      entry.imageCaption,
      ...Object.values(entry.photographsByPlace ?? {}).flatMap((photograph) => [
        photograph.imageAlt,
        photograph.imageCaption,
        photograph.observation,
      ]),
      ...entry.sections.flatMap((section) => [
        section.label,
        section.label.replace(/^\d+\s*\/\s*/, ""),
        ...section.body,
        section.imageAlt,
        section.imageCaption,
      ]),
    ]),
  ].filter(Boolean);
  for (const text of displayCopy) {
    for (const locale of nonEnglish) {
      assert.notEqual(translate(locale, text), text);
    }
  }
  assert.equal(JSON.stringify({ FIELD_ENTRIES, ORIGINS_GRAPH }), source);
});

test("localized previews retain origin identity and Kyoto photo context without supplying UJI growing claims", () => {
  const handles = ORIGINS_GRAPH.products.map((item) => item.productHandle);
  for (const handle of handles) {
    const english = getOriginPreview(product(handle));
    for (const locale of nonEnglish) {
      const localized = getOriginPreview(
        product(handle),
        undefined,
        undefined,
        locale,
      );
      assert.notEqual(localized.name, english.name);
      assert.deepEqual(
        localized.places.map((place) => place.id),
        english.places.map((place) => place.id),
      );
      assert.deepEqual(
        localized.designations.map((place) => place.id),
        english.designations.map((place) => place.id),
      );
      for (const [index, record] of [
        ...localized.places,
        ...localized.designations,
      ].entries()) {
        const original = [...english.places, ...english.designations][index];
        assert.equal(record.linkPlaceId, original.linkPlaceId);
        assert.equal(record.photograph.image, original.photograph.image);
        assert.equal(record.photograph.slug, original.photograph.slug);
        assert.equal(
          record.photograph.imageCaption,
          translate(locale, original.photograph.imageCaption),
        );
        assert.equal(record.path.length, original.path.length);
        assert.notEqual(record.description, original.description);
        if (record.kind === "designation") {
          assert.equal(localized.places.length, 0);
          assert.deepEqual(
            record.path.map(({ kind, name }) => [kind, name]),
            [
              ["country", translate(locale, "Japan")],
              ["region", translate(locale, "Kyoto")],
              ["locality", translate(locale, "Uji City")],
            ],
          );
          assert.equal(record.name, translate(locale, "Uji City"));
        }
      }
    }
  }
});
