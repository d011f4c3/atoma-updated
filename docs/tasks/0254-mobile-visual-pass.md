# Task 0254 — Complete mobile visual pass

Date: 2026-10-22
Status: Complete

## Authority and scope

The owner requests a full mobile visual pass after the homepage adoption and
presentation refinements. Review and fix the canonical storefront, including
the homepage, its in-place Sample/Application views and popups, Wholesale,
dedicated Samples and product pages, Origins/readers, About/field notes,
navigation, footer and cart.

During the pass, the owner also reports missing button hover glitches on other
pages. Restore the existing character-resolution treatment on authored actions
across the canonical flows, including keyboard focus and touch, while preserving
reduced motion, settled transaction data and immediate click behavior.

The owner subsequently identifies fragmented hover underlines on “Read
profile.” Replace text decorations around animated glyph spans with a single
continuous rule, retaining the existing hover effect and clean arrow marks.

- Inspect rendered layouts at small, standard and large phone widths, including
  a short viewport and landscape where height affects dialogs or controls.
- Review both approved themes and English/Japanese layout. Preserve all four
  supported languages, readable prose, meaningful focus and touch targets.
- Improve mobile hierarchy, image scale/cropping, spacing, wrapping, control
  visibility and modal scrolling based on observed evidence. Preserve the
  approved desktop design and saved studies.
- Retain uppercase headings, the quieter supporting type/color, the settled
  hero title, contained hero gradient, loader/reveals and reduced-motion support.
- Preserve product facts, prices, availability, units, selections, cart contracts,
  navigation/history and the distinction between homepage views and canonical
  pages. No deployment, live commerce writes or new dependencies.

## Verification

Use isolated commerce fixtures for browser review. Capture and visually inspect
representative pages, scroll sections, menus and popups before and after fixes.
Check overflow, short-screen dialog access, touch controls, return/focus behavior
and basic desktop preservation. Run the smallest relevant checks, then
`pnpm validate`, and review the final diff.

## Implemented

- Capped the adopted hero's excess vertical space on tall phones and reduced
  the homepage Sample Set visual's empty stage. Desktop hero geometry remains
  unchanged; the hero imagery, type, palette and contained gradient are retained.
- Improved canonical mobile menu/footer type and allowed appearance controls
  to wrap at enlarged text sizes. The menu scrolls within short viewports.
- Made Sample/product dialog Back/Close controls reliably reachable, increased
  short-phone reading space, and used one scroll area for landscape Sample
  readers. Reflowed the foil-label reader at a readable mobile scale.
- Kept retail profile and Sample Set explanatory copy available through mobile
  disclosures, bringing purchasing higher in the flow. Preserved DOM/focus
  order, selected variant/quantity, desktop presentation and no-script copy.
- Removed the short-screen cart footer overlap and retained a reachable Close
  control. Improved mobile field-note type and Origins headers/return controls.
- Restored authored button/link label glitches across shopping, samples,
  editorial, selection dialogs and the canonical footer. All Add to cart
  treatments now use the existing effect with pending/unavailable guards.
  Prices, quantities, codes, status data and user-entered values remain settled.
- Replaced fragmented hover underlines with continuous rules on Read profile,
  related popup actions, comparison/credit links, navigation and commerce actions.

## Browser evidence

Local isolated fixtures cover 320 × 568, 390 × 844, 430 × 932, short landscape,
both themes, English/Japanese and 200% text. Shared navigation also passed both
Chinese locales and a 667 × 375 menu check. No live commerce writes occurred.

- `.local/mobile-0254/root/`: before/after hero, sections, menu/footer, no overflow,
  Escape/outside dismissal, focus return, theme changes and Japanese persistence.
- `.local/mobile-0254/commerce/`: all six mobile capture profiles; profile/quantity
  retention, unavailable state, cart dismissal/focus and desktop geometry.
- `.local/mobile-0254/editorial/`: canonical pages/readers in normal and enlarged
  text, unchanged desktop geometry, actual hover/focus mutations and reduced motion.
- `.local/mobile-0254/selection/`: ten viewport/theme/language profiles, native
  popup dismissal and exact scroll return, enlarged type, foil labels, touch
  landscape, hover/focus/tap and continuous underline captures.
- `tests/homepage-motion.mjs` now checks real authored action glyph mutations
  and fixed accessible labels/bounds across canonical pages, reduced-motion
  suppression, and the Read profile underline regression.

## Final checks

- Action hover/focus and reduced-motion browser regressions passed, including
  the Read profile continuous-rule check. The mobile loader/reveal and settled
  heading checks passed.
- The enlarged 320 × 568 menu fits below its wrapped header: its lower edge is
  at 532 px, with the remaining items reachable by scrolling and no horizontal
  overflow. Appearance controls also fit at 200% text.
- `pnpm validate` passed: formatting, ESLint, TypeScript, all 246 unit tests and
  the optimized production build. Log: `.local/mobile-0254/validate.log`.
- Reviewed task-specific diffs against local pre-edit backups; final
  `git diff --check` passed. Existing unrelated work remains in place.
