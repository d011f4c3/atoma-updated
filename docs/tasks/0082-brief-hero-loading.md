# Task 0082 — Brief loading on each homepage entrance

Date: 2026-10-05
Status: Complete

## Requested outcome

The owner wants the compact loader to appear briefly while the hero loads and
explicitly selected every fresh homepage load. This supersedes Task 0079's
first-visit/session restriction. Retain Task 0081's follow-up removal of the
wordmark: only ticks, Loading/Ready and the percentage remain visible.

Remove the seen-cookie and in-memory session gate. Show the loader on each new
homepage hero mount; keep in-place section changes and Origins returns continuous.
Use a 400ms minimum, 100ms completion hold and existing fade, about 740ms after
hydration when assets are ready. Slower assets still gate completion. Preserve
reduced motion, accessible progress, image/font fallbacks and bounded timeouts.
Direct product selections and saved studies still bypass the opening hero.
No new dependencies, assets, commerce writes or deployment.

## Verification

Update existing browser checks to verify reload/re-entry despite a legacy seen
cookie, brief warmed-load timing and no in-place replay. Retain checks for real
readiness, themes/mobile, focus, reduced motion, stalled/failed assets and disabled
JavaScript. Run `pnpm validate`, inspect screenshots and review scoped diffs.

## Result

- Every fresh homepage entrance now includes the loader, including refreshes
  with the old seen-cookie still present. No session cookie or memory flag
  suppresses it. In-place theme/product changes do not replay the introduction.
- Fast loads use approximately 740ms from hydration through removal. Readiness
  still gates 100%; reduced motion skips the minimum and completion delay.
- The wordmark and its unused styles are removed. Reviewed the compact tick
  line, status and percentage in desktop light and 320px dark captures under
  `.local/qa/brief-hero-loader/`.
- All seven browser cases pass, including warmed reload/re-entry timing,
  legacy-cookie handling, actual hero-image delays, failures, timeouts, keyboard
  access and no JavaScript. Tests target the current visible hero photograph.
- `pnpm validate` passes formatting, lint, strict types, all 63 unit tests and
  the production build. Scoped diffs and `git diff --check` reviewed. No live
  commerce writes or deployment.
