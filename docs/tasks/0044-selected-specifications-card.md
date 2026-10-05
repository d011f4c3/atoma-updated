# Task 0044 — Print specifications on the selected matcha card

Date: 2026-09-30
Status: Complete

Print the selected matcha's seven material properties on the existing paper
card beside the powder in the original homepage Shop experience. Use the same
canonical sample profile as Specifications, update its ink with selection, and
label the illustrative profile clearly. Do not invent measurements or lot data.

Treat the card as a compact specimen sheet with a clear product heading,
aligned property/value rows and restrained rules. Retain format, quantity,
the editable handwritten reference, movement, reset and reduced-motion behavior.
Keep mobile's existing purchase-first flow and the independent Concept 02 card.
Do not change commerce contracts, other concepts or deployment state.

Verify all three selected profiles, both themes, ordinary and short desktop
sizes, reference editing, movement/reset and mobile exclusion. Run the smallest
relevant checks, `pnpm validate`, and review the scoped diff.

## Result and verification

The original homepage's paper now prints the selected name/application and all
seven shared properties in aligned mono rows, with a sample-profile disclosure.
Format, quantity and joined Antro Vectra reference remain beneath the profile.
Selection changes animate the ink without remounting or resetting the card.
Concept 02 retains its order-label layout; homepage phones retain their existing
purchase-first flow without the card.

Verified Culinary, Barista and Premium values; light at 1440×900 and 1366×768;
dark at 1366×768; the longest profile and a 32-character wide reference;
quantity updates; reference editing; keyboard movement/reset; reduced motion;
and the hidden card at 390×844. At 840×390, the desktop Shop has a 660px minimum
height with natural page scrolling, keeping the card at least 224px wide instead
of shrinking it to an unreadable miniature. All printed content stays on paper.
Ordinary desktop sizes remain contained in the viewport.

Scoped source review and `git diff --check` passed. `pnpm validate` passed:
formatting, ESLint, strict TypeScript, 26 unit tests and the production build.
No production cart mutation or deployment.
