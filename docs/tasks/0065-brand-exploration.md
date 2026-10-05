# Task 0065 — Refined brand exploration

> Superseded by Task 0066 after the owner rejected the palette-led approach.
> Results below record the first pass, not the current exploration.

## Brief

Explore a quieter, more refined industrial treatment of the current ATOMA v3
regular homepage at `/`. The owner explicitly excludes the older storefront
and other concept routes as the baseline.

## Scope

- Add a local `/brand-exploration` comparison with Current, Soft graphite,
  Chalk and Brushed silver directions.
- Render the same `SpecimenHero` as `/`, including left Slides, right Tabs,
  Split Origins, tray entry, actual product content and established interactions.
- Keep one mounted experience when switching direction or appearance, preserving
  product, information view and purchase state.
- Refine neutral palettes, linework, lighting, spacing and surface treatments.
  Retain IBM Plex Mono, the original images, wording and industrial composition.
- Keep text steady in the refinements while retaining the existing material
  transitions. Current retains the original character-resolution effects.
- Keep all CSS changes scoped to the comparison. No new service, dependency,
  commerce rule, catalog data, production permission or deployment.

## Validation

- Review desktop and mobile hero, selection and information views.
- Compare all directions and both appearances; verify selection continuity.
- Confirm the regular `/` homepage retains its existing presentation.
- Run `pnpm validate` and review only the task's changes against the initial
  working tree, which contains earlier uncommitted work.

## Results

- Added and opened `/brand-exploration`, defaulting to Soft graphite. Direction
  controls compare all four treatments; the homepage appearance controls also
  work in place. Current links directly to the regular `/` homepage.
- Desktop review at the browser's 1280 × 720 viewport covered the hero, all
  product choices, Overview, Specifications, Origins and Shop. Verified
  specification explanation dismissal with Escape and restored trigger focus.
- Verified that Barista selection and quantity 2 survive direction and tone
  changes, and Premium plus Origins remain selected when choosing Current.
- Mobile review at 390 × 844 and 320 × 700 covered selection/purchase layout
  and hero/overview respectively. The 320px page has no horizontal overflow;
  the direction picker has an explicit accessible label at every width.
- Formatting passes for all six changed/added task files. Lint, typecheck,
  all 60 existing tests and the production build pass. The final CSS and
  accessible-label changes also pass a fresh formatting check and build.
- `pnpm validate` was run but stopped on a pre-existing formatting issue in
  `src/components/shop-preview.tsx`. That unrelated file was not changed.
  Remaining gates were run separately as listed above.
- Reviewed scoped CSS additions against pre-edit copies and the new route,
  component and stylesheet. `git diff --check` passes. Existing source content,
  checkout behavior and the regular homepage were not replaced. No deployment.
