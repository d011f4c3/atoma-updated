import assert from "node:assert/strict";
import test from "node:test";
import {
  ORIGINS_GRAPH,
  getMatchasForPlace,
  getMatchaTypesForProduct,
  getPlaceDescendants,
  getPlacePath,
  getPlacesForMatcha,
  getProductPlaceRecords,
  validateOriginsGraph,
} from "../src/lib/origins-model.ts";

function place(id, kind, parentId = null, publication = "published") {
  return {
    id,
    slug: id,
    name: id,
    kind,
    parentId,
    publication,
    description: "Test place",
  };
}

function product(handle, title = "A title is not provenance") {
  return {
    id: handle,
    handle,
    title,
    description: "Test fixture",
    imageUrl: null,
    imageAlt: "",
    productUrl: null,
    isFixture: true,
    variants: [],
  };
}

function provenance(id, placeId, overrides = {}) {
  return {
    subject: { kind: "material", id },
    placeId,
    role: "grown",
    evidence: "Reviewed test evidence",
    publication: "published",
    ...overrides,
  };
}

function graph() {
  return {
    places: [
      place("country", "country"),
      place("region-a", "region", "country"),
      place("locality-a", "locality", "region-a"),
      place("field-a", "field", "locality-a"),
      place("region-b", "region", "country"),
      place("field-b", "field", "region-b"),
    ],
    types: [
      { id: "culinary", label: "Culinary" },
      { id: "barista", label: "Barista" },
    ],
    materials: [
      { id: "material-one", typeIds: ["culinary"] },
      { id: "material-two", typeIds: ["culinary"] },
      { id: "material-three", typeIds: ["barista"] },
    ],
    products: [
      { productHandle: "one", materialId: "material-one" },
      { productHandle: "two", materialId: "material-two" },
      { productHandle: "three", materialId: "material-three" },
      {
        productHandle: "lot-a-product",
        materialId: "material-one",
        lotId: "lot-a",
      },
      {
        productHandle: "lot-b-product",
        materialId: "material-one",
        lotId: "lot-b",
      },
    ],
    lots: [
      { id: "lot-a", materialId: "material-one" },
      { id: "lot-b", materialId: "material-one" },
    ],
    provenance: [],
  };
}

const ids = (records) => records.map((record) => record.id);
const handles = (records) => records.map((record) => record.handle);

test("current feedback keeps only Ceremonial grown in Wazuka and separates Uji City", () => {
  assert.deepEqual(validateOriginsGraph(ORIGINS_GRAPH), []);
  assert.deepEqual(ids(getPlacePath("wazuka")), ["japan", "kyoto", "wazuka"]);
  assert.deepEqual(ids(getPlacePath("uji-city")), [
    "japan",
    "kyoto",
    "uji-city",
  ]);
  assert.deepEqual(ids(getPlaceDescendants("kyoto")), ["wazuka", "uji-city"]);
  assert.deepEqual(getPlaceDescendants("uji-city"), []);
  assert.deepEqual(ORIGINS_GRAPH.lots, []);
  const catalog = ORIGINS_GRAPH.products.map((link) =>
    product(link.productHandle),
  );
  const ceremonial = catalog[2];
  for (const placeId of ["wazuka", "kyoto", "japan"])
    assert.deepEqual(getMatchasForPlace(placeId, catalog), [ceremonial]);
  assert.deepEqual(getMatchasForPlace("uji-city", catalog), []);
  assert.deepEqual(getMatchasForPlace("uji-tea", catalog), []);
  assert.deepEqual(getPlacePath("uji-tea"), []);
  assert.deepEqual(
    ORIGINS_GRAPH.provenance.map(({ subject, role, placeId }) => ({
      subject,
      role,
      placeId,
    })),
    [
      {
        subject: { kind: "material", id: "sample-tea-service" },
        role: "grown",
        placeId: "wazuka",
      },
    ],
  );
  assert.match(ORIGINS_GRAPH.provenance[0].evidence, /2026-10-06/);
  for (const item of catalog.slice(0, 2)) {
    assert.equal(getMatchaTypesForProduct(item.handle).length, 1);
    assert.deepEqual(getPlacesForMatcha(item.handle), []);
    assert.deepEqual(getProductPlaceRecords(item.handle), []);
  }
  assert.deepEqual(ids(getPlacesForMatcha(ceremonial.handle)), ["wazuka"]);
  assert.deepEqual(getPlacesForMatcha("another-kyoto-matcha"), []);
});

