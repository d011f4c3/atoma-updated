# Task 0219 — Homepage purchase button study

Date: 2026-10-20

## Request and scope

Redo the purchase-button exploration around the homepage's matcha Shop section.
Compare the action alongside the actual format, quantity, purchase choice and
total, with the homepage's material scene and product selection in place.

## Direction

Use `/purchase-button-study` for Current, Soft solid, Tonal and Outline. Keep
the original hover highlight, label animation, plus-to-arrow movement, press
feedback and reduced-motion behavior in every direction. Compare contrast and
surface emphasis in the surrounding homepage layout. Preserve the earlier
Current / Mineral / Split / Keyline study at `/purchase-button-study/samples`.

Reuse the canonical homepage Shop component with an explicit study-only purchase
action slot. Catalog prices and quantity rules remain authoritative. The preview
action never calls the cart. Include local theme and button-state controls,
shareable study URLs, and preserve the mounted selection and scene when switching
treatments. Study choices must not overwrite storefront theme or journey state.

This is a visual study. Canonical purchase buttons and commerce behavior remain
unchanged. No new assets, dependencies or deployment.

## Verification

- Five focused browser cases pass: Chrome at 1440 px in both themes, WebKit at
  390 px in both themes, and reduced motion with canonical/archived study checks.
  All four surfaces retain the existing hover highlight, animated label and
  icons; all five button states remain readable and correctly disabled/busy.
- Product, quantity, material scene and purchase button stay mounted when
  changing surfaces or themes, without catalog refetches. Shareable URLs survive
  refresh, and the storefront theme cookie is unchanged. Preview activation
  produces no network writes. Canonical buttons and archived treatments pass
  their regression checks.
- Reviewed desktop compositions and mobile views with sticky study controls and
  the Shop action visible together. Explicit select height fixes Safari's native
  control sizing. Minimum measured text contrast is 7.04:1 at rest and 4.73:1
  under the strongest retained pointer highlight.
- Independent source review confirms the optional action slot falls back to the
  existing cart handler on canonical routes. Study styling is locally scoped.
- Browser harness: `tests/homepage-purchase-button-study.mjs`. Evidence:
  `.local/homepage-purchase-button-study-0219/`.
- `pnpm validate` passes formatting, lint, strict TypeScript, all 218 unit tests
  and the production build. Final diff review and whitespace checks pass.
