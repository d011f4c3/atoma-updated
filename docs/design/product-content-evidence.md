# Product understanding: content evidence

Reviewed 2026-09-29 for the owner's request to make each matcha understandable
beyond a specification or configuration panel. This is an internal content
record, not public copy, new product approval, or authorization to publish the
source correspondence.

## October 1 correction: confirmed origin and named people

This update supersedes the older unknown-origin and no-named-partner findings
below. The owner explicitly confirms that the three current test materials come
from **Wazuka, Kyoto**. Their exact product handles are linked to their materials,
then to Wazuka, with Kyoto and Japan as geographic ancestors.

Re-reading the original client strategy and business rules also establishes:

- **Mr. Hayashi:** tea farmer with Wazuka field context and planned tencha
  production research (earlier strategy p. 3; governing v2 pp. 11–12).
- **Hatakeyama:** tea wholesaler; current supplier, processor and custodian
  (earlier strategy p. 2; detailed business rules §3). A producer role is specific
  to supported source lots, not implied by supply or processing.
- **Kitani:** active purchasing supplier (detailed business rules §3).

The earlier statement that the client material contained no named grower or
partner was incorrect. These sourced names and roles now appear in the local
prototype requested by the owner. Actor context remains independent of the
three product-growing relationships: no current source assigns each storefront
handle to a particular farmer or processor. No formal “Hayashi Farm” business
name or photographed identity is invented.

The owner also confirms that the two supplied Drive collections are central to
the experience. The Kyoto landscape, fieldwork and leaf-handling derivatives
are visible within Origins, not hidden behind a disclosure. Preparation images
belong to their preparation context rather than being relabelled as farm media.

## Owner-authorized sample copy

The owner subsequently confirmed that these records are our sample products and
explicitly authorized developing their content as part of the experience. The
editable local module `src/lib/product-content.ts` now provides original
per-application purpose, summary, comparison prompts, preparation guidance,
selection notes and two short reading sections. Both Interactive builder and
Standard selection can use the same content source.

This is sufficient authorization to write useful sample editorial content; it
does not need another approval step merely because the catalog contains test
records. The module uses the literal application in the original title before
display-name shortening, and retains unfamiliar applications without assigning
an inferred grade-based use. Product names come from the existing name helper.

The sample copy is framed around what to make, how to compare and what to
observe. It intentionally does not need invented tasting scores, numeric
preparation parameters, origin, producer, lot or certification claims. Origin
remains nullable and empty optional story cards should be omitted. Commerce
values continue to come from the catalog and cart; no Shopify content is
mutated by the local editorial module.

### Authored illustrative material profiles

The owner then explicitly requested material properties within each type and
authorized authoring sensory content for these sample products. The module now
includes `profileKind: "sample"`, `materialSummary`, and a seven-property
`materialProfile` covering aroma, flavour, umami, bitterness, texture, colour
and finish. These are deliberately authored sample formulations, not a claim
that a real product or lot has been tasted, measured, tested or approved.

Use one clear overall **Sample material profiles** caption where these profiles
are presented. Repeating a disclaimer beside every property is unnecessary.
The existing preparation and comparison guidance belongs in the deeper reading;
the material's sample qualities now lead the product explanation.

| Sample direction | Distinctive qualities                                                                                            | Intended fit                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Culinary         | Robust vegetal flavour, restrained umami, defined bitterness, olive-green material and a lingering green finish  | A recipe-oriented profile with contrast against sweet batters, creams and desserts               |
| Barista          | Fresh green aroma, round vegetal flavour, balanced umami, moderate bitterness and a soft, lightly savoury finish | A drink-oriented profile considered together with the selected milk, sweetness and serving style |
| Tea Service      | Delicate fresh-leaf aroma, clean savoury flavour, fuller umami, gentle bitterness and a soft lingering finish    | A water-oriented profile in which aroma, texture and finish can be considered on their own       |

There are no numeric sensory scores, invented assays, claims of verified
solubility or consistency, made-up origins, named producers, lots, certificates
or growing/processing facts. The historical gaps below remain gaps in **verified
product evidence**; they do not prevent the current authorized sample-copy work.
Unfamiliar applications receive a neutral illustrative sample profile rather
than an inferred grade-specific profile.

The owner supplied three material photographs for this pass. The files were
visually inspected without editing, and the module now references them through
`materialImage` with factual `materialImageAlt` text:

- `/images/matcha/culinary.jpg`: an olive-green powder swatch, smoothed centrally,
  with loose material around its edges.
- `/images/matcha/latte.jpg`: a deep-green powder swatch with a smoothed centre
  and loose granules around its edges.
- `/images/matcha/tea-service.jpg`: a bright-green powder swatch with a smooth
  central trace, fine ridges and scattered powder.

