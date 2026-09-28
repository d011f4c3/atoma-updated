# Task 0006 — A compact hero heading

Date: 2026-09-28
Status: Complete — local heading trial ready for owner review

The owner wants some hero text, without returning to the gigantic MATCHA
backdrop. Introduce “Matcha, by specification.” as a short, modest heading next
to the vessel on desktop and above it on mobile. This is a proposed brand line
drawn from the client's emphasis on material, specification, and selection,
not a claim of a certified standard or validated product test.

Keep the off-black surface, navigation, text resolution, and local inspection
behavior. Do not add a marketing paragraph, invented product facts, or commerce
links. Retain viewport containment. Verify desktop/mobile/short-landscape
placement, run the existing navigation check, and run `pnpm validate`.

Implemented the heading as live semantic text in Fraktion Sans Light. It is
about 43px at the reviewed desktop size and 26px on mobile. The mobile vessel
and its inspection target sit slightly lower to leave room for the heading.
This is proposed copy for owner review, not a quotation from the client.

Validation completed:

- `pnpm validate` passed: formatting, lint, types, and production build.
- Browser checks passed at 1440 × 900, 390 × 844, 320 × 568, and 844 × 390.
  No document overflow, runtime errors, or regressions in navigation, menu
  focus, reduced motion, pause, or text resolution.
- The visible heading and modest size were checked; screenshots at all four
  sizes were inspected for text/object separation and control visibility.
- Reviewed the final source change and ran `git diff --check`.
