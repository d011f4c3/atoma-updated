# Adhered foil sticker surface — Task 0177

Date: 2026-10-19 (Asia/Tokyo).

The current hero bag was edited with the built-in ImageGen tool in `precise-object-edit` mode, with `transparent_background: true`. No CLI fallback, raster post-processing, or new package was used. The output was copied unchanged into the repository. Its blank paper surface is intended to receive live product-specific ink in the website; the product content is not baked into the photograph.

## Files

- Edit target: `public/images/product-exploration/silver-bag-hero-v3.png`
- Selected output: `public/images/samples/foil-pouch-sticker-v2.png`
- Original generated output: `/Users/d0l1f4c3/.codex/generated_images/01a14f8d-3ebf-7982-b7d3-09eaa28e9bbe/exec-522ae832-aa2f-46b4-890a-e7a3a358e6b0.png`

## Inspection

The selected output is 1024 × 1536 px, RGBA. It retains genuine alpha, with 484,457 fully transparent pixels; the corner alpha values are zero. The visible bag bounds at alpha ≥ 128 are approximately x119–909 and y68–1488 (inclusive), compared with the original x119–908 and y68–1487. There are very faint antialiased pixels outside those visible bounds. The generated output and its alpha were preserved untouched.

The blank white sticker occupies approximately x228–808 and y694–1231, measured visually. Its edge has shallow curvature and the paper carries subdued fold shading, a tiny contact edge, and neutral white grain. There is no text, barcode, QR code, brand, or product claim in the generated surface. The source bag was inspected before editing, and the output was inspected before acceptance.

Use transparent live ink over this physical paper surface. A second opaque CSS rectangle would conceal the photographic adhesion and material effect. Keep essential ink inside approximately x253–782 and y719–1200 to clear the physical edge and bow.

## Exact prompt

```text
Use case: precise-object-edit.
Asset type: photoreal product packaging cutout for an interactive ATOMA sample-set website.
Input image: the supplied silver bag is the exact EDIT TARGET, not a loose reference.
Primary request: add one completely BLANK neutral WHITE adhesive paper sticker to the lower-middle front face of this exact silver foil pouch. The sticker must look physically pressed onto the flexible foil, not a floating card or a graphic pasted over a photograph.
Preserve the exact single front-facing silver pouch, its silhouette, seams, top zipper, tear notches, lower seam, camera angle, lighting, folds, dimensions, position and transparent margins. Preserve the original silver material everywhere except beneath the sticker.
Composition: same portrait 1024 by 1536 framing. Within this coordinate system, sticker spans approximately x205 to x820 and y665 to y1260: about 78 percent of the visible bag width, nearly square but slightly wider than tall, placed in the lower middle. It remains entirely on the flat front face inside the side seams.
Sticker: matte neutral white, thin pressure-sensitive adhesive paper with very fine realistic paper grain, extremely slight natural bow and shallow variation following the broad foil volume. Subtle real compressed edge contact, almost flush to foil. Tiny soft contact occlusion along only the relevant edge, not a drop shadow. Just a hint of a broad soft crease transmitted from the foil beneath; the central printing area remains mostly flat and clean. Corners nearly square with a tiny practical cut radius. Never tan, beige, yellow, glossy, thick, heavily crumpled or curled.
Text: NONE. The whole sticker is blank. No letters, logos, barcode, QR code, numbers, border, printed graphics or watermark anywhere.
Background: genuinely transparent alpha outside the bag. No white/grey background, checkerboard, pedestal, prop, floor or cast shadow outside the pouch. Preserve clean photographic cutout edges.
Change only the added white adhesive paper sticker and any tiny physically necessary contact shading. Keep all other bag details unchanged.
```
