# Task 0200 — Make mobile Sample Set details apparent

Date: 2026-10-19

## Request and change

Make the homepage Sample Set details action easier to recognize on phones.
Use a persistent 1px underline and the primary ink color at widths up to 760px,
instead of revealing these cues only on hover. Preserve its existing text size,
44px touch target, arrow, keyboard focus and disabled behavior. Desktop and saved
study styles remain unchanged; no popup or commerce behavior changes.

## Verification

- Browser checks at 320/390px in both themes confirm the resting underline,
  primary ink color and 44px touch target. At 1440px the original resting muted
  text without an underline is preserved in both themes.
- All six cases open/close the details popup and restore trigger focus, with no
  overflow or browser errors. Commerce is mocked and writes blocked. Reviewed
  screenshots in `.local/sample-details-0200/`.
- `pnpm validate` passes formatting, lint, types, 202 tests and production build.
  Final diff review and `git diff --check` pass.
