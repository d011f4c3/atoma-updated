import type { ProductKey } from "./product-codes.ts";
import { SAMPLE_SET_CONTENTS } from "./sample-set.ts";

export const SAMPLE_TASTINGS_STORAGE_KEY = "atoma-sample-tastings-v1";
export const TASTING_NOTES_LIMIT = 600;
const maximumStorageLength = 16_384;

export type TastingRecord = Readonly<{
  preparation: "hot" | "iced" | "recipe" | "";
  matchaMg: number | null;
  waterMl: number | null;
  milkMl: number | null;
  notes: string;
}>;

export type TastingDraft = {
  preparation: TastingRecord["preparation"];
  matchaGrams: string;
  waterMl: string;
  milkMl: string;
  notes: string;
};

export type TastingRecords = Partial<Record<ProductKey, TastingRecord>>;

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fields(value: Record<string, unknown>, names: readonly string[]) {
  return (
    Object.keys(value).length === names.length &&
    names.every((name) => Object.hasOwn(value, name))
  );
}

function preparation(value: unknown): value is TastingRecord["preparation"] {
  return (
    value === "" || value === "hot" || value === "iced" || value === "recipe"
  );
}

function quantity(value: unknown, minimum: number, maximum: number) {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isInteger(value) &&
      value >= minimum &&
      value <= maximum)
  );
}

function validRecord(value: unknown): value is TastingRecord {
  return (
    object(value) &&
    fields(value, ["preparation", "matchaMg", "waterMl", "milkMl", "notes"]) &&
    preparation(value.preparation) &&
    quantity(value.matchaMg, 1, 1_000_000) &&
    quantity(value.waterMl, 0, 10_000) &&
    quantity(value.milkMl, 0, 10_000) &&
    typeof value.notes === "string" &&
    value.notes.length <= TASTING_NOTES_LIMIT &&
    (value.preparation !== "" ||
      value.matchaMg !== null ||
      value.waterMl !== null ||
      value.milkMl !== null ||
      value.notes.trim().length > 0)
  );
}

function copyRecord(record: TastingRecord): TastingRecord {
  return {
    preparation: record.preparation,
    matchaMg: record.matchaMg,
    waterMl: record.waterMl,
    milkMl: record.milkMl,
    notes: record.notes,
  };
}

export function isSampleTastingKey(value: unknown): value is ProductKey {
  return SAMPLE_SET_CONTENTS.some((item) => item.key === value);
}

export function emptyTastingDraft(): TastingDraft {
  return {
    preparation: "",
    matchaGrams: "",
    waterMl: "",
    milkMl: "",
    notes: "",
  };
}

export function tastingToDraft(record?: TastingRecord | null): TastingDraft {
  if (!validRecord(record)) return emptyTastingDraft();
  return {
    preparation: record.preparation,
    matchaGrams: record.matchaMg === null ? "" : String(record.matchaMg / 1000),
    waterMl: record.waterMl === null ? "" : String(record.waterMl),
    milkMl: record.milkMl === null ? "" : String(record.milkMl),
    notes: record.notes,
  };
}

/** Plain decimal grams become integer milligrams without floating rounding. */
export function parseTastingDraft(draft: TastingDraft): TastingRecord | null {
  if (
    !object(draft) ||
    !fields(draft, [
      "preparation",
      "matchaGrams",
      "waterMl",
      "milkMl",
      "notes",
    ]) ||
    !preparation(draft.preparation) ||
    typeof draft.matchaGrams !== "string" ||
    typeof draft.waterMl !== "string" ||
    typeof draft.milkMl !== "string" ||
    typeof draft.notes !== "string"
  )
    return null;
  if (
    draft.matchaGrams !== "" &&
    !/^\d{1,4}(?:\.\d{1,3})?$/.test(draft.matchaGrams)
  )
    return null;
  if (
    [draft.waterMl, draft.milkMl].some(
      (value) => value !== "" && !/^\d{1,5}$/.test(value),
    )
  )
    return null;
  const [whole = "0", fraction = ""] = draft.matchaGrams.split(".");
  const record: TastingRecord = {
    preparation: draft.preparation,
    matchaMg:
      draft.matchaGrams === ""
        ? null
        : Number(whole) * 1000 + Number(fraction.padEnd(3, "0")),
    waterMl: draft.waterMl === "" ? null : Number(draft.waterMl),
    milkMl: draft.milkMl === "" ? null : Number(draft.milkMl),
    notes: draft.notes,
  };
  return validRecord(record) ? record : null;
}

/** Recover valid tea records only; corrupt or future envelopes are not trusted. */
export function parseSampleTastings(value: string | null): TastingRecords {
  if (!value || value.length > maximumStorageLength) return {};
  try {
    const saved: unknown = JSON.parse(value);
    if (
      !object(saved) ||
      !fields(saved, ["version", "records"]) ||
      saved.version !== 1 ||
      !object(saved.records)
    )
      return {};
    const records: TastingRecords = {};
    for (const { key } of SAMPLE_SET_CONTENTS) {
      const record = saved.records[key];
      if (Object.hasOwn(saved.records, key) && validRecord(record))
        records[key] = copyRecord(record);
    }
    return records;
  } catch {
    return {};
  }
}

/** Only the versioned tasting fields are written, never offers or cart state. */
export function serializeSampleTastings(
  records: TastingRecords,
): string | null {
  if (
    !object(records) ||
    Object.keys(records).some((key) => !isSampleTastingKey(key))
  )
    return null;
  const canonical: TastingRecords = {};
  for (const { key } of SAMPLE_SET_CONTENTS) {
    if (!Object.hasOwn(records, key)) continue;
    const record = records[key];
    if (!validRecord(record)) return null;
    canonical[key] = copyRecord(record);
  }
  return JSON.stringify({ version: 1, records: canonical });
}
