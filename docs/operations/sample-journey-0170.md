# Sample journey — Shopify setup and release note

Date: 2026-10-18

Subsequent update: [Task 0178 setup record](sample-offer-0178.md) supersedes the
sample quantities, launch-market price and first-wholesale credit amount below.
This document retains the original setup history.

Status: Shopify configuration and local integration verified; publication review pending

Authority: [Task 0170](../tasks/0170-sample-to-repeat-order.md)

This is an internal repository note, not storefront copy or evidence of a
completed release. The owner authorizes real Shopify backend configuration with
editable provisional terms. The configuring operator verified the records below
on 2026-10-18. Publication review remains separate, and recorded configuration
does not establish completed checkout or subscription lifecycle verification.

## Approved provisional terms

| Item                                    | Approved setup                                                       | Limits                                                                                                       |
| --------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Sample Set                              | JPY 4,800; 30 g each of Ceremonial, Barista and Culinary; 90 g total | One-time purchase. Use the exact mapped offer and Shopify availability.                                      |
| First eligible 1 kg order after samples | JPY 1,000 fixed amount off the designated 1 kg products              | One-time purchases only; once per customer and once per order; no discount stacking; no end date for now.    |
| Subscription                            | Every four weeks at the regular product price                        | Designated individual 1 kg teas only. No recurring discount, prepaid term or minimum commitment is inferred. |

Four weeks is not a calendar month. Shopify remains authoritative for current
prices, taxes, shipping, availability and quantity rules. Approved price is not
approved stock: do not increase inventory or enable overselling without an
actual allocation. Dispatch promises, destination availability, shipping terms
and any minimum commitment still require operational verification.

The amounts supersede Task 0111's earlier illustrative status for this bounded
setup. They do not establish margin, fulfillment or public-launch readiness.

## Sample Set setup record

The configuring operator verified the following saved Shopify offer by readback.

- Product: `16383707316305`; variant: `62997353136209`.
- Title: Sample Set — 3 × 30 g; option: `Set = 3 × 30 g`.
- Canonical handle: `sample-set`; replaces `test-only-sample-set-3-30-g`.
- Price: JPY 4,800; product status: Active.
- Publication: existing Headless channel only; no additional sales channel.
- Stock: 0 preserved. Active product status does not make an unavailable variant
  purchasable, and this setup does not grant a new stock allocation.

The frontend maps the exact handle and option in `src/lib/sample-set.ts`. It
does not hardcode this price or availability; current Shopify catalog data and
cart revalidation remain authoritative. The local Sample Set page was verified
showing JPY 4,800 and unavailable with stock 0; Culinary's current 1 kg offer was
available. These are observations at verification time, not future stock
promises. This record does not publish the ATOMA website or authorize an order
or charge.

Evidence: [Sample Set readback](../../.local/sample-journey-0170/shopify-sample-active.png).

## Native incentive setup

