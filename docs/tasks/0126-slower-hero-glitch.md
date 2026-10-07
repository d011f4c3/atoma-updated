# Task 0126 — Slow the hero glitch independently

Date: 2026-10-07
Status: Complete locally; verified 2026-10-07
Authority: Owner says the hero glitch feels too fast and may use different
timing from hover.

## Bounded change

Give the adopted Specimen hero a calmer cadence: repeat every 4.2 seconds on
desktop and 7 seconds on mobile, with each text resolve lasting 800ms and
1200ms respectively. Keep its heading and supporting text synchronized.
These hero-only settings replace Task 0102's requirement to match the hover
cycle. Hover, keyboard and touch controls retain their existing timing.

Reuse the existing hook and ScrambleText with optional internal timing props;
keep their defaults unchanged. Preserve glyph behavior, copy, layout, entrance
wrappers, localization, reduced motion, visibility guards and exploration
pause. No dependency, service, commerce or deployment change.

## Validation

- Observe actual hero cadence and resolution independently of hover/tap.
- Run the existing localized-glitch browser checks for all four languages,
  desktop/mobile, stable layout/accessibility and reduced motion.
- Run `pnpm validate` and review the scoped diff.

## Evidence

- Three observed desktop cycles repeat 4.20 seconds apart and resolve in
  834–837ms; three mobile cycles repeat 7.00 seconds apart and resolve in
  1236–1241ms, including normal animation-frame overhead. Accessible source
  text and measured geometry remain stable, with no runtime errors or writes.
  Results: `.local/hero-glitch-0126/cadence-results.json`.
- The existing localized-glitch browser flow passes at 1366px and 320px in all
  four languages: actual hover/tap, keyboard focus and periodic glyph changes
  restore correctly; accessibility, layout and reduced motion remain intact.
  Captures: `.local/hero-glitch-0126/localized/`.
- `pnpm validate` passes formatting, lint, types, all 115 unit tests and the
  production build. Log: `.local/hero-glitch-0126/validation.log`.
- Scoped diff and independent code review confirm unchanged hover/touch defaults
  and no layout, copy, styling, commerce or dependency changes.
