# 0175 — Hero bag photograph and finer sample stickers

Status: Implemented and verified locally.

The owner requests another visual pass: use the silver bag image from the hero
with an independent sticker layer, arrange three in a row, and reduce the
sticker, logo, typography weight/scale and QR size.

Reuse the exact existing hero image; no generated replacement or new packaging
facts. Replace the overlapping sample fan with three upright, evenly spaced
bags. Use a smaller horizontal cream sticker with restrained regular-weight
type, existing product names/codes/applications, 30 g net content and the same
verified QR assets. Keep each label inspectable, with mobile, keyboard,
reduced-motion and dismissal behavior intact. Apply consistently to the sample
view on the homepage, `/samples` and the existing foil imagery study. Preserve
commerce state, other imagery alternatives and the initial hero interaction.

The exact hero source is `public/images/product-exploration/silver-bag-hero-v3.png`.
Its original alpha and photography are unchanged; the CSS wrapper aligns to its
visible bounds. See `docs/references/hero-bag-photography.md` for existing asset
provenance. The live label is 66% of the visible bag width, with a short horizontal
composition. The wordmark is 5.2% of label width, product title 6.2%, both weight
400, and QR column 22% of the inner content grid. The previous large square
label, heavy uppercase product line and fan overlap are removed.

Verification:

- Browser reviewed homepage sample view and `/samples` at desktop 1280 × 720,
  mobile 390 × 844 and label reader at 320 × 740. Three bags fit separately on
  one baseline, with no page or dialog horizontal overflow.
- Verified label switching updates QR and product destination, and Escape/Close
  restores the opening control. Independent inspection still leaves the set
  purchase unchanged. Existing QR assets retain their quiet zones; direct
  product links remain available alongside the compact code.
- Read-only review checked crop bounds, row spacing, hover clearance,
  reduced-motion rules, dialog lifecycle and unchanged commerce boundaries.
- `pnpm validate` passes formatting, lint, strict types, all 189 unit tests and
  the production build. Final diff whitespace review passes.
- Evidence: `.local/hero-labels-0175/`.
