# Task 0215 — Adopt the Shop filter bar

Date: 2026-10-20

## Request and scope

Adopt the selected Filter bar from `/shop-filter-study` on the canonical Shop
page. Reuse its refined popup, centered arrow and smooth transitions across
desktop and mobile, in both storefront themes.

## Implementation

Place Category above the collection, with All matcha, Ceremonial, Barista and
Culinary choices, product counts and Clear. Use the existing reviewed handle
mapping and preserve mounted cards, catalog order, saved matcha and commerce
state. Keep the Sample Set entry available across categories.

Use the URL's category as the selection authority. Native history replacement
updates it in place without reloading products, preserves other query values and
the fragment, and supports refresh and browser return. Invalid categories fall
back to All matcha. Clearing removes only the category parameter.
Repeated category parameters use the first value and are normalized on selection
or clearing.

Localize the controls, counts and empty state for the storefront's four
languages. Keep study copy and all three study directions available. Taste and
Region placeholders remain confined to the study.

Preserve the established popup dismissal, focus, reduced-motion and loading
behavior. No dependencies, new commerce operations, production writes or
deployment.

## Verification

- Eight browser scenarios pass: Chromium at 390px and 1440px in both themes,
  WebKit at 390px in both themes, plus canonical query fallback and localized
  loading/retry/empty recovery. Reviewed English and Japanese phone/desktop views.
- Verified exact product counts, mounted-card continuity, no filtering refetch,
  Sample Set visibility, Clear, keyboard/popup behavior, theme/language changes,
  query/fragment preservation, reload and actual product Back/Forward return.
- Invalid and repeated category parameters are covered. All three study
  directions remain available with their independent English controls.
- Localization coverage passes for all four languages, including translated
  count interpolation and existing duplicate-key/placeholder checks.
- Browser harness: `tests/shop-filter-study.mjs`. Captures and combined results:
  `.local/shop-filter-adoption-0215/`. No production writes or deployment.
- `pnpm validate` passes formatting, lint, strict TypeScript, all 218 unit tests
  and the production build. Final source and whitespace review pass. Validation
  log: `.local/shop-filter-adoption-0215/validate.log`.
