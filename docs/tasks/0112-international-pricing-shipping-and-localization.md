# Task 0112 — International pricing, shipping and localization

Date: 2026-10-06
Status: In progress; four-language storefront verified locally 2026-10-07
Authority: Owner request and [October 6 client feedback](../briefs/2026-10-06-client-feedback.md)
Depends on: [Task 0114 — Storefront launch boundary](0114-storefront-launch-boundary.md) for checkout activation
Activation scope: Bounded implementation slices; no Shopify configuration or release changes

## Current delivery

The owner requested implementation on 2026-10-07. Start with
[Task 0116 — Stable product identity](0116-localization-product-identity.md),
which preserves the English UI while removing title-language dependence from
known product presentation. The owner then approved English, Simplified Chinese,
Traditional Chinese and Japanese; US and Singapore are the initial destinations.
[Task 0117](0117-four-language-storefront.md) implements the four-language
storefront with the requested language selector beside the theme toggle.
Language and country/pricing preferences are independent.

Task 0117 is locally complete: all four language dictionaries, switcher beside
existing theme toggles, cookie/server language, translated metadata and the
requested Chinese/Japanese +1px text treatment are verified. English sizing and
source copy remain unchanged. All 102 unit tests and the production build pass;
four full language browser profiles and six retail regressions pass. Translation
phrasing was reviewed for naturalness and script consistency; independent native
or client terminology sign-off remains available before release.

| Launch decision                                              | Status                                                           |
| ------------------------------------------------------------ | ---------------------------------------------------------------- |
| Storefront languages                                         | English, Simplified Chinese, Traditional Chinese, Japanese       |
| Shipping scope                                               | US and Singapore initially; further destinations later           |
| Interim currency                                             | JPY for both destinations, confirmed by owner                    |
| Future currency changes                                      | **Pending client decision**; do not enable USD/SGD automatically |
| Shipping services/rates, packing bands, dispatch/transit     | Pending confirmed commercial inputs                              |
| Actual market/shipping configuration and checkout activation | Pending separate implementation and approved release             |

Task 0116 is now locally verified: known product names, content and imagery
retain the approved English presentation across translated upstream titles.
All 90 unit tests, the production build and four desktop/mobile browser cases
passed. Translations proceed under Task 0117. Destination selling still needs
confirmed shipping inputs and shop configuration; this parent task remains open.

The reviewed adapter currently supports only JPY and buyer-IP context. It does
not yet expose country/language-contextual catalog queries, localization options,
cart buyer-country changes or delivery operations. Those require a reviewed
source change and rebuilt snapshot with updated provenance under ADR 0003;
changing a frontend selector or formatter alone would not implement them.

### Verified shop configuration, 2026-10-07

A single bounded read-only Storefront localization query requested and confirmed
API version `2026-07`. Sanitized configuration results:

| Setting                    | Exposed configuration |
| -------------------------- | --------------------- |
| Available country          | Japan (`JP`) only     |
| Currency                   | `JPY`                 |
| Available/default language | English (`EN`) only   |

