# Task 0092 — Hero micro-adjustments

Date: 2026-10-06

## Brief and scope

The owner requests only tiny changes: slightly larger hero text and a slight
leftward shift of the floating Explore matcha target.

- Increase Specimen's heading and supporting copy by 4%, on desktop and mobile.
  This adds approximately 1px to the desktop headline and 0.36px to supporting
  text. Preserve spacing, line height, CTA sizing and all other directions.
- Shift the silver-bag target's resting position 7px left. Preserve pointer
  tracking, narrow-screen placement and mobile hiding.
- Apply the shared styles to the homepage and Specimen hero study. Keep product
  content, bag, Overview typography and interactions unchanged.

## Verification

- Desktop review confirmed a 27px → 28.08px headline and exactly 7px of
  leftward target movement. The established two-line heading remains intact.
- The 390px mobile review confirmed an 18.86px headline, no horizontal overflow,
  unchanged CTA geometry and the existing hidden floating target.
- `pnpm validate` passed (formatting, lint, types, tests and production build).
- Scoped diff review confirmed only six CSS declaration changes.
