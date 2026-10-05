# Task 0093 — A further small hero refinement

Date: 2026-10-06

## Brief and scope

The owner supplied a homepage screenshot and requested another slight increase
in hero text size and a slight leftward shift of the floating Explore matcha
target, following Task 0092.

- Increase Specimen's desktop headline cap from 28.08px to 30px. On mobile the
  heading is about 20px at 390px wide.
- The owner's follow-up requests another 1–2px on the subtext. Increase both
  supporting lines to 11px (another 1px beyond the initial 10px pass).
- Let the mobile text frame grow with wrapped copy, retaining its existing
  minimum height so larger subtext stays inside the registration corners.
- Move the silver-bag target's resting position another 16px left.
- Preserve all other typography, spacing, package presentation, pointer
  tracking, mobile target hiding and interaction behavior.

## Verification

- Reviewed light-theme desktop at 1500×744 and 1281×1000: two-line heading,
  larger supporting copy and clear space between the bag and floating target.
- Checked 320×568: 11px subtext stays inside its expanded frame with no
  horizontal overflow, and the target remains hidden on mobile.
- `pnpm validate` passed, including formatting, lint, types, tests and build.
- Reviewed the scoped CSS diff against the pre-task files.
