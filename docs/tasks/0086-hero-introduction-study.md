# Task 0086 — Hero introduction study

## Approved brief

The owner wants a `/hero-study` focused only on the left side of the current
homepage: headline, Flavour / Texture / Performance, application statement and
Explore matcha action. The right-side bag presentation is approved.
The owner subsequently requested additional options that keep the general feel
of the page; Specimen, Register and Margin extend the comparison with restrained
monospaced treatments and label-inspired hierarchy.

## Scope

- Compare Current, Folio, Index, Caption, Specimen, Register and Margin without
  adopting a new homepage.
- Retain the current wording, approved bag image and label, right-side geometry,
  lighting, pointer behavior and in-place product flow. Use the same mounted
  SpecimenHero when switching directions, with an optional introduction variant.
- Provide a compact study selector, shareable direction query and local appearance
  control. Preserve real selected product and quantity while comparing.
- Use existing fonts and scoped CSS. No new dependency, asset generation,
  invented product claims, commerce write or deployment.

## Validation

Inspect all six new directions plus Current at desktop and mobile sizes in
both themes. Confirm the viewer stays in place, Explore / Shop / return work,
selection persists, controls have accessible names and keyboard focus, and
mobile content fits. Run formatting, `pnpm validate`, and review the bounded
diff. Save screenshots and open the study for review.

## Results

- Added six introduction directions and Current, preserving the homepage default
  and all viewer styles. Desktop uses direct comparison buttons; mobile uses a
  compact labeled direction selector. The study opens on Specimen.
- Visually reviewed the six directions at 1440 × 1000 in Blue hour and
  390 × 844 in Mist. Also checked narrow 320 × 700 and short 700 × 430
  layouts; short screens scroll within the preview. Desktop viewer bounds
  remained identical when comparing Current, Folio and Index.
- Verified the shared Explore → Shop → hero journey, retained Barista selection
  and quantity 02 while changing directions, and return focus to the new Explore
  button. Restored Culinary and quantity 01. No cart write was performed.
- Replaced the initial render callback with a typed component variant so refs
  are passed through JSX, satisfying the React ref rule without suppression.
- `pnpm validate` passed: formatting, lint, types, all 63 tests and production
  build. `git diff --check` passed; reviewed the shared-component diff and
  confirmed the original hero stylesheet is unchanged.
- Saved desktop screenshots for Index, Caption, Specimen, Register and Margin
  plus mobile Folio and Specimen under `docs/design/hero-study-*-0086.png`.
  Left `/hero-study?direction=specimen` open with the normal browser viewport.
