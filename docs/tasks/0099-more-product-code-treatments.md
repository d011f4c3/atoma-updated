# Task 0099 — Extend the product-code study

Date: 2026-10-06

## Brief

Extend the existing `/numbering-exploration` with four additional material-label
ideas, retaining Current, Above name, Corner and Footer line. Use the owner's
`[WZKA-00]`, `[WZKA-01]` and `[WZKA-02]` display codes. Carry the treatments through
Overview, Specifications and the current Quick order Shop, without redesigning
their bodies, controls, product selectors or material scene.

- Caption: integrate the code with the supporting application caption.
- Edge note: a small vertical annotation at the identity's right edge.
- Register: a code aligned with a small open diamond and fine leader, following
  the owner's preference for Register with a symbol other than a cross.
- Specimen tag: a flat, open-ended label beneath the product identity.

## Boundaries

Keep the earlier options and homepage defaults. Reuse the existing explicit
handle-to-code mapping; unknown products receive no code. These are proposed
presentation identifiers, not catalog SKUs, lot records or additional provenance
evidence. Keep that context visible in the study, including on mobile.

Retain the mounted hero, selected product, view, quantity and cart when changing
treatments or themes. Preserve product-name typography and all real purchase
rules. No new dependency, generated imagery, production writes or deployment.

## Verification

Check every new treatment in Overview, Specifications and Shop on desktop and
mobile, both themes, including narrow-screen clearance and selection continuity.
Check known and unknown handles and that the canonical homepage stays unmarked.
Run `pnpm validate`, review the scoped diff and save local browser evidence.

## Result

All four additional treatments are implemented and retained alongside the earlier
placements. The owner subsequently selected Register; Task 0101 records its
adoption. The combined browser review passed 10/10 cases, and `pnpm validate`
passed with 70 unit tests and a production build. Evidence is saved locally under
`.local/product-code-0099/`.
