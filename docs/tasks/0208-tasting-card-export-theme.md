# Task 0208 — Theme-aware tasting card downloads

Date: 2026-10-19

## Request and scope

Fix the downloaded tasting card ignoring dark mode. Preserve saved notes,
recipes, export layout, translations and the existing purchase flow.

## Change

The canvas renderer previously hardcoded the light palette. Download now captures
the active preview's shared surface, ink, secondary text and line colors when
clicked and passes that palette to the renderer. Both light and dark images
follow the storefront theme, including after switching it in place. The palette
stays consistent during font loading without adding a second theme definition.

## Verification

- The new in-place palette regression and existing validation/export case both
  pass in Chrome and WebKit. Actual decoded PNGs use the preview's `#121923`
  dark or `#f8faf6` light background with contrasting ink and secondary text.
- Dark → light → dark downloads retain all 600 note characters, the final line,
  recipe facts, dimensions and text layout. Theme changes preserve the mounted
  editor, saved records and unsaved draft. Downloaded images were visually
  reviewed; evidence is in `.local/tasting-card-theme-0208/`.
- `pnpm validate` passes formatting, lint, strict TypeScript, all 213 unit tests
  and the production build. Final source and whitespace review pass. No
  deployment was performed.
