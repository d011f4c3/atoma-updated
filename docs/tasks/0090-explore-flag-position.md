# Task 0090 — Move the Explore flag clear of the bag

Date: 2026-10-05
Status: Complete

## Requested outcome

Move the floating Explore matcha annotation farther right so its label no longer
covers the silver bag. Keep the bag, printed record, left-side introduction and
all selection behavior unchanged.

## Implementation

Adjust only the silver-bag cue's CSS resting position. Reserve space for the
whole annotation inside the stage's right edge. On narrower desktop stages,
place the label at the upper right, with its mark underneath, where horizontal
clearance alone is insufficient. Preserve pointer tracking, edge clamping,
return to rest, reduced-motion behavior and existing mobile hiding. Tray-only
concepts keep their previous cue placement.

## Verification

Review both themes and desktop/narrow desktop/mobile sizes. Check label clearance,
stage containment, pointer movement and exit, reduced motion, Explore entry and
return. Run `pnpm validate` and inspect the scoped diff.

## Results

- Moved the silver-bag annotation to the right edge, with an upper-right resting
  arrangement between 761px and 1280px. The bag and its label are unchanged.
- Checked nine viewport sizes in both themes, from 390×844 to 1440×1200.
  Pixel checks confirmed that the resting label does not overlap the visible
  foil and remains inside the stage; mobile retains its hidden annotation.
- Pointer tracking, exit reset, reduced motion, keyboard Explore and return
  all passed. The returned hero restores the visible resting flag.
- Formatting, the production build and scoped diff checks passed.
  `pnpm validate` stopped at an unrelated React Compiler lint error in
  `src/components/smooth-scroll.tsx:82` (`preserve-manual-memoization`). That
  component was not changed by this task.
- Local review captures and verification logs are in `.local/explore-flag-0090/`.
