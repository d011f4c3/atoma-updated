import assert from "node:assert/strict";
import test from "node:test";
import {
  ORIGINS_GRAPH,
  getTeaDesignations,
  getProductDesignations,
  getMatchasForDesignation,
  getMatchasForPlace,
  getDirectoryMatchasForPlace,
  getProductPlaceRecords,
  validateOriginsGraph,
} from "../src/lib/origins-model.ts";
import { getOriginPreview } from "../src/lib/origin-preview.ts";
import { getProductFieldEntries } from "../src/lib/origins-content.ts";
import {
  FIELD_ENTRIES,
  getFieldEntryPhotograph,
} from "../src/lib/origins-content.ts";

const catalog = ORIGINS_GRAPH.products.map(({ productHandle }) => ({
  id: productHandle,
  handle: productHandle,
  title: "Matcha",
  description: "Synthetic product",
  variants: [{ available: false }],
}));

test("the Origins directory rolls Uji and Wazuka into Kyoto and Japan without changing growing provenance", () => {
  const order = [catalog[1], catalog[2], catalog[0], catalog[1]];
  const before = structuredClone(order);
  for (const id of ["kyoto", "japan"])
    assert.deepEqual(getDirectoryMatchasForPlace(id, order), order.slice(0, 3));
  assert.deepEqual(getDirectoryMatchasForPlace("uji-city", order), [
    catalog[1],
    catalog[0],
  ]);
  assert.deepEqual(getDirectoryMatchasForPlace("wazuka", order), [catalog[2]]);
  assert.deepEqual(getDirectoryMatchasForPlace("unknown", order), []);
  assert.deepEqual(getDirectoryMatchasForPlace("uji-tea", order), []);
  assert.deepEqual(order, before);
  assert.deepEqual(getMatchasForPlace("kyoto", catalog), [catalog[2]]);
  assert.deepEqual(getMatchasForPlace("uji-city", catalog), []);
  for (const product of catalog.slice(0, 2)) {
    assert.deepEqual(getProductPlaceRecords(product.handle), []);
    assert.deepEqual(getProductFieldEntries(product.handle), []);
  }
  const both = structuredClone(ORIGINS_GRAPH);
  both.designationLinks.push({
    ...both.designationLinks[0],
    materialId: "sample-tea-service",
  });
  assert.deepEqual(
    getDirectoryMatchasForPlace("kyoto", order, both),
    order.slice(0, 3),
  );
});

test("directory type filters use the same material as the qualifying origin or designation", () => {
  for (const [index, type] of ["culinary", "barista", "tea-service"].entries())
    assert.deepEqual(
      getDirectoryMatchasForPlace("kyoto", catalog, ORIGINS_GRAPH, type),
      [catalog[index]],
    );
  assert.deepEqual(
    getDirectoryMatchasForPlace("kyoto", catalog, ORIGINS_GRAPH, "unknown"),
    [],
  );
  const graph = structuredClone(ORIGINS_GRAPH);
  graph.materials.push({ id: "unassociated", typeIds: ["tea-service"] });
  graph.products.push({
    productHandle: catalog[0].handle,
    materialId: "unassociated",
  });
  assert.deepEqual(
    getDirectoryMatchasForPlace("kyoto", catalog, graph, "tea-service"),
    [catalog[2]],
  );
});

