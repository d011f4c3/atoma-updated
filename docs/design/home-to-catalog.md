# From the hero to product selection

**Superseded navigation proposal:** Task 0019 keeps selection on the homepage
and adds `/concept-02`, as explicitly requested by the owner. Explore matcha
moves the tray left and reveals selection on the right. Catalog choices, format,
quantity and cart remain in the headless frontend. The owner confirms the existing
test products are deliberate fixtures for this experience, not a reason to block
cart actions. The older route/handoff proposal below records historical planning;
it does not describe the current implementation. See Task 0019 and ADR 0003.

Future UX plan for [Task 0018](../tasks/0018-final-home-hero.md).
Catalog implementation and integration remain separate work.

## The decision

Make the entrance intriguing and selection straightforward. Modern laboratory
character comes from product framing, measured spacing, precise labels, and
controlled movement. Controls help visitors choose actual products.

Use one primary action: **Explore matcha**, leading to the real catalog. The
tray remains an illustration; selection belongs to actual products with their
own images and verified information.

Implemented scope remains the hero, appearance choice, and About dialog.
Explore matcha stays unlinked until the catalog works. The following journey
and route names are proposed; integration discovery is read-only.

## A concrete journey

| Step               | What the visitor encounters                                                                              | Next action                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Home               | One viewport of product imagery, concise positioning, and a clear entrance.                              | **Explore matcha** → `/matcha`.                                                                     |
| Matcha listing     | A coherent family of published products with useful differences visible together.                        | Open a product at `/products/[handle]`.                                                             |
| Product            | Actual product imagery; verified use and specification; format, price, availability, and quantity.       | Choose the valid offer, then **Add to cart** once commerce is implemented; continue reading freely. |
| Origin             | Product-linked provenance becomes more specific only as the evidence permits.                            | Open the relevant origin chapter or continue to documented people and methods.                      |
| People and process | Consented producer/partner material, observed work, and supported processing or technology explanations. | Return to the same product and preserved selection, or explore another documented chapter.          |

Buying controls remain available before editorial reading. Provenance depth
depends on each product's evidence. Wazuka can lead the editorial archive without
being assigned as every product's origin.

## Navigation and continuity

- Keep **ATOMA** as home, **Matcha** as the catalog link, and **About** as the brand
  explanation. Matcha and Explore matcha share a destination. Add **Cart** with a
  working cart and an **Origin** archive when approved content exists.
- Product pages retain **Back to matcha** and local anchors: **Specifications**,
  **Origin**, and **People & process**, where content exists. Use native links
  and keep essential details visible.
- Keep the header compact and appearance choice quiet. Preserve the theme,
  product, selected format, quantity, filters, and reading position across navigation.
- On mobile, a compact product summary can return to the purchasing area while
  reading, showing the selected format and price while leaving content unobstructed.

On catalog entry, retain the wordmark and one alignment rail while the hero image
withdraws and the first products appear. A proposed 200–350 ms transition gives
continuity without delaying navigation. Carry real product image framing from
card to detail; keep illustrative imagery distinct from product identity.

Preserve ordinary scrolling, browser history, deep links, and return positions.
Focus the destination heading appropriately. Avoid scroll capture and mandatory
animation sequences. Reduced motion presents content directly. Ambient motion
pauses offscreen or in hidden tabs; purchase information remains stable.

## The listing and product opening

Use two columns on wide screens and one on phones, consistent image scale, and
aligned specification rows. One card represents one published product; format
variants belong on the detail page. Use a compact catalog heading.

Each card shows the approved name, image, short description or verified intended
use, price with currency when available, and truthful purchase availability.
Its action is **View product**. Show confirmed public product codes alongside a
readable name; concept view numbers are not product codes.

Start with a reviewed product order. Add filters only when verified classifications
support meaningful choices; preserve selections on return.

The product opening adds verified format options, quantity constraints, and the
chosen offer's price. Place specifications beside the image and purchasing area,
then origin and editorial depth in normal document flow. State decision-relevant
unknowns; omit absent optional fields. Missing mandatory facts prevent purchase.

## Data and wholesale boundaries

