import type { CatalogProduct } from "./catalog-types";
import {
  initialSelection,
  refreshedSelection,
  type Selection,
} from "./product-selection.ts";
import { resolveOneKilogramVariant } from "./sample-journey.ts";

/**
 * Entry intent is applied once. Subsequent reads refresh the local choice,
 * including an explicitly chosen replacement for an unavailable requested pack.
 */
export function productEntrySelection({
  products,
  current,
  saved,
  initialProductHandle,
  initialFormat,
}: {
  products: CatalogProduct[];
  current: Selection | null;
  saved: Selection | null;
  initialProductHandle?: string;
  initialFormat?: "1kg";
}): Selection {
  if (current?.productId) {
    const product = products.find((item) => item.id === current.productId);
    return product ? refreshedSelection(product, current) : current;
  }

  const product =
    products.find((item) => item.handle === initialProductHandle) ??
    (!initialProductHandle
      ? products.find((item) => item.id === saved?.productId)
      : undefined) ??
    products[0];
  if (!product) return { productId: "", variantId: "", quantity: 1 };

  // An explicit pack request takes precedence over an earlier homepage choice.
  // Missing/ambiguous packs retain an empty format, never another pack's offer.
  if (initialFormat === "1kg") {
    const variant = resolveOneKilogramVariant(product);
    return {
      productId: product.id,
      variantId: variant?.id ?? "",
      ...(variant?.selectionId
        ? { variantSelectionId: variant.selectionId }
        : {}),
      quantity: variant?.minimum ?? 1,
    };
  }

  // Keep unavailable/missing saved intent visible for an explicit replacement.
  // Purchase eligibility is still checked against the current catalog.
  return saved?.productId === product.id
    ? refreshedSelection(product, saved)
    : initialSelection(product);
}