test("published paths and descendants follow the hierarchy and exclude the input itself", () => {
  const model = graph();
  assert.deepEqual(ids(getPlacePath("field-a", model)), [
    "country",
    "region-a",
    "locality-a",
    "field-a",
  ]);
  assert.deepEqual(ids(getPlaceDescendants("region-a", model)), [
    "locality-a",
    "field-a",
  ]);
  assert.deepEqual(getPlaceDescendants("field-a", model), []);
  assert.deepEqual(getPlacePath("unknown", model), []);
  assert.deepEqual(getPlaceDescendants("unknown", model), []);
  model.places.find((entry) => entry.id === "locality-a").publication = "draft";
  assert.deepEqual(getPlacePath("field-a", model), []);
  assert.deepEqual(getPlaceDescendants("region-a", model), []);
});

test("one type can contain multiple live catalog products without title inference or duplicates", () => {
  const model = graph();
  model.provenance = [
    provenance("material-one", "field-a"),
    provenance("material-two", "field-a"),
    provenance("material-one", "field-a"),
  ];
  const catalog = [
    product("two"),
    product("one"),
    product("ONE"),
    product("one"),
    product("unknown", "Culinary Matcha from field-a"),
  ];
  const original = structuredClone(catalog);
  assert.deepEqual(
    handles(getMatchasForPlace("country", catalog, model, "culinary")),
    ["two", "one"],
  );
  assert.deepEqual(
    getMatchasForPlace("country", catalog, model, "barista"),
    [],
  );
  assert.deepEqual(
    getMatchasForPlace("country", catalog, model, "unknown"),
    [],
  );
  assert.deepEqual(getMatchaTypesForProduct("ONE", model), []);
  assert.deepEqual(getMatchaTypesForProduct("Culinary Matcha", model), []);
  assert.deepEqual(catalog, original);
});

test("multi-origin material rolls up from fields while returning only actual growing places", () => {
  const model = graph();
  model.provenance = [
    provenance("material-one", "field-a"),
    provenance("material-one", "field-b"),
    provenance("material-one", "field-a"),
  ];
  const catalog = [product("one")];
  assert.deepEqual(handles(getMatchasForPlace("region-a", catalog, model)), [
    "one",
  ]);
  assert.deepEqual(handles(getMatchasForPlace("region-b", catalog, model)), [
    "one",
  ]);
  assert.deepEqual(handles(getMatchasForPlace("country", catalog, model)), [
    "one",
  ]);
  assert.deepEqual(ids(getPlacesForMatcha("one", model)), [
    "field-a",
    "field-b",
  ]);
});

test("processing, packing, selection and dispatch stay explicit and do not establish growing origin", () => {
  const model = graph();
  model.provenance = ["processed", "packed", "selected", "dispatched"].map(
    (role) => provenance("material-one", "region-a", { role }),
  );
  assert.deepEqual(getMatchasForPlace("country", [product("one")], model), []);
  assert.deepEqual(getPlacesForMatcha("one", model), []);
  assert.deepEqual(
    getProductPlaceRecords("one", model).map((record) => [
      record.role,
      record.place.id,
    ]),
    [
      ["processed", "region-a"],
      ["packed", "region-a"],
      ["selected", "region-a"],
      ["dispatched", "region-a"],
    ],
  );
});

test("draft, unsupported, orphaned and ambiguous relationships fail closed", () => {
  const model = graph();
  model.places.push(
    place("draft", "region", "country", "draft"),
    place("draft-child", "field", "draft"),
  );
  model.provenance = [
    provenance("material-one", "field-a", { publication: "draft" }),
    provenance("material-one", "field-a", { evidence: "  " }),
    provenance("material-one", "unknown"),
    provenance("material-one", "draft-child"),
    provenance("unknown", "field-a"),
    provenance("unknown-lot", "field-a", {
      subject: { kind: "lot", id: "unknown-lot" },
    }),
  ];
  assert.deepEqual(getMatchasForPlace("country", [product("one")], model), []);
  assert.deepEqual(getPlacesForMatcha("one", model), []);
  assert.deepEqual(getProductPlaceRecords("one", model), []);
  assert.match(validateOriginsGraph(model).join(" "), /no evidence/);
  assert.match(validateOriginsGraph(model).join(" "), /unknown place/);
  assert.match(validateOriginsGraph(model).join(" "), /unknown subject/);
  assert.match(
    validateOriginsGraph(model).join(" "),
    /no published place path/,
  );

  const duplicate = graph();
  duplicate.materials.push({ id: "material-one", typeIds: ["barista"] });
  duplicate.provenance = [provenance("material-one", "field-a")];
  assert.deepEqual(
    getMatchasForPlace("country", [product("one")], duplicate),
    [],
  );
  assert.deepEqual(getMatchaTypesForProduct("one", duplicate), []);
});

