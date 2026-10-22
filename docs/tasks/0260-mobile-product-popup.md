# Task 0260 — Mobile product popup

Date: 2026-10-23
Status: Complete

## Direction

The owner rejects the canonical Barista popup on phones and requests a layout
built to fit mobile screens. Replace the tall image and cramped reader with a
compact product introduction, readable full-width learning and one continuous
scrolling body. Keep Close available and give purchasing a clear, reachable
place in the flow.

Preserve approved desktop popups, saved studies, complete application cutouts,
image and information choices, all product facts, both themes and localization.
Retain native dismissal, exact focus/scroll/history return, independent order
state and commerce eligibility. No new assets, dependencies or deployment.

## Verification

Review Barista and the other products at 320, 390 and 430 px, short landscape,
both themes, Japanese and enlarged text. Exercise profile/image choices,
purchase reachability, formats/unavailability, quantity retention and dismissal
with isolated fixtures. Check desktop preservation, run relevant browser checks
and `pnpm validate`, and review the final diff.

## Result

- Replaced the tall mobile image and constrained nested reader with a compact
  name-and-object introduction and a single scrolling body. The complete profile
  precedes the purchase area; image switching and Overview/Preparation remain.
- Kept Close in a persistent header and added a mobile Order shortcut that moves
  directly to, and focuses, the purchase region. Available, unavailable, multiple
  format, pending and error states keep their existing commerce rules.
- Added a quieter image selector and a distinct purchase area. Phone landscape and 200% text reflow without sideways scrolling; enlarged
  quantity controls retain usable touch targets.
- Desktop popup capture at 1440 × 900 is byte-identical to the before capture.
  The mobile homepage/study regression suite passed all six cases.
- All eight product-popup cases passed, including new 320 × 568 Barista direct
  entry, Order shortcut, complete profile/action reachability, independent orders,
  exact focus/scroll return and Back/Forward. Enlarged Japanese checks cover
  horizontal fit before automatic control scrolling can mask overflow.
- Visually reviewed 320/390/430 px, both palettes, all three product cutouts,
  Japanese, 200% text and 844 × 390 landscape. Independent review caught and
  verified the enlarged quantity-stepper fix.
- `pnpm validate` passed formatting, lint, types, 248 unit tests and production
  build. Final diff and whitespace review passed. No deployment or live writes.

Local evidence is ignored under `.local/mobile-popup-0260/`.

## Owner refinement — reduce clutter

The owner finds the first mobile pass too busy, especially the large boxed image
switcher. Replaced it with small text choices and a thin active rule beneath the
image, keeping 44 px touch targets. Removed the redundant application heading
from the popup toolbar and the dividers between profile rows. Reduced supporting
label, tab and heading scale while retaining 16 px descriptive text and values.
The dialog now sizes to its content instead of leaving a blank lower region.

The refined mobile presentation was reviewed at 320/390/430 px, both themes,
Japanese and short landscape. All eight popup behavior checks passed, including
200% Japanese and retained purchase/dismissal behavior. Desktop remains unchanged.
