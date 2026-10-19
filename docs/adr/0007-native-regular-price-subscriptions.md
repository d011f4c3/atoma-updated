# ADR 0007 — Native regular-price subscriptions

Date: 2026-10-18
Status: Accepted for local Task 0170; production activation remains separately gated

The owner approved real four-week subscriptions at regular price on the three
current 1 kg teas. Shopify's native Subscriptions app created that plan with no
discount. After the existing Headless connection gained selling-plan read scope,
bounded reads found one allocation per tea, matching four-week billing/delivery,
zero remaining balance, and empty allocation and plan price-adjustment arrays.
The reviewed adapter previously required one allocation price entry and excluded
this valid native case.

## Decision

Apply `patches/jmm-shopify-storefront-native-regular-price.patch` through pnpm's
hash-pinned `patchedDependencies` mechanism. It extends only the existing shared
internal selling-plan mapper used by both catalog and cart. The original vendor
tarballs, JMM repositories, package version and public contracts remain unchanged.
The Storefront API stays `2026-07` and its SDK remains `2.0.0`. This is a documented
compatibility exception to ADR 0003, not a second Shopify implementation.

The new branch requires both adjustment arrays to be empty, recurring deliveries,
matching recurring billing/delivery intervals and counts, and an authoritative
zero remaining balance. Its per-delivery price is Shopify's validated checkout
charge for that allocation. It does not add a price adjustment, invent a zero
percent discount, substitute the variant price, or infer an absent plan. Existing
money, currency, opaque-reference, cadence, bounded-connection and explicit-price
validation remains in place. Deferred balances, prepaid cadence, future price
phases, malformed and incomplete allocations remain rejected.

The application additionally admits only the three reviewed tea handles, an
unambiguous 1 kg variant, four-week delivery, JPY, and equality between this native
allocation price and the freshly read regular variant price. A stale recurring
key cannot resolve as a one-time purchase. Cart mapping uses the same patch and
keeps actual line costs and plan identity. Mutation replay remains prohibited.

`SHOPIFY_STOREFRONT_SELLING_PLANS_ENABLED=true` enables this capability only in
`development` or `test`. It must be enabled only after successful live allocation
validation. The existing capability-bound cart-cookie behavior remains: changing
mode invalidates incompatible guest-cart sessions. Checkout and release gates
are independent and unchanged. This task does not authorize a production release.

## Evidence and validation

The official pinned API describes allocation adjustments as a list with a maximum
of two, without a required minimum. The initial checkout charge and remaining
balance are authoritative money fields. The plan's price-adjustment list describes
changes to the variant price. The observed empty-array representation is direct
live evidence; treating a full charge as the delivery price additionally relies
on the checked matching cadence, empty future schedule and zero remaining balance.

- [SellingPlanAllocation, 2026-07](https://shopify.dev/docs/api/storefront/2026-07/objects/SellingPlanAllocation)
- [SellingPlan, 2026-07](https://shopify.dev/docs/api/storefront/2026-07/objects/SellingPlan)
- [pnpm patch](https://pnpm.io/cli/patch)

`tests/native-selling-plans.test.mjs` exercises the installed patch directly:
native price mapping, invalid money, future phases, prepaid/deferred terms,
connection bounds, unchanged explicit-adjustment guards, fresh regular-price
matching, recurring cart reads/updates and capability-off rejection. Existing
application tests verify signed purchase identity and prohibit one-time fallback.
The patch is reproducible through the committed workspace configuration and
lockfile; neither archive is edited. No credentials or vendor payloads are saved.

After applying the patch, a fresh bounded read confirmed one eligible allocation
for each of the three teas, with four-week delivery and regular-price equality.
The local capability was then enabled. The restarted development server's public
catalog returned HTTP 200 with all three opaque plan purchase keys; the Sample
Set had no selling plans. Availability still follows Shopify stock. Full
`pnpm validate` passed with 167 tests and the production build; live checkout or
payment was not performed by this verification.

## Subsequent destination support

Task 0171 extends this same reproducible patch under
[ADR 0008](0008-destination-context.md). The original JPY-only capability described
above now also admits Shopify-authoritative USD/SGD with exact minor units and
country-bound purchase keys. Native regular-price subscription restrictions and
launch gates remain intact.
