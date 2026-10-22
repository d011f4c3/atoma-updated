# Task 0221 — Turn the October client feedback into actionable work

Date: 2026-10-20
Status: Frontend implemented locally; commercial work reviewed separately
Authority: Owner request to turn two supplied client documents into task items

Scope update: the owner subsequently requested beginning the homepage-entry
work, then clarified that alternative customer flows should be compared before
the actual homepage changes. [Task 0222](0222-hero-cx-flow-study.md) implements
that separate study. At that point, F02 adoption awaited a selected direction.

Subsequent owner direction: work through the original six recommended work
groups before revisiting the CX study. The study's imagery and left composition
are not accepted. Begin with the existing site's homepage message and sample
entry in [Task 0223](0223-homepage-application-entry.md), then application imagery,
comparison/specifications/navigation, tasting handoff and mobile interaction.
Commerce, analytics and operations remain a separately evidenced workstream.
This authorizes frontend implementation in the existing site; it does not
adopt the CX study or authorize a production release.

## Current implementation status

The owner authorized the six work groups below after the original planning
pass. The detailed checklists retain the original task definitions; this table
records the current implementation and verification status.

| Work group                                         | Result                                                                                                                                 | Evidence                                                                                                  |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1. Homepage message and sample entry               | Implemented locally: application-led introduction, primary Sample Set entry, three application routes and retained packaging           | [0223](0223-homepage-application-entry.md)                                                                |
| 2. Distinct application imagery                    | Implemented with owner-approved labelled composition references; final actual-product photography remains outstanding                  | [0224](0224-application-overview-imagery.md), [image register](../design/application-imagery-register.md) |
| 3. Comparison, specifications and navigation       | Implemented: three-product comparison, visible sensory values and formats, distinct ordering labels and selection continuity           | [0225](0225-product-comparison-and-reading-flow.md)                                                       |
| 4. Tasting to the named 1 kg product               | Implemented: exact product links and retained unsaved tasting state on return, with existing explicit Save/Clear behavior              | [0226](0226-tasting-to-named-order.md)                                                                    |
| 5. Mobile reading, scrolling, motion and loading   | Implemented and verified across eight browser profiles; primary navigation no longer waits for the initial destination lookup          | [0227](0227-client-mobile-reading-and-motion.md)                                                          |
| 6. Commerce verification, analytics and operations | Readiness review complete with decision/verification matrices, an event contract and discovery inputs; live execution remains separate | [0228](0228-commercial-readiness-review.md)                                                               |

Frontend evidence uses local browser emulation and controlled commerce fixtures.
It does not establish production checkout, payment, email delivery, fulfilment,
physical-device performance or analytics operation. The CX study remains a
separate, unaccepted design comparison; its revision follows this six-group pass
in [Task 0229](0229-clearer-hero-cx-study.md).
The owner then preferred Guided visually and requested clearer logic; the next
pass is tracked in [Task 0230](0230-guided-cx-second-pass.md).
The subsequent hero revision in [Task 0231](0231-product-led-cx-hero.md)
foregrounds the finished applications after the owner rejected the prior
alternatives and clarified that pouches do not explain ATOMA's offer.
The owner then rejected that photographic hero as off-brand.
[Task 0232](0232-brand-led-cx-hero.md) restores the material identity while
retaining direct application and sample paths. This remains an independent
study, not an accepted homepage replacement.
The owner's subsequent request for invention is tracked in
[Task 0233](0233-application-field-hero.md), which makes application entrances
the organising composition around a changing powder field.

## Outcome and scope

Refine the existing ATOMA experience so a buyer can understand the three
applications, try the Sample Set, compare the teas, choose the matching 1 kg
product and return to reorder. Keep the silver packaging, powder imagery,
product codes, restrained palettes and material character.

The original Task 0221 produced a backlog only. The documents are evidence of client
feedback; their implementation, checkout, staging and operations instructions
do not authorize those actions in this request. No storefront code, commercial
settings or production systems changed in that planning task. Later bounded
implementation tasks are recorded above.

The two briefs have different scopes:

- **Frontend brief F**, dated 20 October 2026, requests presentation and
  continuity. It explicitly excludes payment integration, live inventory,
  pricing decisions, logistics and backend work. Its first review prioritizes
  the homepage and Overview for all three products.
- **UX directive U**, dated 20 October 2026 in its footer, describes the wider conversion
  journey. It prioritizes product pages before the homepage, includes real
  checkout QA in P0, and adds measurement and operations integration later.

