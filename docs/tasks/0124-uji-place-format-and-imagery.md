# Task 0124 — Match Uji and Wazuka place format and imagery

Date: 2026-10-07
Status: Complete locally
Authority: Owner requests the same Origin layout and Country / Region / Locality
format for Uji and Wazuka, with different place-specific imagery from the shared
Google Drive.

## Bounded change

Use the existing Panorama and published place path for both locations. Uji shows
Country Japan, Region Kyoto and Locality Uji City, with Uji City as its heading.
Wazuka continues to show Country Japan, Region Kyoto and Locality Wazuka.
The existing Uji tea designation explanation stays in sentence-case body copy;
the place path is editorial context, not a new claim about where a supplied
matcha was grown or processed. Keep designation links separate from geographic
provenance records. Uji City and Wazuka remain siblings beneath Kyoto.

Use a distinct supplied Kyoto photograph for the Uji presentation, after
inspecting the shared Drive and confirming its collection context. Retain the
Kyoto-level caption because the precise municipality has not been verified.
Preserve the established photograph dimensions, layout, CSS, typography, theme
behavior, actions and product selection. Do not label an unverified image as
captured in Uji or infer product provenance from a photograph. No new dependency,
database structure, commerce change or deployment.

This supersedes Task 0107's display of Designation / Growing place / Processing
as the three Panorama rows, and its requirement to reuse the same Kyoto
photograph. Its separate provenance and publication safeguards remain in force.

## Validation

- Verify Japan → Kyoto → Uji City and Japan → Kyoto → Wazuka use the same path
  kinds, DOM and visual classes in the approved Panorama.
- Verify all four languages render the place labels, with the existing CJK type
  size and sentence-case body-copy behavior retained.
- Confirm UJI products remain designation associations with no invented
  geographic grown/processed records, and invalid place paths fail closed.
- Inspect the distinct imagery in both themes at desktop and mobile sizes;
  preserve reader entry/return, selection, quantity, focus and layout geometry.
- Run focused Origin tests, the relevant browser flows, `pnpm validate` and
  review the scoped diff.

## Evidence

- The shared preview now obtains Uji's place labels from its published
  Japan / Kyoto / Uji City context path. The same existing Panorama markup and
  CSS render both locations; designation records remain separate from growing
  provenance.
- Focused Origin preview, designation, editorial-content and localization tests
  pass after the imagery change: 23 tests.
  These cover the matching geographic display path, separate source records,
  locale labels, locality-specific photography selection and invalid paths.
- The existing browser flow passes at 1366px in Mist, including identical
  Panorama DOM/CSS and photograph geometry, directory/reader navigation and
  product/quantity continuity. The screenshot in
  `.local/uji-place-format-0124/1366-light-barista-home-preview.png` was reviewed.
- The existing four-language browser flow passes at 320px in Mist, including
  the translated Country / Region / Locality labels, retained growing-location
  caveat, selection, cart, reader and locale persistence. Reviewed the Japanese
  mobile preview in `.local/uji-place-format-0124/localization/`.
- Scoped formatting, ESLint and `git diff --check` pass.
- The supplied `2025-05_KOMA_Kyoto_InitialEdit_136.jpg` is now used in Uji's
  preview, directory hero and search thumbnail as
  `/images/origins/uji-context-landscape.jpg`. It comes from the existing shared
  Kyoto collection and shows foreground shade cloth, tea rows and wooded hills.
  Its caption remains **Tea fields · Kyoto**. The original 6240 × 4160 image was
  inspected; its source checksum is recorded in the content evidence document.
- A small display-photo override on the existing Kyoto field entry provides the
  Uji image. The field-entry count, supporting gallery, reader composition,
  Wazuka photo, product associations and provenance are unchanged. New alt and
  observation copy has Simplified Chinese, Traditional Chinese and Japanese
  translations; the translation-coverage test includes this copy.
- The browser assertions now check distinct image sources and successful loading
  in Uji's preview, reader and search thumbnail, retain Wazuka's image, and compare
  the shared caption separately from each image's own observation.
- Final Origin browser coverage passes at 1366px and 320px in both themes with
  the selected image, matching rows/layout, image loading and product/quantity
  continuity. The first 1366px dark run encountered a transient `ERR_ABORTED`
  during retail navigation; an unchanged rerun of that profile passed. Final
  evidence is in `.local/uji-place-format-0124/final/`.
- Final four-language coverage passes at 320px in Mist with the selected image;
  evidence is in `.local/uji-place-format-0124/final-localization/`. The final
  1366px light and 320px dark Barista Origin screenshots were visually reviewed
  and retain the approved layout with the distinct photograph and matching
  geographic rows.
- `pnpm validate` passes formatting, ESLint, strict TypeScript, all 115 unit
  tests and the production build. No production change or deployment.