test("a lot's evidence is limited to that lot's explicit product bindings", () => {
  const model = graph();
  model.provenance = [
    provenance("lot-a", "field-a", { subject: { kind: "lot", id: "lot-a" } }),
  ];
  const catalog = [
    product("one"),
    product("lot-a-product"),
    product("lot-b-product"),
  ];
  assert.deepEqual(handles(getMatchasForPlace("country", catalog, model)), [
    "lot-a-product",
  ]);
  assert.deepEqual(getPlacesForMatcha("one", model), []);
  assert.deepEqual(getPlacesForMatcha("lot-b-product", model), []);
  assert.deepEqual(ids(getPlacesForMatcha("lot-a-product", model)), [
    "field-a",
  ]);

  model.provenance.push(provenance("material-one", "field-b"));
  assert.deepEqual(handles(getMatchasForPlace("region-b", catalog, model)), [
    "one",
    "lot-a-product",
    "lot-b-product",
  ]);
  assert.deepEqual(ids(getPlacesForMatcha("lot-a-product", model)), [
    "field-a",
    "field-b",
  ]);
});

test("invalid lot/material bindings never inherit either material or lot provenance", () => {
  const model = graph();
  model.products.push(
    {
      productHandle: "wrong-material",
      materialId: "material-two",
      lotId: "lot-a",
    },
    {
      productHandle: "missing-lot",
      materialId: "material-one",
      lotId: "missing",
    },
  );
  model.provenance = [
    provenance("lot-a", "field-a", { subject: { kind: "lot", id: "lot-a" } }),
    provenance("material-two", "field-b"),
    provenance("material-one", "field-b"),
  ];
  for (const handle of ["wrong-material", "missing-lot"]) {
    assert.deepEqual(
      getMatchasForPlace("country", [product(handle)], model),
      [],
    );
    assert.deepEqual(getProductPlaceRecords(handle, model), []);
    assert.deepEqual(getMatchaTypesForProduct(handle, model), []);
  }
  assert.match(
    validateOriginsGraph(model).join(" "),
    /Product binding is invalid: wrong-material/,
  );
});

test("type filtering stays with the material that establishes the selected place", () => {
  const model = graph();
  model.products.push(
    { productHandle: "blend", materialId: "material-one" },
    { productHandle: "blend", materialId: "material-three" },
  );
  model.provenance = [
    provenance("material-one", "field-a"),
    provenance("material-three", "field-b"),
  ];
  assert.deepEqual(ids(getMatchaTypesForProduct("blend", model)), [
    "culinary",
    "barista",
  ]);
  assert.deepEqual(
    getMatchasForPlace("field-a", [product("blend")], model, "barista"),
    [],
  );
  assert.deepEqual(
    handles(
      getMatchasForPlace("field-b", [product("blend")], model, "barista"),
    ),
    ["blend"],
  );
  assert.deepEqual(ids(getPlacesForMatcha("blend", model)), [
    "field-a",
    "field-b",
  ]);
});

test("role/place deduplication retains each applicable material and lot subject", () => {
  const model = graph();
  model.provenance = [
    provenance("material-one", "field-a"),
    provenance("lot-a", "field-a", { subject: { kind: "lot", id: "lot-a" } }),
    provenance("lot-a", "field-a", { subject: { kind: "lot", id: "lot-a" } }),
    provenance("material-one", "field-a", { role: "packed" }),
  ];
  const records = getProductPlaceRecords("lot-a-product", model);
  assert.equal(records.length, 2);
  assert.deepEqual(records[0].subjects, [
    { kind: "material", id: "material-one" },
    { kind: "lot", id: "lot-a" },
  ]);
  assert.deepEqual(getProductPlaceRecords("one", model)[0].subjects, [
    { kind: "material", id: "material-one" },
  ]);
  assert.deepEqual(getProductPlaceRecords("LOT-A-PRODUCT", model), []);
});

test("invalid ancestry and unknown graph references are diagnosable without unsafe traversal", () => {
  const model = graph();
  model.places.find((entry) => entry.id === "region-a").parentId = "field-a";
  model.places.push(place("orphan", "field", "missing-parent"));
  model.materials.push({ id: "orphan-material", typeIds: ["missing-type"] });
  model.lots.push({ id: "orphan-lot", materialId: "missing-material" });
  model.provenance = [provenance("material-one", "field-a")];
  assert.deepEqual(getPlacePath("field-a", model), []);
  assert.deepEqual(getPlacePath("orphan", model), []);
  assert.deepEqual(getPlaceDescendants("region-a", model), []);
  assert.deepEqual(getMatchasForPlace("country", [product("one")], model), []);
  const issues = validateOriginsGraph(model).join(" ");
  assert.match(issues, /cycle/);
  assert.match(issues, /unknown parent/);
  assert.match(issues, /unknown type/);
  assert.match(issues, /unknown material/);

  const duplicate = graph();
  duplicate.places.push({ ...duplicate.places[1] });
  assert.deepEqual(getPlacePath("field-a", duplicate), []);
  assert.match(
    validateOriginsGraph(duplicate).join(" "),
    /Place ID is duplicated/,
  );
  assert.match(
    validateOriginsGraph(duplicate).join(" "),
    /Place slug is duplicated/,
  );
});

