# Task 0118 — Restore the text glitch in localized copy

Date: 2026-10-07
Status: Complete locally; verified 2026-10-07
Authority: Owner reports the existing glitch is absent in other languages.

## Bounded correction

Extend the shared ScrambleText character handling beyond ASCII to Han,
Hiragana and Katakana. Keep the original Latin/digit behavior, playback timing,
hover/focus/tap interactions, periodic scheduling and reduced-motion guards.
Tokenize graphemes consistently so combining marks and variation selectors
remain attached. Leave punctuation, spacing and unsupported symbols intact.
Use script-appropriate transient glyphs; shared Han forms avoid mixing
Simplified/Traditional character variants during animation.

Retain the original measured text, accessible name, fixed glyph advance width,
CJK wrapping, layout, font sizes and language-switch continuity. Do not change
translation wording, commerce or the selected product. No new dependency,
service, public API, production write or deployment.

## Validation

Add focused character-handling tests. Browser-check actual mutations and
restoration in all four locales for hero/interactive text, keyboard and touch,
with unchanged accessible text and dimensions. Confirm reduced motion remains
still, and check Chinese/Japanese wrapping on narrow mobile. Run `pnpm validate`
and review the final diff. Use mocked commerce only.

## Evidence

- The ASCII-only eligibility check was the cause: translated Han/kana remained
  plain text and never received animated glyph slots. The shared helper now
  handles graphemes and uses distinct Han, Hiragana and Katakana glyph pools.
  English letter/digit pools and all animation timing/guards are unchanged.
- CJK punctuation and nonstarting kana stay attached to neighboring glyphs.
  Embedded Latin names/codes remain together. Measured source glyphs retain the
  layout while only the hidden-from-accessibility visual layer animates.
- Seven new glyph tests plus five existing scheduler tests pass. Final
  `pnpm validate` passed formatting, lint, types, all 109 unit tests and the
  production build. Logs: `.local/localized-text-glitch/focused-tests.log` and
  `.local/localized-text-glitch/validation.log`.
- Browser verification passed at 1366px and 320px for all four locales. Actual
  glyph mutations and restoration were observed for hover/tap, keyboard focus
  and hero periodic playback. Accessible text and measured dimensions stayed
  stable. Reduced motion prevented scrambling. CJK paragraphs stayed contained
  and line starts did not strand closing punctuation or small kana.
- Desktop/mobile captures were visually reviewed, including a Traditional
  Chinese capture showing the live effect. Evidence: `.local/localized-text-glitch/`.
  The initial dev-server run recorded two `removeChild` errors without stacks;
  separate desktop/mobile reruns with full stack/route/phase capture passed with
  no runtime errors. The original cause is unconfirmed; error checks were not
  suppressed, and the initial failure capture is retained.
- Final scoped source/style diff, test lint and formatting checks passed.
  No translation copy, layout settings, commerce, dependency or release changes.
