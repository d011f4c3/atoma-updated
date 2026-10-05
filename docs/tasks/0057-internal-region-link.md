# Task 0057 — Keep region exploration inside Origins

Date: 2026-10-01
Status: Complete

## Requested change

Replace the inline landscape PDF link with the site's own Origins view about the
region. “About Wazuka” opens the existing place reader in the current theme and
returns to the selected matcha. Keep Split view, the growers CTA, the saved study,
and the sourced landscape copy. Retain research attribution in code/documentation
rather than sending shoppers to an external PDF.

## Verification

- Updated existing browser suite: all three cases pass. The region button opens
  Wazuka in the site's reader, without a new tab or PDF link. Keyboard return
  restores the exact homepage URL, button focus, matcha, quantity and theme.
- Desktop and 320px mobile reviewed in both themes; the inline link fits without
  overflow. Captures: `.local/qa/origins-region-link/`. Commerce was mocked;
  no writes occurred.
- `pnpm validate` passes: format, lint, TypeScript, 60 unit tests and build.
  Scoped review and `git diff --check` pass.
