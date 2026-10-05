import type { CatalogProduct } from "./catalog-types";

export type Place = {
  id: string;
  slug: string;
  name: string;
  kind: "country" | "region" | "locality" | "field";
  parentId: string | null;
  description: string;
  publication: "published" | "draft";
};

export type MatchaType = { id: string; label: string };
export type MaterialRecord = { id: string; typeIds: string[] };
export type ProductMaterialLink = {
  productHandle: string;
  materialId: string;
  lotId?: string;
};
export type LotRecord = { id: string; materialId: string };
export type ProvenanceLink = {
  subject: { kind: "material" | "lot"; id: string };
  role: "grown" | "processed" | "packed" | "selected" | "dispatched";
  placeId: string;
  evidence: string;
  publication: "published" | "draft";
};

export type OriginsGraph = {
  places: readonly Place[];
  types: readonly MatchaType[];
  materials: readonly MaterialRecord[];
  products: readonly ProductMaterialLink[];
  lots: readonly LotRecord[];
  provenance: readonly ProvenanceLink[];
};

export type ProductPlaceRecord = {
  role: ProvenanceLink["role"];
  place: Place;
  subjects: ProvenanceLink["subject"][];
};

const launchOriginEvidence =
  "Owner confirmation, 2026-10-01: the three current test materials originate in Wazuka, Kyoto.";

/** Product origins require explicit sourced links, separate from type labels. */
export const ORIGINS_GRAPH: OriginsGraph = {
  places: [
    {
      id: "japan",
      slug: "japan",
      name: "Japan",
      kind: "country",
      parentId: null,
      description: "Tea-growing places in Japan.",
      publication: "published",
    },
    {
      id: "kyoto",
      slug: "kyoto",
      name: "Kyoto",
      kind: "region",
      parentId: "japan",
      description: "Wazuka is a tea-growing town in Kyoto, Japan.",
      publication: "published",
    },
    {
      id: "wazuka",
      slug: "wazuka",
      name: "Wazuka",
      kind: "locality",
      parentId: "kyoto",
      description:
        "Our Culinary, Barista and Ceremonial matcha are grown in Wazuka, Kyoto.",
      publication: "published",
    },
  ],
  types: [
    { id: "culinary", label: "Culinary" },
    { id: "barista", label: "Barista" },
    { id: "tea-service", label: "Tea service" },
  ],
  materials: [
    { id: "sample-culinary", typeIds: ["culinary"] },
    { id: "sample-barista", typeIds: ["barista"] },
    { id: "sample-tea-service", typeIds: ["tea-service"] },
  ],
  products: [
    {
      productHandle: "jmm-storefront-test-matcha",
      materialId: "sample-culinary",
    },
    {
      productHandle: "test-only-japanese-barista-matcha-powder-for-lattes-1-kg",
      materialId: "sample-barista",
    },
    {
      productHandle:
        "test-only-japanese-premium-matcha-powder-for-tea-service-1-kg",
      materialId: "sample-tea-service",
    },
  ],
  lots: [],
  provenance: [
    {
      subject: { kind: "material", id: "sample-culinary" },
      role: "grown",
      placeId: "wazuka",
      evidence: launchOriginEvidence,
      publication: "published",
    },
    {
      subject: { kind: "material", id: "sample-barista" },
      role: "grown",
      placeId: "wazuka",
      evidence: launchOriginEvidence,
      publication: "published",
    },
    {
      subject: { kind: "material", id: "sample-tea-service" },
      role: "grown",
      placeId: "wazuka",
      evidence: launchOriginEvidence,
      publication: "published",
    },
  ],
};

/** Ambiguous IDs cannot silently select whichever record happens to come last. */
function uniqueIndex<T extends { id: string }>(records: readonly T[]) {
  const index = new Map<string, T>();
  const duplicates = new Set<string>();
  for (const record of records) {
    if (!record.id.trim() || duplicates.has(record.id)) continue;
    if (index.has(record.id)) {
      index.delete(record.id);
      duplicates.add(record.id);
    } else {
      index.set(record.id, record);
    }
  }
  return index;
}

function graphIndex(graph: OriginsGraph) {
  return {
    places: uniqueIndex(graph.places),
    types: uniqueIndex(graph.types),
    materials: uniqueIndex(graph.materials),
    lots: uniqueIndex(graph.lots),
  };
}

type GraphIndex = ReturnType<typeof graphIndex>;