Discount `2383998582865`, code `CONFIGURED-SAMPLE-CREDIT-CODE`, is saved and verified Active:
JPY 1,000 fixed amount off, once per order, once per customer, one-time purchases
only, no stacking and no end date. It applies to the three current 1 kg tea
products and only the customer segment below. Subscription purchases are
excluded so this incentive cannot become an unintended recurring benefit.
Shopify supports these product, customer, purchase-type and usage limits.
[Amount-off discounts](https://help.shopify.com/en/manual/discounts/discount-types/percentage-fixed-amount)

Segment `1200022880337` was saved with this valid query and had **0 matching
customers** at verification:

```sql
products_purchased MATCHES (id = 16383707316305)
AND products_purchased NOT MATCHES (
  id IN (
    16029316120657,
    16029315956817,
    16023530209361
  )
)
```

The eligible product IDs are Premium/Ceremonial `16029316120657`, Barista
`16029315956817` and Culinary `16023530209361`. `NOT MATCHES` uses a space; no
date restriction means all history. All three tea products currently have only
a 1 kg variant, so product-level history represents the current format. Adding
smaller formats under those products requires updating both discount product
scope and purchase-history eligibility to a variant-aware rule before those
formats go live. [Query grammar](https://shopify.dev/docs/apps/build/shopifyql/segment-query-language-reference),
[Product-purchase filters](https://help.shopify.com/en/manual/customers/customer-segmentation/reference-guide/shopify-segments)

Evidence: [Active discount readback](../../.local/sample-journey-0170/shopify-first-kg-discount.png).

**Unverified lifecycle semantics:** Shopify's cited filter documentation does
not specify whether unpaid, cancelled, partially refunded or fully refunded
orders qualify as `products_purchased`. Do not describe the native segment as
guaranteeing a paid, uncancelled, unrefunded sample purchase. Verify these cases
before publication, including whether a refunded 1 kg order re-enters the
segment. Aggregate spend or order count does not prove payment for this sample.

If stricter qualification is required, add a reviewed customer-tag condition
and maintain it from order lifecycle events. Shopify's **Order paid** trigger
excludes partial payments and uncaptured authorizations; **Refund created**
includes partial and full refunds. Reevaluate the relevant sample line and any
other qualifying sample orders instead of blindly removing eligibility for
every refund. Cancellation and refund policy must be explicit. This is a
fallback design, not an assertion that such workflows are configured.
[Order paid](https://help.shopify.com/en/manual/shopify-flow/reference/triggers/order-paid),
[Refund created](https://help.shopify.com/en/manual/shopify-flow/reference/triggers/refund-created)

Store credit is not used for this offer. Shopify documents channel and sign-in
restrictions, and store credit cannot pay recurring subscription bills.
[Store credit](https://help.shopify.com/en/manual/customers/store-credit)

## Subscriptions and customer management

Shopify Subscriptions plan record `100354949201` is saved as **Every 4 weeks**,
**No discount**, for the same three 1 kg tea products listed above. The actual
allocation probe verified supported recurring allocations for all three. The
Sample Set is excluded. The first-party app is free, supports custom storefronts
and requires a supported recurring payment gateway. Bundles are incompatible
with it. [App listing](https://apps.shopify.com/shopify-subscriptions),
[Eligibility and gateways](https://help.shopify.com/en/manual/products/purchase-options/subscriptions/shopify-subscriptions/considerations)

Admin plan creation and the custom storefront integration are separate. The
`unauthenticated_read_selling_plans` permission was enabled on existing Headless
storefront `363329`, and bounded allocation reads succeeded for all three teas.
No additional storefront was created. The local frontend capability flag is on;
the production release gate remains intact. Never put a private token in the
browser. These successful reads supersede Task 0035's historical access denial
for this verified setup. [Headless subscription guide](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/subscriptions)

Evidence: [Four-week plan readback](../../.local/sample-journey-0170/shopify-four-week-plan.png).

Preserve Storefront API `2026-07`, existing validated adapter reads, signed
variant/plan purchase keys and single-attempt cart writes. Plan terms must come
from Shopify; a missing or unreadable plan must not silently submit a one-time
purchase. Keep one-time ordering available when valid. Review capability-bound
guest-cart continuity before changing the capability mode. The supported
adapter scope is constant-price pay-per-delivery, not prepaid or changing-price
plans. [Task 0035](../tasks/0035-subscription-choice.md),
[2026-07 cart line input](https://shopify.dev/docs/api/storefront/2026-07/input-objects/CartLineInput)

The account entry URL
`https://shopify.com/106771611729/account` was verified in Shopify Settings. The
subscription-management page was added to active profile `11957043281`, and the
**Subscriptions** menu entry was saved. No customer subscription contract was
created. Shopify Subscriptions now shows 2 of 6 setup items completed: plan
creation and **Allow customers to manage subscriptions** are checked, and the
earlier management warning is absent. This confirms account setup, not a fully
completed app onboarding or customer lifecycle. Authenticated customer actions
remain unverified: review pause,
skip, cancel and payment management in a separately authorized lifecycle test,
along with the applicable cancellation policy. Native customer accounts also
provide Buy again; its destination and current-price/availability behavior with
this headless storefront remain a verification item. A saved device preference
or prior order price is never a new purchase authority.
[Subscription setup](https://help.shopify.com/en/manual/products/purchase-options/subscriptions/shopify-subscriptions/setup),
[Customer-account capabilities](https://help.shopify.com/en/manual/customers/customer-accounts/upgrade/customization-options)

Evidence: [Customer-account configuration](../../.local/sample-journey-0170/shopify-customer-accounts.png).
The [management-enabled readback](../../.local/sample-journey-0170/shopify-management-enabled.png)
records the completed setup item.

## Follow-up guidance — plan only

Use Shopify Flow and Shopify Messaging if the owner later approves the actual
workflow and message. A small sequence can provide preparation guidance after
sample fulfillment, then offer the eligible 1 kg choice; a later reminder can
link to fresh purchase terms or subscription management. Timing, copy, languages
and sender identity remain pending. Recheck marketing consent and whether the
customer already bought 1 kg before a promotional send, and suppress duplicate
messages. Purchase is not marketing consent. No customer is subscribed to
marketing and no automated send is enabled by this note.
[Automation requirements](https://help.shopify.com/en/manual/promoting-marketing/create-marketing/shopify-messaging/marketing-automations/requirements-considerations),
[Marketing consent](https://help.shopify.com/en/manual/promoting-marketing/create-marketing/customer-contact-information)

Flow is available free on Basic and higher. Messaging currently includes
10,000 emails per month, with usage charges thereafter; confirm the store's plan
and expected volume before activation. Customer messages use marketing
automation, not Flow's internal-staff-email action.
[Flow](https://help.shopify.com/en/manual/shopify-flow),
[Email pricing](https://help.shopify.com/en/manual/promoting-marketing/create-marketing/shopify-email/shopify-email-cost),
[Internal email action](https://help.shopify.com/en/manual/shopify-flow/reference/actions/send-email)

## Verification and release record

| Check                                                                                                   | Status and evidence                                                                                     |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Exact Sample Set offer, saved JPY 4,800 price and publication state                                     | Saved-product readback verified; local page shows JPY 4,800 and unavailable with stock 0                |
| Actual stock allocation and inventory policy                                                            | Stock 0 preserved; new allocation and policy review pending                                             |
| Saved discount code, current 1 kg product scope, segment and all usage settings                         | Verified Active; saved segment has 0 matches                                                            |
| Eligible sample buyer, nonbuyer, prior 1 kg buyer, wrong product, second use and subscription exclusion | Pending behavior verification                                                                           |
| Unpaid, cancelled and partial/full refund eligibility                                                   | Pending prepublication verification                                                                     |
| Saved four-week plan and exact eligible variants                                                        | Verified: Every 4 weeks, No discount, three 1 kg teas                                                   |
| Public selling-plan permission and authoritative allocations                                            | Enabled on existing storefront 363329; all three allocation reads verified                              |
| Shopify account-management URL and configuration                                                        | Settings URL, active-profile page and Subscriptions menu verified                                       |
| Authenticated customer subscription actions and Buy again                                               | Pending; no customer contract created                                                                   |
| Shipping, destinations, fulfillment, cancellation and failed-payment handling                           | Pending operational review                                                                              |
| Payment-provider recurring compatibility and test/live configuration                                    | Pending verification; no order or charge authorized here                                                |
| Frontend validation                                                                                     | Final validation passed: format, lint, types, 167 tests and build; desktop/mobile browser checks passed |
| Public website release                                                                                  | Not authorized by this setup task; owner review required                                                |

Test projection, exact plan/price retention, ineligible or stale purchase keys,
mixed one-time/recurring carts, quantity changes and error/pending behavior with
isolated mocks first. Actual checkout, renewal and refund lifecycle verification
requires a separately authorized controlled test and documented cleanup. This
setup does **not** create an order, customer subscription contract or charge.

Keep existing release gates intact: local test checkout is permitted only under
its established non-production, verified-shop/host and simulated-payment
boundary. Backend configuration does not enable live payment, establish the
hosting/buyer-IP contract or approve public deployment. Preserve current cart
reconciliation; window focus or closure never proves payment. Confirm the
existing commercial authority, payment onboarding and owner-approved release
step before public checkout. [ADR 0003](../adr/0003-reviewed-headless-catalog-and-cart.md),
[ADR 0004](../adr/0004-local-test-checkout.md),
[ADR 0006](../adr/0006-native-shopify-checkout-popup.md)

Before pausing or revising an active offer, review existing contracts separately:
expiring a discount code does not remove its snapshot from an existing
subscription contract. Record any actual operational changes in Task 0170;
do not store credentials, customer identities, raw Shopify payloads or payment
details in this note. [Subscription discount behavior](https://help.shopify.com/en/manual/products/purchase-options/subscriptions/manage-subscriptions/subscription-discounts)

## Destination switch update, 2026-10-18

Task 0171 adds the functional US/SG shipping-country switch. Shopify markets now
use USD for US and SGD for Singapore, with Shopify-managed conversion and
rounding. The JPY product and incentive amounts above remain the underlying
shop configuration, not fixed local-currency display amounts. This update does
not change inventory, fulfillment terms, the first-order incentive or the
four-week regular-price subscription rules. Review final payment currency and
shipping before publication as documented in ADR 0008.
