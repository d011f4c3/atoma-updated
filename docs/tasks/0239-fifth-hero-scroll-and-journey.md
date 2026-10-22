# Task 0239 — Keep the fifth hero, refine the journey below

Date: 2026-10-21
Status: Implemented and verified locally

## Authority and scope

The owner approves the `/new-hero5` hero and asks to combine stronger scroll
sections from the other concepts, with attention to what happens after buttons
are pressed. Refine this route in place. Keep its first-view composition,
contained gradient, imagery, palettes and typography; retain earlier concepts.

- Use the second concept's open product rows so each application has a distinct
  destination with current price, format, quantity and purchase controls.
- Bring the second concept's open Sample Set band and large origin photo split
  into the fifth page. Use the first concept's short sampling-to-repeat-order
  explanation with exact named 1 kg destinations.
- Make the primary Sample Set entrance a native anchor to real ordering on the
  same page, reusing the reviewed sample purchase controls and current catalog.
- Keep product choices through details, sample information and browser Back.
  Opt the fifth route into per-product UI memory without changing commerce
  authority or selection defaults on earlier routes.
- Open the existing origin reader in place for a normal click, retaining a real
  route fallback and standard modified-click behavior. Preserve focus, scroll,
  selection and browser history on return.
- Keep controls legible on phones and at enlarged text, preserve native links
  before hydration, keyboard access, four locales and reduced motion. No new
  facts, imagery, dependencies, integrations, publication or live commerce writes.

## Verification

Review desktop and phone layouts in both themes. Exercise every entrance,
multiple product selections through route changes, sample purchase, successful
fixture-only cart addition and dismissal, rejected writes, origin reader return,
named 1 kg handoffs and image failures. Retain the contained-gradient assertions,
compare the opening composition with Task 0238, run relevant earlier-route
regression checks, then `pnpm validate` and a scoped final diff review.

## Implementation

- The approved opening retains the same image, layout, type, palette and
  viewport boundary. Its sample action is now a native section anchor, with a
  downward arrow to match its behavior. The application destinations remain
  native anchors and receive a restrained target emphasis.
- The application comparison uses the second concept's ruled rows and a more
  legible section heading. Prices, formats, quantities and Add to cart remain
  visible. Each application now lands at its own distinct row.
- The open Sample Set band contains the canonical three 20 g samples and the
  shared live purchase controls. Ordering precedes optional foil inspection in
  the reading order. Sample details remain available as a secondary route, and
  destination or selection review can be resolved directly from this section.
- A large supplied origin photograph and supported product copy replace the
  thumbnail layout. The existing reader opens at Wazuka, preserving a real
  `/origins` fallback and normal modified-click behavior.
- The first concept's three short order steps are now actionable, followed by
  the exact named 1 kg product links. All content below the hero uses solid
  theme surfaces.
- An opt-in `selectionMemoryKey` preserves each product's format and quantity,
  including the inline Sample Set, through local route departures. The fifth
  page alone enables it; current catalog data remains authoritative, and the
  existing product-detail handoff and cart guards are unchanged. No price,
  inventory or cart data is persisted.
- At enlarged text sizes, sample contents and purchase totals wrap naturally.
  Page-scoped header and footer controls can also wrap when they no longer fit;
  their normal-size placement is retained. Mobile sample actions and ordering
  information use 16 px type. Earlier routes' shell styling is unchanged.

## Browser verification

- `tests/new-hero5.mjs` passes ten viewport/theme/locale profiles, native links
  before hydration, successful fixture-only sample and tea orders, duplicate
  submission guards, cart dismissal/focus return, rejected writes and pending
  navigation locks.
- All three independently edited tea quantities, alternate formats and the
  Sample Set quantity survive product details, sample details and browser Back.
  Explicit named repeat links still select the canonical 1 kg format.
- The Wazuka reader returns the previous URL, scroll position, focus and product
  choices after Escape or browser Back. Delayed and failed imagery does not
  gate ordering.
- Narrow 320 px screens with 200% text have no horizontal document overflow.
  Assertions compare against the document client width, including product
  header containers and sample order summaries; compact product rows stack
  when the available width cannot accommodate their image and heading.
- First-view and primary-action geometry exactly match Task 0238 in every
  standard profile. Both palettes and the final section composition were
  visually reviewed. Evidence is in `.local/new-hero-0239/`, including
  `hero-geometry-comparison.json`.
- `/new-hero4` passes desktop Mist and phone Blue hour regression profiles and
  its interaction suite. All browser commerce requests used isolated fixtures;
  no live mutations or unexpected client errors occurred.
- `pnpm validate` passes formatting, lint, TypeScript, all 238 unit tests and the
  production build. Final scoped review and `git diff --check` pass. No new
  dependencies or deployment are included. The validation log is in
  `.local/new-hero-0239/validate.log`.