function publishedPath(placeId: string, places: GraphIndex["places"]): Place[] {
  const path: Place[] = [];
  const visited = new Set<string>();
  let currentId: string | null = placeId;
  while (currentId !== null) {
    const place = places.get(currentId);
    if (!place || place.publication !== "published" || visited.has(currentId)) {
      return [];
    }
    visited.add(currentId);
    path.unshift(place);
    currentId = place.parentId;
  }
  return path;
}

/** Root-to-place path, only when every ancestor is present and published. */
export function getPlacePath(
  placeId: string,
  graph: OriginsGraph = ORIGINS_GRAPH,
): Place[] {
  return publishedPath(placeId, uniqueIndex(graph.places));
}

/** All published descendants, excluding the requested place itself. */
export function getPlaceDescendants(
  placeId: string,
  graph: OriginsGraph = ORIGINS_GRAPH,
): Place[] {
  const places = uniqueIndex(graph.places);
  if (!publishedPath(placeId, places).length) return [];
  return graph.places.filter(
    (place) =>
      place.id !== placeId &&
      publishedPath(place.id, places).some(
        (ancestor) => ancestor.id === placeId,
      ),
  );
}

function validProductLink(link: ProductMaterialLink, index: GraphIndex) {
  if (!link.productHandle.trim() || !index.materials.has(link.materialId)) {
    return false;
  }
  return (
    link.lotId === undefined ||
    index.lots.get(link.lotId)?.materialId === link.materialId
  );
}

function publishedProvenanceLinks(graph: OriginsGraph, index: GraphIndex) {
  return graph.provenance.filter((link) => {
    const materialId =
      link.subject.kind === "material"
        ? link.subject.id
        : index.lots.get(link.subject.id)?.materialId;
    return (
      link.publication === "published" &&
      Boolean(link.evidence.trim()) &&
      materialId !== undefined &&
      index.materials.has(materialId) &&
      publishedPath(link.placeId, index.places).length > 0
    );
  });
}

function appliesToProduct(link: ProvenanceLink, product: ProductMaterialLink) {
  return link.subject.kind === "material"
    ? link.subject.id === product.materialId
    : link.subject.id === product.lotId;
}

/**
 * Region/country views roll up documented growing places only. A lot's evidence
 * applies only to products explicitly bound to that lot, never its whole material.
 * A type filter applies to the same material whose growing link qualifies.
 */
export function getMatchasForPlace(
  placeId: string,
  catalogProducts: readonly CatalogProduct[],
  graph: OriginsGraph = ORIGINS_GRAPH,
  typeId?: string,
): CatalogProduct[] {
  const index = graphIndex(graph);
  if (
    !publishedPath(placeId, index.places).length ||
    (typeId !== undefined && !index.types.has(typeId))
  ) {
    return [];
  }
  const growing = publishedProvenanceLinks(graph, index).filter(
    (link) =>
      link.role === "grown" &&
      publishedPath(link.placeId, index.places).some(
        (place) => place.id === placeId,
      ),
  );
  const handles = new Set(
    graph.products
      .filter(
        (product) =>
          validProductLink(product, index) &&
          (typeId === undefined ||
            index.materials
              .get(product.materialId)
              ?.typeIds.includes(typeId)) &&
          growing.some((link) => appliesToProduct(link, product)),
      )
      .map((product) => product.productHandle),
  );
  const seen = new Set<string>();
  return catalogProducts.filter((product) => {
    if (!handles.has(product.handle) || seen.has(product.handle)) return false;
    seen.add(product.handle);
    return true;
  });
}

/** Actual documented growing places; ancestors are not added as separate claims. */
export function getPlacesForMatcha(
  handle: string,
  graph: OriginsGraph = ORIGINS_GRAPH,
): Place[] {
  const index = graphIndex(graph);
  const products = graph.products.filter(
    (product) =>
      product.productHandle === handle && validProductLink(product, index),
  );
  const placeIds = new Set(
    publishedProvenanceLinks(graph, index)
      .filter(
        (link) =>
          link.role === "grown" &&
          products.some((product) => appliesToProduct(link, product)),
      )
      .map((link) => link.placeId),
  );
  return graph.places.filter((place) => placeIds.has(place.id));
}

