# Task 0115 — Include the full range in Kyoto Origins

Date: 2026-10-06
Status: Implemented and verified locally
Authority: Owner's follow-up showing the Kyoto page listing only Ceremonial.
Related: [Task 0107](0107-uji-designation-and-wazuka-origins.md).

## Outcome

Kyoto's existing Origins product list must include Culinary, Barista and
Ceremonial. Both the UJI series associated with Uji City and the Ceremonial
associated with Wazuka belong in the parent Kyoto browsing context. Uji City
continues to list the two UJI products; Wazuka continues to list Ceremonial.
Uji City and Wazuka remain sibling municipalities within Kyoto Prefecture.

The earlier implementation treated Kyoto's browsing list as a strict documented
growing-place query and excluded the UJI associations. Add a combined directory
lookup that includes both published growing relationships and published
designation associations within the selected place's subtree. Use it for the
directory counts, lists and existing type filter. Keep product-specific UJI and
Wazuka labels clear on the parent list.

## Preservation

Preserve the approved markup, styles, photography, controls and navigation.
Do not change product codes, availability, prices or cart behavior. A browsing
association does not establish a specific growing field or processing location;
retain the separate strict provenance helpers and existing field-note evidence.
No dependencies, service, database, API contract or production writes.

## Validation

Test Kyoto/Japan aggregation, exact Uji/Wazuka membership, type filtering,
deduplication and catalog order, unavailable products, and exclusion of draft,
invalid or unrelated designation/place associations. Verify directory counts,
all three Kyoto cards and their links, and unchanged Uji/Wazuka views in both
themes at desktop and mobile widths. Run focused checks and `pnpm validate`,
then review the final diff and screenshots.

## Evidence

- `getDirectoryMatchasForPlace` now combines the two association types in
  catalog order without duplicate products. The existing directory counts,
  product lists and type filters share this lookup. Each card retains its own
  UJI designation or Wazuka label. Strict provenance helpers are unchanged.
- Thirty focused origin, designation, preview and field-note tests passed,
  including the new aggregation, same-material filtering, deduplication and
  invalid-context regressions. Independent source review found no issues.
- The updated designation browser suite passed 4/4 at 1366px and 320px in both
  themes. It verifies Kyoto's three-product count/list, all three type filters
  and reset, Japan's ancestor list, Uji's two products, Wazuka's one product,
  exact product links, availability, existing layouts and purchase continuity.
  Commerce was mocked; no writes occurred.
- Kyoto screenshots were reviewed under
  `.local/feedback-20261006/kyoto-rollup/`. All three cards render in the original
  responsive grid with the existing controls and no horizontal overflow.
- `pnpm validate` passed formatting, lint, types, all 83 unit tests and the
  production build. Log: `.local/feedback-20261006/kyoto-rollup-validation.log`.
  Final source diff and `git diff --check` passed. No CSS, database, production
  configuration or deployment changes were made.
