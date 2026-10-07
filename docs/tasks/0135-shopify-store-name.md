# Task 0135 — Rename the Shopify store display name

Date: 2026-10-08
Status: Saved and verified in Shopify
Authority: The owner explicitly asks to rename MyStore2 to Atoma in Shopify.

## Scope

Change the store display name from My Store 2 to Atoma in the authorized
Shopify test shop's General → Store contact details settings. Preserve the
myshopify.com domain, business entity, payment accounts, active checkout
configuration and unpublished branding study.

Save the change and verify the persisted store name. Capture a focused visual
record that does not include private contact details. No source UI changes,
production deployment or payment-provider activation are included.

## Source

- [Shopify store name settings](https://help.shopify.com/en/manual/intro-to-shopify/initial-setup/setup-business-settings)

## Outcome

Saved Atoma in the Store name field. Shopify completed the save, removed the
unsaved-change controls, and updated its settings sidebar heading to Atoma.
The contact-details field also shows Atoma. Only the store display name was
edited; the domain, business entity and payment settings were untouched.

Visual evidence: `.local/checkout-0135/shopify-store-name-atoma.png`, cropped to
the store-name section to exclude private contact information.
