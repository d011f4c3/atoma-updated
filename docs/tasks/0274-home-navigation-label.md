# Task 0274 — Home navigation label

Date: 2026-10-23
Status: Complete

## Owner direction

Rename the Matcha navigation link to Home because it leads to the homepage.

## Scope

- Update the shared desktop/mobile homepage link's visible and accessible text.
- Add the matching Japanese, Simplified Chinese and Traditional Chinese labels.
- Preserve destinations, navigation guards, existing matcha-selection buttons,
  product copy and earlier refinements.

## Verification

Check the label and homepage destination on desktop and mobile with isolated
browser fixtures, including localized text. Run `pnpm validate` and review the
final diff. Evidence: `.local/navigation-0274/`.

## Result

The shared homepage link now reads Home in desktop and mobile navigation, with
matching accessible and localized labels. Its destination remains `/`; actual
matcha-selection buttons retain their existing wording and behavior.

Three isolated browser checks passed: desktop English, mobile English and mobile
Japanese. Each followed the renamed link back to the homepage without browser
errors or commerce writes. Screenshot review passed. `pnpm validate` passed
formatting, lint, types, all 256 unit tests and the production build; final diff
review passed.
