# Task 0225 — Make product differences and the next action clear

Date: 2026-10-20
Status: Implemented and verified locally

## Scope

Third work group authorized by the owner's request to complete the six client
feedback groups before returning to the CX study. Builds on Tasks 0223–0224 and
F04–F07 in Task 0221. Read both October briefs again during this pass.

Improve canonical Shop cards to read name, application, short description,
published format/price and details. Add a visible three-tea comparison using
existing application, illustrative flavour/colour and current catalog offers.
Do not turn authored profiles into verified product specifications. Missing,
ambiguous, unavailable and refreshing offers must remain explicit.

Expose the selected tea's essential sensory values in Overview and before
purchase controls on its product page. Keep secondary explanations, origins
and product records available without making them prerequisites to ordering.
Keep the existing typography and palette system, silver material scene,
cart contracts, unknown-product behavior and independent studies.

Use “Order” for the selected product's purchase view, distinct from global
Shop. Restore the same tea's homepage format and quantity on ordinary product
entry; an explicit 1 kg link must resolve that exact pack or show unavailable.
Browser Back retains the previous view and selection. Do not create a second
commerce authority or infer a format from product titles.

## Verification

Test identity/offer resolution, missing or ambiguous formats, unavailable
offers and explicit-format precedence. Browser-check desktop/mobile comparison,
all three visible profiles, ordinary and exact 1 kg entry, browser Back, cart
retention, keyboard actions and non-English layouts. Use isolated catalog/cart
fixtures; no external writes. Run focused checks, `pnpm validate`, visual
review and final diff review. No deployment.

## Result

The canonical Shop now has clearer cards and a visible three-tea comparison.
Seven sensory values and their illustrative status are visible in Overview and
before product purchase controls. Published Overview formats/prices are visible;
secondary specification explanations and product records remain optional.
The product tab reads Order. Ordinary retail entry restores the same tea's
homepage selection without writing back over its separate return state.
Explicit 1 kg entry resolves that pack before any saved choice.

- Twenty-one main-view captures cover 1440 light English, 390 dark English and
  390 light Japanese, with extra missing/ambiguous/unavailable/refresh cases in
  `.local/client-feedback-0225/after`.
- Browser checks passed category-independent comparison, named keyboard links,
  all three profiles, 100 g/quantity restoration, explicit 1 kg precedence,
  browser Back, retained cart and suppression of stale prices during refresh.
- Thirteen new unit tests cover comparison/offer resolution and entry intent.
  `pnpm validate` passed formatting, lint, strict types, all 233 unit tests and
  the production build. Duplicate translation entries found by the check were
  removed in favour of the existing canonical translations.
- Representative desktop/mobile layouts and final diff were reviewed. Tests
  used isolated catalog/cart fixtures; no external commerce writes occurred.
