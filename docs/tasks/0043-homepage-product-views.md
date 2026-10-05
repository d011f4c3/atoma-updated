# Task 0043 — Homepage product views

Date: 2026-09-30
Status: Complete

Bring Overview, Specifications, Origins and Shop into the existing homepage,
replacing its Explore / Shop switch. Preserve the tray entry, powder stage,
interactive label in Shop, current typography, both themes and purchase flow.
Keep the numbered concepts available for comparison.

The owner's follow-up asks to retain the previous roundness. Preserve the
accepted subtle 6px button/control corners from Task 0024 in all homepage views.
Restore the same corners on the regular shop so the two purchase entrances stay
consistent.

Reuse the focused Concept 08 seven-row Specifications component. All seven
properties should fit together at ordinary desktop and phone sizes; explanations
open on demand. On phones, Specifications and Origins use the stage space for
their information instead of stacking below the large photograph. Overview
retains the product image and grade selection.

Maintain product, format, quantity and personal reference through view and theme
changes. Origins also includes the people behind the material, with explicit
unpublished states until reviewed information is available. Preserve sample
profile disclosures, actual catalog availability, existing cart contracts and
the separate Concept 02 selection modes. No fabricated provenance or deployment.

Verify both themes at 1440×900, 1366×768, 390×844 and 320×700, including the
tray handoff, four-view navigation, specification fit and explanation focus,
selection continuity and mocked cart behavior. Run relevant browser checks,
`pnpm validate` and scoped diff review.

## Result and verification

The tray now opens Overview, with four quiet text controls in its existing
panel. Specifications reuses the focused seven-row profile and native
explanations; Origins includes explicit unpublished origin and people states.
Shop retains the animated label and established purchase controls. Product,
format, quantity and reference stay in the same selection owner. Both themes
use the same view state. The previous 6px corners are restored.

- All eight homepage theme/viewport checks passed at 1440×900, 1366×768,
  390×844 and 320×700. All seven specifications, heading and sample note fit
  together. Verified view/theme continuity, desktop reference editing,
  modal focus and theme, and pending guards with mocked cart submissions.
- Visual review covered all four views and tray entry in both themes at
  1366×768, 390×844 and 320×700. Small spacing adjustments prevent the
  specification note and phone footer from extending outside the view without
  reducing text or button target sizes. Overview and Shop retain their existing
  natural mobile scrolling; Specifications and Origins replace the large stage.
- The four existing focused Concept 08 viewport checks also passed. One initial
  390px load timeout during concurrent development passed on an isolated rerun.
- Seven relevant legacy handoff and standalone Concept 02 checks passed,
  including cold/reopened entry and fallback readiness. Existing purchase tests
  now enter Shop explicitly; reference tests use the retained caption entry.
- `pnpm validate` passed, including formatting, ESLint, strict TypeScript,
  all 26 unit tests and the production build. Scoped source review and
  `git diff --check` passed. No production cart requests or deployment.

Screenshots are in `.local/qa/homepage-views/` and
`.local/qa/homepage-views-visual/`. Validation log:
`.local/qa/homepage-views-validation.log`.
