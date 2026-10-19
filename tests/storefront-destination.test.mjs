import assert from "node:assert/strict";
import test from "node:test";
import {
  parseShippingCountry,
  resolveDestinationPreference,
} from "../src/lib/storefront-destination.ts";

test("destination choice admits only the two launch destinations", () => {
  assert.equal(parseShippingCountry("US"), "US");
  assert.equal(parseShippingCountry("SG"), "SG");
  for (const value of ["JP", "us", " US", "GB", null, {}, ["US"]]) {
    assert.equal(parseShippingCountry(value), null);
  }
});

test("manual country wins over an advisory location hint", () => {
  assert.deepEqual(resolveDestinationPreference("SG", "US", true), {
    countryCode: "SG",
    source: "manual",
  });
});

test("only trusted and supported country hints can initialize destination", () => {
  assert.deepEqual(resolveDestinationPreference(undefined, "SG", true), {
    countryCode: "SG",
    source: "ip",
  });
  for (const [hint, trust] of [
    ["SG", false],
    ["JP", true],
    [null, true],
  ]) {
    assert.deepEqual(resolveDestinationPreference("invalid", hint, trust), {
      countryCode: "US",
      source: "default",
    });
  }
});
