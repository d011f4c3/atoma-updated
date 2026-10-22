import assert from "node:assert/strict";
import test from "node:test";
import {
  heroSevenDestination,
  heroSevenHref,
  heroSevenState,
} from "../src/lib/new-hero-seven-view.ts";

test("Home product URLs keep their Home context through normalization", () => {
  for (const application of ["ceremonial", "barista", "culinary"]) {
    const state = { view: "home", application };
    assert.deepEqual(heroSevenState(null, application), state);
    assert.equal(heroSevenHref(state), `/new-hero7?application=${application}`);
    assert.deepEqual(heroSevenDestination(heroSevenHref(state)), state);
  }
  assert.equal(heroSevenHref({ view: "home" }), "/new-hero7");
  assert.deepEqual(heroSevenDestination("/new-hero7"), { view: "home" });
});

test("Matcha query and dedicated-route entries retain their own product context", () => {
  for (const application of ["ceremonial", "barista", "culinary"]) {
    const state = { view: "matcha", application };
    assert.deepEqual(heroSevenDestination(heroSevenHref(state)), state);
    assert.deepEqual(
      heroSevenDestination(`/new-hero7/matcha#new-hero7-${application}`),
      state,
    );
  }
});

test("Only product views accept valid application identities", () => {
  for (const view of ["home", "matcha"])
    for (const application of [undefined, "", "unknown", "BARISTA", 1])
      assert.deepEqual(heroSevenState(view, application), { view });
  for (const view of ["samples"]) {
    assert.deepEqual(heroSevenState(view, "barista"), { view });
    assert.deepEqual(
      heroSevenDestination(`/new-hero7?view=${view}&application=barista`),
      { view },
    );
    assert.equal(
      heroSevenHref({ view, application: "barista" }),
      `/new-hero7?view=${view}`,
    );
  }
});

test("Canonical pages, product links and external URLs stay outside in-place navigation", () => {
  for (const href of [
    "/shop",
    "/samples",
    "/origins",
    "/about",
    "/shop/barista-matcha?format=1kg",
    "/origins/wazuka",
    "/new-hero",
    "https://example.com/new-hero7?application=barista",
    "//example.com/new-hero7/matcha",
  ])
    assert.equal(heroSevenDestination(href), null);
});

test("Removed study views reach canonical redirects instead of in-place substitutes", () => {
  for (const view of ["origins", "wholesale"]) {
    assert.equal(heroSevenDestination(`/new-hero7/${view}`), null);
    assert.equal(heroSevenDestination(`/new-hero7?view=${view}`), null);
    assert.deepEqual(heroSevenState(view), { view: "home" });
  }
});

test("Adopted homepage URLs use the root base without changing the saved study default", () => {
  for (const view of ["home", "matcha", "samples"]) {
    const state = { view };
    const suffix = view === "home" ? "" : `?view=${view}`;
    assert.equal(heroSevenHref(state, "/"), `/${suffix}`);
    assert.deepEqual(heroSevenDestination(`/${suffix}`, "/"), state);
    assert.equal(heroSevenHref(state), `/new-hero7${suffix}`);
    assert.equal(heroSevenHref(state, "/new-hero7"), `/new-hero7${suffix}`);
    assert.deepEqual(heroSevenDestination(`/new-hero7${suffix}`), state);
  }
  for (const view of ["home", "matcha"]) {
    for (const application of ["ceremonial", "barista", "culinary"]) {
      const state = { view, application };
      const href = heroSevenHref(state, "/");
      assert.equal(
        href,
        `/?${view === "matcha" ? "view=matcha&" : ""}application=${application}`,
      );
      assert.deepEqual(heroSevenDestination(href, "/"), state);
    }
  }
  assert.deepEqual(
    heroSevenDestination("/?view=samples&application=barista", "/"),
    { view: "samples" },
  );
  assert.equal(
    heroSevenHref({ view: "samples", application: "barista" }, "/"),
    "/?view=samples",
  );
});

test("Root selection navigation does not consume canonical pages or saved study routes", () => {
  for (const href of [
    "/samples",
    "/shop",
    "/origins",
    "/about",
    "/matcha",
    "/home",
    "/shop/barista-matcha?format=1kg",
    "/origins/wazuka",
    "/new-hero7",
    "/new-hero7?view=samples",
    "/new-hero7/matcha#new-hero7-barista",
    "/?view=origins",
    "/?view=wholesale",
    "https://example.com/?view=matcha",
    "//example.com/?view=samples",
  ])
    assert.equal(heroSevenDestination(href, "/"), null, href);
  for (const href of [
    "/",
    "/?view=samples",
    "/?view=matcha&application=barista",
  ])
    assert.equal(
      heroSevenDestination(href),
      null,
      "Saved-study navigation never consumes the adopted root page",
    );
});
