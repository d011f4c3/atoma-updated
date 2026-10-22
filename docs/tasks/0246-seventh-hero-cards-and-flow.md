# Task 0246 — Refine the seventh concept's cards and next steps

Date: 2026-10-21
Status: Complete

## Scope

The owner wants the views after the hero to feel prettier, especially the cards
and the user flow. Refine `/new-hero7` Matcha, Samples, Origins and Wholesale as
focused, connected views within the existing experience.

- Give the application cards an image-first composition and calmer, clearly
  grouped commerce controls through a new opt-in presentation.
- Make the Sample Set entrance prominent, add direct application navigation on
  smaller screens, and connect samples and origin reading to useful next steps.
- Unify wholesale imagery, product identity and exact 1 kg actions into cards.
- Refine sample contents and origin presentation using existing facts and assets.
- Preserve the approved hero, contained gradient, palettes, rounded controls,
  image labels, URL/history behavior, selections and real commerce contracts.
- Keep earlier concepts unchanged. No release, new service, dependency or live
  commerce mutation is included.

## Verification

Review desktop and phone layouts in both themes, including narrow screens and
enlarged text. Exercise contextual links, application focus/history, retained
quantities and existing commerce handoffs with local fixtures. Run the smallest
relevant browser checks, `pnpm validate`, and review the scoped diff. Evidence
stays local under `.local/new-hero-0246/`.

## Implementation and results

- Added an opt-in `showcase` treatment for seventh-concept product cards:
  rounded application photography, clearer identity and grouped visible buying
  controls. Earlier card presentations and commerce handlers are preserved.
- Matcha now has a prominent Sample Set action and mobile application shortcuts
  that use the existing URL, focus and history behavior.
- Samples presents the three included products with applications, powder
  thumbnails, codes and weights. The order panel remains before the larger foil
  visual on phones. Contextual actions connect comparison and repeat ordering.
- Origins has a distinct Wazuka record, a local Ceremonial product entrance and
  a Sample Set continuation. Wholesale uses unified image/product cards with
  one exact named 1 kg destination each.
- Reviewed all views at desktop and phone sizes in Mist and Blue hour. Focused
  browser checks passed English, Japanese and Traditional Chinese profiles,
  retained formats/quantities, application focus/history, in-place contextual
  navigation and pending-order guards. No live commerce writes were made.
- Added a compact contextual-flow regression to the existing in-place browser
  suite; its full behavior run passed. Enlarged-text review passed at 320 px and
  at 1100 px after replacing overlapping sample weights with grid placement.
- Final `pnpm validate` passed formatting, lint, type checking, all 238 unit
  tests and the production build. The scoped changes and `git diff --check`
  were reviewed. Browser contexts were closed after verification.
