# Task 0103 — Publish the updated storefront

Date: 2026-10-06

## Brief

Publish the current approved storefront to the owner's repository
`d011f4c3/atoma-updated` and create a Vercel project with the server-side
Shopify configuration required by the existing catalog and cart adapter.
The owner explicitly authorizes this release and project setup.

## Scope

Preserve the current UI, product and cart behavior. Publish a reviewed source
snapshot, excluding local environment files, build outputs and credentials.
Configure the existing Shopify Storefront credential only in Vercel server
variables; create independent cart-signing secrets for the hosted environments.
Use the pinned Node 24 / pnpm 11 toolchain. Do not expand Shopify permissions,
change products/inventory, or complete a checkout.

## Verification

Run the repository gate, inspect the publication file set for secrets, verify
GitHub branch/commit, confirm Vercel deployment readiness and read-only catalog
responses, and inspect the hosted homepage. Record any blocked integration.
