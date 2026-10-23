# Task 0275 — Matcha inventory availability

Date: 2026-10-23
Status: Complete

## Owner direction

Make all three matchas available in the backend with a quantity of 100 each.
This specifically authorizes the inventory update in the existing connected
Shopify shop; it does not authorize any new orders, deployment or stock-policy
changes.

## Result

Set each existing 1 kg variant to exactly 100 available units at the Shop
location through Shopify Admin. Saved inventory confirms:

| Matcha                                  | Available before | Available after | Committed | On hand after |
| --------------------------------------- | ---------------: | --------------: | --------: | ------------: |
| Ceremonial / upstream Premium · WZKA-00 |                0 |             100 |         0 |           100 |
| Barista · UJI-00                        |                0 |             100 |         0 |           100 |
| Culinary · UJI-01                       |                6 |             100 |         4 |           104 |

The four already committed Culinary units remain committed. The Sample Set
remains unchanged at 100 available. Existing publication, tracking, overselling,
prices and commerce controls are unchanged. No frontend availability override
was introduced.

## Verification

Shopify's saved inventory table confirms all three quantities. The storefront
catalog returned HTTP 200 with `available: true` for all three exact 1 kg variants.
Evidence is in `.local/inventory-0275/shopify-inventory.png` and the safe public
projection `.local/inventory-0275/catalog-availability.json`.

`pnpm validate` passed formatting, lint, types, all 256 unit tests and production
build. Documentation formatting and final diff review passed.
