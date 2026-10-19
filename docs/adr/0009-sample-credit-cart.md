# ADR 0009 — Sample credit requested from the cart

Date: 2026-10-19

Status: Public request action retired by Task 0179; adapter read capability retained

The owner asks for an easier sample-to-wholesale customer journey and approves a
JPY equivalent of the client's USD 29 first-order credit. Shopify remains the
single authority for the offer amount, eligible customers, eligible products and
once-per-customer redemption. This decision adds a request control to ATOMA's
existing cart; it does not establish a separate stored-value balance.

## Decision

The same-origin cart endpoint accepts exactly
`{"action":"apply-sample-credit"}`. The browser cannot supply a discount code,
amount, cart reference, customer identity or eligibility claim. The server uses
the existing `CONFIGURED-SAMPLE-CREDIT-CODE` Shopify offer. The authenticated cart remains an
HttpOnly encrypted session, and the existing lock, destination review and
checkout controls still apply.

Before a write, read the authoritative cart and require a purchasable one-time
1 kg variant belonging to a reviewed tea in `SAMPLE_SET_CONTENTS`. Resolve its
unique 1 kg option and exact variant reference again against the freshly
published catalog. A similarly named product, several smaller packs, an obsolete
variant, an unavailable pack or a subscription cannot authorize this command.
Customer purchase-history eligibility is deliberately not guessed from browser
storage or the cart: Shopify checks the customer used at checkout.

Extend the existing pnpm adapter patch with an explicit `discountCodesEnabled`
capability. Query the bounded list of existing discount codes and code-specific
discount allocations from the cart and its lines. Update through Shopify's
`cartDiscountCodesUpdate` using the existing single-attempt mutation transport.
Keep the vendor archives, dependency versions, API `2026-07`, SDK version, JMM
workspaces and country/currency contracts unchanged.

The Shopify mutation replaces the complete code list. Append the fixed offer to
the freshly read list without discarding any existing code. Treat codes
case-insensitively, reject malformed or oversized lists, and return the current
snapshot without writing again when the offer is already stored. An accepted
write must return every requested code, the same purchase identities and
quantities, and the expected buyer country/currency. Any unconfirmed result is
ambiguous and requires an authoritative refresh; never replay automatically.
Concurrent changes outside this storefront's cart lock cannot be made atomic by
this API, so this is a fresh-read merge rather than a claimed server transaction.

## Customer-facing truth

Only a bounded `sampleCredit` projection reaches the browser:

- `not-requested`: no matching offer code in the authoritative cart.
- `pending`: the code is stored, but no confirmed matching financial allocation
  exists. This can mean that Shopify still needs the checkout customer or that
  its eligibility conditions are not met. Do not call this credit redeemed.
- `applied`: Shopify marks the matching code applicable and returns a positive
  allocation for that exact code. Show Shopify's current total, never subtract a
  locally estimated amount.

Live verification found that Shopify can return this allocation before the
guest supplies a customer identity. Applied describes the cart calculation,
not confirmed customer eligibility or completed redemption. Even the applied
message must direct the shopper to use the sample-order email and state that
Shopify confirms eligibility and the final total at checkout.

`canApply` describes qualifying current cart lines; it is not a claim that the
customer has earned credit. It remains true after requesting so the same control
can retain keyboard focus while displaying its state. An absent capability or
incomplete discount projection does not expose an enabled control.

The pending message tells customers to use the email from their sample order at
checkout. This work collects no email or purchase history, creates no app,
webhook, customer account, messaging automation or extra permission, and does not
change the configured offer or subscription policies. Final eligibility and the
payable amount remain visible in Shopify checkout before payment.

## Sources and verification

- [Cart discount code update, Storefront 2026-07](https://shopify.dev/docs/api/storefront/2026-07/mutations/cartDiscountCodesUpdate)
- [Cart discount code applicability, Storefront 2026-07](https://shopify.dev/docs/api/storefront/2026-07/objects/CartDiscountCode)
- [Cart discount allocations, Storefront 2026-07](https://shopify.dev/docs/api/storefront/2026-07/interfaces/CartDiscountAllocation)

Focused adapter and application tests cover existing-code preservation, exact
request shape, fresh variant validation, one-time/size/provenance boundaries,
case-insensitive reconciliation, truthful pending/applied status, destination and
purchase continuity, incomplete data and single-attempt ambiguous writes. Final
integrated validation and browser results belong in Task 0178.

## Task 0179 — Email delivery replaces the public request action

The owner now explicitly requests that the reusable sample credit code be
delivered only to sample purchasers by email, rather than displayed or applied
through the public storefront. This supersedes the public command and UI
decisions above. The Shopify order-confirmation setup and its verification are
tracked in Task 0179; frontend copy is not evidence that email delivery works.

Remove the public code, copy controls and cart credit action. The exact former
`apply-sample-credit` request now fails the cart input boundary and receives a
rejected response before any Shopify operation. The server runtime and cart
application expose no sample-credit mutation, code constant or customer-credit
projection. This is an endpoint removal, not merely a hidden button.

Keep the pinned adapter and its optional discount-reading capability unchanged.
Cart reads retain Shopify's returned subtotal and total, never subtract an
estimated credit, and never alter existing discount codes. Private codes and
allocations do not appear in public cart responses. Core purchase operations,
country switching, encrypted sessions and checkout review gates remain intact.

Email delivery reduces public exposure; the code itself is not customer
authentication. Shopify's purchase-history eligibility, once-per-customer rule
and checkout identity still enforce the approved offer. Do not claim that
concealing a reusable code alone prevents unauthorized use.

Regression checks reject the retired request (including extra-field attempts),
confirm that application reads cannot apply a credit, preserve authoritative
totals and existing discounts, and exclude the code and eligibility projections
from public responses. The UI recipe also ignores legacy credit status fields.
