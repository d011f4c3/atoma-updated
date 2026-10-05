# Task 0035 — Restore the subscription choice

Date: 2026-09-30
Status: Implemented UI; live subscription activation blocked

The owner asks to reintroduce Subscribe. Restore a clear purchase-type
choice within the current buying flow while preserving its approved typography,
six-pixel corners, dark-filled/light-outlined controls and mobile layout.

## Current implementation scope

- Show One-time purchase as the active purchase type and Subscribe as an
  unavailable option. Explain the unavailable state plainly; do not suggest
  that a recurring order can currently be submitted.
- Do not invent a discount, recurring price, delivery frequency, commitment,
  cancellation promise or product eligibility. The requested option label is
  not evidence of a configured savings offer.
- Preserve one-time prices, quantities, availability, Add to cart behaviour,
  errors, cart identity and the existing checkout gate.
- Keep the server/API contract, selling-plan capability and cart cookies
  unchanged in this initial UI restoration. Do not modify Shopify permissions,
  plans, products, prices or other remote settings.

## Read-only findings

The earlier implementation is recorded in JMM
`docs/tasks/0156-atoma-subscription-purchase-flow.md`. It built one-time and
recurring selection, but its last documented setup state had no saved plans and
no approved frequencies, prices or eligible products. Its allocation read was
denied. This is historical evidence, not proof of the current plan inventory.

A current bounded probe through V3's vendored adapter used
`sellingPlansEnabled: true`. The published catalog returned three products.
The first product-detail allocation read returned GraphQL `ACCESS_DENIED`.
The probe stopped after those two read requests; no mutation occurred and no
credentials, identifiers or vendor payloads were output. Current plan counts
and eligibility therefore remain **unknown**, not zero.

V3 currently disables selling-plan reads in both
`src/lib/catalog-server.ts` and `src/lib/cart-server.ts`. Its public
`CatalogVariant` omits plans and its `available` projection excludes
subscription-only products. The cart application still contains the reviewed
plan-aware authorization and response checks inherited from the earlier flow.

The vendored adapter's `readPublishedCatalog()` always uses its plan-free
catalog query, even when the capability is enabled. Real allocations require
`readPublishedProductByHandle()` with that capability. Flipping only the
catalog client's flag would not populate subscription choices.

## Contract for a later real activation

The existing vendored `CatalogSellingPlan` contains:

```ts
{
  reference: CatalogSellingPlanReference;
  name: string;
  description: string | null;
  deliveryInterval: "day" | "week" | "month" | "year";
  deliveryIntervalCount: number;
  price: CatalogMoney; // exact integer minor units plus currency
}
```

The reviewed adapter supports constant-price recurring pay-per-delivery plans
with matching billing/delivery intervals, one price, a full initial charge and
no remaining balance. It excludes prepaid, deferred and changing-price plans
rather than presenting them as a simple recurring unit price. Allocation reads
are bounded and malformed or truncated data fails validation.

Activation needs verified selling-plan read access and validated existing plan
terms, then bounded per-product detail reads and an explicit shared capability
gate for catalog and cart. Any discount shown must come from the actual plan
allocation compared with the corresponding one-time price.

Use `createPublishedVariantActionKey(variantReference, planReference)` to expose
an opaque key for the exact purchase. The existing cart request can continue to
send `{ action: "add", productHandle, variantKey, quantity }`; the server already
resolves the key against a fresh product read and preserves the selected plan.
Never accept a browser-supplied raw plan ID or price, or silently substitute a
one-time purchase when a plan becomes unavailable.

`CartLineViewModel.sellingPlan` already provides name, description, delivery
label and recurring price label. The drawer now renders these terms when provided, including the unit price per
delivery. Live recurring lines remain unverified while access is denied. Cart sessions bind the
capability mode, so enabling it invalidates incompatible existing guest-cart
cookies. That rollout consequence must be handled explicitly, without weakening
the session contract. Checkout activation remains separately gated.

Reference implementation in JMM:

- `apps/storefront/src/features/catalog/product-purchase-selector.tsx`
- `apps/storefront/src/features/catalog/application.ts`
- `apps/storefront/src/features/catalog/view-model.ts`
- `apps/storefront/src/features/catalog/selling-plan-config.ts`
- `packages/shopify-storefront/src/selling-plans.ts`

## Validation

For this UI slice, verify the active one-time choice and the unavailable
subscription option through keyboard and pointer input; ensure the explanation
is accessible and the disabled choice cannot change purchase identity, amount
or the submitted request. Review both themes at desktop and phone widths, run
the relevant existing tests and `pnpm validate`, and review the scoped diff.
Use local intercepted cart requests for browser mutation checks.

A later activation additionally needs tests for exact plan projection/prices,
required-plan products, absent/ineligible plans, stale or tampered purchase keys,
mixed one-time/recurring cart lines, quantity changes preserving the plan,
capability-bound sessions and visible recurring terms. The earlier JMM catalog,
cart and adapter tests contain these contract cases. This task does not claim
that live recurring checkout has been verified.

## Initial UI result

The shared PurchaseOptions presentation appears in the homepage Shop flow,
standard controls and dedicated collection. One-time remains selected, with
Subscribe disabled and “Not available yet” visible. A savings amount is not
shown. Cart terms render when a real selling-plan projection is supplied.
The live API, capability mode, cookie identity and checkout gates are unchanged.

CUA verified checked/disabled states and unchanged quantity through mobile mode
and theme transitions. Browser regression assertions were added but the full
standalone harness was not run. `pnpm validate` passed (26 unit tests plus
formatting, lint, types and production build). Live subscriptions cannot be
activated or validated until the Shopify access and actual terms are available.
