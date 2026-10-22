# Task 0222 — Compare simpler hero journeys

Date: 2026-10-20
Status: Implemented and verified locally; homepage adoption pending selection

Owner review: the imagery and left-side composition are not yet clear or
appealing enough. Keep this study as a draft while the six client-feedback work
groups are addressed, then revisit its design using the resulting product
experience. Passing behavior checks is not visual approval.

After Tasks 0223–0228, [Task 0229](0229-clearer-hero-cx-study.md) revisits the
study as complete page layouts following the owner's clarification that the
existing homepage geometry need not be retained. The implementation and
verification below record the initial study; Task 0229 records the revised state.

## Request and scope

The owner initially asked to begin the first recommended item from Task 0221:
homepage messaging and Sample Set entry. Before implementation, the owner
clarified that different customer flows should be tested in a separate hero
study before changing the actual homepage. This study takes precedence over
homepage adoption; the canonical homepage remains unchanged.

Compare three progressive journeys at `/hero-cx-study`, using the existing
fonts, Mist/Blue hour palettes, silver packaging and product identity:

- Samples first: one primary invitation to the existing Sample Set page, with
  optional exploration by application.
- Application first: choose tea service, lattes or recipes/baking, then see a
  short summary of the corresponding tea and a clear sample-first next action.
- Guided choice: choose between exploring and knowing what is needed, then
  choose an application. The next action prioritizes samples or the exact 1 kg
  destination accordingly. This choice does not infer account/order history.

The purpose is to compare information order and decision effort, not add a new
visual identity, make product recommendations from unverified sensory data or
rebuild checkout. One persistent bag scene and retained local tea choice make
flow switching comparable. Existing sample and 1 kg pages own the next stage.

## Boundaries

Use current canonical mappings and `oneKilogramProductUrl`. Show no invented
price, availability, scientific claims or final application photography.
Study controls explain the comparison separately from customer copy. Preserve
the existing homepage, studies, four languages, cart and canonical preferences.
Study appearance stays local. No public navigation adoption, deployment or
external writes.

## Verification

Capture the current homepage baseline and each proposed flow on desktop/mobile
in both palettes. Check all three tea destinations, guided intents, Back,
Restart, focus, delayed/failed imagery, reduced motion, four locales and
320/360/390/768/1440 px layouts. Main actions work without waiting for imagery
or animation; selection and the bag remain mounted when the study changes.
Run focused browser/localization checks, `pnpm validate`, then review the diff.

## Implementation

The study has separate Flow, Appearance and Restart controls. The customer
experience beneath them reuses the storefront header, typography, palette
tokens and silver bag scene. Core action labels stay readable immediately.
Product-specific detail appears after an application choice, with one dominant
next action. Shared catalog mappings provide product names, codes and exact
1 kg links; the study adds no commerce rules.

Validated query parameters preserve the flow, appearance, intent, tea and step
when sharing a link, reloading or returning from a product page. The URL owns
that state, avoiding stale initial props after browser Back. Flow changes,
Restart and local appearance changes retain the selected tea and mounted bag.

These are proposed journeys for comparison, not a selected homepage design.
Review Samples first for the shortest initial decision, Application first for
clarity of product purpose, and Guided choice for the value of distinguishing
discovery from direct ordering. Adoption remains a separate owner decision.

## Verification results

- `tests/hero-cx-study.mjs` exercises all three flows in 15 browser profiles:
  widths 320/360/390/768/1440 px, both palettes, English, Japanese and both
  Chinese locales. Phone viewports are 844 px high; tablet/desktop are 900 px.
  These are Chromium emulations, not physical-device or cross-browser tests.
- After mobile spacing changes, all eight affected English/Japanese phone
  profiles passed again. After the history fix, targeted desktop/Japanese
  flow checks and the full navigation/asset/regression checks passed.
- Keyboard focus, Back/Restart, local appearance, retained tea and mounted
  material, query fallbacks, deep links, reload, all three exact 1 kg routes
  and browser Back passed. Cart retention uses isolated read fixtures; the
  harness blocks external requests and writes.
- Slow imagery did not delay sample entry or application choice. Failed-image
  fallback and navigation passed. Reduced-motion profiles passed.
- Canonical homepage captures at 360/390 px are pixel-identical to the original
  baseline; the 1440 px comparison differs by 29 rendering pixels with the same
  geometry and copy. The existing purchase-button study remains independent.
- Visually reviewed representative desktop, mobile, Mist, Blue hour and
  Japanese captures. Evidence is under `.local/hero-cx-study-0222/`; initial
  homepage captures are under `.local/homepage-application-entry-0222/`.
- `pnpm validate` passed: formatting, ESLint, type checking, all 218 unit tests
  and the production build. Final source review found no canonical homepage
  changes. No deployment or production mutation was performed.

The standalone browser harness uses the bundled runtime's Playwright through
`PLAYWRIGHT_MODULE`. `HERO_CX_STUDY_PROFILES` optionally limits its responsive
matrix; the navigation, slow/failed-image and canonical regression checks
still run.
