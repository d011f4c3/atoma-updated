# Task 0012 — Main homepage field and square navigation refinement

Date: 2026-09-28
Status: Complete
Branch: `codex/homepage-grid-refinement`
Saved homepage baseline: `ca2b63d37b25` / `homepage-checkpoint-02`
Preserved Concept 04: `50a352cc4fa7` / `hero-concept-04`

## Authorized direction

The owner requests a refinement to the main homepage at `/` while keeping
Concept 04 unchanged. Add the curved spatial grid only on the right, behind
the matcha tray. Keep the main homepage's square navigation styling and give
it a more deliberate treatment. The left headline area should remain clear
of the curved field.

Preserve the client-led product-first presentation, the overhead tray, the
“Carefully specified matcha.” heading, Fraktion Sans/Mono, pure black, and the
single-viewport composition. The request remains a local hero design task.

## Bounded implementation

- Update only the main homepage's `SpecimenHero` and its styling for the
  visual implementation. Reuse the existing original `SpecimenField` without
  altering the shared component or its other concept placements.
- Place and clip the curved field inside the right-side image stage, behind
  the tray. Keep the left copy, header, and footer free of that background grid.
- Preserve the square header shape. Refine the current section and Explore
  presentation with outlines, restrained corner accents, and hover character
  resolution. Do not replace it with the rounded capsule from Concept 04.
- Retain the existing unlinked Explore matcha presentation and hover cue.
  Header treatments remain display styling where no destination exists; do not
  add dead links, click actions, fake menus, or a detail screen.
- Keep native pointer visibility, touch readability, the current motion
  direction, and live system reduced-motion support. Do not restore a custom
  motion toggle.

## Preservation and boundaries

Concept 04 at `/concept-04` must remain unchanged from its checkpoint. Preserve
Concept 03, both saved homepage checkpoints, existing fonts, and the reserved
blue-to-bone product-page gradient. Do not change the sibling storefronts.

No new imagery, dependencies, catalog data, Shopify integration, commerce
behavior, production changes, deployment, or additional sections are in scope.
The generated tray is still an illustrative material study, not approved
packaging or evidence of an available product or scientific claim.

## Required validation

- Review desktop, mobile, and short landscape layouts for a single-viewport
  fit, typography, tray prominence, and header spacing.
- Verify the field remains entirely inside the right-side image stage and does
  not appear behind the left headline, header, or footer.
- Check header hover text resolution and the retained image exploration cue,
  including pointer exit, touch behavior, and live reduced-motion changes.
- Confirm Explore matcha stays unlinked and no unintended focusable or
  navigational control is introduced.
- Check browser runtime errors and image loading.
- Compare Concept 04 and shared concept assets/components against
  `50a352cc4fa7` to confirm they remain unchanged.
- Run `pnpm validate` and review the final diff before handoff.

## Result

Implemented the field only inside the tray stage and refined the square header.
Explore remains unlinked. Header text replays once on hover and settles, with
stable pointer targets while glyphs update.

Validation passed: `pnpm validate`; browser checks at 1440×900, 768×1024,
390×844, 320×568, 844×390, and 568×320; no document overflow or runtime errors.
Verified image loading, field bounds/clipping, square corners, hover text
resolution without retriggering, pointer cue bounds/reset, touch fallback, and
live reduced motion. Desktop/mobile/landscape screenshots and final source diff
were reviewed. Concept04 and shared components are unchanged from `50a352cc4fa7`.

The owner subsequently requests a separate final comparison hero; this homepage
is preserved before that exploration.
