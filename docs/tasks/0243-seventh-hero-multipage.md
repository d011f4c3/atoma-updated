# Task 0243 — A multi-page seventh concept

Date: 2026-10-21
Status: Complete

## Authority and scope

The owner asks for a style that is not a one-page design at `/new-hero7`.
Create a focused homepage and separate matcha, Sample Set, origin and repeat-order
pages under that route. Keep the previously approved hero and established themes.

- Homepage: the approved first view with route-based sample and application
  entrances, direct application links and a compact footer, without stacked
  product, sample, origin and wholesale sections.
- `/new-hero7/matcha`: clear application comparison and existing real buying
  controls, with product records handed to canonical dedicated product pages.
- `/new-hero7/samples`: the existing all-three Sample Set and live ordering.
- `/new-hero7/origins`: supported regional context and the existing Wazuka reader.
- `/new-hero7/wholesale`: concise selection-to-repeat guidance and exact named
  1 kg product destinations, without invented commercial terms or services.
- Keep local navigation, active-page markers, breadcrumbs and native links.
  Preserve cart/destination authority, independent product/sample selection
  memory, Back behavior, keyboard access, reduced motion, readable mobile text,
  rounded photographs/buttons and both palettes.
- Shared hero/header changes are opt-in; earlier routes retain their defaults.
  No new product facts, images, dependencies, live commerce writes or deployment.

## Verification

Review the homepage and all four child pages on desktop and phones in both
themes. Check native route entry before hydration, active navigation and mobile
menu, route/history selection continuity, product and sample cart requests with
isolated fixtures, pending/error states, reader return, exact 1 kg links and
320 px with 200% text. Verify shared-header/hero regression, then run
`pnpm validate` and review the final scoped diff.

## Implementation

- The homepage retains the approved hero and contained gradient. Both main
  actions and the three application entrances now navigate to dedicated pages.
  A compact footer completes the homepage.
- A shared concept layout provides local navigation, active-page markers,
  breadcrumbs, theme/language controls and the existing cart. The header and
  hero accept optional destinations; their earlier defaults remain unchanged.
- Matcha uses three application cards with visible formats, current catalog
  prices, quantities and Add to cart. Samples has its own contents and order
  view. Their independent choices persist across navigation and Back.
- Origins presents the supported Ceremonial/Wazuka record and existing reader.
  Wholesale leads directly to each named 1 kg product, with concise sample and
  range entrances. Canonical product and sample records remain the detail
  destinations.
- The established Mist/Blue hour palettes, IBM Plex Mono, 6 px button radius
  and 12 px image corners carry through each page. Smaller images keep purchase
  information prominent; tablet image sizing explicitly respects its columns.

## Review evidence

- Desktop and mobile visual captures cover all five pages in both themes;
  final captures include the 768 px tablet layout. Evidence is local under
  `.local/new-hero-0243/`.
- Shared component regression passed: all ten `/new-hero6` profiles and its
  full interaction suite, plus desktop/light and mobile/dark `/new-hero4`
  profiles and its full interaction suite. Hero geometry remains unchanged.
- Independent route, factual and accessibility source review found no material
  concerns. Origin claims stay within the established Ceremonial/Wazuka facts.
- `pnpm validate` passed: formatting, lint, type generation/TypeScript, all
  238 unit tests and the production build, including all five new routes.
- Seventh-concept browser checks passed across six viewport/theme/language
  profiles and all five routes. Coverage includes native pre-hydration links,
  active navigation, keyboard entry, Back and independent selection memory,
  alternate formats, product/sample fixture orders, exact 1 kg destinations,
  reader focus/scroll return, pending navigation guards and rejection recovery.
  Targeted remaining checks passed for all routes at 320 px with 200% text and
  delayed/failed imagery. All browser contexts were closed afterward.
- Reviewed the final scoped source changes and `git diff --check`. Earlier
  workspace edits remain intact; no live commerce writes or deployment occurred.
