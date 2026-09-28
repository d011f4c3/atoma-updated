# Task 0005 — Off-black homepage and resolving navigation

Date: 2026-09-28
Status: Complete — local homepage/navigation update ready for owner review

## Scope and decisions

The owner requests removal of the large MATCHA title, an off-black home surface,
subtle Anduril-inspired numeric/text transitions, and a similar top navigation.
Remove all links to the earlier storefront. Retain the exact blue-to-bone
gradient as a reusable token for future product pages; no product page or
catalog integration is authorized in this slice.

Keep the existing hero and inspection views. Use brand at left, centered view
navigation, and an Index disclosure at right. The two real destinations are the
current Matcha/object and Material/powder views. A compact dropdown exposes the
same views on mobile. No invented products, dead page links, or unavailable
commerce actions. The brand returns to the object view.

## Reference evidence

Read the current official Anduril homepage and its public source on 2026-09-28:

- https://www.anduril.com/
- https://www.anduril.com/assets/js/app.xxDFyliG4S.js
- https://www.anduril.com/assets/css/style.xxK5ONfsUg.css

The source resolves characters from left to right over 500ms by default, with
sine easing, and 400ms for dropdown section headings. Numeric labels use digits;
words use letters. Desktop places brand left, sections in the center and utility
controls at right; the mobile header uses a menu disclosure. These observations
come from public source inspection, not a claim of frame-by-frame playback.

Implement an original small reusable text component with the same restrained
behavior. Run on entrance and hover/focus, never as a constant loop. Preserve
stable geometry and accessible names; honor pause and reduced-motion settings.
No third-party animation dependency or copied brand imagery/code.

## Validation

Run `pnpm validate`; check local desktop/mobile/short-height geometry, menu
selection, keyboard/Escape/focus behavior, character settling, pause/reduced
motion, browser errors and absence of outgoing storefront links. Review the
final change against the prior hero. Keep the local preview running.

## Result

The hero is off-black (`#10120f`) and the large background title is removed;
an unobtrusive accessible heading remains. The existing transparent vessel
continues to work on the dark surface. Top navigation switches between Matcha
and Material; Index opens a compact navigation panel, including on mobile.
The old external shop link is removed and the lower action performs local
inspection. `--product-gradient` preserves the original four gradient stops
for future product pages without applying them to the homepage.

Small indices and labels settle left-to-right over 500ms. Replays occur on
hover/focus; there is no repeating glitch loop. Random glyphs are hidden from
assistive technology, final accessible names remain stable, glyph slots reserve
their widths, and pause/reduced motion settle all active text immediately.
No new image generation or dependencies were needed.

Validation completed:

- `pnpm validate` passed after final code changes: formatting, zero-warning lint,
  strict types/route generation, and production build.
- Headless browser tests used the bundled Playwright runtime and installed
  Chrome without adding a project dependency. The local check is retained at
  `.local/qa/check-home-nav.cjs`; screenshots remain under `.local/qa/`.
- Desktop 1440 × 900, mobile 390 × 844 and 320 × 568, and landscape 844 × 390
  had no horizontal or vertical document overflow. Menu buttons fit each size.
- Verified nav and menu selection, brand return, disclosure close, Escape focus
  return, Tab-out dismissal, and backdrop dismissal with focus restoration.
- Verified intermediate scrambled characters, final resolved labels, stable
  label widths, pause behavior, and live reduced-motion changes.
- No runtime page errors, no outgoing prior-storefront links, and no visible
  oversized title. Desktop, mobile, menu, and short landscape captures were
  visually inspected. A mobile label/leader-line overlap was corrected.
- Independent review caught the backdrop losing focus on pointer-down; fixed
  it and reran the browser checks and full gate successfully.
- Reviewed the final code against the prior hero snapshot; `git diff --check`
  passed. No deployment, product pages, Shopify calls, or sibling-repo edits.
