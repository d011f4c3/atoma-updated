# Task 0234 — Build the new homepage and selection flow

Date: 2026-10-21
Status: Implemented and verified locally

## Authority

The owner requests `/new-hero` as a standalone page based on the supplied
P0 homepage feedback, leaving the comparison study aside. The page must
communicate that ATOMA helps businesses choose Japanese matcha for tea service,
lattes and culinary use.

Use “Matcha for the way you make it.” and “Japanese matcha selected for tea
service, lattes and recipes.” The primary entrance is “Start with the Sample
Set”; the secondary is “Explore by Application”.

## Scope

- Build one complete page at `/new-hero`, without study controls.
- Follow brand impression → three application-led products → Sample Set →
  supported quality/origin information → wholesale and repeat orders.
- Preserve IBM Plex Mono, current storefront themes and settled navigation.
  Use existing material and labelled application references.
- Show canonical product names, codes, real catalog prices, formats, quantity
  rules and buying controls. Keep controls visible on touch, with native
  product and sample links available before hydration.
- Use existing catalog/cart contracts. Product origin remains separate from
  editorial photography; no inferred quality, certification or supply promises.
- Preserve `/`, saved concepts and the CX study. No deployment or new service.

## Checks

Review desktop and mobile composition; exercise application navigation, exact
product entry, catalog errors, variant/quantity rules, cart/operation locks,
theme and locale changes, keyboard use and reduced motion against local
fixtures. Run `pnpm validate` and inspect the final diff.

## Implementation

- `/new-hero` follows the requested business flow with the supplied headline,
  primary Sample Set entry and secondary application entry. Material imagery,
  IBM Plex Mono and the Mist / Blue hour palettes retain the ATOMA identity.
- Each application has its canonical name/code, labelled imagery, catalog price,
  published formats, quantity rules and visible Add to cart controls. Native
  fragment links reach the corresponding product, and opening its detail page
  retains the chosen format and quantity, including on browser Back.
- The Sample Set lists the existing three 20 g contents. Origin copy scopes
  Wazuka to Ceremonial; regional imagery remains editorial context. Repeat-order
  links request each exact named 1 kg product through the existing resolver.
- New copy is available in all four storefront locales. Mobile imagery remains
  compact, controls remain visible without hover and reading text stays settled.
  This page starts its native mobile menu closed before hydration so the hero
  actions remain reachable even while scripts are loading.
- Catalog failures, missing/unavailable offers and cart-operation locks reuse
  the current commerce contracts. There are no new prices, supply promises,
  subscriptions, quote endpoints or external services.

The application images retain their reference labels; final product photography
and production-commerce acceptance remain separate from this local page.

## Verification result

- `pnpm validate` passed formatting, lint, strict types, all 238 unit tests and
  the production build, including `/new-hero`.
- `tests/new-hero.mjs` passed eight browser profiles at 1440, 768, 390, 360 and
  320 px across both palettes and all four locales. Captures and measurements
  are stored in `.local/new-hero-0234/after/`.
- Browser checks cover native links before hydration, application scrolling,
  exact variant/quantity rules, unavailable and ambiguous offers, catalog retry,
  operation locks, successful and rejected adds, inline error recovery, theme
  and locale changes, product-detail handoff and Back restoration, exact 1 kg
  reorder links, keyboard access, reduced motion and failed-image fallbacks.
- Desktop and mobile captures were reviewed. Final formatting and whitespace
  checks passed; the scoped changes were reviewed against existing work.

Browser commerce uses isolated in-memory fixtures. No live orders, commercial
settings, external messages or deployment were performed.
