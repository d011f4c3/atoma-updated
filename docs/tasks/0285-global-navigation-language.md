# Task 0285 — Global navigation language selector

Date: 2026-10-23
Status: In progress

## Owner direction

Language selection must be available globally in navigation, not only in the
Sample Set content. It must translate the pages as well.

## Scope

Expose the existing language selector beside the shared navigation theme control
on desktop and in mobile menus. Use the shared locale provider and four existing
languages so page content changes in place and the selected language persists
across canonical routes and reloads. Preserve theme, destination, product/order
state, navigation guards and the existing footer controls.

## Verification

Check the header selector and translated content on Home, Wholesale, Samples,
About, Origins and product pages. Inspect narrow desktop and mobile fit, all four
languages, cookie persistence and retained URL/destination/order state using
isolated fixtures. Run `pnpm validate` and review the diff.

Evidence: `.local/global-language-0285/`.
