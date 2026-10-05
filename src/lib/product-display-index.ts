export const PRODUCT_CODE_PLACEMENTS = [
  "eyebrow",
  "corner",
  "footline",
  "caption",
  "edge",
  "register",
  "tag",
] as const;

export type ProductCodePlacement = (typeof PRODUCT_CODE_PLACEMENTS)[number];

// Owner-requested display codes adopted from the study, never commerce keys
// or new evidence of product provenance. Explicit handles keep the index
// stable when the catalog changes order; unknown products receive no code.
const displayIndexes: Readonly<Record<string, string>> = {
  "jmm-storefront-test-matcha": "[WZKA-00]",
  "culinary-matcha": "[WZKA-00]",
  "test-only-japanese-barista-matcha-powder-for-lattes-1-kg": "[WZKA-01]",
  "barista-matcha": "[WZKA-01]",
  "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg": "[WZKA-02]",
  "premium-matcha": "[WZKA-02]",
  "ceremonial-matcha": "[WZKA-02]",
};

export function getProductDisplayIndex(handle: string): string | undefined {
  return Object.hasOwn(displayIndexes, handle)
    ? displayIndexes[handle]
    : undefined;
}
