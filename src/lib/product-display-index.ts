import { getProductCode } from "./product-codes.ts";

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

/** Brackets belong to the UI; the shared public reference remains a bare code. */
export function getProductDisplayIndex(handle: string): string | undefined {
  const code = getProductCode(handle);
  return code ? `[${code}]` : undefined;
}
