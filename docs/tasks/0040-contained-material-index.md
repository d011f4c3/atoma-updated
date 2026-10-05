# Task 0040 — A contained material index

Date: 2026-09-30
Status: Complete

The owner likes both homepage concepts, especially the clarity and name of
Concept 08's Specifications. The scrolling layout makes too much information
fall outside a single view. Show all seven material properties together without
requiring scrolling, while keeping the product and purchase easy to understand.

Build a separate comparison at `/concept-08/focus`. Keep a stable product stage
beside in-place Specifications and Shop views on desktop. On phones, let
Overview, Specifications and Shop share the available space instead of stacking
a large photograph above the information. Preserve product and quantity across
view changes. Explanations open on demand without expanding the seven-row
profile. Origin and People remain optional unpublished chapters.

Keep the scrolling originals for comparison. Reuse the catalog, cart, sample
content disclosure and quantity/availability guards. No dependencies, commerce
contracts or production changes. Native dialogs, keyboard focus restoration,
reduced motion and an accessible overflow fallback for unusually short/zoomed
viewports remain required.

Verify all seven property rows together at 1440×900, 1366×768, 390×844 and
320×700, plus view continuity, modal focus, purchase reachability and mocked
commerce. Run the relevant browser checks, `pnpm validate`, and scoped diff
review before handoff.

## Result and verification

The focused comparison opens directly to Specifications. Desktop keeps the
selected material visible beside the seven-row profile. Phones share the same
space between Overview, Specifications and Shop. Property explanations use a
native modal and return keyboard focus to the triggering row. Purchase options
remain collapsed until requested; selected product, format, quantity and open
purchase options persist through view changes. Pending cart actions prevent
view/product switches from hiding the originating Add button.

- All four focused viewport checks passed: 1440×900, 1366×768, 390×844 and
  320×700. All seven properties, heading and sample note fit together without
  document scrolling or clipping. Verified modal focus, selection continuity,
  purchase-options persistence, pending guards and mocked cart submission.
- The original nine concept checks passed again after shared-component changes:
  13/13 browser checks passed in total. All commerce stayed mocked.
- `pnpm validate` passed, including formatting, ESLint, strict TypeScript,
  26 unit tests and the production build. An initial typecheck caught an
  unchecked property lookup; it now has an explicit empty-state guard.
- Reviewed final desktop/phone screenshots with the photograph fully loaded.
  Captures are in `.local/qa/homepage-concepts/concept-08-focus-*`; the validation
  log is `.local/qa/contained-index-validation.log`. Scoped diff review and
  `git diff --check` passed.

At unusually short heights or enlarged text, natural overflow remains available
so accessibility does not depend on clipping content to a fixed frame.

## Navigation spacing follow-up

The owner requested slightly wider navigation hover surfaces. Origins, People
and Cart now have 6px more horizontal padding per side on desktop and 3px more
per side on phones. Matching negative margins preserve the label positions;
the whole painted surface remains clickable. The same spacing applies to
keyboard focus, with 4px desktop / 2px mobile separation between targets.

A local browser probe passed at 1440, 390 and 320px: unchanged label positions
and heights, wider hit areas, no hover/focus layout movement, overlap or viewport
overflow. Reviewed header captures in `.local/qa/focused-nav-spacing/`.
`pnpm validate` passed again; log: `.local/qa/focused-nav-spacing-validation.log`.
