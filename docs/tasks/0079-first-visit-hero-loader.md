# Task 0079 — First-visit hero loader

Date: 2026-10-05
Status: Complete

## Requested outcome

Add a beautiful, restrained rising percentage while the first homepage hero
loads. Use ATOMA's mono typography, fine linework, wordmark and approved light
or dark palette. Finish with a brief dissolve into the existing hero.

Gate completion on the visible hero image or its existing fallback and required
type. Treat intermediate progress as an estimate; show 100 only once ready.
Keep the hero mounted and keep loading independent of commerce requests. The
introduction runs on the first normal homepage visit in a browser session;
remember successful completion with a session cookie so subsequent page loads
and navigation omit it. Direct product selections and saved studies bypass it.

Keep keyboard controls inert while covered, avoid announcing every percentage,
respect reduced motion, and provide bounded font/asset fallbacks. Failed or
stalled requests and disabled JavaScript must not permanently cover the site.
Preserve the current product composition, Panorama, theme switch and commerce
contracts. No new dependencies, assets or deployment.

## Verification

Check delayed hero loading and monotonic progress, readiness and transition,
both themes, desktop/mobile, reduced motion, keyboard access, image/font errors,
timeout, session reuse, direct selections and saved-study isolation. Mock all
commerce. Run `pnpm validate`, review screenshots and the scoped diff.

## Result

- Added a full-screen percentage, ATOMA wordmark and fine progress line using
  the active theme. Readiness completes the count at 100 before a soft fade.
- A session cookie and client memory skip repeat introductions. The hero remains
  mounted; keyboard controls are available as soon as the overlay leaves.
- Reduced motion uses readiness milestones without animation. Failed images use
  the existing fallback; stalled requests release the overlay after six seconds
  without falsely reporting completion. Disabled JavaScript hides the overlay.
- All seven mocked browser cases in `tests/hero-loading.mjs` pass. Reviewed
  desktop light, 320-pixel dark, fallback and no-JavaScript screenshots in
  `.local/qa/hero-loading/`.
- `pnpm validate` passed formatting, lint, strict types, all 63 unit tests and
  the production build. Reviewed the scoped diff and `git diff --check`.
  No live commerce writes or deployment.
