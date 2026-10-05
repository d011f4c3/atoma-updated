# Task 0098 — Animate the left hero introduction

Date: 2026-10-06

## Brief

The owner approves the right hero animation and requests motion on the left.
Add a restrained entrance to the selected Specimen introduction: the heading,
supporting copy and Explore action appear in a short sequence. Preserve its
approved typography, spacing and copy, and the right-side material choreography.

## Implementation boundaries

Use scoped CSS opacity and small vertical translations, synchronized with the
existing loader's global animation pause. Replay naturally on return from the
in-place selection flow. No recurring text movement, new delay to interaction,
JavaScript timer, dependency or changes to the product/order state. Respect
system reduced motion and keep keyboard focus immediately visible.

## Validation

Inspect actual animation timing after loader release, Explore and return,
reduced-motion behavior, desktop and mobile composition. Run `pnpm validate`,
review the scoped diff and save a final browser screenshot.

## Verification results

- Browser samples confirmed the entrance begins at the loader's leaving phase:
  heading opacity progressed from 0 to 0.51, 0.90 and 0.99 while the action followed.
- Returning from Shop to the hero replayed the heading entrance and restored focus
  to Explore. The selected Quick order panel remained available on the homepage.
- At 390 × 844 with reduced motion, heading and action had animation-name none,
  opacity 1, and no horizontal overflow. Restored normal motion and viewport.
- Full `pnpm validate` passed: formatting, lint, types, 68 tests and production build.
  Reviewed the scoped changes and independent motion review. Addressed slow
  hydration timing and prevented keyboard blur from restarting the button motion.
