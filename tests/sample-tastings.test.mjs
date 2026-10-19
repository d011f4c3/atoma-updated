import assert from "node:assert/strict";
import test from "node:test";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import {
  emptyTastingDraft,
  isSampleTastingKey,
  parseSampleTastings,
  parseTastingDraft,
  serializeSampleTastings,
  tastingToDraft,
  TASTING_NOTES_LIMIT,
} from "../src/lib/sample-tastings.ts";

const record = (changes = {}) => ({
  preparation: "hot",
  matchaMg: 2250,
  waterMl: 70,
  milkMl: null,
  notes: "Whisked before tasting.",
  ...changes,
});
const draft = (changes = {}) => ({ ...emptyTastingDraft(), ...changes });
const stored = (records, version = 1) => JSON.stringify({ version, records });

test("a tasting needs an entered field and empty drafts are independent", () => {
  const first = emptyTastingDraft();
  assert.deepEqual(first, {
    preparation: "",
    matchaGrams: "",
    waterMl: "",
    milkMl: "",
    notes: "",
  });
  assert.equal(parseTastingDraft(first), null);
  assert.equal(parseTastingDraft(draft({ notes: " \n\t " })), null);
  first.notes = "Changed locally";
  assert.equal(emptyTastingDraft().notes, "");
  assert.deepEqual(
    parseTastingDraft(draft({ preparation: "iced" })),
    record({ preparation: "iced", matchaMg: null, waterMl: null, notes: "" }),
  );
  assert.equal(parseTastingDraft(draft({ waterMl: "0" })).waterMl, 0);
  assert.equal(
    parseTastingDraft(draft({ notes: "  A first impression.\n" })).notes,
    "  A first impression.\n",
  );
});

test("decimal gram doses convert exactly to bounded integer milligrams", () => {
  for (const [grams, milligrams] of [
    ["0.001", 1],
    ["0.029", 29],
    ["0.29", 290],
    ["1.005", 1005],
    ["2.5", 2500],
    ["2.500", 2500],
    ["999.999", 999999],
    ["1000", 1000000],
    ["1000.000", 1000000],
  ]) {
    const parsed = parseTastingDraft(draft({ matchaGrams: grams }));
    assert.equal(parsed?.matchaMg, milligrams, grams);
    assert.deepEqual(parseTastingDraft(tastingToDraft(parsed)), parsed);
  }
  for (const grams of [
    "0",
    "0.000",
    "1000.001",
    "1001",
    "1.2345",
    ".5",
    "1.",
    "1e2",
    "0x10",
    "+1",
    "-1",
    "NaN",
    "Infinity",
    " 2",
    "2 ",
    "1,5",
    "2\n",
  ]) {
    assert.equal(
      parseTastingDraft(draft({ preparation: "hot", matchaGrams: grams })),
      null,
      grams,
    );
  }
});

test("liquid amounts allow integer zero but never fractions or coercion", () => {
  const parsed = parseTastingDraft(draft({ waterMl: "0", milkMl: "10000" }));
  assert.equal(parsed.waterMl, 0);
  assert.equal(parsed.milkMl, 10000);
  for (const value of [
    "-1",
    "10001",
    "1.5",
    "1.0",
    "1e2",
    "+1",
    " 1",
    "1 ",
    "0x10",
    "NaN",
    "Infinity",
  ]) {
    for (const field of ["waterMl", "milkMl"])
      assert.equal(
        parseTastingDraft(draft({ notes: "Valid note", [field]: value })),
        null,
        `${field}: ${value}`,
      );
  }
});

test("notes preserve entered Unicode and line breaks within the fixed limit", () => {
  const notes = "🍵".repeat(TASTING_NOTES_LIMIT / 2);
  assert.equal(notes.length, 600);
  assert.equal(parseTastingDraft(draft({ notes })).notes, notes);
  assert.equal(parseTastingDraft(draft({ notes: `${notes}茶` })), null);
  assert.equal(
    parseTastingDraft(draft({ notes: "茶".repeat(600) })).notes.length,
    600,
  );
});

test("draft parsing rejects invalid runtime shapes instead of coercing them", () => {
  for (const value of [
    null,
    [],
    "hot",
    {},
    { ...draft(), unexpected: true },
    draft({ preparation: "boiling" }),
    draft({ matchaGrams: 2 }),
    draft({ waterMl: 70 }),
    draft({ milkMl: false }),
    draft({ notes: null }),
  ])
    assert.equal(parseTastingDraft(value), null);
  assert.deepEqual(tastingToDraft(), emptyTastingDraft());
  assert.deepEqual(tastingToDraft(null), emptyTastingDraft());
  assert.deepEqual(
    tastingToDraft(record({ matchaMg: 0 })),
    emptyTastingDraft(),
  );
});

