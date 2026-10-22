# Task 0264 — A new wholesale library study

Date: 2026-10-23
Status: Complete — subsequent shopping refinements continue in Task 0265

## Request and evidence

The owner requests a complete buying-experience study at `/new-wholesale`, with
related but separately designed desktop and mobile presentations. The current
Wholesale route remains intact. Avoid temporary filters while providing a place
for search and future filtering as the range becomes a larger matcha library.

Read the September direction synthesis, October feedback and original client
Shop/IA direction. The source calls for comparison without marketplace noise,
filters only when they reduce a real choice, visible product differences and
purchase information without hover. The October UX audit flags non-working
“Coming soon” filters. This study supersedes Task 0220's placeholders only at
the new route; it does not change `/shop`.

## Design and behavior

- One collection built from the live catalog, excluding the Sample Set. Desktop
  uses compact horizontal rows with material, application, profile, provenance,
  format, unit price, quantity, total and Add to cart visible together. Mobile
  uses concise image/identity/price entries with one inline ordering area open at
  a time. Detailed profiles and preparation are optional learning dialogs.
- A permanent toolbar supports working name/code/application search and a
  material/application image switch. Future verified facets can join this same
  surface when the expanded range warrants them; no dead controls or invented
  classifications appear now.
- Opening a known matcha preserves collection context, query, scroll and focus.
  URL-owned learning dialogs, independent product quantities/formats,
  Back/Forward, direct links and cart behavior use the established commerce
  machinery. A single catalog owner supplies all buyers; row selection survives
  search, image changes and route returns.
- Unknown future catalog products remain visible and searchable with published
  identity/offers and canonical product routes. They receive no guessed profiles
  or origin claims. Ambiguous duplicate handles cannot expose purchase offers.
- Wazuka remains the supported ceremonial origin; UJI is explicitly a tea
  designation for Barista/Culinary, never an inferred growing municipality.
  Editorial profiles remain separate from measured lot facts. Live catalog
  values own prices, formats, availability and quantity rules.
- Keep a single secondary Sample Set entrance, shared navigation/cart/footer,
  IBM Plex Mono, both current palettes, readable localized copy and reduced motion.
  This is a noindex local study with no canonical navigation adoption.

The owner subsequently rejected the original cards for separating product
information from shopping and requested a complete page redesign. The study
therefore uses direct desktop ordering rather than card-to-popup purchase.
Browser inspection found the owner was still at `/shop`; the finished study is
opened at `/new-wholesale`, preserving the explicit separate-study request.

## Verification

Use isolated browser fixtures that block real commerce writes. Review desktop
and phone screenshots in both themes; verify real search, future-product rows,
empty/error/loading and unavailable states, product selection and dismissal,
history/focus/scroll retention, quantities, pending-order guards and enlarged
Japanese text. Compare the existing `/shop` with its baseline. Run meaningful
helper tests and `pnpm validate`, then review the final diff.

Local evidence: `.local/wholesale-0264/`. No deployment or production changes.

Completed verification: all 16 isolated browser cases passed, including 320 px
Japanese at 200% text, quantity/format rules, exact mock payloads, search/history/
focus, pending guards and future/ambiguous products. No real commerce writes.
`pnpm validate` passed (255 unit tests, typecheck, lint, formatting and build).
Canonical `/shop` remained pixel-identical at 1440/390 in both themes. The live
browser was opened to `/new-wholesale` and its actual catalog presentation verified.
