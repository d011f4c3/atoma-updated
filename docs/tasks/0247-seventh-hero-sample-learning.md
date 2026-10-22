# Task 0247 — Learn about each matcha before ordering the Sample Set

Date: 2026-10-21
Status: Complete

## Scope

The owner likes the improved visual presentation but identifies a missing core
use case: learning about each matcha on the Sample Set view before purchase.

- Make the three included-matcha cards open a readable product profile in place.
- Reuse canonical editorial summaries, seven sensory values and preparation
  guidance. Keep their illustrative status explicit; add no unsupported facts.
- Keep the all-three, 3 × 20 g set clear. Reading a product never alters the set
  or resets its price, quantity, cart or selected format.
- Connect the reader directly to the existing set order controls and to that
  exact matcha's larger formats through the current in-place navigation.
- Preserve the approved card design, palettes, hero, dedicated route fallback,
  keyboard access, mobile reading and earlier concepts.

## Verification

Use isolated browser fixtures to read all three distinct profiles, switch and
close with keyboard, reach set purchase and exact product controls, retain set
quantity, and check pending locks and unavailable catalog behavior. Review both
palettes on desktop/mobile and enlarged text. Run focused checks, `pnpm validate`
and review the scoped diff. No production writes or deployment.

## Implementation and results

- Each included-matcha card now has an explicit Read profile action. It opens
  one inline reader in the foil visual's place; closing restores that visual.
  The reader uses canonical product summaries, all seven sensory values and
  preparation/tasting guidance, with the existing illustrative-profile label.
- All-three contents remain explicit. Opening, switching and closing profiles
  does not change the mounted Sample Set offer or quantity. The reader's order
  action focuses the real set purchase; its larger-format action enters the
  exact matcha through the existing in-place navigation.
- Reader opening focuses its heading and brings the text into view. Closing
  returns focus to its card. Card layout adapts to the available text space,
  including enlarged Japanese text, while purchase controls stay accessible.
- The new focused browser suite passes all three profiles and preparations,
  keyboard focus, retained quantity, order handoff, matching-product navigation
  and Back, isolated cart writes/duplicate prevention, pending/review guards,
  catalog-unavailable reading, narrow/enlarged layouts and the dedicated route.
- Reviewed desktop/mobile captures in both palettes, plus Japanese at 1100 px
  with 200% text and Traditional Chinese on phone. Final browser checks report
  no clipped controls, overlaps, client errors or live commerce writes.
- Final `pnpm validate` passed formatting, lint, types, all 238 unit tests and
  the production build. Scoped source/translation changes and whitespace were
  reviewed. Evidence remains in `.local/new-hero-0247/`; browsers are closed.
