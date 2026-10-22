# Task 0265 — A clearer complete shopping journey

Date: 2026-10-23
Status: Complete

## Owner direction

The canonical product page `/shop/jmm-storefront-test-matcha` feels oversized,
requires scrolling to Add to cart, and makes learning laborious. Learning should
be enjoyable and easy. The owner also requests another pass on the new Wholesale
study for future catalog scale, restores direct access to product pages, and asks
that shopping match the refinement of the rest of the site.

## Scope

- Canonical product pages: compact approved application/material imagery,
  identity and complete purchase controls in the first normal desktop/phone
  viewport. Keep one existing selection/cart owner. Profile learning must no
  longer push ordering below a long specification list.
- One focused Profile / Preparation / Origin learning area. Show the authored
  sensory values in a compact interactive layout, with an explanation selected
  in place. Preserve preparation, provenance context, product records and field
  notes without repeating the same information in multiple accordions.
- Continue `/new-wholesale` as the requested separate study. Use compact reusable
  catalog modules for desktop and concise mobile entries; retain visible prices,
  real buying, working search and room for future evidenced facets. Product names,
  imagery and explicit product links lead to canonical pages; optional quick
  learning is secondary, never the only route to the product.
- Preserve current palettes, IBM Plex Mono, authored motion/reduced motion,
  exact product/format identity, stock/quantity/selling-plan/review guards,
  retained orders, cart contracts, localized content and Origins return state.
  No invented preparation measures, origins, grower identities or lot facts.
  Earlier saved studies and canonical `/shop` remain independent.

## Verification

Use isolated catalog/cart fixtures that block all real commerce writes. Inspect
1440×900, 1280×720, 390×844 and 320 px with enlarged localized text. Check initial
Add reachability, direct product navigation, keyboard/touch learning, theme and
Origins return, quantity/format rules, refresh/unavailable/review/unknown-product
states and pending guards. Update obsolete tests that require profile before
purchasing or the removed nested accordion structure. Run `pnpm validate`.

Baseline and final evidence: `.local/product-0265/` and `.local/wholesale-0264/`.

## Result and validation

The wholesale study now uses three compact open product modules on desktop,
with four columns for larger catalogs on wide displays. A 12-product fixture
verified future growth. Images, names and View matcha actions link to canonical
product pages; Quick view remains secondary. Format/quantity handoff and browser
Back preserve the chosen order and collection query. Mobile keeps one focused
inline buyer and collapses repeated price information while it is open.

Canonical product pages now use a contained approved application/material visual
beside the complete order. Add to cart is at y429–485 on desktop and y427–483 on
390 px mobile, compared with the former desktop y1126–1182. The mobile image sits
beside identity rather than taking a full-width photograph above purchasing.
Desktop purchase remains reachable beside the learning area. Interactive tasting
values explain one attribute in place, with independent Preparation and Origin
views and a single copy of the product's published record.

- `pnpm validate` passed: formatting, lint, types, all 255 unit tests and build.
- 17 Wholesale browser cases passed, including direct canonical links/Back,
  selection handoff, mock purchase payloads, unavailable/refresh/pending/error
  guards, future and ambiguous catalog records, search and dialog history.
- 9 canonical product browser cases passed, including initial Add reachability
  at 1440×900, 1280×720 and 390×844 in both themes; keyboard and touch learning
  without scroll jumps; Origins focus/scroll return; exact 1 kg/quantity adapter
  payloads; unknown/unavailable/missing-format guards; and 320 px Japanese with
  200% text and a readable unbroken total.
- Final live catalog presentation was inspected in the user's browser, with
  direct links to the study and Culinary product page open for review. No real
  commerce writes, deployment or changes to canonical `/shop` were made.

Reports: `.local/product-0265/browser-results.json`,
`.local/wholesale-0264/grid-browser-results.json`, and
`.local/product-0265/validate.log`. Legacy learning assertions were updated for
the new structure; the dedicated exact-route suites provide the browser result.
