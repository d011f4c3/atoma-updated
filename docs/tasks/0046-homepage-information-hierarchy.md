# Task 0046 — Refine the homepage information hierarchy

Date: 2026-09-30
Status: Complete

Refine Overview, Specifications and Origins on the original homepage in both
themes. Put matcha selection above the view navigation so product choice is the
primary control and the information views read as sections of that selection.
Use distinct visual treatments, restrained mono typography and intentional
spacing; retain the accepted subtle six-pixel corners.

Move the existing information-view selector into the shared panel header, remove
its duplicate from the reading content and mobile stage, and keep it available
in Shop. The homepage Shop can then open format/quantity directly without a
second type-selection step. Preserve the standalone Concept 02 builder.
Keep mobile product browsing, all seven specifications in view at ordinary
phone sizes, desktop scrolling confined to the right reading pane, product and
quantity continuity, the paper card and reference editing. Keep the numbered
concepts unchanged through scoped styling. This task does not implement the
Origins reader proposed in Task 0045 or invent new provenance content.

Verify light/dark at 1440×900, 1366×768, 390×844 and 320×700, selection/view/theme
continuity, specification explanations and keyboard focus. Review the scoped
diff and run `pnpm validate`.

## Result and verification

The shared header now leads with indexed matcha choices and application labels,
followed by quiet underlined view navigation. The product chooser persists in
all four views; the duplicate information and phone-stage controls are removed.
The homepage Shop opens format/quantity directly. Reselecting the active product
retains quantity, format and focus. Product changes remain locked while editing
a reference or submitting a purchase.

Overview has a clearer name, application and reading hierarchy. Homepage
Specifications uses spaced 44px rows with subtle corners, filled in dark mode
and outlined in light mode. Its compact presentation is explicitly scoped so
Concept 08 keeps its original styling. Origins shows one concise product-origin
record, without the duplicate empty People section.

- CUA visual and interaction checks covered both themes at 1440×900, 1366×768,
  390×844 and 320×700. All seven specifications, including the longest profile,
  fit together on the 320px phone. The desktop Add to cart is visible at
  1366×768; the mobile overview retains natural reading scroll.
- Verified one chooser above the section controls, live profile/card updates,
  active-product quantity/focus retention, theme and view continuity, reference
  preservation and editing locks, unavailable purchase state, specification
  dialog focus restoration and reduced motion. No production cart mutation.
- Updated the existing browser harnesses for the new hierarchy and direct Shop
  entry while retaining their commerce/selection coverage. Syntax and scoped
  ESLint passed; those automated browser harnesses were not executed in this
  turn. Browser verification used CUA.
- `pnpm validate` passed: formatting, ESLint, strict TypeScript, all 26 unit
  tests and the production build. Scoped diff and whitespace review passed.
