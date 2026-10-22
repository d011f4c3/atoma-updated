# Task 0256 — Product popup clarity and presentation

Date: 2026-10-22
Status: Complete

## Direction

The owner identifies the product popup as the main remaining UX and visual
problem. Rebuild the canonical homepage/application popup with a compact
product presentation, useful learning hierarchy and accessible order controls.

- The owner rejected the initial compact table/stacked-image treatment and
  released the layout requirements. Use a large application image with a switch
  to the powder swatch, a separate reading pane and Overview/Preparation tabs.
  Mobile gets a photographic header and its own scrolling reading area.
- The owner's final clarification requires a complete purchase popup: format,
  quantity, real price and Add to cart remain inside it. Learning and purchasing
  happen in the same popup.
- Remove stretched blank space, repetitive prose and competing dismissal
  controls. Keep Close, Escape and outside dismissal with exact focus, scroll
  and history restoration.
- The final CTA hierarchy keeps Add to cart primary in every state, disabled
  honestly when purchase is not available. Sample Set is always a smaller,
  secondary route. Known unavailable formats show one stock message and retain
  price/format information without an unusable quantity control.
- Preserve independent per-product orders, quantity rules, catalog/destination
  review, pending/error states and real cart contracts. Multiple formats must
  remain selectable. Do not invent stock, claims or preparation measurements.
- Retain approved palettes, typography, restrained rounding and motion. Scope
  the new presentation to canonical popup entry; preserve homepage layouts,
  dedicated pages and saved studies. No dependencies or deployment.

## Verification

Inspect available/unavailable products at desktop, short desktop, phone and
short landscape sizes, both themes and Japanese/enlarged text. Test learning,
ordering, state retention, dismissal and failure/review states with isolated
commerce fixtures. Run focused checks, `pnpm validate`, and review task diffs.

## Delivered and checked

- Image-led purchase folio with application/powder image choices and keyboard
  accessible Overview/Preparation tabs. Full profile and preparation are available
  without leaving the popup.
- Add to cart is primary in every state; Sample Set is a secondary text link.
  Desktop frame reduced to 64 × 38 rem and heading to 28 px in the final scale pass.
- Seven isolated popup browser cases passed, including quantity retention,
  unavailable/multiple formats, catalog failure, destination review, pending
  guards, native dismissal/history/focus/scroll and enlarged Japanese text.
- Six mobile homepage regressions and desktop/mobile typography/selection checks
  passed. The mobile motion observation was rerun alone after a missed animation
  frame under concurrent browser load and passed without changing the assertion.
- Visual review covered 1440 × 900, 1280 × 600, 390 × 844, 320 × 568,
  844 × 390, Japanese light and 200% text. Final scale checks retained reachable
  purchase controls. Evidence: `.local/popup-0256/`.
- `pnpm validate` passed (format, lint, types, all unit tests and production build).
  Task diff reviewed; `git diff --check` passed. No deployment or live writes.
