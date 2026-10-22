# Task 0258 — Origin photographs and restrained popup scale

Date: 2026-10-23
Status: Complete

## Direction

Keep the canonical homepage origin section's current layout and copy. Replace
the single panoramic strip with two field photographs side by side on desktop,
and show one taller field photograph in the dedicated mobile experience. This
supersedes the earlier request to move harvest imagery beside the text.

The owner requests a refined canonical product popup with smaller typography,
whole transparent application objects, and all profile information and purchase
controls visible together on a normal desktop viewport. Reducing the outer frame
alone was rejected. Use a content-sized dialog, compact profile beside the image,
and a shared purchase row below them so the purchase area cannot obscure facts.
Retain direct Add to cart, secondary Sample Set action, image switching,
accessible dismissal and mobile readability. Reuse the approved hero cutouts.

Commit the verified storefront work before proceeding to the next queued change.

Use existing supplied photography and neutral captions. Preserve product-origin
facts, both palettes, motion, commerce and saved studies. No new image generation,
dependency or deployment is needed.

## Verification

- Origin review passed nine desktop/mobile/theme/locale cases: two aligned field
  photographs on desktop, one 4:5 photograph on mobile, unchanged study panorama.
- Popup review covers all three products and both themes at 1096 × 646 and
  1440 × 900. Every profile field fits above the full-width purchase row.
  Transparent hero objects remain whole, with controls below the image.
- Fixture checks cover direct purchase, unavailable states, format changes,
  quantity continuity, keyboard dismissal, scroll/focus return and enlarged
  Japanese mobile text. Added a regression assertion for obscured profile fields.
- Full `pnpm validate` passed: formatting, lint, type checking, 248 unit tests
  and production build. Final diff review passed. Desktop approved by the owner.

Local screenshots and detailed observations remain ignored under
`.local/origin-scale-0258/`. No external cart writes or deployment.
