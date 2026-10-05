# Task 0042 — Explore Concept 04 from the hero

Date: 2026-09-30
Status: Complete

The owner likes Concept 04's cleaner visual direction but rejects the long
scroll. The hero should hold the product experience, with shopping,
specifications and origins explored in place. Retain the silver photographic
art direction and small mono typography while turning the page into a contained
experience with persistent product selection and view navigation.

Keep the full case photograph as the introductory preparation study; use the
actual selected powder photograph when exploring products. Replace the stacked
collection and approach sections with in-place panels. Preserve product,
format and quantity across views. Specifications expose all seven sample
properties together, with explanations on demand. Origins must accurately
state when product-linked notes are unpublished. Do not invent provenance.

Keep the catalog and cart contracts, integer money, quantity and availability
rules, duplicate-submit guards, keyboard access, focus restoration and reduced
motion. On phones use the same space for each view; allow natural overflow at
short heights or large text rather than clipping controls. This task affects
only Concept 04 and its local components; regular-site shop refinement is a
separate owner-authorized task. No new dependencies, services or deployment.

Verify desktop and phone views, selection continuity, unavailable products,
quantity totals, accessible details, and cart read-only behavior. Run scoped
checks and `pnpm validate`, then review the diff.

## Delivered and verified

- Replaced the vertical sections with a single hero workspace and persistent
  product selector. Experience, Specifications, Origins and Shop open in place.
  The introductory case photograph remains; entering the material views shows
  the selected matcha powder in a stable photographic stage.
- Product, format and quantity are owned by the hero and retained through view
  changes. Purchase controls remain mounted, with guarded availability and
  duplicate submission. Pending purchases lock view and product changes.
- Seven specifications fit together; explanations open in a native modal with
  Escape dismissal and focus restoration. Origins accurately show unpublished
  status rather than fabricated provenance.
- Reviewed 1440×900, 1366×768 and 320×700 layouts through CUA. At the smallest
  reviewed phone size, specifications fit without document scroll or horizontal
  overflow. Shorter/zoomed layouts retain natural overflow for access.
- Verified quantity 1→2, ¥10,000→¥20,000, retention across Origins/Shop,
  unavailable product purchase blocking, property explanation and focus return,
  and system reduced-motion styling. No live cart mutation was performed.
- Scoped formatting, ESLint and TypeScript passed; reviewed the component and
  style changes. Repository validation includes all 26 unit tests and the
  optimized production build.
- Final formatting, lint, strict types and all 26 tests passed. The build step
  initially met a concurrent build lock; its standalone rerun passed once the
  other build finished. No check was disabled or weakened.