The [localization query](https://shopify.dev/docs/api/storefront/2026-07/queries/localization)
and [Country object](https://shopify.dev/docs/api/storefront/2026-07/objects/Country)
were checked against official documentation. These are enabled localized
experiences, not proof of shipping coverage or approved launch markets. No
credentials, full vendor payloads or buyer data were recorded; no shop settings
were changed. US and Singapore are approved scope; activating them still needs
actual shipping inputs and the applicable configuration work.

## Goal

Let buyers understand the price and delivery conditions for their actual
shipping destination, change that destination themselves, and review the full
payable total before payment. Preserve the approved storefront composition,
product selection, material animation, two themes and mobile popup behavior.

Use an IP-derived country only as an initial suggestion when no destination
has been chosen. An explicit shipping-country choice takes precedence; the
final shipping address governs the applicable commercial conditions. Keep
language preference independent from shipping country and currency. The owner
has approved four storefront languages and interim JPY pricing as recorded above.

This task sequences the larger feature into bounded delivery slices. Each slice
needs its own implementation brief and validation before the next begins.
The owner's storefront-first priority is recorded in Task 0114; this plan does
not silently remove ADR 0003's existing Core reconciliation checkout gate.

## Current implementation

- Next.js is pinned to `16.3.6`. Canonical routes are `/`, `/shop`,
  `/shop/[handle]` and `/origins`; Task 0117 adds local four-language copy.
  Current metadata has the review site's origin and disables indexing.
- `src/lib/catalog-server.ts` reads the default JPY catalog through the reviewed
  adapter. Its single 30-second cache and in-flight promise have no country or
  language key. The browser fetches the display projection from `/api/catalog`.
- Catalog and cart validate JPY money. Formatting uses fixed English locales.
  Language formatting alone cannot activate a different selling currency.
- Task 0116 maps known product presentation by stable handle; codes and origin
  relationships also use stable handles/IDs. Unknown catalog titles retain a
  source-text fallback. Translations do not change these relationships.
- Cart and Origins are provider-managed dialogs. Origins also recognizes exact
  canonical paths and uses browser history; localized routing must retain
  selection, dialog return, focus, scroll and theme continuity.
- [ADR 0003](../adr/0003-reviewed-headless-catalog-and-cart.md) imports exact
  local `@jmm` tarballs, pins Shopify Storefront API `2026-07` and its client
  `2.0.0`, and keeps hosted checkout gated. Adapter changes require a reviewed
  source change, rebuild, provenance and checksums, never archive editing.

## Phased delivery

### 1. Confirm markets, language scope and commercial terms

Produce an approved launch matrix before adding selectors or prices. Record
supported and unsupported shipping countries, selling currencies and exact
minor-unit policies, country-specific price ownership, price inclusions,
tax/duty responsibility, shipping services, fulfillment origin, packages,
quantity/weight bands, cutoffs, working days and dispatch/transit evidence.
Decide whether country prices are maintained amounts or controlled conversions,
including rounding, FX responsibility and change handling. Do not create prices
by converting a browser-displayed JPY amount.

Confirm the default country when no reliable hint exists, how an explicit
choice persists, and the treatment of an unsupported country. Decide whether
any languages beyond English are required for launch, who supplies and reviews
translations, fallback rules, and whether URL prefixes are appropriate. A
shipping-country selector must remain usable without translation rollout.

Record shipping inputs for the requested sample set of Ceremonial, Barista and
Culinary, each 30 g, plus approved other formats and mixed orders. The set's
90 g of tea is not its packed shipping weight: obtain packaging weight and
dimensions where the rate method needs them. JPY 4,800 and JPY 1,000 sample
credit are illustrative values, not approved prices or incentives. Sample
publication, discounts, reorder offers and subscriptions need separate product
and cost decisions; none is enabled here.

Exit: the matrix identifies an owner for every unresolved input, and Task 0114
records the applicable checkout authority before checkout activation work.

### 2. Review architecture against pinned vendor behavior

Define the owned country/language context, catalog projection, cart commands,
delivery and total states, and trust boundaries. Verify the actual shop's
configured capabilities separately from what the API schema supports. Retain
the current API pin unless an explicit version-change brief is accepted.

Use the following official references, checked on 2026-10-06, as the starting
point for the implementation review:

- Shopify's [`localization` query](https://shopify.dev/docs/api/storefront/2026-07/queries/localization)
  exposes configured countries and languages. Intersect these with the approved
  launch matrix; configuration alone does not approve shipping commitments.
- The [`2026-07` directive reference](https://shopify.dev/docs/api/storefront/2026-07#directives)
  documents country and language context for product queries. Use contextual
  published amounts and content through bounded adapter operations.
- [`cartBuyerIdentityUpdate`](https://shopify.dev/docs/api/storefront/2026-07/mutations/cartBuyerIdentityUpdate)
  supports the buyer country used for international cart pricing, which should
  agree with the shipping address. Verify the complete create/update/read flow;
  a contextual product read alone does not prove cart price consistency.
- [`cartDeliveryAddressesAdd`](https://shopify.dev/docs/api/storefront/2026-07/mutations/cartDeliveryAddressesAdd),
  [`CartDeliveryGroup`](https://shopify.dev/docs/api/storefront/2026-07/objects/CartDeliveryGroup),
  [`CartDeliveryOption`](https://shopify.dev/docs/api/storefront/2026-07/objects/CartDeliveryOption)
  and [`cartSelectedDeliveryOptionsUpdate`](https://shopify.dev/docs/api/storefront/2026-07/mutations/cartSelectedDeliveryOptionsUpdate)
  provide the address/group/option capabilities to evaluate. Confirm required
  address fields, group completeness and configured rate behavior in the shop.
- [`CartCost`](https://shopify.dev/docs/api/storefront/2026-07/objects/CartCost)
  describes costs that may change at checkout and exposes estimate flags.
  Document which amounts are estimates and where the final payment total is
  established; do not relabel an estimated total as final.
- The [private-token request requirements](https://shopify.dev/docs/api/storefront/2026-07#make-server-side-requests-with-a-private-access-token)
  require the buyer-IP header for buyer-originated traffic. Review the actual
  hosting proxy's trusted IP/country metadata separately; country suggestion
  and trusted buyer-IP forwarding are different responsibilities.

Prefer the existing hosting country signal if its behavior is verified and
adequate. Document any new service, dependency, permission or public API and
its consequences before implementation. Do not log addresses, IP addresses,
cart credentials or full Shopify payloads. Cart/address information must not
enter a shared catalog cache. Read the installed Next.js `16.3.6` guides before
implementing routing, request headers, cookies or rendering changes.

Exit: a reviewed design identifies named adapter operations, projection changes,
failure behavior, cache keys, privacy handling and required shop configuration.

### 3. Add destination-aware pricing, projection, caching and cart behavior

Add a compact, accessible shipping-country control in an approved existing
surface. Its initial suggestion may use the verified IP signal, but must never
replace a saved explicit choice or the final shipping destination. Unsupported
or unavailable cases need a clear recovery path without a fabricated rate.

Thread validated country and, where enabled, language through catalog reads.
Partition both cached results and in-flight requests by every pricing/content
context that affects the result, including shop and API identity. Admit only
reviewed currency/exponent pairs and maintain integer minor-unit values.

Changing the destination must synchronize cart buyer context and refresh
authoritative prices, availability and quantities before continuing. Present
material changes for review, preserve valid selections, and explain any item
that becomes unavailable. Prevent stale asynchronous country responses from
restoring old prices. Do not automatically replay cart mutations with uncertain
outcomes or accept browser prices as authority. Refresh the cart after failed
or interrupted context changes rather than reporting success prematurely.

Exit: product, selected format and cart show consistent supported-country
conditions, and rapid switching or concurrent buyers cannot mix contexts.

### 4. Resolve shipping, totals and delivery expectations

Calculate or obtain shipping using the confirmed destination details, selected
quantities and actual package rules. A country hint may be insufficient for a
rate; collect additional address information only when required. Re-evaluate
rates when destination, lines, quantity, packaging or delivery choice changes.
Handle mixed formats, sample sets, multiple delivery groups, missing rates,
unsupported destinations and failed estimates explicitly.

Show merchandise, applicable discounts, selected shipping, applicable tax/duty
treatment and the full payable total before payment. Distinguish unavailable
amounts from zero and estimates from final amounts. Define whether the final
review occurs in ATOMA or Shopify-hosted checkout; verify the buyer can see and
review the final destination-dependent total before committing payment. Any
charges payable outside checkout must be resolved against the client's full
total requirement and approved terms before claiming that requirement is met.
Recheck the final address and totals rather than trusting the initial country.

Show dispatch/processing time separately from carrier transit time, including
working-day and cutoff assumptions where applicable. Use approved fulfillment
and service evidence; do not infer a delivery guarantee from a product grade,
generic country label or a shipping option's title.

Exit: the configured checkout path passes the destination/rate/total scenarios
under Task 0114's accepted boundary, without adding payment handling to ATOMA.

### 5. Add translations and localized routes only for approved languages

Start with typed extraction of existing English UI, editorial, accessibility,
error and metadata text without changing presentation. Keep product handles,
display codes, material/place IDs and evidence relationships stable. Replace
English-title parsing as the selector of localized product content with an
explicit stable mapping that preserves the existing factual boundaries.

Introduce reviewed translations one approved language at a time. Separate
repository copy from translated Shopify fields and apply the approved fallback
policy consistently. Language changes must not silently change destination or
currency. If localized routes are approved, make navigation, product deep links,
Origins path detection/history and metadata locale-aware without resetting cart,
selection, user-entered references or theme. Keep private grower information
private in every language. Verify font coverage and text expansion in the
existing design. Preserve preview noindex; public canonical/hreflang/sitemap
work belongs to the approved indexing/release slice.

Exit: only complete reviewed languages are selectable, and switching preserves
the current product and applicable buying conditions.

### 6. Validate and prepare release evidence

For each implementation slice, run focused behavior tests, then `pnpm validate`,
and review the final diff. Cover hint/manual/final-address precedence; missing
or unsupported hints; exact money for admitted exponents; stale responses and
cache isolation; country changes with existing cart lines; unavailable rates;
quantity/package boundaries; sample and mixed baskets; delivery-group changes;
estimate flags; total changes; and dispatch versus transit labels.

Check desktop and narrow mobile layouts in both themes, keyboard and screen
reader labels, dialog dismissal/focus/history, reduced motion, long translated
text, deep links and retained selection. Use marked test data and a separately
authorized test-checkout workflow; ordinary validation must not place orders or
mutate production configuration. Record limitations where actual carrier,
tax/duty or payment configuration cannot be exercised. Release remains a
separate human-approved step after the accepted launch boundary is satisfied.

## Acceptance and scope limits

- [ ] Launch matrix and outstanding commercial/language decisions are recorded.
- [ ] The pinned API and actual shop capabilities support the reviewed design.
- [ ] Explicit destination choice overrides hints; final address governs pricing
      and delivery conditions, with fresh consistent cart results.
- [ ] Buyers review the full payable total before payment; incomplete estimates
      never masquerade as a final quote.
- [ ] Dispatch and transit expectations remain separately understandable.
- [x] Approved language support preserves identities, facts and interaction state
      (Task 0117; local editorial review, client terminology approval still available).
- [ ] Focused checks, `pnpm validate`, browser review and final diff review pass.
- [ ] Task 0114's checkout boundary and the separate release step are satisfied.

The original plan adds no code, dependency, geolocation service, database
concept, permission, market, currency, translation, shipping promise, discount,
subscription, checkout activation or deployment. Implementation is now tracked
in the bounded tasks linked above. The implementation slices must
preserve the approved UI except for the minimal controls and disclosures needed
to make these buying choices clear.
