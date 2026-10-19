import { getProductKey, type ProductKey } from "./product-codes.ts";

export type ShopCategory = "all" | ProductKey;

export const SHOP_CATEGORIES: readonly Readonly<{
  value: ShopCategory;
  label: string;
}>[] = [
  { value: "all", label: "All matcha" },
  { value: "ceremonial", label: "Ceremonial" },
  { value: "barista", label: "Barista" },
  { value: "culinary", label: "Culinary" },
];

/** Category is presentation identity, never a title, grade or origin guess. */
export function matchesShopCategory(
  handle: string,
  category: ShopCategory,
): boolean {
  return category === "all" || getProductKey(handle) === category;
}
