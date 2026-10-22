# Task 0266 — A simpler wholesale store

Date: 2026-10-23
Status: Complete

## Owner direction

The latest wholesale page is still too text-heavy. Simplify shopping so the
catalog scales, while making the matcha appealing to wholesale buyers. The owner
subsequently requested `/new-wholesale` become `/wholesale` and replace the
current `/shop` destination in storefront navigation.

## Scope

- Lead with approved application imagery and a concise application, product name,
  code and sensory phrase. Keep complete product information in existing product
  pages and optional in-place learning, removing repeated origin copy and the
  duplicate View matcha action from each catalog card.
- Keep immediate desktop ordering with one price/format line, compact quantity
  and Add controls, and a total revealed when multiple units are selected.
  Unavailable single-format products get a clear unavailable action without
  an ineffective quantity form. Retain the focused mobile order disclosure.
- Give the Sample Set one prominent visual invitation beside the introduction.
  Sampling and application fit form the sales story; do not invent performance,
  supply, certification, price or provenance promises.
- Keep catalog-backed search and repeatable modules. Remove the redundant image
  mode control; approved applications are the default for known products, while
  future products retain only their published imagery, identity and offers.
- Adopt `/wholesale` as the canonical Wholesale destination. Redirect the old
  `/new-wholesale` path with query parameters intact. Preserve direct `/shop`
  product routes and keep the prior collection accessible independently.
- Retain exact format/quantity handoffs, cart guards, learning history/focus,
  themes, motion, localization and all factual boundaries.

Existing deleted study-route files in the working tree predate this task and
are outside its implementation.

## Verification

Use isolated catalog/cart browser fixtures with no real commerce writes. Cover
both themes, desktop and mobile, narrow enlarged Japanese, expanded catalogs,
search, old-route redirects, direct product and dialog return, retained orders,
unavailable formats, refresh/error/review/pending states. Run `pnpm validate` and
review the final diff. Evidence: `.local/wholesale-0266/`.

## Result

The store now leads with the approved tea, latte and recipe cutouts, one use
label and sensory phrase per product, and a single optional learning control.
Names and imagery still lead directly to canonical product pages. A compact
Sample Set invitation shares the introduction. The catalog remains driven by
published products and working name/code/application search.

Desktop buying retains a single format/price line and quantity/Add row; totals
appear when multiple units are selected. Unavailable single-format offers show
one status action. Mobile retains a single focused inline buyer. Product choices,
format rules, review/refresh guards and cart error ownership are unchanged.

The canonical header/footer and relevant storefront handoffs now use
`/wholesale`. `/new-wholesale` redirects with query values intact, and existing
product routes remain under `/shop/`. The new route participates in localized
metadata, theme-aware Origins return, canonical motion and checkout retry.

- `pnpm validate` passed: formatting, lint, types, 256 unit tests and build.
  The initial typecheck found stale generated validators for study routes already
  deleted before this task; those generated files were archived locally before
  successful regeneration. No deleted source routes were restored or modified.
- 20 isolated browser cases passed, including canonical navigation and legacy
  redirects, search, dialog/history/focus, exact product/format/quantity handoffs,
  pending/error/unavailable/review states, and ambiguous catalog guards.
- Desktop checks cover 1440×900 and 1280×720 in both themes. At 1280 px the
  complete Add action sits at y666–712. Mobile covers 390 px, 320 px, and Japanese
  with 200% text. A 12-product fixture at 1800 px wraps to three aligned rows.
- The live catalog page was opened read-only at `/wholesale` for review. Browser
  commerce tests intercepted every write; no real purchase or deployment ran.

Evidence: `.local/wholesale-0266/validate.log`,
`.local/wholesale-0266/browser-results.json`, with desktop/mobile and expanded
catalog screenshots under `tests/`, `refinements/` and `viewports/`.
