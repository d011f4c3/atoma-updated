# Task 0182 — Lower the homepage tabs

Date: 2026-10-19
Status: Final spacing refinement implemented and verified locally

The owner clarifies that Overview / Specifications / Shop / Origin on the
homepage should sit lower, then points out the remaining large gap below them.
Center the desktop tabs and reading area together, removing the separate body
spacers. Use a shared responsive reading-area basis so switching tabs does not
move the navigation; flex shrinking and overflow keep long panels accessible.
The owner's final refinement moves the desktop tabs 12 px higher within that
group, increasing the visible gap to 36 px (26 px on short screens). The relative
offset preserves the content position and remaining bottom space. Mobile returns
to its original spacing without the extra 12 px padding from the initial pass.

Preserve type, button styling, horizontal alignment, product selection and
scroll behavior. Scope the change to the canonical embedded
journey; saved studies and the Samples page's navigation remain unchanged.
No commerce change, dependency or deployment.

Check desktop and mobile layout and tab switching, run `pnpm validate`, then
review the scoped diff.

Desktop browser checks confirm a 36 px tab-to-content gap at 1440 × 900. Tabs
moved from y154.5 to y142.5; content stayed at y223.5 with its 540 px reading
area unchanged. Earlier checks confirmed identical positions across all four
views and scrolling for expanded content. At 390 × 844 the original 45 px tab
row is restored, with zero added padding, no relative offset and no horizontal
overflow. Temporary viewport sizing was reset.

`pnpm validate` passes formatting, lint, strict TypeScript, all 202 tests and the
production build after the last refinement. Scoped review and whitespace checks
pass. No deployment.

Evidence: `.local/homepage-tabs-0182/`.
