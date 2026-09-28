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

`public/images/hero/matcha-vessel-light-v3.webp` is the active vessel image,
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

All motion is CSS transforms and opacity, with a small pointer-response handler.
No animation/3D library, rendering service, tracking SDK, or new runtime
dependency is added. Text and controls remain live HTML, not baked into imagery.
There is no video download, autoplay audio, scroll hijacking, or custom cursor
that hides the native pointer. Ambient motion can be paused; reduced-motion
preferences suppress automatic motion and transitions.
