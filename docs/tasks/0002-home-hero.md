# Task 0002 — Home hero only

Date: 2026-09-28
Status: Complete — local hero implementation, ready for owner review
Authorization: The owner now requests a home hero only, technical, clinical,
and mysterious, with the previously reviewed client direction. This supersedes
the setup-only restriction for this bounded slice.

## Scope

Build one responsive full-viewport hero in the new local frontend. The product
is the visual entrance; animation, typography, and object/material exploration
carry the experience. No additional page sections or commerce integration.

Visual thesis: a dark, controlled material study. Fine typography and a single
machined vessel isolate matcha as the sole organic, colored material. A second
view moves closer to the powder. Both views occupy the same hero, with accessible
controls, deliberate transitions, restrained pointer response, motion pause,
and reduced-motion behavior. All visible labels describe the material or the
view, not invented product codes, certified claims, quantities, or measurements.

The generated vessel and powder are original concept imagery, not evidence of
actual ATOMA packaging, testing, production equipment, or a sellable SKU.
Record provenance and prompts in `docs/references/hero-assets.md`.

## Boundary

- Keep this local in `atoma-storefront-v3`; no production release or remote.
- No people, origin narrative, additional routes, product detail page, cart,
  contact form, footer, inventory, pricing, or fabricated availability.
- No dead navigation to unfinished routes. Hero controls change the hero view.
- Use the existing Next/React/CSS stack. No new runtime dependency.
- Reuse the licensed local Inter font with its OFL; no external font requests.

## Validation

- Verify asset dimensions, loading paths, and implementation of responsive layout.
- Verify view changes, motion controls, and reduced-motion behavior in source.
- Run `pnpm validate`, inspect the final diff, and check the rendered route responds.
- Show the completed local preview for review. Browser interaction QA is not
  included unless requested, per the Sites skill's local-preview rules.

## Result

Implemented the home hero only. The entry presents a machined vessel containing
matcha, with a separately animated lid and a large thin typographic title.
Selecting the object or view controls transitions to a macro material study.
Keyboard controls, visible focus, state announcements, an ambient pause control,
and reduced-motion overrides are included. The hero has responsive desktop,
tablet, and mobile rules; no additional section or navigation destination exists.

Validation completed:

- `pnpm validate` passed: format, zero-warning lint, strict route/type checks,
  and production build. An initial font path error was corrected before the
  successful full gate.
- Local route returned HTTP 200, and both final image files returned HTTP 200
  with `image/webp` content types.
- Both source assets were visually inspected at 1536 × 1024. Final optimized
  assets total 276,600 bytes. Font license and final prompts are recorded.
- An independent source review covered motion, accessibility, responsive
  geometry, and scope. Final source/configuration diff was reviewed.
- Local preview handoff requested at `http://127.0.0.1:3100`; the app returned a
  queued browser opening, so the URL is also provided directly to the owner.

Limits: browser screenshot, resize, and interaction QA were not performed
because they were not explicitly requested under the Sites skill's preview
rules. No deployment, commerce tests, production calls, database changes, or
additional pages were part of this task. Concept imagery does not establish
actual packaging or a sellable product specification.
