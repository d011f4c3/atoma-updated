# Task 0052 — Origins copy, UX and UI overhaul

Date: 2026-10-01
Status: Complete

## Approved scope

The owner requests a full copy, UX and UI pass across Origins, then specifically
asks that the client briefs guide the copy. Both September 28 RTFs were reread
in full, alongside the September 19 origin/people/role sections. Preserve the
owner's confirmed Wazuka origin for the three materials, named people with
accurate roles, central documentary photography, and growth to more places/types.

## Direction

- Follow Product → Information → Origin → People. Keep the homepage product
  experience intact and return to its exact selection after exploring Origins.
- Replace database/archive language and planning commentary with useful,
  concise descriptions of place, work and expertise. No generic heritage,
  rescue, laboratory-testing or lifestyle claims.
- Give the global entrance a photographic route into a growing place. Keep
  regional browsing/search available without making the opening look like a form.
- Refine the place view around landscape, connected matchas, and people/work.
  Use compact reading navigation, clear hierarchy, visible photography and
  a dedicated mobile composition. Typography remains locally hosted IBM Plex Mono.
- Reduce the deeper photographic reader to short factual captions and large
  images. Preserve its state restoration and keyboard behavior.
- Refine the embedded homepage Origins entrance to match this system, without
  changing Overview, Specifications, purchase behavior or the separate retail task.
- Retain location, person and material relationships independently. Kyoto photo
  metadata does not identify a Wazuka field or pictured person. No new services,
  dependencies, APIs, commerce mutations, operational data or release.

## Validation

Run existing meaningful relationship/publication tests; update assertions tied
to replaced visible copy while retaining evidence boundaries. Check desktop and
mobile in both themes, image loading, overflow, keyboard, reduced motion,
search/filter/reader return and selected-product continuity. Run `pnpm validate`
and review the scoped source/CSS changes and `git diff --check`.

## Delivered

- Rewrote the place, people and photographic captions against both attached
  briefs. The three materials remain linked to Wazuka; photographs retain Kyoto
  attribution, and named partners retain their individually documented roles.
- Added a photographic Wazuka entrance with subordinate regional browsing and
  search. Place views now pair landscape and identity, compact matcha choices,
  and the people/work section, with direct section navigation.
- Simplified the reader to three photographs with adjacent factual captions,
  chapter navigation and a persistent return to the selected matcha.
- Added a compact photographic entrance to the homepage Origins panel. Fixed
  the transient image-containment failure reported during the update: the frame
  now has explicit relative positioning, full width, bounded height and clipping.
- Bounded child-place previews and paginated locality lists; distinct entry
  titles identify photograph controls. Additional image-only entries retain
  their lead photograph without repeating the already featured image.

## Verified

- `pnpm validate` passed: formatting, lint, generated route types, TypeScript,
  all 56 tests and the optimized production build. The 23 Origins tests also
  passed independently. Existing Node module-type warnings remain unchanged.
- Reviewed the scoped source and styles; `git diff --check` passed. A synthetic
  100-locality render verified three child previews, twelve initial place
  choices, the more-places control and distinct photograph-entry labels.
- Browser checks covered light/dark desktop, 390px and 320px mobile layouts,
  loaded photographs, no horizontal overflow, search, type filtering and
  photographic chapter navigation. Returning from the reader preserved its
  filter, scroll and focus; returning to the homepage retained the selected
  matcha and Origins view. Escape closed the modal and restored the opener.
- Reduced-motion emulation confirmed that modal animation is disabled. Test
  emulation was reset. The fresh production preview was checked as well as the
  live development page; no cart writes or production changes were performed.
