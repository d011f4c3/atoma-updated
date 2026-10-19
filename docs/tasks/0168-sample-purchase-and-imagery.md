# Task 0168 — Sample-first purchase and left imagery study

Date: 2026-10-18
Status: frontend implemented and Shopify draft prepared; commercial inputs pending.

## Request and boundaries

The owner requests Sample Set as the default after Explore, purchase controls
on the right, a study of imagery on the left, and Shopify setup so the set can
be ordered. This supersedes Task 0165's tea-first default. The separate Samples
page remains in navigation and shareable. The October 6 feedback confirms
three 30 g contents and 90 g net tea, but its JPY 4,800 price and credit are
illustrative. Price, stock allocation and test-versus-live scope are requested
from the owner before making any offer purchasable. No deployment or real
payment is included.

## Frontend

- Fresh Explore opens the set. Explicit product links open their requested tea;
  later tea/context choices persist through local navigation. Existing tea,
  format, quantity, reference and mounted material remain intact.
- The right panel reuses the dedicated Samples purchase model, verified offer
  resolver, quantity rules, real price, shared Add to cart and cart errors.
  Loading, retry, missing-offer and sold-out states remain truthful. Its compact
  presentation uses homepage type and controls; dedicated Samples is unchanged.
- A neutral three-swatch image represents the complete set on the homepage.
  `/samples-imagery-study` compares Set portrait, Focal study, Open arrangement
  and Horizontal register in the existing layout. All use supplied powder
  photographs. Options change in place and never change the purchased product.
  The individual tea renderer remains mounted behind the set stage.
- The complete catalog remains authoritative for offer resolution and cart
  checks. Ordinary tea surfaces exclude only the exact reviewed sample handle;
  direct product URLs for that handle redirect to `/samples`. Historical
  layouts retain their design and real tea selections.

## Shopify

The existing isolated shop is `h0cuaw-f7.myshopify.com`. Inspection confirms
three existing test-only tea products and no Sample Set. Existing Storefront
credentials and Admin access are reused; no new app or scope is needed.
Commercial price and quantity have not been inferred from the reference brief.

Saved `[TEST ONLY] Sample Set — 3 × 30 g` as an unpublished Draft. Its handle is
`test-only-sample-set-3-30-g`, with the single exact option `Set: 3 × 30 g`.
The reviewed reference is mapped locally, but cannot resolve until this exact
offer appears in the published catalog. The product description records the
confirmed three contents and 90 g net tea, plus its test-only setup status.

Inventory is tracked at zero, with selling out of stock disabled. The blank
price saved as Shopify's zero default; this is not an approved price. Draft
status prevents ordering. Only the existing JMM Next.js Storefront channel is
configured; Online Store, POS and Shop are excluded. No real order, payment,
inventory allocation, fulfillment or deployment was performed. Packed shipping
weight and terms are also unapproved. Price, available quantity and whether the
next step is test ordering or real customer sales remain required owner inputs.

Admin record: product `16383707316305`, variant `62997353136209`.
Saved proof: `.local/sample-start-purchase-0168/shopify-draft.png`.

## Verification

The reported image-switch failure was traced to the study option not yet being
passed through the homepage component to the left material stage. That connection
is now implemented. All four options visibly change at 1440 px and 390 px;
Focal study's tea preview changes only the image. Both roots stay mounted,
photographs fit, and there are no horizontal overflow or runtime errors.
Scoped formatting, lint and TypeScript pass. Evidence:
`.local/sample-imagery-0168/`.

The first-Explore readiness issue is also fixed: the hidden tea renderer retains
measurable bounds behind the set artwork so initialization can complete. Mobile
keeps that hidden stage out of document flow. Final desktop light and mobile dark
checks pass for the default set, unavailable purchase, restored tea/format/quantity,
mounted renderer, Samples/Back navigation and explicit product links. Evidence:
`.local/sample-start-purchase-0168/browser/`.

`pnpm validate` passes: formatting, lint, generated route types, strict
TypeScript, all 146 unit tests and the production build. Final tracked diff
review is clean, with `git diff --check` passing.

The new `tests/sample-start-purchase.mjs` passes at 1440 px light and 320 px
dark using the exact mapped offer with isolated catalog/cart fixtures. It
checks authoritative fixture prices, minimum/increment/maximum quantities,
totals, duplicate-add protection, pending locks, a rejected response without
automatic replay, deliberate keyboard retry, successful cart rendering and
focus return, and exclusion from ordinary tea selectors. Every write is
intercepted locally; no Shopify order is created. Its scoped formatting and
lint pass. Screenshots in `.local/sample-start-purchase-0168/available/` show
test prices, not approved commercial values.

A final read of the real local catalog returns ready with three products and
no published Sample Set, confirming that the draft remains unavailable.