**Recommended sequence:** use F for the first frontend review, incorporating
compatible UX requirements from U. Track commerce verification separately;
follow it with analytics and operations work. This is a proposed reconciliation,
not a claim that either document supersedes the other. The owner's subsequent
request resolved D1 for local frontend implementation.

## Source references

Section references below refer to headings in the originals, not inferred page
numbers. Original documents remain outside the repository.

| Reference | Document                                                      | SHA-256                                                            |
| --------- | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| F         | `ATOMA_Design_and_Frontend_Instructions_for_Abi_English.docx` | `2312090b738d7ce97c1387c2e30da5fbb3b9dc97099b0cb646ae112ba236cb9b` |
| U         | `ATOMA_Website_UX_Implementation_Directive_for_Abi_EN.docx`   | `5118df787696be553be561c35c688d0c3855611633a91262166f7b3c8438fc9f` |

Both were supplied from the owner's Downloads folder. This plan also uses the
[original client synthesis](../briefs/2026-09-28-client-direction.md) and the
current repository evidence below. Proposed effort, assignees and task
boundaries are planning recommendations, not client commitments.

## Existing work to reuse

These are repository findings, not a fresh audit of the deployed site or proof
of successful production purchases. Older task statuses are historical where
later tasks changed the behavior.

| Area                      | Current evidence                                                                                                                                                 | Consequence for this backlog                                                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Product identity          | [0106](0106-product-codes-and-catalog-projection.md), [product codes](../../src/lib/product-codes.ts): Ceremonial `WZKA-00`, Barista `UJI-00`, Culinary `UJI-01` | Preserve this mapping. Reconcile production merchant IDs separately; no new display-code scheme is needed.                                                                                 |
| Origin and supplier facts | [0107](0107-uji-designation-and-wazuka-origins.md), [product facts](../../src/lib/product-details.ts)                                                            | Keep UJI designation distinct from geography. Several supplier facts remain unconfirmed; code prefixes and photographs are not provenance evidence.                                        |
| Sensory copy              | [Product content](../../src/lib/product-content.ts) explicitly identifies authored sample profiles                                                               | Current flavour/texture values can support prototype layout review; they are not verified lot measurements.                                                                                |
| Samples and next order    | [Sample Set](../../src/lib/sample-set.ts), [sample journey](../../src/lib/sample-journey.ts), [next-order interface](../../src/components/sample-next-order.tsx) | Three 20 g teas, saved choice and exact 1 kg route resolution already exist. Improve the handoff and labels rather than rebuild the flow or revert to old 30 g copy.                       |
| Tasting tools             | [0205](0205-sample-comparison-and-tasting-cards.md), [0207](0207-mobile-sample-tasting-tools.md)                                                                 | Local notes, recipes, two-tea comparison and card exports exist. Retain them; add the missing connection to the named 1 kg product.                                                        |
| Commerce                  | [0170](0170-sample-to-repeat-order.md), [0171](0171-destination-switch.md), [ADR 0006](../adr/0006-native-shopify-checkout-popup.md)                             | Checkout, subscription and destination/currency capabilities have prior implementation. Audit current behavior and release status; do not treat them as absent or approved for production. |
| Sample credit             | [0179](0179-compact-stickers-and-later-credit.md), [ADR 0009](../adr/0009-sample-credit-cart.md), current next-order copy                                        | The repository describes ¥4,500 and email delivery. The public apply-credit action was deliberately retired. Reconfirm terms and delivery evidence; do not restore that action.            |
| Shop filters              | [0220](0220-shop-future-filters.md)                                                                                                                              | Category works; Taste and Region intentionally remain noninteractive “Coming soon” text. This feedback does not require implementing those filters.                                        |

## Proposed frontend tasks

P0 means needed for this frontend review, not authorization to release.
P1 means a follow-on improvement. Work on one bounded implementation task at
a time; use these item IDs when creating its task file. Suggested assignee:
Abi for frontend work, supported by the product/content owner where noted.

### F01 — Record the baseline and asset gaps

**Priority:** P0 prerequisite. **Depends on:** D1. **Source:** F Scope,
Product images, Deliverables; U §08.

- [ ] Capture the current homepage, all three Overview/Specifications views,
      Shop comparison and samples-to-1 kg path on desktop and mobile.
- [ ] Inventory the three product identities, application copy, sensory values,
      formats, prices and destinations. Mark each as current catalog data,
      authored prototype content, supplier-confirmed fact or missing input.
