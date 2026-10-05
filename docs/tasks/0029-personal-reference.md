# Task 0029 — Personal reference editing

Date: 2026-09-30
Status: Complete

The owner finds the label's Your reference area unusable and requests a way to
personalize it, with Antro Vectra for the reference text. Make typed reference
editing obvious from the card and both shopping modes. Implemented typed label
text as the default interpretation; image attachments are not included.

Use the installed Antro Vectra font for the entered value and paper reference,
retaining mono metadata. Preserve connected script shaping rather than wrapping
each handwritten letter separately. Keep the 32-character local preview and
existing selection, card movement, themes and commerce contracts.

Open one editor without changing the chosen shopping mode or step. Focus its
input, update the card live, offer clear and done, restore the initiating
control on return, and keep mobile editing clear of the sticky preview. No
upload service, printing service, dependencies or production mutations.

Review direct-card and both-mode entry, live text/clear, focus restoration,
mode/theme continuity, 32-character fitting, Antro rendering, mobile typing,
card drag and reduced motion. Update relevant browser regression expectations,
run `pnpm validate` and review the scoped diff.

## Delivered and validation

- Added an independent, focused reference editor with live preview, Clear text,
  Done and a 32-character limit. Explicit entry points are available in both
  shopping modes, the stage caption and the paper's reference field. Returning
  preserves the originating mode/step and restores its control, including when
  that control remounts.
- Integrated the installed Antro Vectra font. References retain whole-text
  shaping and resize to fit unusually wide text without leaving the paper.
  Mobile editing releases the sticky preview so the input stays reachable.
- Browser checks passed for card/standard entry, no drag on reference clicks,
  input and return focus, live mixed-case text, clear/refocus, theme continuity,
  a 32-wide-initial stress case, 390px layout and reduced-motion ink updates.
- Updated the existing browser regression harness with these behaviors; syntax,
  formatting and ESLint passed. The standalone harness was not executed; the
  focused browser checks above were performed through the available browser tool.
- `pnpm validate` passed formatting, lint, types, 26 tests and the build. Final
  scoped source review and `git diff --check` passed. No commerce writes.
