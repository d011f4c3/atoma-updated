# Task 0171 — Shipping-country switch

Date: 2026-10-18
Status: Implemented and verified locally; publication remains separate.

The owner requests country-based pricing and shipping, then narrows this pass
to the functionality of the switch. US and Singapore remain the initial
destinations; the owner approves USD and SGD where Shopify supports them.
Shipping arrangements are undecided. Rates, packaging bands and dispatch/transit
estimates are deferred; no carrier quote or delivery promise is invented.

Implement a compact, accessible country selector in the existing storefront.
Language, theme, selected tea/format/quantity, subscriptions and the mounted
material scene remain independent and intact. Shopify supplies contextual
currency and prices. Never convert the displayed JPY amount in the browser.
If the store still returns JPY, display that actual currency and record the
backend limitation. No payment onboarding or storefront deployment is included.

An explicit choice persists and overrides an initial trusted Vercel country
hint. Only US/SG are admitted; local development and unsupported hints default
to US. Existing supported cart context takes precedence during reconciliation.
Switching updates the existing cart's buyer country once, retains its lines and
quantities, refreshes authoritative prices and rejects stale purchase keys.
Uncertain mutations require a fresh read, never automatic replay. Keep cart
session identity across changes and partition catalog caches by market context.

Shopify-hosted checkout remains responsible for final delivery address,
shipping and payable total review before payment. Existing checkout/release
gates stay intact. This switch does not establish live local-currency settlement
or fulfillment readiness.

Read the pinned Next.js cookies/headers and route-handler guides before editing
request-time behavior. Document the reviewed adapter extension in ADR 0008;
preserve JMM, vendor archives, package/API versions and private credentials.

Verification: country precedence/allowlist, exact money, isolated caches,
stale keys/responses, cart reconciliation without replay, selection and plan
continuity, desktop/mobile keyboard access, focused tests, `pnpm validate`
and final diff review. Evidence and remaining limitations will be recorded here.

## Delivery and evidence

The compact shipping-country switch is available in the canonical header,
mobile navigation, footer and cart. US and Singapore are the two supported
choices. The switch uses actual Shopify context and prices, remembers an
explicit choice, and refreshes mounted views while retaining selected tea,
format, quantity and recurring plan. Existing cart lines and session identity
are preserved. Unknown or interrupted outcomes require read-only reconciliation
before another purchase; no write is automatically replayed.

Both existing Shopify markets were changed and saved under the owner's explicit
USD/SGD authorization. The US market uses USD; Singapore uses SGD. Shopify's
dynamic conversion and inherited rounding apply. No rate, package weight,
stock, dispatch/transit estimate or payment-provider setting was changed.

Bounded actual public `/api/destination` and `/api/catalog` reads returned
HTTP 200 for both US/USD and SG/SGD, with four published products and three
recurring allocations in each context. A browser switch on the Culinary 1 kg
page changed USD 65.00 to SGD 83.00 and retained the format. These are observed
Shopify prices at verification, not fixed prices maintained by ATOMA.
No order or charge was placed. Existing-cart mutation scenarios used fixtures.

Earlier local requests encountered intermittent DNS resolution failures. After
resolution recovered, both public endpoints and the real browser switch passed
without network configuration changes. A fresh process initially reused a stale
webpack adapter cache; rebuilding the generated development cache resolved it.
Temporary diagnostics were removed and no secrets or full payloads were logged.

Verification completed:

- `pnpm validate`: formatting, lint, types, 189 unit tests and production build.
- Mocked browser switch at 1440 px light and 320 px dark: confirmed/rejected/
  interrupted changes, focus, shared locks, selection and subscription continuity,
  retained material scene, exact JPY fallback and no horizontal overflow.
- Existing subscription browser flow at 1440 px light and 390 px dark; saved
  next-order flow at 1440 px light, 390 px dark and 320 px Japanese.
- Final retail transition check: neutral localized “Updating prices…” copy;
  initial failure exposes “Try again”, retries by GET only and restores focus.
- Final diff review and `git diff --check`.

Ignored local evidence: `.local/destination-switch-0171/` contains market-save
screenshots, browser regression captures and `storefront-singapore.png`;
`.local/task0171/public-destination-verification.json` contains bounded aggregate
endpoint results with no cart locators or private payloads.

Live settlement in the selected currency still requires the launch payment
review documented in ADR 0008. Final address, shipping and payable total stay
in Shopify checkout. Shipping estimates and fulfillment configuration remain
deferred following the owner's latest scope clarification. No deployment.
