import type { Catalog, CatalogProduct, CatalogVariant } from "./catalog-types";
import { productCodeReferences, type ProductKey } from "./product-codes.ts";

export type SampleSetContent = Readonly<{
  key: ProductKey;
  name: string;
  application: string;
  grams: 20;
  productHandle: string;
  productCode: string;
  image: string;
  imageAlt: string;
}>;

const content: Record<
  ProductKey,
  Pick<SampleSetContent, "name" | "application" | "image" | "imageAlt">
> = {
  ceremonial: {
    name: "Ceremonial Matcha",
    application: "Tea with water",
    image: "/images/matcha/tea-service.jpg",
    imageAlt:
      "A bright-green matcha powder swatch with a smooth vertical centre, fine ridges and scattered powder along its edges.",
  },
  barista: {
    name: "Barista Matcha",
    application: "For lattes",
    image: "/images/matcha/latte.jpg",
    imageAlt:
      "A vertical swatch of deep-green matcha powder, smoothed through the centre with loose granules at the edges.",
  },
  culinary: {
    name: "Culinary Matcha",
    application: "For recipes",
    image: "/images/matcha/culinary.jpg",
    imageAlt:
      "A vertical swatch of olive-green matcha powder with a smooth centre and loose powder around its edges.",
  },
};

/** Client update, 2026-10-19: three varieties × 20 g, not separate wholesale pouches. */
export const SAMPLE_SET_CONTENTS: readonly SampleSetContent[] =
  productCodeReferences.map((reference) => ({
    key: reference.productKey,
    ...content[reference.productKey],
    grams: 20,
    productHandle: reference.catalogHandle,
    productCode: reference.code,
  }));

/** Net tea weight only; this is not packed shipping weight. */
export const SAMPLE_SET_TOTAL_GRAMS = 60;

type VariantOptions = readonly Readonly<{ name: string; value: string }>[];

export type SampleSetOfferReference = Readonly<{
  productHandle: string;
  variants: readonly Readonly<{ options: VariantOptions }>[];
}>;

export type SampleSetOffer = {
  product: CatalogProduct;
  variants: CatalogVariant[];
};

/**
 * Client-approved Sample Set, 2026-10-19: three 20 g contents and this exact option.
 * The canonical sample-set handle is retained; obsolete 30 g formats cannot resolve.
 * This reference supplies no price or availability: only the published catalog
 * can resolve an offer. Matching titles and separate tea products cannot.
 */
export const SAMPLE_SET_OFFER: SampleSetOfferReference | null = {
  productHandle: "sample-set",
  variants: [{ options: [{ name: "Set", value: "3 × 20 g" }] }],
};

/** Resolve only reviewed formats against today's published catalog. */
export function resolveSampleSetOffer(
  catalog: Catalog | null | undefined,
  reference: SampleSetOfferReference | null = SAMPLE_SET_OFFER,
): SampleSetOffer | null {
  if (
    !reference ||
    !reference.productHandle ||
    !reference.variants.length ||
    catalog?.status !== "ready"
  ) {
    return null;
  }

  const products = catalog.products.filter(
    (product) => product.handle === reference.productHandle,
  );
  const product = products[0];
  if (products.length !== 1 || !product) return null;

  const variants: CatalogVariant[] = [];
  for (const reviewed of reference.variants) {
    if (!validOptions(reviewed.options)) return null;
    const matches = product.variants.filter(
      (variant) =>
        validOptions(variant.options) &&
        variant.options.length === reviewed.options.length &&
        reviewed.options.every((option) =>
          variant.options.some(
            (current) =>
              current.name === option.name && current.value === option.value,
          ),
        ),
    );
    const variant = matches[0];
    if (
      matches.length !== 1 ||
      !variant ||
      variants.some((selected) => selected.id === variant.id) ||
      product.variants.filter((current) => current.id === variant.id).length !==
        1
    ) {
      return null;
    }
    variants.push(variant);
  }

  // Retain authoritative price, availability, quantity rules and action keys.
  // The existing cart adapter revalidates them when the buyer adds the set.
  return { product, variants };
}

function validOptions(options: VariantOptions): boolean {
  return (
    options.length > 0 &&
    options.every(
      (option) => option.name.length > 0 && option.value.length > 0,
    ) &&
    new Set(options.map((option) => option.name)).size === options.length
  );
}
