# Task 0119 — A lighter Overview study

Date: 2026-10-07
Status: Study complete; Folded adopted through
[Task 0121](0121-adopt-folded-overview.md)
Authority: Owner asks for a study of the Overview tab, reducing its text-heavy
feeling while keeping type relatively consistent with the other tabs.

## Scope

Create `/overview-study` with the current Overview as a baseline and three
alternatives: Digest, Index and Folded. Keep the current homepage unchanged.
Use one mounted storefront with the current silver bag, left Slides, right Tabs,
Register product code, Panorama Origins and compact Shop. Switching the study
direction must preserve product selection, quantities, language, theme and scene.

- Digest gives three existing material qualities space beside one another,
  exposes actual formats/prices/availability, and folds the longer description,
  preparation guidance and product record into Product details.
- Index uses ruled application and material rows with separate disclosures for
  formats and the complete product information.
- Folded shows the product introduction once, followed by three compact
  disclosures for formats, preparation and the product record.

These are presentation interpretations for review, not approved content or a
new factual product profile. Reuse `getProductContent`, `getProductFormats` and
`getProductFacts`. Keep sample editorial qualities at their existing meaning;
preserve provisional labels and supplier-confirmation notes. Do not fabricate
facts, provenance, price or availability. Use existing translations and the
shared tab heading/body/label sizes, including the CJK font increment. Longer
passages use sentence case. All details remain accessible with native keyboard
and touch disclosures, and the Specifications and Shop actions remain available.

No canonical layout adoption, new photography, dependency, commerce mutation,
commit or deployment is included.

## Verification

Check the four directions on desktop and 320px mobile in Mist and Blue hour.
Verify shared type sizing, readable wrapping, translated content, keyboard
disclosures, all product codes and real projected formats. Check selected
product/quantity and scene continuity while switching directions and tabs.
Use mocked commerce for browser checks, run `pnpm validate`, and review the
scoped diff against the existing uncommitted localization work.

## Evidence

- `/overview-study` defaults to Digest and includes the untouched Current
  comparison. Directions are linkable with `?direction=current`, `digest`,
  `index` or `folded`; desktop uses buttons and mobile a native select.
- The seven browser cases in `tests/overview-study.mjs` passed: desktop and
  320px mobile in both palettes, plus all three translated locales on mobile.
  Verified all three product codes, actual available/unavailable formats and
  prices, provisional facts, keyboard/touch disclosures, and product, quantity
  and mounted-scene continuity. The canonical homepage retains inline details.
- Computed heading and body size, family and weight match Specifications.
  Screenshots were reviewed for all three desktop directions, all six mobile
  direction/theme combinations, and expanded Japanese text. Corrected the
  expanded disclosure icon's small horizontal overflow and ensured the empty
  format message uses the full available width.
- `pnpm validate` passed formatting, lint, type checking, all 109 unit tests
  and the production build. The final scoped diff and `git diff --check` were
  reviewed. Evidence and the validation log are in `.local/overview-study-0119/`.
  No dependency, remote mutation, commit or deployment was introduced.

## Owner refinement — a single Overview

The owner prefers Index and Folded but finds the nested Overview redundant.
Product details now opens directly with the description, followed by preparation
and the product record; its extra Overview subheading is removed in Index and
the shared Digest treatment. Folded shows the full description once in its
introduction and removes the second Overview disclosure, leaving only formats,
preparation and the product record. The same localized content and type scale
are retained, with no changes to the canonical homepage.

All seven browser cases passed again, now checking that no nested Overview
label remains and the complete description appears exactly once. Reviewed
mobile Folded and expanded Japanese captures. `pnpm validate` passed all
checks and 109 unit tests; scoped changes and `git diff --check` were reviewed.
Evidence: `.local/overview-study-0119/nesting-review/` and
`.local/overview-study-0119/nesting-validation.log`.
