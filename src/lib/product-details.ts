import type { CatalogProduct } from "./catalog-types";
import { productCodeReferences } from "./product-codes.ts";
import { translate, type Locale } from "./i18n/index.ts";

export type ProductFact = Readonly<{
  value: string;
  source: string;
  status: "draft" | "verified" | "published";
}>;

export type ProductFactRecord = Readonly<{
  productCode: ProductFact | null;
  ingredients: ProductFact | null;
  material: ProductFact | null;
  cultivar: ProductFact | null;
  harvest: ProductFact | null;
  lot: ProductFact | null;
  storage: ProductFact | null;
  shelfLife: ProductFact | null;
  certifications: ProductFact | null;
  evidence: ProductFact | null;
}>;

export type ProductFactRecords = Readonly<Record<string, ProductFactRecord>>;

// Presentation placeholders are never published supplier facts or commerce data.
const provisionalFields = ["ingredients", "storage", "shelfLife"] as const;

const factLabels = {
  productCode: "Product code",
  ingredients: "Ingredients",
  material: "Material",
  cultivar: "Cultivar",
  harvest: "Harvest",
  lot: "Lot",
  storage: "Storage",
  shelfLife: "Shelf life",
  certifications: "Certifications",
  evidence: "Supporting evidence",
} satisfies Record<keyof ProductFactRecord, string>;

const emptyRecord: ProductFactRecord = Object.freeze({
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
});

/** Publish only the approved code; other product facts still need evidence. */
export const productFactRecords: ProductFactRecords = Object.freeze(
  Object.fromEntries(
    productCodeReferences.flatMap((reference) =>
      [reference.catalogHandle, ...reference.studyAliases].map((handle) => [
        handle,
        Object.freeze({
          ...emptyRecord,
          productCode: Object.freeze({
            value: reference.code,
            source: reference.source,
            status: "published" as const,
          }),
        }),
      ]),
    ),
  ),
);

/** Exact product handles only: grade names and sample profiles are not evidence. */
export function getProductFacts(
  handle: string,
  records: ProductFactRecords = productFactRecords,
  locale: Locale = "en",
) {
  const record = Object.hasOwn(records, handle)
    ? (records[handle] ?? emptyRecord)
    : emptyRecord;
  const published: {
    key: keyof ProductFactRecord;
    label: string;
    value: string;
  }[] = [];
  const unpublished: (keyof ProductFactRecord)[] = [];

  for (const key of Object.keys(factLabels) as (keyof ProductFactRecord)[]) {
    const fact = record[key];
    if (
      fact?.status === "published" &&
      fact.value.trim() &&
      fact.source.trim()
    ) {
      published.push({
        key,
        label: translate(locale, factLabels[key]),
        value: fact.value.trim(),
      });
    } else {
      unpublished.push(key);
    }
  }

  return {
    published,
    placeholders: provisionalFields
      .filter((key) => unpublished.includes(key))
      .map((key) => ({
        key,
        label: translate(locale, factLabels[key]),
        value: translate(locale, "To be confirmed"),
        status: "provisional" as const,
      })),
    unpublishedNote: unpublished.length
      ? translate(
          locale,
          "Further product details are awaiting supplier confirmation.",
        )
      : null,
  };
}

/** Display the actual projected formats without deriving a pack size or stock. */
export function getProductFormats(product: CatalogProduct) {
  return product.variants.map((variant) => {
    const label =
      variant.title === "Default Title" ? "Standard format" : variant.title;
    const options = variant.options.filter(
      (option) =>
        option.value !== "Default Title" && option.value !== variant.title,
    );

    return {
      id: variant.id,
      label,
      options,
      available: variant.available,
      priceMinor: variant.priceMinor,
      currency: variant.currency,
    };
  });
}
