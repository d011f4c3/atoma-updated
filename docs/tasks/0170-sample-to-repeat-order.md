# Task 0170 — Samples, first 1 kg and repeat ordering

Date: 2026-10-18
Status: Complete for backend setup and local integration; publication review remains separate.

## Owner authorization

Integrate the client journey into the product: try the three samples, choose a
matcha, start with 1 kg, then reorder or subscribe. The owner explicitly requests
Shopify implementation of the incentive and subscriptions, real backend
activation with editable provisional values, and a website link to Shopify
subscription management. No storefront deployment is requested. Values and
operational readiness will be reviewed before publication.

The owner approves the client reference amounts for now: JPY 4,800 for the
Sample Set and JPY 1,000 off the first eligible 1 kg order after samples. The
owner accepts a four-week subscription interval at the regular price. Existing
inventory is not increased without an actual stock allocation. No new recurring
discount is inferred. Sample Set remains a one-time purchase.

## Frontend scope

- Preserve current page layouts, brand scales, imagery studies and cart state.
- Add concise sample-to-1 kg guidance and exact product/format destinations.
- Explicit device-only saved matcha preference; no price, cart key or customer
  data is saved. Returning customers review current product terms before adding.
- Exact 1 kg requests fail truthfully if absent or ambiguous; never substitute a
  smaller pack. Existing manual format controls remain available.
- Read actual supported Shopify subscription allocations and retain signed
  plan purchase keys and recurring terms through the existing cart contracts.
  Leave one-time buying available if allocations cannot be read.
- Link the verified Shopify customer-account subscription management surface.

## Shopify scope

Configure the approved figures and schedule using Shopify native tools. Verify
customer eligibility, exact 1 kg product scope, one use per customer and one
fixed discount per order. Keep incentive stacking and automatic follow-up sends
off unless explicitly configured and justified. Do not add marketing customers
or send messages. Hosted subscription management must be verified before its
link is advertised.

Existing checkout, payment and fulfillment release gates remain intact. No
real charge, customer subscription contract or test order is created by this
implementation. Shopify records and launch-review limitations will be recorded
below after verification.

## Verification

Final `pnpm validate` passed after the incentive disclosure: formatting, lint,
strict TypeScript, all 167 unit tests and the production build. Final log:
`.local/task0170-offer-validate.log`. `git diff --check` passed.

Browser checks passed for saved preferences, exact 1 kg destinations, truthful
availability and storage failures at 1440 px, 390 px and 320 px, including
Japanese. Mocked cart checks verified subscription identity, quantity, busy
states, one-time switching and management links. A real read-only storefront
check showed Sample Set at JPY 4,800/unavailable and Culinary at JPY 10,000 per
four-week delivery with the verified account link. No live cart write or checkout
was needed for this read check.

## Verified Shopify setup

The configuring operator verified the following records on 2026-10-18:

- Sample Set product `16383707316305`, variant `62997353136209`: canonical
  handle `sample-set`, JPY 4,800, Active, existing Headless publication only.
  Stock remains 0; no inventory increase or availability promise was made.
  The local page shows that price and unavailable state; Culinary's current
  1 kg offer is available.
- Shopify Subscriptions plan record `100354949201`: Every 4 weeks, No discount,
  for current 1 kg products `16029316120657` (Premium/Ceremonial),
  `16029315956817` (Barista) and `16023530209361` (Culinary).
- Public selling-plan reads enabled on existing Headless storefront `363329`;
  all three actual allocation probes returned supported plans. The local
  frontend capability is enabled; the production release gate is preserved.
- Customer segment `1200022880337`: valid sample-purchase history query with
  no purchase of any of the three eligible teas; 0 matches at verification.
- Discount `2383998582865`, `CONFIGURED-SAMPLE-CREDIT-CODE`: verified Active, JPY 1,000 fixed
  amount, once per order and customer, one-time purchases only, no stacking,
  no end date; restricted to the segment and current three 1 kg products.
- Account URL `https://shopify.com/106771611729/account` verified in Settings;
  subscription-management page added to active profile `11957043281` and
  Subscriptions menu saved. App setup now shows 2/6 completed, including plan
  creation and Allow customers to manage subscriptions; the prior management
  warning is absent. Customer actions remain unverified without a contract.

Detailed settings, exact segment query, official sources and prepublication
checks are in [the operations note](../operations/sample-journey-0170.md).
Product-purchase segmentation does not document paid/cancelled/refunded-order
semantics; verify these before launch. Future smaller variants require
variant-aware discount scope and eligibility. Stock allocation, fulfillment,
live payment and publication readiness remain separate gates.

Evidence:

- [Sample Set](../../.local/sample-journey-0170/shopify-sample-active.png)
- [Four-week plan](../../.local/sample-journey-0170/shopify-four-week-plan.png)
- [First-1 kg discount](../../.local/sample-journey-0170/shopify-first-kg-discount.png)
- [Customer accounts](../../.local/sample-journey-0170/shopify-customer-accounts.png)
- [Management enabled](../../.local/sample-journey-0170/shopify-management-enabled.png)
- [Live website subscription](../../.local/sample-journey-0170/website-live-subscription.png)

No order, payment charge or customer subscription contract was created during
these checks. No automated marketing sends or storefront deployment occurred.
