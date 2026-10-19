# Task 0167 — Refine the accepted About layout on phones

Date: 2026-10-18
Status: implementation and focused local verification complete.

## Scope

The owner requests a mobile pass on the accepted About scroll-story layout after
the homepage sample entry and Field note popup revisions. Preserve the desktop
composition from Task 0163, approved copy, supplied photographs, locale support,
existing type scale and actual homepage action styles. Popup revision belongs
to its separate task; preserve its history, focus and return-scroll contracts.

## Changes

- Show the opening landscape at its natural 3:2 proportion on phones, retaining
  the photograph's width and avoiding the previous tall crop.
- At the narrowest widths, explicitly align the edition label, Field notes link
  and appearance controls. Preserve the existing 44 px control hit areas.
- Place each approach index beside its heading and tighten spacing. Keep all
  three photographs, exact approved paragraphs, 14 px principle headings and
  narrative copy, and 10 px supporting labels with their locale increments.
- Place the existing Connections explanation before its photographic sequence
  in the phone composition so the photographs follow their meaning.
- Present the three closing matcha swatches together with their canonical codes
  and names. Retain each photograph's aspect ratio and the existing Shop action.

All presentation changes are scoped to widths at or below 760 px, with the
utility-row adjustment at 380 px. No scroll hook, sticky behavior, popup,
commerce, factual content or shared design-system change is included.

## Verification

Reviewed 320 px light and 390 px dark phone captures, including a 320 px Japanese
fit check. All three cases have complete text, visible photography, no horizontal
overflow and no runtime errors. The existing full-entry Field note links remain
unchanged. The 320 px utility controls align on one row with 44 px hit areas;
the collection action remains 52 px high.

Computed English type at 320 px is unchanged: 20 px title and section heading,
14 px principle heading and body, and 10 px index. The closing three-column
strip fits English and Japanese names and codes without clipping. All CSS
changes are inside mobile media queries; desktop composition and the scroll
controller are unchanged. Evidence is in `.local/about-mobile-0167/`.

Scoped formatting, component lint, `tsc --noEmit` and `git diff --check` pass.
Full repository validation passes with Tasks 0165–0166: formatting, lint,
TypeScript, all 142 unit tests and the production build. The log is
`.local/validation-0165-0167.log`. No deployment is included.
