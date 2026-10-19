# Task 0195 — Mobile homepage sample imagery first

Date: 2026-10-19

## Request and scope

Show the homepage Sample Set imagery before the shopping experience on mobile.
This supersedes Task 0187's purchase-before-imagery mobile arrangement.
Keep desktop composition, pouch inspection, selection, quantity and cart behavior.

## Change

Move the existing mobile-only interactive foil trio before the Sample Set heading,
information and purchase controls in the shared ordering panel. DOM and keyboard
order follow the visual order. Move its spacing below the trio. Desktop retains
the separate left material stage; the mobile copy remains hidden above 760 px.

## Verification

- Browser checks passed at 320 px/light, 390 px/dark and 1440 px/both themes,
  with mocked commerce reads. Mobile imagery precedes both heading and purchase
  controls, exactly one trio is visible, and the page has no horizontal overflow.
  Label inspection returns focus after Escape; sample quantity survives inspection
  and switching to individual matcha and back. Desktop purchase controls remain
  visible and the right panel has no repeated imagery.
- Reviewed captures in `.local/mobile-sample-0195/`. A reused panel-width check
  reported the existing 2 px image overflow at 320 px; moving the trio back to its
  prior DOM position produced identical bounds. The page itself does not overflow.
- `pnpm validate` passed formatting, lint, types, all 202 unit tests and the
  production build using the installed Node 24.20.0 runtime. Scoped diff review
  and `git diff --check` passed.
