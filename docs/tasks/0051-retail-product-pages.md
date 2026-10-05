# Task 0051 — Clickable shop and retail product pages

Date: 2026-10-01
Status: Complete

Make the shop collection items clickable and build a clean, conventional retail
experience with the same product information available on the homepage.

Use linked collection cards and dedicated product routes at `/shop/[handle]`
and `/shop/light/[handle]`. Present powder photography, product identity, price,
format, quantity and a clear purchase action first. Follow with the canonical
overview, seven sample specifications and explanations, preparation guidance,
product records, origins and related field notes. Preserve the approved mono
typography, restrained mineral palette and both themes. Mobile uses a normal
vertical collection and product flow.

Reuse the reviewed catalog/selection/cart contracts and real availability,
quantity and pricing rules. Unknown handles must never silently purchase a
different product. Keep errors retryable and state intact across appearance
changes and Origins return. Keep unpublished provenance explicit; imagery
does not establish a product origin. No new assets, dependencies, fake claims,
production writes or deployment. Homepage and selector study remain intact.

Verify card and direct-route entry, keyboard/mobile usability, content parity,
availability and quantity boundaries, pending locks, exact mocked cart data,
theme continuity, Origins return, errors and unknown products. Review both
themes at desktop and phone sizes, run `pnpm validate`, and review final diff.

## Delivered and verified

The collection uses whole-card native links, visible available-variant pricing,
and a vertical mobile layout. Each product has a dedicated page in both themes
with a sticky desktop powder photograph, format and quantity controls, live
total, purchase options and Add to cart. The full overview and specifications,
property explanations, preparation guidance, product details and origin/field
connections use the same canonical content and records as the homepage.

The retail pages retain the shared typography and palette. A scoped light
gradient floor keeps copy and prices readable while scrolling longer pages.
Information panels inherit the same ink and muted colors. Unknown handles show
a clear missing-product state and cannot purchase a fallback selection.

Six mocked browser cases passed, covering dark/light collection and direct
entry, reload, theme/history continuity, Origins return, related products,
keyboard/mobile entry, format and quantity boundaries, pending locks, exact
cart payload, unavailable/unknown products and retry. No live commerce writes
were used. The test's pending-state locator was corrected to follow the
button's Adding… label, then both affected cases passed.

Visual review covered both themes at 1440×900, 1366×768, 390×844 and 320×700.
Purchase actions fit on ordinary laptop screens, all seven specifications and
the full disclosures remain readable, and images/shadows stay inside their
frames. Final narrow light captures confirm legible prices and body text near
the viewport floor. Captures: `.local/qa/retail-product-visual/`.

Scoped source and whitespace review passed. `pnpm validate` passes formatting,
ESLint, strict TypeScript, 56 unit tests and the production build, including
both new dynamic product routes. The live collection was opened in Chrome
and its three real catalog links verified. Homepage and selector study were
not changed. No new dependency, generated asset or deployment.
