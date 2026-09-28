# Home hero asset provenance

Created: 2026-09-28 for Task 0002.

## Original concept imagery

Two assets were generated with the built-in ImageGen tool in two parallel calls.
No stock photography, client-reference imagery, or real packaging was copied.
No variants or retries were generated.

| Final asset                             | Dimensions  | Use                                                                                                                                     |
| --------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `public/images/hero/matcha-vessel.webp` | 1536 × 1024 | Machined metal vessel, matcha, suspended lid. The lid and base are masked from the same bitmap for separate entrance/ambient animation. |
| `public/images/hero/matcha-macro.webp`  | 1536 × 1024 | A closer material view, entered with the hero's view controls.                                                                          |

The final files are optimized WebP conversions of the generated originals,
quality 88, with no compositional or semantic edits. Exact final prompts and
path mappings are in [hero-image-prompts.json](hero-image-prompts.json).

The vessel is a conceptual material study, not approved ATOMA packaging or
evidence of actual production equipment. No certification, measurement,
origin, price, stock, or product code is asserted. View numbers identify the two
visual perspectives only. These images do not identify a purchasable SKU.

## Smoother powder edits — Task 0003

The built-in ImageGen editor made one edit per original, with no variants or
retries. Both results were visually inspected before optimized WebP conversion
(quality 88, effort 6). Original files remain available.

| Current asset                              | Dimensions  | Change                                                                                                                                                                         |
| ------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `public/images/hero/matcha-vessel-v2.webp` | 1536 × 1024 | Removes coarse clumps inside the vessel; preserves metal, framing, and the visible gap at the lid/base split. The mound retains its original general height and conical shape. |
| `public/images/hero/matcha-macro-v2.webp`  | 1536 × 1024 | Smoother fine powder and a gentler ridge; preserves the curved channel and controlled green/black lighting.                                                                    |

Exact edit prompts, source paths, generated outputs, and inspection findings
are in [hero-refinement-prompts.json](hero-refinement-prompts.json). CSS presents
the macro through a circular inspection aperture. The linework is interface
geometry, not a claim of laboratory testing or measured performance.

## Light background adaptation — Task 0004

`public/images/hero/matcha-vessel-light-v3.webp` is the first-checkpoint vessel image,
1536 × 1024 with genuine alpha transparency. One built-in ImageGen edit removed
the baked-in black background and floor reflection from the v2 vessel. Original
assets remain retained. Conversion uses WebP quality 90 and alpha quality 100.

The output was visually inspected and alpha-checked. Visible lid bounds end at
y343 and the vessel starts at y352, preserving the split at 34% of image height.
Background corners are fully transparent. The editor slightly strengthened
metal highlights and powder texture; this is not a pixel-identical extraction.
Very faint 1/255 alpha residue is present outside the object bounds. The macro
image remains unchanged inside its circular aperture.

The exact final prompt and generated output are recorded in
[hero-light-image-prompt.json](hero-light-image-prompt.json).

## Second concept tray — Tasks 0008/0009

`public/images/hero/matcha-tray-concept-02.webp` is the current hero image:
1536 × 1024, a shallow metal tray containing fine green matcha, with genuine
alpha transparency. One built-in ImageGen call created this original image;
there were no variants or retries. The inspected PNG was converted to WebP at
quality 90, alpha quality 100, and effort 6.

The entire tray and subtle straight powder sweep are visible, without text,
props, people, or copied brand assets. The tray is wider and rotates in the
opposite direction from the requested prompt; its powder is mildly granular.
A faint alpha halo in the original margins was reviewed in the browser.
The exact prompt, generated source, output path, and inspection notes are in
[hero-concept-02-image.json](hero-concept-02-image.json).

This is an illustrative material study, not a real SKU, approved packaging,
or evidence of ATOMA's equipment or testing. Task 0009 reuses this image without
a new generation. The macro image used in the initial second-concept detail
view remains retained but is no longer part of the current hero.

## Typography

The active type is the owner's supplied PP Fraktion trial: Sans Light (300)
for display type, Sans Bold (700) for the small wordmark, and Mono Regular (400)
for controls and annotations. Files were copied from the provided Sans/Mono
folders under `PPFraktion-Free for personal use v1.1 2` into
`public/fonts/fraktion/`, and loaded with `next/font/local`. The owner explicitly
authorized this local evaluation and will obtain a production license if chosen.
This task does not publish the fonts or site.

The previous Inter asset remains retained, inactive, with its SIL Open Font
License 1.1 at `public/fonts/inter/LICENSE.txt`. Its prior provenance is the
official Inter 4.1 distribution, `https://rsms.me/inter/`. No font service is
called by the browser.

## Motion and layout

Through Task 0012, motion is CSS transforms and opacity, with a small pointer-response handler.
No animation/3D library, rendering service, tracking SDK, or new runtime
dependency is added. Text and controls remain live HTML, not baked into imagery.
There is no video download, autoplay audio, scroll hijacking, or custom cursor
that hides the native pointer. The current tray concept removes the custom
motion toggle at the owner's request. System reduced-motion preferences suppress
automatic motion, transitions, and pointer tracking; the original checkpoint
retains its historical pause control.

## Spatial chamber — Task 0010

The final concept reuses `matcha-tray-concept-02.webp`; no new image generation
or third-party imagery is added. `specimen-field.tsx` generates original SVG
linework as a presentational curved chamber. Neither its lines nor its view
ordinal represent measured data or a scientific claim. The portfolio supplied
by the owner informs spatial composition and the rounded header; no site code,
project thumbnails, fonts, or branding assets were copied.

## Material in motion — Task 0013

Concept 05 introduces original code-native Three.js geometry: a shallow rounded
metal tray, raised lip, and a shallow asymmetric powder bank with deterministic
procedural grain. An organic perimeter, a swept depression, exposed metal, and
sparse fine grains replace the initial uniform green rectangle. Original studio
reflection cards produce the metal's highlights;
no HDR, model, reference media, new image generation, or video is downloaded.
The camera changes perspective during a four-second reveal and then moves
subtly with ambient and bounded pointer response. Display text remains HTML.
Dark and light versions use different reflection environments over their black
and pale studio surfaces, including a dark reflection flag in the light version.

The existing `matcha-tray-concept-02.webp` is reused as a local loading/failure
fallback. It is an alternate illustration, not an exact still of the 3D model.
Neither rendering is approved packaging or a SKU. The route-specific renderer
dependency, motion preferences, visibility suspension, resolution cap, and
resource lifecycle are recorded in ADR 0002 and Task 0013. Other concepts keep
their existing CSS/image implementations.

## Final photographic experience — Task 0014

Concept 06 reuses `matcha-tray-concept-02.webp` without editing or regenerating it.
Both the visible tray and circular 2.5× inspection aperture use that same image;
the sample under the aperture center remains aligned to the source point. This
is digital magnification of the illustrative image, not additional measured
detail or a scientific imaging claim. No macro substitution or new bitmap is used.

The coordinated reveal, ambient light, and optical linework are original CSS/SVG.
The two tones use identical geometry, and the native cursor remains visible.
The user explicitly prefers the 2D tray over the saved 3D comparison. No new
generation, external reference asset, service, or rendering dependency is added.
