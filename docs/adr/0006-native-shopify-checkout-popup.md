# ADR 0006 — Native Shopify checkout popup

Date: 2026-10-08
Status: Accepted for the owner's selected local checkout experience
Related: Task 0131; ADRs 0004 and 0005

## Decision

Present the standard Shopify hosted checkout in a browser window opened by
the existing cart's checkout gesture. Target the existing empty native form
POST at that window; keep the actual checkout URL exclusively in the server's
validated 303 redirect. Use same-tab checkout when the browser blocks popups.

This selects a presentation of the previously tested flow, not a replacement
checkout or payment processor. It avoids promoting the alpha Checkout Kit to
the canonical cart. The SDK and custom visual concept remain isolated studies.
No new dependency, API, service, credential or payment authority is introduced.

Preserve ADR 0004's test-only runtime, exact shop, same-origin and current-cart
validation. Keep JPY and the existing US/SG test configuration. The parent
window must not collect payment details, inspect cross-origin checkout content,
or infer order completion from focus or WindowProxy closure. Deliberate cart
recovery must reread Shopify's current cart. Dismissing the ATOMA drawer does
not close or cancel a possible payment in the checkout window.

## Consequences

Browsers can choose a tab instead of a popup. Popup blocking falls back to the
working redirect flow. Reliable payment completion remains Shopify's
responsibility; the storefront offers recovery without claiming an order was
paid. Cross-Origin-Opener-Policy can sever the window reference, so that signal
alone must not trigger another payment attempt.

Express wallets are configured with Shopify's payment providers and rendered
by Shopify according to buyer/browser eligibility. A popup does not enable a
wallet or complete merchant onboarding. Keep the simulated gateway for local
tests; live provider activation and production checkout require their separate
owner-controlled setup and release steps.

The rejected Shopify branding draft remains unpublished. This decision does
not authorize production launch or a new Shopify Payments account.

## Amendment — Automatic cart reconciliation (Task 0134)

An active popup checkout also triggers read-only cart reconciliation when the
storefront regains focus or visibility, on page restoration and through bounded
visible-only polling. A successful missing/empty cart response clears the stale
selection and lock. Nonempty carts and failed or malformed reads preserve them;
window closure and focus remain insufficient to infer payment. Deliberate
review still recovers a canceled or unresolved attempt. Reads are serialized,
aborted when hidden and invalidated across attempts and mutations.

Shopify deletes completed carts upon order creation. Missing is also possible
after expiration, so this is an authoritative cart refresh, not paid-order
confirmation. The existing server projection and new-cart recovery suffice;
no webhook, new endpoint or cookie mutation is needed for this change.

## Evidence

- [Shopify accelerated checkouts](https://help.shopify.com/en/manual/payments/accelerated-checkouts)
- [Checkout Kit preview status](https://shopify.dev/docs/agents/carts-and-checkout/checkout-kit)
- [Window opening and opener policy](https://developer.mozilla.org/en-US/docs/Web/API/Window/open)
