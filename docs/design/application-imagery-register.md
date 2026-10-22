# Application imagery register

Prepared 20 October 2026 for the client-feedback application imagery work.

Task 0257 adds an opt-in [matching photograph collection](matching-application-photographs.md)
for the canonical homepage application cards and product popups. The historical
assets below remain available to saved studies. The new collection follows the
owner-approved hero and replaces the cake with wagashi; its generated provenance
is recorded internally without customer-facing production notes.

## Status and factual boundary

These two assets are **AI-generated composition references for the local prototype**. They are not photographs of ATOMA products, approved production photography, recipe documentation, or evidence of the colour, texture, quality or performance of a particular matcha. Their use must retain the reference status in the review context; replace them with approved product photography before representing actual product results.

The existing `public/images/samples/prepared-matcha.webp` bowl reference is retained
unchanged. Task 0224 integrates these references into the local product experience.

### Supplied bowl reference

The 1600 × 1067 WebP comes from the supplied `_DSC5062` photograph, represented
in JMM as `apps/storefront/public/images/atoma/client/ceremony-matcha.jpg`
(2160 × 1440). Its source is documented in JMM's
`docs/context/client/2026-09-19/SAMPLES_HERO_MEDIA.md` and ATOMA Task 0162.
It shows prepared matcha, but the association with the current Ceremonial tea,
creator and commercial-use approval have not been confirmed. Retain it as a
preparation reference; do not treat it as verified product-result photography.

### Replacement inputs

| Intended application          | Current review image             | Required replacement evidence                                                                                               |
| ----------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Ceremonial / tea service      | Supplied bowl reference          | Approved bowl photograph made with the corresponding tea; creator, permission and product association recorded              |
| Barista / lattes              | Generated iced-latte composition | Approved hot or iced latte photograph made with the corresponding tea; creator, permission and product association recorded |
| Culinary / recipes and baking | Generated cake composition       | Approved finished recipe photograph made with the corresponding tea; creator, permission and product association recorded   |

The product/content owner supplies or approves these inputs. No deadline or
production-photo approval is implied by local prototype acceptance.

## Deliverables

| Reference         | Workspace asset                                                  | Dimensions        |   Bytes |
| ----------------- | ---------------------------------------------------------------- | ----------------- | ------: |
| Iced matcha latte | `public/images/applications/iced-matcha-latte-reference-v1.webp` | 1536 × 1024 (3:2) |  68,114 |
| Matcha tea cake   | `public/images/applications/matcha-tea-cake-reference-v1.webp`   | 1536 × 1024 (3:2) | 161,528 |

Both images were generated with the built-in `image_gen` tool, with `transparent_background: false`. No CLI, external image API, reference image, or existing-image edit was used. The generated PNG outputs remain at their original paths below.

WebP delivery files were encoded with the repository's existing Sharp 0.35.4, using quality 86 and effort 6, at the original 1536 × 1024 dimensions. Encoding only: no crop, rescaling, retouching, compositing, colour transform or content editing.

### Original outputs

- Latte: `exec-e925224c-1551-41dd-9e3d-1f4ff423be84.png` — 1,922,100 bytes.
- Cake: `exec-b4c63b02-8a09-4338-9d2d-5798edd1dc40.png` — 2,285,178 bytes.

### Delivery SHA-256

- Latte: `321e197b1a03229df1274a91605d31255d57497813ba258f72f697aa98bdc104`
- Cake: `d71fb907a7c6ae99f76b7fcb217670e09b088c4a4fdb918db4e833ae5457fc0e`

## Visual inspection

Reviewed both generated outputs and the final WebP files. The latte has readable green matcha / pale milk layering, visible ice, a complete unbranded cylindrical glass, and a quiet neutral surface. The cake has a clear cut face, green crumb, baked crust and a simple ivory plate. Both have consistent soft directional light, complete subject framing, restrained backgrounds, no text or logos, and no hands or decorative props. The WebP versions preserve the composition and visible detail.

## Final prompts

### Iced matcha latte

