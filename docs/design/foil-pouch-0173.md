# Blank foil pouch — Task 0173

Generated with the built-in ImageGen tool from the existing approved foil-trio study. This is an illustrative packaging asset; the sticker is rendered separately in the site so its content remains selectable and interactive.

- Final asset: `public/images/samples/foil-pouch-blank.png`
- Source reference retained: `public/images/samples/study/foil-trio.png`
- Dimensions: 1024 × 1536 px, RGBA PNG with generated alpha preserved.
- Visible bounds at alpha > 128: left 34, top 106, right 990, bottom 1512 (exclusive).
- Primary solid bounds at alpha > 250: left 36, top 109, right 989, bottom 1509 (exclusive).
- The image has no printed label, product facts, QR or brand marks. The body is front-facing with textured heat-sealed edges and two tear notches.

## Final prompt

Use case: precise-object-edit / background-extraction. Asset type: isolated silver foil pouch for an interactive web packaging mockup. Input image is the edit target and material reference. Primary request: isolate and recreate only the FRONT CENTRAL pouch from the reference, perfectly straight and front-facing; remove the cream paper sticker entirely and reconstruct the same natural silver foil beneath it. Keep the realistic silvery aluminum foil, softly crumpled highlights, heat-sealed textured top/bottom/side borders and two tiny tear notches. A single closed flat sample sachet only, rectangular portrait shape about 2:3 width:height, all four corners visible. Seam edges vertical and parallel, no tilt or perspective skew. Small controlled studio highlights, neutral silver, subtly varied folded foil with a relatively calm center so a live label can sit there later. Compose the whole pouch filling almost the entire portrait canvas with only a narrow 3–5% transparent margin. Absolutely no other pouches, no sticker, no text, no mark, no logos, no QR, no floor, no background, no scene or cast shadow. Genuine transparent alpha background around the object. Preserve the front central pouch material character, proportions and sealed construction.

## Verification

Visually inspected the generated result. Pillow inspection confirms RGBA with a transparent exterior (corner alpha 0) and opaque-looking foil (center alpha 253). No background removal, color adjustment or raster editing was applied after generation; the image was copied into the workspace unchanged.
