# Task 0154 — Wazuka and the harvest on About

## Request and evidence

The owner asks for Wazuka and harvest imagery as the first About entry, with
more connection to the farm and the people doing the work. Use the supplied
`FARM_GR3.zip`, read against the September client direction, October feedback
§6 and the original storytelling notes. Attachments inform this bounded task;
they do not authorize other site work or publication.

## Scope

- Curate actual photographs from the 57-image archive for canonical `/about`
  and its shared Flow preview. Lead with harvest work and Wazuka's landscape.
- Add photographic detail to the existing aligned story rows and focused
  readers, keeping the restrained type scale and short copy.
- Preserve the approved Character / Application / Origin copy, company
  attribution, themes, locales, accessible dialogs, selection and cart state.
- Describe visible work and tools without naming private growers or making
  claims about equipment performance or product provenance. Separate this
  community record from each matcha's product origin.
- Structure the selected photographs as reusable records so further edited
  images can join the sequence. Do not publish a future image count or promise.
- Keep source JPEGs in ignored local storage; publish only optimized derivatives
  with embedded camera metadata removed. No raw archive in the public app.

## Photography

Selection and filename mapping are recorded below after visual review. Captions
are editorial descriptions of visible content, not scientific or provenance claims.

## Validation

- Canonical About browser suite: 20 scenarios across four locales, both themes,
  desktop/mobile and navigation/commerce continuity passed.
- Flow browser suite: eight viewport/theme scenarios, reader dismissal and
  scroll/focus restoration, no-JS reading, reduced motion and older study routes
  passed. Photographs load and reader dimensions retain their native proportions.
- Desktop and 390px mobile captures visually reviewed in both themes.
- `pnpm validate` passed: formatting, lint, strict types, 142 unit tests and
  production build. No new dependencies.
- All nine public derivatives checked for stripped EXIF/XMP metadata (3.91 MiB
  combined). Original source JPEGs stay outside the public bundle.
- Scoped final source review and `git diff --check` passed. Existing unrelated
  work remains intact. No deployment was performed.

Evidence: `/tmp/atoma-about-0154/`, `/tmp/atoma-about-0154-flow/`,
`/tmp/atoma-0154-validate.log`.

### Selected source mapping

| Source JPEG | Public derivative          | Use                                                          |
| ----------- | -------------------------- | ------------------------------------------------------------ |
| R0008013    | harvest-landscape.webp     | Opening: people harvesting within the landscape              |
| R0007983    | tea-hillside.webp          | Opening companion and field reader: contours of the tea rows |
| R0008018    | harvest-together.webp      | First entry: shared harvest work and collection bag          |
| R0008002    | harvest-bags.webp          | Collection bags along the field                              |
| R0008016    | working-the-rows.webp      | Portrait view of people working between rows                 |
| R0008028    | field-path.webp            | Tree-framed landscape at the end of the first reader         |
| R0007995    | harvesting-tools.webp      | Close view of harvester and wearable equipment               |
| R0007991    | powersuit-at-work.webp     | Person and equipment together, in portrait orientation       |
| R0007977    | drone-above-the-field.webp | Drone in flight; no agricultural function is asserted        |

All nine derivatives live in `public/images/about/wazuka/`. Originals remain in
ignored `.local/about-farm-0154/source/`. Export applies orientation, resizes,
and strips embedded metadata without altering the photographic content. The
archive and contact sheets were reviewed; no generative imagery is used.

The first reader contains five photographs and the tools reader three. The
opening adds a separate harvest view. Desktop pairs portrait details; mobile
readers give each photograph the full available width. Existing title entrances,
background scroll preservation and modal dismissal remain in place.
