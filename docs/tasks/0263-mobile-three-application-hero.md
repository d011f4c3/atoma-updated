# Task 0263 — A simpler mobile storefront

Date: 2026-10-23
Status: Complete

## Direction

The owner rejects the single-product mobile selector and asks to see all three
applications immediately in a full, refined composition designed for phones.
This supersedes Task 0255's one-at-a-time preview. The requested grower/knowledge
closing section has also been removed; it was already absent at task start.

The owner then expands this same task to reduce information overload throughout
mobile, including popups and especially the in-place Sample Set view. Keep the
main choice and purchase action prominent, remove repetitions, and let buyers
open supporting information when they need it.

## Implementation

- Compose the approved whole tea bowl, latte and baking objects together, with
  three direct touch/keyboard entrances into the existing product popup. Remove
  the tabs, oversized index and extra browsing action. Restore the concise
  introductory subtext and show each product code below its application name,
  as requested in the owner's final refinement.
  Following the owner's scale clarification, keep a full-height hero with
  strong image presence and modest breathing room in a staggered composition.
  Retain one Sample Set button and keep all three choices visible together.
- Remove the repeated mobile Sample Set promotion and ordering sequence below
  the hero. Retain a short photographic Origins section and shared footer.
- Reduce the in-place Sample Set introduction to its name and contents size.
  Bring the trio, price, quantity and Add to cart into the first normal phone
  viewport. Place the collapsed “Inside the set” control above ordering, as
  requested in follow-up. Its compact rows show each matcha, application and
  size, opening individual profiles in place. Preserve the dedicated Samples
  route inside the disclosure.
- Present product popups with compact identity, whole application image and a
  flavour line, followed by purchase. Put the complete profile and preparation
  into separate disclosures. Retain image choices and all product facts.
- Put product-page learning after purchase on mobile; remove repeated identity
  and single-format selection controls when there is no actual choice. Keep
  alternative formats and unavailable requested formats explicit.
- Compact the dedicated Samples contents, disclose guidance and tasting tools,
  and retain mounted state so notes survive closing a disclosure.
- Remove duplicate mobile appearance controls from About/Samples and simplify
  the footer to a compact two-column directory with preferences retained.
- Remove repeated labels from the mobile application directory and Origins.
  Review the existing menu and cart; their reachable controls remain unchanged.

Preserve the desktop hero, saved studies, both themes, approved typography,
product facts, real controls, popup history/focus/scroll return, loader and
reduced motion. No new assets, dependencies, deployment or commerce writes.

## Verification

Capture matched desktop/study views before and after. Review all three mobile
objects at narrow, normal and larger widths, in both themes, localized text,
200% text and short landscape. Verify each product opens the correct popup,
retains quantities and restores its exact trigger and scroll through dismissal
and history. Update obsolete single-preview assertions while retaining loading,
image failure, keyboard, navigation and first-viewport checks. Run relevant
browser suites, `pnpm validate` and final diff review.

Verification results:

- Seven mobile homepage scenarios pass, covering all three image taps, retained
  quantities, exact focus/scroll/history return, responsive resizing and failures.
  Updated checks cover the restored introduction, codes beneath all three names,
  compact normal-size imagery and readable enlarged-text reflow.
- Seven focused motion/accessibility scenarios pass, including loader readiness,
  material entrance, reduced motion, no JavaScript and image failure.
- Eight product-popup scenarios pass, including unavailable/loading/error states,
  format choices, guarded pending orders, dismissal and enlarged Japanese text.
- Twenty secondary mobile checks pass at 320/390/430 px, in both themes, with
  Japanese and 200% text; quantities and tasting drafts survive disclosures.
- Five focused Sample Set cases verify the final above-order disclosure and
  compact rows. At enlarged text sizes the weight moves below the identity;
  names stay readable and all profile and order actions remain accessible.
- Applications, Origins, cart and Sample Set pass a final both-theme phone
  audit with no overflow. Profile/cart dismissal restores exact focus and the
  Origins search works.
- Matched desktop canonical Home, Sample Set view, Samples, Product and About
  captures retain their layout. Canonical pages and Home studies are pixel-identical;
  sample-study differences are limited to tiny powder-image rasterization pixels.
- `pnpm validate` passes: formatting, lint, typecheck, all 248 unit tests and
  production build. Browser fixtures intercepted all commerce traffic; no live
  writes or deployment were performed.

Local evidence is under `.local/mobile-trio-0263/` and
`.local/mobile-popup-0264/`. The final shared-surface audit and diff review are
complete. No deployment or commit was requested.
