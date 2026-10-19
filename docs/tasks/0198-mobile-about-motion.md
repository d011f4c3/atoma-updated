# Task 0198 — Mobile About photography and connection motion

Date: 2026-10-19

## Request and scope

Restore animation to the canonical mobile About page. Keep its accepted vertical
layout, copy, photographs, Connections collage, Community reader and desktop
presentation. Respect system reduced motion and the no-JavaScript fallback.

## Change

The scroll controller previously treated every phone as reduced motion because
all motion required a roomy desktop viewport. Give phones their own motion mode:
the opening, Approach, Connections and Community photographs gently zoom out and
open to their full frame width as they enter view. The existing vertical
Connections line draws with the collage's passage through the viewport.

Use the existing event-scheduled animation frame and native page scroll. Image
transforms and clipping stay inside fixed photographic frames; text remains
visible and sections keep their geometry. No sticky mobile stage or horizontal
rail is introduced. Desktop keeps its current cover, layered Approach and rail.
Preference changes and viewport changes reset the scoped motion state, and
listeners are removed on cleanup.

## Verification

- All eight `tests/about-scroll.mjs` cases pass: 1440 px desktop, 390 px in
  both themes, 320 px, plus desktop/mobile reduced-motion and no-JavaScript
  fallbacks. Checks measure actual image scale and frame clipping on all nine
  photographs, visible line drawing, stable layout and no horizontal overflow.
- Live preference and viewport changes switch cleanly between mobile, desktop
  and static modes. Community popup history, focus, dismissal and return scroll
  checks pass. Commerce is mocked and writes blocked.
- Reviewed mobile Approach and Community captures in
  `.local/about-mobile-motion/browser/`.
- `pnpm validate` passes formatting, lint, strict types, all 202 unit tests and
  the production build. Final scoped formatting and `git diff --check` pass.
