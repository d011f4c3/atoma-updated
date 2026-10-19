/** Launch destinations; country selection is independent of display language. */
export const SHIPPING_COUNTRIES = ["US", "SG"] as const;
export type ShippingCountryCode = (typeof SHIPPING_COUNTRIES)[number];
export type StorefrontCurrency = "JPY" | "USD" | "SGD";

export type DestinationPreference = Readonly<{
  countryCode: ShippingCountryCode;
  source: "manual" | "ip" | "default";
}>;

/** Currency is supplied by Shopify, never inferred from the country label. */
export type DestinationContext = Readonly<{
  countryCode: ShippingCountryCode;
  currency: StorefrontCurrency;
}>;

export const DESTINATION_COOKIE = "atoma-shipping-country";

export function parseShippingCountry(
  value: unknown,
): ShippingCountryCode | null {
  return value === "US" || value === "SG" ? value : null;
}

export function resolveDestinationPreference(
  saved: unknown,
  hint: unknown,
  trustHint: boolean,
): DestinationPreference {
  const manual = parseShippingCountry(saved);
  if (manual) return { countryCode: manual, source: "manual" };
  const suggested = trustHint ? parseShippingCountry(hint) : null;
  if (suggested) return { countryCode: suggested, source: "ip" };
  return { countryCode: "US", source: "default" };
}
