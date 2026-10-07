# Task 0132 — Different About reading models

Date: 2026-10-08
Status: Complete — study only
Authority: The owner again finds the About options too similar.

## Scope

Keep Fieldnotes as the essay reference. Replace the other three options with
different reading models, each starting with its defining object instead of the
shared title, lead and photograph sequence:

- Map: an explanatory ATOMA diagram with independently expandable branches.
- Chapters: three initially closed, full-width native chapter disclosures.
- Index: a compact visual contents sheet with inline passages selected by tiles.

Reuse the short client-grounded copy and actual regional photographs. Map links
represent subjects to explore, not asserted supply chains or product provenance.
Community intentions stay visible as future work; no activity records or company
identity are invented. All content is accessible through labelled controls.

Retain the Fieldnotes reference, legacy study query values, palettes, typography,
reader actions and commerce guards. Preserve the current site flow. No assets,
dependencies, production changes or deployment are included.

## Verification

Confirm the local preview is serving current code and each study control changes
the composition. Review initial and expanded states on desktop and phone in both
palettes. Check native disclosure keyboard/touch behavior, tile selection and
focus restoration, body copy access, future status, image loading, no overflow,
reader return and preservation of the open chapter/selected tile through theme
changes. Run the focused browser suite, `pnpm validate` and scoped diff checks.

## Result and evidence

The study now presents Fieldnotes, Map, Chapters and Index. Map and Chapters
start collapsed; Index starts without a selected passage. Each exposes the same
short source copy through its own controls. Secondary study notes are collapsed
in the toolbar to keep the initial page view focused on the composition.

- `tests/about-study.mjs` passed all four viewport/palette cases: 1366px and
  320px, Mist and Blue hour. Each case exercised all four options, keyboard and
  touch controls, disclosure/tile state, Index close/focus return, reader return,
  theme continuity, shared body type and the existing homepage About popup.
- Initial and expanded desktop/mobile captures were reviewed in both palettes.
  Images and evidence are under `.local/about-experiences-0132/`.
- `pnpm validate` passed formatting, lint, TypeScript, all 130 unit tests and the
  production build. Output: `.local/about-experiences-0132/validation.log`.
- Preserved-file checks confirm the homepage, shared header, actual About popup
  and Origins provider are unchanged from the start of this task. Scoped review
  and `git diff --check` passed.

Preview is local at `/about-study`; saved query values remain `compact` for Map,
`ledger` for Chapters and `columns` for Index. No deployment was performed.
