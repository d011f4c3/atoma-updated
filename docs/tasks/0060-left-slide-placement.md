# Task 0060 — Left-side slide selection test

Date: 2026-10-01
Status: Complete

## Approved scope

Create a separate test at `/selector-study/left` with Slides on the left product
stage and Tabs above the right information panel. Keep the adopted homepage
unchanged. Add a direct Left/Right comparison using the same mounted experience,
so selected matcha, quantity, reference and information view survive placement
and theme changes. Use Split Origins and the regular purchase experience.

On phones, retain a clear single-column product selector above the information
tabs. No duplicate hidden interactive controls. Keep the desktop material and
selectors visible while only the information panel scrolls. Preserve keyboard
access, purchase locks, availability and reduced-motion support.

No new dependencies, assets, product claims or commerce changes. No deployment.

## Validation

Check both placements/themes on desktop and mobile, loaded photographs, selection
and quantity continuity, no duplicate selectors, bounded desktop layout, all
information views and unchanged homepage defaults. Run `pnpm validate` and review
the final scoped diff. No live cart writes.

## Result and verification

The comparison opens with left placement in light mode. Its toolbar switches
Left/Right without replacing the shared product model; appearance controls retain
the study route. Both homepage routes retain their current right placement.
The user reviewed the left direction and responded positively.

Follow-up: reduce the left-placement paper label width by 10%, including reference
editing, while keeping its existing height-dependent containment and the regular
homepage sizing.

The product selector is one real set of controls, moved above the left material
stage on desktop and kept above the tabs on phones. Container-height adjustments
keep the paper label below the slides in short windows, including reference
editing. The separate study preserves the full site header and offers a link back
to the current homepage.

CUA review covered desktop at 1366×768 and 1366×700, compact desktop at 840×600,
and mobile at 320×740 in both themes. Confirmed one chooser, loaded photographs,
seven specifications, Origins and Shop access, no horizontal overflow, contained
desktop height, and retained product, quantity, reference and view while comparing
placements. Confirmed the regular homepage still uses right-side Slides/Tabs
without the study toolbar. No cart writes were performed.

`pnpm validate` passed formatting, ESLint, TypeScript, all 60 unit tests and the
production build. Reviewed scoped before/after diffs and preserved concurrent
Shop-study changes. `git diff --check` passed.