test("six types scale across countries and shared wholesale/retail materials without changing live availability", () => {
  const model = {
    places: Array.from({ length: 3 }, (_, index) =>
      place(`country-${index}`, "country"),
    ),
    types: [],
    materials: [],
    products: [],
    lots: [],
    provenance: [],
  };
  const catalog = [];
  for (let index = 0; index < 6; index += 1) {
    const typeId = `type-${index}`;
    const sharedMaterial = `shared-${index}`;
    const separateMaterial = `separate-${index}`;
    model.types.push({ id: typeId, label: `Selection ${index + 1}` });
    model.places.push(
      place(`region-${index}`, "region", `country-${index % 3}`),
      place(`field-${index}-a`, "field", `region-${index}`),
      place(`field-${index}-b`, "field", `region-${index}`),
    );
    model.materials.push(
      { id: sharedMaterial, typeIds: [typeId] },
      { id: separateMaterial, typeIds: [typeId] },
    );
    model.provenance.push(
      provenance(sharedMaterial, `field-${index}-a`),
      provenance(sharedMaterial, `field-${index}-b`),
      provenance(separateMaterial, `field-${(index + 1) % 6}-a`),
    );
    for (const offer of ["wholesale", "retail", "separate"]) {
      const handle = `${offer}-${index}`;
      model.products.push({
        productHandle: handle,
        materialId: offer === "separate" ? separateMaterial : sharedMaterial,
      });
      catalog.push({
        ...product(handle, "Japanese Premium Matcha for Lattes"),
        variants: [
          {
            id: `${handle}-variant`,
            title: offer === "wholesale" ? "1 kg" : "30 g",
            available:
              offer === "wholesale" ? index % 2 === 0 : index % 2 !== 0,
            priceMinor: offer === "wholesale" ? 10000 : 1000,
            currency: "JPY",
            options: [{ name: "Offer", value: offer }],
            minimum: offer === "wholesale" ? 5 : 1,
            increment: 1,
            maximum: null,
          },
        ],
      });
    }
  }
  catalog.push(product("unbound", "Japanese Premium Matcha for Lattes"));
  assert.deepEqual(validateOriginsGraph(model), []);
  assert.equal(model.types.length, 6);
  assert.equal(model.places.length, 21);
  const original = structuredClone(catalog);

  for (let index = 0; index < 6; index += 1) {
    const typeId = `type-${index}`;
    const local = getMatchasForPlace(
      `country-${index % 3}`,
      catalog,
      model,
      typeId,
    );
    assert.deepEqual(handles(local), [`wholesale-${index}`, `retail-${index}`]);
    assert.deepEqual(
      local.map((item) => item.variants[0].available),
      [index % 2 === 0, index % 2 !== 0],
    );
    assert.deepEqual(
      handles(getMatchasForPlace(`field-${index}-a`, catalog, model)),
      catalog
        .filter((item) =>
          [
            `wholesale-${index}`,
            `retail-${index}`,
            `separate-${(index + 5) % 6}`,
          ].includes(item.handle),
        )
        .map((item) => item.handle),
    );
    assert.deepEqual(
      handles(
        getMatchasForPlace(
          `country-${(index + 1) % 3}`,
          catalog,
          model,
          typeId,
        ),
      ),
      [`separate-${index}`],
    );
    assert.deepEqual(
      getMatchasForPlace(`country-${(index + 2) % 3}`, catalog, model, typeId),
      [],
    );
    for (const offer of ["wholesale", "retail", "separate"]) {
      assert.deepEqual(
        ids(getMatchaTypesForProduct(`${offer}-${index}`, model)),
        [typeId],
      );
    }
  }
  assert.deepEqual(catalog, original);
  assert.deepEqual(getMatchaTypesForProduct("unbound", model), []);

  const refreshedCatalog = catalog.map((item) =>
    item.handle === "retail-0"
      ? { ...item, variants: [{ ...item.variants[0], available: true }] }
      : item,
  );
  const refreshed = getMatchasForPlace(
    "country-0",
    refreshedCatalog,
    model,
    "type-0",
  );
  assert.deepEqual(handles(refreshed), ["wholesale-0", "retail-0"]);
  assert.equal(refreshed[1].variants[0].available, true);
  assert.strictEqual(
    refreshed[1],
    refreshedCatalog.find((item) => item.handle === "retail-0"),
  );
  assert.equal(
    catalog.find((item) => item.handle === "retail-0").variants[0].available,
    false,
  );
});
