# Task 0122 — Configure Shopify for United States and Singapore

Date: 2026-10-07
Status: US/SG test checkout verified in Task 0127; live shipping terms pending
Authority: The owner explicitly requests configuring shipping and checkout in
Shopify for Singapore and the United States. The earlier decision retains JPY
for both destinations; future currency changes remain pending client decision.
Related: [Task 0112](0112-international-pricing-shipping-and-localization.md),
[Task 0114](0114-storefront-launch-boundary.md),
[ADR 0003](../adr/0003-reviewed-headless-catalog-and-cart.md)

## Scope

Use the authenticated Shopify Admin for the existing authorized test shop,
`h0cuaw-f7.myshopify.com`, to inspect and configure the market, shipping and
checkout settings needed for United States and Singapore destinations. Keep
JPY pricing. Preserve existing Japan settings unless a shared setting must
change to support the requested destinations and the consequence is documented.

The initial Admin inspection shows Japan as the only active market. Record
the actual configuration, changes, verification and unresolved inputs here as
work proceeds. Do not infer shipping coverage from market activation alone.

Use confirmed existing merchant settings where applicable. Do not invent or
silently assume shipping charges, free shipping, carriers, transit guarantees,
dispatch estimates, package weights or dimensions, tax treatment, or duties.
When necessary commercial inputs are absent, prepare the supported settings
and record the exact missing input before making a dependent commitment.

## Boundaries

- This is bounded Shopify Admin configuration, not a storefront redesign.
- The four storefront languages and JPY decision remain unchanged. USD/SGD
  selling currencies are pending a separate client decision.
- Do not place orders, submit payments, buy labels or subscriptions, or publish
  a production storefront launch as part of this task.
- Do not log credentials, buyer information or full Shopify payloads. Record
  only the configuration facts needed to review this work.
- Sample products, incentives, subscriptions, inventory changes, internal
  Operations data structures and merchant SKU migrations remain separate.
- Shopify settings alone do not enable the ATOMA checkout button. Its current
  application gate, exact hosted-checkout host and interim commercial authority
  remain governed by Task 0114 and ADR 0003. Record any follow-on integration
  without silently changing runtime authority in this task.

## Verification

Confirm the intended countries and JPY settings by reopening the saved Admin
configuration. Inspect shipping coverage for the relevant products, fulfillment
location and quantities, and distinguish a destination with a valid rate from
a destination that has only been added to a market. Record checkout/payment
configuration limits without completing an order or payment.

Where useful, repeat the bounded read-only Storefront localization capability
query at the pinned API version `2026-07`, reporting only country/currency
configuration. A country exposed by the API is not proof that shipping and
checkout are fully configured.

Review the scoped documentation diff. Run the repository gate `pnpm validate`
before final handoff when concurrent repository work permits, and report any
verification not performed. No frontend implementation is planned here.

## Interim Admin findings

The authenticated Admin inspection found the following existing configuration.
These settings are observations, not confirmed client shipping terms.

- General shipping profile `144789405777` covers all products from one
  fulfillment location.
- Japan has two existing rates. Leave these unchanged.
- The existing international zone, `国際`, includes 27 countries, including
  Singapore and the United States. Its `Standard` rate is JPY 3,000 for a
  configured weight range of 0–2 kg, with a 3–5 business day estimate. There
  is no rate above 2 kg. This does not establish a dispatch-time commitment,
  a carrier guarantee or coverage for every packed order weight.
- The international destinations are not currently activated for selling:
  Japan is the only active market. The existing zone alone does not make
  Singapore or the United States eligible for checkout.
- No carrier accounts are connected, and estimated delivery dates are off.
- Shopify Payments setup is incomplete, with `Complete setup` disabled.
  PayPal also shows setup incomplete. No active payment gateway has been
  verified.

## Saved configuration and pending decisions

Two markets have been created and saved as drafts:

| Market        | Shopify market ID | Country scope | Status | Currency |
| ------------- | ----------------- | ------------- | ------ | -------- |
| United States | `120256200785`    | US only       | Draft  | JPY      |
| Singapore     | `120256299089`    | SG only       | Draft  | JPY      |

Each market has an explicit Japanese yen currency customization, replacing
Shopify's automatically proposed USD or SGD. Each inherits all products.
The sole-country scope and saved currency were verified. Japan remains active
and unchanged.

The existing international shipping zone and its rates remain unchanged.
The owner has been asked whether to use or replace the existing international
rate, and whether this setup should support test checkout or real payments.
Both responses are pending. Do not activate the existing rate as an approved
customer commitment merely because it already exists in the shop. Rate amounts,
weight coverage and delivery wording still need the applicable decision.

Independent checkout settings inspection confirmed an active configuration,
email contact, guest checkout without required sign-in, required first and
last names, optional address line 2 and shipping phone, and English checkout
language. These settings were not changed. An active checkout configuration
does not establish an active payment gateway or verified checkout availability
for either new destination.

The Markets list was reopened and both draft markets and the existing active
Japan market were verified. The local screenshot evidence is
`.local/shopify-us-sg-0122/markets-draft.jpg`.

Shopify's official guidance distinguishes an active market from an applicable
shipping zone and rate, and documents customizing currency for a market:

- [Setting up shipping zones](https://help.shopify.com/en/manual/shipping/setting-up-shipping-zones)
- [Local currencies in Markets](https://help.shopify.com/en/manual/markets/customizations/local-currencies)

## Completion record

### Follow-on verification — 2026-10-07

The owner's subsequent explicit end-to-end test request is implemented in
[Task 0127](0127-local-checkout-end-to-end.md) under
[ADR 0004](../adr/0004-local-test-checkout.md). Both prepared markets are now
**Active** in the authorized test shop, retaining JPY. Shopify's built-in
Bogus Gateway is active. US order `#1001` and Singapore order `#1002` both
completed through the ATOMA storefront and hosted checkout at JPY 13,000
(JPY 10,000 product plus the unchanged JPY 3,000 shipping rate).
Both were verified as test orders and unfulfilled, then canceled and restocked.

This resolves test payment mode and test-market eligibility. Live shipping
terms, larger-order coverage and production launch authority remain pending.
The earlier draft-only record below describes this task's original execution;
Task 0127 records the subsequent settings, code, validation and cleanup.

### Original draft-market preparation

Draft-market preparation is saved. Shipping terms, market activation and
payment readiness remain pending; this task is not complete. Continue the
rate/payment configuration and market activation after the owner supplies the
pending decisions, then verify actual destination eligibility and totals.

No shipping rate, checkout setting or payment gateway was changed. No live
checkout flow was verified, and no order or payment was placed. The ATOMA
storefront checkout button remains separately gated as described above.

The scoped documentation diff was reviewed and formatted. `pnpm validate`
passed with formatting, lint, TypeScript, all 109 tests and the optimized
production build. Evidence: `.local/shopify-us-sg-0122/validation.log`.
The final inspection notes were subsequently checked with scoped Prettier;
they do not change application code or the Shopify verification limits above.
