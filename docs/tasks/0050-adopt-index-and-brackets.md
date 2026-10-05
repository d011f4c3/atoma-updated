# Task 0050 — Adopt Index and Brackets on the homepage

Date: 2026-09-30
Status: Complete

Use Index for matcha selection and Brackets for Overview, Specifications,
Origins and Shop on the main homepage in both themes. Retain the stronger
product hierarchy, the existing separation between the two controls, and the
smaller paper card from Task 0049.

Keep `/selector-study` and its independent dropdowns available exactly as they
are for future comparisons. Preserve shared component defaults and standalone
concepts by opting in at the two homepage routes. Keep selection, theme,
reference, quantity and commerce behavior unchanged.

Review the adopted pair on desktop and phone in both themes, including
specification fit and purchase entry. Update the existing homepage isolation
check to expect the approved pair; verify the study and Concept 02 retain
their defaults. Run `pnpm validate` and review the scoped diff.

## Result and verification

Both homepage routes opt into `index` and `brackets` through the existing
component props. No study, selector implementation or selection-model changes
were needed.

Visual review passed Overview, Specifications and Shop at 1366×768 and
320×700 in both themes. All seven properties and the sample note fit; the
desktop purchase action remains visible. The 16px/12px selector separation
and smaller desktop paper card are retained.

The updated browser isolation check passes: real product selection and quantity
survive information-view and theme changes without replacing the scene. The
study still opens with Specimens/Text and all eight by six comparison options;
Concept 02 retains its original selectors. No live commerce writes occurred.

`pnpm validate` passes formatting, ESLint, TypeScript, all 50 unit tests and
the production build. Scoped diff review passed. Captures and validation log:
`.local/qa/homepage-index-brackets/`; interaction captures:
`.local/qa/homepage-index-brackets-behavior/`.
