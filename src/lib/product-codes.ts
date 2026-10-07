export type ProductKey = "ceremonial" | "barista" | "culinary";

/**
 * Public ATOMA product references approved in feedback §4 on 2026-10-06.
 * Codes identify products within a series, not quality ranks or provenance.
 * They do not replace Shopify references, merchant SKUs or JMM identity.
 * Keep catalog handles and presentation-study aliases explicit for later
 * Shopify-ID reconciliation; never derive a code from a title or list order.
 */
export const productCodeReferences: readonly Readonly<{
  productKey: ProductKey;
  code: string;
  catalogHandle: string;
  studyAliases: readonly string[];
  source: string;
}>[] = [
  {
    productKey: "ceremonial",
    code: "WZKA-00",
    catalogHandle:
      "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
    studyAliases: ["premium-matcha", "ceremonial-matcha"],
    source: "ATOMA website feedback, 2026-10-06, section 4: Product codes",
  },
  {
    productKey: "barista",
    code: "UJI-00",
    catalogHandle: "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
    studyAliases: ["barista-matcha"],
    source: "ATOMA website feedback, 2026-10-06, section 4: Product codes",
  },
  {
    productKey: "culinary",
    code: "UJI-01",
    catalogHandle: "jmm-storefront-test-matcha",
    studyAliases: ["culinary-matcha"],
    source: "ATOMA website feedback, 2026-10-06, section 4: Product codes",
  },
];

function getProductReference(handle: string) {
  return productCodeReferences.find(
    (reference) =>
      reference.catalogHandle === handle ||
      reference.studyAliases.includes(handle),
  );
}

/** Stable presentation identity; titles and code prefixes never select it. */
export function getProductKey(handle: string): ProductKey | undefined {
  return getProductReference(handle)?.productKey;
}

/** Exact known handles only; unsupported products remain without a code. */
export function getProductCode(handle: string): string | undefined {
  return getProductReference(handle)?.code;
}