- [ ] Make an image register recording intended SKU, application, reference or
      final status, actual-product verification, permitted use and replacement
      owner. Keep reference imagery separate from final photography.

**Done when:** every affected screen has a before capture and every required
image/value has a known source or explicit gap. This inventory must not turn
sample profiles into verified product claims.

### F02 — Clarify the homepage message and sample entry

**Priority:** P0 first review. **Depends on:** F01. **Source:** F §1; U §04.

- [ ] Explain Japanese matcha for tea service, lattes and recipes/baking, with
      cafés and food businesses as the primary audience.
- [ ] Start from “Matcha for the way you make it.” and the supplied supporting
      sentence. Treat wording as proposed copy that can be adjusted to fit.
- [ ] Make “Start with the Sample Set” the primary action and “Explore by
      Application” secondary. Show three teas at 20 g each and visible entry
      points for the three applications alongside the retained silver bag.

**Done when:** at 360 px and 390 px, a first-time reader can identify the three
uses and the sample entry from the first screen. The primary action works
before entrance animation completes. Application entries select the correct tea.

### F03 — Give each Overview its own application image

**Priority:** P0 first review. **Depends on:** F01 and image inputs.
**Source:** F §2; U §03A and Photography.

- [ ] Ceremonial shows prepared matcha in a bowl, with colour and foam visible.
- [ ] Barista shows a prepared latte; U prefers an iced latte with visible
      milk/matcha contrast. Culinary shows a finished baked item or dessert.
- [ ] Switch the image, application and short description together when the
      product changes. Retain powder for colour/material context without using
      the same dominant image for Overview and Specifications.
- [ ] Use identified reference imagery for prototype review only. Track missing
      final photos; publish product-result photography only when it actually
      depicts the corresponding tea.

**Done when:** all three Overview designs work on mobile and desktop, maintain
the correct identity on switching/back navigation, and have intentional crops
and alt text. Prototype layout review may finish with explicit references;
final-photo acceptance remains open until actual-product images arrive.

### F04 — Make product cards and three-product comparison useful

**Priority:** P0 after first review. **Depends on:** F01–F03.
**Source:** F §3.

- [ ] Order each Shop card as name, application, short description, format and
      price, then details action. Use current data and readable availability
      states; key information must be accessible without hover.
- [ ] Add a comparison of all three products by application, flavour, colour,
      format and price. Make attributes align across products on desktop and
      provide a readable narrow-screen arrangement.
- [ ] Keep this product comparison distinct from the existing two-tea personal
      tasting comparison; reuse canonical identities and values.

**Done when:** a buyer can compare the three uses and differences without
repeatedly opening product pages. Missing/illustrative values remain identified;
comparison controls lead to the selected product without altering the cart.

### F05 — Separate application, specifications and ordering information

**Priority:** P0. **Depends on:** F01 and F03; coordinate with F04.
**Source:** F §4; U §03B.

- [ ] Establish the reading order: application/result, characteristics,
      differences, format/price, then order action, while keeping a clear next
      action within reach.
- [ ] Make aroma, flavour, umami, bitterness, texture and colour visible as a
      scannable list. Reserve accordions for additional explanation.
- [ ] Consolidate existing product details. Include code, best uses and formats;
      show origin claims, MOQ, COA/document availability, dispatch and destination
      notes only where supported by current approved data.
- [ ] Keep Sample Set and the selected 1 kg path evident. A request-quote action
      requires an agreed working destination and offer; do not add a dead CTA.

**Done when:** essential comparison and order information is visible without
switching tabs or opening accordions. No unsupported
certification, sensory measurement, stock or country-compliance claim is added.

### F06 — Give navigation distinct roles and preserve the chosen product

**Priority:** P0. **Depends on:** F02 and the F05 information structure.
**Source:** F §5; U §05 steps 1 and 5.

- [ ] Distinguish whole-catalog Shop, application exploration, Sample Set and
      ordering the selected tea. Use a specific product-level label such as
      “Order 1 kg” where that format is valid.
- [ ] Carry product, selected format, quantity and matching copy from homepage
      explorer to product page/order interface and back. Keep existing cart,
      theme, language and destination state intact.
- [ ] Review deep links and current-location/back cues. Audit test-only handles
      against canonical mappings; do not rename catalog handles during a visual
      task or guess replacements.

