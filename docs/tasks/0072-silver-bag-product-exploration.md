# Task 0072 — Original homepage with a live silver bag

## Approved brief

The owner withdraws all brand exploration work and requests its deletion.
Return to the original homepage's design and behavior. The supplied packaging
photos establish a silver resealable bag with ATOMA in place of the other brand.
Create `/product-exploration` that replaces the tray with this object. Reuse the
visual layout of the current card for adjustable writing on the bag. Preserve
the original homepage and its paper card.

The owner subsequently approves adoption into the main homepage and refines the
behavior: powder alone until Shop is selected, then powder beside the silver bag.
Package typography must be smaller. Remove the handwritten material caption from
the front and hide personalization. A personalized receipt is a future idea, not
current scope. Restore Ceremonial naming unless the client guide explicitly
requires Premium; retain commerce identifiers and sourced facts.

## Scope

- Remove the separate brand exploration route, components and generated assets.
  Archive the exact removed files outside the project before deletion; preserve
  shared code and historical task records.
- Retain `/product-exploration` and adopt the approved treatment into the main
  homepage using the existing header, selectors, information, cart and themes.
- Generate a blank photographic silver resealable pouch with no foreign logo,
  window or baked text; the photos are material references, not copy templates.
- Render ATOMA and the current card's field layout as smaller live ink on the
  pouch. Product, use, profile, format and quantity follow the existing selection.
  Hide the reference row and all personalization controls in the adopted flow.
  Preserve the original paper LabelCard component and its default behavior for
  existing uses; do not delete it.
- Show only the original animated green powder in the hero, Overview,
  Specifications and Origins. Reveal the bag beside the powder only in Shop.
- Remove the handwritten front material caption and restore the owner's approved
  Ceremonial presentation name without renaming Shopify IDs or handles.
- No copied shipping information or unsupported organic/weight/supplier claims.
  Packaging is a visual study, not a new catalog format or production claim.
- No new dependency, production writes or deployment.

## Validation

Review the adopted flow on desktop and phone: hero, information views, Shop,
theme switching, selection and quantity. Confirm personalization is hidden,
the handwritten front caption is absent and Ceremonial naming is restored.
Audit the original paper component's default behavior. Run relevant checks and the
repository `pnpm validate` gate, then review the scoped diff.

## Result and verification

- Adopted in `/`; `/product-exploration` remains available. The concurrent
  canonical theme work owns `/light` redirects and persistent theme preference.
- The brand exploration route and 43 associated files were removed after an
  exact verified archive at `/tmp/atoma-removed-brand-explorations-0071`.
- Generated asset: `public/images/product-exploration/silver-bag.png` (1024×1536,
  transparent PNG). Built-in image generation prompts and provenance are saved
  in `docs/design/silver-bag-image-prompts.json`. The reference photos were not
  uploaded; no background shipping details were copied.
- Shared card markup provides the ink layout; paper remains the default
  presentation with its movement and reference behavior intact. The adopted bag
  suppresses references and uses typography scaled down by 18%.
- Neither client RTF directs a Premium rename. The display helper maps the
  catalog's Premium Matcha title to Ceremonial Matcha; underlying identifiers,
  availability and product provenance stay unchanged. Focused tests cover the
  exact alias and guard against rewriting unrelated product names.
- Browser-reviewed at 1280×800 and 390×844: powder-only opening, Overview,
  Specifications and Origins; bag plus powder in Shop; correct Ceremonial text;
  hidden references; retained selected product on theme/view changes. Original
  paper behavior was visually checked before adoption and its extracted face,
  motion and pre-existing CSS were compared with the pre-task backups.
- `pnpm validate` passed: formatting, ESLint, strict types, 63/63 tests and
  production build. The initial unrelated Origins expectation failed while
  concurrent work was in progress; the final full gate passes. Final scoped
  changes and whitespace were reviewed. No cart write or production action ran.
