# Task 0003 — Hero typography, inspection, and product entry

Date: 2026-09-28
Status: Complete — local refinement ready for owner review

## Authorized scope

Refine the existing home hero with the owner's supplied Fraktion Sans and Mono
trial fonts, a quieter powder surface, a cleaner material view, restrained
laboratory linework, and a layout contained in one viewport. Remove the
MATCHA/MATTER word swap and the meta captions “MATCHA AS MATERIAL” and
“MATERIAL, IN FOCUS”. Keep the product legible and the experience impersonal.

Use the client's product-first hierarchy to separate the primary product entry
from optional object/material inspection. The primary Explore matcha link will
open the existing shop at https://atoma-storefront.vercel.app/shop. Its route
responded successfully during read-only inspection, but current catalog contents
and availability were not verified. Do not associate the concept vessel with a
real sellable variant.

## Boundaries

- Home hero only; no additional section, route, catalog fixture, or cart.
- No Shopify credentials, service calls, mutations, or new dependencies.
- Keep the existing catalog/variant/cart/hosted-checkout path as the commerce
  authority. A catalog-powered local selection view is a separate task.
- Client examples do not establish real names, prices, pack sizes, or claims.
- Use supplied fonts for this authorized local trial; record provenance.
- Preserve original images and save the smoother edits as new versions.
- No deployment, remote creation, or changes to sibling repositories.

## Validation

- Check source layout constraints at desktop, mobile, and short-height sizes.
- Review keyboard semantics, focus, view state, and motion preferences.
- Inspect optimized asset dimensions and HTTP responses from the local server.
- Run `pnpm validate` and review the final diff.
- Browser screenshot/interaction QA is outside this preview-only task under the
  Sites workflow unless explicitly requested.

## Result and UX rationale

Fraktion Sans Light carries a stable MATCHA heading; Fraktion Sans Bold carries
the small brand mark; Fraktion Mono carries view controls and labels. The two
requested meta captions and other explanatory slogans are removed. Object and
material views share the same title and primary product-entry link.

Optional inspection uses smoother concept imagery, a circular macro aperture,
fine guide lines, endpoints, and registration marks. The layout is a fixed
viewport grid with controls in their own rows; the image and title scale to the
remaining stage height. No other page sections were added.

The client's intrigue-first request shapes the image and motion. Their
product-before-origin hierarchy shapes the main action: Explore matcha goes
directly to the existing shop without requiring a material-view interaction.
Origin, people, and technology are not added to the entrance. The concept tin
has no invented product name, pack size, price, or add-to-cart action.

The existing repository documents the sequence shop → product handle → actual
variant/quantity → cart → Shopify-hosted checkout, behind server-only catalog
adapters. This task only supplies the external shop handoff. Its current product
contents and availability remain unverified; no Shopify API connection or
checkout test is claimed for this new frontend.

Validation completed:

- `pnpm validate` passed: formatting, zero-warning lint, strict types and route
  generation, and production build.
- Independent source review found no concrete blockers at 1440 × 900,
  390 × 844, 320 × 568, or representative short landscape sizes. Review covered
  layout geometry, view states, keyboard semantics, and reduced-motion rules.
- Local home route returned HTTP 200. Response checks confirmed the removed
  copy is absent, both new assets are referenced, both view controls are present,
  and the main link targets the existing shop.
- Both new WebPs returned HTTP 200 with `image/webp`. Both are 1536 × 1024;
  combined optimized size is 258,498 bytes. The generated edits were visually
  inspected before integration.
- Final source/documentation changes were reviewed; `git diff --check` passed.

Limits: no browser visual or interaction QA was performed. No deployment,
database changes, production mutations, new dependencies, or sibling repository
edits were part of this refinement. The owner can review the running local
preview at http://127.0.0.1:3100/.
