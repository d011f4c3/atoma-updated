# Task 0255 — A dedicated mobile homepage

Date: 2026-10-22
Status: Complete

## Direction

The owner rejects the phone homepage as a scaled desktop layout and requests a
custom mobile experience and hero. Replace the canonical phone composition with
one substantial application preview, deliberate touch selection, immediate
product learning in a popup and a clear Sample Set action. Follow with compact,
image-led mobile sections instead of transposing the desktop columns.

Keep the approved desktop homepage and saved studies, IBM Plex Mono, Mist and
Blue hour palettes, contained gradient, loader/entrance and interaction effects.
Retain the approved positioning, canonical product facts/codes, existing sample
and product commerce, history, focus, scroll and reduced-motion behavior. Keep
canonical pages independent. No new dependencies, asset generation or release.

## Verification

Review screenshots at small, standard and large phone sizes, short landscape,
both palettes and English/Japanese. Exercise touch/keyboard application
selection, popup dismissal and return, sample entry, enlarged text and motion.
Compare desktop and saved-study presentation against pre-edit captures. Use
isolated commerce fixtures, then run `pnpm validate` and review the task diff.

## Implemented

- Added a canonical phone hero with one large floating application at a time,
  explicit Tea service / Lattes / Recipes selectors and a fixed preview area.
  The existing transparent artwork is cropped in CSS without changing assets.
- Kept the approved positioning and light supporting type. The selected matcha
  has its canonical name/code and a clear learning action; Sample Set and
  application browsing remain directly available. Japanese breaks at a phrase
  boundary; enlarged controls and product information reflow naturally.
- Product learning opens the existing native dialog over the hero. Local
  selection, scroll and the exact trigger survive dismissal; history restores
  the corresponding preview. Keyboard arrows and Home/End select applications.
- Replaced the phone's desktop section stack with a floating Sample Set
  invitation, photo-first Origins feature and a compact linked order sequence.
- Preserved real purchasing and independent canonical pages. Desktop and study
  presentation remain separate; hidden desktop content never hides the modal.
  Loading and focus restoration now target the visible responsive heading.

## Browser evidence

- `.local/mobile-0255/before/` and `final/`: reviewed before/after captures at
  320, 390 and 430 px, dark/light and English/Japanese. The 1440 px desktop
  homepage capture is byte-identical. The saved study retains its composition.
- `.local/mobile-0255/previews/`: all three cutouts, short landscape and enlarged
  text. No horizontal overflow or live commerce writes.
- `.local/mobile-0255/sections/`: Sample, Origins and ordering captures; touch
  targets, enlarged text and sample-entry scroll restoration verified.
- `.local/mobile-0255/popup-entry/`: touch, outside/Escape/Back/Forward dismissal,
  direct links and responsive resizing, with exact focus and scroll return.
- `tests/mobile-homepage.mjs`: repeatable isolated browser coverage for preview
  choices, keyboard selection, in-place navigation, popup return and history,
  both themes, Japanese, 200% text, desktop/study separation, loader readiness
  and failed-image access. All six scenarios passed.

## Final checks

- Updated the existing homepage motion browser checks to inspect the visible
  responsive composition. Mobile loader/reveal, reduced motion, failed image,
  no-JavaScript navigation and typography/selection checks all passed, with
  the original motion and desktop assertions retained.
- `pnpm validate` passed: formatting, ESLint, TypeScript, all 246 unit tests and
  the production build. Log: `.local/mobile-0255/validate.log`.
- Reviewed task diffs against pre-edit backups and passed `git diff --check`.
  No live commerce writes, new dependencies or deployments were performed.
