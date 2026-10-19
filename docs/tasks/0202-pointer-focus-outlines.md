# Task 0202 — Unwanted focus outlines after pointer interaction

Date: 2026-10-19

## Request and scope

Remove the spontaneous rectangular button outline shown after opening Sample
Set details, and the same behavior across the site in both themes. Preserve
keyboard focus visibility, native dialog semantics, focus return, background
scroll position and all existing commerce behavior.

## Implementation

- Track pointer and keyboard interaction once at the document level, before
  component handlers move focus. Leave browser defaults intact before the first
  interaction and when JavaScript is unavailable.
- Suppress only pointer-origin outlines on buttons, links, summaries and button
  roles. Keep text fields, selects, editable elements and selected/hover borders
  unchanged. Any non-modifier keyboard interaction restores existing focus
  styling, including on phones with an attached keyboard.
- Keep automatic popup focus and return focus. Do not blur controls or remove
  focus calls to hide the visual symptom.
- Replace the previous mobile Cart Close-only exception with the shared rule.
- No content, layout, theme, selection, cart, dependency or deployment changes.

The [Selectors specification](https://www.w3.org/TR/selectors-4/#the-focus-visible-pseudo)
allows newly displayed, automatically focused dialog controls to indicate focus.
The existing `:focus-visible` rules therefore need the explicit pointer-origin
guard; replacing them with `:focus:not(:focus-visible)` would not address this.

## Verification

- `pnpm validate` passed formatting, lint, strict TypeScript, all 202 unit tests
  and the production build. Reviewed the scoped diff and `git diff --check`.
- `tests/focus-interactions.mjs` passed the full Chrome matrix at 390px touch
  and 1440px mouse in both themes, plus the full WebKit 390px touch matrix in
  both themes. Coverage includes Sample Set details, foil labels, Cart,
  Origins, specifications, Material & use and navigation/order summaries.
- Focused WebKit Sample Set details checks also passed at 1440px in both
  themes, including pointer suppression and keyboard focus/return.
- Verified pointer opening/return without rings; visible keyboard focus with
  Enter, Space and Tab; Option+Tab modality; switching from keyboard to pointer
  without blurring; unchanged scroll restoration; and retained search-field
  focus indication. Browser commerce reads are fixtures and all writes blocked.
- WebKit reproduced the reported cause: the automatically focused Close button
  still matches native `:focus-visible`. Removing only the pointer marker
  restores the unwanted rectangle; the shared guard removes it without moving
  focus. Reviewed light/dark screenshots under
  `.local/focus-interactions-0202/browser/`.
- WebKit touch Cart checks use the static × inside the same Close button.
  Its unchanged animated text has a separate glyph-tap click-suppression issue.
  Safari's existing pointer focus-return conventions also differ from Chrome;
  this task leaves the original focus targets and handlers unchanged.
