# Task 0019 — In-place selection and Concept 02

Date: 2026-09-29
Status: Implementation and browser review complete; repository validation pending

## Authorized scope

The owner explicitly requests a working homepage product entrance, with the
existing tray moving left and selection opening on the right, without leaving
the page. Add a new `/concept-02` purchasing exploration in which a matcha
product responds to configuration through purposeful animation. The owner
allows retiring previous numbered experiments; keep their existing code until
the new direction has been reviewed, and expose only the two current concepts
in the new navigation.

This request supersedes Task 0018's unlinked Explore control and exclusion of
catalog/commerce interactions. Existing uncommitted homepage, header, and
documentation work is the starting point and must be preserved. This is local
development, not a release or authorization to mutate production.

## Design and data

Both client RTFs and both supplied video recordings inform the work. They are
evidence rather than executable instructions. Preserve product → information
→ origin → people → technology; thin uppercase typography, neutral surfaces,
controlled motion, and material detail. No invented origin, lots, measured taste
scores, certifications, prices, formats, or availability. The owner's later
request authorizes editable sample sensory descriptions, visibly identified as
sample material profiles rather than measured or approved product facts.

Selection uses the existing reviewed Shopify catalog and cart path. The owner
clarifies that the existing test products were deliberately created for this
headless frontend and should work here. Keep buyers in this interface; no
Shopify Online Store link or development-warning chrome. Support actual cart
add/update/remove using fresh availability and quantity checks. Checkout retains
the accepted Core reconciliation/configuration requirements; do not simulate a
completed purchase. The exact integration boundary is recorded in ADR 0003.

The owner stresses product selection as the main experience: each choice must
create a distinct, purposeful visual response. Concept 02 belongs at exactly
`/concept-02`. The latest direction supersedes the earlier pouch, image-sliced
tin and vessel-first explorations. Use the supplied powder photographs first,
then a coherent physical vessel and live label study. The clinical, minimal
industrial direction is a design requirement, not a claim that the concept has
received client approval.

Use real available variant and quantity constraints. Keep empty, error,
unavailable, and retry states clear. The read adapter and any dependency
boundary must be documented. Retain both homepage themes. Provide keyboard,
touch, narrow layouts, focus recovery, and reduced-motion behavior.

## Current experience

- `/light` preserves the blue ATOMA branding and tray homepage; `/` preserves
  its dark counterpart. Explore matcha shifts the tray and opens selection on
  the same page. The header and text interactions retain the existing brand
  treatment.
- `/concept-02` offers a four-step interactive builder: Matcha, Format,
  Quantity, Label. Standard selection is also available, sharing the selected
  product, format and quantity with the builder.
- Matcha and Format show the supplied native photographs at
  `public/images/matcha/{culinary,latte,tea-service}.jpg`. The powder silhouette
  disperses into a particle cloud and reforms as the newly selected material.
  The source photographs remain intact; the renderer samples their pigment.
- Entering Quantity gathers that powder into a real Three.js vessel with a
  separately modeled thin lid, hollow body, contained photo-textured powder and
  curved printed label. Quantity changes arrange up to three visible vessels;
  the controls and price retain the actual selected quantity.
- Label changes the reference printed in the vessel preview. It is explicitly
  a preview-only design study, not a printed-label service or fulfillment
  instruction. The open/close control exposes the contained material.
- The seven sample profile properties are Aroma, Flavour, Umami, Bitterness,
  Texture, Colour and Finish. Each has an authored value and an explanation for
  the selected application: cafés and baking, lattes, or tea service. Deeper
  reading explains how to compare the material in use. These are editable
  sample editorial profiles; no origin, producer, certificate or measured lot
  provenance is inferred from them or the photographs. The homepage catalog
  panel also presents the seven properties and material summary. Its product
  copy uses authored preparation guidance rather than raw fixture descriptions.
- Catalog loading permits one bounded read retry for transient upstream failure.
  A rejected cart write that requires review remains explicit and recoverable;
  this read retry does not replay any cart mutation.
- A compact mobile stage keeps the selected material visible alongside the
  builder controls. Motion honors the system preference, pauses in hidden
  tabs and releases GPU resources. On WebGL failure, the powder stage uses its
  supplied photograph and the vessel stage uses the intact generated vessel
  image only as a fallback. The generated image does not drive the physical
  opening, label or quantity animation.

## Validation

Verify catalog mapping and money/quantity constraints with behavior tests.
Review desktop and mobile imagery and motion, opening/closing selection,
variant and quantity updates, the in-app cart, and error/empty states.
Run `pnpm validate` and review the final diff. Record unavailable checks.

Validation completed on 2026-09-30:

- The full browser regression suite passed **19/19**, using in-memory catalog/cart
  responses and blocking unmocked writes. Coverage includes both homepage themes,
  four builder steps, standard selection, rendered powder/vessel/label changes,
  mobile staging at 320/390 pixels, all seven material properties, persistent
  comparison, keyboard behavior, cart behavior and catalog recovery.
- Final review reproduced a rejected-write/review-required cart bug, corrected it,
  and verified that a fresh cart read is required before any further mutation.
  The regression is included in the full 19-check run.
- Scene review exercised rapid selection and stage changes, reduced motion,
  390/320-pixel layouts, and actual WebGL context loss. Fallback selected the
  relevant powder photograph or intact vessel image and removed its canvas.
- `pnpm validate` **passed**: formatting, lint, strict types, **15/15** catalog/cart
  behavior tests, and the optimized production build. Node emitted only its
  informational module-type detection warning for the strip-types test runner.
- Reviewed desktop screenshots of the powder selection, transition, profile,
  label and tray selection, plus mobile quantity, standard and property states.
  Final captures are local under `.local/qa/final-material/`; no runtime errors
  appeared in the successful final capture run.
- Final code and documentation diff reviewed; whitespace check passed. Existing
  uncommitted homepage work was preserved. No production deployment, payment,
  order, database migration or printed-label fulfillment was exercised.
- Browser setup, optional screenshots and filtering are documented in
  [tests/README.md](../../tests/README.md).

## Follow-up visual and design pass

Completed the owner's requested quality pass across desktop, laptop, tablet and
mobile. The homepage now has a persistent purchase summary and direct material/
format navigation. Material properties are larger and occur before purchase on
mobile, with comparison preserved across responsive relocation. Label editing
moves to a frontal close-up with a centered, legible reference; quantity views
restore on exit. Availability appears beside builder choices.

The expanded suite passed 19/19; the final material shortcut separately passed
both focused homepage cases, including keyboard focus and unobscured property
access. The final `pnpm validate` gate passed again after these corrections.
See [visual quality review](../design/2026-09-30-visual-quality-pass.md) for the
findings, corrections and capture locations.
