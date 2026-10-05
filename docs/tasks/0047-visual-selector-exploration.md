# Task 0047 — Visual selector exploration

Date: 2026-09-30
Status: Complete

Create a separate exploration of matcha type selection and information-view
selection while preserving the current homepage hierarchy from Task 0046.
Product choice stays above Overview, Specifications, Origins and Shop in the
right panel. Keep the primary product choice visually stronger and the
information navigation subordinate. The owner explicitly clarified that these
two controls should not match: cohesion comes from typography, palette and
spacing without flattening their hierarchy.

Compare two independently selected control types at `/selector-study`:

- Matcha: Current, Specimens, Swatches, Slides, Menu, Index, Radio and Stepper.
- Information: Text, Tabs, Segmented, Menu, Brackets and Indicator.

The added Index, Radio and Stepper directions explore product choice without
thumbnail imagery. Brackets and Indicator offer quieter ways to locate the
active information view. Their treatments remain independent: eight primary
choices and six secondary choices give 48 combinations.

Use existing matcha imagery and the accepted subtle 6px corners. Give the two
levels more space: 16px on desktop and 12px on phones for visual matcha choices.
Keep product, format, quantity, reference and active view preserved when the
control type or theme changes. Open directly to selection so the comparison is
immediately visible. Preserve the current homepage and standalone concepts
through opt-in props with unchanged defaults.

The owner also wants to compare placing matcha selection on the right or left.
That is a separate follow-up after choosing the visual treatment; do not mix
placement changes into this comparison.

Retain actual catalog availability, cart locks, unpublished origin states,
sample disclosures, keyboard access and reduced motion. No new assets,
dependencies, claims, commerce contracts or deployment. Verify the directions
in both themes at desktop and phone sizes, including loaded imagery, selector
hierarchy, seven-row specification fit, state continuity and default-route
isolation. Additional Product details may use natural overflow; do not shrink
reading text or targets to force optional content into the specification frame.
Run scoped browser checks, `pnpm validate` and final diff review.

## Implementation and review

The toolbar changes primary and secondary control types independently without
remounting the product model. Specimens use isolated powder photographs,
Swatches use a continuous material band, and Slides use outlined sample plates.
The product menu keeps a photograph beside the selected matcha. Index uses
numbered typographic choices, Radio uses native single-choice controls, and
Stepper places the selected product between previous and next controls.
Subordinate navigation compares quiet text, tabs, a segmented rail, a native
menu, active brackets and a moving position marker. The marker identifies the
current view; it does not imply progress or completion.
An explanation of each treatment is available on demand. Pending cart requests
lock the study controls as well as product and information selection.

All directions retain the established 6px corners, current right-panel
placement, shared product content and cart. Optional props leave the main
homepage, navigation study and standalone Concept 02 unchanged. The homepage
studies index links to the new comparison.

Visual review passed five original independent combinations in both themes at
320×700. The added Index/Brackets, Radio/Indicator and Stepper/Brackets pairings
passed twelve captures across both themes at 1366×768 and 320×700. The two
selector levels, all seven properties and full sample note fit from the top
of the preview. The measured separation is 16px on desktop and 12px on phones;
brackets clear the narrow Specifications label. Optional Product details and
footer use natural scrolling. New captures: `.local/qa/selector-study-extra/`.

Concurrent Origins work briefly interrupted the shared build. A small
`className` prop typing correction in its photograph component allows standard
CSS Module lookup values without changing rendering.

The final three browser cases passed: eight representative independent pairings
in both themes at 1440×900 and 320×700, plus original-homepage/Concept 02
isolation. Verified real product and view changes, loaded imagery, preserved
format/quantity/reference, pending cart locks and exact mocked purchase data.
Native-menu typeahead retains focus; menu-driven view changes no longer move
focus into the content while the menu is being used. From the top of the
preview, both selector levels, heading, seven rows and full sample note remain
visible. Native radio arrow/Space interaction, Index choices and Stepper
keyboard/pointer selection pass, including displayed position, disabled end
controls and the real unavailable-product state. The Indicator marker follows
the centers of the weighted columns, accounting for responsive grid gaps, and
has no transition under reduced motion. Final captures:
`.local/qa/selector-study-expanded/`.

Scoped formatting, repository ESLint, TypeScript, production build and final
diff whitespace review passed. The final `pnpm validate` attempt stopped on
five formatting issues in concurrently edited Origins/product-information
files. Running the remaining checks separately found 45 of 47 unit tests
passing, with two failures in `tests/origins.test.mjs` during the separate
Origins model migration. Those files remain owned by Task 0048; they were not
changed to make this exploration pass. Logs are in
`.local/qa/selector-study-{validation,lint,typecheck,unit,build}.log`.
