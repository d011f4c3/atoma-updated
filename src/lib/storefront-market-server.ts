import "server-only";

import {
  createStorefrontCatalogClient,
  readStorefrontEnvironment,
} from "@jmm/shopify-storefront/server";
import { CATALOG_SHOP_DOMAIN } from "./catalog-model";
import {
  parseShippingCountry,
  type DestinationContext,
  type ShippingCountryCode,
} from "./storefront-destination";
import { isStorefrontCurrency } from "./storefront-money";

const contexts = new Map<
  ShippingCountryCode,
  { value: DestinationContext; expiresAt: number }
>();
const pending = new Map<ShippingCountryCode, Promise<DestinationContext>>();

/** Shopify's enabled localization supplies currency; no country-to-FX assumption. */
export async function readShopifyDestination(
  countryCode: ShippingCountryCode,
): Promise<DestinationContext> {
  if (!parseShippingCountry(countryCode))
    throw new Error("Invalid destination.");
  const cached = contexts.get(countryCode);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const previous = pending.get(countryCode);
  if (previous) return previous;
  const request = (async () => {
    const environment = readStorefrontEnvironment();
    if (environment.storeDomain !== CATALOG_SHOP_DOMAIN)
      throw new Error("Invalid storefront.");
    const client = createStorefrontCatalogClient({
      environment,
      currency: "JPY",
      maxRetries: 1,
      timeoutMs: 15_000,
    });
    const context = await client.readMarketContext({ countryCode });
    if (
      context.countryCode !== countryCode ||
      !isStorefrontCurrency(context.currency)
    )
      throw new Error("Destination unavailable.");
    const value = Object.freeze({ countryCode, currency: context.currency });
    contexts.set(countryCode, { value, expiresAt: Date.now() + 30_000 });
    return value;
  })();
  pending.set(countryCode, request);
  try {
    return await request;
  } finally {
    if (pending.get(countryCode) === request) pending.delete(countryCode);
  }
}
