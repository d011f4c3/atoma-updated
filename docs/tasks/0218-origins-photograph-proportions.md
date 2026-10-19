# Task 0218 — Origins photograph proportions

Date: 2026-10-20

## Request and scope

Fix the oversized desktop photograph frames shown in the Origins collection.
The gallery currently contains every photograph in a fixed portrait frame,
leaving large empty bands around landscape images.

## Implementation

Record the existing image assets' intrinsic dimensions and use them to size the
Origins collection photographs. Keep the full photographs, two-column gallery,
captions, ordering and navigation. Preserve the separate reader, place hero,
homepage preview, themes and commerce state.

No new assets, content claims, dependencies or deployment.

## Verification

- Verified all seven source image dimensions against the existing local assets.
- All nine focused Origins and Origins-localization tests pass.
- Browser checks pass in Chrome at 1440 × 1000 in both themes and WebKit at
  390 × 844 in light mode. Kyoto and Wazuka gallery photographs load at their
  original proportions, frames fit the images, captions stay adjacent and no
  horizontal overflow appears. Reader focus and scroll restoration pass.
- Reviewed the full collection and the landscape row from the owner's
  screenshot. Evidence is retained in `.local/origins-proportions-0218/`.
- `pnpm validate` passes formatting, lint, strict TypeScript, all 218 unit tests
  and the production build. Final diff review and whitespace checks pass.
