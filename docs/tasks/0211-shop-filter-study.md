# Task 0211 — Shop category filter exploration

Date: 2026-10-19

## Request and scope

Explore ways to filter the matcha collection at the top of Shop. Start with
category and leave a clear visual path for future taste, region and other
dimensions. Build a separate `/shop-filter-study`; adoption is a later choice.

Compare Index, Category tiles and Filter bar in the existing Shop composition,
with its actual product cards and both palettes. Support narrow phones and
desktop. Retain the existing canonical Shop and prior studies.

## Design and behavior

- Index uses a fine underline and a quiet category/count row.
- Category tiles pair the established category with its preparation use.
- Filter bar keeps the current choice compact and opens an inline category
  panel, with room for additional dimensions alongside it.
- All matcha, Ceremonial, Barista and Culinary filter the returned matcha
  catalog through exact reviewed handle identities. Counts refer to products,
  including unavailable products; unknown handles remain in All matcha.
- The separate Sample Set entry remains available for any category. Filtering
  preserves product cards, saved matcha, catalog order and commerce behavior.
- A study-only future toggle shows noninteractive Taste and Region placements.
  It adds no sensory/provenance classifications or catalog fields.
- Direction, category, palette and future preview are shareable in the URL.
  Study palette changes do not overwrite the storefront preference.

No dependencies, new commerce operations, production mutations or deployment.

## Verification

- All 18 browser scenarios pass: nine each in Chromium and WebKit, covering
  all three directions at 320px, 390px and 1440px in both themes. Reviewed
  full-page and viewport captures for hierarchy, touch targets and wrapping.
- Verified exact category identities and counts, unknown-product handling,
  mounted card continuity, product links, theme-cookie isolation, shareable URL
  restoration, keyboard activation, clear/Escape focus return and reduced motion.
- Held loading, failed loading, retry and empty-category recovery pass. The
  canonical Shop retains its existing content and controls. English study-only
  status copy identifies its language under a Japanese storefront locale.
- Four new unit cases cover known/unknown identities, immutable catalog order,
  unavailable products and product counts after Sample Set separation.
- `pnpm validate` passes formatting, lint, strict TypeScript, all 217 unit tests
  and the production build. Final source and whitespace checks pass.
- Browser harness: `tests/shop-filter-study.mjs`. Evidence and validation log:
  `.local/shop-filter-study-0211/`. No deployment or production writes.
