# Task 0226 — Connect tasting notes to the named 1 kg tea

Date: 2026-10-20
Status: Implemented and verified locally

## Scope

Fourth client-feedback work group, following Task 0225 and F08 in Task 0221.
Add named “View 1 kg of …” links to the selected tasting editor, each compared
tea, the next-order selection and the saved Shop choice. Reuse canonical exact-pack destinations.
Viewing a product must never add it to cart or silently choose another tea.

Preserve unsaved drafts, selected tea, comparison pair/view and next-order
choice across local navigation in a root in-memory provider. Keep saved notes
and favourites on their existing explicit Save/Clear device-storage paths.
No automatic saving, account sync, tasting analytics or external sharing.
Keep storage failures usable and personal notes separate from product facts.
Use existing four-locale translations, themes and native guarded links.

## Verification

Exercise all three named destinations, compare/editor navigation and Back with
unsaved drafts. Verify Save, reload, Clear, storage-failure fallback, selection
continuity, exact 1 kg resolution and unchanged cart. Check mobile and keyboard
actions. Use isolated commerce reads with writes blocked; run focused behavior
checks, `pnpm validate`, visual review and final diff review. No deployment.

## Result

Editor, comparison, next-order and saved-Shop links name their tea and use its
exact 1 kg destination. A root memory provider retains drafts and navigation
choices across local routes; existing explicit device Save/Clear remains intact.

- Browser checks passed at 1440 light English, 390 dark English and 390 light
  Japanese, plus a 320 px comparison check. Evidence is in
  `.local/client-feedback-0226/after`.
- All three tea links, exact format, notes/recipe/selection, comparison pair,
  next-order choice, browser Back and unchanged cart passed.
- Explicit Save/reload/Clear and blocked-storage feedback/memory passed.
  Viewing teas neither writes notes to storage nor mutates commerce.
- `pnpm validate` passed formatting, lint, strict types, all 233 unit tests and
  the production build. Representative mobile layouts and final diff reviewed.
