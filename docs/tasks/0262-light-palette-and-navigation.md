# Task 0262 — Light palette and navigation

Date: 2026-10-23
Status: Complete

## Direction

The owner finds light-mode navigation too faint and requests the same visual
depth and satisfaction as the approved dark mode across all pages. Strengthen
the light navigation, develop richer gradients and more deliberate color and
surface contrast across the canonical storefront. Keep Blue hour unchanged.

Refine Mist with pearl highlights, sage and cool mineral shading, deeper ink,
clearer rules and elevated menus/dialogs. Cover Home and its selection views,
Wholesale, Samples, product pages, Origins, About, field notes and shared
navigation/footer/cart. Preserve layout, photography, product facts, motion,
localization, saved studies and all commerce/navigation state. No new assets,
dependencies, deployment or external writes.

## Verification

Capture matched before/after light and dark pages with isolated browser fixtures.
Review desktop/mobile pages, menus, dialogs and scroll sections; check readable
contrast, keyboard/touch controls, enlarged/localized text and retained order
state. Compare dark captures and saved-study tokens for preservation. Run relevant
browser checks, `pnpm validate` and final diff review.

## Result

- Gated the refined light palette to canonical storefront pages. Pearl
  highlights now transition through sage and cool blue-gray shading, with
  darker ink, stronger rules and distinct menu, dialog and footer surfaces.
  Shared navigation uses the regular mono weight in canonical light mode.
- Carried the palette through Home and its selection views, Wholesale, Samples,
  product pages, Origins, About, field notes, cart and footer. Field notes and
  mobile About use the viewport for light backgrounds so the gradient remains
  visible in long articles. Corrected the cart shipping label's inherited muted
  color.
- Reviewed 24 matched desktop/mobile captures plus lower homepage sections,
  field notes, footer and cart. Final dark comparisons were byte-identical in
  11 of 12 cases; the remaining difference was confined to the unchanged
  Origins thumbnail's rasterized image pixels. Dark styling is unchanged.
- Eleven additional checks covered 320 px Japanese navigation, 200% text,
  keyboard controls, theme persistence and route/destination continuity.
  Product quantities also survive theme changes. No overflow, browser errors or
  commerce writes occurred in isolated fixtures.
- The deepest sampled gradient background gives muted text 4.69:1 contrast.
  `/new-hero7` retains its original light tokens and navigation weight. Historical
  theme definitions and independent-study fallbacks remain intact.
- `pnpm validate` passed formatting, lint, types, all 248 unit tests and production
  build. Final diff review and `git diff --check` passed. No deployment.

Local captures, fixture scripts, contrast measurements and validation logs are in
`.local/light-theme-0262/`.
