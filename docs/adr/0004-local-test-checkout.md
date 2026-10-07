# ADR 0004 — Local test checkout through Shopify

Date: 2026-10-07
Status: Accepted for local test execution by the owner's current request
Related: Task 0127; ADR 0003; Tasks 0114 and 0122

## Decision and authority

The owner now explicitly asks to configure and test checkout all the way through
order completion, optionally using a zero-value product. Permit Shopify-led
checkout for this bounded local test in the already authorized test shop
`h0cuaw-f7.myshopify.com`, using a verified simulated-payment gateway.

This supersedes ADR 0003's unconditional checkout suppression only for opted-in,
non-production, loopback development requests in this ATOMA repository. It also
supersedes Task 0122's no-order/testing restriction for Task 0127's explicit
end-to-end tests. It does not amend JMM, authorize a production launch, resolve
Task 0114's production commercial authority, or permit real charges.

## Boundaries

- An explicit server-only test-checkout flag, exact authorized shop, verified
  checkout host, non-production runtime and canonical loopback request host
  are all required. Fail closed otherwise; do not trust arbitrary forwarded
  headers to enable checkout.
- Preserve sealed HTTP-only cart cookies, same-origin POST checks, current
  catalog/cart validation and authoritative single-attempt mutation semantics.
  Fetch the current checkout URL immediately before a server-side 303 redirect.
  Never accept browser-supplied prices, cart IDs or redirect destinations.
- Shopify owns address entry, available shipping choices, final totals,
  simulated payment and test-order records. The storefront remains JPY.
- Use the prepared US/SG test markets and current shipping configuration as
  test inputs. Real shipping terms, payment onboarding, fulfillment policies,
  buyer-IP/proxy handling and operational ownership remain launch decisions.
- No cardholder data, actual customer identity, real payment, fulfillment,
  shipping-label purchase, new dependency or production deployment is needed.

## Consequences and rollback

This allows a real hosted-checkout test without inventing Core reconciliation
or adding internal operations structures. It establishes no production
readiness claim. Future public activation requires a separate accepted release
boundary and trusted hosting/buyer-IP contract; localhost test behavior is not
such a contract.

Remove or set the local test flag false to disable the handoff. Keep the normal
production build gated even if the flag is accidentally present. Record Shopify
test gateway and market settings, orders and cleanup in Task 0127. Disable the
test gateway before any separately authorized live-sales launch.
