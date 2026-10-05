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

## Release record

An existing empty Vercel project named `atoma-updated` was already linked to the
requested GitHub repository and its `main` branch. Configure that project rather
than creating a duplicate. Its production and preview environments now contain
the Shopify domain, the existing private Storefront token and independently
generated cart-session secrets; secrets are marked sensitive. No credential
value was added to Git or printed. `.env.example` is a credential-free template.

While a source-only publication snapshot was being prepared, `main` received
commit `658c6d3` with the current complete working history. That commit includes
the latest hero cadence and mobile feedback. Preserve that existing publication;
append the deployment configuration as a normal fast-forward commit. The
isolated local release snapshot is not used to replace remote history.

The production site is `https://atoma-updated.vercel.app`. The initial production
deployment reached Ready; homepage, Shop, Origins, catalog and empty-cart reads
all returned HTTP 200. The catalog contains three products. Checkout remains
disabled. Repository and clean-source release validation both passed all 70
tests, formatting, lint, TypeScript and the production build.

Vercel configuration follows the official project/environment REST API and
Corepack build documentation reviewed on 2026-10-06. Node 24.x and pnpm 11.24.0
are pinned by the project, package metadata and install command.
