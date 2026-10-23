# Task 0276 — About before Origins

Date: 2026-10-23
Status: Complete

## Owner direction

Put About before Origins in navigation.

## Scope

Reorder the shared header to Home, Wholesale, Samples, About, Origins on desktop
and mobile. Align the existing index and entrance timing with that order while
preserving destinations, active states, translations and navigation guards.

## Verification

Check the rendered menu order and destinations on desktop and mobile, then run
`pnpm validate` and review the final diff. Evidence:
`.local/navigation-0276/`.

## Result

The shared desktop and mobile header now places About before Origins. The
rendered order and destination links were verified at desktop and 390 px mobile
widths; mobile screenshot review passed. Existing navigation handlers are
unchanged. `pnpm validate` passed formatting, lint, types, all 256 unit tests and
the production build. Final diff review passed.