```text
Use case: product-mockup
Asset type: application composition reference for a premium Japanese matcha website prototype; this is an illustrative reference, not documentation or proof of any actual branded product.
Primary request: Create one high-quality photographic image of a clear iced matcha latte in a plain straight-sided cylindrical glass. The drink must be immediately recognisable: a soft natural green matcha layer over pale milk, a little gentle marbling between the layers, and a few physically plausible clear ice cubes near the top.
Scene/backdrop: Quiet matte cool ivory tabletop and softly receding pale neutral backdrop with a subtle real horizon, no decoration.
Style/medium: Restrained editorial product photograph, clinical material clarity, photoreal glass, realistic translucency and condensation rather than CGI.
Composition/framing: Landscape 3:2 composition, one glass centered with comfortable breathing room, eye level slightly above the rim so ice and drink layers are readable, glass occupies roughly two thirds of image height, clean crop with complete glass and its contact shadow visible.
Lighting/mood: Soft directional daylight from upper left, gentle precise shadow falling right, calm low-contrast studio atmosphere.
Color palette: Cool neutral ivory and restrained natural matcha green; clean milk white. No neon green.
Constraints: One glass only. No hands, people, utensils, straws, garnish, loose powder, packaging, logos, writing, letters, numbers, watermarks or decorative props. Opaque full image background. Do not include a collage or split view.
```

### Matcha tea cake

```text
Use case: product-mockup
Asset type: application composition reference for a premium Japanese matcha website prototype; this is an illustrative reference, not documentation or proof of any actual branded product.
Primary request: Create one high-quality photographic image of a neat finished slice of matcha tea cake from a simple baked loaf on a quiet ivory ceramic plate. The recognisable cake should have a natural muted green, fine moist crumb and a thin gently browned baked edge. It must look appetising and precisely made, with no frosting, filling, glaze or garnish.
Scene/backdrop: Quiet matte cool ivory tabletop and softly receding pale neutral backdrop with a subtle real horizon, no decoration.
Style/medium: Restrained editorial food product photograph, clinical material clarity, realistic baked crumb texture and ceramic surface rather than CGI.
Composition/framing: Landscape 3:2 composition, a single generous cake slice centered on a simple small low-rim round ivory plate, three-quarter tabletop camera angle so the green cut face is dominant and instantly legible, plate occupies roughly two thirds of image width, full plate and contact shadow visible with comfortable breathing room.
Lighting/mood: Soft directional daylight from upper left, gentle precise shadow falling right, calm low-contrast studio atmosphere.
Color palette: Cool neutral ivory and restrained natural matcha green; subtle warm baked crust. No neon green.
Constraints: One cake slice and one plate only. No whole loaf, hands, people, utensils, loose powder, toppings, flowers, packaging, logos, writing, letters, numbers, watermarks or decorative props. Opaque full image background. Do not include a collage or split view.
```

## Owner review direction

The owner confirmed on 2026-10-20: use labelled composition references for the
local review. This does not approve them as photographs of the actual teas.

## Task 0229 revision — Unified range composition

Prepared 21 October 2026 after the owner requested a whole-page hero comparison
with a cohesive photographic material, rather than retaining the existing
homepage geometry or presenting three image cards.

### Asset and provenance

- Workspace asset: `public/images/applications/matcha-range-composition-reference-v1.webp`.
- Dimensions: 1536 × 1024 (3:2); 109,792 bytes.
- SHA-256: `365c8f264ca02fab68806fbb25d97f0e91f51466e679e69e6d8e93274c9e70cd`.
- Built-in `image_gen` generation followed by one built-in framing edit; both
  calls used `transparent_background: false`. No CLI or external image API.
- Initial generated source:
  `exec-e4402b3d-4a9a-4cea-aa05-8dfd63dc846a.png`.
- Selected final generated source:
  `exec-348ee55b-9a68-4eb8-9280-f989dd3ad87c.png`
  — 1536 × 1024, 2,115,752 bytes.
- The first call generated a new image without image inputs. The framing edit
  used only that generated source as its edit target. The existing individual
  references were inspected for art direction and were not tool image inputs.
- Encoded with the repository's existing Sharp 0.35.4 at WebP quality 86 and
  effort 6, preserving the generated dimensions. Encoding only: no crop,
  rescaling, retouching, compositing or colour transform after generation.

