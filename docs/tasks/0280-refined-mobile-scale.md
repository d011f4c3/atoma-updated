# Task 0280 — Refined mobile scale

Date: 2026-10-23
Status: Complete

## Owner direction

Everything on mobile feels about 10% too large. Refine the overall scale across
the storefront, retaining the simpler visual shopping journey from Tasks 0278
and 0279.

## Scope

- Refine canonical phone typography, image frames and larger spaces together.
  Use 15 px reading/action text, headings about 10% smaller and modestly smaller
  objects. The owner's current direction supersedes the earlier blanket 16 px
  prose minimum. Keep existing 14 px actions and small labels at their current
  size, editable inputs/selects at 16 px, touch targets at least 44 px and
  rem-based enlarged-text support.
- Apply consistent roles to Home, Wholesale, Samples, product pages, popups,
  in-place Sample Set learning and shared surfaces. Existing token consumers
  also carry the reading scale into canonical About and Origins.
- Preserve all content, visible sample credit, whole hero objects, both hero
  CTAs, responsive reflow, exact purchasing selections, focus/scroll/history,
  commerce guards, current animation and reduced-motion fallbacks.
- Scope changes to canonical mobile surfaces at 760 px and below. Preserve
  desktop and saved studies; do not change the root font size or use visual
  scaling transforms. No new assets, dependencies, backend writes or deployment.

## Verification

Capture before/after mobile Home, Wholesale and Samples in both themes, plus
shared navigation/cart and product learning. Compare unchanged desktop geometry
and saved studies. Check usable phone heights, 320 px, enlarged and localized
text, readable inputs, comfortable controls, sample credit and commerce/return
behavior using isolated fixtures. Run focused browser suites, `pnpm validate`
and final diff review. Evidence: `.local/mobile-scale-0280/`.

## Delivered

Canonical mobile reading type is 15 px, with reduced display headings and
image frames across Home, Wholesale, Samples, product pages and product learning.
Shared tokens carry the same reading scale into About, Origins and field notes.
Existing 14 px actions and smaller metadata remain steady. Native inputs and
selects retain 16 px type; controls remain at least 44 px tall.

The mobile header is 58 px, hero and section visuals are smaller, and large
card/section spaces have been reduced without compressing the composition.
Existing enlarged-text and short-landscape rules remain intact. All content,
sample credit, exact product links, motion and commerce state are preserved.

## Verified

- 31 focused browser cases passed for Home, Wholesale, Samples, retail and
  popups, plus the mobile Home and Wholesale motion cases. Both themes, short
  phone heights, enlarged Japanese text, exact orders and return state passed.
- Reviewed Chrome mobile screenshots across the main storefront routes,
  navigation/cart and product learning. Home, Wholesale and Samples desktop
  geometry matched their baselines. This pass did not repeat WebKit coverage.
- The subsequent owner review exposed missed in-place Sample Set presentation
  and product complexity. Task 0281 records and corrects those gaps explicitly.
- Final `pnpm validate` passes formatting, lint, types, all 256 unit tests and
  the production build. No deployment or live commerce writes ran.
