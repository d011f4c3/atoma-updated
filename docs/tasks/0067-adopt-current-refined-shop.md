# Task 0067 — Adopt Current refined for homepage Shop

Date: 2026-10-03
Status: Complete

## Requested outcome

Apply the owner's selected Current refined treatment from the Shop study to the
main homepage's Shop view in both themes. Reuse the existing refined presentation
with its quieter type scale, spacing, format controls and compact phone material
stage. Keep the original purchase sequence, quantity rules and cart behavior.

Set the variant explicitly on `/` and `/light`, preserving shared component
defaults for independent concepts and studies. Retain left Slides, right Tabs,
Split Origins, tray entry, powder, paper label and selection continuity. Keep all
Shop study alternatives available without changing its saved default. No new
commerce behavior, dependencies, product facts or deployment.

## Verification

Update the existing mocked homepage isolation check for the selected variant.
Review the homepage Shop on desktop and phone in both themes, with visible
purchase controls and preserved quantity, reference and scene through theme and
section changes. Confirm saved study defaults, run `pnpm validate`, and inspect
the scoped source changes and `git diff --check`. No live cart writes.

## Result and verification

Both homepage routes explicitly select `shopPreviewVariant="refined"`. The
existing presentation is reused without changing shared defaults, study options
or commerce logic.

The targeted existing browser case passes with mocked catalog and cart requests.
Reviewed 1366×768 and 320×700 in both themes: the refined controls and purchase
action fit, selected format and quantity persist across theme and section changes,
and the desktop reference persists. Theme changes retain the same material
renderer and label nodes without reloading the catalog. Study defaults remain
unchanged. Screenshots are in `.local/qa/adopt-current-refined/`.

`pnpm validate` passed formatting, ESLint, TypeScript, 60 unit tests and the
production build. Scoped source changes and `git diff --check` were reviewed.
No live cart writes or deployment.
