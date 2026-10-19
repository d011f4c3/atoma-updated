# Task 0206 — Soft mobile About entrances

Date: 2026-10-19

## Request and scope

Start the owner's mobile fade-in direction on `/about`, with particular attention
to the hero and smooth content arrival farther down the page. Preserve the
accepted type scale, content, native scrolling, desktop presentation, Community
reader and Task 0203's efficient photographic motion. Other routes and the
sample tasting workspace remain unchanged.

## Change

The canonical phone hero introduces its title, statement and photograph with
short overlapping fades, staggered by 70 ms. Text rises by eight pixels; the
photographic frame stays fixed. CSS starts the hero entrance at first paint,
independently of hydration or unrelated asset readiness. A late-loading image
gets a separate opacity fade when its pixels arrive, while the surrounding
content remains available.

An IntersectionObserver reveals subsequent content once as it enters view.
Headings and text groups rise slightly; photograph groups fade without moving
their frames or competing with the existing image zoom. Only offscreen content
is armed after hydration, avoiding flashes or hiding content already being read.
No entrance polling or per-scroll layout reads are introduced. Completed
entrances stay complete through theme changes and Community popup returns.

Keyboard focus and anchor navigation reveal their targets immediately. Desktop,
system reduced motion and no-JavaScript reading remain static and complete.
Missing or failing observer support falls back to visible content; live media
changes settle outstanding entrances. Hero effects are released after completion
even if hydration missed the original animation-end event.

## Verification

- `tests/about-reveals.mjs`: all 12 cases passed in Chrome and WebKit (24 total).
  Real rendering frames show intermediate hero and section opacity. Checks cover
  both themes at 390 and 320 px, once-only playback, Community reader returns,
  keyboard focus, anchors/history restoration, live media changes, desktop,
  reduced motion, no JavaScript and missing/failing observer support. A held hero
  image confirms text finishes independently and the photograph fades when loaded.
- Existing `tests/about-scroll.mjs`: all eight cases passed. Mobile photo motion
  retains zero steady-scroll layout reads, zero reads after writes and zero idle
  writes, alongside the existing popup, desktop and fallback checks.
- `pnpm validate`: passed formatting, lint, type checking, all 213 unit tests and
  the production build. Final browser-harness edits also passed focused formatting
  and lint. Final diff and whitespace review passed.
- Local screenshots, animation traces and the consolidated browser report are in
  `.local/about-reveals-0206/`. These checks use browser emulation, not physical
  iPhone frame-rate measurements. No deployment was performed.
