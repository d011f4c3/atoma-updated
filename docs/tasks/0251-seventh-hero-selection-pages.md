# Task 0251 — Revisit the Sample Set and application views

Date: 2026-10-22
Status: Complete

## Scope

The owner rejects the appearance and fit of the latest Sample Set and Choose by
Application views, finds the surfaces too rounded, and reports details jumping
down the page instead of opening as popups. Both appearance and function are
part of this complete revision of these two views.

- Rebuild the two `/new-hero7` views and their dedicated route equivalents with
  restrained typography, open ruled layouts and square structural surfaces.
  Keep only modest rounding on photographs and actionable controls.
- Make each included sample open a real inset modal. Keep the page, pouches,
  purchase choices and scroll position stable underneath. Preserve canonical
  profile/preparation content and the clear all-three Sample Set purchase.
- Make application learning and purchasing work reliably through a modal on
  both query views and dedicated routes, with no intermediate inline reader.
  Retain swatch/use-case imagery and preparation on the right at desktop sizes.
- Fit the useful choices and real order controls in a normal desktop viewport.
  Support readable mobile layouts, enlarged text, keyboard use, Escape and
  backdrop dismissal, retained orders, pending guards and browser history.
- Keep an explicit return action and Close outside the scrolling popup body,
  including after resize and in short windows. Remove white image panels by
  reusing the established masked powder rendering; fill use-case photo frames.
- Restore the existing site navigation: Shop, Samples, Origins and About keep
  their canonical destinations. The hero's Sample Set and application buttons
  open additional study views, not replacements for the existing pages. Remove
  the separate study Wholesale and Origins views; redirect their old URLs to
  Shop and Origins. This follows the owner's explicit scope correction.
- Preserve the approved hero, Home scroll sections, canonical pages, earlier
  concepts, palettes, IBM Plex Mono, product codes and commerce contracts.
- No new dependencies, product claims, live commerce writes or deployment.

## Implementation

- Replaced rounded application cards with three open, ruled columns; kept the
  application, product code, photograph and learning action together. The
  Sample Set now pairs floating pouches and three compact profile rows with
  the existing set purchase controls. Removed redundant breadcrumbs from both
  selection views so the main navigation leads directly into the page.
  Inner-page content shares the header gutters, without a second width cap
  adding a different inset on wide windows.
- Replaced the sample inline reader and automatic scroll with a native modal.
  Learning retains the underlying geometry, set quantity, scroll and focus.
  Exact larger-format handoffs and return through browser history remain.
- Both popup types have a fixed return/Close row outside their scrollable
  content. Application information uses one scroll area, with preparation on
  the right on desktop. The default desktop purchase is visible on entry;
  expanded information and short windows use the same contained scrolling.
- Reused `ShopMaterialImage` and its existing browser mask for the original
  powder photographs. Removed the white swatch panels and synthetic use-case
  letterboxing. Sample thumbnails use the same transparent treatment.
- Kept structural surfaces square, with modest image/control corners, both
  palettes, readable mobile text, reduced-motion behavior and commerce guards.
  The approved hero, Home section layouts and other routes are preserved.
- Restored the standard site header and canonical footer destinations, including
  Shop and About. The standard Origins link opens the existing Origins reader.
  Only Home, application selection and sample learning remain local study views.
  Legacy study Origins/Wholesale paths and query URLs redirect to `/origins`
  and `/shop`; the hero and section selection CTAs retain their in-place flow.

## Verification

- Passed the application-popup, sample-learning, in-place and Home-section
  browser checks using isolated commerce fixtures. Covered both entry paths,
  both palettes, desktop/short windows, phones, Japanese and enlarged text;
  verified native modal state, accessible return controls, retained geometry,
  scroll/focus, product handoffs, quantities, cart guards and history cleanup.
- After the navigation correction, passed the bounded
  `tests/new-hero7-navigation.mjs` checks: canonical header/footer destinations,
  the original Origins reader, local hero selection/popups, mobile dedicated
  entry, pending-order guards and all dedicated/query/client-history redirects.
- Reviewed the final 1512×709 dark screenshot: header and content align, all
  three sample rows are visible, and powder thumbnails have transparent masks.
  Screenshot: `.local/new-hero-0251/navigation/1512-dark-samples-standard-navigation.png`.
- `pnpm validate` passed: formatting, lint, type checking, all 243 unit tests
  and the production build. Reviewed the scoped final diff; canonical routes
  retain their existing components. No live commerce writes or deployment.
