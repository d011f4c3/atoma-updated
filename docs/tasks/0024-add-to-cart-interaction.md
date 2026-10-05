# Task 0024 — Interactive purchase and rounded buttons

Date: 2026-09-30
Status: Complete

The owner wants Add to cart to be the most attractive and interactive control,
rather than a static button. Refine this one action across standard selection
and the interactive builder, including the shared homepage/Concept 02 flow.

The owner’s final clarification requests only slightly rounded corners on all
buttons. Use a consistent 6px radius, with a 4px inset on the purchase icon.
Preserve the original control hierarchy and quiet text actions. Selection rows
use a subtle background fill without visible borders in dark mode and thin
outlines in light mode, both with 6px corners and a 6px gap. This follows the
owner’s final theme-specific correction.
The capsule/pill redesign was rejected and removed. Keep generous hit targets
and visible keyboard focus without adding new frames to secondary actions.

Use the established IBM Plex Mono, precise linework and both existing themes.
Give the action a distinct material surface, controlled resting motion, a
responsive hover/focus treatment, tactile press feedback and an unmistakable
pending state. Keep the accessible name, full hit area and reduced-motion
support. Unavailable states must remain clearly inactive.

Share the presentation between both buying modes. Preserve existing cart
submission locks, availability rules, errors, reconciliation and confirmed
success drawer behavior. Do not introduce artificial success, delay a request,
or change commerce contracts. No dependency, production write or deployment.

Verify desktop/mobile in both themes, full-control hover, keyboard focus,
press, pending and unavailable states, reduced motion, and layout stability.
Exercise any cart requests with local browser interception only. Run relevant
checks, then `pnpm validate`, and review the scoped diff.

## Delivered and verified

- Shared purchase component in Standard selection and Interactive builder, with
  a responsive surface, hover/focus icon transition, press feedback, and an
  honest disabled pending state tied to the existing cart provider.
- All current storefront buttons use subtle 6px corners. Choice rows have 6px
  gaps: background fills in dark mode and outlines in light mode. Original
  secondary text actions and navigation hierarchy are preserved.
- Browser-reviewed both themes, builder and standard selection, desktop and
  390px/320px widths. Final light standard view has no horizontal overflow at
  320px; purchase target remains 56px high. Confirmed the final theme-specific
  row surfaces, borders, radii and spacing through computed styles.
- Local browser interception verified pending/disabled behavior, duplicate-click
  prevention and rejection recovery. Reduced-motion pending state has no active
  animations. No production cart writes were made. A later intercepted success
  preview was cancelled by a development reload, so it is not claimed as a
  completed success-flow check.
- Added a focused browser regression to `tests/experience.mjs`. Syntax, lint and
  formatting passed; the standalone browser harness was not executed. Browser
  review used the provided CUA session instead.
- `pnpm validate` passed using Node 24.20.0: formatting, ESLint, TypeScript, all
  15 unit tests, and the production build. Reviewed the scoped implementation
  and `git diff --check`; no deployment is included.
