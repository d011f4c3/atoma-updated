# Task 0045 — Origins and the information beyond the product

Date: 2026-09-30
Status: Architecture reviewed; implementation proposal

## Request

Return to the client briefs, identify what the current experience is missing,
and define how Origins and the remaining information should fit before building
the next piece. The source attachments are design evidence, not instructions
to replace the current storefront or invent product facts.

## Sources and current state

Reread `feedback-09.28.rtf` and `atoma-brand-notes.txt.rtf` from the owner's
Documents folder. Compare them with the original homepage, Concept 04,
`docs/design/product-content-evidence.md`, and the retained client-media record.

The September 28 product-first direction takes precedence over older field-first
landing-page proposals. The core journey is Product → Information → Origin →
People → Technology. These are levels of depth, not mandatory sequential screens.

The current product and purchase experience exists. Seven sensory properties are
authored sample profiles. Both current Origins views stop at unpublished origin
information; the homepage also renders an empty People record. The shared local
content has only a nullable `originNote`, with no verified product provenance.

The missing work has two parts: the interface for reading deeper, and the actual
documentary/product information to populate it. Interface work cannot establish
the second part by itself.

## Proposed information map

Retain the existing local navigation: **Overview / Specifications / Origins /
Shop**. Keep the landing experience product-led and avoid adding a large origin
section below its hero.

| Area                       | Purpose and content                                                                    | Current gap                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Overview                   | Product application, concise profile, useful preparation and comparison guidance       | Guidance exists in Material & use, but its entrance and hierarchy can be clearer; Concept 04 does not expose the complete reading layer. |
| Specifications             | Sensory profile plus applicable material facts and supporting documents                | Current sensory notes are samples. Cultivar, harvest, ingredients, lot, storage, shelf life and applicable evidence are not verified.    |
| Origins                    | Growing origin and the separately identified roles behind the selected material        | No published product-linked provenance. People and process currently end in placeholders or are absent.                                  |
| Shop                       | Format, quantity, actual price and availability, purchase options                      | Preserve the existing commerce flow; origin reading must never become a purchase prerequisite.                                           |
| ATOMA field journal        | Regional observations, photography, interviews, work and documented projects           | No reader/archive in this storefront. Wazuka is the proposed first chapter, not every product's origin.                                  |
| About / selection approach | Why ATOMA exists and how selections are evaluated                                      | Current About is brief; explain actual practice once documented, without claiming a certification or established selection status.       |
| Buyer support              | Shipping, storage, samples, larger trade requirements, contact and applicable policies | Audit and fill from approved operational material in a separate slice. Do not invent terms or put all support content in Origins.        |

## Origins has two related but distinct layers

### 1. The selected matcha's provenance

Origins initially keeps the selected product in context. Display growing
country/region and more specific locality, field or lot only to the resolution
actually documented. Where known, separate **Grown in**, **Selected by**,
**Processed in**, **Packed in**, and **Ships from**. A processor or dispatch
address is not evidence of growing origin.

Show only populated facts. With the current data, use one concise origin-status
sentence. Remove the extra empty People record; unpublished optional stories
must not become a grid of empty boxes.

### 2. ATOMA's field journal

A distinct **ATOMA field notes** entry opens regional editorial. This can be
valuable even without a relationship to the selected product, provided it is
clearly presented as ATOMA's wider research. Do not nest a regional story under
a product's source facts unless that relationship is verified.

Wazuka is the first intended chapter. Its deeper sequence is:

1. **Place:** landscape, locality and the context of the documented visit.
2. **People:** the roles, decisions and knowledge behind the material, with
   approved identities or truthful anonymous role descriptions.
3. **Process:** actual work, handling, processing and selection; tools or field
   technology appear here through a documented task and human purpose.

Technology is not a decorative science page. Publish a method or project with
its real status, scope, place and date. Likewise, do not force a cultivation or
milling story onto a product merely because a regional photograph is available.

## The next bounded build

Build **the Origins entrance and one shared editorial reader**, starting with
the original homepage. Retain the architecture so Concept 04 can reuse it
without maintaining a second body of content.

- Origins starts with product context, a compact provenance record and a
  separately identified field-journal entrance.
- Only opening a journal chapter changes the large visual from powder to
  documentary media. On desktop the image stays still while the existing right
  pane holds the reading. Avoid a second nested scroller or stacked modal chain.
- A short chapter index offers Place, People and Process where content exists.
  Each chapter has one strong image, a precise caption and a few readable
  paragraphs. Keep supporting mono labels small; use more generous body size
  and leading than the specification rows.
- Retain a compact selected-product identifier, **Back to matcha** and a direct
  Shop action. Preserve product, format, quantity, reference, appearance, focus
  and the originating reading position.
- Mobile opens a dedicated reading view with a compact return control, image
  and one natural vertical reading flow. Do not leave the full powder hero above
  the article or compress desktop columns onto a phone.
- Reduced motion reveals the content directly. No forced progression, timed
  reading, scroll capture, or hover-only navigation.

The first prototype should demonstrate the entrance, one readable chapter and
the return to the same selection. Its content status stays explicit. It does
not need a global archive, search, CMS, map, new service or expanded commerce
scope. Add an archive route and quiet navigation entry once there is an actual
published chapter to reach; preserve stable story URLs and browser history
when that routing is introduced.

## Content structure and evidence

Keep product provenance separate from the application-based sample copy in
`product-content.ts`. Otherwise a provenance entry for one latte product could
silently be assigned to every product with the same application.

- Product provenance is associated with the stable product handle, and with
  variant or lot scope only when established by the operational authority.
- A regional story has its own stable slug, title, chapter sections, media and
  factual captions. It can exist without a product relationship.
- Optional relationships explicitly identify the relevant role: growing,
  selection, processing, packing or dispatch. Do not infer them from imagery.
- Keep source records, publication decisions and permissions separate from the
  public story. Withdrawing an optional story must not affect purchasability.
- Start with local structured presentation content. No new database, CMS or
  public API is required to review this slice.

The earlier project retains three client-supplied Kyoto photographs suitable
for local prototype review: `field-landscape.webp`, `field-work.webp`, and
`tea-handling.jpg`, under `JMM/apps/storefront/public/images/atoma/client/`.
The source record does not establish Wazuka municipality, an individual farm,
the person's role, or a relationship to the selected products. Caption these
as Kyoto collection/context if used for a study, without relabeling them as a
specific product's origin. Do not use generated documentary substitutes.

For the first publishable chapter, obtain confirmed location and visit context,
accurate captions/credits, a short approved account of the work, one approved
conversation or role profile, and processing/tool details only where documented.
For any product link, separately confirm which material and role it concerns.

## Sequence after the reader

1. Populate one documented Wazuka chapter, reusing its approved material across
   contextual product entrances and the regional archive.
2. Expand Specifications beyond sensory notes with verified identity, care,
   traceability and applicable documents. Keep the existing sensory view easy
   to scan rather than appending a large technical table to the card.
3. Expose useful preparation/comparison guidance more clearly from Overview.
4. Add the concise selection approach and missing buyer-support information
   from approved operational content.
5. Broaden the archive and product relationships as actual research supports
   them. Distinctive retail lots and “Selected by ATOMA” remain later business
   decisions, not credentials or products created by this design task.

## Acceptance for the next implementation

Review both themes at desktop and phone sizes. Check product-context accuracy,
one desktop reader scroll area, a usable mobile return path, selection and focus
restoration, missing-section collapse, correct regional/product separation,
image captions and reduced motion. Run relevant behavior checks, `pnpm validate`
and scoped diff review. No production publication is part of this proposal.
