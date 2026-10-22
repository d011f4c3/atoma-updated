# Task 0233 — Invent a new organising composition for the CX hero

Date: 2026-10-21
Status: Implemented for owner review; independent study

## Authority and direction

The owner finds the successive studies to be recycled layouts. The next pass
must change how the hero is organised, retaining ATOMA's identity and the
client's clear application/sample paths. Prior studies remain comparisons;
the real homepage is independent.

This interpretation makes the application entrances the visual composition.
Three typographic entrances sit asymmetrically around one changing powder field.
The field responds to a mouse or keyboard focus without adding a selection
prerequisite. Each entrance remains a native link to its exact product.
The modest marketing headline and Sample Set invitation stay independent of
the scene. There is no large tray, pouch, split introduction/object arrangement,
card row, questionnaire or mandatory animation.

## Bounded implementation

- Add `?layout=field` and make it the study default; keep existing explicit
  alternatives available.
- Keep the three applications, canonical names/codes and direct links visible.
  The application typography carries the visual scale; marketing copy remains
  restrained. Keep the established mono family and palettes.
- Use one persistent `PowderScene`, with explicit Ceremonial→2, Barista→1,
  Culinary→0 mapping. Pointer/focus preview may change the scene; only a product
  visit commits selection into the study URL for Back. Touch activates the
  product link directly.
- Show the Sample Set action immediately, with all three 20 g contents stated.
  Scene readiness cannot disable native actions. Keep system reduced motion,
  photographic fallbacks, readable focus states and no internal scrolling.
- Reuse existing illustrative material imagery and its provenance. Do not add
  product or scientific claims, new dependencies, operational changes or releases.

## Verification

Review the composition visually at desktop, tablet and phone sizes before
functional acceptance. Cover both themes and four locales across selected
profiles, no overflow, native pre-hydration entry, exact product paths,
Back/cart continuity, latest-preview mapping, one retained canvas, rapid changes,
reduced motion, image/WebGL failures and operation locks. Use intercepted local
commerce fixtures, run `pnpm validate` and inspect the final diff.

## Result

`/hero-cx-study?layout=field` now presents the three applications as a spatial
typographic composition around a diagonal powder form. Hover or keyboard focus
previews the corresponding material; each native link opens its product in one
action. The Sample Set remains a separate, immediately available entrance.
The established mono typography, product codes and Mist/Blue hour palettes
carry the identity. All five preceding layouts remain available in the study.

The phone composition gives the labels independent space, places arrows beside
their labels and keeps the sample action visible. Narrow phones receive an
additional powder offset to retain clearance beside Lattes. This is a new design
interpretation for review, not an approved replacement for the homepage.

## Verification results

- The strict browser suite passed eight desktop/tablet/phone profiles across
  both themes and all four locales. Supplemental English phone checks and
  saved Material/Applications regression checks passed.
- Native entry before hydration, exact product destinations, direct touch
  activation, Back/cart continuity, operation locks and slow/failed imagery
  passed against intercepted local commerce fixtures.
- Normal and reduced-motion previews, rapid selection, exact powder mapping,
  focus reset and one persistent canvas passed. Preview caused no commerce
  refetch. Forced WebGL denial and actual context loss retained the fallback
  and working native entrances.
- `pnpm validate` passed lint, type checking, 238 tests and the production
  build. Final browser runs reported no page errors or unexpected writes.
- Reviewed desktop, tablet, dark/light phone and all three mobile powder
  previews visually. Evidence is saved locally under
  `.local/hero-cx-study-0233/`; the existing in-app preview was updated to Field.

The screenshots and browser tests verify implementation and usability mechanics;
the owner's assessment of the new visual direction remains open.
