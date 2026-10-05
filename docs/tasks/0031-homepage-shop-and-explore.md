# Task 0031 — Homepage hierarchy and Shop / Explore

Date: 2026-09-30
Status: Implemented and visually verified; repository gate blocked by Task 0032

The owner finds the left hero composition awkward and its typography too
similar to the previous treatment. Refine its hierarchy, scale and arrangement
using the approved mono font. The latest correction restores “Carefully” to
mono; retain Antro only in the previously approved small accents and reference.
Preserve the tray geometry,
lighting, themes, entry choreography and responsive product-first composition.

The owner's follow-up and screenshot explicitly target the homepage's existing
Standard selection / Interactive builder tabs, not new navigation or routes.
Rename these Explore / Shop. Shop retains the two-step interactive builder;
Explore lets users choose a matcha and read its material details. Both use the
same selected product and remain in the homepage. The dedicated /shop route
and top navigation retain their current destinations.

The follow-up rejects the oversized, page-scrolling matcha. Keep the homepage
selection within the viewport, contain the full matcha in its stationary left
stage and scroll only the right controls, with mode tabs remaining accessible.
On narrow screens preserve the compact stage and readable stacked flow.
Preserve access to quantity, reference editing and material dialogs.

Use a bounded inline explorer with real catalog content, sample profile
attribution, deeper Material & use and a Shop this matcha action that continues
with the selected product. Preserve reference editing, availability/quantity
rules and all cart contracts. No new APIs, dependencies, production writes or
deployment.

Review the hero and both homepage modes at desktop and mobile sizes, mode
continuity, information access, reference persistence, normal/reduced motion and
the entry/close flow. Update relevant regression expectations, run the full
`pnpm validate` gate and inspect the scoped diff.

## Implementation and verification

- Homepage modes are Explore / Shop. Explore presents each catalog matcha,
  its attributed material profile and Material & use; Shop this matcha opens
  the same selection at quantity. Reference and quantity survive mode changes.
- Refined the hero hierarchy, lowercase mono heading, supporting copy and
  wider entry button. “Carefully” uses the same mono as the rest of the heading.
- Desktop selection uses the available viewport. The matcha scales down in
  Explore, the left stage stays stationary and only the right content scrolls.
  Mode tabs and close remain outside the scroller. Short desktop views also
  constrain the label size. Mobile retains the compact stacked layout.
- Browser checks covered dark/light, 1440×900, 900×600 and 844×390 desktop
  containment, 390×844 mobile flow and 320×568 hero fit. Native wheel input
  advanced only the right panel; page scroll stayed zero and stage bounds stayed
  fixed. Material dialogs, Explore → Shop, reference editing/focus restoration,
  quantity continuity, return to overview and normal/reduced motion were checked.
  A fresh final preview had no browser console errors. Temporary viewport and
  reduced-motion overrides were restored.
- Updated the browser regression cases for homepage modes and right-panel scroll
  isolation, retaining Concept 02's original modes and mobile behavior. Syntax,
  scoped lint and formatting passed; the standalone browser harness was not run.
  Live browser interaction above provides the UI verification for this pass.
- `pnpm test`: all 26 tests passed. `pnpm validate` passed formatting and lint,
  then stopped on `navigation-study.tsx:64`: its new folio/ribbon/dial options
  are not yet included in `NavigationVariant`. These are concurrent Task 0032
  files, left intact. Build was therefore not reached. Scoped TypeScript had
  passed before that separate change appeared. Reviewed the changed UI files,
  regression expectations and `git diff --check` (clean).
