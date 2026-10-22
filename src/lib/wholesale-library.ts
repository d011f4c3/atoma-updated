import type { CatalogProduct } from "./catalog-types";
import { translate, type Locale } from "./i18n/index.ts";
import { productCodeReferences, type ProductKey } from "./product-codes.ts";
import { getProductOfferSummary } from "./product-comparison.ts";
import { getProductContent } from "./product-content.ts";
import { matchaCatalogProducts } from "./sample-catalog.ts";

export type WholesaleLibraryEntry = Readonly<{
  product: CatalogProduct;
  productKey?: ProductKey;
  name: string;
  code: string | null;
  application: string | null;
  flavour: string | null;
  umami: string | null;
  bitterness: string | null;
  origin: Readonly<{ label: string; value: string }> | null;
  materialImage: string | null;
  materialAlt: string;
  profileKind: "sample" | null;
  offer: ReturnType<typeof getProductOfferSummary> | null;
  href: string | null;
  status: "ready" | "ambiguous";
  searchTerms: readonly string[];
}>;

/**
 * Published products own the collection. Only unique, exact catalog bindings
 * add authored profiles and approved origin context; historical study aliases
 * and familiar names must not acquire those claims. Unknown future products
 * retain their published identity, image and offers without invented metadata.
 */
export function createWholesaleLibrary(
  products: readonly CatalogProduct[],
  locale: Locale = "en",
): WholesaleLibraryEntry[] {
  const matchas = matchaCatalogProducts(products);
  const counts = new Map<string, number>();
  for (const product of matchas) {
    counts.set(product.handle, (counts.get(product.handle) ?? 0) + 1);
  }

  return matchas.map((product) => {
    const unique = counts.get(product.handle) === 1;
    const reference = unique
      ? productCodeReferences.find(
          (entry) => entry.catalogHandle === product.handle,
        )
      : undefined;
    const english = reference ? getProductContent(product) : null;
    const content = reference ? getProductContent(product, locale) : null;
    const name = content?.name ?? product.title;
    const code = product.productCode?.trim() || reference?.code || null;
    const originSource = reference
      ? reference.productKey === "ceremonial"
        ? { label: "Grown in", value: "Wazuka" }
        : { label: "Tea designation", value: "UJI" }
      : null;
    const origin = originSource
      ? {
          label: translate(locale, originSource.label),
          value: translate(locale, originSource.value),
        }
      : null;
    const profileValue = (label: string) => {
      const value = english?.materialProfile.find(
        (property) => property.label === label,
      )?.value;
      return value ? translate(locale, value) : null;
    };

    return {
      product,
      productKey: reference?.productKey,
      name,
      code,
      application: content?.application ?? null,
      flavour: profileValue("Flavour"),
      umami: profileValue("Umami"),
      bitterness: profileValue("Bitterness"),
      origin,
      materialImage: content?.materialImage ?? product.imageUrl,
      materialAlt: content?.materialImageAlt ?? product.imageAlt,
      profileKind: content?.profileKind ?? null,
      offer: unique ? getProductOfferSummary(product) : null,
      href: unique ? `/shop/${encodeURIComponent(product.handle)}` : null,
      status: unique ? "ready" : "ambiguous",
      searchTerms: [
        name,
        code,
        content?.application,
        english?.name,
        english?.application,
        origin?.label,
        origin?.value,
        originSource?.label,
        originSource?.value,
      ].filter((term): term is string => Boolean(term)),
    };
  });
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en")
    .trim();
}

/** All query words must match; a blank query restores the complete collection. */
export function searchWholesaleLibrary(
  entries: readonly WholesaleLibraryEntry[],
  query: string,
): WholesaleLibraryEntry[] {
  const terms = normalizeSearch(query).split(/\s+/u).filter(Boolean);
  if (!terms.length) return [...entries];

  return entries.filter((entry) => {
    const searchable = normalizeSearch(entry.searchTerms.join(" "));
    return terms.every((term) => searchable.includes(term));
  });
}
