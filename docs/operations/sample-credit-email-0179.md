# Sample credit email and notification branding

Date: 2026-10-19. Authority: Task 0179 and the owner's explicit email-only request.

This supersedes the public cart-code action in Task 0178. The saved product,
USD 29 sample price, 3 × 20 g contents and native JPY 4,500 discount are unchanged.
No inventory, shipping rates, subscriptions or publication settings changed.

## Saved Shopify configuration

The existing Order confirmation template now adds the credit block only when
`line_items` contains variant `62997353136209` with positive quantity. Other
orders retain the standard confirmation without that block. The original
subject and Shopify's dynamic order, payment and delivery content remain intact.

The block tells sample purchasers to keep the email, return when ready, and
enter their code at checkout using the same email address. It states JPY 4,500
(approximately USD 29), first eligible 1 kg wholesale order, once per customer,
one-time purchases only, no combining discounts, with shipping separate. The
return link is the approved headless origin's `/samples#samples-next`.

The email now uses ATOMA's cool neutral colours, restrained typography, lighter
section labels, thin rules, and 6 px button corners. The native Shop tracking
action retains its platform branding. No external font, image upload or new
service is required. The added styles and credit fragment are retained in
[order-confirmation-0179.liquid](order-confirmation-0179.liquid); this fragment
is not a replacement for Shopify's full template.

Checkout's Customer contact method was already **Email**, verified checked;
no contact-setting change was necessary. No test email or customer order was sent.

## Storefront boundary

The public code, Copy code controls and Use sample credit action are removed.
The former API command is rejected before Shopify access. No customer credit
projection or fixed code is present in storefront source or generated client
JavaScript. Authoritative Shopify totals remain unchanged.

Email secrecy alone is not eligibility enforcement. The existing Shopify
purchase-history segment and once-per-customer rules remain essential. This is
a reusable customer-restricted code, not a unique code generated per order.

## Verification and limits

- Shopify confirmed the notification template saved. The real sample-only
  conditional was restored and compared exactly before saving the branded edit.
- The normal preview fixture contains no sample variant and excludes the credit.
  A temporary unsaved forced-positive preview checked the credit block's layout;
  that override was never saved. Preview screenshots therefore demonstrate
  rendering, not a real sample-order delivery or paid-order qualification.
- Checkout's Email contact method is already selected. The code is included in
  an order confirmation, not a separately scheduled marketing message, and does
  not depend on marketing consent.
- Still required before launch: authorized end-to-end email delivery and
  redemption, paid/cancelled/refunded eligibility semantics, rejection for
  non-sample customers, prior wholesale customers and repeat redemption. The
  earlier observation that a guest cart can show a provisional discount before
  checkout identity remains relevant; do not claim completed eligibility there.

Sources: Shopify's [notification customization](https://help.shopify.com/en/manual/fulfillment/setup/notifications/customizing-notification-template),
[notification variables](https://help.shopify.com/en/manual/fulfillment/setup/notifications/email-variables),
[Liquid line item](https://shopify.dev/docs/api/liquid/objects/line_item), and
[checkout contact options](https://help.shopify.com/en/manual/checkout-settings/checkout-form-options).

The public repository uses a placeholder for the configured discount code.
The real value remains in Shopify; replace the placeholder privately before
reusing the notification fragment. Test fixtures use synthetic codes.
