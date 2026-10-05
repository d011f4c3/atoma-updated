# Task 0081 — Refine the hero package

## Approved brief

Make the hero bag more visually distinctive and a little larger, with a design
that can differ from Shop. The follow-up asks for a more realistic result that
better matches the supplied product photograph.

The owner prefers the first generated bag's straight silhouette, the second
bag's top and lighting, and asks for stronger light/shadow contrast. Combine
those qualities. Replace the rejected vertical logo with the existing horizontal
ATOMA wordmark treatment.

## Scope

- Create a separate photographic hero pouch from the owner's silver packaging
  reference, retaining natural foil volume, folds and reflections.
- Add a sparse, editable hero print variant. Preserve the detailed Shop package.
- Increase hero scale approximately 10–15%, with room around the mobile CTA.
- Apply identical appearance to the hero's transition clone; retain image
  readiness, first-visit loading, bag-to-powder flow and reduced motion.
- No new claims, dependencies, commerce behavior or production changes.

## Validation

Review hero on desktop, 390px and short 375px phones in both themes. Check
Explore and Shop, confirming the hero print stays stable through the dissolve
and Shop retains its detailed layout. Run relevant formatting, `pnpm validate`,
review scoped diffs and save the hero previews. Preserve generated alpha and
record the selected asset and generation prompt.

## Result and verification

- Adopted a separate transparent hero photograph combining the requested straight
  silhouette, flatter zipper/top and stronger foil lighting. The PNG retains
  its generated alpha. [Asset provenance and prompts](../references/hero-bag-photography.md).
- Added a hero-only editable print with the existing horizontal ATOMA wordmark
  treatment, a fine rule and small selected-product text. Shop's photographic
  asset, specifications and label remain unchanged.
- Reduced hero insets from 8%/14% to 3%/10%, increasing the visible bag by
  approximately 12%. The same appearance is used by the handoff clone.
- Reviewed desktop 1280×800, mobile 390×844 and short 375×667, light and dark
  treatments, Explore/powder and Shop. The smaller phone retains CTA clearance.
  Existing readiness callbacks and reduced-motion rules remain intact.
- `pnpm validate` passed formatting, lint, types, all 63 tests and the production
  build. Updated the loader browser fixture's asset match to the new hero file;
  its standalone browser suite was not rerun in this task. Reviewed all scoped
  diffs and `git diff --check`. No commerce writes or deployment.
- Saved [mobile](../design/hero-package-mobile-0081.png) and
  [desktop](../design/hero-package-desktop-0081.png) previews.
