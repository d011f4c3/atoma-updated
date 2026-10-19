# Task 0179 — Compact stickers and later-use sample credit

Date: 2026-10-19

Status: Implemented and verified locally; Shopify notification saved

## Owner direction

Shorten the sample sticker, bring the lower information closer together, use
uppercase text and make the QR a little smaller. Apply that same sticker to the
main hero bag and the selected bag shown with Shop. Preserve the praised sample
label popup, silver photographic packaging and matching outer rotations.

Customers should sample first and return later for a wholesale order. The
owner's subsequent instruction supersedes public code display: send the code
in the Sample Set order confirmation email, remove the public cart action, and
retain Shopify's customer eligibility rules. The owner also requests a modern
ATOMA treatment for that email with slightly rounded buttons.

Follow-ups request centered desktop panel content below unchanged tabs, visible
mobile bags, shipping details inside Ordering information, concise sampling
benefit copy, and a mobile-only “Tap to see more” action under the sachets.

## Scope

- Edit the blank photographic sticker to be shorter without compressing the
  pouch or replacing its silver material. Keep live text and real QR separate.
- Share one compact label presentation between samples, hero, transition clone
  and selected Shop bag. Use uppercase prose, preserving literal units and
  entered reference casing. Reduce QR from 24% of the lower area to 18% and
  align it beside the information rows; compact the footer line spacing.
- Map product-specific code, place and QR only from exact catalog identity.
  Samples are 20 g. The individual Shop bag uses the selected variant format,
  never the sample weight or total cart quantity. Generic hero state must not
  invent a code, place or weight. Preserve the other paper-card concepts.
- Remove the public code and cart apply action, including its server command.
  The reusable code, JPY 4,500 amount and first-eligible-order rules remain
  unchanged. Save a sample-variant conditional in Shopify's existing order
  confirmation, with same-email guidance and a headless storefront return link.
- Style that notification with cool neutrals, restrained typography, thin rules
  and 6 px button corners. Preserve Shopify's dynamic order information and
  actions. No app, permission, customer order, test email or deployment.
- Center short desktop panel bodies using flexible spacers. Long/expanded
  content remains scrollable from its top; tab position is unchanged.
- Show the shared foil trio inside the canonical mobile Sample Set panel;
  preserve study artwork and desktop composition. Retain the physical pouch
  within the mobile label dialog. Use the existing label-popup action for the
  localized mobile hint; desktop retains “Inspect a label”.
- Put shipping details under Ordering information on both screen sizes and add
  brief copy about comparing flavour, texture and recipe performance before
  choosing 1 kg. Preserve USD 29, 3 × 20 g and the approved JPY 4,500 credit.

## Checks

Review trio, label popup, hero and Shop transitions in desktop/mobile sizes and
both themes; verify actual label bounds, uppercase and matching product/format.
Verify that the code and retired command are absent from public source and
production client bundles, and the former API action is rejected. Preview the
notification's conditional exclusion and the credit block's formatting, then
restore the real condition before saving. Run focused checks, `pnpm validate`
and final scoped diff review. Asset provenance is recorded in
[the design note](../design/compact-foil-sticker-0179.md).

Shopify configuration and email-test limitations are recorded in
[the notification setup record](../operations/sample-credit-email-0179.md).

## Results

- `pnpm validate` passes after the final mobile edits: formatting, ESLint, strict
  TypeScript, 202 unit tests and production build. Subsequent documentation edits
  pass scoped formatting and whitespace checks. Review found no actionable issue.
- All 51 generated client JavaScript files exclude the reusable code and former
  apply command; local HTTP requests to that command receive 400.
- Desktop Overview has equal top/bottom flexible space below fixed tabs. All
  three expanded disclosures collapse the spacers and remain scrollable. The
  Shop bag carries the selected Culinary identity and 1 kg format, verified in
  the light palette; hero and sample labels also reviewed in dark.
- Mobile review at 320 × 740 and 390 × 844 confirms visible bags, bounded label
  content, no horizontal overflow, functional hint/popup and Escape focus return.
  The canonical mobile sample panel has one pouch trio. Desktop and independent
  study imagery are preserved. Shipping explanation is hidden until Ordering
  information is opened.
- The branded Shopify template saved successfully; editor readback exactly
  matches the intended real conditional source. No test message or order sent.
- Evidence in `.local/stickers-0179/`: `centered-overview.png`,
  `shop-sticker-light.png`, `mobile-home-sample-bags.png`,
  `samples-mobile-hint.png`, `sample-label-mobile.png`, and
  `order-confirmation-brand-final.png`.
- The older manual `samples-scroll.mjs` recipe targets an earlier gallery and
  was not used as evidence. Live browser interaction verified these changes.
