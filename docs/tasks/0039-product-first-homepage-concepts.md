# Task 0039 — Two product-first homepage concepts

Date: 2026-09-30
Status: Complete

The owner requests two additional homepage/hero concepts that introduce the
product, allow exploration of each product's specifications and features, offer
shopping, and then reveal origin and the people behind it. This authorizes the
deeper information sequence for these new concepts, superseding earlier
hero-only limits within this task. Preserve the current homepage and saved
navigation alternatives.

## Deliverables

- `/concept-08`: a dark material index, with a large specimen, product selection
  and a precise, compact information hierarchy.
- `/concept-09`: a light product folio, with an editorial tray composition and
  a more spacious progression through the collection and its details.
- `/homepage-study`: a visual comparison with direct links to both concepts.
- Shared, functional specifications and purchase controls using the existing
  public catalog, quantity rules and cart. Preserve checkout gates.
- Origin and people chapters clearly marked as unpublished. There are no
  verified product provenance or producer records in the current content.
  Do not invent geography, names, portraits, lots or scientific claims.

Use the existing powder and tray photography, refined monospaced typography,
contained shadows, restrained motion, native scrolling and keyboard controls.
Retain the visible sample disclosure for authored sensory profiles. No new
dependencies, production mutations, deployment or changes to the current
homepage are included.

## Verification

Review both concepts at desktop and phone widths, keyboard navigation, reduced
motion, live product selection, quantity and availability controls, mocked cart
actions, catalog failure/empty states and the comparison links. Run
`pnpm validate` and review the scoped diff before handoff.

## Result

Both concepts and the comparison page are implemented. Material index puts a
large powder specimen between a product index and selection summary; Product
folio opens on the suspended tray and reveals the collection through numbered
chapters. Product switching updates the photograph, editorial content,
specifications, format and purchase controls from one selection model.

Specifications use native expandable rows. Shop shortcuts lead directly to
quantity/format controls and the existing cart, without forcing visitors through
editorial content. Navigation is plain text at rest with subtle button surfaces
on hover and keyboard focus. Native smooth chapter scrolling and material entry
motion respect reduced motion. Origin and producer chapters remain visibly
unpublished, with no invented locations, people, lots or claims.

## Verification results

- `pnpm validate` passed: formatting, ESLint, TypeScript, 26 unit tests and the
  production build.
- `tests/homepage-concepts.mjs`: 9/9 browser cases passed again after final
  navigation, mobile stage and gutter refinements. Covers both routes at 1440,
  390 and 320px; product/profile updates, keyboard disclosures, format-specific
  availability, minimum/increment/maximum rules, exact mocked cart submissions,
  focus restoration, section destinations, empty/error recovery and comparison.
- Reviewed desktop and mobile captures, including restrained navigation,
  contained product shadows, specifications/purchase layout and unpublished
  provenance. Local captures are in `.local/qa/homepage-concepts/`; the repository
  validation log is `.local/qa/homepage-concepts-validation.log`.
- Scoped diff and whitespace review passed. Every browser commerce request was
  mocked; no service-backed cart or production data was changed.

Task number 0039 avoids concurrent tasks 0037 and 0038 for other design studies.
