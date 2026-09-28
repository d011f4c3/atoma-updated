# Task 0004 — Original blue-to-bone gradient

Date: 2026-09-28
Status: Complete — local light-background trial ready for owner review

## Scope

The owner requests a light background using the blue-to-bone gradient from the
first JMM storefront. Apply the original colors to the existing hero and adjust
foreground contrast. Preserve its typography, layout, animation, and product
entry. No additional sections, commerce integration, or deployment.

## Recovered source

JMM commit `ba6cb8c7cd5bf3c74d01c5b389cd74f5656986ec`, dated 2026-09-10:

- `apps/storefront/src/components/home/origin-story.module.css`, `.process`:
  `linear-gradient(180deg, #aab4ba 0%, #c8ced0 38%, #e2e3df 72%, var(--color-paper) 100%)`.
- `apps/storefront/src/app/globals.css`: paper `#f1efe8`, ink `#181916`.
- Existing Task 0036 calls this the cool mineral gradient.

Use these exact stops and companion ink. Keep secondary text readable on every
stop, with dark focus and active-state accents. The vessel needs a transparent
image because its previous black backdrop is baked into the bitmap. Preserve
the originals; record the new image and prompt in the asset register.

## Validation

Check gradient provenance, text contrast, image alpha and dimensions, split
alignment, local page/asset responses, and the final source diff. Run
`pnpm validate`. No dependencies, credentials, production operations, or sibling
repository changes are needed.

## Result

Applied the exact recovered gradient and original charcoal ink to the hero.
Secondary labels, focus outlines, active states, aperture ring, guide nodes,
and hover treatments now use colors suited to the light surface. The layout,
copy, navigation, and motion behavior were not expanded.

The active vessel is `public/images/hero/matcha-vessel-light-v3.webp`, a
1536 × 1024 transparent edit (96,078 bytes). The black backdrop and floor
reflection are removed. The split row at y348 retains a maximum alpha of
1/255, preserving the visible separation between the lid and vessel. The edit
and exact prompt are documented in the asset register.

Verification:

- `pnpm validate` passed: format, zero-warning lint, strict types, and build.
- Minimum calculated text contrast across gradient stops: ink 8.36:1, muted
  labels 5.01:1, and interactive accent 4.54:1. An initially lighter secondary
  color was darkened before the successful check.
- Local page and new WebP returned HTTP 200. New WebP has four channels and
  transparent corner alpha. Source image and generated cutout were inspected.
- Reviewed the full change against a snapshot of the prior hero; only palette,
  the obsolete dark mask, and vessel image references changed in product code.
- Browser accessibility state was inspected, but screenshot, responsive resize,
  and end-to-end interaction QA were not performed.
- No deployment, dependency addition, Shopify calls, or changes to either
  reference repository.
