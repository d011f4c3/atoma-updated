# Origins growth contract

Date: 2026-09-30

Scope: Task 0048 presentation architecture and regression cases. This document
does not create operational inventory entities, publish provenance records or
authorize new products.

## Brief and interpretation

Reread the complete owner-supplied `feedback-09.28.rtf` and
`atoma-brand-notes.txt.rtf` from the owner's Documents folder. The former places
origin after product information. The latter makes the intended depth explicit:

> Product → Information → Origin → People → Technology

> KYOTO PURE → Kyoto → Wazuka → producer / wholesaler / field

> Wholesale → Origin → Lot → Producer → Retail

The brand notes also say, “Wazuka is the first chapter, not the whole story,”
and “We do not necessarily need to force every region into the exact same
format.” Their examples include Kagoshima, Shizuoka, Uji, Taiwan and other
producing regions. These are expansion directions, not published ATOMA sourcing
claims. Example product names, lot codes, pack sizes and certifications in the
brief are illustrative rather than verified catalog facts.

The architectural interpretation is increasing factual resolution around a
product, alongside an independently useful regional archive. The arrows express
discovery, not a mandatory sequence, a single-origin constraint or a fixed data
hierarchy. A global Origins entrance must scale beyond one Kyoto article while
the homepage remains product-first.

## Distinct records and relationships

| Record          | Meaning and boundary                                                                                                                                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Matcha type     | An explicit classification for browsing and comparison. Several products can share a type; an unfamiliar product may have no binding. Type, grade label and application do not establish origin, producer or lot.                                   |
| Catalog product | The actual merchandise identity supplied by commerce. Use exact published handles for current presentation bindings; retain the operational product identity when available. A renamed label or similar title must not create a match.              |
| Variant / offer | A purchasable format, price, availability and quantity rules from the catalog. Pack size or wholesale/retail positioning does not establish a different growing origin.                                                                             |
| Material / lot  | The underlying material and, where documented, a particular production scope. A product can draw on several lots over time; a lot can supply several offers. The frontend must not allocate stock or infer which lot a purchase will receive.       |
| Place           | A stable place identifier, display name, kind and optional parent. Support different geographic depths, such as Japan → Kyoto → Wazuka, without requiring every record to reach a municipality or field. A producer is an actor, not a child place. |
| Actor and role  | A documented producer, wholesaler, selector, processor, packer or dispatch party. One actor can have several roles; several actors can contribute to one material. Role and place are separately stated.                                            |
| Editorial entry | An independently identified story with flexible sections and media. Many entries can concern one place, and one entry can concern several places. A story can exist without a product relationship.                                                 |

Keep the place catalog, product-type bindings, editorial-place links and
material/product provenance relationships separate. A flat list of product
handles on an article cannot express these distinctions. Each factual
relationship needs a defined subject, role, documented place/actor, evidence
reference, publication status and scope. Lot-specific evidence remains scoped
to that lot; a product-wide claim requires product-wide evidence.

Editorial coverage does not create a growing relationship. Processing, packing
and dispatch locations must not enter a **Grown in** filter. Conversely, a
documented origin does not require a published story before a product can be
understood or purchased. Type filters may group explicitly bound products and
their documented relationships; they must not assign a type's apparent origin
to all products with that type.

## Geographic resolution, blends and change

- A documented Wazuka growing relationship may be found under its Kyoto and
  Japan ancestors. Kyoto-only evidence cannot be narrowed to Wazuka. An article
  covering Kyoto does not prove that every descendant place was visited.
- Accept multiple growing relationships for one material, including blends.
  Preserve each documented component and its scope. Do not choose one place as
  the sole origin merely because it has a photograph or appears first. Show
  proportions only when documented; missing proportions are not equal shares.
- Broad regional evidence and a specific field record can describe overlapping
  resolution rather than distinct blend components. Do not sum or duplicate
  them. Unknown or partial provenance remains explicit and does not prevent
  commerce.
- Changes between lots must not overwrite historical relationships. Future
  revisions need stable lot/material references, effective scope and retained
  evidence history. A current lot's producer, cultivar or certification must not
  silently apply to earlier lots or every future unit of the product.
- Wholesale and retail offers can point to the same documented material or lot.
  Share its evidence without duplicating the provenance story. Keep commercial
  formats, pricing and availability separate. A shared name, application or
  photograph alone is insufficient to establish that relationship.
- Correcting or withdrawing a claim or article must remove it from public
  connections without deleting the merchandise or changing its availability.

These are compatibility requirements, not a request to build lot allocation,
inventory, a CMS or a new database in this task. Until reviewed projections
provide those identities and relationships, leave the relevant records empty.

## Known now and future evidence

The current catalog establishes product identities, variants and commerce
values. Authored application guidance and seven sensory properties are approved
sample content, not lot measurements. The October 6 feedback replaces the
October 1 all-three-materials Wazuka attribution: Ceremonial retains its
material-level Wazuka growing link; Barista and Culinary have sourced UJI tea
designation links, with their exact growing and processing locations still
unpublished. Product-level producer assignments, lots and certificates remain
separate facts.

