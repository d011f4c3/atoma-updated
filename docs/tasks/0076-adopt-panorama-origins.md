# Task 0076 — Adopt Panorama for homepage Origins

Date: 2026-10-05
Status: Complete

## Requested outcome

Use Panorama from `/origins-study` for the regular homepage Origins tab in both
Mist light and Blue hour dark. Reuse the existing layout, photography, geographic
hierarchy and regional context. This supersedes the homepage Split selection.

Preserve the existing silver-bag scene, left Slides, right Tabs, Current refined
Shop, persistent footer theme switch and product/order state. Keep the internal
region reader, private grower placeholder and return to the selected matcha.
On phones, use the study's information-first view: hide the material stage while
Panorama is active, keeping its renderer mounted for a continuous return.
Preserve independent studies and their saved options. No new facts, commerce
behavior, dependencies or deployment.

## Verification

Update existing homepage adoption expectations and check desktop/mobile in both
themes, region reader keyboard entry/return, selection and quantity continuity,
private placeholder and the unknown-origin fallback. Run `pnpm validate`, review
the final scoped diff and `git diff --check`.

## Result

The homepage Origins tab now uses Panorama in both themes. It retains the
existing photograph, confirmed geography, contextual copy and internal reader.
On mobile, the panel uses the study's available information space while the
material renderer stays mounted; other views keep their existing presentation.
Saved comparison defaults and options are unchanged.

The existing adoption browser case passes at 1366×768 and 320×700 in both themes,
including visible content/actions, unknown-origin behavior, private grower
placeholder, keyboard reader entry and return focus, selected Barista and
quantity continuity, and identical mounted renderer. Screenshots reviewed in
`.local/qa/adopt-panorama/`. No commerce writes occurred.

`pnpm validate` passes formatting, ESLint, TypeScript, all 60 unit tests and the
production build. Reviewed the scoped changes and `git diff --check`.
