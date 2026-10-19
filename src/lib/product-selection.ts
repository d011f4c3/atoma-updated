import type { CatalogProduct, CatalogVariant } from "./catalog-types";
import { formatStorefrontMoney } from "./storefront-money.ts";

export type Selection = {
  productId: string;
  variantId: string;
  variantSelectionId?: string;
  quantity: number;
  sellingPlanKey?: string | null;
  sellingPlanSelectionId?: string | null;
};

export function initialSelection(product: CatalogProduct): Selection {
  const variant =
    product.variants.find((item) => item.available) ?? product.variants[0];
  return {
    productId: product.id,
    variantId: variant?.id ?? "",
    ...(variant?.selectionId
      ? { variantSelectionId: variant.selectionId }
      : {}),
    quantity: variant?.minimum ?? 1,
  };
}

/** Restore only a choice still permitted by the freshly read catalog. */
export function restoredSelection(
  product: CatalogProduct,
  saved: Selection | null,
): Selection {
  if (saved?.productId !== product.id) return initialSelection(product);
  const variant = product.variants.find((item) => item.id === saved.variantId);
  if (saved.sellingPlanKey) {
    const purchase = resolvePurchaseVariant(variant, saved.sellingPlanKey);
    return {
      productId: product.id,
      variantId: saved.variantId,
      sellingPlanKey: saved.sellingPlanKey,
      quantity:
        purchase && canPurchaseQuantity(purchase, saved.quantity)
          ? saved.quantity
          : (variant?.minimum ?? 1),
    };
  }
  if (!variant?.available) return initialSelection(product);
  return {
    productId: product.id,
    variantId: variant.id,
    quantity: canPurchaseQuantity(variant, saved.quantity)
      ? saved.quantity
      : variant.minimum,
  };
}

/** Keep the current intent while replacing only context-bound purchase keys. */
export function refreshedSelection(
  product: CatalogProduct,
  saved: Selection,
): Selection {
  if (product.id !== saved.productId) return saved;
  const variant = product.variants.find((item) =>
    saved.variantSelectionId
      ? item.selectionId === saved.variantSelectionId
      : item.id === saved.variantId,
  );
  if (!variant) return saved;
  const plan = saved.sellingPlanKey
    ? variant.sellingPlans?.find((item) =>
        saved.sellingPlanSelectionId
          ? item.selectionId === saved.sellingPlanSelectionId
          : item.id === saved.sellingPlanKey,
      )
    : undefined;
  return {
    ...saved,
    variantId: variant.id,
    ...(variant.selectionId ? { variantSelectionId: variant.selectionId } : {}),
    ...(saved.sellingPlanKey
      ? {
          sellingPlanKey: plan?.id ?? saved.sellingPlanKey,
          ...(plan?.selectionId
            ? { sellingPlanSelectionId: plan.selectionId }
            : {}),
        }
      : {}),
  };
}

/** A lost recurring choice must be explicitly replaced, never silently downgraded. */
export function resolvePurchaseVariant(
  variant: CatalogVariant | undefined,
  sellingPlanKey: string | null,
): CatalogVariant | undefined {
  if (!variant || !sellingPlanKey) return variant;
  const matches =
    variant.sellingPlans?.filter((plan) => plan.id === sellingPlanKey) ?? [];
  const plan = matches.length === 1 ? matches[0] : undefined;
  return plan
    ? {
        ...variant,
        id: plan.id,
        priceMinor: plan.priceMinor,
        currency: plan.currency,
        available: plan.available,
      }
    : undefined;
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
  return formatStorefrontMoney({ minorUnits: amount, currency });
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
