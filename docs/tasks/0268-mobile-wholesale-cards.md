# Task 0268 — Simple mobile wholesale cards

Date: 2026-10-23
Status: Complete

## Owner direction

The owner approves the desktop wholesale experience and requests a simpler
mobile shop with cards in a vertical scroll.

## Scope

- Below the existing mobile breakpoint, use one vertical column of complete
  product cards with larger approved application imagery, concise identity and
  the existing real purchase controls visible directly on each card.
- Remove the separate mobile price and Order disclosure. Keep one mounted buyer
  per product so search, route returns and viewport changes retain exact format
  and quantity. Preserve cart, availability, refresh, review and pending guards.
- Retain direct product image/name links, optional learning dialogs, the Sample
  Set invitation and working catalog search. Future products use only published
  identity, imagery and offers; ambiguous records remain non-purchasable.
- Preserve the approved desktop layout, both themes, localization, motion and
  factual boundaries. Leave the earlier user-deleted study routes untouched.

## Verification

Use isolated catalog/cart browser fixtures that block all real commerce writes.
Inspect mobile cards in both themes, 320 px and enlarged Japanese, multi-format
and unavailable products, future catalogs, direct purchase, retained orders,
search, product/dialog return and pending guards. Compare desktop with its prior
presentation. Run the focused browser suite, `pnpm validate` and final diff review.

Evidence: `.local/wholesale-0268/`.

## Result

Mobile Wholesale now uses one vertical column of lightly surfaced, ruled cards.
Each card shows its application and code, a complete application image, concise
identity and taste, and the existing format/price and purchase controls. The
separate Order disclosure and repeated mobile price are removed. Names and
images still lead to canonical product pages; optional quick learning remains.

At 390 px, quantity and Add sit together; at 320 px they stack across the card.
Card insets remain bounded when text is enlarged, and prices and multi-unit
totals stay readable. Unavailable products use a clear disabled status. One
buyer remains mounted per product, preserving independent selections while
search hides cards and while customers resize or visit product details.

Desktop geometry at 1280 and 1440 px remains unchanged in both themes. Existing
hero changes and user-deleted study routes are preserved.

- All 22 isolated browser cases passed, including direct mobile buying,
  unavailable/multiple formats, exact mock purchase payloads, retained orders,
  query/history/focus return, expanded catalogs, pending/error guards and 320 px
  Japanese at 200% text. The enlarged unit amount and multi-unit total remain
  unbroken. All commerce writes were intercepted by fixtures.
- Desktop card geometry matches at both sizes and in both themes. The 1280 px
  screenshots are pixel-identical. At 1440 px, only tiny image-raster differences
  inside the pastry remain (at most 2/255 per channel); typography, layout and
  controls outside that image are identical.
- Final mobile screenshots are under `tests/`, `final-tests/` and `refinements/`.
  Desktop comparison is recorded in `desktop-comparison.json`.
- `pnpm validate` passed: formatting, lint, types, all 256 unit tests and build.
  Final diff review passed. No deployment or real commerce writes were made.
