# Task 0248 — Rebuild Explore by Application

Date: 2026-10-22
Status: Complete

## Scope

The owner rejects the current Explore by Application view and requests a redo.
Replace the three simultaneous purchase cards in `/new-hero7` with an application
selector and one focused product presentation at a time.

- Keep Tea service, Lattes and Recipes immediately available as direct choices.
- Give the selected matcha a stronger photographic composition, clear product
  identity, useful profile/preparation information and visible commerce controls.
- Reuse the existing catalog, purchase logic and per-product selection memory.
  Retain inactive orders mounted but exclude them from reading and keyboard use.
- Keep application choice in the existing URL/history flow; preserve native
  links, dedicated-route hashes, hero entrances and Sample Set product handoffs.
- Preserve both palettes, rounded controls, image reference labels and mobile
  readability. Leave the approved hero, Sample Set, Origins, Wholesale and
  earlier concepts intact.

## Verification

Exercise all application choices, URL entry/history, focus, retained independent
formats/quantities, cart guards and fixture purchases. Review desktop/mobile in
both themes and enlarged text. Update layout-dependent browser assertions while
retaining behavioral coverage, run `pnpm validate` and inspect the scoped diff.
No production writes, dependencies or deployment.

## Implementation

- Extracted the Matcha view into its own component and styles. Three application
  links select one photographic product presentation, with profile/preparation
  disclosure, canonical product link and the existing purchase controls.
- Added an opt-in `spotlight` presentation to the shared product component;
  inactive products remain mounted with native `hidden`, preserving independent
  formats, quantities and open profile state without exposing hidden controls.
- Kept query-owned selection in the in-place experience and native hash history
  on the dedicated route. Entry focuses the selected product while keeping the
  application choices in view. Sample Set handoffs select the matching matcha.
- Reused canonical editorial content with its illustrative-profile label and
  retained image reference captions. Responsive image sizes support the broader
  photograph. Named containers reflow enlarged text and narrow screens, placing
  purchasing before the large mobile image.
- Removed the replaced Matcha-only styles from the shared frame stylesheet.

## Results

- Both browser suites pass: application choice, keyboard focus/disclosures,
  exact-product deep links, query/hash Back and Forward, independent retained
  formats/quantities, unavailable catalog, pending/review guards and fixture
  purchases. Sample Set learning and matching larger-format handoff also pass.
  No client errors or live commerce writes in the final runs.
- Reviewed desktop and mobile screenshots in Mist and Blue hour, with English,
  Japanese and Traditional Chinese, including 320 px and Japanese at 200% text.
  The selected product, reference captions and commerce controls remain readable
  without horizontal overflow. Profiles and preparation expand in place.
- `pnpm validate` passes: formatting, lint, typecheck, all 238 unit tests and
  production build. Scoped implementation/test diffs and whitespace reviewed.
- Local evidence: `.local/new-hero-0248/visual/`, `flows-final/`,
  `sample-learning-final/` and `validate.log`.
