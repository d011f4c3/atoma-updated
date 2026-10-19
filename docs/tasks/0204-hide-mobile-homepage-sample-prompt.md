# Task 0204 — Hide the mobile homepage sample prompt

Date: 2026-10-19

## Request and change

Hide the “Tap to see more” button on the homepage on mobile only. Use a scoped
CSS rule at the existing 760 px mobile breakpoint to hide the complete legend
button in the canonical homepage's compact sample trio. Pouch inspection remains
available by tapping a pouch. Desktop, `/samples`, saved studies and sample
ordering retain their existing controls and behavior.

## Verification

- `pnpm validate` passes formatting, lint, strict types, all 202 unit tests and
  the production build. The scoped diff and whitespace check are clean.
- Focused browser checks pass at 390 px in both themes: the entire prompt button
  is hidden and absent from accessible controls; pouch inspection and Sample Set
  details still open and close. Desktop at 1440 px retains “Inspect a label,” and
  mobile `/samples` and the saved study retain “Tap to see more.” Commerce was
  mocked, with no writes or browser errors.
