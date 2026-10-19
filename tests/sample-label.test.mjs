import assert from "node:assert/strict";
import test from "node:test";
import { getSampleLabelPlace } from "../src/lib/sample-label.ts";
import { SAMPLE_SET_CONTENTS } from "../src/lib/sample-set.ts";
import { ORIGINS_GRAPH } from "../src/lib/origins-model.ts";

const ceremonial = SAMPLE_SET_CONTENTS.find(
  (sample) => sample.key === "ceremonial",
).productHandle;
const barista = SAMPLE_SET_CONTENTS.find(
  (sample) => sample.key === "barista",
).productHandle;

test("sample stickers distinguish confirmed growing origin from tea designation", () => {
  const before = structuredClone(ORIGINS_GRAPH);
  for (const sample of SAMPLE_SET_CONTENTS) {
    assert.deepEqual(
      getSampleLabelPlace(sample.productHandle),
      sample.key === "ceremonial"
        ? { label: "Growing place", value: "Wazuka, Kyoto, Japan" }
        : { label: "Tea designation", value: "UJI" },
    );
  }
  assert.deepEqual(ORIGINS_GRAPH, before);
  for (const unsupported of ["ceremonial-matcha", "WZKA-00", "unknown"]) {
    assert.equal(getSampleLabelPlace(unsupported), null);
  }
});

test("sample stickers exclude unpublished, unsourced and non-growing place claims", () => {
  for (const update of [
    { publication: "draft" },
    { evidence: "" },
    { role: "packed" },
    { role: "processed" },
  ]) {
    const graph = structuredClone(ORIGINS_GRAPH);
    Object.assign(graph.provenance[0], update);
    assert.equal(getSampleLabelPlace(ceremonial, graph), null);
  }
  const privateParent = structuredClone(ORIGINS_GRAPH);
  privateParent.places.find((place) => place.id === "kyoto").publication =
    "draft";
  assert.equal(getSampleLabelPlace(ceremonial, privateParent), null);
});

test("sample sticker designations require both a published link and a sourced definition", () => {
  for (const field of ["designationLinks", "designations"]) {
    for (const update of [{ publication: "draft" }, { evidence: "" }]) {
      const graph = structuredClone(ORIGINS_GRAPH);
      Object.assign(graph[field][0], update);
      assert.equal(getSampleLabelPlace(barista, graph), null);
    }
  }
});
