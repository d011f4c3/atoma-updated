# Task 0197 — Visible Samples purchase button label

Date: 2026-10-19

## Request and scope

Fix the solid, unlabelled purchase button on mobile `/samples` in both themes.
Keep the existing layout, button animation and commerce behavior.

## Cause and change

The Samples page set `--surface` to transparent. The shared Add to cart button
uses that token as its inverse text and icon color, making both invisible in
enabled and pending states. Browser inspection confirmed transparent computed
foregrounds in both palettes.

Use the existing opaque `--color-surface` theme token on the Samples page. Its
gradient background stays intact, and material imagery keeps its own scoped
transparency. The shared button and other routes are unchanged.

## Verification

- Browser checks pass at 320, 390 and 1440 px in both themes. Label and icon
  foregrounds are opaque, with contrast ratios of 10.84:1 in light mode and
  16.86:1 in dark mode. The pending state remains readable in both mobile themes;
  mocked adds complete normally. No page overflow or runtime errors occurred.
- Reviewed mobile and desktop captures in `.local/samples-button-*-after.png`.
  Commerce reads and writes were isolated browser fixtures.
- `pnpm validate` passes formatting, lint, types, all 202 unit tests and the
  production build. Scoped formatting and final `git diff --check` pass.
