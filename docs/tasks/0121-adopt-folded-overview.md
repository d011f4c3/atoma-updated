# Task 0121 — Adopt Folded for Overview

Date: 2026-10-07
Status: Complete locally
Authority: Owner selects Folded from the Overview study after removing the
nested Overview section.

## Scope

Use the existing Folded presentation on the canonical homepage in both Mist
and Blue hour. Keep its single introduction and three native disclosures for
formats and availability, application and preparation, and the product record.
Retain the existing shared tab type sizes, sentence-case body text, translations,
Register codes, publication-aware facts, actual formats/prices/availability,
Specifications and Shop actions, and product/quantity/scene continuity.

Adopt through the homepage's explicit prop. Keep shared defaults, retail product
details, the other tabs and all saved studies unchanged. Preserve Task 0120's
Overview → Specifications → Shop → Origin tab order. The previous study baseline
is labelled Original, retaining its existing `current` URL value; no alternative
or study default is removed. No new content, dependency, commerce behavior,
commit or deployment.

## Verification

Update existing browser expectations for the adopted layout while retaining
the old inline comparison and retail disclosure assertions. Check desktop/mobile,
both themes and all languages, native disclosure keyboard/touch access,
complete facts and formats, matching typography, and selected product/quantity
and mounted-scene continuity. Use mocked commerce, review screenshots, run
`pnpm validate`, and review the scoped diff.

## Evidence

- The canonical homepage explicitly selects Folded. Theme changes reuse this
  same presentation; shared component defaults and the saved alternatives remain
  intact. The study baseline is now called Original, with its URL unchanged.
- All seven Overview study/adoption browser cases passed: desktop and 320px
  mobile in both themes, plus Simplified Chinese, Traditional Chinese and
  Japanese. Verified three initially closed disclosures, one full introduction,
  register codes, matching typography, native keyboard/touch access, complete
  product facts/formats, and retained product, quantity and material scene.
- All four product-information browser cases passed across both viewport sizes
  and themes, preserving provisional fact labels and retail disclosure content.
  Updated existing homepage and product-code selectors for the adopted markup.
- Reviewed canonical desktop/mobile captures, including expanded Japanese copy.
  Evidence is in `.local/adopt-folded-0121/` and
  `.local/folded-overview-adoption-0121/product-records/`.
- `pnpm validate` passed formatting, ESLint, TypeScript, all 109 unit tests and
  the production build. Log: `.local/adopt-folded-0121/validation.log`.
  Final scoped source changes and `git diff --check` were reviewed. No deployment.
