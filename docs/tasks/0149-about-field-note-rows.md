# Task 0149 — Recompose About field notes

Date: 2026-10-13
Status: Complete — actual shoot photographs pending

## Authority and scope

The owner dislikes the View story controls and the arrangement of the About
field-note section and requests a new approach. Replace the staggered cards with
two calm photographic rows: a broad image beside a compact text column, a small
numbered category and a title that opens the focused reader. Remove image-overlay
buttons. Keep the approved opening, principles, canonical navigation, themes,
locales and the existing story readers.

Actual shoot photographs remain pending. Keep archive placeholder labels and do
not introduce new factual or equipment claims. No deployment.

## Verification

Review desktop, tablet and mobile photography crops and text balance in both
themes. Check all locales, keyboard/story entry, reader focus and dismissal,
overflow, reduced motion and no-JavaScript reading. Run the relevant browser
checks, `pnpm validate` and scoped diff review.

## Result

The staggered cards and photo-overlay controls have been replaced by two aligned
rows. Each broad photograph sits beside a compact numbered entry. The story title
is the reader entrance, with a small arrow and restrained hover/focus underline.
On phones, each image leads directly into its caption and text. The existing type
scale and exact approach copy remain unchanged.

Desktop, tablet and phone crops were reviewed visually. All 16 localized
canonical scenarios pass, including 44px title targets separated from photography.
The 768px and 390px checks pass in both themes, including reader keyboard/touch
dismissal and focus/scroll return. No-JavaScript, reduced-motion and legacy-route
checks pass. Test synchronization now waits for Cart's asynchronous focus return
before moving to the next navigation control; behavior checks remain intact.
`pnpm validate` passes formatting, lint, types, all 132 unit tests and the build.
Evidence is local under `.local/about-field-rows-0149/`.
