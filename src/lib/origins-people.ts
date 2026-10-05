import {
  getPlacePath,
  ORIGINS_GRAPH,
  type OriginsGraph,
} from "./origins-model.ts";

export type OriginsPersonRole =
  "grower" | "wholesaler" | "supplier" | "processor" | "custodian";

export type OriginsPerson = {
  id: string;
  name: string;
  roles: readonly OriginsPersonRole[];
  summary: string;
  /** Documented geographic context, not a product, lot or depicted-person link. */
  contextPlaceIds: readonly string[];
  evidence: readonly string[];
  publication: "published" | "draft";
};

/** Grower and partner identities are withheld from public storefront data. */
export const ORIGINS_PEOPLE: readonly OriginsPerson[] = [];

/** Publish only sourced, complete identities; duplicate IDs are ambiguous. */
export function getOriginsPeople(
  people: readonly OriginsPerson[] = ORIGINS_PEOPLE,
): OriginsPerson[] {
  const counts = new Map<string, number>();
  for (const person of people) {
    counts.set(person.id, (counts.get(person.id) ?? 0) + 1);
  }
  return people.filter(
    (person) =>
      person.publication === "published" &&
      counts.get(person.id) === 1 &&
      Boolean(person.id.trim()) &&
      Boolean(person.name.trim()) &&
      Boolean(person.summary.trim()) &&
      person.roles.length > 0 &&
      person.evidence.length > 0 &&
      person.evidence.every((source) => Boolean(source.trim())),
  );
}

/** Context rolls up to ancestors, never down into an unverified growing place. */
export function getPeopleForPlace(
  placeId: string,
  graph: OriginsGraph = ORIGINS_GRAPH,
  people: readonly OriginsPerson[] = ORIGINS_PEOPLE,
): OriginsPerson[] {
  if (!getPlacePath(placeId, graph).length) return [];
  return getOriginsPeople(people).filter((person) =>
    person.contextPlaceIds.some((contextPlaceId) =>
      getPlacePath(contextPlaceId, graph).some((place) => place.id === placeId),
    ),
  );
}
