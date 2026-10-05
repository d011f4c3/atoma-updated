# Task 0101 — Adopt Register product codes

Date: 2026-10-06

## Brief

The owner chooses Register from `/numbering-exploration` for the current site,
using its small open diamond in place of a cross. Apply the treatment to the
homepage product cards, Overview, Specifications and Quick order Shop. Also add
a small matching product code to each known product's dedicated `/shop` card.

## Boundaries

Use the existing owner-requested `[WZKA-00]`, `[WZKA-01]` and `[WZKA-02]` display
identifiers mapped to explicit catalog handles. Unknown products receive no
invented code. These codes do not replace commerce identifiers or create new
origin, lot or traceability claims.

Keep the current page composition, type scale, material scene, product names,
selection and order state, real availability, cart behavior and theme switching.
Retain all study options; label the unmarked comparison No code and make Register
the study default. No new dependencies, commerce contract changes or deployment.

## Verification

Review the adopted treatment in all three homepage panels and the dedicated Shop
on desktop/mobile and both themes. Check code/name clearance, known/unknown
products, correct Shop links, stable selection/quantity and keyboard access.
Run `pnpm validate` and review the scoped diff.

## Result

Register is enabled on the canonical homepage, with matching 9px codes on the
dedicated Shop cards. All study options remain available. The shared annotation
keeps product headings intact, and Specifications' default layout is scoped so
it cannot override the selected code treatment.

- Browser checks passed 10/10 across 1440px and 320px in both themes, covering the
  study, adopted panels, Shop links, accessible codes, unknown-product fallback,
  keyboard controls and preserved selection, quantity and mounted scene.
- `pnpm validate` passed: formatting, ESLint, strict TypeScript, 70 unit tests and
  the production build. The scoped source diff was reviewed.
- Visual evidence is local under `.local/product-code-0099/adoption-evidence/`
  and `.local/register-shop-0101/`. Commerce requests were mocked for browser
  verification; no production writes or deployment were performed.
