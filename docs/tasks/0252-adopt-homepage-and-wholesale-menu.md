# Task 0252 — Adopt the approved homepage and Wholesale menu label

Date: 2026-10-22
Status: Complete

## Authority and scope

The owner requests changing Shop to Wholesale in the menu, then explicitly
asks to apply the latest approved hero to the main website. Adopt the latest
`/new-hero7` homepage and its sections at `/`, including the in-place Sample Set
and application selection experiences. Keep the saved study available.

- Preserve the approved hero composition, contained gradient, palettes,
  typography, scroll sections and native product/sample popups.
- Keep selection URLs on the current homepage: `/?view=samples`,
  `/?view=matcha` and optional application. Preserve browser history,
  orders, focus, scroll, catalog availability and purchase guards.
- Rename the storefront menu label to Wholesale while keeping `/shop` as the
  destination. Samples, Origins and About retain their existing pages; no
  substitute pages are introduced.
- Retain canonical footer actions and existing product links from Origins and
  checkout retry. Keep homepage/study order memory independent.
- No new imagery, dependencies, commerce rules, live writes or deployment.

## Implementation

- The root page mounts the approved experience directly. A typed base path
  scopes its links, popup handoffs and history to either `/` or `/new-hero7`.
  The hero and section markup/styles are shared, so adoption does not redraw
  the approved composition or introduce a duplicate implementation.
- Storefront headers and footer menus say Wholesale and still lead to `/shop`.
  Canonical Samples, Origins, About and product pages retain their components.
  The root experience retains the existing storefront footer's account,
  destination, theme and return actions; the study keeps its compact footer.
- Root and saved-study order memory use separate keys. Existing single-handle
  `?matcha=` links resolve to the matching application popup; unknown valid
  handles use their exact dedicated product route. Invalid/duplicate values
  are ignored, explicit new view URLs win and checkout retry is preserved.

## Verification

- The focused `tests/homepage-adoption.mjs` checks passed at 1440 px and 390 px
  in both palettes. Hero geometry matches the saved study; reviewed screenshots
  are under `.local/homepage-0252/`.
- Verified root-owned links, native product/sample popups, Back/Forward,
  independent saved orders, exact format/quantity handoff, the original Origins
  reader, canonical menu destinations, footer actions and pending guards.
- Legacy product links, the actual Origins product handoff, query precedence,
  invalid/duplicate input handling and checkout retry passed with isolated
  fixtures. No live commerce writes occurred.
- Seven URL-helper tests pass. `pnpm validate` passed formatting, lint, strict
  types, all 245 unit tests and the production build. Reviewed the scoped diff;
  existing canonical pages and saved studies retain their implementations.
- Implementation is local; no deployment was performed.
