# Task 0194 — Space below the Origins series introduction

Date: 2026-10-19
Status: implemented; scoped checks passed.

## Request

The UJI series introduction ends too close to the product cards below it. Add
clear, modest separation in the shared Origins view on desktop and mobile.

## Change

The direct introduction inside an Origins section now has a `1.5rem` bottom
margin. This separates the UJI series note from its product cards, and also
keeps loading or availability messages clear of the note. The rule applies
equally to the Origins page and popup at all viewport sizes. Directory and
place-header introductions keep their existing spacing.

Copy, typography, product data, card layout, navigation and commerce remain
unchanged. No generated files are edited.

## Verification

Scoped Prettier and `git diff --check` pass. All eight existing Origins
designation tests pass. The reviewed CSS diff contains only the new spacing
rule; no interaction or source-data changes require new behavior tests.
Parent owns the final visual review, repository validation and requested push.

## Final review and push preparation

Browser review confirmed a 24 px gap between the UJI series introduction and its product cards. The complete `pnpm validate` passed with 202 tests, plus a focused nine-test credit-fixture rerun after substituting synthetic codes. Stale generated route types for concurrently removed study routes were cleared and regenerated.

Before the requested public-repository push, configured email discount values in documentation and tests were replaced with placeholders/synthetic fixture codes. The original private reference is retained under ignored `.local/`; Shopify configuration is unchanged. No credentials or large binary files were detected in the proposed changes. No production deployment or Shopify mutation is part of this push.
