# Task 0080 — Origins place directory

Date: 2026-10-05
Status: Complete

## Requested outcome

Remove the large photographic entrance from the Origins popout and prioritize
Growing places and place search. Replace the opening with a compact directory:
clear title, prominent search, country groups and restrained photographic rows.
Apply the same shared entrance to `/origins` for consistent navigation.

Retain the regional detail photography and deeper field reader, the homepage
Panorama, current themes, private grower placeholder and confirmed place/product
facts. Preserve search/filter state, pagination, reader return, keyboard access,
selected product and commerce behavior. Add a convenient search-clear control.
No new assets, dependencies, claims, live commerce changes or deployment.

## Verification

Update the existing Origins browser checks for the new entrance. Review desktop
and mobile in both themes, immediate search/place visibility, found/empty search
results, clear search, reader return, Escape/focus and selection continuity.
Run the relevant Origins tests, then `pnpm validate`; inspect screenshots and
the scoped diff.

## Result

- Removed the global photographic entrance and made Growing places the primary
  heading. A full-width labeled search field leads directly to the country and
  place rows; the private grower placeholder is compact and secondary.
- Added a keyboard-accessible clear-search button that restores input focus.
  Existing filters, results, pagination and per-place search state remain intact.
- Regional photographs and field reading remain available after choosing a
  place. The homepage Panorama and mounted product scene are unchanged.
- All five Origins browser cases pass, covering both themes, desktop and mobile,
  immediate search/result visibility, search/clear, reader return, privacy,
  keyboard focus and selected product/quantity continuity. Reviewed captures in
  `.local/qa/origins-directory/`.
- All 27 focused Origins unit checks and `pnpm validate` pass, including strict
  types, all 63 unit tests and the production build. Reviewed scoped diffs and
  `git diff --check`. No live commerce writes or deployment.
