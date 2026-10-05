# Task 0064 — Section navigation in the current storefront

Date: 2026-10-01
Status: Complete

## Requested outcome

Update `/selector-study` to use the current storefront composition, following
the Shop study update. Left-side Slides are final: retain that product chooser
and remove its experimental style control from the toolbar. Compare only the
right-side section navigation: Text, Tabs, Segmented, Menu, Brackets and Indicator.
Open with Tabs, matching the current homepage.

Show the full current site header, shared Split Origins, inline Overview details
and regular purchase view. Use the current theme tokens and a compact, single
comparison control. Keep the configurator mounted so product, format, quantity,
reference, active view, material and theme survive changes in navigation style.

Preserve the current homepage, Shop study and separate placement comparison.
Retain other selector implementations for saved concepts; this change removes
their controls only from the updated comparison. No new product claims, assets,
dependencies, commerce rules or deployment.

## Verification

Review all six navigation styles on desktop and mobile in both themes, including
loaded left Slides, seven visible Specifications, Overview details, Split Origins
and Shop access. Check keyboard/menu focus, retained order/reference/material,
pending cart locks and exact mocked cart payloads. Confirm unchanged default
routes. Run `pnpm validate` and inspect the scoped changes and `git diff --check`.
No live cart writes.

## Result and verification

The study opens with Tabs and one Section navigation control. Final Slides stay
on the left throughout all comparisons. The full storefront header, current
theme tokens, Split Origins and Overview details now match the homepage.
The study index description reflects the narrower exploration. Existing product
selector implementations and the separate placement study remain unchanged.

All three isolated browser cases pass: desktop and mobile cycle all six styles
and both themes, and the default-route case preserves the current homepage and
Concept 02. Verified one fixed product chooser, loaded imagery, seven-row
Specifications fit, navigation/menu keyboard behavior, native dialog focus
restoration, product/format/quantity/reference and renderer continuity, Split
Origins return, availability, pending locks and exact mocked cart payloads.
Style changes keep the catalog/model mounted; opening the independent Origins
reader can load its own catalog. No live cart writes occurred.

Visual review covers six styles in both themes at 1366×768 and 320×700, with
Overview, Specifications and Shop captures in
`.local/qa/selector-study-storefront/`. All seven specification rows fit initially
without horizontal overflow. Deeper Overview details and the regular mobile Shop
use natural scrolling, matching the current storefront.

`pnpm validate` passed formatting, ESLint, TypeScript, all 60 unit tests and the
production build. Final test edits passed scoped formatting and ESLint. Reviewed
the scoped source changes and confirmed `git diff --check` passes.
