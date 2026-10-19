# ADR 0008 — Destination context for the storefront

Date: 2026-10-18
Status: Accepted for Task 0171; live payment and publication remain separately gated

The owner requests a working country switch for the US and Singapore and
approves USD and SGD where Shopify supports them. The latest clarification
defers shipping configuration and delivery estimates. This decision extends
ADR 0003's default-JPY integration while retaining one Shopify commercial
authority and ADR 0004's existing checkout/release boundary.

## Decision

Extend the existing hash-pinned pnpm adapter patch with bounded localization
reads, country-contextual catalog/product queries and cart buyer-country
creation/update. Keep the original vendor archives, JMM workspaces, package
version, Shopify API `2026-07` and SDK version unchanged. The installed adapter
declarations and transport mapping change together; no parallel Shopify client
or browser FX calculator is introduced.

Read the actual currency from Shopify's contextual localization and admit only
JPY (zero fraction digits), USD and SGD (two). Prices remain safe integer minor
units, including exact formatting of supported large amounts. The preference
stores a country, never a price or exchange rate. Shopify manages conversion
and rounding. Its available market is necessary for display but does not prove
shipping coverage or local-currency payment-provider readiness.

Manual US/SG selection persists in an HttpOnly SameSite cookie. It takes
precedence over a Vercel country hint. Hints are read only when `VERCEL=1`,
are advisory, and never expand the approved country list; unsupported/missing
hints default to US. Language and theme remain independent. No external
geolocation service, address storage or new personal-data collection is added.

Partition catalog results and in-flight work by country, actual currency and
selling-plan capability for the pinned single shop/API. Contextual purchase
keys bind country and currency; separate opaque stable selection keys let
the interface retain the same variant and recurring plan across repricing.
The cart session itself must not bind country: that would discard the cart.

Use the existing same-origin cart command pipeline to change destination.
Preflight the current cart, update buyer identity once, then verify its actual
country/currency and unchanged aggregate variant/plan quantities. Do not
silently replace unavailable products, plans or quantities. After an uncertain
write, block further purchasing and reread; never automatically replay it.
An authoritative cart read can reconcile a stale preference cookie. GET may
update only that preference, never mutate Shopify. Legacy JP/unknown cart
destinations require explicit country confirmation rather than a cleared cart.

The shared cart lock covers destination changes and other writes. Purchase
controls remain unavailable while pricing context is unresolved or refreshed.
Country changes update mounted views in place. Unavailable or stale variants
and subscriptions remain visible for review, with no fallback purchase.

## Final delivery and payment

Shopify-hosted checkout collects the actual delivery address, resolves shipping
and presents the payable total before payment. Cart merchandise totals are
not relabelled delivered totals. The existing test rates, packaging data and
dispatch/transit settings are unchanged by this bounded switch task.

Shopify documents that local-currency payment requires a supported primary
payment provider. Configuring market currency and seeing that currency in
catalog/cart are not evidence of a completed local-currency charge. Verify
payment-provider capability and address-driven final checkout currency before
launch. No payment onboarding, order, charge or deployment is performed here.

## Sources and verification

- [International pricing](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/markets/international-pricing)
- [Localization, 2026-07](https://shopify.dev/docs/api/storefront/2026-07/objects/Localization)
- [Buyer identity, 2026-07](https://shopify.dev/docs/api/storefront/2026-07/input-objects/CartBuyerIdentityInput)
- [Local currencies](https://help.shopify.com/en/manual/markets/customizations/local-currencies)
- [Checkout restrictions](https://help.shopify.com/en/manual/international/pricing/checkout-restrictions)
- [Vercel geolocation](https://vercel.com/kb/guide/geo-ip-headers-geolocation-vercel-functions)
- [Vercel request headers](https://vercel.com/docs/headers/request-headers)

Focused tests cover exact money, real adapter query variables and projections,
manual/hint precedence, contextual and concurrent cache isolation, stale keys,
mixed one-time/recurring cart preservation, rejected and interrupted updates,
reconciliation without replay and hosted-checkout context guards. Browser tests
cover desktop/mobile switching, selection continuity, shared locks, focus,
actual-currency fallback and the mounted material scene. Final outcomes and
Shopify configuration evidence are recorded in Task 0171.
