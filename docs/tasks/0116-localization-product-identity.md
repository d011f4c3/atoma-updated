# Task 0116 — Stable product identity for localization

Date: 2026-10-07
Status: Implemented and verified locally; language/market rollout still pending
Authority: Owner request to proceed with [Task 0112](0112-international-pricing-shipping-and-localization.md).

## Outcome

Prepare the first localization implementation slice by decoupling known product
presentation from English Shopify titles. The current English display names,
applications, descriptions, powder imagery and sample profiles must remain
associated with the same products when upstream titles are translated.

Use the existing exact catalog-handle/study-alias registry with stable product
keys. Resolve known names and application content from those keys; share the
same name lookup across selection, Shop, Origins and cart headings/accessibility
labels. Keep current English text unchanged. Preserve the existing literal-title
fallback for unknown products and historical study/bag-label fixtures, using
own-property-safe application lookup.

## Boundaries

This slice needs no new language, market or shipping assumptions. Language and
launch-country questions are pending with the owner. No language or country
selector is introduced until its underlying behavior can be completed.

Preserve all markup, styling, fonts, animation, mounting, selection, dialog
return and commerce contracts. Do not change product codes, signed locators,
origin evidence, price, availability, quantities or checkout activation. No
dependency, service, database concept, vendor change or production write.

The pinned commerce adapter currently supports JPY only and has no country or
language context, localization query, buyer-country update or shipping operations.
Destination pricing needs a separate reviewed adapter slice plus confirmed
markets. Task 0114 remains relevant to checkout activation, not this preparation.

## Validation

- Known handles and exact study aliases retain the same names and profiles
  for translated, empty, reordered or contradictory titles.
- Unknown/lookalike handles retain their previous fallback; inherited object
  keys cannot acquire application content.
- Codes and origin relationships remain independent of translated titles.
- Mocked browser checks cover the canonical English UI with translated upstream
  titles, product images/labels, cart accessible names, selection/quantity and
  mounted scenes in both themes and desktop/mobile widths.
- Run focused tests, `pnpm validate`, and review diff and screenshots.

## Evidence

- Stable `ProductKey` values and `getProductKey` reuse the existing exact handle
  registry. Known names and application content resolve from that identity;
  all name consumers pass the existing product handle, including cart accessible
  labels. No current English copy, markup or stylesheet was changed.
- Sixteen focused name/content/code tests passed, including translated, blank
  and contradictory titles, exact aliases, unknown and inherited-key fallbacks,
  unchanged origin records and the historical bag-label behavior.
- `pnpm validate` passed formatting, lint, typecheck, all 90 unit tests and the
  production build. Log: `.local/localization-0116-validation.log`. Source and
  final diff reviewed; `git diff --check` passed.
- The new mocked browser suite passed 4/4 (1366px/320px, light/dark). All three
  products retained identical English Overview text, styles and geometry with
  translated catalog titles. Names, images, profiles, codes, label cards,
  selection, quantity, mounted scenes, Shop/product views, Kyoto's three links
  and cart headings/accessible controls passed. Final browser-script lint and
  formatting passed after fixture hydration/selector corrections.
- Screenshots under `.local/localization-0116/` were reviewed on desktop and
  mobile. No commerce writes occurred. No new language, selling country,
  shipping rule, selector, checkout activation or deployment is included.
- The separate read-only configuration check recorded in Task 0112 confirms
  current Shopify options are Japan/JPY/English only. Target languages,
  launch countries and commercial/shipping inputs remain pending with the owner.
