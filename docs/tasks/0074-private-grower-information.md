# Task 0074 — Private grower information

Date: 2026-10-05
Status: Complete

## Requested outcome

Remove grower and partner names and further identity details from Origins.
Use one neutral grower placeholder instead of individual public records. This
request supersedes the identity publication in Tasks 0048 and 0052.

Remove the identities and their source metadata from runtime storefront data,
including client bundles. Use the same placeholder in the global directory and
regional views, in both themes and the shared in-page reader. Do not disclose
partner roles, individual record counts or identity links. Do not promise a
future publication date.

Preserve regional and product facts, contextual photography, navigation,
selection and cart behavior. Update the growing-region CTA to describe its
destination accurately. No commerce changes, new dependencies or deployment.

## Verification

Check that public people records are empty while retaining meaningful synthetic
coverage of the future publication helpers. Review the global and Wazuka
directory in both themes and on a phone, including the work-section jump and
Origins return flow. Confirm the rendered DOM and production client assets do
not contain the withheld identities. Run `pnpm validate` and review the scoped
diff and `git diff --check`.

## Result

Removed all named grower/partner records and source metadata from runtime data.
The global directory and regional reader share a neutral Grower information
placeholder, and the homepage CTA now reads Explore the growing region.
Regional facts and contextual photographs remain available.

All four Origins browser cases passed, including both themes, desktop/mobile,
work-section focus and selection continuity. Reviewed global and regional
screenshots in `.local/qa/private-growers/`. All 60 unit tests and `pnpm validate`
passed. Source, public assets and fresh production client/server output contain
no withheld identity tokens. Scoped diffs and `git diff --check` were reviewed.
