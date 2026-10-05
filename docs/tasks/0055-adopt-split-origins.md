# Task 0055 — Adopt Split view for Origins

Date: 2026-10-01
Status: Complete

## Requested change

The owner selected Split view from the Origins study and requested the CTA
“Learn more about the growers.” Apply that layout to the interactive homepage
Origins panel in both themes. Preserve the separate study and its comparison
options, the accepted Index/Brackets selectors and the product/order state.

The CTA retains the selected growing place's Origins reader, including its
existing People & work section and sourced grower information. Preserve the
return to the selected matcha. Unknown origins retain the honest Browse origins
fallback; do not infer any product-to-person relationship.

## Verification

- Existing Origins browser suite updated; all three cases pass. Both homepage
  themes use Split, the CTA opens the place reader with People & work and the
  sourced grower record, and returning retains the selected matcha and quantity.
- Reviewed 1366px desktop and 320px mobile in both themes. The longer CTA wraps
  cleanly on mobile without horizontal overflow. Captures are saved under
  `.local/qa/origins-split-adoption/`.
- Study layouts/default and unknown-origin fallback remain intact. All commerce
  checks use isolated fixtures; no commerce writes occurred.
- `pnpm validate` passes: formatting, lint, TypeScript, 60 unit tests and build.
  Scoped review and `git diff --check` pass.
