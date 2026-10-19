# Task 0205 — Sample comparison and tasting cards

Date: 2026-10-19

## Request and scope

Add “Compare your samples” and tasting-card tools below the fold on `/samples`.
Place one compact workspace after Inside the set and before the existing
preparation photograph and next-order selection. Keep the main purchase flow,
homepage, saved favourite, catalog authority and commerce actions unchanged.

## Experience

- Choose any of the three canonical teas, add personal notes and optionally
  record hot, iced or recipe preparation, matcha dose, water and milk amounts.
  Save one card per tea on this device. Unsubmitted edits survive switching teas
  during the current visit; save and clear remain explicit actions.
- Compare two distinct teas using the existing application and sample-weight
  facts alongside saved recipes and notes. Personal observations are clearly
  separate from product facts. Changing a selector never changes the order.
- Expand a card preview, copy its text or download a portable PNG with the
  existing product code, recipe and notes. Clipboard failure exposes selectable
  text. Export remains usable when device storage is unavailable.
- Mobile uses the existing shared type scale, native 16 px form fields and
  touch-sized controls. Recipe fields and previews are optional disclosures.
  Both themes and all four storefront languages are supported. Reduced motion
  needs no special behavior because the tools add no motion; without JavaScript,
  interactive actions are disabled and an explanatory message is shown.

## Data boundaries

Use a separate versioned local-storage record with canonical tea keys, bounded
notes and validated quantities. Recipe doses are stored as integer milligrams
to support fractional grams without floating-point storage; liquids use integer
millilitres. No price, availability, cart, identity or order history is stored.
Read without writing, preserve other saved cards, verify explicit persistence
and synchronize changes across tabs. Invalid records are ignored. A storage
failure keeps the current draft available for copying or downloading.

The PNG is rendered locally from text using the browser canvas and current
fonts, with wrapping for multilingual text. No external service, account,
dependency, network submission or deployment is added.

## Verification

- Eleven new unit tests cover decimal conversion, quantity and note limits,
  canonical keys, invalid/future storage, record isolation and round trips.
- All twelve isolated browser cases pass: 320 px light, 390 px dark, 1440 px
  desktop, narrow Japanese and both Chinese variants, plus saving/reloading,
  three-tea switching, distinct comparison selections, clear/focus return,
  unsaved drafts, rejected and silent storage failures, tab synchronization,
  clipboard fallback, real PNG download and disabled no-JavaScript controls.
  Catalog/destination/cart reads are fixtures; no network writes occurred.
- Reviewed editor, comparison and card screenshots, and actual exported images,
  in `.local/sample-tasting-tools-0205/`. Dedicated PNG checks in Chrome and
  WebKit also cover multiline text, CJK, emoji, combining marks and long tokens;
  glyphs stay within the image bounds without truncation.
- `pnpm validate` passes formatting, lint, strict TypeScript, all 213 unit tests
  and the production build. Source review and final whitespace checks pass.
- The older `tests/samples-scroll.mjs` stops at an existing assertion that bans
  currency characters anywhere on the page, including the already-published
  ¥4,500 credit copy. That assertion and the credit copy are unchanged here.
  A separate 1440 px motion-enabled desktop probe passes: all three range
  shortcuts, pinned-track movement, tools placement outside the range, editing
  and comparison after scrolling, the following photo reveal and no overflow.
  Evidence is `motion-desktop-result.json` beside the browser screenshots.
