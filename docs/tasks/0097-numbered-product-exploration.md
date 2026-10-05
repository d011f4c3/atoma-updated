# Task 0097 — Product-code placement exploration

Date: 2026-10-06

## Brief

Compare three restrained code placements at `/numbering-exploration`, keeping
the existing powder cards and carrying the code into Overview. The owner wants
[WZKA-00], [WZKA-01] and [WZKA-02] for Culinary, Barista and Ceremonial. The initial
wholesale redesigns and the subsequent code-to-the-left treatment were rejected.
The current request retains the original card design and asks for 2–3 other
placements. Include Current as an unnumbered comparison.

- Above name: a small identifier above the existing text.
- Corner: the code sits apart from the product name in the card corner.
- Footer line: a fine rule separates the reference code from the identity.

## Content and boundaries

Map known handles consistently, independent of catalog order; unknown products
receive no code. These owner-specified display codes do not change commerce
identifiers or create evidence of product provenance. Preserve names, editorial
information, pricing, formats and availability. Keep the original homepage and
selected Quick order implementation intact pending design selection.

Reuse the canonical selection model, material scenes, information tabs, Overview
body and product details. Preserve selection and quantity when switching between
placements and themes. No new dependencies or production writes.

## Validation

Check both themes, desktop/mobile layout, keyboard access, matching code and
Overview identity, and order continuity. Run `pnpm validate`, review scoped diffs,
and save screenshots.

## Verification results

- Reviewed all three placements at 1440 × 1000 in the existing theme system.
- Checked mobile cards at 390 × 844 and 320 × 760. No document overflow at 390px;
  labels and full codes fit the narrow card layout.
- Keyboard-selected Barista and confirmed [WZKA-01] remained selected and matched
  Overview after changing placement. Canonical names, availability and details
  remained intact. No cart writes were performed.
- Full repository validation passed, including 68 tests and production build.
  Scoped integration diffs were reviewed; unrelated in-progress edits retained.
- Owner accepted the exploration as a starting point; no design adoption inferred.
