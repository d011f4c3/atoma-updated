import type { CatalogProduct, CatalogVariant } from "./catalog-types";

export type Selection = {
  productId: string;
  variantId: string;
  quantity: number;
};

export function initialSelection(product: CatalogProduct): Selection {
  const variant =
    product.variants.find((item) => item.available) ?? product.variants[0];
  return {
    productId: product.id,
    variantId: variant?.id ?? "",
    quantity: variant?.minimum ?? 1,
  };
}

export function quantityCeiling(variant: CatalogVariant): number {
  const safeMoneyQuantity =
    variant.priceMinor === 0
      ? Number.MAX_SAFE_INTEGER
      : Math.floor(Number.MAX_SAFE_INTEGER / variant.priceMinor);
  const ceiling = Math.min(
    variant.maximum ?? Number.MAX_SAFE_INTEGER,
    safeMoneyQuantity,
    2_147_483_647,
  );
  return (
    variant.minimum +
    Math.floor((ceiling - variant.minimum) / variant.increment) *
      variant.increment
  );
}

export function money(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amount / 10 ** digits);
}

/** Client eligibility is a display guard; the server rechecks each purchase. */
export function canPurchaseQuantity(
  variant: CatalogVariant | undefined,
  quantity: number,
): boolean {
  return Boolean(
    variant?.available &&
    Number.isSafeInteger(quantity) &&
    quantity >= variant.minimum &&
    (quantity - variant.minimum) % variant.increment === 0 &&
    quantity <= quantityCeiling(variant) &&
    Number.isSafeInteger(variant.priceMinor * quantity),
  );
}
