# Task 0001 — Feedback and frontend foundation

Date: 2026-09-28
Authorization: The project owner's current request to process client feedback
and set up a separate local repository for the third storefront pass.
Status: Complete — repository setup and feedback analysis only

## Outcome

A durable synthesis of the provided material and a clean, runnable local
frontend foundation that supports small, individually reviewed design slices.

## Scope

1. Read the two supplied RTF documents and inspect the five screenshots and
   screen-recording visuals. Attempt to inspect the linked Instagram references
   and document access limitations.
2. Separate client statements, design interpretation, illustrative examples,
   unresolved choices, and the project owner's actual authorization.
3. Create a new sibling Git repository, `atoma-storefront-v3`. Preserve both
   existing repositories and their uncommitted work.
4. Set up a minimal Next.js / React / TypeScript app, linting,
   formatting, a lockfile, reproducible local commands, and this working contract.
5. Document the technical boundary and source review.

Owner clarifications: Instagram reels are essential. The subsequently supplied
September 28 recording must be reviewed with the brand and site feedback.
Clinical/laboratory/production-engineering character, animation, typography,
and experience are central; human storytelling does not lead. Do not design
anything; deliver the repository setup and summarize the processed feedback.

## Exclusions

No complete homepage, product design, final identity, copied legacy presentation,
new product catalog, shopping cart, checkout, CMS, database, production service,
deployment, remote repository, client contact, or external channel access.
The unstyled placeholder is a boot check, not a submitted design direction.

## Validation

- Install with the pinned package manager and verify the frozen lockfile.
- Run `pnpm validate` (format, lint, strict typecheck, production build).
- Smoke-check the local page and a missing route; confirm the placeholder is
  marked noindex and no external commerce credentials are needed.
- Inspect the unstyled scaffold in a browser.
- Review the final staged diff and excluded-file rules. Confirm only the new
  repository was edited and no deployment/remote was configured.

## Result

Completed 2026-09-28:

- Frozen-lockfile install passed with Node 24.20.0 and pnpm 11.24.0.
- `pnpm validate` passed: formatting, zero-warning lint, strict typecheck, and
  local production build.
- No peer dependency issues remain. The ESLint 9 tooling support limitation is
  documented in ADR 0001.
- Local HTTP checks passed: `/` returned 200 with the unstyled boot message and
  noindex/nofollow metadata; a missing route returned 404.
- Browser inspection confirmed the page contains only the plain boot message.
- Reviewed the final source/configuration diff and excluded-file rules.
- Git was initialized on `codex/foundation` with no remote. No original
  repository files, services, deployments, or databases were changed.
- Read both RTFs fully, inspected all five images, and reviewed visual sequences
  from both recordings. The new reel recording is included in the synthesis.

No storefront design, product content, animation, navigation, or commerce
behavior was implemented. Recording audio was not assessed; direct Instagram
access and exact scene-to-URL mapping remain unverified. Database and commerce
validation are not applicable to this foundation.
