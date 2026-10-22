# Task 0242 — Restore a compact visual rhythm to the sixth page

Date: 2026-10-21
Status: Implemented and verified locally

## Authority and interpretation

The owner rejects the first `/new-hero6` layout as worse than the preceding
direction. Revise the sixth page in place, using the fifth page's compact
application cards as the reference. The interpretation is that long repeated
product rows and split form panels diluted the approved hero's visual character.
The owner has not specified a new visual direction; keep this revision bounded.

## Scope

- Preserve the approved shared hero, its contained gradient and both palettes.
- Remove the extra section directory and restore a side-by-side three-card
  comparison using the existing gallery presentation and commerce controls.
- Make the Sample Set an open, compact band with three named 20 g contents,
  inline ordering and optional pouch inspection. Remove repeated codes here.
- Pair one landscape origin photo with a short supported Ceremonial/Wazuka
  note. Remove the generic second profile paragraph and redundant headings.
- End with a concise three-link repeat-order strip and exact named 1 kg routes.
- Retain all native anchors, cart guards, selection memory, image fallbacks,
  reader return, rounded images/buttons, keyboard access and enlarged text.
- Leave `/new-hero5`, the shared hero, earlier routes and commerce authority
  unchanged. Save the prior sixth-page source under `.local/new-hero-0242/before`.
  No new facts, assets, dependencies, production writes or deployment.

## Verification

Review the revised composition in both themes at desktop and phone sizes.
Verify the gallery, inline sample ordering, selection/history, reader return,
exact repeat links, failures and pending controls with isolated fixtures.
Check 320 px with 200% text and compare hero geometry against the approved
version. Run `pnpm validate` and review the final scoped diff.

## Implementation

- The sixth page now reuses the fifth page's aligned gallery cards. The extra
  directory and three separate full-width product rows are removed. Hero markup,
  styles and every product selection/cart handler are unchanged.
- The Sample Set is an open band: pouches, concise contents and ordering share
  one desktop row. Phones retain contents and purchase controls before the
  optional imagery. Product names and 20 g quantities remain visible without
  repeating all three codes from the comparison immediately above.
- Origin becomes a single landscape image with the existing supported Wazuka
  note and reader action. The second generic profile block is removed. Repeat
  orders use three equal links below a short introduction.
- All styles are scoped to the sixth page. The fifth page and shared gallery
  component are unchanged. Desktop and phone captures in both palettes were
  visually reviewed; evidence is in `.local/new-hero-0242/`.

## Browser results

- `tests/new-hero6.mjs` passes all ten viewport/theme/locale profiles and the
  complete selection, history, fixture-cart, reader, pending/error, keyboard and
  image-failure checks. A 320 px phone with 200% text retains readable controls.
- First-view and primary action geometry remain exactly unchanged across all
  ten profiles. Photo clipping is 12 px and boxed controls use the hero's 6 px
  radius. No live commerce writes occurred.
- Same-fixture captures show the 1440 px page reduced from 5323 to 3930 px in
  both themes: the application section from 1631 to 926 px and Sample Set from
  782 to 485 px. At 390 px the page is 6490 px, down from 7552 px. This measures
  the intended compactness; it does not establish owner design approval.
- `pnpm validate` passes formatting, lint, TypeScript, all 238 unit tests and
  the production build. Final scoped diff and whitespace checks pass. No
  deployment was performed. Log: `.local/new-hero-0242/validate.log`.
