# Task 0106 — Correct product codes across the storefront and server catalog

Date: 2026-10-06
Status: Implemented and locally verified
Authority: Owner's small-corrections request and explicit backend-code follow-up;
[feedback §4](../briefs/2026-10-06-client-feedback.md).

## Outcome

| Product                       | Existing display | New product code |
| ----------------------------- | ---------------- | ---------------- |
| Ceremonial (upstream Premium) | `[WZKA-02]`      | `WZKA-00`        |
| Barista                       | `[WZKA-01]`      | `UJI-00`         |
| Culinary                      | `[WZKA-00]`      | `UJI-01`         |

Keep brackets as UI presentation. The numeric suffix is a series identifier,
not a ranking. Preserve exact existing handle mappings and explicitly supported
study aliases; unknown/lookalike handles receive no invented code.

## Authorized changes

Create one documented public product-code reference source, used by the server's
`projectCatalog` and the existing UI code formatter. Add the public code to the
catalog projection and publish the same sourced code in product information.
Document this additive API field and its ownership. Use existing components and
Register styling; preserve stable Shopify references, signed purchase locators,
handles, names, variants, quantity rules, cart behavior and historical records.

The backend change is the storefront's server-owned product reference/projection.
It does not rename Shopify merchant SKUs, replace JMM canonical identity, mutate
Shopify Admin or migrate the separate Operations database. Those systems must
not be reported as updated. Keep the exact handle-to-code mapping reviewable for
future Shopify-ID reconciliation; never infer a product code from catalog order,
title translation or an origin photograph.

## Public catalog contract

`GET /api/catalog` adds `products[].productCode`: a bare public ATOMA product
reference (`string`) for an exact known handle, or `null` for an unmapped handle.
`src/lib/product-codes.ts` owns these approved references, with separate explicit
catalog handles and study aliases. The shared UI formatter adds brackets; the
published product-code fact uses the same reference and its feedback source.
Neither product order nor translated display titles determine the value.

This is an additive display/reference field, not a purchase credential, Shopify
merchant SKU or JMM canonical identity. Existing identifiers, signed variant
locators, prices, availability and quantity rules retain their contracts. There
is no vendor package/API version change, new service, dependency, database concept
or permission. Future code updates must reconcile the exact handle mapping and
approved product reference; Shopify-ID reconciliation remains later work.

## Acceptance and validation

- [x] All existing code surfaces show the corrected product association.
- [x] Server catalog and published product facts use the same public code source.
- [x] Unknown handles remain unlabelled; merchant SKUs and raw Shopify references
      remain excluded from browser projection.
- [x] Order, title and price changes do not reassign a code or alter purchasing.
- [x] No layout/theme/scene remount or selection/quantity regression.

Run code-mapping, product-fact and catalog projection tests; retain their private
field guards. Run the existing mocked product-code browser checks for adopted
homepage panels and Shop at desktop/320px in both themes, then `pnpm validate`
and review the final diff. No database behavior changes are authorized.

## Evidence

- The shared reference now maps Ceremonial to `WZKA-00`, Barista to `UJI-00`
  and Culinary to `UJI-01`. The existing bracketed annotation and sourced
  product-detail record reuse it, and the server projection publishes the bare
  code without exposing private merchant fields.
- Focused mapping, facts and catalog tests passed: 21 tests. These include exact
  aliases, unknown/lookalike handles, private-field exclusion, signed-locator
  continuity, catalog reordering and preserved variant money/quantity rules.
- Focused ESLint and `pnpm typecheck` passed using installed Node 24.20.0 and
  pnpm 11.24.0. The scoped final source/test diff and `git diff --check` passed.
- The full mocked product-code browser suite passed 10/10, covering all study
  directions and adopted homepage/Shop codes at 1440px and 320px in both themes,
  unknown-product behavior, selection/quantity continuity and mounted scenes.
- `pnpm validate` passed formatting, lint, TypeScript, all 73 tests and the
  production build. No Shopify Admin, database, production or deployment
  changes were made. Evidence is under `.local/feedback-20261006/product-codes/`.
