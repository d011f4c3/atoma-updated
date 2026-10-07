# Task 0120 — Product tab label and order

Date: 2026-10-07
Status: Complete locally; verified 2026-10-07
Authority: Owner requests singular “Origin” and Shop before that tab.

## Bounded change

Use Overview → Specifications → Shop → Origin in both shared product-view
selectors. Reuse the existing Origin translation and keep the internal builder
and origins view values stable. Move each tab's existing width allocation with
its label, including the track selector marker. Preserve product/quantity state,
content, typography, themes and interactions. The site-wide Origins directory
and navigation are unchanged; the request concerns the product tab.

## Validation

Update existing browser selectors/order expectations where they identify this
tab. Check desktop/mobile ordering and navigation with retained selection; run
`pnpm validate` and review the scoped diff. No new dependency, data migration,
commerce change or release.

## Evidence

- Both shared selectors now show Overview → Specifications → Shop → Origin.
  CSS column weights and the track marker use the same reordered allocation.
  Internal view values, translations and state handling are unchanged.
- Updated existing product-tab test selectors in 11 browser files, preserving
  global Origins navigation, dialog names and breadcrumbs. Exact per-locale
  DOM order assertions pass in `storefront-localization.mjs` at 1366px and 320px
  across all four languages. Product, quantity and mounted scene persist.
- Desktop/mobile screenshots were visually reviewed. Evidence:
  `.local/product-tab-order-0120/`.
- `pnpm validate` passed formatting, lint, types, all 109 unit tests and the
  production build. Log: `.local/product-tab-order-0120/validation.log`.
  Final scoped diff and whitespace checks pass. No deployment.
