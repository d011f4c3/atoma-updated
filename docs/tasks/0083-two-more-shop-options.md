# Task 0083 — Two more Shop options

Date: 2026-10-05
Status: In progress

## Requested outcome

Add two more layout options to the existing `/shop-study` comparison:

- Format list: compact full-width radio rows align each format with its unit
  price, followed by quantity, total and the purchase action.
- Price first: the order total leads alongside the selected order, followed by
  compact format/quantity controls and a full-width purchase action.

Use the current small mono typography, quiet linework, both study themes and
shared selection/cart model. Retain all nine earlier layouts, Open checkout as
the saved study default, and Current refined on the homepage. Keep the current
header, left Slides, right Tabs, references and mounted material scene.

Preserve canonical format prices, quantities, availability, one-time purchase,
disabled subscriptions, pending locks, errors and checkout gates. No new
dependencies, catalog facts, live commerce writes or deployment.

## Verification

Extend existing mocked Shop study checks across all eleven options. Review new
options in both themes at desktop and 320px mobile, native radio keyboard access,
single-format/unavailable states, first-view purchase access, exact order totals,
retained state/renderer and guarded cart behavior. Run `pnpm validate`, inspect
screenshots and review the scoped diff.
