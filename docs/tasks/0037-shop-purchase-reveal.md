# Task 0037 — Compact shop cards with a purchase reveal

Date: 2026-09-30
Status: Complete

The owner finds the dedicated shop cards too tall and asks price and Add to cart
to appear in a panel rising from the bottom on hover. Shorten both theme routes'
cards around the material, product name and short accent. Group existing format,
quantity, purchase type, total and Add to cart in the bottom reveal, retaining
all commerce state and guards. Keep actual availability visible at rest.

Fine-pointer hover opens the reveal without changing card height. A native
Choose button provides keyboard and touch entry; a close control and Escape
return to it. Keep controls mounted but inert while closed. Preserve selections,
cart return focus, unavailable subscriptions and the mobile swipe collection.
Do not add a dependency, remote setting, API or deployment.

Check desktop card fit, hover/leave, keyboard entry/Escape, touch open/close,
quantity continuity, both themes, reduced motion and narrow screens. Adapt the
shop regressions, run `pnpm validate` and review the scoped diff.

## Result and verification

Cards now have a viewport-aware fixed height. Format, quantity, price and the
primary purchase action rise within the card; opening the panel does not change
its height. Secondary purchase-type choices use a native Purchase options
disclosure. Closed panels stay mounted and inert so selection state is retained.
A pending Add keeps the panel available for the cart's return focus.

CUA reviewed dark/light desktop at 1440×900 and 1366×768, an 800px narrow desktop,
and 390px/320px phone widths. Cards and purchase actions fit their panels without
horizontal overflow. Verified hover/leave, keyboard Enter/Escape and focus return,
touch open/close, nested material-detail return, unavailable purchase controls,
reduced motion and quantity retention after dismissal and carousel selection.
No live cart writes were made.

Updated dedicated-shop browser regressions for panel entry, compact card height,
hover re-entry, keyboard/touch dismissal, preserved selections, optional purchase
choices and pending dismissal/cart focus. Syntax, formatting and lint checks
passed; the standalone browser harness was not run. Reviewed scoped diffs and
received an independent source audit, addressing its focus and narrow-layout
findings.

`pnpm validate` passed: formatting, ESLint, TypeScript, all 26 unit tests and the
production build. An earlier attempt encountered a missing stylesheet and
formatting in concurrently edited homepage concepts; those files were completed
by that work before the successful final gate. No unrelated code was changed.
