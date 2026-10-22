import type { CatalogProduct, CatalogVariant } from "./catalog-types";
import { productCodeReferences } from "./product-codes.ts";
import { getProductContent } from "./product-content.ts";
import { getProductFormats } from "./product-details.ts";
import { translate, type Locale } from "./i18n/index.ts";
import { isStorefrontCurrency } from "./storefront-money.ts";

export function hasDisplayPrice(
  variant: Pick<CatalogVariant, "priceMinor" | "currency">,
): boolean {
  return (
    isStorefrontCurrency(variant.currency) &&
    Number.isSafeInteger(variant.priceMinor) &&
    variant.priceMinor >= 0 &&
    !Object.is(variant.priceMinor, -0)
  );
}

/** Prices are per published format; unavailable formats never set the starting price. */
export function getProductOfferSummary(product: CatalogProduct) {
  const available = product.variants.filter((variant) => variant.available);
  const currency = available[0]?.currency;
  const comparable = available.every(
    (variant) => hasDisplayPrice(variant) && variant.currency === currency,
  );
  return {
    available: available.length > 0,
    formats: getProductFormats(product),
    fromVariant: comparable
      ? available.reduce<CatalogVariant | null>(
          (lowest, variant) =>
            !lowest || variant.priceMinor < lowest.priceMinor
              ? variant
              : lowest,
          null,
        )
      : null,
  };
}

export function productFormatLabel(
  format: ReturnType<typeof getProductFormats>[number],
  locale: Locale,
): string {
  return [
    translate(locale, format.label),
    ...format.options.map(
      (option) => `${translate(locale, option.name)}: ${option.value}`,
    ),
  ].join(" · ");
}

/**
 * The known range supplies editorial comparison only. A unique exact canonical
 * catalog record supplies the offer and route; a study alias is not an offer.
 */
export function getProductComparison(
  products: readonly CatalogProduct[],
  locale: Locale = "en",
) {
  return productCodeReferences.map((reference) => {
    const matches = products.filter(
      (product) => product.handle === reference.catalogHandle,
    );
    const product = matches.length === 1 ? matches[0] : undefined;
    const identity = product ?? {
      handle: reference.catalogHandle,
      title: "",
      description: "",
    };
    const content = getProductContent(identity, locale);
    const english = getProductContent(identity);
    const profileValue = (label: string) => {
      const value = english.materialProfile.find(
        (property) => property.label === label,
      )?.value;
      return value ? translate(locale, value) : null;
    };

    return {
      key: reference.productKey,
      code: reference.code,
      name: content.name,
      application: content.application,
      flavour: profileValue("Flavour"),
      colour: profileValue("Colour"),
      profileKind: content.profileKind,
      status: product
        ? ("ready" as const)
        : matches.length > 1
          ? ("ambiguous" as const)
          : ("missing" as const),
      offer: product ? getProductOfferSummary(product) : null,
      href: product ? `/shop/${encodeURIComponent(product.handle)}` : null,
    };
  });
}
