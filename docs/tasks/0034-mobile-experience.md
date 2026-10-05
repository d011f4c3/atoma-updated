# Task 0034 — A dedicated mobile experience

Date: 2026-09-30
Status: Complete

The owner rejects the current mobile presentation and asks for a major makeover
with its own treatment and focus. Recompose the current homepage and connected
selection/collection for phones rather than stacking the desktop layout.

Use a compact single-row header with the brand, an accessible navigation menu
and Cart. Give the tray priority in the hero, followed by a deliberate mono
headline and one clear entry action. Remove redundant mobile framing. Present
Explore / Shop before the product stage, make the content a readable vertical
journey and avoid the existing sticky miniature stage obscuring the controls.
The owner further asks for a unique mobile-first shopping flow, with imagery
and selection carrying the experience. Enlarge the material photography into a
horizontal swatch. On the homepage, swipe or tap between grades with quantity and purchase directly
in the same flow. The owner explicitly defers mobile personalization: hide the
reference editor, paper and entry points on phones, preserving them on desktop. In the dedicated shop, present the collection as native
horizontal snap panels with an explicit grade chooser and preserved quantities.
Every gesture has a tap alternative and respects ordinary vertical scrolling.

Keep the approved typefaces (Carefully remains mono), six-pixel radii,
dark-filled/light-outlined controls, dark/light palettes, actual imagery,
periodic text and primary purchase interaction. Preserve real navigation,
selection/reference continuity, cart contracts, availability and quantity rules.
Desktop composition and right-panel-only scrolling remain intact. Navigation
study variants remain independent. No new dependency, API, asset or deployment.

Check portrait phones at 320, 390 and 430 pixels, a short landscape viewport,
both themes, hero entry and return, menu keyboard/focus behaviour, Explore / Shop,
reference editing, material details, Cart and responsive desktop preservation.
Update relevant interaction expectations, run `pnpm validate` and review changes.

## Verification

- CUA visual review at 320, 390 and 430 pixels in dark/light, plus 740×390
  landscape and 1440×900 desktop. No horizontal document overflow; the landscape
  hero fits the viewport and desktop retains the fixed stage/right scroll pane.
- Native touch swipe changes the homepage grade. Quantity survives mode and
  theme changes. Mobile exposes no reference/card controls; desktop reference
  text survives a phone/desktop resize cycle.
- Dedicated collection grade taps preserve per-product quantity; native snap
  panels keep imagery and purchasing together. Navigation, material details,
  unavailable states and the checked one-time/disabled subscription choices
  were inspected without live cart writes.
- Updated browser regressions for mobile order, Menu focus, swipes, inline
  quantity, deferred mobile reference, carousel state and subscription gating.
  These scripts passed syntax/lint checks; the standalone browser harness was
  not run. Targeted live UI checks used CUA.
- `pnpm validate` passed: formatting, ESLint, TypeScript, all 26 unit tests and
  production build. Reviewed the touched layout, state and purchase paths;
  `git diff --check` passed. No dependency, remote setting or deployment change.