The entire composition, including its bowl, is **AI-generated**. Do not reuse
the separate triptych's “Bowl photo” label for this image. Suggested visible
caption: “AI composition reference · Product photography pending”. Suggested
alt text: “AI-generated reference showing a bowl of matcha, an iced matcha
latte and a slice of matcha cake together on a neutral surface.”

This is an illustrative application composition for local review. It does not
show verified ATOMA products, prove the appearance or performance of any tea,
or establish an approved recipe. Replace it with approved product photography
before presenting it as actual product results.

### Inspection and crop guidance

Inspected the generated result and final WebP. The bowl, latte and plated cake
share a continuous neutral counter, consistent lighting and contact shadows.
All subjects remain complete, with no text, logos, hands or additional props.
The framing edit added generous outer margin while retaining a compact central
group, making the three applications legible within a centered square crop.

A near-native 3:2 mobile frame retains the full image. At desktop widths, a
centered crop no wider than approximately 3:1 retains the complete subjects;
a 1200 × 360 cover frame trims the upper edge of the glass, so use at least
about 400 px height at 1200 px width or contain the full image. These are source
composition observations; verify the rendered page at its actual dimensions.

### Initial generation prompt

```text
Use case: product-mockup
Asset type: one cohesive photographic range composition for a whole-page Japanese matcha website design study. This is an AI-generated illustrative reference, not a photograph or proof of any actual branded products.
Primary request: Create a single high-quality editorial product photograph showing three matcha applications together in one calm, continuous real space: a simple shallow ivory ceramic bowl of freshly whisked matcha with fine foam, one plain straight-sided clear glass of iced matcha latte with a natural green matcha layer, pale milk and visible plausible ice, and one neat finished slice of green matcha loaf cake with a gently browned edge on a low-rim ivory ceramic plate.
Scene/backdrop: All objects sit together on the same matte cool pale ivory studio counter, with one softly receding neutral background and a subtle natural horizon. One unified surface and coherent contact shadows.
Style/medium: Restrained premium editorial food photograph with clinical material clarity, believable proportions, realistic glass refraction, delicate condensation, ceramic texture and appetising cake crumb. Real photography feeling rather than a CGI render.
Composition/framing: Landscape 3:2. Arrange the three complete objects as one compact centered, slightly staggered still-life group, with the taller latte a little behind the lower bowl and cake. Keep each application clearly distinct and readable without blocking another. The combined group occupies approximately the central 60 percent of image width and central 60 percent of height, with generous quiet margin on every side for responsive cropping. Slightly elevated three-quarter camera angle shows the foam in the bowl, the latte layers and the cake cut face. No foreground object cut off.
Lighting/mood: Soft directional daylight from upper left, gentle precise shadows cast consistently rightward, calm low-contrast studio atmosphere.
Color palette: Cool neutral ivory, soft gray and restrained natural matcha greens, pale milk white and subtle warm cake crust. No neon green, heavy warm cast or overly saturated styling.
Constraints: Exactly one bowl of matcha, one latte glass, and one cake slice on one plate. No people, hands, utensils, straws, garnish, loose powder, cloth, flowers, packaging, logos, writing, letters, numbers or watermarks. No panels, collage, divided backgrounds, frames or cards. Opaque full-image background. Do not reproduce a branded product or add any claim text.
```

### Final framing edit prompt

```text
Use case: precise-object-edit
Asset type: responsive website hero composition reference.
Input image: the supplied generated still-life image is the edit target.
Primary request: Change only the framing to a more spacious pulled-back camera view. Keep the same cohesive arrangement, subjects, realistic material detail, lighting direction, restrained colors and one continuous neutral counter.
Composition/framing: Preserve the landscape 3:2 format, but make the combined group of bowl, latte glass and plated cake approximately 25 percent smaller within the frame. Center the entire group horizontally and vertically. All three complete objects and their contact shadows must fit within the central 60 percent of image width and central 65 percent of image height, with substantial clear counter/background margin on all four sides. This image needs a central square crop on a phone that still includes the whole bowl, glass and plate.
Constraints: Keep exactly one matcha bowl, one iced layered latte glass and one cake slice on its plate. Preserve the subjects' shapes and relative arrangement. Expand only the same quiet ivory neutral surface and backdrop around them. Do not add anything. No text, labels, logos, watermarks, panels, frames, people, hands, utensils, cloth or decorative props. This remains an AI composition reference, not an actual branded product photograph.
```

