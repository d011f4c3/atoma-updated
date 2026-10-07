# Task 0133 — Two more About layouts

Date: 2026-10-08
Status: Complete — study only
Authority: The owner requests two new layouts for `/about-study`.

## Scope

Add Broadside, a compact editorial sheet with a typographic introduction,
selection register, photographic place column and prospective community band.
Add Sequence, a guided three-step reader with numbered progress and previous /
next controls. Keep Fieldnotes, Map, Chapters and Index and their saved query
values. Fieldnotes remains the default.

Reuse the canonical study copy and regional photography. Preserve the shared
Mist and Blue hour palettes, small mono type, content evidence boundaries,
field reader, commerce guards and canonical storefront. Make both new layouts
available from desktop buttons, mobile selection and direct query links.
No assets, dependencies, commerce changes, deployment or homepage adoption.

## Verification

Review both additions on desktop and phone in both palettes. Exercise Sequence
navigation by keyboard and touch, disabled endpoints, theme/state continuity,
reader focus and scroll return, image loading and overflow. Preserve the four
existing study checks. Run the focused browser suite, `pnpm validate`, scoped
diff review and preserved-file checks.

## Result and evidence

- Broadside and Sequence are available from the six-option desktop toolbar,
  phone selector and direct `?direction=broadside` / `?direction=sequence`
  links. The existing four layouts and default remain available.
- The focused browser suite passes all four viewport/palette cases: 1366px
  and 320px in Mist and Blue hour. Checks cover all six layouts, direct links,
  distinct initial compositions, canonical copy and typography, image loading,
  Sequence keyboard/touch controls, navigation boundaries and heading focus,
  reader return, theme/state continuity and the original About popup.
- Desktop and phone screenshots were visually reviewed. Local evidence is in
  `.local/about-layouts-0133/`. Independent review also checks both additions
  at 768px, 900px and 1024px with Study notes open/closed in both palettes:
  all 24 states fit, with accessible study controls and no horizontal overflow.
- `pnpm validate` passes formatting, ESLint, TypeScript, all 130 unit tests and
  the production build. The log is in the evidence folder. Scoped review and
  `git diff --check` pass; preserved-file checks confirm the homepage, shared
  header, About popup, Origins provider and study copy are unchanged from the
  start of this task. No deployment was performed.
