import assert from "node:assert/strict";
import test from "node:test";
import { ORIGINS_GRAPH } from "../src/lib/origins-model.ts";
import {
  ORIGINS_PEOPLE,
  getOriginsPeople,
  getPeopleForPlace,
} from "../src/lib/origins-people.ts";

const ids = (people) => people.map((person) => person.id);

function person(id, overrides = {}) {
  return {
    id,
    name: id,
    roles: ["grower"],
    summary: "A documented test grower.",
    contextPlaceIds: ["wazuka"],
    evidence: ["Test source, p. 1"],
    publication: "published",
    ...overrides,
  };
}

test("the public dataset withholds grower and partner records entirely", () => {
  assert.deepEqual(ORIGINS_PEOPLE, []);
  assert.deepEqual(getOriginsPeople(), []);
  for (const placeId of ["wazuka", "kyoto", "japan", "unknown-place"]) {
    assert.deepEqual(getPeopleForPlace(placeId), []);
  }
});

test("synthetic local context rolls up while unlocated partners remain global", () => {
  const people = [
    person("local-grower"),
    person("unlocated-partner", {
      roles: ["wholesaler", "supplier", "processor", "custodian"],
      contextPlaceIds: [],
    }),
  ];
  assert.deepEqual(getOriginsPeople(people), people);
  for (const placeId of ["wazuka", "kyoto", "japan"]) {
    assert.deepEqual(ids(getPeopleForPlace(placeId, ORIGINS_GRAPH, people)), [
      "local-grower",
    ]);
  }
  assert.deepEqual(
    getPeopleForPlace("unknown-place", ORIGINS_GRAPH, people),
    [],
  );
});

test("place context never narrows an ancestor or borrows a sibling's people", () => {
  const graph = {
    ...ORIGINS_GRAPH,
    places: [
      ...ORIGINS_GRAPH.places,
      {
        id: "another-locality",
        slug: "another-locality",
        name: "Another locality",
        kind: "locality",
        parentId: "kyoto",
        description: "Test locality",
        publication: "published",
      },
    ],
  };
  const people = [
    person("regional", { contextPlaceIds: ["kyoto"] }),
    person("local"),
    person("multiple", { contextPlaceIds: ["wazuka", "another-locality"] }),
  ];
  assert.deepEqual(ids(getPeopleForPlace("wazuka", graph, people)), [
    "local",
    "multiple",
  ]);
  assert.deepEqual(ids(getPeopleForPlace("another-locality", graph, people)), [
    "multiple",
  ]);
  assert.deepEqual(ids(getPeopleForPlace("kyoto", graph, people)), [
    "regional",
    "local",
    "multiple",
  ]);
});

test("publication requires complete sourced identities and rejects ambiguous IDs", () => {
  const people = [
    person("valid"),
    person("draft", { publication: "draft" }),
    person("no-source", { evidence: [] }),
    person("blank-source", { evidence: [" "] }),
    person("partial-source", { evidence: ["Source, p. 1", " "] }),
    person(" "),
    person("no-name", { name: " " }),
    person("no-summary", { summary: " " }),
    person("no-role", { roles: [] }),
    person("duplicate"),
    person("duplicate"),
  ];
  assert.deepEqual(ids(getOriginsPeople(people)), ["valid"]);
  assert.deepEqual(ids(getPeopleForPlace("wazuka", ORIGINS_GRAPH, people)), [
    "valid",
  ]);
});

test("unpublished or broken place ancestry cannot publish a geographic association", () => {
  const people = [person("local-grower")];
  assert.deepEqual(ids(getPeopleForPlace("wazuka", ORIGINS_GRAPH, people)), [
    "local-grower",
  ]);
  assert.deepEqual(ids(getPeopleForPlace("japan", ORIGINS_GRAPH, people)), [
    "local-grower",
  ]);
  for (const places of [
    ORIGINS_GRAPH.places.map((place) =>
      place.id === "kyoto" ? { ...place, publication: "draft" } : place,
    ),
    ORIGINS_GRAPH.places.filter((place) => place.id !== "kyoto"),
    ORIGINS_GRAPH.places.map((place) =>
      place.id === "kyoto" ? { ...place, parentId: "wazuka" } : place,
    ),
  ]) {
    const graph = { ...ORIGINS_GRAPH, places };
    assert.deepEqual(getPeopleForPlace("wazuka", graph, people), []);
    assert.deepEqual(getPeopleForPlace("japan", graph, people), []);
  }
  assert.deepEqual(
    getPeopleForPlace("japan", ORIGINS_GRAPH, [
      person("unknown", { contextPlaceIds: ["unknown-place"] }),
    ]),
    [],
  );
  assert.deepEqual(getOriginsPeople(people), people);
});
