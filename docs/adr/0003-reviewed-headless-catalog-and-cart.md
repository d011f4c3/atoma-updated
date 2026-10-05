# ADR 0003 — Reuse the reviewed headless catalog and cart

Date: 2026-09-29
Status: Accepted for the local implementation in Task 0019

## Decision and scope

The current owner request authorizes in-place product selection and a functional
headless cart in this frontend. The owner explicitly confirms that the current
Shopify test products are the products for this experience. Fixture naming does
not prevent selection or cart actions. Shopify availability and quantity rules
continue to apply. Visitors remain in ATOMA; there is no handoff to a Shopify
Online Store theme or the older storefront.

Use the existing reviewed `@jmm/shopify-storefront` and
`@jmm/domain-contracts` packages as exact local tarball dependencies. They are
private workspace packages, not published registry packages. This avoids a
machine-specific sibling import, a second vendor implementation, and importing
the retired presentation. The tarballs preserve package export maps, runtime
validation, exact money, version checks, bounded reads, single-attempt writes,
and server-only runtime conditions. The Storefront API stays pinned to `2026-07`;
the packaged adapter pins `@shopify/storefront-api-client` to `2.0.0`.

`pnpm-workspace.yaml` overrides the private domain package's transitive registry
locator to the same local snapshot. Existing strict engines, exact versions, and
install-script restrictions remain intact. Two local packages and the existing
adapter's two vendor client packages are the dependency consequence. No service,
database, Admin API, new production permission, or deployment is introduced.

Snapshot origin: `atoma-storefront`, commit
`ed3e7572f19360cdd04cd06b5822988fe927bf5d`. The source package subtrees were clean.
Both packages were built with Node 24.20.0 and pnpm 11.24.0, then packed without
source modifications.

| File                                      | SHA-256                                                            |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `vendor/jmm-domain-contracts-0.0.0.tgz`   | `739a5bbda996364edd04fddcdf3381c76f9b06bd295eb52bc935fce9618c1658` |
| `vendor/jmm-shopify-storefront-0.0.0.tgz` | `d058b8db5a184864d3567f27f9961d9450a3ecaa489b3de4d70b635b9991969a` |

Upgrading a snapshot requires rebuilding and replacing both applicable packages,
recording source provenance and checksums, and rerunning validation. They must not
be edited inside the archives.

## Local API and application boundary

`GET /api/catalog` returns a display projection of the reviewed published catalog.
It never returns private configuration, merchant SKU labels, raw Shopify product
or variant IDs, or raw vendor errors. Variant IDs in the projection are signed
application locators; they are resolved against a fresh product read before cart
writes. Missing configuration or a failed upstream read returns HTTP 503 and an
explicit `unavailable` state. Successful empty reads remain `empty`. Only
successful results are cached, for 30 seconds, with in-flight requests shared.
The catalog client permits one bounded safe-read retry for transient upstream
failures. Cart mutations remain single-attempt. Responses use
`Cache-Control: no-store`.

`GET /api/cart` returns the reviewed public cart view model. `POST /api/cart`
accepts only exact add/update/remove commands with signed variant/line locators
and integer quantities. The route requires a same-origin JSON request and caps
the body at 2 KiB. It never accepts a browser price, Shopify identifier, cart
reference, or checkout URL. Errors and ambiguous writes stay explicit. A mutation
is never automatically replayed; the visitor reviews fresh cart state first.

The application, session, configuration, and form-input logic are copied from the
same source commit's `apps/storefront/src/features/cart/` directory. Changes are
limited to local import names, inlining the unchanged small delivery-label helper,
disabling selling-plan capability, restricting the environment to the reviewed
shop, and giving this frontend its own cookie names. The strict JSON parser and
Next route wrapper are new and separately tested. Existing cart safeguards remain:
fresh publication checks, quantity rules, preflight/returned-state comparison,
current-line resolution, mutation warning handling, and non-enumerable cart
credentials. Cart references are sealed using the reviewed AES-256-GCM/HKDF
session contract and stored only in HTTP-only SameSite cookies.

Ignored `.env.local` contains only `SHOPIFY_STORE_DOMAIN`,
`SHOPIFY_STOREFRONT_PRIVATE_TOKEN`, and a new independent
`JMM_CART_SESSION_SECRET`. Its permissions are `0600`. No value is printed,
committed, serialized to the client, or copied from the older cart session.
Optional selling plans remain disabled. No source repository was modified.

## Checkout and source of truth

Cart interaction is functional for the authorized products. Hosted checkout
remains disabled in the response because the accepted Core reconciliation gate
and exact checkout host have not been configured for this storefront. This is a
checkout integration limit, not a prohibition on using test products. The API
never returns a checkout URL or sends visitors to a password-protected shop.

JMM ADR 0015/0016/0018 and the technical charter still govern commerce. Only a
reconciled Core offer may become checkout-enabled; Shopify executes the cart,
checkout, payment, and order. The existing test shop authorization establishes
isolation, while TASK 0209 explicitly left checkout unconfigured. A later checkout
slice needs the reviewed offer boundary, exact verified host, and applicable
payment/shipping/test configuration. No payment or order is placed here.

This is a local preview using the existing default JPY market. Public production
buyer traffic still needs a verified hosting proxy/buyer-IP contract, appropriate
abuse controls, and the human-approved release step. Local preview configuration
is not a production release approval.

## Verification evidence

Read-only probes on 2026-09-29 confirmed API version `2026-07`, three published
products with one 1 kg variant each, one available and two unavailable. Money is
JPY with zero minor digits; each quantity rule is minimum 1, increment 1, no
published maximum. The current Headless products all have null `onlineStoreUrl`;
the public shop root redirects to its password page. Thus no product theme link
is inferred from a Headless handle.

A disposable cart check through the local API succeeded: add one unit, update to
two, reload the authoritative cart, remove the line, and confirm an empty cart.
The test checked only safe aggregate results. A cross-origin mutation returned
HTTP 403. No cart credentials, action locators, or vendor payloads were logged.
No checkout, payment, order, catalog, or inventory write occurred. The line was
removed after verification. The same-origin wrapper uses the actual request Host
because Next normalizes the internal development URL differently for localhost
and 127.0.0.1; it does not trust forwarded-host headers.

The focused catalog/cart tests cover exact money and quantity validation,
projection redaction, signed locators, test-product eligibility, fresh availability
checks, strict mutation inputs, and ambiguous writes attempted exactly once.
The repository gate now runs these behavior tests before building. Local API
verification returned three products and signed variant locators. Full page and
cart interaction review is recorded in Task 0019.

Official references checked for the pinned version:

- [Shopify Product](https://shopify.dev/docs/api/storefront/2026-07/objects/Product)
  defines published product fields and nullable `onlineStoreUrl`.
- [Storefront API getting started](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/getting-started)
  defines the headless Storefront boundary.
- [pnpm settings](https://pnpm.io/settings) places dependency overrides in
  `pnpm-workspace.yaml` for the pinned package-manager generation.
