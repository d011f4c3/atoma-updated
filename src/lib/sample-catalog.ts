import type { CatalogProduct } from "./catalog-types";
import {
  SAMPLE_SET_OFFER,
  type SampleSetOfferReference,
} from "./sample-set.ts";

/** Only the reviewed offer handle distinguishes the set from individual teas. */
export function isSampleSetHandle(
  handle: string | undefined,
  reference: SampleSetOfferReference | null = SAMPLE_SET_OFFER,
): boolean {
  return Boolean(
    reference?.productHandle && handle === reference.productHandle,
  );
}

/** Keep the published catalog intact for sample resolution and cart validation. */
export function matchaCatalogProducts(
  products: readonly CatalogProduct[],
  reference: SampleSetOfferReference | null = SAMPLE_SET_OFFER,
): CatalogProduct[] {
  return products.filter(
    (product) => !isSampleSetHandle(product.handle, reference),
  );
}