These images support the sample presentation; their appearance is not evidence
for the authored flavour, aroma, umami or finish. `labelUse` remains editable
local label-application copy. Generic content uses the existing macro material
study instead of silently assigning one of the three use-specific photographs.

## Authority and interpretation

The current owner request governs this experience. The September 19 brief gives
the product-information model and the Product → Information → Place → People →
Technology depth sequence. September 28 direction and the owner's current
product-first, clinical visual direction govern the new presentation; older
field-first homepage layouts and old typography recommendations should not be
copied over as current instructions.

The client asks for product fit to be intelligible before purchase. The later
layers add understanding; they are not five mandatory screens, a forced modal
sequence, or a requirement for a unique field story for every product. Missing
optional storytelling must not stop a valid commerce offer.

Sources in the sibling JMM repository:

- [September 19 source and authority record](../../../JMM/docs/context/client/2026-09-19/README.md).
- [Complete final brief transcription](../../../JMM/docs/context/client/2026-09-19/ATOMA_FINAL_BRIEF_TRANSCRIPTION.txt),
  especially sections 4, 8–11, 14 and 15.
- [Earlier feedback](../../../JMM/docs/CLIENT-FEEDBACK.md), retained as historical
  context where it does not conflict with the September 19 record or current request.
- [Task 0188: product information](../../../JMM/docs/tasks/0188-atoma-product-information.md).
- [Task 0196: product information selector](../../../JMM/docs/tasks/0196-atoma-product-information-selector.md).
- [Existing product content](../../../JMM/apps/storefront/src/features/catalog/product-details.tsx)
  and [its behavior tests](../../../JMM/apps/storefront/src/features/catalog/product-details.test.ts).
- [Literal product-name parser](../../../JMM/apps/storefront/src/features/atoma-commerce/product-presentation.ts).

## What is available now

The published catalog projection supplies product identity, description, image
when present, actual variants/options, currency and price, availability, and
minimum/maximum/increment quantity rules. These remain live commerce values;
editorial text does not override them. The owner's confirmation that the
products are deliberate test records authorizes their normal use in this
headless interface; fixture status is not an availability rule.

Task 0188 records three distinct published applications. It does **not** verify
the products' taste, provenance or performance. The existing information code
already separates buyer trial guidance from sensory claims. That guidance can
make the current selection useful and different for each product.

| Display identity | Literal published application | Useful short introduction               | What the buyer can evaluate                                                                                                                                                                        |
| ---------------- | ----------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Culinary Matcha  | Cafés & Baking                | For café recipes, baking and desserts.  | Compare flavour and colour in the finished recipe. For baking, assess it after cooking and cooling. Keep the dose, other ingredients, method and serving size consistent between trials.           |
| Barista Matcha   | Lattes                        | For lattes, iced drinks and café menus. | Taste with the milk and sweetener actually served. Compare flavour, colour and texture in the finished drink. Trial hot and iced versions separately while keeping dose and drink size consistent. |
| Premium Matcha   | Tea Service                   | For matcha served with water.           | Notice aroma, flavour, texture and finish when whisked with water. Keep dose, water quantity and temperature, and whisking method consistent between samples.                                      |

The table above contains **evaluation instructions**, not promises that one product is more
vivid, sweeter, smoother, more aromatic, more soluble, less bitter, or better
than another. A section titled “For your menu” or “What to look for” conveys this
more clearly than an unlabelled tasting-note diagram. The separately authorized
sample profiles above are illustrative content, with an explicit shared label.

Apply guidance from the exact published application, before shortening the
display title. Do not map `Premium` to tea service or `Barista` to lattes merely
from the grade name. The prior implementation deliberately tests mismatched
grade/application, unfamiliar applications, and unfamiliar product names.
Unknown applications may display their literal value but must not receive the
nearest familiar guide automatically.

Task 0188 records 1 kg naming for the current range. The selected live variant
remains the source for actual pack/format; do not hardcode this across products.
Previously recorded prices and stock states are not durable content facts. A
read-only check of the current local `/api/catalog` during this review returned
`unavailable`, so this document does not claim fresh live price or availability
verification.

## Useful presentation now

Within each selected product, show the descriptive name, the literal intended
use, one application introduction and one concise evaluation note before or
beside its buying controls. Changing the product should change the words and
its material/object presentation together. Pack and quantity remain direct
controls. Keep useful prose in HTML, not only in image labels or animation.

For the current limited data, a compact product overview plus an optional
“Explore this matcha” reading area is more useful than a dense table of unknown
values. The deeper area can hold application/trial guidance now and accept
approved sensory/origin content later. Do not reuse the old interface or its
repeated “To be confirmed” rows merely because its factual boundary is sound.