The reviewed catalog view models provide title, description, image, price label,
and purchase state; detail adds variants, options, and quantity rules. Actual
records still need publication review; unconfirmed claims cannot become launch content.

Origin, cultivar, lot, sensory profile, certifications, preparation, and care
need verified, publication-approved sources and explicit product relationships.
Never infer them from titles, photographs, or stories. Use approved availability
states. Price per kilogram requires verified price and package mass. Missing
images get a neutral placeholder, not the illustrative hero tray.

Preserve the accepted wholesale model: a sample set comprising three distinct
30 g components, the 1 kg standard pouch, and bundles of five or ten 1 kg pouches;
the large-volume enterprise path is assisted. These are commercial constraints,
not evidence that any particular offer is currently published or available.
Backorders remain disabled by default. Format and quantity controls must respect
both approved package rules and the selected channel variant's constraints.

Core remains the authority for approved offers/prices and ledger-backed
availability; Shopify executes reconciled channel offers, cart, and hosted
checkout. Preserve fresh purchase validation. Only reviewed public projections
reach the browser. No new service or competing authority is proposed.

## Existing catalog path: read-only discovery

Both sibling applications use the private workspace package
`@jmm/shopify-storefront`. Its public server export provides
`readPublishedCatalog()` and `readPublishedProductByHandle(handle)`. Application
mapping produces a safe catalog/detail view model. The old `/shop` page renders
this on the server; no public catalog API route was found. Reuse the reviewed
adapter and projection contract inside this storefront, not an older-site link.

Configuration names are `SHOPIFY_STORE_DOMAIN` and
`SHOPIFY_STOREFRONT_PRIVATE_TOKEN`; credentials stay server-side. The observed
public store domain is `h0cuaw-f7.myshopify.com`. The repository pins Storefront
API version `2026-07`. Selling-plan reads remain disabled for this slice. The
adapter depends on private `@jmm/domain-contracts`: reuse requires a packaging
decision and version boundary, not an assumed registry install or sibling import.

Read-only checks through both compiled adapters on 2026-09-29 succeeded using the
existing environment proxy: three published products, each with one variant,
an image, and a description. The channel marks one purchasable and two
not purchasable. All three have explicit test/fixture/demo naming. These are
development records, not proof of approved launch offers or imagery. No raw
records, credentials, or response bodies were logged; no writes occurred.
Channel purchase state does not replace core checkout validation.

## The next bounded slice

Implement the new local **read-only `/matcha` catalog** in a separately authorized
task. Reuse the successful read path and resolve the package boundary. Review
the actual products with the owner: current fixtures can validate local selection
states if explicitly identified, but real product publication is needed before
launch. Map reviewed records to the safe view model and document missing facts.
Build loading, empty, unavailable, error/retry, and ready states. Verify required
facts and image use.

Wire Explore matcha and Matcha when this destination works. Product links need a
real local detail destination; do not ship dead **View product** controls. Follow
with cart/checkout and verified editorial content. Preserve variant and quantity
selection. Keep storefronts separate; there is no handoff to the older site.

Verify keyboard/touch use, narrow layouts, return behavior, both themes, reduced
motion, and data states. Confirm the adapter/version contract before integration;
this plan makes no new Shopify API claims.

## Basis

Both supplied client documents were reread in full; the analysis above is
paraphrased without reproducing the private conversation. Design authority is
recorded in the [client direction synthesis](../briefs/2026-09-28-client-direction.md).
Architecture follows [local ADR 0001](../adr/0001-local-frontend-foundation.md),
JMM's [technical charter](../../../JMM/docs/TECHNICAL_CHARTER.md),
[ADR 0015](../../../JMM/docs/adr/0015-v2-client-direction-and-reconciliation-boundary.md),
[ADR 0016](../../../JMM/docs/adr/0016-single-postgres-authority-with-separated-application-boundaries.md),
and [ADR 0018](../../../JMM/docs/adr/0018-atoma-public-experience-and-storefront-reset.md).
The [catalog view model](../../../JMM/apps/storefront/src/features/catalog/view-model.ts),
[adapter contract](../../../JMM/packages/shopify-storefront/README.md), and
[product-information record](../../../JMM/docs/tasks/0188-atoma-product-information.md)
define the reviewed implementation and current evidence limits.
