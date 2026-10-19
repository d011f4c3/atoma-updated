# Task 0217 — Restore the original purchase buttons

Date: 2026-10-20

## Request and scope

Revert the purchase buttons to their appearance before the Mineral adoption,
particularly in the homepage matcha Shop view. Restore the original Current
treatment across homepage purchase paths, Samples and retail product pages.

## Implementation

Remove the canonical Mineral opt-in markers and overrides. Restore the original
theme-inverted fill and text, border, resting shadow, focus ring and pending
surface. Keep the existing hover highlight, label animation, icon transitions,
press feedback, reduced motion and commerce state behavior.

Return the saved Mineral palette to the button study's local styles. Keep all
four study treatments available. Preserve recent page animations, Shop filters,
layouts, selection and cart state.

No dependencies, commerce-contract changes, production writes or deployment.

## Verification

- Eight focused browser cases passed across Chrome desktop and WebKit mobile:
  the homepage's regular matcha Shop view in both themes, retail product pages,
  representative Samples pages, purchase states, reduced motion and saved-study
  isolation. Canonical button surfaces match Current in the saved study.
- Reviewed homepage Shop captures in both themes on desktop and mobile.
- Independent source review confirms the canonical CSS is restored and the saved
  study, page reveals and Shop filters are preserved.
- `pnpm validate` passed: formatting, lint, strict TypeScript, all 218 unit tests
  and the production build. Final diff review and whitespace checks passed.
