# Task 0017 — Blue backgrounds for the light heroes

Date: 2026-09-29
Status: Complete
Branch: `codex/blue-light-heroes`
Previous checkpoint: `0b53080`

## Scope

Apply Concept 07's silver-blue background (`#c8d4dc`) to `/light` and
`/concept-06/light` only. The owner explicitly clarifies that the dark versions
must remain unchanged. Match light text, linework, and panels to the cool palette
where needed for contrast and consistency. Preserve composition, assets,
interaction, motion, and all other concepts. No dependency or integration work.

## Validation

Check both light routes on desktop and mobile, exact background color, readable
text and hover/selected controls. Review the scoped diff to confirm dark styling
and other concepts are untouched. Run `pnpm validate`.

## Results

Both light routes use `#c8d4dc` with cool dark ink, matching panels and linework.
Main text contrast is 9.38:1 and muted text is 4.72:1 against the base surface.
Desktop and mobile captures were reviewed; 1440×900, 390×844, and 320×568 fit
without overflow or browser errors. The dark homepage and Concept 06 retain
their black backgrounds; source review confirms every CSS change is scoped to
`data-tone="light"`. No layout, interaction, asset, or other concept changes.
`pnpm validate` and final diff checks pass. QA captures remain in `.local/qa/`.
