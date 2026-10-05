# Task 0020 — Purchase clarity and material information

Date: 2026-09-30
Status: Implemented and locally verified

The owner finds the accumulated information overwhelming and scrolling to reach
purchase unintuitive. Keep the material depth, but remove its constant presence
under the product image. Make selecting and buying immediately understandable.
The owner also rejects the current vessel and label as candle-like.

Latest direction: try a labeled bag as the primary Concept 02 package, keeping
the canister design accessible as a backup. The supplied Tot Herba label image
is visual reference: cold offwhite paper, monospaced hierarchy, fine ruled rows,
two-column material information, format and a descriptive paragraph. Translate
that structure into matcha content; the cosmetic wording is not product copy.
Use a separate bag renderer and retain the canister at `/concept-02/canister`.
These are presentation studies, not new purchasable packaging variants.

Implement a concise standard selection: three use-led options, one selected
material description, real format/quantity controls, price and Add to cart.
Single available format is a fact, not a redundant decision. Put full material
properties and preparation guidance in an optional, accessible information view.
Remove the automatic lower editorial section and persistent property sheet from
Concept 02. Preserve their content in the optional view.

The interactive builder remains available with material→powder→next material
motion. Reduce its essential flow to choosing matcha then quantity; format is
chosen alongside quantity when alternatives exist. Label customization is an
optional extension, not a prerequisite to adding an item. Preserve shared
selection between modes and make direct standard selection the lower-barrier
entry. Keep the tray, typography and existing theme identity.

Revise the actual modeled tin and printed grid together to communicate food
material rather than a decorative candle: metal packaging proportions, flush
lid, smaller technical front label, explicit matcha powder identity and structured
product/application/format/reference fields. No invented origin, batch or claims.

Validate initial purchase visibility, absence of forced information scrolling,
optional information focus/close behavior, simplified builder progression,
mode persistence, real quantity/availability rules and mocked cart recovery.
Review mobile and desktop composition and motion, then run pnpm validate and
review the final diff. No production mutation or deployment is authorized.

## Implemented flow and review

- Standard selection is the direct entrance. It shows use-led choices, one
  concise selected description, format/quantity and total/Add together. A sole
  format is not presented as another required decision.
- Full material information moves to an optional Material & use drawer. It
  preserves all seven properties and meanings plus expandable preparation and
  comparison guidance. It contains keyboard focus, locks background scrolling
  and returns focus without changing the selection.
- The builder keeps the powder transition but uses Matcha → Quantity; label
  reference editing is optional. Quantity can be added immediately. The image
  has only a short caption, without an always-open property table or a long
  editorial section below the workspace.
- Mobile open-state staging is compact enough to keep direct buying controls
  visible. The former nested panel's excess bottom spacing has been removed.
- The owner rejected the intermediate shallow lid. The final direction uses a
  deep hollow friction overcap and raised neck/sealing detail. Cold paper,
  explicit matcha identity, contrasting type scales and compact ruled fields
  replace the broad decorative candle-style label. No invented lots or origin.
- The rejected generated packaging image no longer appears during loading or
  failure. Actual powder photography provides the fallback, with a static
  format/reference sheet when the vessel cannot render.

The latest packaging implementation introduces a separate BagScene with a
modeled gusset pouch, zipper opening and the requested ruled label. Matcha has
the largest type; use, sample profile, material notes, format and personal
reference form separate rows. The existing canister remains available through
the quiet study link and `/concept-02/canister`. Selection and cart contracts
are shared; no package variant is invented.

Browser validation passed **22/22**, including normal-flow Add visibility at
1440/320/390, optional information and focus, the two-step builder, optional label,
mode/variant/quantity preservation, product comparison, bag choreography,
canister backup and cart recovery. All
commerce writes were mocked. An independent visual review of /, /light and
/concept-02 at1440×900,1280×720 and390×844 found no purchase-clarity blocker,
hidden Add action, horizontal overflow or browser error.

The final bag design pass corrected an initially too-round opening to a
pinched pouch mouth and enlarged the technical label text by approximately
20%, strengthened its rules and reduced the dominant heading. The extra
slogan was removed. Independent review confirmed those two visual issues
resolved; short and long references fit on mobile. Desktop, 390px and 320px
scene checks covered normal/reduced motion, opening, rapid selection changes,
quantity restoration and graceful WebGL failure without errors or overflow.
Review captures are kept locally under `.local/qa/bag-polished/`; the preserved
canister has its own final captures under `.local/qa/deep-cap-final/`.

The full browser suite passed 22/22. After the final geometry/type polish,
the nine affected Concept 02/backup browser checks passed again. The final
`pnpm validate` passed formatting, ESLint, strict types, all 15 unit tests and
the production build, including the canister backup route. `git diff --check`
passed and the final changed files were reviewed. No production write or
deployment was performed. Checkout remains outside this presentation task.
