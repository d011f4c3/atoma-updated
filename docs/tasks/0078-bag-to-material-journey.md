# Task 0078 — Bag, material, purchase

## Approved brief

Show the silver bag in the opening hero. Explore matcha reveals powder; Shop
brings the bag back beside the powder. Smooth the transitions between those
states, which the owner finds glitchy. Apply to the adopted homepage and shared
product exploration, retaining the latest mobile scale and typography.

## Scope

- Reuse the silver bag and live label, populated from the current selection.
- Use a coordinated bag-to-powder dissolve, with destination readiness and
  reduced-motion support. Preserve the original tray studies.
- Keep the selection scene mounted; animate powder positioning and bag reveal
  without replaying the label or shifting keyboard focus and mobile scroll.
- Preserve product/quantity continuity, themes, Ceremonial naming, hidden
  personalization, commerce behavior, and all other routes.
- No new dependencies, claims, assets or production actions.

## Validation

Review opening, Explore, Shop, Overview and return on desktop and mobile, both
themes, repeated/rapid transitions and reduced motion. Confirm selection and
quantity continuity. Run formatting, `pnpm validate`, review scoped diffs and
save screenshots of the three states.

## Result and verification

- The opening and returning hero use the silver bag with the current selected
  product, format and quantity. Explore waits for the destination powder, then
  dissolves the bag over 480ms; the original tray studies retain their handoff.
- Powder and Shop bag remain mounted. Transform and opacity transitions replace
  abrupt resizing, mounting and label replay. Mobile stage sizing is coordinated;
  tab navigation retains focus without scrolling the page. Desktop information
  panels still reset their internal scroll position on a section change.
- Reviewed 390×844, 375×667 and 1280×800 layouts in both themes, including the
  shared product exploration. Verified repeated Explore/back and rapid
  Overview/Shop changes, desktop panel scrolling, Ceremonial selection and
  quantity continuity. Reduced-motion entry completes immediately with 0s CSS
  transitions. Restored the temporary motion and viewport overrides.
- Final `pnpm validate` passed formatting, lint, types, all 63 tests and the
  production build. An intermediate run encountered formatting in a concurrently
  added test file; the subsequent full gate passed without editing that file.
  Reviewed scoped diffs and `git diff --check`. No commerce writes were made.
- Saved [hero](../design/bag-hero-0078.png),
  [powder Overview](../design/bag-overview-0078.png) and
  [Shop](../design/bag-shop-0078.png) previews.
