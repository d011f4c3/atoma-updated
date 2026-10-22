# Task 0267 — Homepage hero spacing and scale

Date: 2026-10-23
Status: Complete

## Owner direction

Refine the canonical homepage hero. On mobile, large gaps separate the text,
three applications and Sample Set action, while the introduction sits too high.
On desktop, the application imagery and h1 feel too large. Preserve the current
visual direction and buying journey; this is a spacing and scale pass.

## Scope

- Keep the full-height mobile hero, approved staggered three-application
  composition, exact image crops, product labels/codes and Sample Set action.
  Use content-sized rows and consistent internal gaps, centering the complete
  group vertically instead of expanding only the image row. Allow readable
  natural growth on short screens and with enlarged/localized text.
- Reduce canonical desktop h1 and material imagery without changing the shared
  saved-study styling. Bound both image width and height so short desktop views
  also receive the smaller scale, keeping whole objects aligned above the rail.
- Preserve typography weight, palettes, original assets, motion/loader timing,
  reduced motion, focus/history/scroll return and all cart/selection controls.
- A held-image motion check exposed an existing pre-hydration timing gap:
  CSS entrances could finish before client initialization applied the loader
  pause. While the hydrated loader blocks interaction, reset the canonical
  entrance instead of pausing at an arbitrary elapsed position. Releasing it
  starts the existing animation afresh; no-JavaScript and blocked-script
  fallbacks retain visible HTML. Keep loader phases and durations unchanged.
- No copy, product fact, catalog, route, dependency or commerce changes.

## Verification

Capture matched 1440×900, 1280×720, 390×844, 430×932 and 320×568 views in both
palettes. Check mobile internal gaps, desktop scale, whole-image containment,
readable Japanese/enlarged text, short landscape and reachable controls. Use
isolated commerce fixtures for product/sample navigation, retained order state,
focus/history/scroll return and loader/reduced-motion checks. Run `pnpm validate`
and review the final diff. Evidence: `.local/hero-0267/`.

Previous Wholesale work and the user's pre-existing study-route deletions remain
in the working tree. They are independent of this refinement.

## Result

Mobile keeps all three complete application objects in the same staggered
composition. The introduction, applications and Sample Set button now form one
centered group: internal gaps are 20 px instead of approximately 108 px at
390×844 and 135 px at 430×932. The heading has deliberate space below navigation,
and the Sample Set action sits closer to the product labels. Short screens and
enlarged text grow naturally instead of shrinking reading type or clipping.

The desktop title is about 17% smaller: 50.4 → 41.76 px at 1440 px and
44.8 → 37.12 px at 1280 px. Application imagery is approximately 14–16% smaller
at the reviewed desktop sizes. Whole objects retain their proportions and remain
aligned above the application rail. These changes are scoped to the canonical
homepage; shared study styling is unchanged.

Matched before/after screenshots and geometry are under
`.local/hero-0267/baseline/` and `.local/hero-0267/final/`.

- `pnpm validate` passed: formatting, lint, TypeScript, all 256 unit tests and
  production build.
- Seven canonical mobile browser cases passed, including every application
  entrance, exact selection/focus/history/scroll return, responsive Sample Set
  learning, Japanese with 200% text, image failure and readiness.
- Six focused motion cases passed: desktop/mobile loader and reduced-motion
  behavior, no-JavaScript native Sample Set navigation and blocked-script
  fail-open. The cold-hydration regression now reveals the hero after the loader
  clears. Existing fallback assertions remain intact; the no-JavaScript test
  now waits for native document load before selecting the visible responsive
  hero, preventing a race with stylesheet loading.
- Ten matched viewport captures in both palettes show no horizontal overflow or
  clipped application objects. Normal 390/430 px phones keep all three choices
  and the Sample Set action in the first viewport. At 320×568, the readable
  content requires a short scroll, with the button 20 px closer than before.
- Commerce traffic was intercepted by fixtures; no live writes or deployment ran.

Validation report: `.local/hero-0267/validate.log`. Browser evidence:
`.local/hero-0267/browser-results.json`, `mobile-tests/`, `motion-final/` and
`fallback-tests/`. Final source diff reviewed.
