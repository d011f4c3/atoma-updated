# Task 0183 — Community and Origins photography

Date: 2026-10-19
Status: implemented and verified locally.

## Scope

Use the owner's supplied harvest and technology photographs in the About
community stories, their popup and standalone readers, relevant About sections,
and Wazuka in Origins. Keep the accepted scroll composition, type scale,
buttons, mobile dialogs, story navigation and commerce state. The harvest stays
a separate Community entry rather than becoming the About page's subject.

The owner selected DSC00900 as the harvest cover, with a desktop crop focused
on the people, and the edited drone close-up as the technology cover. About
cards and story metadata now use each shared story's first photograph, avoiding
a separate stale cover mapping. Readers retain the complete photographs.

The company introduction describes ATOMA's application-led selection and
guidance for buyers. The Connections copy links buyers with growing, processing
and preparation, rather than describing ATOMA as visiting and photographing.
Remove GVJ attribution from the canonical About introduction and closing line.
Preserve the approved Character / Application / Origin text. Community remains
an extensible collection; do not invent support projects or community outcomes.

The approach photographs follow the owner's final selection: DSC01014 leaf
detail for Character; the existing preparation photograph for Application;
R0008013 (existing `harvest-landscape.webp`) for Origin. Connections uses the
new leaf detail and harvest team photographs. The harvest cover uses a centered
desktop crop, moving the people down within shallow panoramic frames so their
heads remain visible; mobile remains unchanged.

Wazuka has a separate Origins photo collection using the harvest cover, hillside
harvest, leaf detail and original FPV landscape. Its place detail, photo reader
and homepage Origins preview use that collection. Existing Kyoto and Uji
photography, place facts, provenance graph and private grower treatment remain
unchanged. The generated composite is confined to its labeled technology story.

## Source mapping

Public derivatives live in `public/images/about/wazuka/`. Originals stay outside
the public app, unchanged. Exports apply EXIF orientation, use WebP quality 84,
do not upscale, and strip EXIF/IPTC/XMP metadata.

| Supplied source                               | Derivative                 | Size        | Placement                                        |
| --------------------------------------------- | -------------------------- | ----------- | ------------------------------------------------ |
| DSC00900.JPG                                  | harvest-community.webp     | 2400 × 1600 | Harvest cover; Wazuka Origins                    |
| DSC00888.JPG                                  | harvest-team.webp          | 2000 × 1333 | Shared harvest work; About Connections           |
| DSC01014.JPG                                  | tea-leaf-detail.webp       | 2000 × 1333 | Harvest details; Growing; Wazuka Origins         |
| R0008020.JPG                                  | harvest-on-the-slope.webp  | 1333 × 2000 | Harvest details; Wazuka Origins                  |
| DSC01201.JPG                                  | fpv-pilot.webp             | 1333 × 2000 | Technology: the pilot                            |
| R0007992.JPG                                  | powersuit-harvester.webp   | 1333 × 2000 | Technology: person and equipment                 |
| R0007980.JPG                                  | drone-over-tea-rows.webp   | 1333 × 2000 | Technology: wider field viewpoint                |
| DSC01028.JPG                                  | fpv-in-the-fields.webp     | 2000 × 1333 | Wazuka Origins: people and tools                 |
| exec-317d816c-2ddc-48b2-85e4-ea050214bedc.png | drone-flight-close-up.webp | 1536 × 1024 | Technology cover; previous wire-removal edit     |
| Corrected composite below                     | drone-pilot-composite.webp | 1536 × 1024 | Technology closing photograph, labeled composite |

R0007977 already exists as `drone-above-the-field.webp` from Task 0154.
It is retained for existing uses rather than duplicating a similar sky view in
the expanded technology story. Prior photography records remain available to
saved studies. New captions describe visible people, tools and field work;
they do not identify growers or claim equipment performance or SKU provenance.

## Drone correction

Built-in imagegen mode, `precise-object-edit`, was used on the supplied composite
`exec-a0a60a88-0054-45b7-a891-d402de7a5138.png`. The new output is
`exec-0d2e0f77-ad98-4024-a241-7fd49bc9d3d5.png` in the task's generated-images
directory. A full-resolution copy is retained locally at
`.local/field-photos-0183/drone-pilot-horizontal.png`; the application uses the
WebP derivative above. Originals are not overwritten. Visual review confirms
the drone's rotor guards are level. This remains a generated photographic
composite, explicitly identified in its caption and alt text.

Final edit prompt:

```text
Use case: precise-object-edit.
Edit target: the attached landscape photograph, a tea farm with a person wearing FPV goggles on the right and a very small drone in the upper-left sky.
Primary request: straighten ONLY that little drone. It currently tilts clockwise, with its right rotor guard lower than its left rotor guard. Rotate just the drone counterclockwise about 11 degrees so its left and right rotor guards sit at exactly the same vertical height, forming a level horizontal line parallel to the image's top edge. Keep the drone at exactly the same center, apparent size, distance and upper-left position. Preserve its realistic shape, camera, rotor guards, detail and lighting. Fill the tiny vacated pixels with matching blue sky seamlessly.
Strict invariants: do not rotate or crop the whole photograph. Keep the entire landscape, people, tea rows, trees, sacks, sky color, exposure, composition, framing and all other image content unchanged. No new objects, no text, no watermark.
```

## Verification

- `pnpm validate` passes formatting, ESLint, strict TypeScript, all 202 unit
  tests and the production build. The final log is
  `.local/field-photos-0183/validate-final.log`.
- Browser review at 1440 × 900 and 1440 × 740 confirms both selected About
  covers load. The shorter desktop frame keeps all three heads visible with the
  final centered crop. The harvest chapter jump and technology reader work;
  photograph aspect ratios are preserved and the corrected drone image loads.
- At 390 × 844, the technology popup retains 16 px outer gutters and its 82dvh
  height limit, with no horizontal overflow. Both standalone stories use the
  same selected image sequence. About's three approach images load with the
  requested Character / Application / Origin choices.
- Wazuka's mobile place detail and photo reader display the new four-image
  collection, preserve the grower placeholder and return navigation, and show no
  horizontal overflow. Original photographs retain their proportions.
- Existing About browser fixture expectations were updated for current copy and
  photographs. Syntax checks and focused localization/Origins tests pass. The
  standalone Playwright recipes were not run; visual and interaction checks
  used the in-app browser.
- Source review and `git diff --check` pass. Metadata stripping and source-file
  integrity were verified during export. No dependencies, deployments, or
  Shopify changes were made. Temporary viewport overrides were reset.

Screenshots are saved in `.local/field-photos-0183/`, including
`about-harvest-desktop.png`, `technology-mobile.png`,
`origins-wazuka-mobile.png` and `about-approach-mobile.png`.