test("all canonical sample teas round-trip independently in the versioned envelope", () => {
  const records = Object.fromEntries(
    SAMPLE_SET_CONTENTS.map(({ key }, index) => [
      key,
      record({
        notes: `Observation ${index}`,
        milkMl: index === 1 ? 150 : null,
      }),
    ]),
  );
  const value = serializeSampleTastings(records);
  assert.equal(JSON.parse(value).version, 1);
  assert.deepEqual(parseSampleTastings(value), records);
  assert.deepEqual(Object.keys(JSON.parse(value)), ["version", "records"]);
  for (const { key } of SAMPLE_SET_CONTENTS) {
    assert.equal(isSampleTastingKey(key), true);
    assert.deepEqual(
      parseTastingDraft(tastingToDraft(records[key])),
      records[key],
    );
  }
  assert.equal(isSampleTastingKey("sample-set"), false);
  assert.equal(isSampleTastingKey("toString"), false);
  assert.equal(isSampleTastingKey(null), false);
});

test("invalid, future and oversized storage envelopes return no records", () => {
  const valid = { ceremonial: record() };
  for (const value of [
    null,
    "",
    "not json",
    "null",
    "[]",
    "{}",
    stored(valid, 2),
    stored(valid, "1"),
    stored(null),
    stored([]),
    JSON.stringify({ records: valid }),
    JSON.stringify({ version: 1, records: valid, cart: {} }),
    " ".repeat(16385) + stored(valid),
  ])
    assert.deepEqual(
      parseSampleTastings(value),
      {},
      String(value).slice(0, 80),
    );
});

test("storage recovers only valid known records without trusting extra fields", () => {
  const parsed = parseSampleTastings(
    stored({
      ceremonial: record(),
      barista: record({ matchaMg: "2250" }),
      culinary: record({ priceMinor: 2900 }),
      unknown: record(),
      constructor: record(),
      __proto__: record(),
    }),
  );
  assert.deepEqual(parsed, { ceremonial: record() });
  assert.deepEqual(Object.keys(parsed), ["ceremonial"]);
  const poisoned =
    '{"version":1,"records":{"__proto__":{"polluted":true},"ceremonial":' +
    JSON.stringify(record()) +
    "}}";
  assert.deepEqual(parseSampleTastings(poisoned), { ceremonial: record() });
  assert.equal({}.polluted, undefined);
});

test("stored quantities and notes follow the same bounds as new drafts", () => {
  for (const changes of [
    { matchaMg: 0 },
    { matchaMg: -1 },
    { matchaMg: 1.5 },
    { matchaMg: 1000001 },
    { waterMl: -1 },
    { waterMl: 10001 },
    { waterMl: 0.5 },
    { milkMl: "0" },
    { preparation: "other" },
    { notes: "x".repeat(601) },
    { notes: [] },
    { preparation: "", matchaMg: null, waterMl: null, milkMl: null, notes: "" },
  ]) {
    assert.deepEqual(
      parseSampleTastings(stored({ ceremonial: record(changes) })),
      {},
      JSON.stringify(changes),
    );
    assert.equal(
      serializeSampleTastings({ ceremonial: record(changes) }),
      null,
    );
  }
  for (const value of [Infinity, NaN])
    assert.equal(
      serializeSampleTastings({ ceremonial: record({ matchaMg: value }) }),
      null,
    );
  assert.equal(
    serializeSampleTastings({ ceremonial: { preparation: "hot" } }),
    null,
  );
});

test("serialization rejects unknown keys and keeps only canonical tasting data", () => {
  assert.equal(serializeSampleTastings({ unknown: record() }), null);
  assert.equal(serializeSampleTastings({ "sample-set": record() }), null);
  assert.equal(serializeSampleTastings(null), null);
  assert.equal(serializeSampleTastings([]), null);
  assert.equal(serializeSampleTastings({ ceremonial: undefined }), null);
  assert.deepEqual(parseSampleTastings(serializeSampleTastings({})), {});
  const reverse = Object.fromEntries(
    [...SAMPLE_SET_CONTENTS].reverse().map(({ key }) => [key, record()]),
  );
  assert.deepEqual(
    Object.keys(JSON.parse(serializeSampleTastings(reverse)).records),
    SAMPLE_SET_CONTENTS.map(({ key }) => key),
  );
});

test("maximum escaped notes fit storage and parsed records are fresh copies", () => {
  const records = Object.fromEntries(
    SAMPLE_SET_CONTENTS.map(({ key }) => [
      key,
      record({ notes: "\u0000".repeat(600) }),
    ]),
  );
  const serialized = serializeSampleTastings(records);
  assert.ok(serialized.length < 16384);
  const parsed = parseSampleTastings(serialized);
  assert.deepEqual(parsed, records);
  parsed.ceremonial.notes = "Edited draft";
  assert.notEqual(records.ceremonial.notes, parsed.ceremonial.notes);
  assert.deepEqual(parseSampleTastings(serialized), records);
});
