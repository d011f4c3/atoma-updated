# Task 0245 — Carry the hero lighting through the seventh concept

Date: 2026-10-21
Status: Complete

## Scope

The owner notes that the views after the hero lack its visual effect. Carry the
approved Mist and Blue hour gradient through Matcha, Samples, Origins and
Wholesale in `/new-hero7`, including their dedicated route fallbacks.

- Preserve the homepage hero's exact background, geometry and first-view bounds.
- Extend the same palette lighting across each later view's content stage, with
  a solid footer and lightly translucent product/sample surfaces.
- Keep exposed text readable against the gradient; retain clear buying controls,
  image/button rounding, focus, navigation and all commerce behavior.
- Scope styling to the seventh concept. No new imagery, content, dependencies,
  animations or live commerce changes.

## Verification

Review the four later views on desktop and phone in both palettes; compare the
hero before/after, check exposed-text contrast and confirm navigation, retained
selections, buying controls and direct route entry. Run `pnpm validate` and review
the scoped diff. Evidence stays local under `.local/new-hero-0245/`.

## Implementation and results

- All seventh-concept content stages now reuse the approved theme gradient.
  Later stages fill their content height; the home retains its existing 100svh
  treatment. The footer remains on the solid theme surface.
- Product, sample and repeat-order surfaces use 90% raised-color fills. Exposed
  supporting text is stronger, and the later dark views use a 24% surface tint
  over the gradient to retain readable contrast. Controls remain clearly filled.
- Reviewed desktop and phone captures in both palettes across all five views.
  The phone hero capture is byte-identical to the prior version; desktop hero
  dimensions match, with only 12 differing pixels across its full capture.
- Conservative contrast calculations, including maximum radial opacity, give
  exposed supporting text at least 6.25:1 in Mist and 4.57:1 in Blue hour.
  Supporting text on translucent gallery surfaces remains at least 5.52:1.
- Focused browser checks passed in-place switching, retained quantity, all four
  dedicated route entries and absence of overflow/client errors. No commerce
  writes were made. Browser contexts were closed after review.
- `pnpm validate` passed formatting, lint, type checking, unit tests and the
  production build. The scoped diff and `git diff --check` were reviewed.
