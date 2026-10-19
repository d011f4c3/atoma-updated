# Task 0150 — Samples after Explore and dedicated page studies

Date: 2026-10-17
Status: Presentation complete; actual Sample Set offer pending

## Authority

The owner requests sample presentation and a dedicated `/samples` page. Their
latest correction places samples inside the experience after clicking Explore
matcha, with no sample promotion on the opening homepage. Compare several
placements there and, in a separate study, easier-to-view `/samples` layouts.
This supersedes the earlier deferral of sample presentation in Task 0111 and
the initial interpretation of sample-led opening homepage alternatives.
The client feedback is evidence for the set contents, not authorization for its
illustrative price, incentives, fulfillment terms or a production change.

## Confirmed content and commerce boundary

One Sample Set contains 30 g each of Ceremonial, Barista and Culinary Matcha;
90 g is tea content, not packed shipping weight. Re-read the original feedback
document and the 6 October synthesis. JPY 4,800 and JPY 1,000 credit remain
reference ideas. Do not publish them as a price or incentive.

The current published catalog contains only the existing three 1 kg products.
There is no verified Sample Set product or variant mapping. Prepare the purchase
flow against an explicit, fail-closed offer reference, current catalog prices
and quantity rules, and the existing cart. Show a truthful not-yet-orderable
state until the actual offer is supplied. Never assemble a sample set from
three 1 kg offers. No Shopify write, new dependency, checkout gate change,
subscription, shipping promise or deployment is authorized here.

## Scope

- Add a compact sample entrance only after Explore matcha opens the current
  homepage selection experience. Keep the opening homepage free of samples.
- Compare four placements at `/samples-study` inside the opened configurator.
  Preserve the mounted material, product, selected information view, format,
  quantity and reference while changing study options and appearance.
- Add `/samples` with an image-led three-part contents view, one-set purchase
  controls, truthful availability and a route onward to the 1 kg collection.
- Compare simpler dedicated page layouts at `/samples-page-study`, using one
  shared purchase implementation and the same confirmed contents. Keep the
  canonical page available while the owner compares alternatives.
- Reuse existing matcha photography, type scale, themes, cart, locale controls
  and product identities. Do not invent sample packaging imagery.
- Provide discoverable Samples links from Shop, opened selection and canonical
  interior-page navigation/footer. Keep older design studies intact.

## Verification

Test exact contents and totals, exact offer/variant resolution, unavailable and
failed-catalog states, quantity and cart guards, navigation, mounted state,
mobile/desktop, four canonical locales, both themes, keyboard access, reduced
motion, no overflow and image loading. Visually review every study option and
the canonical page. Run the smallest relevant checks, `pnpm validate`, and
review the final diff. Record missing commercial inputs explicitly.

## Result

The opening homepage is restored. A compact Sample Set entrance appears only
inside the opened matcha experience. `/samples-study` compares Selection rail,
Sample tile, Panel note and Workspace bar; changing options keeps the mounted
material and selected product, information tab and quantity. Earlier study URLs
resolve to the revised options.

`/samples` presents the confirmed three 30 g portions and one guarded purchase
flow. `/samples-page-study` compares At a glance, Application rows and Set folio
using that same purchase implementation. All display authoritative unavailable
states until an actual reviewed offer exists; no illustrative price is shown.
Canonical content is available in all four storefront languages. Themes and
selection survive navigation between the homepage and samples.

- Post-Explore study: 32 placement/viewport/theme combinations plus opening,
  closing and selection continuity checks.
- Dedicated page study: 24 layout/viewport/theme combinations, nine localized
  mobile combinations, keyboard access, retry focus and query fallbacks.
- Canonical samples: 28 responsive, theme, locale, catalog failure, navigation
  and no-JavaScript scenarios. Mocked browser commerce writes are blocked.
- `pnpm validate` passes formatting, lint, strict types, 142 unit tests and the
  production build. Scoped source and whitespace diffs reviewed.
- Visual evidence is local in `.local/samples-post-explore/browser/`,
  `.local/samples-0151/browser/` and `.local/samples-0150/browser/`.

Commercial setup remains separate: a verified Sample Set product/variant,
approved price, shipping and dispatch information are still required before
ordering can open. No production mutation or deployment was performed.
