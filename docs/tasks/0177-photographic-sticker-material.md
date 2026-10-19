# 0177 — Photographic sticker material and print refinement

Status: Implemented and verified locally.

The owner asks for more realistic stickers and improvements to both their
design and effect. Keep the approved silver bag, neutral white sticker,
three-bag arrangement, equal mirrored outer angles and factual label content.

Replace the flat CSS paper rectangle on the bag with a photographic blank
adhesive sticker, edited from the existing hero bag using the built-in
ImageGen tool. Its paper texture, contact edge, shallow bow and soft lighting
should belong to the same photograph as the foil. Retain independent editable
ink and the real QR; the expanded label reader remains crisp and accessible.

Refine the print with smaller regular mono type, compact information rows,
fewer rules and a quieter footer. Avoid fabricated batch data, supplier facts
or production/compliance claims. Do not change the initial hero, commerce,
navigation or surrounding page layout.

The new photographed sticker is `public/images/samples/foil-pouch-sticker-v2.png`.
Its original RGBA output is preserved; source, exact prompt and inspected bounds
are recorded in `docs/design/foil-sticker-surface-0177.md`. Attached print uses
transparent backgrounds and multiply blending; the separate readable label
retains a white surface. Its compact layout stays within the photographic
paper bounds. The 6-degree mirrored outer rotations are unchanged.

The owner explicitly praised the click-to-inspect pouch popup during this pass;
that interaction and composition are retained.

Verification:

- Reviewed the actual composite on the homepage and `/samples`, including both
  site themes at 1280 × 720. Paper folds and edges remain visible around the
  independent print; all three physical labels retain their own product data.
- Reviewed the reader at 320 × 740 with no page/dialog horizontal overflow.
  The printed surface and readable label both fit their content without
  vertical overflow. Label switching, QR/product mapping, Escape and focus
  return work; native dialog and reduced-motion behavior remain unchanged.
- `pnpm validate` passes formatting, lint, strict types, all 192 tests and the
  production build. Final scoped source and whitespace review passed.
- Evidence: `.local/stickers-0177/`.
