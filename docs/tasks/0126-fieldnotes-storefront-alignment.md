# Task 0126 — Bring Fieldnotes into the storefront language

Date: 2026-10-07
Status: Complete — isolated study refinement
Authority: The owner prefers Fieldnotes but finds all three About explorations
out of step with the theme and feeling of the rest of the site.

Follow-up [Task 0128](0128-independent-about-page-structure.md) retains this
visual language and replaces the homepage-like split layout with a continuous
About page, as requested by the owner.

## Bounded change

Refine Fieldnotes within `/about-study` and make it the initial study direction.
Retain Statement and Index for comparison. Preserve the live homepage, navigation,
About popup, cart and existing Origins reader.

Replace the long magazine composition with the storefront's contained split
view: a persistent photographic stage alongside compact information. Use the
actual Mist/Blue hour atmospheric surfaces, fine dividers, restrained mono type,
open-diamond annotations and existing rounded control treatment. Approach,
Place and Community are accessible tabs; photography stays mounted during
changes and reader return. On phones, stack the stage and reading panel in
normal document flow. Preserve readable sentence-case body copy and reduced
motion support; reuse existing text resolution for a small caption only.

Keep Task 0125's content evidence boundaries. Kyoto field observations are
regional context; community copy remains explicitly future direction. Do not
invent activities, product provenance or an operating company. No new assets,
dependencies, commerce changes, deployment or adoption into the current flow.

## Verification

Review the revised composition at desktop and 320px mobile in both palettes.
Check keyboard and touch tabs, one active labelled panel, persistent photography,
reader Escape/focus/scroll return, local theme changes, reduced motion and the
unchanged canonical About popup. Run the focused browser suite, `pnpm validate`
and a scoped diff review. Retain local before/after evidence.

## Completed evidence

- Fieldnotes is the default study direction. Its photographic stage uses the
  supplied Kyoto field image and original leaf-handling caption. The information
  panel shares the storefront's restrained type, ruled rows, rounded tabs and
  atmospheric palettes, with a small existing handwritten accent.
- Approach, Place and Community support arrows, Home/End and touch. Inactive
  panels are invisible and inert. Desktop reserves the tallest panel so the
  photograph does not move; mobile flows to each subject's natural height.
- Browser checks pass at 1366px and 320px in both palettes. They verify stable
  photograph geometry, active-panel semantics, keyboard access, reader return,
  subject preservation during theme changes, reduced-motion text stability and
  the original About popup. Commerce was mocked and no writes were made.
- Desktop and phone captures were visually reviewed. Before/after screenshots
  and validation logs are in `.local/about-fieldnotes-0126/`.
- Homepage, header, About popup, Origins provider and shared About copy match
  the pre-task checksums. Scoped diff review and `git diff --check` pass.
- `pnpm validate` passes formatting, ESLint, TypeScript, all 115 unit tests and
  the production build. No dependency or release changes.
