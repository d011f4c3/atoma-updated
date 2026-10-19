# Task 0181 — Sample Set availability

Date: 2026-10-19
Status: Saved in Shopify and verified on the storefront

The owner reports that Sample Set should be purchasable. Shopify shows the
existing product Active and its exact 3 × 20 g variant tracked at zero available
and zero on hand at Shop location, with Sell when out of stock Off.

Read-only local catalog checks resolve the correct offer and prices in both
launch countries (USD 29 / SGD 38), with availability false and valid quantity
rules. No frontend bug is indicated. The source of truth remains Shopify;
never force a buyable state in frontend code or fabricate inventory.

The owner subsequently authorizes stock of 100 and continued selling when out of
stock. Set the exact sample variant `62997353136209` to 100 on hand at Shop
location and enable Continue selling when out of stock. Saved Shopify readback
shows 100 available, 100 on hand, zero committed/unavailable and the checked
selling-policy option, with no unsaved changes. Inventory tracking remains on.

Read-only catalog verification after saving returns available true in both US
and Singapore, at the unchanged USD 29 / SGD 38, with the exact 3 × 20 g option.
Reloaded `/samples` shows an enabled Add to cart control at USD 29. Quantity rules
remain minimum 1, increment 1. No application code, cart, order, charge, shipping
rate, publication, discount or subscription changed. Shopify will continue
accepting orders even if the tracked inventory reaches zero, as requested.

Documentation formatting and whitespace checks pass. No application behavior was
changed, so existing unit tests and production build were not rerun for this
Shopify configuration update. Proof is saved under `.local/sample-stock-0181/`.
