# Task 0036 — Persistent Explore matcha marker

Date: 2026-09-30
Status: Complete

The owner asks the tray's Explore matcha annotation to remain visible when the
pointer is outside its container, follow the pointer inside it, and have subtly
rounded corners of approximately one pixel.

Keep the existing contained pointer tracking and default resting position. Show
the full mark, leader and label at rest; return there on pointer exit. Apply a
one-pixel radius to the mark and label only. Preserve the mobile composition,
reduced-motion preference, keyboard entry and hiding during product selection.
No commerce, navigation, dependencies or asset changes.

Review idle/enter/move/leave in both themes, edge containment, reduced motion,
selection entry/return and mobile preservation. Run `pnpm validate` and review
the scoped diff.

## Verification

CUA at 1440×900 confirmed visible resting cues in both themes, cursor-following
coordinates inside the stage, complete edge containment with approximately 12px
insets, and return to the default position after exit. Both outlined elements
compute to a 1px radius. Reduced motion keeps the cue stationary and visible.
Selection hides it and returning to the overview restores it. At 390×844 the
existing mobile composition remains unchanged without horizontal overflow.

`pnpm validate` passed: formatting, ESLint, TypeScript, 26 unit tests and the
production build. Reviewed the CSS and existing tracking/reset effect;
`git diff --check` passed. No JavaScript or commerce changes were needed.
