# Task 0240 — Application cards and consistent controls

Date: 2026-10-21
Status: Implemented and verified locally

## Authority and scope

The owner likes the `/new-hero5` hero, requests a more visually appealing
Explore by Application section, suggests cards, and asks for button rounding
to remain consistent with the top of the page.

- Preserve the approved hero, its contained gradient and all existing journeys.
- Introduce an isolated gallery presentation of the shared application products:
  three balanced cards on desktop and a single column on phones, with larger
  labelled reference photography, clear identity and visible buying controls.
- Use the hero's existing button radius token for the gallery's format buttons,
  quantity controls and Add to cart actions, and the fifth page's repeat links.
  Keep transparent image controls and plain text links appropriate to their roles.
- Retain current catalog authority, per-product and Sample Set selection memory,
  cart guards, origin reader, four locales, keyboard access and reduced motion.
  No new images, product facts, dependencies, deployment or live commerce writes.
- Keep earlier concepts and shared presentation defaults unchanged.

## Verification

Review both palettes at desktop and phone sizes, plus 320 px with 200% text.
Check card geometry, button radius consistency, price/format/action visibility,
image fallbacks and existing navigation/purchase behavior with isolated fixtures.
Compare the first view with Task 0239, run `pnpm validate`, and review the final
scoped diff.

## Implementation

- Only the fifth page opts into the shared product component's new `gallery`
  presentation. Three equally sized cards pair prominent application labels,
  canonical names/codes and larger reference photographs with aligned purchase
  controls. Phones and narrow tablets use one column; card interiors adapt to
  their available width, including enlarged text.
- Cards use the established raised surface with restrained borders and a
  12 px outer corner. Format buttons, quantity controls, Add to cart and the
  fifth page's repeat-order links use the same 6 px button token as the hero.
  Sample controls already used that token. Plain text and transparent imagery
  controls retain their existing appearance.
- The active application anchor receives an inset border on its destination
  card. Whole cards do not introduce a competing click target around purchase
  controls. Product and sample selection memory, direct links and cart behavior
  are unchanged. Obsolete fifth-page row layout overrides were removed.

## Browser verification

- `tests/new-hero5.mjs` passes all ten viewport/theme/locale profiles, checks
  equal desktop card geometry, single-column phone layout, visible imagery and
  matching computed button radii. All existing navigation, selection/history,
  fixture-only cart, origin-reader, focus, pending/error and image-fallback
  checks pass, including 320 px screens with 200% text.
- First-view and hero action geometry exactly match Task 0239 across all ten
  profiles: zero pixel delta. Desktop and phone captures were visually reviewed
  in Mist and Blue hour. Evidence: `.local/new-hero-0240/`.
- `/new-hero4` passes desktop Mist and phone Blue hour regression profiles plus
  its interaction suite. No unexpected client errors or live writes occurred.
- `pnpm validate` passes, including all 238 unit tests, TypeScript and the
  production build. The final scoped diff and whitespace checks pass. No
  deployment was performed.
