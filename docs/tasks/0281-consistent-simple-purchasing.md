# Task 0281 — Consistent, simple purchasing

Date: 2026-10-23
Status: Complete

## Owner direction and audit

The owner found duplicate Sample Set prices despite the earlier instruction to
show the price once, questioned the review, and identified a complicated mobile
product page with repeated prices, purchase choices and dense profile content.

The earlier Sample Set pass applied its single-quantity price treatment and
visible credit to `/samples` but missed the separate Home `/?view=samples`
purchase entry. That entry also retained the inspection prompt and older sizing.
The mobile scale review covered the main routes without exercising that view.

The product page's Purchase options indicator always displayed `+`, including
when expanded. Static source did not establish that closed details leaked
content; the incorrect indicator made its state ambiguous. Product purchase
labels also retained periodic scrambling.

## Scope

- Explicit canonical Sample Set presentation shared by both entry points. Show
  one live amount, with a small Per set label at one and Total above one. Never
  show a stale secondary amount during refresh. Preserve exact variant prices,
  quantities, minimum/increment rules, format choices and purchase guards.
- Show the existing approved credit, eligibility/minimum and emailed-code copy
  directly beside buying. Remove the canonical inspection prompt while retaining
  pouch interactions. Hide the redundant mobile count line and refine the missed
  entry sizing. Preserve saved-study rendering.
- Simplify mobile product buying to identity, one updating price, quantity and
  Add to cart. Use one compact image switch and reveal the existing product
  reader from Product details. Keep desktop learning visible.
- Give Purchase options a truthful expanded indicator and closed-content rule.
  Show an options disclosure only when a real plan or retained selection exists;
  otherwise show quiet One-time purchase text. Keep labels settled, verified
  selling plans and unavailable-selection recovery intact.
- No invented commercial facts, backend changes, deployment or live orders.

## Verification

Test both canonical sample entry points on desktop/mobile at quantities one and
two, count visible price amounts, check visible credit and destination-review /
refresh / pending guards. Review mobile product initial state, image switching,
optional learning, purchase-option state, exact quantity/format handoff,
unavailable selections, localization and enlarged text. Inspect screenshots of
the actual purchase regions. Run focused browser tests and full validation.

Evidence: `.local/mobile-scale-0280/` and `.local/simple-purchasing-0281/`.

## Verified

- 12 targeted Sample Set, commerce retry and Home cases pass. Both entry points
  show one accurate price at quantities one and two on desktop and mobile,
  including country-confirmation states. Visible credit, prompt removal,
  refreshed currency/quantity, pending guards and pouch interaction pass.
- All 11 retail cases pass, including the simple mobile initial view, one
  updated amount, image switching, optional learning with retained state,
  real-plan selection and correct disclosure indicators, unavailable selections,
  desktop behavior, Japanese enlarged text and exact purchase guards.
- Inspected the actual mobile Sample Set purchase region and product screens
  at quantities one and two. Product buying is clear before optional details.
- `pnpm validate` passes formatting, lint, types, all 256 unit tests and build.
  Final diff checks pass. All fixture commerce writes were intercepted.
- The optional legacy `/samples-mobile-study` recovery check could not start
  because that archived route is absent and returns 404; current canonical
  recovery checks pass. No archived route was restored and no deployment ran.
