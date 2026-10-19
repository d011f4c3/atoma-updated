# Task 0214 — Neutralize the Mineral purchase button

Date: 2026-10-20

## Request and scope

The adopted Mineral button feels too blue in dark mode and too green in light
mode. Reduce its color saturation while retaining the stronger material depth
and the existing hover styling, animations and iconography.

## Implementation

Move the light gradient toward soft stone grey and the dark gradient toward
graphite. Desaturate their matching edges while keeping a subtle relationship
to each storefront palette. Preserve theme ink and all gradient positions,
lighting, hover/focus behavior, animations, sizing and commerce states.

Only the eight existing canonical Mineral color values change. The original
button study remains available for comparison. No dependencies, commerce
changes, production writes or deployment.

## Verification

- Six existing browser cases pass: Chromium at 390px and 1440px in both themes,
  plus WebKit at 390px in both themes. Reviewed purchase sections, resting
  buttons and desktop hover against the previous palette.
- Minimum gradient text contrast is 6.73:1 light and 6.83:1 dark. With the
  strongest existing pointer tint, minima remain 5.25:1 and 4.65:1 respectively.
  Labels fit and existing hover/icon behavior remains intact.
- Existing harness: `tests/mineral-purchase-button.mjs`. Captures and results:
  `.local/mineral-neutral-0214/`. No tests or interaction code changed.
- `pnpm validate` passes formatting, lint, strict TypeScript, all 217 unit tests
  and the production build. Final source and whitespace review pass. Validation
  log: `.local/mineral-neutral-0214/validate.log`.
