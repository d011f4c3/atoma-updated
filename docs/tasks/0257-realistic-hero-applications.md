# Task 0257 — Natural, appetizing hero applications

Date: 2026-10-23
Status: Complete

## Direction

Replace the canonical homepage's food cutouts with more realistic, appetizing
imagery. The owner rejects the exaggerated ice, foam and cake texture.

The owner's follow-up rejects the first generated revision and supplies five
visual references. Match the simple, thin glass and soft green/milk mixing in
the latte reference. Replace the cake with matcha wagashi on traditional ceramic;
avoid the exaggerated crumb, grain and ice texture in both earlier versions.

Preserve the three-application composition, transparent backgrounds, palettes,
hero geometry, mobile selection, motion and commerce. Use natural food texture,
clear submerged ice, fluid matcha/milk mixing and a smooth handmade confection.
Retain saved studies and the original asset. Record generated provenance and the
exact prompt internally, without customer-facing production metadata.

The owner approved the reference-led hero composition, then requested three
matching photographs for Explore by Application. Use the same bowl, latte and
wagashi in a consistent photographic setting. Update canonical application cards
and their learning/purchase popups together, retaining older study imagery.

## Verification

Inspect the generated source and encoded asset on light/dark backgrounds, verify
alpha preservation, and review desktop plus each mobile product crop. Run the
relevant browser checks and `pnpm validate`. No production deployment.

## Outcome and evidence

- Installed the approved transparent v3 hero and three matching application
  photographs. Prompt sets and asset records are in
  [hero imagery](../design/realistic-hero-applications.md) and
  [application photographs](../design/matching-application-photographs.md).
- Canonical cards and purchase popups share the new photographs. Saved studies
  retain their original sources. Descriptive alt text is localized.
- Mobile preview crops retain the complete bowl, glass and wagashi plate. The
  popup media ratio keeps the latte visible, and its desktop image request avoids
  upscaling. Purchase controls remain pinned and reachable.
- Six existing mobile-homepage browser cases passed. Four relevant product-popup
  cases passed, including multiple formats and enlarged Japanese text.
- Independent visual QA passed both palettes, desktop and 320/390 px phones,
  all three application cards/popups, focus/scroll return and saved studies.
- `pnpm validate` and final diff checks passed. No deployment or live commerce
  writes were performed.

Local evidence: `.local/hero-images-0257/final/`, `application-qa/`,
`mobile-tests/`, `popup-tests/` and `validate.log`.
