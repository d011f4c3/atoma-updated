# Task 0081 — Compact hero loader

Date: 2026-10-05
Status: Complete

## Requested outcome

Replace the oversized first-visit loader with a smaller design aligned with the
brand's restrained mono typography and precise linework. Use a centered 192px
readout: small ATOMA wordmark, a fine ticked progress line, Loading and an inline
11px percentage. Remove the viewport header, footer and caption. Retain the
approved light and dark backgrounds.

Keep Task 0079's readiness, session persistence, accessible progress semantics,
reduced motion, timeout and no-JavaScript fallbacks. This is a visual refinement;
do not alter the hero composition, navigation, selection or commerce behavior.
No new dependencies, assets, factual claims or deployment.

Owner follow-up: remove the wordmark. The centered readout now contains only
the progress ticks, Loading/Ready status and percentage; loading behavior and
the accessible progress label stay unchanged.

## Verification

Review loading captures in both themes on desktop and a 320px phone, including
legibility and stable readout width. Run the existing seven hero-loading browser
checks with mocked commerce, then `pnpm validate` and scoped diff review.

## Result

- Replaced the large display percentage and viewport framing with a 192px
  centered readout. The ATOMA wordmark is 14px; the status and percentage use
  the site's 11px IBM Plex Mono support scale.
- A fixed series of fine ticks fills with progress. The inline number stays
  aligned through 100%; both approved backgrounds and the final fade remain.
- Reviewed desktop light and 320px dark captures in `.local/qa/compact-loader/`.
  All seven existing browser checks pass, including readiness, keyboard access,
  session reuse, reduced motion and failure recovery. The loading hook is unchanged.
- `pnpm validate` passes formatting, lint, strict types, all 63 unit tests and
  the production build. Scoped diffs and `git diff --check` reviewed. No live
  commerce writes or deployment.
