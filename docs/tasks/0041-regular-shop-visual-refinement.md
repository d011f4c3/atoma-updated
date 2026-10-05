# Task 0041 — Refine the regular-site shop

Date: 2026-09-30
Status: Complete

The owner says the regular site's shop feels like a Shopify/Squarespace template
and that typography and scale feel wrong. Concept 04 was explicitly excluded
from this criticism. Improve the regular shop's visual hierarchy, composition,
spacing and purchase treatment while retaining its established interactions.

The follow-up question distinguishing the homepage Shop from the dedicated
`/shop` page received no answer while independent Concept 04 work continued.
The stated working assumption is to polish both regular-site entrances for
consistency. Preserve the photographic assets, real catalog/cart, quantity and
availability constraints, desktop fixed imagery/right-panel scrolling, mobile
single-flow purchasing and dedicated-shop native swiping and hover purchase
reveal. Keep desktop references and mobile reference exclusion intact.

Use the approved mono family with coherent product/control/metadata scales.
Make handwritten purpose text subordinate to product names. Reduce repeated
boxed surfaces and strengthen the relationship between material imagery and
selection. Scope configurator changes to embedded homepage use. No shared
commerce changes, dependencies, new assets or deployment.

The owner's latest screenshot explicitly requests hiding the “Add reference /
Personalize your label” button on desktop. Hide that embedded entry at widths
above 760px, retaining other desktop label interactions and the existing mobile
reference exclusion.

The owner also requests the original homepage headline “A closer look at
matcha” and less meta supporting copy. The latest clarification calls for the
client's laboratory/scientific precision. Use “Flavour. Texture. Performance.
Matcha selected for a specific application.” This describes selection criteria
without inventing laboratory testing, measurements or certification. Preserve
the current mono treatment and entry interaction in both themes.

Validate both themes at desktop and phone sizes, keyboard/touch purchase entry,
selection and quantity continuity, pending guards and reduced motion. Run
scoped checks and `pnpm validate`, then review changed files.

## Delivered and verified

- Dedicated Shop uses a connected material composition, 18–22px product names,
  subordinate handwriting and clearer 10–11px labels. Its compact cards,
  bottom purchase reveal, keyboard dismissal and mobile carousel remain intact.
- The embedded shop has coherent typography and quieter purchase grouping.
  Consolidated mobile rules preserve the independent study styles. Short
  desktop quantity views keep Add to cart visible with 44px control targets.
- The requested reference entry is `display: none` on desktop in both themes;
  the live label and its other reference controls remain available.
- Original homepage copy now reads “A closer look at matcha.” with the
  precise subtext above. Reviewed the revised phone headline wrapping.
- CUA review covered 1440×900 and 1366×768 desktop, plus 390×844 phone layouts,
  light/dark styling, purchase reveal/close/focus return, desktop reference
  exclusion, and visible Add at laptop height. No live cart mutation was made.
- Reviewed dedicated Shop changes against `/tmp/atoma-shop-0041/` and embedded
  CSS against `/tmp/atoma-home-shop-0041.css`. Scoped format and diff checks pass.
- Final checks passed: formatting, ESLint, strict TypeScript, all 26 unit tests
  and production build. A concurrent build briefly held the build lock; the
  standalone build rerun completed successfully after it finished.
