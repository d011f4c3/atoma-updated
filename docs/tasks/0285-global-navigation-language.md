# Task 0285 — Global navigation language selector

Date: 2026-10-23
Status: Complete

## Owner direction

Language selection must be available globally in navigation, not only in the
Sample Set content. It must translate the pages as well.

## Scope

Expose the existing language selector beside the shared navigation theme control
on desktop and in mobile menus. Use the shared locale provider and four existing
languages so page content changes in place and the selected language persists
across canonical routes and reloads. Preserve theme, destination, product/order
state, navigation guards and footer theme controls. The owner's follow-up requires
one language selector per canonical page, in global navigation only; remove the
Samples content controls and suppress language selectors in other canonical
page/footer theme controls. Independent study controls remain unchanged.

## Verification

Check the header selector and translated content on Home, Wholesale, Samples,
About, Origins and product pages. Inspect narrow desktop and mobile fit, all four
languages, cookie persistence and retained URL/destination/order state using
isolated fixtures. Run `pnpm validate` and review the diff.

Evidence: `.local/global-language-0285/`.

## Result

The shared language selector is visible on desktop and in the compact menu. The
menu now begins below 1024 px to prevent translated navigation overlapping the
brand. Existing four-language content and preference persistence are reused.

Removed the Samples inline appearance group. Canonical page/footer theme controls
retain theme switching without repeating language selection. A focused final check
passes on Home, Wholesale, Samples, About, Origins and product pages at 1440 and
320 px: exactly one language selector, located in navigation, with Japanese
selection working in place and no route changes or commerce writes.

The earlier route matrix verified translated headings/supporting text in all four
languages. Full validation passed after the navigation breakpoint change. Per the
owner's request, the final duplicate-control change received only scoped formatting,
diff and control checks rather than another broad validation pass. No deployment.
