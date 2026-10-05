import type { CatalogProduct } from "./catalog-types";
import {
  getMatchasForPlace,
  getPlacesForMatcha,
  getPlacePath,
  getPlaceDescendants,
  ORIGINS_GRAPH,
  type OriginsGraph,
} from "./origins-model.ts";

export type FieldEntry = {
  slug: string;
  region: string;
  title: string;
  dek: string;
  image: string;
  imageAlt: string;
  imageCaption: string;
  sections: {
    id: string;
    label: string;
    title: string;
    body: string[];
    image?: string;
    imageAlt?: string;
    imageCaption?: string;
  }[];
  /** Editorial coverage only. Product provenance belongs to its own graph. */
  placeIds: readonly string[];
};

/** Original photographic observations, not SKU provenance or a dated visit. */
export const FIELD_ENTRIES: FieldEntry[] = [
  {
    slug: "kyoto-field-observations",
    region: "Kyoto, Japan",
    title: "In the fields.",
    dek: "Tea fields, field work and leaf handling in Kyoto.",
    image: "/images/origins/field-landscape.webp",
    imageAlt:
      "Curving rows of tea plants and covered beds beneath wooded hills.",
    imageCaption: "Tea fields · Kyoto",
    sections: [
      {
        id: "landscape",
        label: "01 / The fields",
        title: "The fields.",
        body: [
          "Rows of tea follow the hillside, with covered beds beneath the wooded slopes.",
        ],
      },
      {
        id: "work",
        label: "02 / Field work",
        title: "Field work.",
        body: ["Work among the tea plants, beneath suspended shade cloth."],
        image: "/images/origins/field-work.webp",
        imageAlt:
          "A person working among tea plants beneath suspended shade cloth.",
        imageCaption: "Field work · Kyoto",
      },
      {
        id: "leaf",
        label: "03 / The leaf",
        title: "The leaf.",
        body: ["Tea leaves handled in a woven basket."],
        image: "/images/origins/tea-handling.jpg",
        imageAlt: "A gloved hand handling green leaves inside a woven basket.",
        imageCaption: "Leaf handling · Kyoto",
      },
    ],
    placeIds: ["kyoto"],
  },
];

export function getRelatedMatchas(
  entry: FieldEntry,
  products: readonly CatalogProduct[],
  graph: OriginsGraph = ORIGINS_GRAPH,
): CatalogProduct[] {
  const handles = new Set(
    entry.placeIds.flatMap((id) =>
      getMatchasForPlace(id, products, graph).map((product) => product.handle),
    ),
  );
  return products.filter((product) => handles.has(product.handle));
}

export function getProductFieldEntries(
  handle: string,
  graph: OriginsGraph = ORIGINS_GRAPH,
  entries: readonly FieldEntry[] = FIELD_ENTRIES,
): FieldEntry[] {
  const places = new Set(
    getPlacesForMatcha(handle, graph).flatMap((place) =>
      getPlacePath(place.id, graph).map((ancestor) => ancestor.id),
    ),
  );
  return entries.filter((entry) => entry.placeIds.some((id) => places.has(id)));
}

export function getFieldEntriesForPlace(
  placeId: string,
  graph: OriginsGraph = ORIGINS_GRAPH,
  entries: readonly FieldEntry[] = FIELD_ENTRIES,
): FieldEntry[] {
  if (!getPlacePath(placeId, graph).length) return [];
  const places = new Set([
    placeId,
    ...getPlaceDescendants(placeId, graph).map((place) => place.id),
  ]);
  return entries.filter((entry) => entry.placeIds.some((id) => places.has(id)));
}
