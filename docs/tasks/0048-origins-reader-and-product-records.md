# Task 0048 — Origins reader and product records

Date: 2026-09-30
Status: Complete — local prototype, 2026-10-01

## Approved scope

Implement the Origins entrance and one editorial reader proposed in Task 0045,
preserving the selected matcha on return. Add Origins to the main navigation
with a field index and documented product relationships. Expand homepage
Specifications with available product information and structured evidence gaps.
Task 0047's independent visual-selector exploration remains untouched.

## Implementation contract

### Owner correction — independent growth of places and matcha types

Reread both complete RTF briefs after the owner rejected the single-entry
structure as insufficient for many matchas and producing places. Implement the
boundaries in `docs/design/origins-growth-contract.md`: type classifications,
individual commerce products, shared materials/lot scopes, hierarchical places,
documented provenance roles and editorial coverage are separate records.
The Origins entrance is a searchable place directory, then a place with its
documented matchas and multiple field entries, then the optional reader. A
photographic essay is not an origin record. Geography can grow to different
depths, and editorial sections need not follow one mandatory story format.

These are local presentation modules, not new inventory/database authorities.
The need is reuse across many products, regions and commercial formats without
duplicated stories or inferred provenance. Consequence: mappings require stable,
explicit identities and evidence; current unverified relationships stay empty.

The no-emit TypeScript configuration permits explicit `.ts` imports so the same
relationship modules run under the existing Node strip-types test runner and
Next's bundler. Strict checking and the repository gate remain unchanged.

- Keep the current product experience mounted beneath a native modal reading
  layer. Return and Escape preserve product, variant, quantity, reference,
  active view and underlying scroll. Restore keyboard focus to its entrance.
- Reuse the index and reader on direct `/origins` and `/origins/light` routes.
- Use the owner-supplied Kyoto photographs for one original observational
  editorial entry. Do not relabel them Wazuka or invent people, visits or quotes.
- Associate entries with products only through documented, exact handles.
  The October 1 clarification below supplies the three current Wazuka links.
  Editorial coverage and product-growing evidence remain separate.
- Keep the seven sensory properties as samples. Product details draw commerce
  facts from the catalog, guidance from the authorized editorial, and future
  material facts from explicit nullable records. No invented ingredient,
  cultivar, harvest, lot, storage, shelf-life or certification claims.
- No dependencies, public APIs, commerce mutations or production release.

### October 1 owner clarification — places, people and photography

The owner confirms the three current test materials are grown in **Wazuka,
Kyoto**. Publish that explicit material-to-place relationship for the three
existing handles, with Kyoto and Japan as ancestors. The confirmation replaces
the previous unknown-origin state; it does not assign a particular producer or
lot to each product.

The owner requests a clearer place-and-product experience rather than a blog.
The place page leads with a visible landscape, location, connected matchas and
real people with distinct roles. Documentary photography is a central, visible
part of the experience, not hidden in an optional disclosure. Deeper photographic
reading remains available without interrupting product selection.

Re-reading the earlier original strategy PDFs and detailed business rules found
named people that the previous evidence summary incorrectly omitted: Mr. Hayashi
is a tea farmer associated with planned Wazuka field work; Hatakeyama is a
wholesaler, supplier, processor and custodian; Kitani is an active purchasing
supplier. These identities can be represented in this owner-requested local
prototype with accurate roles, independently of growing-place and product links.
Do not invent a formal Hayashi farm name, identify the person in a photograph,
or infer a product-specific farm/processor assignment from regional context.

No operational or private supplier data is exposed. Media from the two supplied
Drive folders already exists as retained local derivatives; use factual captions
and preserve the distinction between field and preparation photography.

## Validation

Test relationship filtering and factual record boundaries, inspect desktop and
mobile in both themes, check return/keyboard/scroll continuity, direct entry,
product details and reduced motion. Run `pnpm validate` and review scoped diff.

## Media

The three files in `public/images/origins/` are unmodified local prototype
derivatives copied from JMM's owner-supplied Kyoto collection. Their provenance
is recorded in JMM `docs/context/client/2026-09-19/PROTOTYPE_MEDIA.md`.
Photography identifies the supplied Kyoto collection only; exact municipality,
depicted identities, farm/product relationships and commercial rights remain
unverified. No source originals, personal information or invented documentary
images are introduced. Public commercial deployment is outside this task.

## Delivered and verified

- Place hierarchy, exact-handle material bindings, independent type taxonomy,
  material/lot-scoped location roles and named people/context records are local
  presentation data. Three launch materials connect to Wazuka → Kyoto → Japan.
  Hayashi, Hatakeyama and Kitani have separate, sourced roles. Producer-to-product
  assignments and operational lot allocation are not inferred.
- Origins is a searchable directory with a direct Wazuka entrance, bounded
  results, type filters, visible regional photography and matchas with live
  availability. The place page exposes landscape, fieldwork and leaf handling;
  the deeper reader preserves directory filters, focus and reading position.
- Homepage Origins shows the selected material's growing place and opens it
  directly. Navigation and standalone routes share the same content. Product
  facts retain canonical formats/prices/availability and explicit source rules.
- Final `pnpm validate` passed repository-wide formatting, ESLint, TypeScript,
  all **56 Node tests**, and the production build. Scoped source changes and
  `git diff --check` were also reviewed. Synthetic cases cover six types, 21 places, 18 offers,
  shared materials, blends, role isolation, lot scope and publication boundaries.
- Browser review covered 1440px desktop, 390px light mobile and 320px dark mobile,
  including reduced motion. All supplied field images loaded and no horizontal
  overflow appeared. Type filters survive field-reader return with focus restored.
  Product selection, quantity 02 and a local reference survived an Origins visit;
  Escape, Return and keyboard boundaries were checked. Browser Forward while
  Cart is open keeps Cart as the only modal. Wazuka's Barista link selects that
  exact product in the existing homepage, with its availability unchanged.
- No cart writes, production mutations, deployment, dependencies or database
  changes. JMM remains read-only source evidence. Concurrent shop work is preserved.
