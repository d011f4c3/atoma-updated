# Task 0192 — Shopify loading feedback

## Request and scope

Reuse the existing compact loading animation while Shopify loads in the
background, so temporarily disabled purchasing controls do not feel frozen.
This is request feedback across the canonical storefront and saved studies;
it does not alter prices, availability, destination rules or Shopify contracts.

## Implementation

The hero and commerce indicator share the approved 192px ticked line and small
monospaced readout. Unknown network progress uses moving ticks without a
percentage. A single non-blocking notice covers active cart reads, destination
confirmation, catalog reads and cart mutations. During an open cart it appears
inside the drawer, outside the busy content region so its live status remains
available to assistive technology. The full-screen hero suppresses duplicate
feedback while its original asset-readiness entrance is active.

Each actual catalog request registers its own completion callback. Completion
and effect cleanup release it only once, including stale or aborted requests.
The notice stays present until the final concurrent request settles. It does
not use the persistent purchase-review lock as evidence of network activity.
Existing error and retry controls remain available after failed reads; writes
are never retried automatically. Native checkout in another window retains its
existing guidance instead of showing a perpetual loading indicator.

Reduced motion keeps the same static ticked line and status. The new indicator
appears only after hydration, so disabled JavaScript cannot leave it stuck on
screen. Existing hero percentage, readiness, timeout and no-JavaScript behavior
are preserved. Status copy includes Japanese and both Chinese translations.

## Investigation

The entrance loader previously waited for hero assets only. Cart and destination
confirmation, followed by catalog refreshes, could continue after it disappeared.
An unsuccessful initial cart read intentionally prevents publishing a confirmed
country or enabling purchase; the existing Try again action performs fresh reads.
This task makes pending work visible without bypassing that protection or
changing the request ordering, recovery policy or commerce authority.

Final review found a related recovery defect: an unsuccessful catalog read left
its confirmed revision stale, which was incorrectly treated as an active refresh.
That disabled the Sample Set's Try again action indefinitely. The selection hook
now records failed reads separately. It retains the last catalog, selected tea,
format and quantity internally while exposing an unavailable result to existing
retry views. Purchase variants stay withheld throughout a pending, failed or
stale request; a successful read supplies the fresh destination's action keys and
prices. Sample retries are enabled after failure and disabled while truly pending.
Recovery only reads the catalog and never repeats a cart or country mutation.

## Verification

Scoped TypeScript, lint and 28 localization, product-selection and sample-offer
unit checks pass. The isolated `tests/commerce-loading.mjs` recipe covers delayed
cart, destination and catalog reads; country changes; delayed adds; retained
sample quantity and destination prices; a failed initial read with read-only
recovery; failed initial catalogs and failed country refreshes with successful
read-only retries; one shared notice; reduced motion; and no invented percentage.
The mobile case uses `/samples`, respecting the owner's separate removal of
sample-study routes.
Its syntax is checked; runtime browser review and full validation remain with
the parent task. Every browser-recipe API request is intercepted, and external
traffic and unexpected writes are blocked.

## Final validation

The in-app browser confirmed the live loading status during a read-only Retry and its removal after prices/country resolved. The full repository validation passes: formatting, lint, generated route types, TypeScript, 202 unit tests and the production build. The isolated network-fixture browser recipe was syntax checked but not executed.
