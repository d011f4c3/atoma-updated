# Task 0224 — Show the application in each product Overview

Date: 2026-10-20
Status: Implemented and verified locally

## Scope

Second work group from the owner's six-part client-feedback request, following
Task 0223. Both source documents request a prepared bowl for Ceremonial, a latte
for Barista and a finished recipe or baked item for Culinary. The first review
may use clearly identified references; final product-result photography is
still an explicit missing input.

Add distinct application imagery and matching short usage copy to the
canonical homepage Overview and dedicated product page. Use exact canonical
product identity, including known aliases; unknown products must not inherit
another tea's image. Preserve powder imagery for material context, existing
Specifications, cart and product selection, palettes, languages and saved
studies. The CX study remains a draft.

## Sources and presentation

Use the existing supplied bowl reference and two generated composition
references recorded in [the imagery register](../design/application-imagery-register.md).
Show an explicit reference caption in the interface. None is evidence of the
corresponding tea's actual appearance or performance. Keep imagery, caption
and usage text synchronized when selection changes. Do not publish new sensory,
origin, price, stock or regulatory claims.

Use reserved aspect ratios, intentional crops, localized alt text, responsive
image sizes, appropriate loading priority and a usable failed-image fallback.
Replace these references with approved photographs made using the actual teas
before claiming product results. No deployment.

## Verification

Compare before/after Overview for all three teas on desktop and mobile.
Check image/copy identity, return navigation, unknown handles, slow/failed
images, overflow, keyboard use, both palettes and four locales. Retain the
Specifications and purchase behavior. Run focused tests, `pnpm validate`
and final diff review.

## Result

Canonical Overview and retail pages now use exact identity-matched, localized
application references. Powder remains in material/collection contexts and
saved studies retain their existing presentations.

- Browser fixture checks passed at 1440 light English, 390 dark English and
  390 light Japanese for all three Overview and retail views. Eighteen captures
  and failure/unknown-product cases are in `.local/client-feedback-0224/after`.
- Image/copy switching, mounted material, Shop/Specifications, Samples and
  browser Back passed. Slow and failed images preserve geometry and actions;
  unknown products never borrow another tea's photograph.
- Both exact mapping unit tests pass. `pnpm validate` passed formatting,
  lint, strict types, all 220 unit tests and the production build.
- Representative desktop/mobile crops and captions and the final diff were
  reviewed. Checks used isolated commerce fixtures with external writes blocked;
  they do not verify purchases. Final product photography remains pending.