## Task 0231 — Finished applications as the hero

Prepared 21 October 2026 after the owner clarified that packaging does not
explain what ATOMA does. These new references place the finished bowl, latte
and cake at a much larger scale in one photographic scene. They are designed
for the study's Mist and Blue hour palettes.

### Deliverables and provenance

| Version   | Workspace asset                                                    | Dimensions        |   Bytes |
| --------- | ------------------------------------------------------------------ | ----------------- | ------: |
| Mist      | `public/images/applications/matcha-hero-applications-v2.webp`      | 1536 × 1024 (3:2) | 128,776 |
| Blue hour | `public/images/applications/matcha-hero-applications-v2-dark.webp` | 1536 × 1024 (3:2) | 145,098 |

- Tool: built-in `image_gen` for one new generation and one lighting edit;
  `transparent_background: false` for both. No CLI or external image API.
- Mist original:
  `exec-fafcb423-870d-4e03-8b9d-e508edf42f4a.png`
  — 1536 × 1024, 2,182,688 bytes.
- Blue hour original:
  `exec-a69e87fa-22de-4d10-836c-a532432f156a.png`
  — 1536 × 1024, 2,244,872 bytes.
- The Mist call used no image inputs. The Blue hour call used only the Mist
  generated PNG as its edit target, changing the environment palette and lighting.
- WebP encoding: existing Sharp 0.35.4, quality 86, effort 6, unchanged dimensions.
  No crop, resize, retouching, compositing or colour transform after generation.
- Mist SHA-256:
  `04aec9c338e9aefa1bee7d2d4d7a2c19771978ad10759f8fda2bc5c39d234ed4`.
- Blue hour SHA-256:
  `034f655a1c3a1eb319cf3e2f9c29fdd93be4d08ea2382e324ed5f577f79c1e4a`.

Both images are **entirely AI-generated composition references**. The bowl,
latte and cake are not verified results made with ATOMA teas, approved final
product photography, recipe documentation or proof of any product's colour,
texture or performance. Retain the visible caption “AI composition reference ·
Product photography pending”. Do not label the bowl in these compositions as
the separately supplied real photograph. Replace these references with approved
photography before representing actual product results.

### Visual inspection and responsive use

Inspected both generated images and their final WebP files. Each contains exactly
one prepared matcha bowl, one iced layered latte and one cake slice on a plate,
fully visible on a continuous studio surface. There are no packages, people,
extra props, logos or text. The Blue hour edit retains the subjects' arrangement
and natural green/ivory colours while darkening the environment.

The objects are deliberately much larger than the Task 0229 composition.
The latte begins approximately one quarter down the frame; the upper left and
upper right remain quieter, with the bowl and cake beginning about 42–48 percent
down. These are the usable areas for separate HTML copy. The entire upper
35–40 percent is not empty, despite that request in the initial prompt.
Check headline and CTA placement against the actual rendered image.

Retain the full image width in the mobile photo band. The plate sits close to
the right edge, so avoid horizontal cropping or a centered portrait crop, which
would omit an application. This asset does not share the prior composition's
central-square crop allowance. The implemented 1.85:1 phone band trims vertical
negative space with a 63% vertical focal position; the final 390 px and 320 px
browser captures retain all three complete subjects. A separate mobile image
is unnecessary for this verified landscape composition.

### Mist generation prompt

