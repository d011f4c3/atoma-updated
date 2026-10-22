# Task 0270 — Why ATOMA on Wholesale

Date: 2026-10-23
Status: Complete

## Owner direction

Add a customer-facing section underneath the matcha collection on `/wholesale`
explaining why buyers should choose ATOMA.

## Scope and content

- Add one concise section after the catalog, with three clear reasons:
  selection by flavour, texture and application; trying all three matchas in
  the Sample Set in the buyer's own drinks and dishes; and using tasting
  profiles, preparation guidance and origin notes to make an informed choice.
- Ground these points in the current canonical About statements, product
  learning and actual Sample Set. Do not introduce supply, certification,
  testing, performance, shipping or complete-traceability claims.
- Use an open ruled layout: three columns on desktop, a readable vertical
  sequence on mobile. Keep the section shorter than an About-page story, with
  one real Sample Set action and no additional product forms.
- Localize all new copy into Japanese, Simplified Chinese and Traditional
  Chinese. Preserve theme tokens, reduced motion and standard page reveals.
- Preserve collection geometry, search, selections, product/dialog return,
  exact ordering and navigation guards. Previous hero/wholesale refinements
  and existing user-deleted study routes remain untouched.

## Verification

Use isolated commerce fixtures to check section placement, responsive and
enlarged-text readability, the Sample Set destination, retained query/quantity
and pending-navigation guards. Compare existing collection geometry at 1440 and
390 px in both themes. Run the focused browser cases, localization/unit checks
through `pnpm validate`, and final diff review.

Evidence: `.local/wholesale-0270/`.

## Result

Why ATOMA now follows the matcha catalog, with a short introduction and three
benefits: “Selected for your menu”, “Try it in your kitchen” and “Know your
matcha”. One guarded action leads to the canonical Sample Set page. The section
uses existing theme tokens and ruled typography, with three desktop columns
and stacked mobile statements. All new copy is available in the four storefront
languages and was reviewed against the existing About and product facts.

- Ten focused browser cases passed, covering section order and responsive
  layout, 320 px Japanese at 200% text, Sample Set navigation and exact
  search/quantity restoration, plus pending-purchase navigation guards.
- Existing catalog geometry is unchanged at 1440 and 390 px in both themes.
  Desktop, mobile and enlarged-text screenshots were visually reviewed.
- `pnpm validate` passed: formatting, lint, types, all 256 unit tests and build.
  The final Chinese wording polish also passed the localization tests.
- Final diff review passed. Browser fixtures intercepted every commerce write;
  no real purchase or deployment ran.

Evidence: `browser-results.json`, `tests/why-*.png`, `baseline/`, `final/` and
`validate.log` under `.local/wholesale-0270/`.
