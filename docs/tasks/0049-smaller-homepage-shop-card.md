# Task 0049 — Smaller homepage shop card

Date: 2026-09-30
Status: Complete

Make the paper card a little smaller in the homepage Shop view in both themes.
Reduce its regular desktop width by approximately 10% and its expanded editing
width proportionately, retaining the established readable minimum sizes. Keep
the paper content, typography, drag/reset behavior, lighting and selection
state. Preserve the phone purchase layout and standalone Concept 02 card.

Use only a scoped CSS adjustment; no new behavior, assets or dependencies.
Review desktop sizing and content fit in both themes, mobile exclusion and the
standalone card. Run scoped formatting, `pnpm validate` and final diff review.

## Implementation and verification

The desktop embedded card now uses `clamp(14rem, 16vw, 15rem)` in its normal
state and `clamp(17rem, 20vw, 18rem)` while editing. The minimum readable widths
remain 224px and 272px. The powder, card position, content and motion are
unchanged; the adjustment is limited to the embedded desktop presentation.

Scoped formatting and diff review passed. `pnpm validate` passes formatting,
ESLint, strict TypeScript, all 50 unit tests and the production build.

Visual review passed both themes at 1440×900 and 1366×768. Normal widths are
230px and 224px respectively, approximately 10% smaller. All three profiles
and a 32-character reference fit on the paper, and drag/reset still work.
The card stays hidden in the 390px phone purchase layout; standalone Concept 02
retains its previous width. Captures and validation log:
`.local/qa/homepage-card-size/`.
