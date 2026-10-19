# Task 0184 — Sample Set ordering panel study

## Request and scope

Create a final comparison for the homepage's Sample Set information panel.
The current right-side powders duplicate the foil trio on the left and push
ordering too far down. Individual tea views are accepted and stay unchanged.

The study lives at `/samples-order-study` with three shareable `layout` choices:
`essentials`, `index` and `purchase`. It retains the existing left-hand foil
trio, tea selectors and in-place exploration. This task does not adopt an
option on the canonical homepage or redesign `/samples`.

## Design and implementation boundaries

- Remove repeated right-side product imagery on desktop. Compare a compact
  summary, a text-led contents index, and purchase-first disclosure.
- Keep real price, quantity and Add to cart visible early, at existing brand
  type scales and with the current shared button treatment.
- One mounted purchase hook and shared purchase component retain sample
  quantity while study options change; individual tea state remains separate.
- Reuse exact reviewed 3 × 20 g offer resolution and catalog pricing,
  availability, destination, cart and quantity rules. Do not invent price or
  bypass unavailable/error/review states.
- Keep shipping and credit terms inside Ordering information. The approved
  ¥4,500 credit remains delivered by email after the sample purchase.
- Keep the mobile foil trio and pouch inspection available without duplicate
  images, and preserve keyboard access and reduced-motion behavior.
- Studies use an independent appearance choice; canonical theme and journey
  defaults are not changed. No Shopify mutations or deployment are in scope.

## Verification

Pending implementation and desktop/mobile browser review, state/ordering checks,
`pnpm validate` and final scoped diff review.

## Final review

The three treatments were reviewed in the in-app browser; switching retained the selected sample quantity. Essentials was adopted on the canonical homepage in Task 0187. Its Add to cart action is visible at 1280 × 720. Individual tea selection still opens the established Overview and tabs. The separate study routes were removed by concurrent workspace cleanup before the final push; the comparison component remains in source.
