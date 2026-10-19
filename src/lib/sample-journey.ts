import type { CatalogProduct, CatalogVariant } from "./catalog-types";
import { SAMPLE_SET_CONTENTS } from "./sample-set.ts";

export const SAVED_MATCHA_STORAGE_KEY = "atoma-saved-matcha-v1";

export type SavedMatcha = Readonly<{
  version: 1;
  productHandle: string;
}>;

const sizeOptionNames = new Set(["size", "format", "weight", "net weight"]);

export function isOneKilogramOptions(
  options: readonly Readonly<{ name: string; value: string }>[],
): boolean {
  if (options.length !== 1) return false;
  const option = options[0];
  return Boolean(
    option &&
    sizeOptionNames.has(option.name.trim().toLowerCase()) &&
    /^(?:1\s*kg|1000\s*g)$/iu.test(option.value.trim()),
  );
}

/** A route request names a pack, never a quantity of a differently sized pack. */
export function resolveOneKilogramVariant(
  product: Pick<CatalogProduct, "variants"> | null | undefined,
): CatalogVariant | null {
  if (!product) return null;
  const candidates = product.variants.filter((variant) => {
    // Additional dimensions could represent a case or another purchase choice.
    // Keep those choices explicit instead of guessing their pack semantics.
    return isOneKilogramOptions(variant.options);
  });
  const candidate = candidates[0];
  return candidates.length === 1 &&
    candidate &&
    product.variants.filter((variant) => variant.id === candidate.id).length ===
      1
    ? candidate
    : null;
}

export function isSampleJourneyProductHandle(value: unknown): value is string {
  return (
    typeof value === "string" &&
    SAMPLE_SET_CONTENTS.some((item) => item.productHandle === value)
  );
}

/** Build only a current canonical tea destination; no stored URL is trusted. */
export function oneKilogramProductUrl(productHandle: string): string | null {
  return isSampleJourneyProductHandle(productHandle)
    ? `/shop/${encodeURIComponent(productHandle)}?format=1kg`
    : null;
}

/** Device memory contains a tea choice only, never an old offer or cart action. */
export function parseSavedMatcha(value: string | null): SavedMatcha | null {
  if (!value || value.length > 512) return null;
  try {
    const record: unknown = JSON.parse(value);
    if (
      typeof record !== "object" ||
      record === null ||
      Array.isArray(record) ||
      Object.keys(record).length !== 2 ||
      !Object.hasOwn(record, "version") ||
      !Object.hasOwn(record, "productHandle")
    ) {
      return null;
    }
    const saved = record as Record<string, unknown>;
    return saved.version === 1 &&
      isSampleJourneyProductHandle(saved.productHandle)
      ? { version: 1, productHandle: saved.productHandle }
      : null;
  } catch {
    return null;
  }
}

export function serializeSavedMatcha(productHandle: string): string | null {
  return isSampleJourneyProductHandle(productHandle)
    ? JSON.stringify({ version: 1, productHandle })
    : null;
}