/** Keep each documented supply-chain role explicit instead of calling all origin. */
export function getProductPlaceRecords(
  handle: string,
  graph: OriginsGraph = ORIGINS_GRAPH,
): ProductPlaceRecord[] {
  const index = graphIndex(graph);
  const products = graph.products.filter(
    (product) =>
      product.productHandle === handle && validProductLink(product, index),
  );
  const records: ProductPlaceRecord[] = [];
  for (const link of publishedProvenanceLinks(graph, index)) {
    if (!products.some((product) => appliesToProduct(link, product))) continue;
    const place = index.places.get(link.placeId);
    if (!place) continue;
    const existing = records.find(
      (record) => record.role === link.role && record.place.id === place.id,
    );
    if (existing) {
      if (
        !existing.subjects.some(
          (subject) =>
            subject.kind === link.subject.kind &&
            subject.id === link.subject.id,
        )
      ) {
        existing.subjects.push({ ...link.subject });
      }
    } else {
      records.push({ role: link.role, place, subjects: [{ ...link.subject }] });
    }
  }
  return records;
}

/** Types come from explicit material bindings, never a name or application guess. */
export function getMatchaTypesForProduct(
  handle: string,
  graph: OriginsGraph = ORIGINS_GRAPH,
): MatchaType[] {
  const index = graphIndex(graph);
  const typeIds = new Set(
    graph.products
      .filter(
        (product) =>
          product.productHandle === handle && validProductLink(product, index),
      )
      .flatMap(
        (product) => index.materials.get(product.materialId)?.typeIds ?? [],
      ),
  );
  return graph.types.filter(
    (type) => index.types.has(type.id) && typeIds.has(type.id),
  );
}

/** Authoring diagnostics for the local graph; queries also fail closed per link. */
export function validateOriginsGraph(graph: OriginsGraph): string[] {
  const issues = new Set<string>();
  const index = graphIndex(graph);
  for (const [name, records] of [
    ["Place", graph.places],
    ["Type", graph.types],
    ["Material", graph.materials],
    ["Lot", graph.lots],
  ] as const) {
    const seen = new Set<string>();
    for (const record of records) {
      if (!record.id.trim()) issues.add(`${name} has an empty ID.`);
      if (seen.has(record.id))
        issues.add(`${name} ID is duplicated: ${record.id}.`);
      seen.add(record.id);
    }
  }
  const slugs = new Set<string>();
  for (const place of graph.places) {
    if (!place.slug.trim()) issues.add(`Place ${place.id} has an empty slug.`);
    if (slugs.has(place.slug))
      issues.add(`Place slug is duplicated: ${place.slug}.`);
    slugs.add(place.slug);
    if (place.parentId !== null && !index.places.has(place.parentId)) {
      issues.add(`Place ${place.id} has an unknown parent: ${place.parentId}.`);
    }
    const seen = new Set<string>();
    let current: Place | undefined = place;
    while (current) {
      if (seen.has(current.id)) {
        issues.add(`Place ancestry contains a cycle: ${place.id}.`);
        break;
      }
      seen.add(current.id);
      current =
        current.parentId === null
          ? undefined
          : index.places.get(current.parentId);
    }
  }
  for (const material of graph.materials) {
    for (const typeId of material.typeIds) {
      if (!index.types.has(typeId)) {
        issues.add(`Material ${material.id} has an unknown type: ${typeId}.`);
      }
    }
  }
  for (const lot of graph.lots) {
    if (!index.materials.has(lot.materialId)) {
      issues.add(`Lot ${lot.id} has an unknown material: ${lot.materialId}.`);
    }
  }
  for (const product of graph.products) {
    if (!validProductLink(product, index)) {
      issues.add(`Product binding is invalid: ${product.productHandle}.`);
    }
  }
  for (const link of graph.provenance) {
    const subject = `${link.subject.kind} ${link.subject.id}`;
    if (!index.places.has(link.placeId)) {
      issues.add(
        `Provenance for ${subject} has an unknown place: ${link.placeId}.`,
      );
    }
    if (
      !(link.subject.kind === "material" ? index.materials : index.lots).has(
        link.subject.id,
      )
    ) {
      issues.add(`Provenance has an unknown subject: ${subject}.`);
    }
    if (link.publication === "published") {
      if (!link.evidence.trim()) {
        issues.add(`Published provenance for ${subject} has no evidence.`);
      }
      if (!publishedPath(link.placeId, index.places).length) {
        issues.add(
          `Published provenance for ${subject} has no published place path.`,
        );
      }
    }
  }
  return [...issues];
}
