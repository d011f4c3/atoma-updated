# Sample offer and credit — setup record

Date: 2026-10-19

Authority: [Task 0178](../tasks/0178-sample-offer-and-credit.md)

Subsequent change: [Task 0179](sample-credit-email-0179.md) removes the public
cart-code action described below and delivers the code through the Sample Set
order confirmation instead. Product pricing and native eligibility remain.

Inventory update: [Task 0181](../tasks/0181-sample-availability.md) sets Sample Set
stock to 100 and enables continued selling when out of stock, as explicitly
requested by the owner. The zero-stock state below is historical.

This supersedes the sample quantity, launch-market price and credit amount in
[the original setup record](sample-journey-0170.md). Earlier subscription and
customer-account setup remains unchanged. This is an internal configuration
record, not evidence of publication or completed customer redemption.

## Saved product and catalog

- Existing sample product `16383707316305`, variant `62997353136209`, handle
  `sample-set`; title and option now **3 × 20 g**, total net tea **60 g**.
- Description lists Ceremonial, Barista and Culinary at 20 g each, one-time
  purchase, with shipping additional and calculated at Shopify checkout.
- Catalog `212195967057`, **US & Singapore — Sample Set USD 29**, Active,
  currency USD, assigned to United States and Singapore. Sample fixed price
  USD 29.00; other three products included with no fixed price override. No
  overall adjustment; new products automatically included.
- Shopify supplies USD for the US and converts to SGD for Singapore. Base
  product price outside this catalog remains JPY 4,800; no other market policy
  was changed. This does not establish availability in additional countries.
- Inventory and publication remain unchanged: stock 0, no overselling,
  existing Headless channel only. Active does not mean in stock.

Evidence: [saved USD catalog](../../.local/sample-offer-0178/catalog-usd29.png).

## Wholesale credit

Approved amount: **JPY 4,500**, approximately USD 29. Shopify's observed US
exchange rate was 0.0064556922 USD per JPY; 4,500 JPY converts to
USD 29.0506149 before rounding. The discount converts at checkout and will
vary with exchange rates. Do not promise an exact USD 29 discount in every
currency. The native discount record is `2383998582865`, code `CONFIGURED-SAMPLE-CREDIT-CODE`.

The owner explicitly rounded the initial equivalent to a clean JPY 4,500.
The saved discount readback confirms Active, JPY 4,500, with the existing
restrictions intact. [Saved credit](../../.local/sample-offer-0178/credit-jpy4500.png).

Retain customer segment `1200022880337`: prior purchase of the Sample Set and
no prior purchase of any of the three eligible tea products. Those products
currently each have only a 1 kg variant. Preserve one use per customer, one
fixed discount per order, one-time purchases only, no stacking, no expiry.
Multiple eligible pouches do not multiply the credit. Subscriptions are excluded.

The storefront's **Use sample credit** action stores the existing native code
on the headless cart. It does not award store credit or identify the customer.
Customers use the email from their sample order at checkout. Pending means the
code was requested, not that eligibility is established. Applied requires
Shopify to confirm the code is applicable and return a positive allocation.

**Observed cart behavior:** Shopify returned an applicable code and positive
allocation even before this guest cart supplied a customer identity. Therefore
an applied cart allocation does not establish customer eligibility or completed
redemption. The UI says the credit is included in this cart and explicitly tells
the shopper to use the sample-order email at checkout, where Shopify confirms
eligibility and the final total. Retain this distinction in future copy changes.

An automatic discount was considered, but the native automatic-discount input
does not offer the code discount's once-per-customer guard. Retaining the code
behind a button avoids manual typing while preserving that guard.
[Automatic input](https://shopify.dev/docs/api/admin-graphql/2026-07/input-objects/DiscountAutomaticBasicInput),
[code input](https://shopify.dev/docs/api/admin-graphql/2026-07/input-objects/DiscountCodeBasicInput),
[cart discount codes](https://shopify.dev/docs/api/storefront/2026-07/mutations/cartDiscountCodesUpdate).

## Launch verification still required

- Verify paid, cancelled and refunded sample-order membership and prior 1 kg
  history semantics, successful redemption, repeat-use rejection and converted
  totals using an authorized customer lifecycle test. No test order was placed.
- Review physical stock, packed shipping weights, destination/quantity rates,
  dispatch estimates and carrier transit times before publication. No shipping
  amount or delivery promise was invented for this change.
- If smaller tea variants are added later, update the discount and order-history
  rules before those variants go live; product-level history currently assumes
  each eligible tea product is exclusively 1 kg.

## Verification

- Shopify product/catalog and JPY 4,500 native discount saved and read back.
- Website displayed USD 29.00 for the US and SGD 38.00 for Singapore, current
  sample stock unavailable, all three quantities 20 g / total 60 g.
- Live guest cart with one Culinary 1 kg pouch: credit button produced an actual
  matching allocation; USD 65.00 became USD 35.95 before shipping. Country
  change preserved the same item and code; SGD 83.00 became SGD 45.83. These are
  observations at the current rates, not promises of permanent converted prices.
- The test cart item was removed after verification. No checkout, customer
  identity, order, charge, inventory allocation or subscription was created.
- Desktop and 390 × 844 mobile review: readable credit state, no horizontal
  overflow, existing purchase controls retained. Evidence:
  [cart credit](../../.local/sample-offer-0178/credit-cart-final.png),
  [mobile](../../.local/sample-offer-0178/credit-cart-mobile.png),
  [US sample price](../../.local/sample-offer-0178/samples-usd29-desktop.png).
- `pnpm validate`: formatting, lint, strict types, 208 tests and production build
  pass. Fifteen focused backend tests exercise the credit API/adapter; review
  found no actionable issue. UI browser recipes were syntax checked, with live
  interaction reviewed through the browser. Full paid/refunded/one-use lifecycle
  checks remain the separate launch requirements above.
