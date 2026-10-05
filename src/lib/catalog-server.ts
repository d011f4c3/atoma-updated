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
import { createPublishedVariantActionKey } from "./cart-server";
import type { Catalog } from "./catalog-types";

const CACHE_MS = 30_000;
let cached: { catalog: Catalog; expiresAt: number } | null = null;
let pending: Promise<Catalog> | null = null;

/** Local preview, default JPY market, no buyer context or commerce mutations. */
export async function readCatalog(): Promise<Catalog> {
  if (cached && cached.expiresAt > Date.now()) return cached.catalog;
  if (pending) return pending;
  pending = loadCatalog();
  try {
    return await pending;
  } finally {
    pending = null;
  }
}

async function loadCatalog(): Promise<Catalog> {
  try {
    const environment = readStorefrontEnvironment();
    if (environment.storeDomain !== CATALOG_SHOP_DOMAIN) {
      return unavailableCatalog();
    }
    const client = createStorefrontCatalogClient({
      environment,
      currency: "JPY",
      sellingPlansEnabled: false,
      timeoutMs: 15_000,
      // This operation is a read. Permit one bounded transient retry; cart
      // mutations retain their separate no-replay contract.
      maxRetries: 1,
    });
    const catalog = projectCatalog(
      await client.readPublishedCatalog(),
      createPublishedVariantActionKey,
    );
    cached = { catalog, expiresAt: Date.now() + CACHE_MS };
    return catalog;
  } catch {
    // Never expose vendor responses, private configuration, or transport errors.
    return unavailableCatalog();
  }
}
