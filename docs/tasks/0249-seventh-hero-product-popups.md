# Task 0249 — Application popups and immediate desktop content

Date: 2026-10-22
Status: Complete

## Scope

The owner rejects the application's jumping selection flow and asks for a popup,
with tap-to-learn interaction on mobile. Further feedback asks for useful content
to be visible immediately on both desktop application and Sample Set views.

- Present stable photographic application cards with explicit Learn more actions.
  Open product information and existing purchase controls in an inset native
  dialog, preserving background position, order state and keyboard focus return.
- Support Close, Escape and deliberate backdrop taps, internally scrolling
  content and visible close controls. Retain pending commerce guards and nested
  cart behavior. Keep URL entries, Back/Forward and Sample Set product handoffs.
- Remove application-only page scrolling/focus jumps from the in-place shell.
- Compact desktop application and Sample Set layouts to bring the actual choices
  and sample purchase controls into the first view. Preserve mobile readability,
  approved hero, themes, rounded images/controls, labels and earlier concepts.
- No new dependencies, claims, commerce integration, deployment or live writes.

## Verification

Use isolated browser fixtures to exercise card taps, all dismissal paths, focus,
unchanged background geometry/scroll, deep links, browser history, retained
profiles/orders, catalog failure and nested cart/pending guards. Check desktop
content visibility and mobile insets, themes, keyboard use and enlarged text.
Run the relevant browser suites, `pnpm validate` and review the scoped diff.

## Implementation and results

- Replaced the inline selection with three photographic cards and translated
  Learn more actions. One native product dialog retains all purchase forms and
  profile disclosures; closing restores the selected card without moving it.
- Application-only history changes no longer invoke shell focus or page scroll.
  Direct entries close to the gallery; card-opened entries support Back/Forward.
  A root-only scroll lock works independently of the cart's body lock. Forward
  defers opening product details while the cart remains active above the page.
- Desktop application choices fit the first view. The Sample Set uses a shorter
  introduction, tighter cards/columns and a compact complete foil presentation;
  all three included matcha and actual price, quantity and Add are visible at
  1440×900. Reviewed 1100 px and Japanese dark; mobile Sample Set is unchanged.
- Full application browser suite passes six viewport/theme/locale profiles and
  behavior checks: stable card geometry and scroll, all dismissal paths, focus,
  deep entries, query/hash history, retained profiles/orders, catalog failures,
  pending guards, fixture purchases and nested cart Back/Forward. Sample learning
  and exact-product popup handoffs pass. No live commerce writes or client errors.
- Verified 320 px with 200% text, including popup width and persistent Close.
  Small popup headers omit the redundant application label to keep Close clear;
  the dialog's accessible name and product heading retain the complete identity.
- `pnpm validate` passed formatting, lint, strict types, all 238 unit tests and
  the production build. Scoped diffs and whitespace reviewed.
- Local evidence: `.local/new-hero-0249/final/`, `behavior-final/`,
  `sample-learning/`, `sample-compact/`, `visual/` and `validate.log`.
