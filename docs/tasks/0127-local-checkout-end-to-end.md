# Task 0127 — Configure and test the complete checkout flow

Date: 2026-10-07
Status: Complete — local test checkout verified; production release remains separate
Authority: Owner explicitly requests configuring checkout through order
completion, suggesting a zero-value test product if useful.

## Scope

Connect the existing ATOMA cart to Shopify-hosted checkout in local development
and test the complete journey for US and Singapore destinations in JPY.
Use the existing authorized test shop `h0cuaw-f7.myshopify.com` and a verified
test payment gateway so no real payment is charged. A zero-price product is an
optional fallback, not a requirement to change existing catalog prices.

Record the local test exception in ADR 0004. Enable the existing Checkout
control without redesigning the drawer. Preserve sealed cart sessions,
same-origin protections, authoritative cart validation, exact checkout-host
validation and existing error/review states. The server redirects directly;
checkout credentials must not enter cart JSON or logs. Production stays gated.

Activate the prepared US/SG markets only for the authorized test-shop workflow,
retaining JPY and existing international rates as test inputs. This does not
approve client shipping charges, transit promises or a storefront launch.
Inspect fulfillment settings before placing orders. Use clearly synthetic
buyer details and an `example.com` email, with no shipping labels, fulfillment,
real card details or new paid service. Verify the resulting orders are test
orders and clean up test reservations where supported.

## Validation

- Exercise storefront selection, cart, hosted checkout, destination and shipping
  selection, final JPY total, simulated payment and order confirmation.
- Verify resulting test orders and their unfulfilled status in Shopify Admin.
- Test declined payment/retry where the test gateway supports it.
- Confirm checkout gate defaults off, rejects production/nonlocal hosts and
  cross-origin requests, and never redirects empty/invalid carts or untrusted
  checkout URLs. Preserve mutation/review guards and refresh on return.
- Run focused tests, browser checks, `pnpm validate` and scoped diff review.

## Initial findings

The cart adapter already supports fresh checkout URL retrieval and strict host
validation. The local API hardcodes checkout off and the drawer is disabled.
Shopify Payments and PayPal setup are incomplete; no active gateway was found.
The shop has a Grow plan, so it is not a Shopify development-plan store; it is
the dedicated test shop authorized by ADR 0003. The built-in `(for testing)
Bogus Gateway` is available in the Admin provider list.

Shopify recommends test gateways for simulated orders without payment charges.
A free physical product can still attract shipping, and a free total does not
exercise payment handling. Prefer the test gateway with existing test products.

- [Shopify test gateway setup](https://help.shopify.com/en/manual/checkout-settings/test-orders/payments-test-mode)
- [Processing a test order](https://help.shopify.com/en/manual/checkout-settings/test-orders/processing-test-order)

## Implementation and saved configuration

The existing cart Checkout control now submits an empty same-origin POST to
`/api/checkout`. The server validates the current cart and returns an immediate
303 to a freshly fetched, exact-host Shopify checkout URL. Checkout remains
disabled unless the explicit test flag, authorized shop/checkout host,
development/test runtime and canonical loopback request host all match.
Production and nonlocal requests fail closed. No layout or CSS change was needed.

The drawer blocks checkout during mutations, errors and required cart review,
refreshes when returning from checkout, and opens with localized retry guidance
after a failed handoff. Homepage retries preserve one valid public `matcha`
selection while discarding unrelated or invalid query parameters. Checkout
credentials are not included in cart JSON, logs or documentation.

Local `.env.local` enables `ATOMA_TEST_CHECKOUT_ENABLED=true` and sets
`SHOPIFY_CHECKOUT_HOST=h0cuaw-f7.myshopify.com`; `.env.example` defaults off.
The Storefront adapter remains pinned to API `2026-07`.

In the authorized test shop:

- Activated Shopify's built-in `(for testing) Bogus Gateway`.
- Activated the previously prepared US and Singapore markets, preserving
  their explicit JPY customization. Japan remains unchanged.
- Verified automatic fulfillment is off before submitting orders.
- Left existing shipping rates and password protection unchanged. Used normal
  protected-store access to exercise hosted checkout.
- Added no paid service, real payment credential, shipping label or fulfillment.

## End-to-end evidence

Both journeys started with ATOMA product selection and Add to cart, used the
existing drawer's Checkout action and Shopify address/shipping entry, and
reached the hosted confirmation page through the simulated payment gateway.
Each used one existing 1 kg Culinary test pouch and synthetic buyer details.

| Destination   | Shopify order              | Confirmation | Product    | Shipping  | Total      |
| ------------- | -------------------------- | ------------ | ---------- | --------- | ---------- |
| United States | `#1001` / `17296172449873` | `00XPYDMHY`  | JPY 10,000 | JPY 3,000 | JPY 13,000 |
| Singapore     | `#1002` / `17296174809169` | `8T7ZACUQ6`  | JPY 10,000 | JPY 3,000 | JPY 13,000 |

Shopify Admin showed both as **Test order**, **Paid** and **Unfulfilled**, with
Bogus Gateway transactions. The US timeline also verified the simulated
decline followed by successful retry. No real money was charged. Returning to
ATOMA showed an empty cart after each completed order; a new cart was created
successfully for the Singapore journey. A transient catalog failure recovered
through the existing Try again control during the second journey.

After preserving confirmation evidence, both test orders were canceled through
Shopify's normal order controls with simulated refunds and restocking selected.
Admin confirmed both canceled/refunded and one item restocked per order.
Cancellation notifications were disabled. The records remain available for
review; no orders were permanently deleted and no items were fulfilled.

Evidence is stored locally under `.local/checkout-0127/`:

- `us-confirmed.jpg` and `sg-confirmed.jpg`: customer confirmation pages.
- `us-admin-test-order.jpg` and `sg-admin-test-order.jpg`: test gateway,
  paid/unfulfilled status and totals.
- `us-canceled-restocked.jpg` and `sg-canceled-restocked.jpg`: cleanup evidence.
- `browser/`: mocked English desktop and Simplified Chinese, Traditional
  Chinese and Japanese mobile checkout/retry coverage.
- `retry-context-validation.log`: final repository gate, all 126 tests,
  formatting, lint, types and production build passed.

The scoped implementation and final diff were reviewed. No database behavior
changed, so no Supabase workflow was required.

## Remaining release decisions

This verifies the local test journey, not production readiness. Keep the test
gateway active for continued testing; disable it before a separately authorized
live-sales launch. Production checkout remains gated by Task 0114.

The current JPY 3,000 rate, 0–2 kg coverage and 3–5 business day wording are
existing test inputs. Client approval of charges, package weights, larger-order
rates, carriers, dispatch estimates and delivery wording remains pending.
USD/SGD pricing remains pending client decision; JPY is retained.

Real payment onboarding, public hosting/buyer-IP handling, operating ownership
and release approval remain separate. Hosted checkout still uses the test
shop's default **My Store 2** branding and English language. Its Continue
shopping link leads to the Shopify Online Store; setting the public ATOMA
return destination, matching branding and checkout localization belong in the
release configuration. Confirmation email generation was recorded by Shopify;
delivery to a real inbox was intentionally not tested with synthetic addresses.
