# Task 0072 — Darker Blue hour gradient

Date: 2026-10-05
Status: Complete

## Requested outcome

Bring the Blue hour palette closer to the supplied dark capsule and Flow Coffee
references, and make it darker. Use a near-black upper field with a low, broad
cool light beneath the material. Reduce the blue cast across the page and darken
supporting surfaces. Adapt the same lighting to the phone's product position.

Limit this refinement to the existing Blue hour study. Retain Mist, homepage
defaults, layout, imagery, typography and all selection/cart behavior.

## Verification

Review the hero and selection on desktop and phone, including text contrast and
the lower light falloff. Run the existing isolated color-study checks and
`pnpm validate`, and review the scoped diff. No live commerce writes or deployment.

## Result

Blue hour now keeps the upper field near black and spreads a restrained,
desaturated blue light across the lower edge. The selection view concentrates
that light beneath the material; phone lighting follows its higher product
position. Panels and the palette swatch use the same darker tones. The caption
and footer use brighter ink for contrast over the illuminated floor.

Reviewed hero and selection at 1440×900, 1366×768, 390×844 and 320×700; reviewed
Shop at 1366×768 and 320×700. All three existing isolated browser cases pass.
`pnpm validate` passes formatting, lint, types, 60 unit tests and the production
build. Reviewed the scoped CSS diff and `git diff --check`. Captures are in
`.local/qa/blue-hour-dark/`. No live commerce writes or deployment.
