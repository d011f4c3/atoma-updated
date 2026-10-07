# Task 0107 — Separate UJI designation from Wazuka growing origin

Date: 2026-10-06
Status: Complete; corrected presentation verified locally
Authority: Owner's small-corrections request;
[feedback §5](../briefs/2026-10-06-client-feedback.md).

Follow-up: [Task 0115](0115-kyoto-origins-product-aggregation.md) corrects the
parent directory's product aggregation. Kyoto browsing includes all three
products while strict growing-provenance queries remain separate.

## Outcome

Associate Barista `UJI-00` and Culinary `UJI-01` with UJI as a tea designation.
Retain Wazuka, Kyoto, Japan as the growing origin for Ceremonial `WZKA-00`.
Remove the superseded October 1 all-three-materials Wazuka attribution.

The owner's follow-up explicitly requires Uji City and Wazuka Town as separate
location entries in Origins, both within Kyoto Prefecture. Provide reachable
directory/detail entries for each, using sibling municipality records beneath
Kyoto. The client's quoted arrows are not authority to nest Wazuka inside Uji
City. The city entry can explain the distinction without claiming a supplied
product was grown there.

The feedback does not establish the exact growing or processing locations for
the two UJI products. Do not represent the designation as a municipality,
invent Uji City growing provenance, or place Wazuka inside Uji City. Explain
that Kyoto Prefecture contains the separate municipalities Uji City and Wazuka
Town. Verify any additional geographic/designation explanation using a primary
source before adding it.

## Presentation constraint

The owner explicitly requires the UJI Origins tab to use the same photographic
layout, sizing and controls as Ceremonial's Wazuka Panorama. Keep the original
Origins directory/location presentation, section order and theme data hooks.
Only content, factual labels and destinations may change. A separate designation
screen and added directory section were rejected and removed; they are not the
accepted implementation.

## Authorized changes

Update the existing local origin records, summaries, related-product queries and
necessary rendering/copy. Keep designation associations distinct from geographic
grown/processed links. Use the present Origins directory/reader and homepage
Panorama; allow concise UJI content and suitable labels within those layouts.
Preserve existing photographs and their Kyoto-level captions; photography cannot
prove the UJI products were grown in a pictured field. Keep private growers
private, missing facts explicit, exact-handle matching and publication/evidence
guards. Shared records should also serve dedicated product information.

No new management service, database, CMS, dependency or production permission.
No general redesign, replacement media, invented community activity or changes
to prices, stock, commerce identity or purchasing. The current user authority
supersedes the older origin-copy evidence only for the named products.

## Acceptance and validation

- [x] Wazuka product relationships include Ceremonial only.
- [x] Both UJI products have a useful designation explanation and reachable
      Origins content without a false grown/processed location.
- [x] Home, Origins, Shop/product information and related-product lists agree.
- [x] Uji City and Wazuka Town are never a parent/child municipality relationship.
- [x] Both municipalities have reachable Origins entries beneath Kyoto Prefecture.
- [x] Unknown products acquire no inferred provenance or designation.
- [x] Theme, focus, popup dismissal, selection, quantity and reader return persist.

Run origin-model, preview, related-products, privacy and product-information tests;
mocked browser checks across both themes at desktop/mobile; `pnpm validate`;
scoped diff review. No database changes, Shopify writes or deployment.

## Evidence

Independent sourced designation definitions/material links remain separate from
geographic growing relationships. Uji City and Wazuka have sibling location
records beneath Kyoto. The original Uji City location layout presents the two
associated products under **UJI series**; geographic queries still return no
city-grown products. Only Ceremonial retains the Wazuka growing relationship.

The homepage reuses the exact existing Panorama article, photograph, heading,
fact-row and action markup/classes for both kinds of record. UJI's existing
three fact rows state the designation and unpublished growing/processing
locations. Its Kyoto photograph/caption is regional editorial context, not
product provenance. Retail and the saved current layout retain their existing
compositions. The original modal provider, reader, directory heading/section
order and `data-origins-directory` theme hooks are retained. No new screen,
CSS, routes, photographs or theme system are introduced.

Verified contextual explanations against [MAFF](https://www.maff.go.jp/e/policies/market/dento_syoku/menu/uzi_tea.html)
and the municipality distinction against [Kyoto Prefecture](https://www.pref.kyoto.jp/link.html)
on 2026-10-06. These sources do not assign a field or processing location to
either UJI product.

- Corrected source passes strict TypeScript and scoped ESLint/formatting.
- 32 focused geographic, designation, preview, related-product and privacy
  tests cover exact handles, publication/evidence guards, malformed and
  ambiguous links, lot/material scope, type filtering on the associated material,
  unknown facts, contextual photography and unchanged live availability.
- Corrected mocked browser coverage passes: four designation/layout cases
  (1366px and 320px, both themes), two canonical Origins cases and six popup
  cases. These compare the existing Panorama DOM/class sequence, theme colors,
  heading typography, photograph dimensions/source and unchanged Kyoto caption;
  location readers retain the original composition and theme hooks. Related
  products, sibling breadcrumbs, format, quantity, focus and dismissal pass.
- Corrected screenshots were visually reviewed at
  `/tmp/atoma-task0107-corrected/`. This evidence supersedes the earlier checks
  of the rejected standalone designation presentation.
- Final `pnpm validate` passes formatting, lint, strict TypeScript, all 80 unit
  tests and the production build. Root verification log:
  `.local/feedback-20261006/final-validation.log`. The final scoped diff was
  reviewed; no stylesheet, modal-provider or reader-layout changes remain.
- Historical saved-study routes (`/origins-study`, `/selector-study`,
  `/shop-study`, `/color-study`) are absent from the current checkout and return 404. Their assertions are updated, but those saved-route browser cases cannot
  be verified; canonical production flows passed the browser checks above.
- No database changes, Shopify writes or deployment.
