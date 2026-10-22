# Task 0236 — A clean third homepage concept

Date: 2026-10-21
Status: Implemented and verified locally

## Authority and scope

The owner requests another concept at `/new-hero3` that feels clean and easy to
use. Retain the business positioning and complete selection flow from Task 0234,
and the established Mist / Blue hour palettes and IBM Plex Mono typography.

- Make the three applications the main entrance immediately after a compact
  introduction. Use a clear, open comparison with small supporting photographs
  and visible real price, format, quantity and cart controls.
- Keep the Sample Set as the primary introductory action. Follow the product
  comparison with its three 20 g contents, supported origin information and
  exact named 1 kg repeat-order links.
- Reuse the reviewed catalog, destination and cart state. Keep four locales,
  readable mobile copy, keyboard access, native links and reduced motion.
- Preserve `/new-hero`, `/new-hero2`, the actual homepage and all previous studies.
  No study controls, new commercial claims, dependencies or deployment.

## Verification

Review desktop and phone layouts in both palettes and all four locales. Check
visible controls, no clipping, image fallbacks, native links, cart operation
locks/error recovery and product/detail return continuity using isolated
fixtures. Run the relevant regression checks, `pnpm validate` and final diff
review. Record results below when complete.

## Implementation

- A compact centred introduction leads directly into an open three-column
  application comparison. Each product has a small labelled application image,
  canonical name/code and visible price, format, quantity, total and cart action.
  Phone layouts stack the products with 16 px prose and clear touch controls.
- The new `counter` presentation reuses the existing product component without
  changing its selection, catalog or cart logic. All new product styling is
  scoped to that presentation; the earlier cards and rows remain independent.
- A Sample Set panel contains all three named 20 g samples and label inspection.
  Its content and call to action precede inspection in both reading and keyboard
  order. A defined image container keeps the pouches visible on desktop.
- Supported Wazuka origin information and preparation guidance follow the
  products. Repeat-order links retain exact named 1 kg destinations.
- The page uses existing translations and persistent theme providers. Stable
  reading/control motion policy includes the new route. No new facts, imagery,
  commerce integration or production actions were introduced.

## Browser verification

- `tests/new-hero3.mjs` passes nine profiles from 320 to 1440 px, both palettes
  and all four locales. Checks cover native links before hydration, visible
  purchasing controls, exact product/1 kg links, theme/locale selection
  continuity, product-detail/Back restoration, pending-operation locks,
  rejection recovery, reduced motion and failed-image fallbacks.
- Visual review corrected the desktop pouch container's height. The suite now
  verifies useful pouch/image dimensions and the Sample Set CTA's DOM and Tab
  order. Final desktop and phone screenshots in both palettes were reviewed.
- `/new-hero` and `/new-hero2` regression suites pass at 1440 px Mist and 390 px
  Blue hour, including their complete interaction checks. Earlier compositions
  are retained. Evidence is in `.local/new-hero-0236/`, with earlier-route
  regressions in its `regression-hero1/` and `regression-hero2/` directories.
- Browser commerce uses isolated fixtures. There were no unexpected client
  errors or live commerce mutations.
- Final `pnpm validate` passed formatting, lint, strict TypeScript, all 238 unit
  tests and the production build including `/new-hero3`. Final scoped source
  review and whitespace checks passed. No deployment was performed.
