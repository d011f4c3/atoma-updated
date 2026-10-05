# Task 0089 — Adopt Specimen introduction

## Approved brief

The owner selected Specimen from `/hero-study` for the main homepage.

## Scope

- Apply the existing Specimen introduction to `/` in both storefront themes.
- Preserve the right-side bag, its label and lighting, the approved footer,
  loading sequence and Explore / selection / Shop interactions.
- Retain the study and its alternatives, including the restored Register.
- No new assets, dependencies, commerce writes or deployment.

## Validation

Review desktop and mobile homepages, Explore and return focus. Run
`pnpm validate`, review the focused diff and open the main homepage.

## Results

- Adopted Specimen with an explicit homepage prop; kept the shared component's
  default and the separate studies unchanged. Existing footer work is preserved.
- Reviewed the 1440 × 1000 desktop and 390 × 844 mobile homepage, both theme
  treatments, Explore and return. The selected introduction renders correctly
  alongside the same bag and label.
- `pnpm validate` passed: formatting, lint, types, 63 tests and production build.
  Reviewed the one-line homepage adoption and `git diff --check` passed.
- Saved `docs/design/specimen-home-desktop-0089.png` and
  `docs/design/specimen-home-mobile-0089.png`. Main homepage is open for review.
