# Task 0220 — Future filters in Shop

Date: 2026-10-20

## Request and scope

Add the future Shop filters previously shown in the filter study. Display Taste
and Region alongside the working Category control on `/shop`.

## Implementation

Use the existing shared filter-bar placements, clearly marked “Coming soon.”
Keep these as noninteractive text, with no plus icon, unavailable dropdown or
invented filter values. Localize the labels and collection heading in all four
storefront languages. Allow the labels and status to stack on narrow screens.

Preserve active category filtering, counts, URL state, mounted cards, Sample Set
entry, popup behavior, saved matcha and commerce state. Keep the study's future
toggle and earlier filter directions. This supersedes Task 0215's study-only
placement of future fields; it does not activate taste or region filtering.

No new catalog classifications, dependencies, commerce operations or deployment.

## Verification

- Four focused browser checks pass: Chrome at 1440 px in both themes, WebKit at
  390 px, and a 320 px Japanese layout check. Reviewed desktop and mobile
  captures, including translated labels in light and dark themes.
- Taste and Region fit their fields and remain noninteractive and nonfocusable.
  Category selection, counts, clear action, keyboard popup behavior, URL/history,
  mounted cards and product-page return remain intact without catalog refetches.
  Sample Set remains visible. Browser fixtures block external writes.
- All seven localization tests pass, including translated filter labels and
  duplicate-key checks. Independent source review found no blockers.
- Evidence: `.local/future-shop-filters-0220/`. Existing browser harness:
  `tests/shop-filter-study.mjs`.
- Initial validation found three missing study route wrappers. Restored their
  exact previous source from local development source maps, preserving the
  homepage purchase study, archived sample study and filter study.
- Final `pnpm validate` passes formatting, lint, strict TypeScript, all 218 unit
  tests and the production build. Final diff review and whitespace checks pass.
