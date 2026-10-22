# Client feedback — commercial readiness review

Date: 2026-10-21

Scope: [Task 0228](../tasks/0228-commercial-readiness-review.md), covering
[C01–C04](../tasks/0221-october-client-feedback-backlog.md#c01--reconcile-commercial-decisions-and-release-inputs).

The frontend work is verified locally. Commercial release still needs a
recorded authority decision, approved offer and fulfilment inputs, and fresh
evidence for the approved purchase journey. This report changes no external
settings and authorizes no orders, emails, instrumentation or release.
“Historical” below means evidence recorded by an earlier task, not a fresh
inspection of Shopify or production. Named owners below are proposed roles;
the business owner must assign people.

## Evidence and its limits

| Classification                                        | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                       | What remains unproven                                                                                                                                                |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current local implementation                          | Frontend groups [0223](../tasks/0223-homepage-application-entry.md), [0224](../tasks/0224-application-overview-imagery.md), [0225](../tasks/0225-product-comparison-and-reading-flow.md), [0226](../tasks/0226-tasting-to-named-order.md) and [0227](../tasks/0227-client-mobile-reading-and-motion.md) record local checks of entry, application references, product information, selection continuity, tasting handoff and reading behavior. | Local acceptance does not certify real payment, email delivery, stock or fulfilment. Labelled application references remain subject to final photography.            |
| Current code boundary                                 | [Checkout policy](../../src/lib/checkout-policy.ts) permits the explicitly enabled local test shop only in development/test, on validated loopback requests. [ADR 0004](../adr/0004-local-test-checkout.md) keeps production approval separate.                                                                                                                                                                                                | No production checkout authorization follows from the local exception or this report.                                                                                |
| Historical checkout evidence — 7 October              | [0127](../tasks/0127-local-checkout-end-to-end.md) records US/SG simulated Culinary 1 kg orders, decline/retry, cancellation/refund/restock, and return with an empty cart.                                                                                                                                                                                                                                                                    | These were test payments in JPY. They do not prove the current USD/SGD journey, all offers, real payment settlement, delivery or purchaser email receipt.            |
| Current cart behavior; local verification — 8 October | [0134](../tasks/0134-reconcile-cart-after-checkout.md) reconciles authoritative cart state after checkout return and while visible.                                                                                                                                                                                                                                                                                                            | An empty/missing cart can also mean expiry; it is not proof of payment and cannot authorize a purchase analytics event.                                              |
| Historical market configuration — 18 October          | [0171](../tasks/0171-destination-switch.md) records US/USD and SG/SGD contexts, Shopify conversion and preservation of cart identity and selections.                                                                                                                                                                                                                                                                                           | Current enabled markets, final settlement, shipping rates, duties and dispatch promises need approved evidence. Display currency is not settlement evidence.         |
| Historical sample configuration — 19 October          | [0178](../tasks/0178-sample-offer-and-credit.md) records three 20 g samples at USD 29 excluding shipping and native JPY 4,500 credit. [0179](../operations/sample-credit-email-0179.md) records the saved purchaser-email template. [0181](../tasks/0181-sample-availability.md) records sample stock set to 100 and continued selling at zero enabled.                                                                                        | These are dated configuration records, not current stock or price guarantees. Actual email delivery and the full eligibility/redemption lifecycle remain unverified. |
| Historical subscription capability — 18 October       | [0170](../tasks/0170-sample-to-repeat-order.md) records real four-week selling-plan allocations and a subscription-management destination for the three 1 kg products.                                                                                                                                                                                                                                                                         | No customer contract was created. Management actions, recurring fulfilment and release terms remain unverified.                                                      |

## C01 — Decide the commercial contract

**Owner:** business owner, with commerce engineer and operations lead.
**Acceptance:** one reviewed decision record gives the exact approved offers,
identities, markets, currency, credit and fulfilment terms, with evidence and
named owners for exceptions. Unknown values remain unpublished.

| Decision                                 | Required input / action                                                                                                                                                                                                                                                                                 | Acceptance evidence                                                                                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production authority and release         | Resolve [0114](../tasks/0114-storefront-launch-boundary.md): use the accepted Core-reconciled model, or explicitly approve and bound a Shopify-led interim model. Name owners of inventory, pricing, order recovery, refunds and fulfilment; define hosting, trusted buyer IP, monitoring and rollback. | Approved ADR identifies any superseded clauses and the separate human release step. A frontend implementation is not that decision.                                                                               |
| Production identities and offers — D2/D6 | Confirm production product/variant IDs, canonical URLs, merchant SKU mapping and supported exact 1 kg offers; preserve legacy saved-selection continuity. Define any 5/10 kg bundles, quote destination and recurring terms.                                                                            | Reviewed mapping and offer matrix. Five/ten 1 kg pouches must not become invented 5/10 kg pack variants.                                                                                                          |
| Sample contents and price — D3           | Reconcile the directive's open USD 49 proposal with the existing recorded USD 29 offer, three 20 g contents and actual destination pricing. Older JPY 4,800 / JPY 1,000-credit records are superseded by [0178](../tasks/0178-sample-offer-and-credit.md).                                              | Approved current commercial values, effective date and authoritative price readback; no hardcoded currency conversion.                                                                                            |
| Credit — D4                              | Confirm native JPY 4,500 amount, first eligible 1 kg purchase, once-per-customer use, required identity, one-time purchase/no-stacking terms and currency handling. Define paid/cancelled/refunded order treatment.                                                                                     | Approved eligibility matrix plus C02 results. Preserve email-only delivery and the retired public apply-credit API in [ADR 0009](../adr/0009-sample-credit-cart.md). Email secrecy is not an eligibility control. |
| Destinations and fulfilment — D5         | Confirm pilot markets, packed weights, shipping bands/rates, dispatch wording, duties, carrier responsibility and payment-provider settlement support.                                                                                                                                                  | Signed-off shipping/payment matrix matching checkout. The historical test rate and transit wording in 0127 are not approved promises.                                                                             |
| Stock and architecture reconciliation    | Reconcile older JMM three × 30 g / 90 g Sample Set and default-disabled backorders with the later three × 20 g offer and explicit sample-only continued-selling approval in 0181.                                                                                                                       | Bounded cross-record decision updates the relevant product/BOM and sample exception. Do not silently change all products' backorder policy or equate historical Shopify quantity with verified physical stock.    |

## C02 — Verify the approved journey

**Owner:** commerce engineer and QA; business/operations owners approve expected
results. Start after C01 and explicit authorization for the test environment.
Record the environment, offer/variant, destination, currency, expected result,
actual result and redacted evidence. Separate fixtures, authorized test orders
and any separately approved production verification.

| Case                                           | Acceptance check                                                                                                                                                                                                                                                  | Existing evidence / remaining work                                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sample Set and each of three exact 1 kg offers | Correct variant/quantity, destination currency, shipping, discounts and final payable total; approved payment and confirmation; unavailable/ambiguous exact pack cannot silently substitute another.                                                              | Frontend/fixture behavior exists; 0127 covers only historical simulated Culinary checkout. Repeat the approved matrix with current offers and US/SG context.                       |
| Credit and purchaser email                     | Sample purchaser receives the real confirmation email; eligible first 1 kg redeems the approved amount. Verify no sample history, prior wholesale history, wrong identity, duplicate use, stacking, subscription and cancelled/refunded history according to C01. | Saved template and layout preview are not delivery evidence. The reusable customer-restricted code is not a unique per-order entitlement. Do not expose it in public APIs or logs. |
| Failure and recovery                           | Declined/cancelled payment, retry, unsupported destination, unavailable offer, changed total and cart return produce truthful state without duplicate mutation.                                                                                                   | Historical decline/retry and current cart reconciliation help; verify the full approved matrix. Returning focus or an empty cart must not be reported as payment success.          |
| First order, repeat order and quantity         | Samples → named 1 kg → checkout → return/reorder retains the intended product/format; explicit 1 kg entry wins over a saved smaller format. Totals remain Shopify-authoritative.                                                                                  | Local handoff and selection checks passed in 0225/0226. Authoritative first/repeat order outcomes need authorized order evidence.                                                  |
| Optional recurring/quote paths                 | If included in release, verify disclosed cadence/terms, actual contract creation, management/cancellation and fulfilment; verify a staffed quote destination.                                                                                                     | Selling plans exist historically; lifecycle and operating ownership remain open. Exclude these paths from release claims until approved and tested.                                |

**Completion:** reproducible evidence covers every approved row and adverse
case; remaining exclusions have named owners. Test success does not authorize
production release.

## C03 — Proposed eight-event contract

**Owner:** product owner with frontend/commerce engineers. This is a proposed
contract only; no collection, provider, dependency or instrumentation is added.
Purchase events require verified order/payment evidence through an approved
server integration, never browser favourites, checkout return or cart emptiness.

| Event                | Proposed trigger and authority                                                                                                           | Deduplication boundary                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `view_product`       | Exact known product detail becomes visible on its route or canonical product panel; exclude prefetch and hover.                          | View instance + product; no repeats from rerender.                                        |
| `select_application` | Visitor explicitly activates an application choice.                                                                                      | One event per deliberate activation; exclude focus and programmatic restoration.          |
| `view_sample_set`    | Sample Set page or relevant sample panel becomes visible.                                                                                | View instance + sample surface.                                                           |
| `begin_checkout`     | Server accepts an authorized checkout handoff. It denotes entry, not payment or guaranteed checkout-page arrival.                        | Accepted handoff request; retries share an idempotent event key.                          |
| `sample_purchase`    | Authoritative qualifying paid order contains the exact approved Sample Set variant.                                                      | One event per qualifying order, including orders containing other products.               |
| `view_1kg`           | A uniquely resolved actual 1 kg offer is visible, with its true availability status. A query string alone is insufficient.               | View instance + product + stable format.                                                  |
| `first_1kg_purchase` | Authoritative first qualifying paid 1 kg purchase across the approved matcha range. Proposed range-wide definition needs owner approval. | One first-purchase outcome per resolved customer history; unknown history is not “first.” |
| `repeat_purchase`    | Authoritative later qualifying paid 1 kg order under the approved history definition.                                                    | One event per subsequent qualifying order; never a reorder-button click.                  |

Before implementation, approve:

- **Semantics:** what makes an order qualifying; paid/cancelled/refunded handling;
  guest identity reconciliation; cross-tea repeat orders; recurring renewals.
  Keep sample-purchaser cohort separate from first/repeat classification.
  Overlapping order events must not be summed as independent total orders.
- **Minimal fields:** schema version, event name, UTC occurrence time, opaque
  deduplication key, test/production designation, surface, canonical product and
  application, published format grams, integer quantity, and actual
  market/currency where relevant and known. Purchase amounts, if needed, use
  authoritative integer minor units plus ISO currency, with defined
  tax/shipping/discount treatment.
- **Privacy and transport:** provider, consent, retention, access and ownership.
  Exclude tasting notes, recipes, staff identity, names, emails, addresses,
  browser-derived IP, raw URLs/query strings, cart credentials and checkout
  tokens from this proposed payload. Keep raw order/customer references inside
  the approved authority boundary; export only an approved opaque event key.
  No new webhook or service permission follows from this event map.
- **Verification:** fixture tests for trigger, deduplication, missing history,
  consent and refund/cancellation semantics; then authorized integration proof.
  Account sync, staff sharing and larger-order enquiries need separate scope.

## C04 — Prepare the 3 November discovery

**Owner:** operations lead with backend engineer. Confirm the year, date, onsite
owner and deliverables for the source's **3 November inventory discovery**.
It is a data-validation milestone, not a release deadline.

Discovery should produce:

1. A reviewed mapping of product, SKU, pack/BOM, Shopify identities and saleable
   offers, explicitly resolving the Sample Set discrepancy above.
2. Evidence and approval rules separating physical stock, QA-approved saleable
   stock, allocations and unreserved available-to-promise. Identify who releases
   stock and what happens when quality or import/export checks are missing.
3. A bounded public projection contract for verified lots, availability,
   allocations, order status, tracking and shipping rules: field owner,
   publication permission, freshness, reconciliation and failure behavior.
4. A decision log for unknowns and manual approvals, followed by separately
   scoped integration tasks. Planning workbooks are not import authority;
   opening balances require the approved frozen export and release process.

Preserve the accepted JMM boundaries:

- [ADR 0015](../../../JMM/docs/adr/0015-v2-client-direction-and-reconciliation-boundary.md):
  GVJ is the legal operator, Phase 1 seller and inventory owner. JMM is the
  internal foundation. Product identity, lots, ownership, custody, offers and
  allocations remain distinct; physical inventory is attributable and
  ledger-backed.
- [ADR 0016](../../../JMM/docs/adr/0016-single-postgres-authority-with-separated-application-boundaries.md):
  Core owns operational invariants and approved offers/available-to-promise;
  Shopify owns public merchandising, cart, hosted checkout, payment and its
  external order/refund state. Shopify availability is a conservative
  projection, not a replacement for the physical ledger. Verified integration
  is idempotent and reconciled. Warehouse/Operations work goes through owned
  commands and queries, not an independent stock authority.
- [ADR 0018](../../../JMM/docs/adr/0018-atoma-public-experience-and-storefront-reset.md):
  ATOMA is the public interface. It consumes approved projections without
  private database rows or credentials. Editorial presentation cannot override
  commercial facts or publication consent.

The next commercial action is to assign C01 decision owners and approve its
inputs. C02 execution, C03 implementation and C04 integration then receive their
own bounded tasks and required authorization.
