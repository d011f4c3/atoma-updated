# Task 0026 — Dedicated shop

Date: 2026-09-30
Status: Complete

Add Shop to the main top navigation and build a dedicated shopping experience
at `/shop` (dark) and `/shop/light` (light). Keep the existing homepage and
interactive builder available. This user request authorizes the new shop route
and navigation in addition to the current design work.

Create a product-first collection view with the existing local material imagery,
small IBM Plex Mono, 6px button corners, quiet separators and both themes.
Show the returned catalog products, their published formats, price and
availability, optional material information, quantity controls and the shared
interactive Add to cart action. No fabricated stock, origin or claims.

Reuse the current catalog adapter, cart provider, quantity rules, mutation lock,
error/review behavior and checkout gates. Each product retains its own selection;
only the requested product shows Adding, while other submissions are disabled.
Keep the shop's selections when switching appearance. No new dependency,
service, production write or deployment.

Check nav and direct routes, mobile 320px/390px and desktop, both themes,
independent variant/quantity state, no-variant/unavailable/empty/error states,
focus, reduced motion and local-intercepted cart behavior. Run relevant tests,
then `pnpm validate`, and review the scoped diff. Preserve concurrent lighting
and theme-continuity work from Task 0025.

## Delivered and validation

- Added theme-aware Shop navigation and dedicated `/shop` and `/shop/light`
  routes. Mobile navigation uses two rows at 540px and below, retaining 44px
  targets for all four controls. Existing homepage and builder remain available.
- The collection renders returned products with static local material images,
  independent formats/quantities, availability, material information and the
  shared purchase control. Reused the existing mask without WebGL on shop cards.
- Extracted existing selection and money helpers and added a purchase guard for
  availability, increments, published quantity limits, transport bounds and safe
  totals. The cart provider remains the submission authority. Only the clicked
  card reports pending; siblings disable without false availability labels.
- Appearance changes preserve current card selections and URL history.
- CUA visual review covered dark/light desktop, 390px and 320px mobile, actual
  homepage-to-Shop navigation, theme-aware active links, unavailable products,
  independent quantity state, and theme continuity. Narrow view has no horizontal
  overflow and navigation targets remain 44px high.
- Locally intercepted cart requests verified honest pending state, rejection
  recovery, successful drawer opening and focus restoration to Add to cart.
  No production cart mutations were sent.
- Six new selection unit cases passed. `pnpm validate` passed on Node 24.20.0:
  formatting, lint, types, all 21 unit tests and the production build including
  both Shop routes. Scoped code review and `git diff --check` passed.
- Added browser regression coverage for independent selection, variants, bounds,
  theme/back history, sibling locks, signed request data, missing formats and
  catalog recovery. Its syntax/lint/format checks passed; the standalone browser
  harness was not executed. Browser verification used the CUA session.
