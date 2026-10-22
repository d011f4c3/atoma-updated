# Task 0261 — Theme switcher in navigation

Date: 2026-10-23
Status: Complete

## Direction

Place the persistent storefront theme switcher next to the location/currency
control in the navigation bar. Reuse the existing theme state and interaction.
Keep the mobile language and theme controls together in the same preferences
group, without repeating the theme control in the menu. Retain footer controls,
commerce/destination behavior, localization, keyboard access and independent
study palettes. No new dependencies or deployment.

## Verification

Review desktop, the 761 px breakpoint, 320/390 px menus, Japanese and enlarged
text. Check adjacency, keyboard/touch activation, cookie persistence and reload,
retained URL/product quantities, and unchanged destination controls with isolated
fixtures. Run `pnpm validate` and review the final diff.

## Result

- Moved the existing theme switcher beside location/currency in the shared
  navigation. Desktop shows the theme toggle directly after the currency;
  mobile keeps language and theme together in the wrapping preferences row.
  Removed the redundant mobile Appearance row. Footer controls are unchanged.
- Owner spacing refinement: added 8 px between language and theme on mobile,
  shifting the toggle slightly right while retaining wrapping and touch access.
- Eight viewport/theme/locale checks passed, including the 761 px desktop
  breakpoint, 320/390 px menus and 200% Japanese. Verified direct adjacency,
  keyboard order, theme cookie/reload persistence and unchanged country/URL.
- Keyboard activation retains selected product quantity and menu dismissal.
  Twelve independent route checks passed across Wholesale, Samples, Origins and
  About, with no overflow, browser errors or commerce writes.
- `pnpm validate` passed formatting, lint, types, 248 unit tests and production
  build. Final diff review and `git diff --check` passed. No deployment.

Local fixture scripts, screenshots and results are in `.local/nav-theme-0261/`.
