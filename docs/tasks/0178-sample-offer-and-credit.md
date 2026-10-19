# Task 0178 — Sample offer and first wholesale credit

Date: 2026-10-19

Status: Implemented and locally verified; publication lifecycle checks remain

## Authority and scope

The owner relayed and adopted a new sample offer: USD 29 excluding shipping,
three varieties at 20 g each (60 g total), with a USD 29 credit toward the first
wholesale order of 1 kg or more. The owner subsequently approved a JPY equivalent
for the credit because Shopify's native fixed discount uses the store currency.
They also requested an explanation of the existing credit and implementation of
a better customer experience. Earlier permission covers editable, real Shopify
configuration before website publication. This is not a deployment or an order.

## Implementation

- Preserve the photographic foil trio, interactive label reader, page layouts,
  themes, studies, navigation and cart behavior. Update all sample quantities to
  3 × 20 g and the exact existing Shopify offer mapping.
- Set the Sample Set to USD 29 through a USD catalog assigned to the US and
  Singapore markets. Shopify converts to SGD for Singapore. Other products keep
  inherited pricing; do not make price overrides for them.
- Update the existing native `CONFIGURED-SAMPLE-CREDIT-CODE` discount to JPY 4,500. At the
  Shopify US market rate observed during setup (0.0064556922 USD per JPY), this
  is USD 29.0506149. The owner explicitly requested the rounded JPY 4,500 amount.
  Describe it as approximately US$29, not a permanent exact
  dollar value. Preserve first-order history, once-per-customer, once-per-order,
  one-time-purchase and non-combination restrictions.
- Add an explicit **Use sample credit** cart action for a reviewed one-time
  1 kg tea. The server supplies the fixed code and preserves existing codes.
  Shopify retains authority over customer eligibility and discount allocations.
  A stored code is pending until Shopify confirms applicability and a positive
  matching allocation; never subtract a predicted discount in the browser.
- Keep same-email guidance and manual code fallback in optional details.
  Preserve existing mutation, reconciliation, destination and checkout gates.

## Boundaries and verification

No inventory increase, overselling, shipping-rate invention, new permissions,
test customer, order, charge or subscription contract. Net tea weight is not
packed shipping weight. Preserve all unrelated local work and earlier tasks.

Run focused behavior tests, desktop/mobile review, `pnpm validate`, and scoped
diff review. Record saved Shopify values and unresolved launch checks in
[the operations record](../operations/sample-offer-0178.md). Paid/refunded order
eligibility and actual redemption require a separately authorized lifecycle
test; saved configuration and anonymous cart requests do not prove these cases.

## Result

The existing sample variant, USD market catalog and native discount were saved
and read back in Shopify. The website shows USD 29.00 for the US and SGD 38.00
for Singapore, with 3 × 20 g / 60 g and additional shipping clearly stated.
Current sample stock remains zero and the unavailable action is preserved.

The real Shopify cart accepted the one-click credit and returned a positive
allocation: Culinary 1 kg USD 65.00 became USD 35.95 before shipping. Switching
the same cart to Singapore preserved the item and credit, showing SGD 45.83
from SGD 83.00. These are observed prices, not fixed exchange-rate guarantees.
The applied-state message explicitly defers customer eligibility and final
total to checkout, because Shopify returned an allocation before customer
identification. No checkout, order or payment was submitted; the added test
cart item was removed afterward.

Mobile review at 390 × 844 found no horizontal overflow in the dialog or credit
panel; the credit content scrolls while checkout remains accessible. The
existing photographic packaging and click-to-inspect interaction are retained.
`pnpm validate` passes formatting, lint, strict types, all 208 tests and the
production build. Independent credit-backend review and scoped whitespace
review found no actionable issue. Evidence: `.local/sample-offer-0178/`.
