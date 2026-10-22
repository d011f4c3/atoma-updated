# Task 0244 — Change the seventh concept in place

Date: 2026-10-21
Status: Complete

## Authority and scope

The owner prefers the seventh concept's focused layouts and asks for an on-page
experience that changes instead of navigating to a new page. Evolve `/new-hero7`
into one persistent frame with Home, Matcha, Samples, Origins and Wholesale views.

- Keep the approved hero, its contained gradient, the established palettes and
  rounded imagery/controls. Reuse the existing focused view compositions.
- Main navigation, hero actions and links between these views switch content
  in place. URL-owned choices support direct entry, reload, Back and Forward.
  Native links remain available for modified clicks and before hydration.
- Keep the header mounted and retain previously visited views, selected product
  formats/quantities and the Sample Set order. Hidden views are excluded from
  reading and keyboard navigation. Focus the incoming heading or application.
- Preserve existing purchase/destination guards, canonical product records and
  exact named 1 kg links. The Origins reader retains its own history and focus.
- Keep the earlier dedicated `/new-hero7/*` routes and all other concepts.
  No catalog changes, new assets/dependencies, live writes or deployment.

## Verification

Check native and hydrated entry, document/header continuity, absence of route
requests during view switches, active navigation, history/reload/deep links,
selection continuity and guarded fixture purchases. Review desktop/mobile in
both themes, selected-application focus, reader dismissal, reduced motion,
320 px with 200% text and previous shared-header/hero behavior. Run the smallest
relevant checks, `pnpm validate`, and review the scoped diff.

## Implementation

- `/new-hero7` now uses a persistent header, main frame and footer. The approved
  hero and focused Matcha, Samples, Origins and Wholesale compositions switch
  inside that frame. The hero gradient remains confined to its first view.
- Query parameters (`view` and optional `application`) describe the current
  view. Native history updates avoid a document or route-data request while
  preserving direct URLs, native link behavior, reload and Back/Forward.
- Views mount on first entry and remain hidden when inactive, retaining catalog
  state and choices. View changes focus the heading or selected application;
  history restores scroll. Outgoing inspection dialogs close before focus moves,
  releasing their scroll locks. Origins keeps its separate reader history.
- Header/hero interception is opt-in. The dedicated seventh-concept child routes
  and earlier concepts retain their existing navigation behavior. The established
  `tests/new-hero7.mjs` command forwards to the current in-place browser suite;
  the prior task's test snapshot is retained with the local before-state evidence.

## Verification results

- Six desktop/tablet/phone theme/language profiles passed across all five views.
  Tests confirm persistent root/header identity and no document or concept
  route-data requests while switching. Desktop and phone captures were reviewed.
- Native entry before hydration, selected application focus, keyboard navigation,
  Back/Forward/reload, scroll restoration, alternate formats, independent product
  and sample quantities, exact 1 kg destinations and canonical detail return pass.
- Fixture purchases, duplicate suppression, pending guards, rejection recovery,
  Origins reader history and sample-inspection dismissal on Back pass. All views
  remain readable at 320 px with 200% text and reduced motion.
- Focused shared-component regression passed on `/new-hero6` at desktop/light
  and phone/dark, plus the dedicated seventh-concept Matcha and Samples routes.
  Default destinations and native section anchors remain intact.
- `pnpm validate` passed formatting, lint, type checking, all 238 unit tests and
  the production build. Final test-entry/document edits received targeted format
  and lint checks; `git diff --check` passed. Scoped source review is complete.
- Evidence is local under `.local/new-hero-0244/`. All browser contexts closed.
  Existing workspace changes remain intact; no live commerce writes or release.
