# Task 0094 — Refine tab accents and Material & use typography

Date: 2026-10-06
Status: Complete

## Requested outcome

The owner requests a smaller Wazuka heading, a slightly larger Format & quantity
heading in Shop, and smaller, more varied and readable type in Material & use.

## Scope

- Reduce the embedded Origins place heading from 24–30px to 18px at all sizes.
- Increase the adopted Shop heading from 14px to 16px without changing the
  other shared tab sizes or purchase controls.
- Give the Material & use popup an 18px title, 14px preparation disclosure,
  12px reading text and property values, 12px medium-weight subsection headings,
  11px supporting note and 10px labels. Limit paragraphs to 56 characters,
  strengthen reading-text contrast and refine spacing between sections.
- Scope material-profile changes through popup-owned CSS properties so its
  independent inline presentation keeps its existing styling. Preserve all
  content, palettes, selection, commerce, keyboard and reduced-motion behavior.
- Narrow existing builder-heading and material-note selectors to direct children
  so they cannot override headings and paragraphs inside the popup.

No new assets, dependencies, product claims, commerce writes or deployment.

## Verification

Review both themes at desktop and narrow mobile widths. Check computed type,
wrapping, property selection, expanded preparation, dialog dismissal and focus
return. Keep selected product, quantity and the mounted material intact. Review
the existing popup at narrow widths with a browser-only entry override where
the canonical Shop entry is already hidden. Run `pnpm validate` and review the
scoped diff.

## Results

- Browser checks confirmed 18px Wazuka, 16px Format & quantity and the intended
  popup hierarchy at 1440px and 320px in both themes, plus 390px in light mode.
  Screenshots showed readable wrapping and no horizontal overflow.
- All seven material-property selections, expanded preparation, scrolling to
  the final note, sticky close controls, keyboard dismissal and focus return
  passed. Selected matcha, quantity and the mounted material remain intact.
- Narrow popup checks temporarily exposed the existing entry in the browser;
  the canonical mobile entry visibility was not changed in source.
- `pnpm validate` passed formatting, lint, TypeScript, all 68 tests and the
  production build. Stale generated route types from unrelated concurrent
  study removal were cleared from the build/dev caches before the passing run.
- Scoped CSS review and `git diff --check` passed. Browser captures, computed
  styles and validation output are under `.local/type-refinements-0094/`.
