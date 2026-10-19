/** Public projection; opaque action keys still require server revalidation. */
import type { DestinationContext } from "./storefront-destination";

export interface CatalogSellingPlan {
  id: string;
  selectionId?: string;
  name: string;
  description: string | null;
  deliveryInterval: "week";
  deliveryIntervalCount: 4;
  priceMinor: number;
  currency: string;
  available: boolean;
}

export interface CatalogVariant {
  id: string;
  selectionId?: string;
  title: string;
  available: boolean;
  priceMinor: number;
  currency: string;
  options: { name: string; value: string }[];
  minimum: number;
  increment: number;
  maximum: number | null;
  sellingPlans?: CatalogSellingPlan[];
}

export interface CatalogProduct {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string;
  handle: string;
  /** Public ATOMA reference, without brackets; null for an unmapped handle. */
  productCode: string | null;
  productUrl: string | null;
  isFixture: boolean;
  variants: CatalogVariant[];
}

export interface Catalog {
  status: "ready" | "unavailable" | "empty";
  products: CatalogProduct[];
  shopUrl: string;
  destination?: DestinationContext;
}