```text
Use case: product-mockup
Asset type: visually strong, application-led website hero photographic composition, landscape 3:2. This is an AI-generated composition reference for a Japanese matcha design study, not photography or proof of actual branded products.
Primary request: Create ONE cohesive high-quality editorial studio photograph of exactly three finished matcha applications: a prepared matcha bowl on the left, a clear iced layered matcha latte in the center slightly behind, and a neat slice of green matcha loaf cake on a simple low-rim ceramic plate on the right. They must be immediately recognizable, substantial and visually compelling, with crisp material detail and a coherent scale.
Scene/backdrop: One continuous cool neutral studio floor/counter and seamless pale mist-gray backdrop with a very slight gray-green cast. A quiet satin brushed-silver surface is appropriate, with restrained reflections and no visible plinth edges dividing the scene. Clinical precision and controlled materials, not cozy café lifestyle.
Composition/framing: Wide landscape 3:2 poster scene. Reserve the entire upper 35–40 percent of the image as quiet uncluttered negative area for a separate HTML headline on the upper left and sample action on the upper right. Do NOT draw any text. Arrange the objects across the lower 55 percent: bowl centered near x=23 percent, latte near x=51 percent, cake and plate near x=78 percent. The tall glass reaches just below the quiet upper zone; bowl and cake are lower and broadly fill their respective areas. The three applications should collectively span about 84 percent of the image width, with approximately 8 percent safe margin at each outside edge. Keep the entire bowl, glass and plate visible, their bases above the bottom 12 percent of the image, with some clear foreground below. These are large hero subjects, not tiny objects in distant empty space. Do not overlap or obscure any application.
Subjects/materials: A low simple cool-ivory chawan with vivid but natural green whisked matcha and fine foam visible from a slightly elevated angle. A plain cylindrical glass with pale milk below a natural green matcha layer, gentle marbling, plausible clear ice and precise glass highlights. A single appetising slice of naturally green matcha cake with a clean readable cut face, fine baked crumb and thin browned crust, on a simple cool-ivory plate. Physically believable proportions and contact shadows.
Lighting/mood: Bold yet soft controlled directional light from upper left. Sculptural illumination, clean highlights, gentle dimensional shadows consistently falling right, photographic depth and subtle surface reflections. Preserve clear food color and detail without harsh black clipping.
Color palette: Cool mist gray-green neutrals, silver-gray, cool ivory, milk white and natural matcha greens. Avoid beige/yellow warmth, neon green and artificial saturation.
Constraints: Exactly the three requested applications and the cake's plate. No packaging, pouches, tins, people, hands, utensils, straws, garnish, loose powder, cloth, flowers, kitchen equipment, labels, logos, writing, numbers or watermarks. No cards, panels, collage, split backgrounds, borders, advertising graphics or claim text. One continuous photographic scene with an opaque background.
```

### Blue hour lighting edit prompt

```text
Use case: lighting-weather
Asset type: Blue hour variant of a photographic website hero composition reference.
Input image: the supplied generated matcha applications scene is the edit target.
Primary request: Change only the environment palette and studio lighting to a sophisticated cool deep blue-charcoal Blue hour atmosphere. Preserve the exact image dimensions, camera perspective, crop, object sizes, object positions, shapes and arrangement: bowl left, iced layered latte centered, cake slice and plate right, all three complete and immediately readable.
Scene/backdrop: Replace the pale mist backdrop with a smooth deep neutral blue-charcoal studio backdrop. Darken the shared satin silver-gray counter into a restrained blue-charcoal metallic surface with subtle reflections. Keep it one continuous scene, with no panels or visible plinth edges. The upper quiet space should be dark and clean for pale HTML text placed later.
Lighting/mood: Preserve the directional upper-left soft studio illumination but shape the objects with a brighter controlled key and quiet cool rim light. Keep the bowl foam, milk/matcha layers, clear ice, green cake crumb and ceramic edges plainly visible against the dark surroundings. Deep atmospheric shadows with recoverable detail; no black silhouettes or clipped specular highlights.
Color palette invariants: The matcha remains natural green, the milk remains pale neutral white, and the bowl and plate remain ivory ceramic. Do not tint the food blue, turn matcha neon, muddy the greens or bleach the food. Keep physically believable material detail, reflections and contact shadows.
Constraints: No movement, resizing or new crop. Do not add or remove objects. Keep exactly one bowl, one latte glass and one cake slice on its plate. No packaging, people, hands, utensils, decorations, text, logos or watermarks. This remains an AI-generated composition reference and is not actual branded product photography. Opaque full-image background.
```
