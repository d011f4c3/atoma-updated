import assert from "node:assert/strict";
import test from "node:test";
import { handleCheckoutStudyRequest } from "../src/lib/checkout-study-handler.ts";

const environment = {
  NODE_ENV: "development",
  ATOMA_TEST_CHECKOUT_ENABLED: "true",
  ATOMA_CHECKOUT_STUDY_ENABLED: "true",
  SHOPIFY_STORE_DOMAIN: "h0cuaw-f7.myshopify.com",
  SHOPIFY_CHECKOUT_HOST: "h0cuaw-f7.myshopify.com",
};
const checkoutUrl = "https://h0cuaw-f7.myshopify.com/checkouts/study-sentinel";

async function perform({
  env = {},
  host = "localhost:3100",
  headers = {},
  body = "",
  result,
} = {}) {
  let calls = 0;
  const response = await handleCheckoutStudyRequest(
    new Request(`http://${host}/api/checkout/study`, {
      method: "POST",
      headers: {
        host,
        origin: `http://${host}`,
        "content-type": "application/x-www-form-urlencoded",
        "sec-fetch-site": "same-origin",
        ...headers,
      },
      body,
    }),
    {
      environment: { ...environment, ...env },
      prepareCheckout: async () => {
        calls++;
        if (result instanceof Error) throw result;
        return result ?? { kind: "ready", totalQuantity: 1, checkoutUrl };
      },
    },
  );
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("location"), null);
  return { response, calls, data: await response.json() };
}

test("SDK checkout requires separate study opt-in plus all existing local test gates", async () => {
  for (const env of [
    { ATOMA_CHECKOUT_STUDY_ENABLED: undefined },
    { ATOMA_CHECKOUT_STUDY_ENABLED: "false" },
    { ATOMA_TEST_CHECKOUT_ENABLED: "false" },
    { NODE_ENV: "production" },
    { SHOPIFY_STORE_DOMAIN: "other.myshopify.com" },
    { SHOPIFY_CHECKOUT_HOST: "other.myshopify.com" },
  ]) {
    const { response, calls, data } = await perform({ env });
    assert.equal(response.status, 503);
    assert.equal(calls, 0);
    assert.deepEqual(data, { kind: "unavailable" });
  }
  const remote = await perform({ host: "example.com" });
  assert.equal(remote.response.status, 503);
  assert.equal(remote.calls, 0);
});

test("SDK preparation rejects cross-origin requests and supplied checkout/cart inputs", async () => {
  for (const options of [
    { headers: { origin: "https://attacker.test" } },
    { headers: { "sec-fetch-site": "same-site" } },
    { headers: { "x-forwarded-host": "attacker.test" } },
    { headers: { "content-type": "application/json" }, body: "{}" },
    { body: "checkoutUrl=https://attacker.test" },
    { body: "cart=study-sentinel" },
  ]) {
    const { response, calls, data } = await perform(options);
    assert.ok([400, 403, 503].includes(response.status));
    assert.equal(calls, 0);
    assert.equal("checkoutUrl" in data, false);
  }
});

test("SDK receives only a fresh validated checkout handoff in its private local response", async () => {
  const { response, calls, data } = await perform();
  assert.equal(response.status, 200);
  assert.equal(calls, 1);
  assert.deepEqual(data, { kind: "ready", checkoutUrl });
});

test("SDK failure never discloses a checkout, local retry URL, or provider detail", async () => {
  for (const result of [
    { kind: "empty" },
    { kind: "missing" },
    { kind: "unavailable" },
    new Error("private provider detail"),
    { kind: "ready", totalQuantity: 0, checkoutUrl },
    {
      kind: "ready",
      totalQuantity: 1,
      checkoutUrl: "https://attacker.test/checkout",
    },
  ]) {
    const { response, data } = await perform({ result });
    assert.equal(response.status, 409);
    assert.deepEqual(data, { kind: "unavailable" });
  }
});
