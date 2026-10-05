# Task 0028 — Periodic subtext glitches

Date: 2026-09-30
Status: Complete

The owner requests the existing hover character glitch on all supporting text,
repeating periodically. Extend the active homepage, selection, shop, material
panel, About and cart captions and descriptions without changing their copy,
layout, typography or commerce behavior. Preserve the label card's ink effect.

Use an opt-in mode on ScrambleText with one shared, staggered scheduler. Resolve
one visible passage every 3–4 seconds, leave at least 12 seconds between a
passage's automatic pulses, and retain the existing hover/focus effect. Keep prices, quantity
outputs, unavailable/error/status messages and user-entered text stable.

Skip offscreen and closed content and content behind modal dialogs. Pause when
the page is hidden or reduced motion is requested. Preserve stable accessible
text, line wrapping and glyph widths. No dependencies, commerce changes or
production deployment are needed.

Validate scheduler fairness, cooldown, eligibility, pause and cleanup with unit
tests; check periodic replay, hover, wrapping and reduced motion in the browser.
Run `pnpm validate` and review the scoped diff before handoff.

## Delivered and verified

- Added opt-in periodic playback to ScrambleText and applied it to supporting
  copy across the active storefront. Preserved stable screen-reader text and
  measured glyph widths. Static copy enters settled before its first pulse.
- One shared scheduler rotates through eligible passages, with hidden-tab and
  reduced-motion suspension and cleanup when the final subscriber unmounts.
- Browser sampling observed three separate shop passages over ten seconds,
  with at most one automatic pulse at a time and no closed-dialog animations.
  With Material & use open, playback stayed inside that modal and skipped the
  closed preparation disclosure.
- Reduced-motion emulation produced zero changed glyphs over five seconds;
  direct pointer hover still scrambled a material property. Reviewed desktop
  dark and mobile light layouts. At 390px and 320px, the drawer had no horizontal
  overflow, including expanded preparation.
- Five new scheduler tests cover staggered rotation, cooldown, eligibility,
  pause/resume and removal. `fnm exec --using=24.20.0 pnpm validate` passed
  formatting, lint, type checks, all 26 tests and the production build. Final
  scoped source review and `git diff --check` passed.
- No commerce mutations or deployment were performed.
