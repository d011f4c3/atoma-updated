# Task 0095 — Second homepage Shop exploration

Date: 2026-10-06

## Brief

Create `/shop-exploration-2` with at least three easier purchase layouts for the
homepage Shop section, retaining the existing information. The owner's follow-up
selects Quick order for the homepage; adopt it at `/` and in `/hero-study` while
retaining the comparison route. The dedicated `/shop` page remains unchanged.

## Design

- Guided order: clear numbered sections for format, quantity and purchase.
- Quick order: a compact control group with a direct purchase action.
- Order receipt: selection controls beside an itemized order summary.
- Include Previous as a comparison. Keep the silver bag, powder, left product
  selector, information tabs and site header in their current composition.

## Behavior and boundaries

Reuse the canonical selection model, product content, published formats/prices,
quantity constraints, purchase options, material information and cart. Keep the
scene and selection mounted while switching layouts or themes. All layouts must
retain unavailable, loading, empty, retry and pending states. Do not fabricate
formats, availability, subscriptions or commercial terms. No new dependencies,
services or production writes. Preserve other study implementations.

## Validation

Review each layout on desktop and mobile in both themes, verify selection and
quantity continuity, availability rules, keyboard controls and material details.
Run relevant behavior checks, `pnpm validate`, and inspect the final scoped diff.
Use intercepted requests for any cart-write verification.
