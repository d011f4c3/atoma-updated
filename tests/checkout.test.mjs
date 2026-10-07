import assert from "node:assert/strict";
import test from "node:test";
import { handleCheckoutRequest } from "../src/lib/checkout-handler.ts";
import {
  isLocalTestCheckoutRequest,
  readCheckoutHost,
} from "../src/lib/checkout-policy.ts";

const environment = {
  NODE_ENV: "development",
  ATOMA_TEST_CHECKOUT_ENABLED: "true",
  SHOPIFY_STORE_DOMAIN: "h0cuaw-f7.myshopify.com",
  SHOPIFY_CHECKOUT_HOST: "h0cuaw-f7.myshopify.com",
};
const checkoutUrl =
  "https://h0cuaw-f7.myshopify.com/checkouts/private-sentinel";
function request({
  host = "127.0.0.1:3100",
  headers = {},
  body = "",
  method = "POST",
  search = "",
} = {}) {
  return new Request(`http://${host}/api/checkout${search}`, {
    method,
    headers: {
      host,
      origin: `http://${host}`,
      "content-type": "application/x-www-form-urlencoded",
      "sec-fetch-site": "same-origin",
      ...headers,
    },
    ...(method === "POST" ? { body } : {}),
  });
}
async function perform(
  req = request(),
  overrides = {},
  result = { kind: "ready", totalQuantity: 1, checkoutUrl },
) {
  let calls = 0;
  const response = await handleCheckoutRequest(req, {
    environment: { ...environment, ...overrides },
    prepareCheckout: async () => {
      calls += 1;
      if (result instanceof Error) throw result;
      return result;
    },
  });
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.doesNotMatch(
    await response.clone().text(),
    /private-sentinel|checkoutUrl/,
  );
  return { response, calls };
}

test("test checkout needs explicit opt-in, exact shop/host, non-production and loopback", async () => {
  for (const override of [
    { NODE_ENV: "production" },
    { NODE_ENV: undefined },
    { ATOMA_TEST_CHECKOUT_ENABLED: undefined },
    { ATOMA_TEST_CHECKOUT_ENABLED: "1" },
    { SHOPIFY_STORE_DOMAIN: "another.myshopify.com" },
    { SHOPIFY_CHECKOUT_HOST: undefined },
    { SHOPIFY_CHECKOUT_HOST: "another.myshopify.com" },
  ]) {
    const { response, calls } = await perform(request(), override);
    assert.equal(response.status, 503);
    assert.equal(calls, 0);
  }
  for (const host of ["localhost:3100", "127.0.0.1:3100", "[::1]:3100"]) {
    assert.equal(
      isLocalTestCheckoutRequest(request({ host }), environment),
      true,
    );
  }
  for (const host of [
    "example.com",
    "localhost.evil.test",
    "127.0.0.1.evil.test",
    "192.168.1.1",
  ]) {
    assert.equal(
      isLocalTestCheckoutRequest(request({ host }), environment),
      false,
    );
  }
});

test("checkout host syntax rejects schemes, credentials, paths, invalid ports and noncanonical case", () => {
  for (const host of [
    "",
    "https://h0cuaw-f7.myshopify.com",
    "user@h0cuaw-f7.myshopify.com",
    "h0cuaw-f7.myshopify.com/a",
    "h0cuaw-f7.myshopify.com:65536",
    "H0cuaw-f7.myshopify.com",
    " h0cuaw-f7.myshopify.com",
  ]) {
    assert.throws(
      () => readCheckoutHost({ SHOPIFY_CHECKOUT_HOST: host }),
      /configuration is invalid/,
    );
  }
});

test("cross-origin and spoofed forwarding reject before any checkout lookup", async () => {
  for (const headers of [
    { origin: "https://attacker.test" },
    { origin: "null" },
    { "sec-fetch-site": "cross-site" },
    { "sec-fetch-site": "same-site" },
    { "x-forwarded-host": "attacker.test" },
    { "x-forwarded-proto": "https" },
    { forwarded: "host=localhost:3100" },
  ]) {
    const { response, calls } = await perform(request({ headers }));
    assert.ok([403, 503].includes(response.status));
    assert.equal(calls, 0);
  }
  const normalized = request({
    headers: {
      "x-forwarded-host": "127.0.0.1:3100",
      "x-forwarded-proto": "http",
    },
  });
  assert.equal(isLocalTestCheckoutRequest(normalized, environment), true);
});