**Done when:** each of the three application paths and browser Back retains the
intended tea/format and matching image/copy. Unavailable or ambiguous 1 kg offers
show truthful states rather than silently selecting another pack.

### F07 — Clarify Sample Set and selected-product order panels

**Priority:** P0. **Depends on:** F05–F06; use current commercial data.
**Source:** F §§4, 6 and Deliverables; U §05 steps 2–3.

- [ ] Keep product name, format, quantity, currency and amount readable beside
      the primary action. State Sample Set contents as three 20 g teas and show
      verified delivery terms, or clearly identify terms awaiting confirmation.
- [ ] Place existing purchase guidance and incentive copy near the relevant
      action. Use current catalog amounts; do not replace them with USD 49 or
      recalculate a credit from document examples.
- [ ] Give each stage one primary action. Verify loading, unavailable, disabled,
      error and ready states using controlled preview data; distinguish display
      totals from shipping/duties still pending confirmation.

**Done when:** the Sample Set and each 1 kg product can be selected in preview
with the right quantity, amount display and button state. Live payment, shipping
and order completion belong to C02, not this frontend acceptance.

### F08 — Connect tasting cards to a named 1 kg destination

**Priority:** P0 continuity; richer repeat-order features are P1.
**Depends on:** F06–F07. **Source:** F §6; U §§05–06.

- [ ] Build on local tasting cards, saved favourites and exports. Add the product
      name to “View 1 kg” and connect each recorded/selected tea to its own exact
      1 kg destination.
- [ ] Make the sequence visible: try samples, compare, view the chosen 1 kg
      product, reorder. Ensure tasting-editor, comparison and saved-favourite
      choices cannot silently send the buyer to a different tea.
- [ ] Keep saving local and login-free. Preserve unsaved drafts, explicit Save
      and Clear, storage-failure handling and personal-note separation from
      product facts. No account sync or staff-sharing service is included.

**Done when:** all three teas reach the correctly named product and format after
saving, switching and returning. Reloading retains an explicitly saved choice;
storage failures leave usable in-session guidance. Viewing a tea never adds it
to the cart automatically.

### F09 — Improve reading flow, typography and action placement

**Priority:** P0. **Depends on:** affected content structure from F03–F08.
**Source:** F §§7–8 and Acceptance across devices.

- [ ] Remove cramped fixed-height description scrollers from normal page
      content, especially on phones. Keep deliberate popup scrolling,
      background scroll lock, dismissal and return behavior from Task 0102.
- [ ] Establish clear roles for names, applications, body text and labels.
      Start long-form copy around 16 px with 1.5–1.7 line height, adjusting for
      viewport/typeface. Retain mono/uppercase identity where readable.
- [ ] Keep key touch targets at least 44 px where practical, visible keyboard
      focus and selected states distinguished beyond colour. Align product
      names, currency formatting and weights across screens.
- [ ] Ensure any sticky action clears content, form fields, the on-screen
      keyboard and device safe areas.

**Done when:** mobile descriptions read as one continuous flow; no action
obscures text or fields. Check both themes and all four existing locales,
including long labels and CJK text. This is not a blanket removal of modal
scrolling or a typography redesign of saved studies.

### F10 — Make motion and loading support immediate use

**Priority:** P0. **Depends on:** representative F02–F09 screens.
**Source:** F §9; U §05 Bug audit and Performance.

- [ ] Restrict scramble effects to suitable display headings. Navigation,
      product choices and order actions stay immediately readable, including
      on touch. Record the approved scope change from earlier tap-glitch work.
- [ ] Remove interaction-blocking transitions, stuck loading, flicker and large
      selection-related scroll jumps. Keep reduced-motion content complete,
      with stable focus and distinguishable loading/disabled/selected states.
- [ ] Use correctly sized responsive imagery, WebP/AVIF where appropriate,
      intentional above-fold loading and offscreen lazy loading. Record results
      under a named mobile-data test profile; a file being under 10 MB is not
      a performance acceptance criterion.
- [ ] Keep future Taste/Region filters secondary, noninteractive and clearly
      marked. Preserve the functioning Category filter.

**Done when:** decorative/entrance transitions do not delay main actions;
actual data loading or pending transactions retain truthful disabled states.
Control text stays readable, failures recover without losing the selection,
and comparison or image loading causes no disruptive layout/scroll jump.

### F11 — Package the frontend review and regression evidence

**Priority:** P0 review gate. **Depends on:** F02–F10.
**Source:** F Acceptance across devices and Deliverables; U §08.

