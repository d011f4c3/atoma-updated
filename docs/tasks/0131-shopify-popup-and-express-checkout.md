# Task 0131 — Adopt Shopify popup checkout and inspect express payments

Date: 2026-10-08
Status: Popup implemented and verified; express activation awaits merchant onboarding
Authority: The owner selects Shopify popup checkout with express checkout
options after reviewing the custom checkout alternatives.
Related: Tasks 0127 and 0130; ADRs 0004, 0005 and 0006

## Scope

Make the existing cart's checkout open the currently configured Shopify hosted
checkout in a browser popup where supported, or a separate tab on browsers
that choose that presentation. Preserve the approved cart layout and the four
storefront languages. Continue using US/SG destinations and JPY.

Use the existing native empty form POST to `/api/checkout` and its freshly
validated server-side redirect. Open the target window synchronously on the
user gesture. If popup opening is blocked, fall back to the same-tab form
submission. Do not send a checkout URL through client JSON or add a service,
dependency or public endpoint. The alpha Checkout Kit remains study-only.

Retain cart review, mutation and runtime guards. Explain the open-window state
briefly, support returning to checkout and deliberate recovery, and reread
the authoritative cart before another attempt. Window closure/focus is not
evidence of successful payment. Do not interrupt checkout when the cart drawer
is dismissed or infer reliable closure from a cross-origin WindowProxy alone.

Inspect express payment availability in the authorized Shopify test shop.
Enable applicable already-onboarded express methods if possible without live
payments, new credentials, contractual acceptance, payment-account onboarding
or altering the tested gateway. Record exact provider setup blockers. Do not
advertise wallet logos or claim working wallets that have not been verified.
Express checkout stays inside Shopify's payment interface.

The rejected branding configuration stays unpublished. No production release,
paid plan, domain change, real charge or fulfillment is included. Existing
local-only checkout gates remain in force; production activation stays a
separate release decision.

## Validation

- Test native popup targeting, blocked-popup fallback, duplicate attempts,
  unresolved cart review/errors, drawer dismissal and safe cart recovery.
- Check desktop/mobile, keyboard behavior and all four locales.
- Keep the previous hosted fallback and checkout endpoint checks.
- Verify a real browser handoff into Shopify without submitting a new order;
  Task 0127 remains the already-completed US/SG simulated payment baseline.
- Inspect actual payment settings and distinguish visible wallet buttons from
  fully onboarded, usable payment methods.
- Run focused checks, `pnpm validate`, and review the final scoped diff.

## Outcome

### Payment-provider inspection

Read-only inspection of the authorized test shop's Payments settings on
2026-10-08 confirms the simulated test payment gateway remains active.
Shopify Payments displays a disabled `Set up` button and a notice that more
business information/default business address is required first. PayPal
Express displays `Setup incomplete` and a prompt to finish account setup.

No already-onboarded express provider was available to activate. Wallet logos
shown in Shopify Payments' promotional panel are not evidence of enabled
wallets. No payment-provider settings, accounts, credentials or test-gateway
configuration were changed. Merchant onboarding must be completed by the
account owner before live express methods can be enabled and tested. A
visible PayPal checkout button alone does not prove usable payment processing.

### Implementation and verification

The canonical cart now opens one named browser window synchronously and sends
the existing empty native checkout POST to it. The payment window's opener is
cleared before navigation. Null/throwing popup blockers retain same-tab checkout.
No CSS, storefront layout, dependency, checkout endpoint or production gate
was changed. All six new status/recovery strings are translated into Simplified
Chinese, Traditional Chinese and Japanese.

The original cart remains locked while checkout may be active. Its existing
buttons become Return to checkout and Review selection. Review requires an
explicit finished/closed confirmation and then rereads the cart; a failed read
keeps checkout disabled. Drawer dismissal, focus and a severed window reference
do not cancel payment or imply an order succeeded. A lost window reference
only changes the guidance to return through the browser's tab/window controls.

Task 0134 subsequently adds automatic authoritative cart reads while a popup
attempt is active. Empty/missing carts now clear without deliberate review;
the manual recovery path remains for canceled or unresolved checkout.

Real browser verification opened Shopify checkout from the actual cart with
one Culinary Matcha pouch at JPY 10,000. ATOMA remained in the parent window.
The child showed Shopify's Express checkout section with PayPal and the active
test payment gateway. No buyer details, payment or order were submitted. The
test child was closed, explicit review restored the cart, and the existing
selection remained available. PayPal visibility does not resolve its provider
setup blocker. No new order cleanup was needed.

`tests/checkout-popup.mjs` passes English desktop at 1366px, Simplified and
Traditional Chinese at 390px, and Japanese at 320px. It verifies the actual
native form target, exactly one child, null opener, no browser checkout URL
disclosure, keyboard opening, duplicate prevention, drawer/focus/Back safety,
failed handoff/read recovery, and explicit cart refresh. An inert second
loopback origin with COOP verifies that an apparently closed WindowProxy can
coexist with an open checkout window without releasing the cart lock.

`tests/checkout-flow.mjs` retains the previous review/gate/return checks and
passes all four locales using null/throwing blocked-popup fallbacks. These
browser suites mock commerce; they do not verify a wallet transaction.

`pnpm validate` passed formatting, ESLint, TypeScript, all 130 unit tests and
the optimized production build. Reviewed scoped source/diff and desktop/mobile
captures. No database changes required Supabase validation. Evidence lives in
`.local/checkout-0131/`, including `cart-popup-active.png`,
`shopify-express-section.png` and the four browser captures.

Remaining: account-owner payment onboarding, available wallet activation and
wallet-specific testing, approved shipping terms, and the separately authorized
production release. Shopify Payments and PayPal settings were left open for
the owner; test mode and the rejected unpublished branding draft are preserved.