Tea designations have independent definitions and material associations, each
with publication/evidence guards. They are not Place records or supply-chain
roles and never enter growing-place filters, geographic ancestry or automatic
field-note relationships. The same exact material bindings serve the homepage,
retail information and the existing Uji City view's UJI-series products. Unknown
handles and familiar names or code prefixes do not create an association.

The existing Uji City location view explains the designation's wider scope and
shows its associated products under UJI series. The homepage uses the same
photographic Panorama composition as Wazuka. Task 0124 uses matching
Country / Region / Locality rows for both: Japan → Kyoto → Uji City and
Japan → Kyoto → Wazuka. This Uji display path is editorial place context, with
the designation caveat in body copy; it does not add growing provenance. A
distinct image from the supplied Kyoto collection appears in Uji's preview,
directory hero and thumbnail, retaining its Kyoto caption and without adding
an editorial field entry or changing the Wazuka photograph.
The existing directory/location markup, section order and theme hooks remain.
Its context follows [MAFF's Uji Tea reference](https://www.maff.go.jp/e/policies/market/dento_syoku/menu/uzi_tea.html)
and [Kyoto Prefecture's municipality list](https://www.pref.kyoto.jp/link.html),
verified on 2026-10-06. These sources do not establish product-specific growing
or processing locations. Uji City and Wazuka Town are separate municipalities
within Kyoto Prefecture; Wazuka is not a child of Uji City.

Under Task 0115, directory browsing uses `getDirectoryMatchasForPlace` to
combine documented growing relationships with designation context within the
selected place's published subtree. Kyoto and Japan list all three products;
Uji City lists its two UJI associations and Wazuka lists Ceremonial. Counts and
type filters use the same lookup. This browsing roll-up does not add provenance
links or change `getMatchasForPlace`, product field notes or photo evidence.

The original client strategy and detailed rules identify Hayashi as a tea grower
with Wazuka field context, Hatakeyama as wholesaler/supplier/processor/custodian,
and Kitani as an active supplier. The presentation now contains independent
person/partner records for those names and roles. Only Hayashi has a documented
Wazuka context link; none automatically becomes a product producer. The owner
requests these known people in the local prototype.

The supplied photographs support Kyoto collection context and observations of
visible landscape/work/leaf handling. They are a visible part of Origins. Their
record does not identify a precise field or person; the owner’s product-origin
confirmation is separate from photographic metadata.
Retain the distinction described in [the content evidence record](product-content-evidence.md).

Future entries may be photographic essays, interviews, processing accounts or
mixed chapters. Publish only sections supported by their material; omit empty
People/Process placeholders. Source attribution, relationship review and media
publication permission remain separate decisions. “Selected by ATOMA” is a
future business status, not a certification conferred by appearing in this UI.

## Meaningful regression cases

Use clearly synthetic fixtures in tests, never invented public product records.

| Case                              | Required assertion                                                                                                                                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Many types and products           | More than three types and several products per type remain independently selectable; unknown bindings remain unclassified. Renamed display text cannot change identity or origin.                                                 |
| Geographic ancestry               | A Wazuka fixture is discoverable through Kyoto/Japan; a Kyoto-only fixture does not acquire Wazuka. Reject missing parents and cycles.                                                                                            |
| Editorial many-to-many            | Multiple entries per place and a cross-region entry are discoverable without duplication. No entry implies a product growing relationship.                                                                                        |
| Role isolation                    | A product grown in place A and processed/packed in B appears as grown in A only. Distinct producer and wholesaler roles remain distinct.                                                                                          |
| Blended material                  | A two-origin fixture retains both documented components. Unknown shares remain unknown; ancestor resolution is not counted as another component.                                                                                  |
| Lot revisions                     | Two lots of one product retain different origin/actor facts. Selecting an unspecified lot does not claim either as the fulfilled lot; historical evidence survives a newer revision.                                              |
| Shared material                   | Wholesale and retail offers explicitly linked to one material share its factual record, while maintaining separate formats, prices and availability. An unbound lookalike does not inherit it.                                    |
| Publication boundaries            | Draft, withdrawn, source-free and out-of-scope relationships are excluded. Exact handles/IDs match; title substrings and grade names do not.                                                                                      |
| Variable editorial shape          | Image-only, interview and multi-section fixtures render their available content without empty chapter navigation or forced Place/People/Process blocks.                                                                           |
| Missing evidence and availability | Unpublished origin and absent articles do not disable an otherwise valid purchase. An unavailable connected product remains visibly unavailable.                                                                                  |
| Selection continuity              | Origins open, chapter changes, Return, Escape and Back/Forward preserve product, variant, quantity, reference, active view, card identity and underlying scroll; focus returns to a visible entrance across breakpoints.          |
| Direct entry and growth           | Exact-handle entry works on a cold load and within the current homepage. Unknown handles fail safely. A larger index remains usable on desktop/mobile with keyboard and reduced motion, without one nav button per product/place. |

Unit tests should establish the relationship and publication rules independently
of rendering. A small number of browser flows should establish discovery,
return/history behavior and responsive interaction. Keep the existing commerce
contract tests unchanged.