- [ ] Test 360, 390, 768 and 1440 px widths; retain the existing 320 px regression
      check. Cover touch, keyboard, reduced motion, both themes and four locales.
- [ ] Capture before/after desktop and mobile screens for the homepage, all
      three products' Overview and Specifications, product comparison, Sample
      Set and the tasting-to-1 kg route.
- [ ] Record pass/fail results for overflow, images/copy, CTA reachability,
      quantity/state display, selection/switch/back continuity and preserved
      cart state. Distinguish browser emulation from physical iPhone testing.
- [ ] Supply an authorized review preview, image replacement list, unresolved
      decisions and next-iteration estimate. Run focused behavior checks, then
      `pnpm validate`, and review the final diff for each implementation slice.

**Done when:** reviewers can reproduce the frontend journey and see what remains
unverified. Placeholder/fixture QA is labelled. A preview deployment requires
its normal release authorization; a preview link does not prove live checkout.

## Separately scoped work

These requirements come principally from U. They are retained here so they are
not lost, but are not part of the frontend brief's acceptance or this planning
request. Suggested effort is relative only: S is a focused follow-up, M spans
several connected components, and L involves external systems or data decisions.
Calendar estimates follow input and access confirmation.

### C01 — Reconcile commercial decisions and release inputs

**Priority:** prerequisite to commercial release. **Suggested owner:** business
owner with commerce engineer. **Effort:** M, excluding waiting for decisions.
**Source:** U §03B, §05 Important verification and Business decisions.

- [ ] Resolve D2–D6 below using current catalog/configuration and business input.
      Record approved values, supporting evidence and remaining exceptions.
- [ ] Reconcile legacy test-only URLs with actual product/variant identities
      and canonical public destinations without breaking saved selections.
- [ ] Verify subscription release status and current terms; existing test
      selling plans are not evidence of approved recurring supply.

**Done when:** a decision record names the intended offers, markets, currency,
credit, destinations and fulfilment conditions. Unknowns remain explicit; no
price, stock, merchant SKU or subscription rule changes by inference.

### C02 — Verify the full sample-to-first-order and reorder journey

**Priority:** U P0, separate commerce track. **Depends on:** C01, an approved
test environment and existing release gates. **Suggested owner:** commerce
engineer plus QA. **Effort:** L until payment/shipping access is confirmed.
**Source:** U §§02, 05 and 08.

- [ ] Test Sample Set and each exact 1 kg variant through cart, quantity,
      currency, destination, shipping charge, payment and confirmation.
      Confirm displayed Sample Set price and delivery terms match checkout.
- [ ] Test eligible and ineligible first-order credit, duplicate redemption,
      required checkout identity and actual purchaser-email delivery. Retain
      authoritative Shopify totals and the retired public-credit boundary.
- [ ] Verify return/reorder and unavailable-product paths. Test approved quote
      or subscription paths only if their terms and release scope are settled.
- [ ] Record separate results for simulation, authorized test orders and any
      separately approved production verification. Avoid exposing customer data.

**Done when:** the business-approved route from samples through first 1 kg and
repeat purchase has reproducible evidence, including failed-payment,
unsupported-destination and unavailable-offer cases. No production purchase or
external email is authorized by this backlog.

### C03 — Add funnel measurement and evaluate later tasting enhancements

**Priority:** U P1. **Depends on:** F06–F08, agreed analytics approach and
authoritative purchase outcomes for purchase events. **Suggested owner:**
frontend/commerce engineer with product owner. **Effort:** M for measurement;
S to specify optional enhancements, implementation estimate pending scope.
**Source:** U §06 and §08 Next iteration proposal.

- [ ] Define and implement `view_product`, `select_application`,
      `view_sample_set`, `begin_checkout`, `sample_purchase`, `view_1kg`,
      `first_1kg_purchase` and `repeat_purchase`.
- [ ] Document triggers and permitted fields. Deduplicate events and distinguish
      checkout entry from confirmed purchase. Define first/repeat purchases
      from authoritative order evidence rather than device-local favourites.
- [ ] Measure conversion and friction without collecting tasting-note text or
      staff identity by default. Establish any required consent before enabling
      collection; no provider or new dependency is selected by this plan.
- [ ] Assess optional account sync, staff sharing and larger-order enquiries
      after the local flow is proven. Treat consent and working business
      destinations as prerequisites, not reasons to add accounts now.

