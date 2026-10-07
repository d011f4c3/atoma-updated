/** Public, display-only projection. No credentials or purchase authorization. */
export interface CatalogVariant {
  id: string;
  title: string;
  available: boolean;
  priceMinor: number;
  currency: string;
  options: { name: string; value: string }[];
  minimum: number;
  increment: number;
  maximum: number | null;
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
}
