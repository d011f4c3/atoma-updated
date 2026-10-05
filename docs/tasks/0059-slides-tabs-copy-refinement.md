# Task 0059 — Slides, Tabs and customer-facing copy

Date: 2026-10-01
Status: Complete

## Approved scope

Adopt Slides for product selection and Tabs for information views from
`/selector-study` on both homepage themes. Refine spacing within and between
the controls, retain small uppercase mono type, and preserve the viewport-bound
desktop composition and mobile flow. Keep the selector study and other studies
available with their own defaults.

Remove “Sample material profiles” and similar development/meta commentary from
customer-facing content. This explicit request supersedes earlier instructions
to display sample captions. Preserve provenance in source comments and planning
records; do not invent verified measurements, origin facts or availability.
Keep real format, stock, purchase limitations and customer guidance intact.

No dependencies, commerce changes, deployment or unrelated layout redesign.

## Validation

Review Slides/Tabs in both themes at desktop and narrow mobile widths. Check
photographs, label spacing, information switching, selected product continuity,
all seven specification rows and purchase access. Verify meta captions are
removed from the regular storefront, including the label and information dialogs.
Update existing browser expectations for the selected design without removing
state/commerce checks. Run `pnpm validate` and review the scoped diff.

## Result and verification

- Both homepage routes now use Slides and Tabs. Slides have uppercase labels,
  roomier image/label spacing, 24px separation before Tabs on desktop and 16px on
  mobile. Removed the duplicate parent border beneath Tabs and adjusted narrow
  desktop slide columns so Culinary stays on one line.
- Removed sample/development captions from Overview, Specifications and its
  dialogs, the paper label, Material & use, and retail product information.
  Removed the homepage Concept 02 review link; the concept route remains available.
  Preserved source provenance, real availability and preview limitations, and
  the descriptions used to compare layouts in dedicated studies.
- Reviewed the production preview at 1366×768, 780×740 and 320×740, plus development
  views at 1512px and 900px. Verified both themes, loaded selector photographs,
  no narrow-screen horizontal overflow, all seven specification rows visible,
  the purchase action, label and material dialog, and retail format spacing.
- Product and quantity remained selected through information-view and theme
  changes; unavailable products kept their disabled purchase state. No cart
  writes occurred. Existing browser-script expectations were updated; browser
  verification was performed through CUA rather than running those scripts.
- `pnpm validate` passed formatting, ESLint, TypeScript, all 60 unit tests and the
  production build. Scoped before/after diff review and `git diff --check` passed.
  Concurrent Shop-study changes were preserved.
