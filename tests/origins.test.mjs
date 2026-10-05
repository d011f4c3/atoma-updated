import assert from "node:assert/strict";
import test from "node:test";
import {
  FIELD_ENTRIES,
  getRelatedMatchas,
  getProductFieldEntries,
  getFieldEntriesForPlace,
} from "../src/lib/origins-content.ts";
import { ORIGINS_GRAPH } from "../src/lib/origins-model.ts";

function fixture() {
  const graph = structuredClone(ORIGINS_GRAPH);
  graph.places.push(
    {
      id: "test-locality",
      slug: "test-locality",
      name: "Synthetic locality",
      kind: "locality",
      parentId: "kyoto",
      description: "Test only",
      publication: "published",
    },
    {
      id: "test-country",
      slug: "test-country",
      name: "Synthetic country",
      kind: "country",
      parentId: null,
      description: "Test only",
      publication: "published",
    },
  );
  graph.materials.push({ id: "test-material", typeIds: ["barista"] });
  graph.products.push({
    productHandle: "documented-matcha",
    materialId: "test-material",
  });
  const growingLink = {
    subject: { kind: "material", id: "test-material" },
    role: "grown",
    placeId: "test-locality",
    evidence: "Synthetic test source",
    publication: "published",
  };
  graph.provenance.push(growingLink);
  const story = FIELD_ENTRIES[0];
  const entries = [
    { ...story, slug: "regional-note", placeIds: ["kyoto"] },
    { ...story, slug: "local-note", placeIds: ["test-locality"] },
    {
      ...story,
      slug: "cross-region-note",
      placeIds: ["kyoto", "test-country"],
    },
    { ...story, slug: "other-note", placeIds: ["test-country"] },
  ];
  return { graph, entries, growingLink };
}

test("regional photography alone cannot establish product origins without independent confirmation", () => {
  const graphWithoutProvenance = { ...ORIGINS_GRAPH, provenance: [] };
  assert.equal(FIELD_ENTRIES.length, 1);
  for (const entry of FIELD_ENTRIES) {
    assert.deepEqual(entry.placeIds, ["kyoto"]);
    assert.equal("productHandles" in entry, false);
    assert.match(entry.imageCaption, /Kyoto/);
    assert.deepEqual(
      getRelatedMatchas(
        entry,
        [{ handle: "jmm-storefront-test-matcha" }],
        graphWithoutProvenance,
      ),
      [],
    );
  }
  assert.deepEqual(
    getProductFieldEntries(
      "jmm-storefront-test-matcha",
      graphWithoutProvenance,
    ),
    [],
  );
  assert.deepEqual(getFieldEntriesForPlace("kyoto"), FIELD_ENTRIES);
  assert.deepEqual(getFieldEntriesForPlace("japan"), FIELD_ENTRIES);
});

test("owner-confirmed Wazuka origins connect all three launch products to broader Kyoto context without relabelling photographs", () => {
  const launchProducts = ORIGINS_GRAPH.products.map((link, index) => ({
    handle: link.productHandle,
    title: "Matcha",
    variants: [{ available: index === 0 }],
  }));
  const catalog = [
    ...launchProducts,
    { handle: "another-kyoto-matcha", title: "Kyoto Matcha", variants: [] },
  ];
  assert.deepEqual(
    getRelatedMatchas(FIELD_ENTRIES[0], catalog),
    launchProducts,
  );
  for (const product of launchProducts) {
    assert.deepEqual(getProductFieldEntries(product.handle), FIELD_ENTRIES);
  }
  assert.deepEqual(getProductFieldEntries("another-kyoto-matcha"), []);
  assert.deepEqual(getFieldEntriesForPlace("wazuka"), []);
  assert.deepEqual(FIELD_ENTRIES[0].placeIds, ["kyoto"]);
  assert.match(FIELD_ENTRIES[0].imageCaption, /Kyoto/);
  assert.deepEqual(
    getRelatedMatchas(FIELD_ENTRIES[0], catalog).map(
      (product) => product.variants[0].available,
    ),
    [true, false, false],
  );
});

test("many-to-many editorial coverage rolls up without inventing a narrower place", () => {
  const { graph, entries } = fixture();
  const slugs = (records) => records.map((entry) => entry.slug);
  assert.deepEqual(slugs(getFieldEntriesForPlace("japan", graph, entries)), [
    "regional-note",
    "local-note",
    "cross-region-note",
  ]);
  assert.deepEqual(slugs(getFieldEntriesForPlace("kyoto", graph, entries)), [
    "regional-note",
    "local-note",
    "cross-region-note",
  ]);
  assert.deepEqual(
    slugs(getFieldEntriesForPlace("test-locality", graph, entries)),
    ["local-note"],
  );
  assert.deepEqual(
    slugs(getFieldEntriesForPlace("test-country", graph, entries)),
    ["cross-region-note", "other-note"],
  );
  assert.deepEqual(getFieldEntriesForPlace("unknown", graph, entries), []);
});

test("product field reading follows documented growing places and their broader context", () => {
  const { graph, entries, growingLink } = fixture();
  assert.deepEqual(
    getProductFieldEntries("documented-matcha", graph, entries).map(
      (entry) => entry.slug,
    ),
    ["regional-note", "local-note", "cross-region-note"],
  );
  growingLink.placeId = "kyoto";
  assert.deepEqual(
    getProductFieldEntries("documented-matcha", graph, entries).map(
      (entry) => entry.slug,
    ),
    ["regional-note", "cross-region-note"],
  );
  growingLink.role = "processed";
  assert.deepEqual(
    getProductFieldEntries("documented-matcha", graph, entries),
    [],
  );
});

test("editorial connections require independent evidence and retain live availability", () => {
  const { graph, entries, growingLink } = fixture();
  const products = [
    { handle: "unrelated-matcha", title: "Kyoto matcha", variants: [] },
    {
      handle: "documented-matcha",
      title: "Matcha",
      variants: [{ available: false }],
    },
    { handle: "DOCUMENTED-MATCHA", title: "Matcha", variants: [] },
  ];
  const before = structuredClone(products);
  assert.deepEqual(getRelatedMatchas(entries[0], products, graph), [
    products[1],
  ]);
  assert.equal(
    getRelatedMatchas(entries[0], products, graph)[0].variants[0].available,
    false,
  );
  assert.deepEqual(getRelatedMatchas(entries[3], products, graph), []);
  growingLink.publication = "draft";
  assert.deepEqual(getRelatedMatchas(entries[0], products, graph), []);
  assert.deepEqual(products, before);
});

test("current documentary sections retain unique identities and factual captions", () => {
  for (const entry of FIELD_ENTRIES) {
    assert.equal(
      new Set(entry.sections.map((section) => section.id)).size,
      entry.sections.length,
    );
    for (const section of entry.sections) {
      if (section.image) {
        assert.ok(section.imageAlt);
        assert.match(section.imageCaption, /Kyoto/);
      }
    }
  }
});
