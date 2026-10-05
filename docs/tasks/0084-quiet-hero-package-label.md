# Task 0084 — Restore the structured hero label

## Approved brief

The owner finds the large hero logo distracting and wants another package-design
pass, drawing on the structured label in Shop. In follow-up, the owner requested
removing quantity from the bag and replacing it with text in Antro Vectra.

## Scope

- Reuse the existing Shop label hierarchy in the hero: small ATOMA identifier,
  selected product/application, ruled specifications and format.
- Replace the quantity field on hero and Shop bags with a small handwritten
  “Matcha” note in the existing Antro Vectra font. Keep order quantity in the
  Shop controls and retain the original paper label's default fields.
- Place the print quietly within the central foil face. Remove the separate
  oversized wordmark and keep the hero ink settled through entry and handoff.
- Preserve the approved hero photograph, larger scale, lighting, powder/Shop
  flow, canonical selected copy, loading readiness and both site themes.
- No asset generation, dependencies, commerce writes or deployment.

## Validation

Review mobile and desktop hero, both themes, Explore/Shop/return and selection
continuity. Run formatting and `pnpm validate`, review the scoped diff, and save
previews. Confirm that neither silver bag renders quantity, the selected format
retains its unit casing, and Shop quantity controls still work.

## Results

- Restored the structured Shop label on the hero with a small ATOMA identifier,
  quieter placement and settled ink during handoff.
- Both silver bags now show “Matcha” in Antro Vectra instead of quantity; the
  original paper label keeps its default quantity field.
- Reviewed the mobile hero at 390 × 844 and desktop at 1440 × 1000, including
  light/dark themes and the Explore → Shop → hero journey. The format retained
  `1 kg`, the bag note remained unchanged when Shop quantity increased from 01
  to 02, and the displayed price updated accordingly. Final quantity is 01.
- `pnpm validate` passed: formatting, lint, types, all 63 tests and build.
  Reviewed the bounded diff against pre-change snapshots; `git diff --check`
  passed. No commerce write or deployment was performed.
- Saved previews: `docs/design/hero-label-mobile-0084.png` and
  `docs/design/hero-label-desktop-0084.png`.
