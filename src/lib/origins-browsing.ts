import type { CatalogProduct } from "./catalog-types";
import { getFieldEntriesForPlace } from "./origins-content.ts";
import {
  ORIGINS_GRAPH,
  getDirectoryMatchasForPlace,
  getPlaceDescendants,
  getPlacePath,
  type OriginsGraph,
} from "./origins-model.ts";

/** Editorial browsing only: this region is not Uji City or a provenance record. */
const browseGraph: OriginsGraph = {
  ...ORIGINS_GRAPH,
  places: [
    {
      id: "uji-tea-region",
      slug: "uji-tea-region",
      name: "Uji tea-growing region",
      kind: "region",
      parentId: "kyoto",
      description:
        "Wazuka belongs to the Uji tea-growing region of Kyoto Prefecture. Wazuka Town and Uji City are separate municipalities.",
      publication: "published",
    },
    ...ORIGINS_GRAPH.places.map((place) =>
      place.id === "wazuka"
        ? { ...place, parentId: "uji-tea-region" }
        : place.id === "kyoto"
          ? { ...place, name: "Kyoto Prefecture" }
          : place,
    ),
  ],
};

export const originBrowsePlaces = browseGraph.places;
export const getOriginBrowsePath = (id: string) =>
  getPlacePath(id, browseGraph);
export const getOriginBrowseDescendants = (id: string) =>
  getPlaceDescendants(id, browseGraph);
export const getOriginBrowseEntries = (id: string) =>
  getFieldEntriesForPlace(id, browseGraph);
export const getOriginBrowseMatchas = (
  id: string,
  products: readonly CatalogProduct[],
  typeId?: string,
) => getDirectoryMatchasForPlace(id, products, browseGraph, typeId);
