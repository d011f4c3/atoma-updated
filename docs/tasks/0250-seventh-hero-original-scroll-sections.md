# Task 0250 — Original scroll sections under the seventh hero

Date: 2026-10-22
Status: Complete

## Scope

The owner requests the sections below `/new-hero`'s hero on the latest version,
while explicitly preserving the current hero. Subsequent steering asks for round
buttons and image corners, leaving other surfaces square. After reviewing the
literal transfer, the owner rejects its scale and flat background, asks for the
Sample Set pouches to float without an image panel, requests a clearer ordering
process, and requires the complete desktop application cards to fit one screen.
The owner then accepts the background and scale, keeps the hero and floating
Sample Set presentation, and requests a new order and distinct layouts for the
other three sections. Final refinements ask for generous space between sections
and a more playful, visual ordering process with less text. The owner then flags
uneven section spacing and oversized product popups that hide purchase controls.
Latest steering puts Preparation & profile on the popup's right, with a matcha
swatch above its use-case photograph on the left, and removes the bright ridge
at the hero's gradient boundary.

- Share the original four sections: application-led products, Sample Set,
  supported product/origin information, and wholesale/repeat ordering.
- Append them below the existing `/new-hero7` home hero. Preserve its geometry,
  imagery, copy, actions and first-view gradient, including on mobile.
- Keep original `/new-hero` defaults unchanged. Use unique IDs and independent
  order memory for the Home and Matcha popups; retain the latest selection flow.
- Connect section CTAs to the latest in-place views, preserving exact canonical
  product and 1 kg destinations, commerce guards and history/scroll continuity.
- Apply rounding to buttons and image frames in the added sections only. Do not
  round section containers or introduce additional panel treatments.
- Normalize the latest lower sections to the hero's gutters, type and button
  proportions. Present application learning cards in one desktop view, opening
  real product information and purchase controls in place without moving Home.
- Carry the hero's ending palette smoothly into the lower content, remove the
  rectangular Sample Set background, and balance the photography and spacing.
- Simplify the latest wholesale section to a visual Sample → Choose → Reorder
  path, with short actions and exact named 1 kg repeat-order links.
- Order Home as Sample Set → Applications → Origin → Ordering. Keep the accepted
  Sample Set presentation; use a wide photograph and information row for Origin
  and a visual numbered sequence for Ordering. Give each section breathing room
  without changing the accepted internal scale or Sample Set composition.
- Balance section padding above and below dividers. Recompose both Home and
  Matcha product popups so the default product identity and complete purchase
  controls fit desktop height; keep detailed information reachable and mobile
  reading usable, with the close control always visible.
- No new dependencies, claims, live commerce writes or deployment.

## Verification

Capture the existing hero before integration and compare its desktop/mobile
geometry and appearance afterward. Verify section order/content, unique IDs,
purchase controls, in-place CTAs, Back/Forward, retained orders, popup continuity
and hidden-section dialog cleanup using isolated browser fixtures. Review both
themes, mobile and enlarged text, run `pnpm validate` and inspect scoped diffs.

## Implementation

- `NewHeroSections` shares the original lower content while keeping `/new-hero`'s
  IDs, native application anchor and destinations as defaults.
- The latest Home mounts these sections after its existing hero, with independent
  purchase memory and IDs. Section actions enter the existing in-place views;
  named product and 1 kg links retain their canonical destinations.
- The first view subtracts the measured header height from the viewport so the
  new content cannot shrink the hero. Its original gradient remains unchanged;
  the lower page continues its final color into a subtle background. Blue hour
  desktop carries its glow beyond the boundary and fades gradually instead of
  reflecting it into a sharp horizontal ridge.
- Latest-only styles use the established 6 px button and 12 px image radii.
  Section frames and product columns stay square. The Sample Set stage is
  transparent, retaining individual pouch cutouts, shadows and inspection.
- Home application cards reuse the existing product dialog behavior through
  `NewHeroSevenMatcha homeSection`. `?application=` is owned by Home, preserving
  its underlying scroll, opener focus and independent order memory through
  close, Escape and history. Default Matcha behavior remains independent.
- A wide Origin photograph with information beneath it and a separate visual
  order-process section give the lower page distinct compositions. Every section
  uses the same 48–96 px of top and bottom padding, responsive to width, with no
  additional margins accumulating between sections.
- The lower profile CTA uses the in-place application view to preserve Back
  scroll restoration; the original page retains its native upward anchor.
- Product popups separate product learning from ordering on desktop. A compact
  canonical matcha swatch sits above the application photograph on the left;
  price, formats, quantity, total and the purchase action remain together on the
  right. Preparation & profile follows on the right and scrolls independently
  when expanded. Narrow layouts place the order controls before the gallery
  and retain the fixed close header.

## Verification results

- Six viewport/theme/locale comparisons preserve the hero's geometry exactly.
  The original `/new-hero` section content, defaults and stylesheet remain intact.
- Every lower section has equal top and bottom padding: approximately 82 px at
  1366 px wide and 48 px on mobile. All application cards fit a 768 px desktop
  viewport. The visual ordering path preserves all five destinations and guards.
- Dark desktop gradient samples are continuous across the hero boundary, then
  fade gradually. Both themes and mobile transitions were reviewed. Supporting
  Sample Set text is lifted for contrast where the extended glow passes behind it.
- Home and Matcha popups fit complete desktop purchasing controls at 1440×900,
  1366×768 and 1280×600. Full swatches and use-case photographs remain visible;
  expanding the right-side profile keeps dialog, close and buying controls still.
  Mobile and 320 px / 200% text checks keep all content reachable without
  horizontal overflow. A rotating disclosure glyph was replaced with fixed
  plus/minus glyphs to remove its transformed overflow at enlarged text sizes.
- Isolated browser fixtures pass multi-format and unavailable offers, catalog
  failure, pending/successful orders, exact product handoffs, retained independent
  choices, close/Escape/backdrop, Back/Forward, scroll/focus restoration, hidden
  dialog cleanup and reduced motion. The final sequential runs used stable
  source files after development reloads interrupted an earlier handoff check.
- Local evidence: `.local/new-hero-0250/final-hero/`, `spacing-final/`,
  `ordering-visual/`, `gradient-join-final/` and `popup-fit/`. New persistent
  coverage includes Home sections, URL normalization and popup fit regressions.
- Final `pnpm validate` passed formatting, lint, strict types, all unit tests and
  the production build. Scoped diffs and whitespace were reviewed. Full output:
  `.local/new-hero-0250/validate-final.log`.
