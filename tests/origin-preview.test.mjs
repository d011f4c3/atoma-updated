import assert from "node:assert/strict";
import test from "node:test";
import { getOriginPreview } from "../src/lib/origin-preview.ts";
import { ORIGINS_GRAPH } from "../src/lib/origins-model.ts";
import { FIELD_ENTRIES } from "../src/lib/origins-content.ts";

function product(handle = ORIGINS_GRAPH.products[0].productHandle) {
  return {
    id: handle,
    handle,
    title: "Japanese Culinary Matcha Powder for Cafés & Baking — 1 kg",
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
  };
}

test("origin preview keeps confirmed growing place separate from broader photographic context", () => {
  for (const link of ORIGINS_GRAPH.products) {
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
  const materialId = lotOnly.products[0].materialId;
  lotOnly.lots = [{ id: "documented-lot", materialId }];
  lotOnly.products[0].lotId = "documented-lot";
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
