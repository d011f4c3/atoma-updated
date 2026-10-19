import {
  getPlacePath,
  getProductDesignations,
  getProductPlaceRecords,
  ORIGINS_GRAPH,
  type OriginsGraph,
} from "./origins-model.ts";

/** Keep growing origin and tea designation distinct on the sample stickers. */
export function getSampleLabelPlace(
  productHandle: string,
  graph: OriginsGraph = ORIGINS_GRAPH,
): { label: string; value: string } | null {
  const growingPlaces = getProductPlaceRecords(productHandle, graph)
    .filter((record) => record.role === "grown")
    .map((record) =>
      getPlacePath(record.place.id, graph)
        .reverse()
        .map((place) => place.name)
        .join(", "),
    )
    .filter(Boolean);

  if (growingPlaces.length) {
    return {
      label: "Growing place",
      value: [...new Set(growingPlaces)].join("; "),
    };
  }

  const designations = getProductDesignations(productHandle, graph).map(
    (designation) => designation.name,
  );
  return designations.length
    ? {
        label: "Tea designation",
        value: [...new Set(designations)].join(", "),
      }
    : null;
}
