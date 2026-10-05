# Concept 02 imagery and packaging studies

Date: 2026-09-29
Method: built-in imagegen tool, product-mockup mode.
Asset: `public/images/concept-02/matcha-vessel.png` (1254 × 1254, alpha PNG).

## Current use

Task 0020 superseded the generated packaging image. It is retained only as
historical asset provenance and is no longer loaded by the current experience,
including during loading or WebGL failure.

The main experience now uses `bag-scene.tsx`, following the owner's latest
request for a labeled bag. Code-defined front/back panels, gusset, side seals
and zipper tracks form a pearl-silver laminate pouch. Its canvas label follows
the supplied Tot Herba reference's typography and ruled information structure,
using matcha identity, application, authored sample material information, format
and a subordinate personal reference. No reference image or cosmetic copy is
embedded in the public app. This scene adds no dependency or generated bitmap.

The backup at `/concept-02/canister` keeps `vessel-scene.tsx`: a metal
matcha canister, deep fitted overcap, raised neck and sealing lip, contained
powder, and a discrete printed technical label. Its type hierarchy emphasizes
matcha powder and the selected product; ruled fields separate application,
format and the subordinate personal reference. These are packaging and label
studies rather than manufacturing or fulfillment claims.

Both loading and failure states use the corresponding supplied powder photograph.
If the vessel cannot render, a static material/format/reference sheet accompanies
that photograph. The retired candle-like image never flashes behind the scene.

The current experience starts with the owner's supplied native photographs:

- `public/images/matcha/culinary.jpg`
- `public/images/matcha/latte.jpg`
- `public/images/matcha/tea-service.jpg`

`powder-morph.ts` samples the green pigment from these intact photographs into
a recognizable material silhouette. A selection change disperses it into a
cloud and forms the next photograph. Quantity gathers the powder into the
vessel. The contained powder uses a runtime UV crop of the selected photograph;
no new raster powder asset is generated. The powder-stage WebGL fallback uses
the corresponding supplied photograph, not the generated vessel image.

The photographs establish a visual reference only. They do not substantiate
origin, producer, lot, processing, certification or measured sensory claims.
The seven material properties and their explanations are separately authored,
visibly identified sample editorial content for this concept.

## Superseded explorations

An earlier generated foil-pouch exploration was rejected and is not used or
retained in the public app. The new code-modeled bag is a separate, explicitly
requested study. The later image-sliced tin and decorative powder-backdrop
approaches were also superseded. The current opening uses physical geometry;
there is no sliced PNG lid or background powder circle.

## Historical generation prompt

The wording below is preserved as generation provenance. Its aesthetic targets
are not a claim of client approval or achieved manufacturing quality.

Use case: product-mockup. Asset type: luxury ATOMA matcha packaging concept as a
photorealistic isolated object for a premium architectural web configurator.
Primary request: one exquisitely minimal cylindrical solid aluminum vessel for
matcha. The feeling is precision-engineered luxury industrial design, detached,
serene and tactile, like an expensive machined research instrument or a John
Pawson object. Absolutely NOT a foil pouch, not a food can or tin with crimped
rim. Thick-walled machined solid aluminum construction, softly matte bead-blasted
platinum silver, immaculate rounded edges, beautifully resolved narrow black
circumferential seam where the heavy flat lid meets the body, subtly recessed
flat lid top. Large clean unprinted front face. Short cylinder, height about 1.4
times diameter. Shown floating, upright, three-quarter angle from slightly above
so a perfect elliptical lid top is visible. Subtle perspective, not wide angle.
Powerful soft large cool studio light, exquisitely fine surface texture and
graduated reflections. No label, no logo, no writing anywhere; editable live
typography will be placed in code. Genuine transparent background alpha; no
floor, no prop, no backdrop, no shadow baked outside object, no fake checkerboard.
Entire object within canvas with 15% transparent margins, occupying about 75
percent of square canvas height. Single object. Clinical, neutral, refined,
costly, beautifully machined. No grooves except one lid seam, no knurling, no
screws, no extra handles, no ornaments, no glow. 1536x1536 if possible. This is
illustrative packaging study, no claims about actual merchandise.
