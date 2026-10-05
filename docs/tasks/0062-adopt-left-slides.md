# Task 0062 — Adopt left Slides and correct powder sizing

Date: 2026-10-01
Status: Complete

## Approved scope

The owner selected the left-placement study for the main homepage. Opt both
homepage routes into left-side Slides with right-side Tabs, preserving Split
Origins and the regular Shop experience. Keep the separate placement comparison.
Carry forward the requested 10% smaller paper label from the study follow-up.

Correct the reported stretched/cropped powder on mobile, including after
placement and view switches or refresh. Size the rendering buffer and camera
from untransformed layout dimensions; CSS rotations must not alter their aspect
ratio. Preserve the same renderer, product, quantity and reference state, and
retain the zero-size guard when the material stage is hidden.

No new dependencies, product data, cart writes or deployment.

## Validation

Verify the original homepage in both themes with left selection, smaller label,
and working product/view switching. At 713px, compare horizontal and vertical
canvas pixel ratios on fresh load, Left/Right switches in the study, hidden
Specifications return, and desktop/mobile resizing. Check a narrow phone as well.
Update relevant existing browser regression cases, run `pnpm validate`, and
review the scoped diff.

## Result and verification

Both homepage routes now use left-side Slides with right-side Tabs. The study
remains available for comparison. The left paper label is 10% narrower in both
normal and reference views, with existing compact-height containment retained.

The powder scene had sized its camera and backing canvas using the rotated
screen-space bounding box. It now uses layout `clientWidth`/`clientHeight`, keeping
the drawing buffer proportionate to the element before CSS transforms. Renderer
state, observer lifecycle and hidden-stage zero-size handling remain intact.

CUA review confirmed equal canvas pixel density on both axes at 713px on fresh
load, after repeated Left/Right changes, Specifications/Overview switches, and
1366px-to-713px resizing. Reviewed original light and dark homepages, the smaller
paper label at 1366×900, and narrow mobile at 320×740 without horizontal overflow.
Product selection remained intact; no cart actions were performed.

Added a focused browser regression for the actual sizing invariant, canvas
identity and selection/quantity continuity; updated existing homepage-placement
expectations without changing study defaults. Browser scenarios were verified
through CUA; the separate browser scripts were not executed.

`pnpm validate` passed formatting, ESLint, TypeScript, all 60 unit tests and the
production build. Scoped diff review and `git diff --check` passed.
