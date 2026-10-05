# Task 0087 — Adopt Directory footer

Date: 2026-10-05
Status: Complete — Directory adopted

## Requested outcome

The owner selected Directory from `/footer-study`. Adopt the existing footer on
the canonical homepage, Shop collection, retail product pages and Origins.
Append it after the existing page content so it appears on scroll, preserving
the full-height homepage, existing composition, material scene, controls and
selection. Keep all saved studies and concepts independent.

Reuse Directory's type, navigation rows, spacing and Mist / Blue hour palettes.
Follow the persistent site appearance, preserve cart pending locks, open Growing
places in the existing reader and restore focus on return. Back to top scrolls
to the beginning and focuses the current header without resetting selection.

Privacy policy, Terms and Contact remain future work. The owner's follow-up
requests including these labels as plain placeholder text in the adopted footer,
without a “Planned links” heading. Retain the information column and do not make
these labels interactive until real destinations are supplied. Apply the same
unlabeled text treatment to the saved comparison. Do not publish invented legal
or contact content, add dependencies, perform live commerce writes or deploy.

## Verification

Review desktop and 320px mobile in both themes, with mocked catalog/cart data.
Check footer placement below the initial viewport, preserved homepage geometry,
selection/renderer continuity, theme changes, Origins return, Back to top focus,
purchase guards, all canonical routes and saved study isolation. Run scoped
checks, `pnpm validate`, and review the final bounded diff.

## Results

- Appended the shared Directory footer to the four canonical route types, with
  all existing page components and sizing preserved. Privacy policy, Terms and
  Contact are ordinary text with no “Planned links” heading or fake destination.
- Back to top preserves the current selection and restores header focus. Footer
  colors follow the persistent theme. The footer stays out of the keyboard order
  while the homepage loader blocks interaction, and remains available without
  JavaScript.
- New mocked browser suite passed 6/6 cases, covering both themes at 1440px and
  320px, canonical routes, focus/scroll behavior, pending purchase locks,
  selection/renderer continuity, loader fallback and study isolation. The saved
  comparison suite passed 2/2 cases across all 20 combinations.
- Reviewed visual captures in `.local/qa/directory-footer/`, the bounded route
  and component diff, and `git diff --check`.
- Formatting, scoped ESLint, TypeScript, all 63 unit tests and production build
  passed. Full `pnpm validate` still stops at the separate hero introduction's
  existing `react-hooks/refs` error in `src/components/specimen-hero.tsx:495`.
  That file was not modified by this task.