**Done when:** a verified event map supports the sample → first 1 kg → repeat
funnel without duplicate conversions or personal tasting content. Optional
features have separate scope/effort decisions.

### C04 — Define verified operations integration after discovery

**Priority:** U P2. **Depends on:** supplier data validation and an approved
integration contract. **Suggested owner:** operations lead and backend engineer.
**Effort:** M for discovery/contract; implementation unestimated until then.
**Source:** U §07.

- [ ] Confirm the date/owner/output of the “3 November” onsite inventory discovery
      mentioned in U. Treat it as a data-validation milestone, not a release date.
- [ ] Specify public projections for SKU/master data, orders, verified lots,
      saleable stock, allocation, tracking and shipping-rule states.
- [ ] Distinguish physical stock, QA-approved saleable stock, allocated supply
      and unreserved available-to-promise. Define manual approval for missing
      quality, stock or import/export checks.
- [ ] Keep GVJ/JMM as the operational authority and ATOMA as the customer
      interface. Preserve existing contracts; do not rebuild an ERP or expose
      private operational rows in the storefront.

**Done when:** the team has a reviewed data/approval contract and bounded next
tasks. No invented inventory, lead-time or universal compliance claims are
published before verification.

## Decisions and inputs to resolve

| ID  | Decision or input                      | Current evidence and next action                                                                                                                                                                                    | Blocks                                                                   |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| D1  | Delivery scope and order               | Resolved for local frontend implementation by the owner's request to complete groups 1–6 before revisiting the study. Deployment and production release are separate.                                               | No longer blocks local frontend work                                     |
| D2  | Product/merchant mapping and facts     | Display codes already match U. Confirm production product/variant IDs, public URLs, supported 1 kg offers and supplier facts; retain authored-profile status meanwhile.                                             | Production routes and verified specifications; not prototype composition |
| D3  | Sample price and display currency      | Three 20 g contents already exist. U calls USD 49 an open decision. Reconcile it with authoritative destination pricing and existing currency behavior; do not hardcode it.                                         | Commercial pricing acceptance                                            |
| D4  | First-order credit                     | Current copy states ¥4,500 with emailed-code delivery. Reconfirm amount, qualifying purchase, first-order/once-per-customer eligibility, currency treatment and delivery evidence.                                  | Incentive changes and credit acceptance                                  |
| D5  | Shipping markets and duties            | US/SG destination behavior has prior implementation. Confirm actual pilot markets, rates, dispatch wording and duty terms; code capability is not fulfilment approval.                                              | Shipping promises and commerce QA                                        |
| D6  | 1/5/10 kg, quotes and recurring supply | Verify offers, quantities, quote destination and subscription terms. Existing 5/10 kg ambitions must not be presented as new pack sizes when they are bundles of 1 kg pouches.                                      | New offer/enquiry/subscription publication                               |
| D7  | Application photography                | Owner approved labelled composition references for local review. Final bowl, latte and finished-food photos made with the corresponding teas, rights and replacement approval remain pending in the image register. | Final imagery, not labelled prototype review                             |
| D8  | Operations discovery                   | Confirm the schedule, owner and deliverables for the source's 3 November milestone and which approved public data becomes available afterward.                                                                      | C04 integration scope                                                    |

## Preservation requirements

Keep Mist/Blue hour themes, the current product identity, selected order/cart,
four locales, private grower boundaries, reader return behavior and saved studies.
Apply changed layouts or motion only to the agreed current-site surfaces.
Reuse the reviewed catalog/cart adapters and operational authority. Do not infer
approved science, certifications, stock or provenance from imagery, codes or
illustrative profiles.

This backlog changes the proposed emphasis toward application clarity and
conversion. Its specific changes to older small-type, contained-page and
tap-scramble choices need to be recorded in the bounded implementation tasks
when authorized, rather than silently changing the standing contract.

## Planning verification

Both source documents were read in full, including their tables, and all eight
rendered pages were reviewed. Requirements
were checked against current task records and source modules to distinguish
existing functionality from remaining work. Source files and raw feedback were
not copied into the public application.

- Source-coverage review checked the task breakdown against both briefs.
- All 17 local document/source links resolve; the final diff was reviewed.
- `pnpm validate` passed formatting, lint, strict types, 218 unit tests and the
  production build. The final documentation update also passed formatting and
  whitespace checks.
- Only this planning file was added. No storefront implementation, deployment
  or external-system change was performed.
