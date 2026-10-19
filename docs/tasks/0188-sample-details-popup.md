# Task 0188 — Sample Set details popup

Date: 2026-10-19
Status: implemented; verification in progress.

## Scope

Open Sample Set details in place from the adopted homepage ordering panel and
all three ordering-study layouts. The Samples navigation link continues to
open `/samples`. Keep the current layout, quantity, selected tea and URL.

The reusable trigger opens a native modal dialog with the three canonical
matcha/application pairs, 20 g of each and 60 g total, preparation/comparison
guidance and the emailed ¥4,500 credit for a first eligible wholesale order of
1 kg or more. It adds no purchasing controls or imagery, and does not repeat
the removed conversion, promotion-condition or unpublished shipping estimates.

## Interaction and presentation

Use the shared backdrop-dismiss and background-scroll-lock hooks. The popup is
inset at least 16px on mobile and limited to 82dvh, with internal scrolling and
a persistent close control at least 44px high. Native dialog behavior contains
keyboard focus. Close, Escape, a deliberate backdrop click/tap, or Back to order
returns focus to the trigger without moving the underlying page or navigating.
Typography, colors and button treatment follow the existing storefront themes.

## Verification

The isolated ordering-study browser recipe now checks popup content, native
focus containment, Escape/close/backdrop dismissal, unchanged URL, quantity,
selected tea and scroll position, and the separate Samples nav link. It also
checks that pending orders disable the popup trigger. Browser execution and
visual review remain with the parent task.

Scoped formatting and lint, TypeScript, recipe syntax and all 17 localization
and sample-offer unit checks pass. No Shopify settings or deployment changed.

## Completed browser review

Verified on the study and canonical homepage: the details control opens a native popup without navigating, Escape/Back to order/backdrop dismiss it, focus returns to the trigger, and the selected quantity (2 sets in the check) is retained. The Samples navigation link remains a standalone page link.
