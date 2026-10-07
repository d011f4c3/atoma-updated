import assert from "node:assert/strict";
import test from "node:test";
import { getOriginPreview } from "../src/lib/origin-preview.ts";
import { ORIGINS_GRAPH } from "../src/lib/origins-model.ts";
import { FIELD_ENTRIES } from "../src/lib/origins-content.ts";

function product(handle = ORIGINS_GRAPH.products[2].productHandle) {
  return {
    id: handle,
    handle,
    title: "Japanese Premium Matcha Powder for Tea Service — 1 kg",
    description: "Isolated preview fixture",
    imageUrl: null,
    imageAlt: "",
    productUrl: null,
    isFixture: true,
    variants: [],
  };
}

function graph() {
  return structuredClone(ORIGINS_GRAPH);
}

function entry(placeId, imageCaption) {
  return {
    ...FIELD_ENTRIES[0],
    slug: `fixture-${placeId}`,
    image: `/fixture-${placeId}.webp`,
    imageCaption,
    placeIds: [placeId],
    photographsByPlace: undefined,
  };
}

test("origin preview keeps confirmed growing place separate from broader photographic context", () => {
  for (const link of ORIGINS_GRAPH.products.slice(2)) {
    const preview = getOriginPreview(product(link.productHandle));
    assert.equal(preview.places.length, 1);
    const place = preview.places[0];
    assert.equal(place.id, "wazuka");
    assert.deepEqual(
      place.path.map((ancestor) => ancestor.name),
      ["Japan", "Kyoto", "Wazuka"],
    );
    assert.equal(place.photograph.image, FIELD_ENTRIES[0].image);
    assert.equal(place.photograph.imageAlt, FIELD_ENTRIES[0].imageAlt);
    assert.equal(place.photograph.imageCaption, FIELD_ENTRIES[0].imageCaption);
    assert.match(place.photograph.imageCaption, /Kyoto/);
    assert.doesNotMatch(place.photograph.imageCaption, /Wazuka/);
  }
});

test("origin preview does not infer provenance from a familiar product title, place text or photographs", () => {
  assert.deepEqual(
    getOriginPreview(product("unmapped-culinary-matcha")).places,
    [],
  );
  const unconfirmed = graph();
  unconfirmed.provenance = [];
  assert.deepEqual(getOriginPreview(product(), unconfirmed).places, []);
});

test("origin preview excludes processed-only and lot-only claims from a material overview", () => {
  const processed = graph();
  processed.provenance = processed.provenance.map((link) => ({
    ...link,
    role: "processed",
  }));
  assert.deepEqual(getOriginPreview(product(), processed).places, []);

  const lotOnly = graph();
  const materialId = lotOnly.products[2].materialId;
  lotOnly.lots = [{ id: "documented-lot", materialId }];
  lotOnly.products[2].lotId = "documented-lot";
  lotOnly.provenance = [
    {
      subject: { kind: "lot", id: "documented-lot" },
      role: "grown",
      placeId: "wazuka",
      evidence: "A deliberately lot-specific test record",
      publication: "published",
    },
  ];
  assert.deepEqual(getOriginPreview(product(), lotOnly).places, []);
});

test("origin preview selects the nearest documented photographic context without borrowing a sibling or descendant", () => {
  const country = entry("japan", "Country context");
  const region = entry("kyoto", "Regional context");
  const locality = entry("wazuka", "Locality context");
  assert.equal(
    getOriginPreview(product(), graph(), [country, region, locality]).places[0]
      .photograph.imageCaption,
    "Locality context",
  );
  assert.equal(
    getOriginPreview(product(), graph(), [country, region]).places[0].photograph
      .imageCaption,
    "Regional context",
  );

  const extended = graph();
  extended.places.push(
    {
      id: "sibling",
      slug: "sibling",
      name: "Sibling",
      kind: "locality",
      parentId: "kyoto",
      description: "Test place",
      publication: "published",
    },
    {
      id: "child",
      slug: "child",
      name: "Child",
      kind: "field",
      parentId: "wazuka",
      description: "Test place",
      publication: "published",
    },
  );
  const preview = getOriginPreview(product(), extended, [
    entry("sibling", "Sibling context"),
    entry("child", "Field context"),
  ]);
  assert.equal(preview.places[0].id, "wazuka");
  assert.ok(
    !preview.places[0].photograph,
    "Missing appropriate photography must not remove or narrow the documented growing place",
  );
});

test("Uji uses the same place path format as Wazuka while keeping designation identity and photography separate", () => {
  const before = structuredClone(ORIGINS_GRAPH);
  const photographs = [
    entry("kyoto", "Regional context"),
    entry("wazuka", "Wazuka context"),
    entry("uji-city", "Uji City context"),
  ];
  const wazuka = getOriginPreview(product(), graph(), photographs).places[0];
  for (const link of ORIGINS_GRAPH.products.slice(0, 2)) {
    const preview = getOriginPreview(
      product(link.productHandle),
      graph(),
      photographs,
    );
    assert.deepEqual(preview.places, []);
    const uji = preview.designations[0];
    assert.equal(uji.id, "uji-tea");
    assert.equal(uji.kind, "designation");
    assert.equal(uji.name, "Uji City");
    assert.equal(uji.parents, wazuka.parents);
    assert.equal(uji.hierarchyLabel, wazuka.hierarchyLabel);
    assert.deepEqual(
      uji.path.map(({ kind }) => kind),
      wazuka.path.map(({ kind }) => kind),
    );
    assert.deepEqual(
      uji.path.map(({ name }) => name),
      ["Japan", "Kyoto", "Uji City"],
    );
    assert.equal(uji.linkPlaceId, "uji-city");
    assert.equal(uji.photograph.image, "/fixture-uji-city.webp");
    assert.notEqual(uji.photograph.image, wazuka.photograph.image);
    assert.match(
      uji.description,
      /Specific growing and processing locations are not yet published/,
    );
    assert.doesNotMatch(uji.description, /grown in|processed in/i);
  }
  assert.deepEqual(ORIGINS_GRAPH, before);
});

test("a designation preview requires a published valid place path", () => {
  const invalidGraphs = [];
  for (const update of [
    { publication: "draft" },
    { parentId: "missing" },
    { parentId: "uji-city" },
  ]) {
    const invalid = graph();
    Object.assign(
      invalid.places.find(({ id }) => id === "uji-city"),
      update,
    );
    invalidGraphs.push(invalid);
  }
  const duplicate = graph();
  duplicate.places.push({
    ...duplicate.places.find(({ id }) => id === "uji-city"),
  });
  invalidGraphs.push(duplicate);
  for (const invalid of invalidGraphs) {
    assert.deepEqual(
      getOriginPreview(
        product(ORIGINS_GRAPH.products[0].productHandle),
        invalid,
      ).designations,
      [],
    );
  }
});
