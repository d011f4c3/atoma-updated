# Task 0273 — Compact wholesale imagery toggle

Date: 2026-10-23
Status: Complete

## Owner direction

Add a small toggle on `/wholesale` to switch between application and powder
imagery. Keep the control visually compact.

## Scope

- Add a restrained two-option control to the collection toolbar, defaulting to
  Application. Its small visible surface retains 44 px keyboard/touch controls.
- Use existing approved application cutouts and exact product powder images.
  Unknown future products retain only their published image in either mode.
- Store the image choice in the URL alongside search, preserving it through
  product navigation and dialog return without adding history steps.
- Keep the same mounted buyers, selections, quantities and product destinations.
  Retain pending navigation guards, both themes, localization and image fallbacks.
- Preserve the preceding Samples and hero changes. No new assets or commerce
  changes, deployment or real orders.

## Verification

Use the existing isolated wholesale fixture for image switching, search/order
retention, direct links, dialog return and pending guards. Review both themes at
desktop and phone sizes, plus narrow enlarged text. Run `pnpm validate` and
final diff review. Evidence: `.local/wholesale-0273/`.

## Result

The collection toolbar now has a small Application / Powder segmented control.
Its visible outline is 32 px tall at normal text size, with 44 px touch targets.
Application remains the default; Powder uses each matcha's approved photograph.
The selection survives search, quick-view dismissal and product-page Back via
the existing URL-owned library state. Buyer components stay mounted.

Six focused browser cases passed: desktop/mobile in both themes, 320 px Japanese
at 200% text, and the existing pending-order guard. Checks cover actual image
sources, search and quantity retention, exact product links, dialog return and
history. Review also contained an existing enlarged-text Sample Set banner
overflow using a shrinkable mobile grid track and bounded image/insets, without
changing its normal-size appearance.

`pnpm validate` passed formatting, lint, types, all 256 unit tests and production
build. Final source/visual review passed; browser fixtures intercepted commerce
writes. Evidence includes `browser-results.json`, `tests/`, `pending/`,
`narrow-final/` and `validate.log`.
