# Task 0108 — Publish confirmed product information

Date: 2026-10-06
Status: Placeholder slice verified; actual supplier facts pending
Source: [Feedback §3 and §7](../briefs/2026-10-06-client-feedback.md)

## Outcome and scope

The owner's follow-up on 2026-10-06 authorizes placeholder details for feedback
item 3 now. Implement that bounded presentation slice after Task 0107: show a
small, clearly provisional set of ingredient, storage and shelf-life fields
alongside confirmed codes and the corrected origin information. Use neutral
values such as “Supplier details to follow” or “To be confirmed,” not invented
ingredient percentages, storage temperatures, expiry durations or certificates.
Replace the long unpublished-fields sentence with a concise pending-information
note. Keep draft placeholders separate from published facts and from commerce
data; the future verified values must replace them without a layout rebuild.

The owner's subsequent clarification preserves the signed-off UI: add these rows
only to the existing Product record in Overview and retail Product details.
Retain its current definition-list markup, styles, section hierarchy and retail
disclosure. Do not add a Product record to the separate Specifications tab or
introduce another layout, section or visual treatment.

This follow-up authorizes the placeholder presentation, not publication of
guessed supplier facts. No Shopify mutation, dependency or new data service.

Make confirmed ingredients, storage guidance, shelf life, origin and useful
specifications readable on the existing product-information surfaces. Use the
existing publication-aware `ProductFactRecord` first. Compare Shopify product
content/metafields only if that reduces ongoing maintenance; document the chosen
owner and field contract before extending the adapter.

Prepare a three-product fact sheet with value, exact product mapping, source,
reviewer and publication status. Request the actual Made in Kyoto information;
the feedback confirms its existence but supplies none of those factual values.
Do not turn sample sensory/preparation profiles into certified specifications.
Keep shelf-life guidance separate from the best-before date of an individual
pouch. Internal lot records and quality-control tooling remain separate work.

## Acceptance and checks

- Product facts agree across the existing Overview and retail Product record;
  the separate Specifications composition remains unchanged.
- Missing, draft or unsourced facts remain unpublished; simplify the customer
  message without claiming the missing information exists.
- Product codes follow Task 0106; designation/geography follow Task 0107.
- Content has one maintainable source and can be updated without redesigning.
- No new service, CMS, lot UI, private data or unsupported commercial claim.

Run product-fact/publication and relevant rendering tests, preview desktop/mobile
in both themes, run `pnpm validate` and review the scoped diff. Shopify schema or
adapter changes require their own documented contract/version verification;
remote publication is a later release step.

## Content ownership and provisional fact sheet

The existing `ProductFactRecord` remains the source for reviewed facts. A field
must have a nonblank value and source and a `published` status before it becomes
public. `getProductFacts` returns provisional presentation rows separately for
unpublished ingredients, storage and shelf life. A later published field replaces
its placeholder automatically. No placeholder is persisted as a supplier fact,
added to the catalog response or sent to Shopify. No adapter extension is needed.

| Product    | Exact catalog handle                                            | Product code | Ingredients, storage and shelf life | Supplier source                 | Reviewer | Status                           |
| ---------- | --------------------------------------------------------------- | ------------ | ----------------------------------- | ------------------------------- | -------- | -------------------------------- |
| Ceremonial | `test-only-japanese-premium-matcha-powder-for-tea-service-1-kg` | `WZKA-00`    | To be confirmed                     | Awaiting Made in Kyoto evidence | Pending  | Provisional; not published facts |
| Barista    | `test-only-japanese-barista-matcha-powder-for-lattes-1-kg`      | `UJI-00`     | To be confirmed                     | Awaiting Made in Kyoto evidence | Pending  | Provisional; not published facts |
| Culinary   | `jmm-storefront-test-matcha`                                    | `UJI-01`     | To be confirmed                     | Awaiting Made in Kyoto evidence | Pending  | Provisional; not published facts |

Codes retain the approved feedback source documented in Task 0106. Origins use
Task 0107's separate sourced records. Supplier confirmation is still needed for
all three provisional fields; shelf life must describe general product guidance,
not a pouch's best-before date. About and Samples remain later tasks.

## Evidence

- The existing Overview and retail Product record lists now include Ingredients,
  Storage and Shelf life with “To be confirmed (provisional)” values. A concise
  supplier-confirmation note replaces the long unpublished-fields sentence.
  Published product codes remain distinct from provisional rows.
- Existing styles, definition-list structure, section hierarchy and retail
  disclosure behavior are preserved. The separate Specifications tab is unchanged.
- Focused product-fact, code and catalog tests passed: 23 tests, including draft,
  verified, unsourced and inherited-value exclusion and automatic replacement of
  a provisional row after sourced publication. Focused ESLint, formatting and
  `pnpm typecheck` passed with installed Node 24.20.0 / pnpm 11.24.0.
- `tests/product-information-placeholders.mjs` passed 4/4 browser cases across
  1366px/320px and both themes. All three products passed in the existing Overview
  and retail surfaces, retaining selection, quantity, mounted scene and the
  original section hierarchy. Commerce was mocked and no writes occurred.
- Screenshots are in `.local/product-information-0108/`; desktop and mobile
  record crops were reviewed. The scoped diff and `git diff --check` passed.
  Final integrated `pnpm validate` passed formatting, lint, types, all 80 unit
  tests and the production build; the log is
  `.local/feedback-20261006/final-validation.log`.
- Confirmed supplier values remain pending the actual source information. No
  guessed specification, Shopify mutation, new service, schema or deployment was
  introduced. About and Samples were not changed.
