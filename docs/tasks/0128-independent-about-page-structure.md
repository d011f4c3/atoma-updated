# Task 0128 — Give About its own page structure

Date: 2026-10-07
Status: Complete — isolated study refinement
Authority: The owner accepts the refined Fieldnotes visual direction but finds
its layout too close to the homepage. Structure About as its own page while
retaining the established feeling.

## Bounded change

Refine Fieldnotes at `/about-study`; keep it the default and retain Statement
and Index. Replace the two-column inspector and subject tabs with continuous
document flow: introduction, Approach and three selection principles, a broad
photographic band, Place and Community. All sections remain readable together.

Keep the atmospheric Mist/Blue hour palettes, compact mono type, restrained
rules, photographic captions, small handwritten accent and existing controls.
Use a narrower page measure and one numbered section sequence. Give the
landscape photograph most of the image band and the leaf image a smaller
companion position, with original captions. Put the introduction ahead of
photography on mobile and preserve readable normal document scrolling.

Preserve Task 0125's content boundaries: existing Kyoto observations are regional
context, community copy is explicitly Looking ahead, and no completed activity
or operating-company identity is invented. Keep the existing field reader,
local study theme, reduced-motion behavior, current About popup and storefront
flow. No new assets, dependencies, commerce changes, adoption or deployment.

## Verification

Review all three directions on desktop and 320px mobile in both palettes.
Check continuous section visibility, reading order, image loading, no overflow,
reader focus/scroll return, local theme continuity, reduced motion and the
canonical About interaction. Run the focused browser suite and `pnpm validate`,
review the scoped diff, and retain local visual evidence.

## Completed evidence

- Fieldnotes now reads as one About page: a compact introduction, three
  selection principles, an asymmetric photographic band, Place and Community.
  Removed the split-stage layout, subject tabs and hidden-panel state.
- Existing palette, type, controls, captions and reader entry remain intact.
  Community direction is clearly prospective; the source copy is unchanged.
- All four browser cases pass at 1366px and 320px in Mist and Blue hour. They
  cover visible content and reading order, image loading, no overflow, reader
  focus/scroll return, local theme continuity, reduced motion and the existing
  homepage About popup. All commerce reads were mocked; writes were blocked.
- Reviewed desktop, phone and scrolled-viewport screenshots. Mobile photo
  markers are inset within the article. Evidence is in `.local/about-page-0128/`.
- Homepage, header, original About content, Origins provider and shared study
  copy match the pre-task checksums. Scoped diff review and `git diff --check`
  pass.
- `pnpm validate` passes formatting, ESLint, TypeScript, all 126 unit tests and
  the production build. No dependencies, adoption or deployment.