test("checkout accepts only an empty form POST, never browser cart IDs or URLs", async () => {
  for (const options of [
    { body: `checkoutUrl=${encodeURIComponent(checkoutUrl)}` },
    { body: "cart=private-sentinel" },
    { body: "reviewRequired=false" },
    { body: "x".repeat(3000) },
    { search: "?checkoutUrl=attacker" },
    { headers: { "content-type": "application/json" }, body: "{}" },
    { method: "GET" },
  ]) {
    const { response, calls } = await perform(request(options));
    assert.ok([400, 403].includes(response.status));
    assert.equal(calls, 0);
  }
});

test("fresh checkout succeeds only through a private immediate 303 redirect", async () => {
  const { response, calls } = await perform();
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), checkoutUrl);
  assert.equal(calls, 1);
  assert.equal(await response.text(), "");
});

test("missing, empty, stale, rejected, or hostile checkout results return safely for review", async () => {
  for (const result of [
    { kind: "empty" },
    { kind: "missing" },
    { kind: "unavailable" },
    { kind: "error" },
    new Error("private-sentinel"),
    { kind: "ready", totalQuantity: 0, checkoutUrl },
    ...[
      "https://attacker.test/checkout",
      "http://h0cuaw-f7.myshopify.com/checkout",
      "https://user@h0cuaw-f7.myshopify.com/checkout",
      `${checkoutUrl}#secret`,
    ].map((url) => ({ kind: "ready", totalQuantity: 1, checkoutUrl: url })),
  ]) {
    const { response, calls } = await perform(
      request({
        headers: { referer: "http://127.0.0.1:3100/shop/test-matcha" },
      }),
      {},
      result,
    );
    assert.equal(response.status, 303);
    assert.equal(
      response.headers.get("location"),
      "http://127.0.0.1:3100/shop/test-matcha?checkout=retry",
    );
    assert.equal(calls, 1);
  }
  for (const referer of [
    "https://attacker.test/shop",
    "http://127.0.0.1:3100/api/checkout",
    "http://127.0.0.1:3100//attacker.test",
    "invalid",
  ]) {
    const { response } = await perform(
      request({ headers: { referer } }),
      {},
      { kind: "missing" },
    );
    assert.equal(
      response.headers.get("location"),
      "http://127.0.0.1:3100/?checkout=retry",
    );
  }
});

test("checkout retry preserves one canonical homepage product handle and drops unrelated query parameters", async () => {
  for (const handle of ["jmm-storefront-test-matcha", "a".repeat(255)]) {
    const { response } = await perform(
      request({
        headers: {
          referer: `http://127.0.0.1:3100/?matcha=${handle}&checkout=attacker&returnTo=https%3A%2F%2Fattacker.test`,
        },
      }),
      {},
      { kind: "missing" },
    );
    assert.equal(
      response.headers.get("location"),
      `http://127.0.0.1:3100/?matcha=${handle}&checkout=retry`,
    );
  }
});

test("checkout retry discards duplicate or invalid homepage handles and untrusted referers", async () => {
  for (const query of [
    "matcha=",
    "matcha=tea&matcha=tea",
    "matcha=tea&matcha=other",
    "matcha=UPPERCASE",
    "matcha=tea--powder",
    "matcha=-tea",
    "matcha=tea-",
    "matcha=tea%26checkout%3Dattacker",
    "matcha=%2F%2Fattacker.test",
    `matcha=${"a".repeat(256)}`,
  ]) {
    const { response } = await perform(
      request({ headers: { referer: `http://127.0.0.1:3100/?${query}` } }),
      {},
      { kind: "missing" },
    );
    assert.equal(
      response.headers.get("location"),
      "http://127.0.0.1:3100/?checkout=retry",
    );
  }
  for (const referer of [
    "https://attacker.test/?matcha=tea",
    "http://localhost:3100/?matcha=tea",
    "http://127.0.0.1:3100/api/checkout?matcha=tea",
  ]) {
    const { response } = await perform(
      request({ headers: { referer } }),
      {},
      { kind: "missing" },
    );
    assert.equal(
      response.headers.get("location"),
      "http://127.0.0.1:3100/?checkout=retry",
    );
  }
  const { response } = await perform(
    request({ headers: { referer: "http://127.0.0.1:3100/shop?matcha=tea" } }),
    {},
    { kind: "missing" },
  );
  assert.equal(
    response.headers.get("location"),
    "http://127.0.0.1:3100/shop?checkout=retry",
  );
});
