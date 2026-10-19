# Task 0148 — Adopt and refine the photographic About page

Date: 2026-10-13
Status: Complete — local adoption; actual shoot photographs pending

## Authority

The owner approves the latest About composition and asks to link the site to it,
with a refinement pass. Preserve the photography-first layout and their exact
Character, Application and Origin principles. This authorizes local canonical
navigation and page adoption; it does not request deployment.

## Scope

Add `/about` with the accepted AboutFlow, active navigation, shared theme and
locale controls, local metadata and the Directory footer. Link canonical headers
and footers to it while preserving legacy concept dialogs and footer studies.
Keep `/about-exploration` available for review. Omit its design-review footer on
the canonical page, while retaining necessary archive-photo placeholder labels.

Refine line wrapping, responsive spacing, keyboard story affordances and disabled
states. Add full translations for canonical page/story text, reusing the existing
approved principle translations. Keep commerce, product selection, private
identities and global noindex rules. Actual shoot photographs remain pending;
no archive image is claimed to depict the new harvest, drone or powersuit shoot.

## Verification

Check header/footer navigation from home and Shop, active About state, mobile
menu, theme/cart/selection continuity, four locales, reader focus and dismissal,
responsive visual fit, no-JavaScript and reduced motion. Run relevant tests,
`pnpm validate` and scoped diff review.

## Result

The canonical `/about` route uses the approved image-led composition. Regular
storefront headers and the Directory footer link to it, while saved concepts
retain their existing About dialogs. The canonical page omits exploration
controls and has active navigation and localized metadata.

Refined text wrapping, narrow-screen spacing, image/keyboard focus states and
story-reader return controls. Character, Application and Origin retain the
owner's exact English copy. Canonical content and both focused story readers
support English, Japanese, Simplified Chinese and Traditional Chinese.

Browser review found that leaving the homepage reset its selection. A root-scoped
in-memory journey now restores the open selector, matcha, format, quantity,
information tab and optional reference after local navigation. Only the canonical
homepage opts in. Fresh catalog data rechecks formats, availability and quantities;
explicit product links still take precedence. About's Origins entrances say
“Back to About” instead of naming a previously selected matcha.

## Verification result

- `tests/about-page.mjs`: all 20 canonical navigation/localization scenarios pass
  across 320px and 1440px, both themes and all four locales. Includes cart/theme
  continuity, selection/tab/format/quantity restoration, direct product override,
  header/footer/mobile navigation and Origins return context.
- `tests/about-flow.mjs`: all eight viewport/theme combinations and auxiliary
  no-JavaScript, reduced-motion, reader-focus/dismissal and legacy-route cases pass.
- Selection unit checks cover valid restoration, missing/unavailable formats,
  changed quantity limits and an explicitly different matcha.
- Desktop/mobile visual review and scoped diff/whitespace review completed.
- `pnpm validate` passes formatting, lint, types, unit tests and production build.

Evidence is saved locally under `.local/about-adoption-0148/`. The actual harvest
and farmer-technology photographs still need their source files; archive images
remain visibly labelled placeholders. No deployment was performed.
