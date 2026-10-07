# Task 0130 — Compare ATOMA checkout experiences

Date: 2026-10-07
Status: Comparison complete; native Shopify popup selected in Task 0131
Authority: The owner explicitly requests exploring branded hosted checkout and
Checkout Kit to decide which fits ATOMA better. Subsequent feedback rejects the
Shopify branding draft and the confusing comparison, and asks how a custom
checkout and payment experience could retain Shopify orders.

## Scope

Create an isolated, reviewable comparison without changing the approved
storefront. Inspect the current official Web SDK and use its actual supported
presentation, clearly distinguishing working behavior from design proposals.
Compare a branded Shopify-hosted checkout with a Checkout Kit Web prototype.
Use the dedicated test shop, JPY, and existing simulated gateway from Task 0127.
No real charges, fulfillment, public deployment, paid plan change or DNS change.

The revised study must distinguish appearance from window behavior. Hosted
redirect and Checkout Kit popup display the same Shopify checkout; neither is
a second design system. Show an isolated ATOMA checkout visual concept using
the approved cart's typography, surfaces and controls. Mark it as a concept
with no payment integration. It must not accept card details, submit orders,
or imply that a custom Shopify payment integration has been approved. Keep the
real integration tests secondary. Preserve the approved storefront.

Keep the rejected ATOMA branding configuration unpublished in the test shop.
Record actual plan limitations. A branded checkout subdomain remains a proposal
until the public domain and release configuration are decided.

An isolated local study may use a pinned official alpha SDK if available.
Document the dependency and any narrow exception needed to hand a fresh
checkout URL to the SDK. Keep checkout credentials out of logs, durable storage,
query strings on local routes and public cart JSON. Preserve all production
gates, authoritative cart validation and same-origin checks. The existing
redirect flow remains the fallback and default.

## Review and validation

- Review both desktop and mobile presentations, keyboard dismissal, return to
  ATOMA, cart continuity, error/fallback behavior and provider constraints.
- Use the existing test product and synthetic contact details only when a
  simulated order is needed; cancel/restock any created test orders.
- Record observed SDK behavior and launch readiness, including any unavailable
  inline embedding rather than presenting a mock as a working integration.
- Run focused behavioral checks, browser review and `pnpm validate`; review
  the final scoped diff. Record evidence and remaining decisions below.

## Findings and outcome

On 2026-10-08, the owner selected Shopify popup checkout with express options.
[Task 0131](0131-shopify-popup-and-express-checkout.md) adopts the existing hosted
checkout in a native browser popup; it does not adopt the custom visual concept
or promote the alpha SDK to the canonical cart. Express activation depends on
the merchant's payment-provider onboarding. Preserve this study as reference.

### Appearance and technical findings

- The test store uses Grow. Standard checkout branding exposes logo, colors
  and font choices; changing these did not reproduce ATOMA's compact cart.
  The owner rejected the result. The configuration named “ATOMA — Checkout
  comparison” is saved as a draft and remains unpublished, verified in Admin.
- The published Web SDK `@shopify/checkout-kit@4.0.0-alpha.4` presents the same
  Shopify form in a popup/new tab. Inline iframe support remains unavailable.
  The SDK is a preview and is not a launch dependency.
- A real test opened a checkout window, but end-to-end SDK handshake and return
  behavior were not conclusively verified. A later unexpected current-tab
  navigation had no established cause. Do not count mocked lifecycle tests as
  proof of Shopify's remote protocol. No order was created in this task.
- The regular hosted checkout's US and Singapore simulated orders were already
  verified and cleaned up in Task 0127; that remains the payment baseline.

### Custom checkout decision

Shopify Plus supports more precise typography, field corners, label placement,
button padding and checkout extensions, while retaining Shopify's checkout
structure. Prove the desired appearance in a suitable development environment
before considering an upgrade; a visual concept is not evidence of support.

An external payment form followed by Admin API `orderCreate` is technically
an order-import architecture, not a generally permitted replacement checkout.
Shopify API Terms section 2.3.18 require express written authorization for that
alternative checkout and related API transaction recording. No external
processor, order sync, new service or permissions are authorized here.

Shop Pay Wallet is a separate documented custom-checkout integration. It needs
a new Shopify store and Shopify Payments onboarding, still uses Shop Pay's
hosted popup, and leaves cart, shipping, taxes and inventory responsibilities to
the integrating system. It is not a drop-in option for this existing store.

Any later custom integration needs an agreed authority for prices, stock,
shipping, taxes, discounts and refunds; verified payment webhooks; duplicate-safe
order creation; and reconciliation when payment succeeds but order sync fails.
Do not mark an order paid from a browser success message alone.

### Evidence and remaining work

The endpoint uses Storefront API `2026-07` through the existing adapter and the
local gates from ADR 0004, with a second explicit study flag. Checkout URLs are
short-lived component state, absent from public cart JSON and durable storage.

Focused endpoint and mocked browser behavior tests cover the local gates,
mandatory cart review, preparation failure/expiry, popup blocking, recoverable
versus fatal SDK events, manual close and shared cart refresh. The revised
concept has no editable contact/card inputs or order-submission form; its
country/theme controls trigger no checkout requests. The disabled payment
action cannot submit an order. Browser checks pass at 1366px and 390px.

Reviewed the concept in light/dark at desktop and mobile sizes. The normal
storefront is unchanged. The draft is explicitly separated from the existing
Shopify tests and marked as an undecided, unconnected design concept.

`pnpm validate` passed: formatting, lint, TypeScript, all 130 unit tests and
production build. A production runtime smoke test returned 404 for the study
page and 503 for its API, with no checkout disclosure. Reviewed the scoped
source/diff, including independent checkout-gate and URL-lifecycle review.
No database change or Supabase validation was required. These checks do not
establish remote SDK reliability or authorize a production payment integration.

Local evidence is under `.local/checkout-study-0130/` and
`.local/checkout-0130/browser/`. Branding screenshots document the rejected
draft; they are not approved design references.

### Official references reviewed 2026-10-07

- [Standard versus Plus checkout customization](https://help.shopify.com/en/manual/checkout-settings/customize-checkout-configurations)
- [Form-control customization](https://shopify.dev/docs/apps/build/checkout/styling/customize-form-controls)
- [Typography customization](https://shopify.dev/docs/apps/build/checkout/styling/customize-typography)
- [Checkout extension constraints](https://shopify.dev/docs/api/checkout-ui-extensions/latest/web-components)
- [API Terms](https://www.shopify.com/legal/api-terms), sections 2.3.18 and 2.3.23
- [Order creation, Admin API 2026-07](https://shopify.dev/docs/api/admin-graphql/2026-07/mutations/orderCreate)
- [Shop Pay Wallet](https://shopify.dev/docs/api/commerce-components/pay)
- [Checkout Kit overview](https://shopify.dev/docs/agents/carts-and-checkout/checkout-kit)
- [Web presentation roadmap](https://github.com/Shopify/checkout-kit/discussions/137)
