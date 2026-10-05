# Task 0091 — One type scale across the homepage tabs

Date: 2026-10-06
Status: Complete

## Requested outcome

The initial request concerned Overview. The owner clarified that the goal is
the same type scaling across all tabs, then selected the former Origins typography as the
reference. Main copy should not get progressively smaller between
sections or when switching views.

## Scope

Define one shared embedded-tab scale, taken from the former Origins tab:

- 14px product/section headings and prominent numeric values.
- 11px main copy, property values and actions.
- 10px supporting labels and helper text.

Apply it to Overview, Specifications, Origins and the adopted refined Shop in
both themes and at desktop/mobile sizes. Overview purpose, summary and inline
details share the body size. Origins product headings and Shop headings
use the same heading size, weight, line height and tracking. Restore the original
Origins place-name display treatment (24–30px) as its separate editorial level.
Keep main copy at 11px across viewport sizes instead of reintroducing the former
narrow Origins paragraph override. Keep control dimensions, content, selection, product
scene, photographs, commerce behavior and retail disclosure unchanged. Preserve
fallback styling when components render outside the shared embedded experience.

Use CSS custom properties in the existing configurator and consume them in the
information components. No assets, dependencies, product facts, commerce writes
or deployment.

## Verification

Compare computed heading/body/label sizes across all four tabs at desktop and
320px mobile in both themes. Review screenshots, wrapping, selected-product and
quantity continuity, working actions and the unchanged retail disclosure.
Run `pnpm validate` and review the scoped diff.

## Results

- All four tabs use shared 14px headings, 11px main text/actions and 10px
  supporting labels. Heading weight (400), line height (19.6px) and tracking
  (−0.35px) also match. Origins retains its original 24–30px place-name display.
- Browser checks passed at 1440px and 320px in both themes. Screenshots and
  computed styles confirm the scale, with no horizontal overflow or runtime
  errors. Product selection, quantity and the mounted renderer remain intact;
  the retail disclosure keeps its existing typography.
- `pnpm validate` passed formatting, lint, TypeScript, all 68 tests and the
  production build. Reviewed the scoped CSS diff against the task-start copies.
- Local browser evidence is saved under `.local/overview-type-0091/` using the
  `origin-scale-` prefix.
