import type {
  CatalogSnapshot,
  CatalogVariantReference,
  CatalogSellingPlanReference,
} from "@jmm/shopify-storefront";
import type { Catalog, CatalogVariant } from "./catalog-types";
import { getProductCode } from "./product-codes.ts";
import { approvedSellingPlanProduct } from "./selling-plan-policy.ts";
import { isStorefrontCurrency } from "./storefront-money.ts";
import type { DestinationContext } from "./storefront-destination";

export const CATALOG_SHOP_DOMAIN = "h0cuaw-f7.myshopify.com";
export const CATALOG_SHOP_URL = `https://${CATALOG_SHOP_DOMAIN}`;

/** Unavailable and empty are different outcomes; never substitute fixtures. */
export function unavailableCatalog(): Catalog {
  return { status: "unavailable", products: [], shopUrl: CATALOG_SHOP_URL };
}

/** Map only the adapter's validated published projection, never vendor payloads. */
export function projectCatalog(
  snapshot: Readonly<CatalogSnapshot>,
  createVariantKey?: (
    reference: CatalogVariantReference,
    sellingPlanReference?: CatalogSellingPlanReference,
  ) => string,
  destination?: DestinationContext,
  createSelectionKey?: (
    reference: CatalogVariantReference,
    sellingPlanReference?: CatalogSellingPlanReference,
  ) => string,
): Catalog {
  const products = snapshot.products
    .map(approvedSellingPlanProduct)
    .map((product) => ({
      id: product.handle,
      title: product.title,
      description: product.description,
      imageUrl: safeImageUrl(product.image?.url ?? null),
      imageAlt: product.image?.altText ?? product.title,
      handle: product.handle,
      productCode: getProductCode(product.handle) ?? null,
      // All current products have verified null onlineStoreUrl. A route assembled
      // from a Headless handle would falsely imply Online Store publication.
      productUrl: null,
      isFixture: /\b(?:test[ -]?only|test|fixture|demo|placeholder)\b/i.test(
        `${product.title} ${product.description}`,
      ),
      variants: product.variants.map((variant, index) => {
        const { minimum, maximum, increment } = variant.quantityRule;
        if (
          !isStorefrontCurrency(variant.price.currency) ||
          variant.price.currency !== (destination?.currency ?? "JPY") ||
          !Number.isSafeInteger(variant.price.minorUnits) ||
          variant.price.minorUnits < 0 ||
          Object.is(variant.price.minorUnits, -0) ||
          !Number.isSafeInteger(minimum) ||
          !Number.isSafeInteger(increment) ||
          minimum < 1 ||
          increment < 1 ||
          minimum % increment !== 0 ||
          (maximum !== null &&
            (!Number.isSafeInteger(maximum) ||
              maximum < minimum ||
              maximum % increment !== 0))
        ) {
          throw new Error("Published catalog validation failed.");
        }
        return {
          // Local selection key, not a Shopify identifier or purchase credential.
          id:
            createVariantKey?.(variant.reference) ??
            `${product.handle}:variant-${index + 1}`,
          ...(createSelectionKey
            ? { selectionId: createSelectionKey(variant.reference) }
            : {}),
          title: variant.title,
          available:
            !product.requiresSellingPlan &&
            product.purchaseStatus === "purchasable" &&
            variant.purchaseStatus === "purchasable",
          priceMinor: variant.price.minorUnits,
          currency: variant.price.currency,
          options: variant.options.map(({ name, value }) => ({ name, value })),
          minimum,
          maximum,
          increment,
          ...(createVariantKey && variant.sellingPlans.length > 0
            ? {
                sellingPlans: variant.sellingPlans.map((plan) => ({
                  id: createVariantKey(variant.reference, plan.reference),
                  ...(createSelectionKey
                    ? {
                        selectionId: createSelectionKey(
                          variant.reference,
                          plan.reference,
                        ),
                      }
                    : {}),
                  name: plan.name,
                  description: plan.description,
                  deliveryInterval: "week" as const,
                  deliveryIntervalCount: 4 as const,
                  priceMinor: plan.price.minorUnits,
                  currency: plan.price.currency,
                  available:
                    product.purchaseStatus === "purchasable" &&
                    variant.purchaseStatus === "purchasable",
                })),
              }
            : {}),
        };
      }),
    }));

  return {
    status: products.length === 0 ? "empty" : "ready",
    products,
    shopUrl: CATALOG_SHOP_URL,
    ...(destination ? { destination } : {}),
  };
}

function safeImageUrl(value: string | null): string | null {
  if (value === null) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.hostname !== "cdn.shopify.com"
    ) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

/** Quantity totals are a display aid; Shopify still prices any future cart. */
export function catalogTotalMinor(
  variant: CatalogVariant,
  quantity: number,
): number | null {
  if (
    !Number.isSafeInteger(quantity) ||
    quantity < variant.minimum ||
    (quantity - variant.minimum) % variant.increment !== 0 ||
    (variant.maximum !== null && quantity > variant.maximum)
  ) {
    return null;
  }
  const total = variant.priceMinor * quantity;
  return Number.isSafeInteger(total) ? total : null;
}
