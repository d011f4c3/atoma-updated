# Task 0111 — Build the sample-to-repeat-order journey

Date: 2026-10-06
Status: Deferred by owner to a later task; commercial inputs/setup required
Source: [Feedback §1](../briefs/2026-10-06-client-feedback.md)
Dependencies: Task 0114 launch decision; Task 0112 destination/checkout work

## Outcome

Offer one Sample Set with 30 g each of Ceremonial, Barista and Culinary, leading
buyers to a suitable 1 kg product and a practical repeat-order path. Add clear
entry points on the homepage, Shop and individual product pages using existing
controls and styles.

## Ordered implementation slices

1. Establish actual portioning, packaging, payment, fulfillment and shipping
   costs for launch destinations. Agree price, margin, availability, dispatch
   estimate and any credit/redemption/expiry terms. JPY 4,800 and JPY 1,000
   equivalent credit remain illustrative until approved.
2. Map the actual Shopify Sample Set product/variants to its three 30 g contents
   and 90 g total. Select a supported maintainable fulfillment/bundle approach
   with the operator. Preserve the accepted separate component/pack semantics;
   do not create a fictional purchasable set or build internal lot tooling here.
3. Add sample information and buying entry points with the three intended uses,
   quantities, authoritative price, destination shipping and dispatch estimate.
   Show unavailable/missing-offer states truthfully.
4. Add a simple “order this matcha in 1 kg” path and a reorder mechanism that
   revalidates current price, availability and format. Assess a Shopify-native
   incentive before considering an app; document cost, permissions and terms.
5. Plan follow-up guidance and subscriptions separately. Agree consent/channel,
   frequencies, recurring terms, costs and cancellation behavior before any
   messaging automation or subscription is activated. Start with manual reorder
   if recurring-selling infrastructure is not justified yet.

## Acceptance and checks

Verify set contents, real offer mapping, quantity/availability rules, mobile
entry points and sample-to-1 kg continuity. No stale historical price can become
a new order. Test incentive eligibility/expiry/redemption and failure cases if
implemented; do not promise an unconfigured credit. Run relevant catalog/cart
and mocked browser tests, `pnpm validate` and scoped diff review for each slice.
Use a separate disposable non-production end-to-end checkout after Task 0114.
No app installation, automatic customer communication or production mutation is
authorized by this planning brief.