test("directory designation roll-up requires a published unambiguous context path within the selected place", () => {
  const invalidGraphs = [];
  for (const update of [
    { publication: "draft" },
    { parentId: "missing" },
    { parentId: "uji-city" },
  ]) {
    const graph = structuredClone(ORIGINS_GRAPH);
    Object.assign(
      graph.places.find(({ id }) => id === "uji-city"),
      update,
    );
    invalidGraphs.push(graph);
  }
  const duplicate = structuredClone(ORIGINS_GRAPH);
  duplicate.places.push({
    ...duplicate.places.find(({ id }) => id === "uji-city"),
  });
  invalidGraphs.push(duplicate);
  const unknown = structuredClone(ORIGINS_GRAPH);
  unknown.designations[0].contextPlaceId = "missing";
  invalidGraphs.push(unknown);
  for (const graph of invalidGraphs)
    assert.deepEqual(getDirectoryMatchasForPlace("kyoto", catalog, graph), [
      catalog[2],
    ]);

  const unrelated = structuredClone(ORIGINS_GRAPH);
  unrelated.places.push({
    id: "elsewhere",
    slug: "elsewhere",
    name: "Elsewhere",
    kind: "region",
    parentId: "japan",
    description: "Synthetic unrelated context",
    publication: "published",
  });
  unrelated.designations[0].contextPlaceId = "elsewhere";
  assert.deepEqual(getDirectoryMatchasForPlace("kyoto", catalog, unrelated), [
    catalog[2],
  ]);
  assert.deepEqual(
    getDirectoryMatchasForPlace("japan", catalog, unrelated),
    catalog,
  );

  const unpublishedAncestor = structuredClone(ORIGINS_GRAPH);
  unpublishedAncestor.places.find(({ id }) => id === "kyoto").publication =
    "draft";
  assert.deepEqual(
    getDirectoryMatchasForPlace("kyoto", catalog, unpublishedAncestor),
    [],
  );
  assert.deepEqual(
    getDirectoryMatchasForPlace("japan", catalog, unpublishedAncestor),
    [],
  );
});

test("UJI binds only the two confirmed materials and never supplies geographic provenance", () => {
  assert.deepEqual(validateOriginsGraph(ORIGINS_GRAPH), []);
  assert.deepEqual(
    getTeaDesignations().map(({ id }) => id),
    ["uji-tea"],
  );
  assert.deepEqual(
    getMatchasForDesignation("uji-tea", catalog),
    catalog.slice(0, 2),
  );
  for (const product of catalog.slice(0, 2)) {
    assert.deepEqual(
      getProductDesignations(product.handle).map(({ id }) => id),
      ["uji-tea"],
    );
    assert.deepEqual(getProductPlaceRecords(product.handle), []);
    assert.deepEqual(getProductFieldEntries(product.handle), []);
    const preview = getOriginPreview(product);
    assert.deepEqual(preview.places, []);
    assert.equal(preview.designations[0].name, "Uji City");
    assert.equal(
      preview.designations[0].photograph.image,
      "/images/origins/uji-context-landscape.jpg",
    );
    assert.notEqual(
      preview.designations[0].photograph.image,
      FIELD_ENTRIES[0].image,
    );
    assert.equal(
      preview.designations[0].photograph.imageAlt,
      getFieldEntryPhotograph(FIELD_ENTRIES[0], "uji-city").imageAlt,
    );
    assert.equal(
      preview.designations[0].photograph.imageCaption,
      FIELD_ENTRIES[0].imageCaption,
    );
    assert.equal(preview.designations[0].roleLabel, "Origin");
    assert.equal(
      preview.designations[0].hierarchyLabel,
      "Geographic hierarchy",
    );
    assert.deepEqual(
      preview.designations[0].path.map(({ name, kind }) => [kind, name]),
      [
        ["country", "Japan"],
        ["region", "Kyoto"],
        ["locality", "Uji City"],
      ],
    );
    assert.match(
      preview.designations[0].description,
      /Specific growing and processing locations are not yet published/,
    );
  }
  assert.deepEqual(getProductDesignations(catalog[2].handle), []);
  assert.deepEqual(getMatchasForPlace("wazuka", catalog), [catalog[2]]);
  assert.deepEqual(getMatchasForPlace("uji-tea", catalog), []);
  assert.deepEqual(getMatchasForPlace("uji-city", catalog), []);
});

