# Task 0134 — Refresh the cart after popup checkout

Date: 2026-10-08
Status: Implemented and verified locally
Authority: The owner reports that completed checkout leaves the storefront cart
visible and asks for the confusing state to be corrected.
Related: Task 0131; ADR 0006

## Scope

Keep the approved cart layout and native Shopify checkout popup. During an
active popup attempt, reread the existing public cart endpoint when the
storefront regains focus or visibility and on page restoration. Poll only while
visible, beginning after 10 seconds and backing off to 30 seconds. Bound each
request and allow one read at a time.

Only an authoritative empty or missing response, or a valid cart with zero
lines, clears the cart badge and checkout lock. A nonempty cart, request failure
or malformed response preserves the selection and lock. Focus, closure and
window-reference loss do not establish payment completion. Deliberate review
remains available for canceled checkout. Ignore stale responses after review,
a newer attempt or mutation, and abort reads on hiding or unmounting.

Shopify's pinned Storefront API 2026-07 deletes completed carts when an order is
created. Missing carts can also be expired: this fix reconciles the cart without
claiming an order was paid. The existing backend already distinguishes null
from failures and creates a new cart on the next add after an authoritative
missing result. No backend endpoint, cookie write, dependency, service, UI style
or production permission is introduced.

## Validation

- Test automatic clearing and badge reset while the checkout window remains
  open, across all four locales.
- Preserve nonempty carts on cancellation, transport/server/malformed failures,
  duplicate-attempt guards and COOP window-reference separation.
- Check hidden-tab pause, serialized reads and delayed stale response rejection.
- Retain the hosted fallback regression suite, then run `pnpm validate` and
  review the scoped diff. Do not submit a new order for this regression check.

## Sources

- [Shopify cart lifecycle](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/migrate-to-cart-api#important-notes)
- [Storefront API 2026-07 cart query](https://shopify.dev/docs/api/storefront/2026-07/queries/cart)

## Outcome

The cart now reconciles during an active popup attempt without releasing its
write/checkout guard first. Empty/missing results clear the selection and badge
automatically; canceled checkout, failed reads and nonempty carts retain them.
There are no layout, CSS, translation, backend or payment-configuration changes.

`tests/checkout-popup.mjs` passed English at 1366px, Simplified and Traditional
Chinese at 390px, and Japanese at 320px. Coverage includes automatic empty,
missing and valid zero-line clearing with the checkout window still open;
transport, HTTP 503 and malformed-response preservation; cancellation; COOP;
hidden-tab pause; serialized reads; and an old empty response arriving after a
new checkout attempt. Polling stops after successful reconciliation.

The unchanged `tests/checkout-flow.mjs` passed all four locales with blocked-popup
fallbacks. These eight browser scenarios use isolated commerce fixtures; no new
Shopify order or payment was submitted. The existing Task 0127 simulated order
baseline remains the real Shopify payment evidence.

`pnpm validate` passed formatting, ESLint, TypeScript, all 130 unit tests and
the production build. Reviewed the source, test changes and scoped diff.
No database changes required Supabase checks. Browser captures are saved under
`.local/checkout-0134/browser/`. The change is local; no deployment occurred.