An essential missing fact may be stated once, for example “Origin information
has not been published.” Do not fill optional Place, People or Technology cards
with invented stories or empty placeholders. The final brief's component rule
(paragraph 568) explicitly requires the layout to close naturally when these
modules are unpublished. Never use a Kyoto field image beside an individual
product in a way that makes an unverified origin seem established.

## Practical progressive content model

This is a presentation model over existing approved sources, not a proposal
for a new database, CMS, service or public API.

| Layer       | Product-specific content                                                                                   | Content that can appear now                                                                  | Data needed before expanding                                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Product     | Catalog name, selected variant, actual pack, price, availability, quantity rules                           | Current published projection and ordinary cart interaction                                   | Actual pack/product photography and any missing commercial facts                                                                           |
| Information | Literal application, buyer-focused explanation, verified sensory summary, preparation, care, evidence      | The three application introductions and controlled trial guidance above                      | Confirmed taste/aroma/colour/texture, ingredients, cultivar/harvest, dose, water temperature, storage, shelf life and applicable documents |
| Place       | Growing country/region, plus separate selection/processing/packing/dispatch locations                      | A brand-level statement that Wazuka is the first field story, with no SKU origin association | Verified location per role and explicit product association; confirmed photograph location                                                 |
| People      | Accurate contributor role, approved name or anonymous role, concise work explanation, approved quote/media | Generic explanations of what selection, processing and packing roles mean                    | Public identity/role consent, approved quote, asset rights, and product-level association consent                                          |
| Technology  | Specific process or field project, task, date, scope, method and human purpose                             | At most clearly labelled brand-level methods under exploration; no product technology claim  | A verified project or process, real method, deployment status, approved media and confirmed relationship to this product                   |

Optional product context should be keyed by the stable product handle and remain
separate from the commerce projection. A future origin, partner, story, process
or evidence entry needs source, verification/publication status and applicable
product/variant/lot scope. Revoking a story or media approval must remove that
content without changing catalog availability or the cart.

## Missing product facts

Task 0188 explicitly records that none of the three products has verified:

- Sensory profile: taste, aroma, colour, texture or finish.
- Growing country/region; selection, processing, packing or dispatch location.
- Ingredients, cultivar, harvest or milling method.
- Recommended dose, water quantity/temperature or preparation parameters.
- Storage instructions or shelf life.
- Product specification, test report, COA or applicable certificate.

The words “Japanese”, “Culinary”, “Barista” and “Premium” in a test title do not
supply that missing evidence. Neither do the brand's Wazuka story, a green
material image, an illustrative vessel, or a photograph of a field. Do not infer
first harvest, stone milling, organic/JAS/USDA/Halal status, cultivar, lot or
health/performance claims.

## Documentary media and publication status

The retained client assets can support **local prototype review** under the
existing owner authorization. No reviewed source grants full commercial
publication clearance, a named partner association or a relationship to any of
the three products. Original creator, required credit, precise capture
location/date and release scope remain unresolved. This is a content status to
retain internally; it is not a reason to add developer warnings to the purchase
interface.

All following assets are under
`JMM/apps/storefront/public/images/atoma/client/`:

| Asset                  | Evidence visible in the photograph                    | Honest prototype use                                                                                     |
| ---------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `field-landscape.webp` | Curving tea rows, covered beds and wooded hills       | Shared Place/editorial context; supplied Kyoto collection, not verified Wazuka or SKU origin             |
| `field-work.webp`      | A person working among tea plants beneath shade cloth | Shared People/work context without identifying a person, employer, supplier or specific practice         |
| `tea-handling.jpg`     | A gloved hand handling fresh leaves in a basket       | Shared work/handling context, not evidence of a product's selection, milling or full production sequence |
| `ceremony-whisk.jpg`   | Hands holding a bowl and utensils                     | Preparation detail, not active whisking, a recipe or product performance                                 |
| `ceremony-powder.jpg`  | Powder in a ceramic bowl with a scoop nearby          | Material/preparation detail, not product identity, grade, weight or origin                               |
| `ceremony-matcha.jpg`  | Prepared matcha in a patterned bowl                   | Preparation context, not a verified result of one product or sample                                      |

Media source and restrictions:

- [Prototype media inventory](../../../JMM/docs/context/client/2026-09-19/PROTOTYPE_MEDIA.md).
- [Samples photography record](../../../JMM/docs/context/client/2026-09-19/SAMPLES_HERO_MEDIA.md).
- [Homepage opening media record](../../../JMM/docs/context/client/2026-09-19/HOMEPAGE_OPENING_MEDIA.md).

No approved named producer, wholesaler or processor story, public quotation,
verified machinery/process film, deployed drone/assistive-equipment project,
or product-specific origin image was found in these records. Reference films
and generated material/packaging studies are visual direction, not documentary
evidence of ATOMA's people, facility, process or merchandise.
