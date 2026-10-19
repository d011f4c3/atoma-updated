# Task 0196 — Remove the lingering loading notice

Date: 2026-10-19

## Request and scope

The owner reports the loading tooltip staying visible after the page has loaded
and prefers its removal over that behavior. Remove Task 0192's floating commerce
notice. Preserve the brief opening hero loader, local purchase feedback and the
loading status inside an open cart.

The owner clarified that loading should wait only for the current page's work.
Feedback must not aggregate unrelated background consumers.

## Change

The floating notice aggregated all cart, destination and catalog requests,
including background consumers whose completion can trail the visible page.
Remove its outside-cart rendering and global catalog request counter from the
shared cart provider. Each page's existing inline pending, error and retry states
continue to use its own catalog request. The open cart's status follows only
cart, destination and checkout operations; unrelated catalog reads cannot extend
it. The hero loader already follows its own asset readiness. Purchase locks and
request cancellation, stale-response protection and recovery remain intact.

## Verification

- All six `tests/commerce-loading.mjs` cases pass with isolated commerce fixtures:
  desktop/mobile Samples, mobile homepage entry, failed homepage cart reads,
  failed initial catalogs and failed country catalog refreshes. Pending controls,
  quantity retention, read-only retries and deliberate mutations remain covered.
- While page catalog responses are deliberately held, the cart status disappears
  once its own reads settle. No floating notice appears during pending, completed
  or failed requests. Cart feedback remains accessible and honors reduced motion.
- `pnpm validate` passes formatting, lint, strict types, all 202 unit tests and
  the production build. Final scoped formatting and `git diff --check` pass.
