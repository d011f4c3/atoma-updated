# Task 0061 — More Shop layout options

Date: 2026-10-01
Status: Complete

## Requested outcome

Extend the saved Shop study with a refined typography version of Current and
two more layouts. Preserve all existing choices and the live homepage.

- Current refined keeps the original builder markup, sequence, visible purchase
  choices, format buttons and quantity control. Refine type scale, tracking,
  line heights, spacing and value alignment. It is the study's new default.
- Order line places format and quantity in a compact horizontal order row.
- Split checkout separates configuration from the purchase summary and action.

All versions use the existing selection owner and cart behavior. Retain exact
unit/currency formatting, pending locks, availability and quantity rules, label
movement/reference, theme continuity and the other saved studies. The newer
Slides/Tabs and left-placement implementation remains shared with the homepage.

The follow-up request brings the current storefront navigation into the demo:
show the regular site header, move Slides above the left material stage, and
use Tabs above the right information panel. Keep all seven Shop layouts, with
the additional room on the right available to the purchase controls. Preserve
the adopted homepage and separate selector-placement comparison.

## Verification

Extend the existing three browser cases across all seven options. Compare
Current/Current refined and both new layouts on desktop/mobile in both themes.
Check first-view purchase access, retained state, reference and scene, guarded
mock cart behavior, catalog recovery and unchanged homepage defaults. Run
`pnpm validate`, review scoped changes and `git diff --check`. No live cart writes.

## Result and verification

All seven options remain available, opening on Current refined. The demo now
uses the same header, left Slides and right Tabs as the current storefront.
The comparison controls sit above the full experience. The homepage and the
saved selector and Origins studies retain their existing defaults.

Current refined retains the original purchase markup and control sequence;
the two additional layouts use the same controlled selection model. Compact
mobile material framing leaves room for the storefront navigation and purchase
controls without reducing touch targets or clipping the powder's shadow.

All three mocked browser cases pass, covering seven layouts in both themes,
selection/reference and renderer continuity, quantity/availability rules,
pending locks, exact cart payloads, recovery and unchanged homepage defaults.
Additional navigation checks cover Matcha, About, Origins, Cart and the mobile
Menu with keyboard dismissal and focus restoration. The Shop link reaches the
regular catalog. No live cart writes occurred.

Visual review covered 1366×768 and 320×700 in both themes. The six alternatives
keep purchase essentials visible for the two-format bundle fixture; Current
retains its original taller mobile composition. Larger format lists may scroll
naturally. Desktop captures are in `.local/qa/shop-study-storefront/`; final
mobile captures are in `.local/qa/shop-study-left/`.

`pnpm validate` passed formatting, ESLint, TypeScript, 60 unit tests and the
production build. Scoped changes and `git diff --check` were reviewed.
