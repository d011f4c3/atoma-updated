# Task 0077 — Refine the mobile material composition

## Approved brief

The owner requests another mobile design pass: the Shop bag feels too large and
the powder-only hero needs a more attractive composition. Apply the refinement
to the adopted homepage and shared product exploration.

## Scope

- Refine mobile powder scale, orientation, spacing and hero typography using
  the existing visual system and copy. Keep the powder-only opening.
- Reduce the Shop bag and powder stage so product/order controls sit higher.
  Preserve the bag-only-in-Shop behavior and hidden personalization.
- Retain desktop, existing themes, Ceremonial naming, selection/cart state,
  navigation, reduced-motion behavior and the original paper component.
- Use scoped mobile CSS; no new dependencies, assets, claims or production work.

## Validation

Visually review mobile hero and Shop at 390×844 and a short 375×667 viewport,
both themes, and check a desktop regression view. Verify selection, Shop entry,
quantity and back navigation. Run relevant formatting checks, `pnpm validate`,
then review the scoped diff and save mobile screenshots.

## Result and verification

- The mobile hero puts the heading and separated supporting copy above a
  diagonal powder composition, with a dedicated lower call to action. A shorter
  viewport adjustment keeps the powder legible without clipping.
- The mobile Shop stage is approximately 243px tall at 390px width. The bag is
  about a third shorter, allowing the purchase controls to fit within the
  390×844 viewport.
- Reviewed 390×844 and 375×667 layouts, light and dark themes, and the desktop
  Shop layout. Verified product selection, Shop entry, quantity changes and back
  navigation. No cart or production writes were performed.
- `pnpm validate` passed formatting, lint, types, all 63 tests and the production
  build. Reviewed both CSS diffs against their pre-task copies; changes remain
  scoped to mobile. `git diff --check` passed.
- Saved [mobile hero](../design/mobile-hero-0077.png) and
  [mobile Shop](../design/mobile-shop-0077.png) screenshots.
