import "server-only";

import {
  createStorefrontCatalogClient,
  readStorefrontEnvironment,
} from "@jmm/shopify-storefront/server";
import {
  CATALOG_SHOP_DOMAIN,
  projectCatalog,
  unavailableCatalog,
} from "./catalog-model";
import {
  createPublishedVariantActionKey,
  createCatalogSelectionKey,
} from "./cart-server";
import type { Catalog } from "./catalog-types";
import {
  readProductPurchaseOptions,
  sellingPlansEnabled,
} from "./selling-plan-policy";
import { readStorefrontDestination } from "./storefront-destination-server";
import { readShopifyDestination } from "./storefront-market-server";
import type { DestinationContext } from "./storefront-destination";

const CACHE_MS = 30_000;
const cached = new Map<string, { catalog: Catalog; expiresAt: number }>();
const pending = new Map<string, Promise<Catalog>>();

/** Every shared result is isolated by destination, actual currency and capability. */
export async function readCatalog(): Promise<Catalog> {
  try {
    const destination = await readShopifyDestination(
      (await readStorefrontDestination()).countryCode,
    );
    const enabled = sellingPlansEnabled(process.env);
    const key = JSON.stringify([
      destination.countryCode,
      destination.currency,
      enabled,
    ]);
    const previous = cached.get(key);
    if (previous && previous.expiresAt > Date.now()) return previous.catalog;
    const inFlight = pending.get(key);
    if (inFlight) return inFlight;
    const request = loadCatalog(destination, enabled);
    pending.set(key, request);
    try {
      const catalog = await request;
      if (catalog.status !== "unavailable")
        cached.set(key, { catalog, expiresAt: Date.now() + CACHE_MS });
      return catalog;
    } finally {
      if (pending.get(key) === request) pending.delete(key);
    }
  } catch {
    return unavailableCatalog();
  }
}

async function loadCatalog(
  destination: DestinationContext,
  enabled: boolean,
): Promise<Catalog> {
  try {
    const environment = readStorefrontEnvironment();
    if (environment.storeDomain !== CATALOG_SHOP_DOMAIN)
      return unavailableCatalog();
    const context = { countryCode: destination.countryCode };
    const client = createStorefrontCatalogClient({
      environment,
      currency: destination.currency,
      sellingPlansEnabled: false,
      timeoutMs: 15_000,
      maxRetries: 1,
    });
    const snapshot = await client.readPublishedCatalog(context);
    const planClient = enabled
      ? createStorefrontCatalogClient({
          environment,
          currency: destination.currency,
          sellingPlansEnabled: true,
          timeoutMs: 15_000,
          maxRetries: 0,
        })
      : client;
    const products = await Promise.all(
      snapshot.products.map((product) =>
        readProductPurchaseOptions(
          product.handle,
          enabled,
          async () => product,
          (handle) => planClient.readPublishedProductByHandle(handle, context),
        ),
      ),
    );
    return projectCatalog(
      { products: products.filter((product) => product !== null) },
      (reference, plan) =>
        createPublishedVariantActionKey(reference, plan, destination),
      destination,
      createCatalogSelectionKey,
    );
  } catch {
    // Never expose vendor responses, private configuration, or transport errors.
    return unavailableCatalog();
  }
}
