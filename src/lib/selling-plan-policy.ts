import type { CatalogProductSummary } from "@jmm/shopify-storefront";
import { isStorefrontCurrency } from "./storefront-money.ts";
import {
  isOneKilogramOptions,
  isSampleJourneyProductHandle,
} from "./sample-journey.ts";

/** A local capability switch, separate from the unchanged checkout gates. */
export function sellingPlansEnabled(
  environment: Readonly<Record<string, string | undefined>>,
): boolean {
  return (
    environment.SHOPIFY_STOREFRONT_SELLING_PLANS_ENABLED === "true" &&
    (environment.NODE_ENV === "development" || environment.NODE_ENV === "test")
  );
}

/** Admit only the agreed 1 kg / four-week / regular-price recurring offer. */
export function approvedSellingPlanProduct(
  product: CatalogProductSummary,
): CatalogProductSummary {
  const candidates = product.variants.filter((variant) =>
    isOneKilogramOptions(variant.options),
  );
  const approvedVariant =
    isSampleJourneyProductHandle(product.handle) &&
    candidates.length === 1 &&
    product.variants.filter(
      (variant) => variant.reference === candidates[0]?.reference,
    ).length === 1
      ? candidates[0]
      : undefined;
  return {
    ...product,
    variants: product.variants.map((variant) => ({
      ...variant,
      sellingPlans:
        variant === approvedVariant
          ? (variant.sellingPlans ?? []).filter(
              (plan) =>
                plan.deliveryInterval === "week" &&
                plan.deliveryIntervalCount === 4 &&
                isStorefrontCurrency(plan.price.currency) &&
                plan.price.currency === variant.price.currency &&
                Number.isSafeInteger(plan.price.minorUnits) &&
                plan.price.minorUnits >= 0 &&
                !Object.is(plan.price.minorUnits, -0) &&
                plan.price.minorUnits === variant.price.minorUnits,
            )
          : [],
    })),
  };
}

type ProductReader = (handle: string) => Promise<CatalogProductSummary | null>;

/** Allocation access may fail independently of the ordinary published catalog. */
export async function readProductPurchaseOptions(
  handle: string,
  enabled: boolean,
  readBase: ProductReader,
  readWithPlans: ProductReader,
): Promise<CatalogProductSummary | null> {
  if (enabled && isSampleJourneyProductHandle(handle)) {
    try {
      const product = await readWithPlans(handle);
      // A successful unpublished result is authoritative, never a stale fallback.
      if (!product) return null;
      if (product.handle !== handle)
        throw new Error("Unexpected published product.");
      return approvedSellingPlanProduct(product);
    } catch {
      // A fresh one-time key may still resolve. A recurring key cannot match it.
    }
  }
  const product = await readBase(handle);
  return product
    ? {
        ...product,
        variants: product.variants.map((variant) => ({
          ...variant,
          sellingPlans: [],
        })),
      }
    : null;
}