test("designation type filters follow the same material that supplies the association", () => {
  assert.deepEqual(
    getMatchasForDesignation("uji-tea", catalog, ORIGINS_GRAPH, "culinary"),
    [catalog[0]],
  );
  assert.deepEqual(
    getMatchasForDesignation("uji-tea", catalog, ORIGINS_GRAPH, "barista"),
    [catalog[1]],
  );
  const graph = structuredClone(ORIGINS_GRAPH);
  graph.materials.push({
    id: "unassociated-material",
    typeIds: ["tea-service"],
  });
  graph.products.push({
    productHandle: catalog[0].handle,
    materialId: "unassociated-material",
  });
  assert.deepEqual(
    getMatchasForDesignation("uji-tea", catalog, graph, "tea-service"),
    [],
  );
  assert.deepEqual(
    getMatchasForDesignation("uji-tea", catalog, graph, "unknown-type"),
    [],
  );
});

test("designation lookup uses exact material identity and preserves availability and list order", () => {
  const order = [catalog[1], catalog[2], catalog[0], catalog[1]];
  const before = structuredClone(order);
  assert.deepEqual(getMatchasForDesignation("uji-tea", order), [
    catalog[1],
    catalog[0],
  ]);
  assert.deepEqual(order, before);
  for (const handle of [
    "barista-matcha",
    "culinary-matcha",
    "UJI-00",
    catalog[0].handle.toUpperCase(),
    "unmapped-uji-matcha",
    "constructor",
    "__proto__",
  ]) {
    assert.deepEqual(getProductDesignations(handle), []);
    assert.deepEqual(
      getOriginPreview({ ...catalog[0], handle, title: "UJI Wazuka Matcha" })
        .designations,
      [],
    );
  }
  assert.deepEqual(getMatchasForDesignation("unpublished", catalog), []);
});

test("draft, source-free, ambiguous and invalid designation records fail closed", () => {
  const invalidGraphs = [];
  for (const field of ["designations", "designationLinks"]) {
    for (const update of [{ publication: "draft" }, { evidence: " " }]) {
      const graph = structuredClone(ORIGINS_GRAPH);
      graph[field] = graph[field].map((record) => ({ ...record, ...update }));
      invalidGraphs.push(graph);
    }
  }
  const duplicate = structuredClone(ORIGINS_GRAPH);
  duplicate.designations.push({ ...duplicate.designations[0] });
  invalidGraphs.push(duplicate);
  const missingMaterial = structuredClone(ORIGINS_GRAPH);
  missingMaterial.materials = missingMaterial.materials.filter(
    ({ id }) => id === "sample-tea-service",
  );
  invalidGraphs.push(missingMaterial);
  const brokenLink = structuredClone(ORIGINS_GRAPH);
  brokenLink.designationLinks = brokenLink.designationLinks.map((record) => ({
    ...record,
    designationId: "unknown",
  }));
  invalidGraphs.push(brokenLink);
  for (const graph of invalidGraphs) {
    assert.deepEqual(getMatchasForDesignation("uji-tea", catalog, graph), []);
    assert.deepEqual(getDirectoryMatchasForPlace("kyoto", catalog, graph), [
      catalog[2],
    ]);
  }
  assert.ok(
    validateOriginsGraph(duplicate).some((issue) => /duplicated/.test(issue)),
  );
  assert.ok(
    validateOriginsGraph(brokenLink).some((issue) =>
      /Designation binding is invalid/.test(issue),
    ),
  );
});

test("a product material binding cannot be inferred from codes, names or a malformed lot relationship", () => {
  const graph = structuredClone(ORIGINS_GRAPH);
  graph.products = graph.products.map((product) => ({
    ...product,
    lotId: "unrelated-lot",
  }));
  assert.deepEqual(getMatchasForDesignation("uji-tea", catalog, graph), []);
  assert.deepEqual(
    getProductDesignations(catalog[0].handle, {
      ...ORIGINS_GRAPH,
      products: [],
    }),
    [],
  );
});
