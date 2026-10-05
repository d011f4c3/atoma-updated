# Task 0068 — Implement the four client-brief concepts

## Approved brief

Replace `/brand-exploration` with working Material Library, Open Specification,
Industrial Supply and Progressive Resolution concepts from the four proposal
boards. The owner's request authorizes distinct compositions and interaction
systems. The supplied client notes guide product-first hierarchy, thin neutral
uppercase type, controlled material photography and discovery of origin/people
inside product records.

## Scope

- Replace the prior Instrument/Register/Folio comparison on the existing route.
- Give every direction its own range entrance, material presentation and detail
  layout. Keep the regular homepage and other studies unchanged.
- Use one catalog/selection owner, canonical product information, existing
  purchase controls and existing origins reader. Preserve product, format,
  quantity and information view when comparing directions.
- Reuse local photography and fonts. Packaging is an illustrative design study;
  never invent catalog codes, certifications, lot data or availability.
- No new dependency, service, production permission or deployment.

## Validation

Review all entrances and product flows on desktop and phone. Check specifications,
Origins and reader return, purchase quantity and selection continuity, keyboard
focus, reduced-motion rules and unavailable states. Run relevant checks, then
`pnpm validate`, and inspect task-only diffs against pre-edit copies.

## Results

- Replaced the previous comparison with four working concepts. Material Library
  uses specimen plates; Open Specification exposes a shared product grid;
  Industrial Supply presents a consistent foil-package family; Progressive
  Resolution moves from a close material photograph into the product record.
- Each has its own entrance and scoped detail composition. Existing information,
  specifications, origin reader and purchase controls use one catalog/selection
  model. Concept URLs support direct entry and reload.
- Reviewed desktop at 1440 × 1000 and 1280 × 720 and all four phone entrances at
  390 × 844. No horizontal page overflow. Reviewed mobile information and
  purchase records, including the unavailable-product state.
- Verified selected product, purchase view and quantity 2 survive concept
  changes. Verified material zoom, origin-reader return, specification-dialog
  Escape, focus return to the remounted product trigger and focus transfer from
  content calls to action. No cart writes or checkout were performed.
- `fnm exec --using=24.20.0 pnpm validate` passes: formatting, lint, types,
  all 60 tests and production build. Reduced-motion behavior is handled by
  scoped media rules. Catalog loading/empty/error rendering uses the canonical
  model; service failure was reviewed in code rather than induced in the browser.
- Reviewed task-only changes against pre-edit copies and the new components.
  Independent review found no blocking state or commerce regression. Added
  accessible descriptions to comparison rows and corrected focus behavior.
- Regular `/`, shared commerce components and other studies remain unchanged by
  this task. No dependency, production write or deployment.
