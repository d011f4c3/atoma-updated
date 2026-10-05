# Task 0032 — Quieter navigation exploration

Date: 2026-09-30
Status: Complete — Plain text adopted

The owner finds the current navigation distracting from the product flow and
wants to explore alternatives. Create three working directions in an unlinked
local study at `/navigation-study`, using the actual tray and selection flow:

- Plain text: keep all destinations visible without button surfaces or ornaments.
- Index: collect secondary destinations in a compact menu beside Cart.
- Focused: show quiet links on the overview, then Overview and Cart during selection.

Visitors can compare options without restarting selection and switch appearance
through the existing controls. Preserve the current homepage default and all
commerce contracts. The study uses real navigation and existing local dialogs,
not simulated purchase actions. No new dependency or deployment.

Review desktop and mobile, both themes, keyboard/menu behavior, focus restoration,
and preservation of selection while comparing. Run relevant existing checks,
meaningful new interaction checks, `pnpm validate`, and review the scoped diff.

## Follow-up: distinctive compact alternatives

The owner prefers Index and asks for more distinctive options. Keep the original
three and add Folio (a ruled directory beside the wordmark), Ribbon (an expanding
lower-edge dock) and Dial (a circular instrument-inspired directory).
These are design interpretations, not claims about laboratory equipment. Start
the study on Index and explain that Plain text and Focused differ during selection.
The owner explicitly frees the exploration from the existing layout; new options
may change navigation placement, composition and opening choreography rather
than merely restyling the current header. Preserve the actual product journey.
Keep all six options accessible in the comparison controls, preserve current
palette and product flow, and verify actual menu actions and focus behavior at
desktop/mobile sizes with normal and reduced motion.

## Third round: retained directions and new layouts

The owner retains Index, Folio, Dial and Plain text, and requests continued
exploration. Remove Focused and Ribbon from the active comparison. Keep the
four retained directions together and add three new interpretations: Edge, a
vertical tab with a sliding directory; Stack, a fan of index cards; and Shutter,
a wide panel revealed from a central control. Reuse real navigation, preserve
selection during comparisons and respect the current mobile and theme work.
The next follow-up asks for more creative navigation. Add Frame, with direct
destinations around the page perimeter, and Track, a fine navigation rail whose
indicator follows hover or keyboard focus. Frame reserves its lower corners;
Track makes room above the product for its open rail. The short-viewport study
toolbar becomes a single scrollable row so it cannot crowd out navigation.
Verify all nine choices, the seven disclosure menus and their focus behavior,
normal/reduced motion, and desktop/mobile layouts.

## Selected direction: Plain text with button hover states

The owner now selects Plain text for the current navigation. Apply it to the
shared storefront header: quiet text at rest, with the existing theme-specific
button surface, shadow and six-pixel corners appearing on hover and keyboard
focus. Keep hit areas stable, hide the desktop indices/ornaments, preserve real
navigation and the compact mobile Menu, and retain the study for later review.
This explicitly supersedes the earlier requirement to leave the default header
unchanged. Plain text is also the starting option in the comparison.
Validate both themes, stable geometry between states, keyboard focus, mobile
menu usability, About/Cart and entry/return from the product flow.

## Adoption result and verification

- The shared header now uses Plain text on desktop, with the existing theme
  surfaces, shadows and six-pixel corners on hover and keyboard focus. Hit areas
  remain stable. The compact mobile Menu and all actual destinations remain usable.
- The Plain text comparison has the same interactive treatment and is selected
  on initial load. The retained directions and later experiments remain available.
- Four local mocked browser checks passed at 1440 and 320 pixels in both themes:
  resting/hover/focus styling, unchanged bounds, mobile menu reachability,
  About/Cart focus restoration, and matcha entry/return. No commerce writes or
  runtime errors occurred. Captures in `.local/qa/plain-navigation-adoption/`
  were reviewed.
- The earlier seven-option round passed its desktop/mobile interaction checks,
  with Edge/Stack/Shutter reviewed in both themes. Frame and Track were built as
  additional prototypes before the owner selected Plain text; their full journey
  checks were superseded by the adoption checks.
- `pnpm validate` passed formatting, lint, types, 26 unit checks and production
  build. The final scoped changes and `git diff --check` were reviewed.

## Previous round result and verification

- The comparison is available at `/navigation-study`. All six options use
  the actual homepage, selection, About dialog and Cart. Navigation and theme
  comparisons retain the mounted selection and live label.
- Index, Folio, Ribbon and Dial support native keyboard navigation, Escape,
  outside-pointer dismissal and focus restoration, including selecting Matcha
  while already in selection. Focused selection exposes Overview and Cart, with a
  visible focus destination when returning from a removed or hidden trigger.
- The desktop comparison fits the available space; mobile selection can grow
  and scroll so content cannot be clipped behind its footer. Ribbon reserves
  space for its dock. The homepage default remains unchanged by this study.
- The development indicator is disabled through the documented Next.js option
  because it covered the mobile Ribbon trigger in the local preview. Compile
  and runtime errors remain visible; production behavior is unaffected.
- Browser cases passed at 1440 pixels with motion and 320 pixels with reduced
  motion, including both themes, retained product/quantity/card, menu behavior,
  Cart, and Overview. The desktop case additionally verifies footer bounds.
- Expanded desktop/mobile captures and three dark menu captures were reviewed
  under `.local/qa/navigation-study-expanded/`. A final 320-pixel Ribbon pointer
  check confirmed the development badge no longer obscures its trigger.
  `pnpm validate` passed formatting, lint, types, 26 unit checks and production
  build. The scoped diff was reviewed and `git diff --check` passed.
