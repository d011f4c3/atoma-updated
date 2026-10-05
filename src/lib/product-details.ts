import type { CatalogProduct } from "./catalog-types";

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

/** No reviewed product-specific factual records are published yet. */
export const productFactRecords: ProductFactRecords = Object.freeze({});

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

/** Exact product handles only: grade names and sample profiles are not evidence. */
export function getProductFacts(
  handle: string,
  records: ProductFactRecords = productFactRecords,
) {
  const record = Object.hasOwn(records, handle)
    ? (records[handle] ?? emptyRecord)
    : emptyRecord;
  const published: {
    key: keyof ProductFactRecord;
    label: string;
    value: string;
  }[] = [];
  const unpublished: string[] = [];

  for (const key of Object.keys(factLabels) as (keyof ProductFactRecord)[]) {
    const fact = record[key];
    if (
      fact?.status === "published" &&
      fact.value.trim() &&
      fact.source.trim()
    ) {
      published.push({ key, label: factLabels[key], value: fact.value.trim() });
    } else {
      unpublished.push(factLabels[key].toLocaleLowerCase("en"));
    }
  }

  const last = unpublished.at(-1);
  const missing =
    unpublished.length > 1
      ? `${unpublished.slice(0, -1).join(", ")} and ${last}`
      : last;
  const verb =
    unpublished.length === 1 &&
    last !== "ingredients" &&
    last !== "certifications"
      ? "has"
      : "have";

  return {
    published,
    unpublishedNote: missing
      ? `${missing[0]?.toLocaleUpperCase("en")}${missing.slice(1)} ${verb} not yet been published for this matcha.`
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
