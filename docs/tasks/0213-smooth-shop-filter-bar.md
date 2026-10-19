# Task 0213 — Refine the Shop study filter bar

Date: 2026-10-20

## Request and scope

Refine the preferred Filter bar in `/shop-filter-study`: center its arrow and
make the category disclosure feel smoother. Open this study on Filter bar by
default while keeping the two earlier directions and explicit URL choices.
Canonical Shop adoption is outside this refinement.

## Implementation

Replace the inline panel with a compact, opaque popup anchored to Category.
Keep the product grid still during opening and closing. Stack the categories in
comfortable touch rows, with counts and a quiet selected check. Use a centered
SVG chevron and short, interruptible opacity/translation transitions. On phones,
the popup follows the trigger width; it opens above when space below is limited.

Keep the disclosure nonmodal, with category button semantics and normal Tab
navigation. Outside pointer interaction, focus departure and Escape close it.
Selection and Escape restore trigger focus without scrolling. Closed choices
are immediately inert and hidden from accessibility APIs while the visual exit
finishes. Direction changes and commerce locks reset disclosure state. Respect
reduced motion and preserve category, mounted products, themes and cart behavior.

No dependencies, commerce-contract changes, production writes or deployment.

## Verification

- Fourteen browser scenarios pass: seven each in Chromium and WebKit. Reviewed
  390px and 1440px in both themes, plus above-trigger placement in short mobile
  viewports. The SVG center error is zero in each measured layout.
- Recorded intermediate opening and closing frames, rapid transition reversal
  and stable collection geometry. Verified persistent popup mounting, inert
  closed controls, outside/Tab/Escape dismissal and selection/focus continuity.
- Safari's pointer-open focus behavior exposed an Escape dismissal edge; the
  while-open document listener fixes it and preserves scroll position.
- Reduced motion, keyboard navigation, catalog loading/retry/empty recovery,
  explicit study choices, URL fallback and unchanged canonical Shop pass.
- Browser harness: `tests/shop-filter-study.mjs`. Captures and results:
  `.local/shop-filter-popup-0213/`. No production writes or deployment.
- `pnpm validate` passes formatting, lint, strict TypeScript, all 217 unit tests
  and the production build. Final source and whitespace review pass. Validation
  log: `.local/shop-filter-popup-0213/validate.log`.
