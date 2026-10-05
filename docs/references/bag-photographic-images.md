# Photographic bag assets — Task 0021

Generated 2026-09-30 with the built-in `image_gen` tool, following the owner's
rejection of the procedural bag render. These images are generated packaging
studies, not photographs of an approved manufactured ATOMA package.

Assets:

- `public/images/concept-02/bag-photographic-closed.webp`
- `public/images/concept-02/bag-photographic-open.webp`

Both are 1024 × 1536 RGBA cutouts. Background alpha was verified as zero.
The generated PNGs were encoded as lossless WebP for delivery (approximately
1.2 MB closed and 1.1 MB open, down from 4.1 MB combined PNGs), preserving
their visual content and transparency. Source copies remain in the tool's
generated-images folder and locally under `.local/qa/photo-assets/`.
The paper is deliberately blank; the application composites its existing
catalog-dependent ruled label as transparent ink so the photographed paper
texture and lighting remain visible. No product facts are baked into the asset.
The open version is a matched edit of the closed version, preserving the
body and paper placement for an in-place crossfade.

Closed paper bounds, clockwise from top left: (225,436), (800,435),
(798,1232), (225,1233). Open bounds: (225,433), (800,432), (798,1233),
(225,1233).

## Closed-image prompt

Use case: product-mockup. Asset type: isolated ecommerce product photography cutout for an ATOMA matcha pouch, to be composited into a live configurator. Create a genuinely photorealistic photograph of ONE real filled silver aluminium-laminate resealable stand-up food pouch. Portrait 1024x1536 image, genuine transparent alpha background, no ground or background, no contact shadow outside the pouch. Entire bag visible, centered, upright perfectly front-on camera with a long 100mm product lens, vertical edges, no perspective tilt. Pouch approximately 22cm wide by 32cm tall, physical gusset base, slightly filled with fine powder, broad fairly flat front panel, narrow welded side seams and neatly sealed flat zipper at top. Keep the bag inside x=150..874 and y=100..1436 with empty alpha margins. On the central face is ONE large blank rectangular cold off-white uncoated paper label, straight-on and almost perfectly flat, corners near x=225,y=440 to x=799,y=1150. The label must have NO printed text, no symbols, no lines, no logo; live ink will be added separately. It should show extremely subtle paper grain and the photographed natural shading and edges of real adhered paper. Style: high-end commercial still-life product photograph, tactile, realistic photographic microdetail, authentic irregular small handling creases along the sides and base, genuine fine laminate grain, crisp heat seals and tear notches. Satin aluminium silver with controlled broad softbox reflections and dark flag reflections, subtle material variation, moderate contrast, neutral light. NOT mirror chrome, NOT embossed metal, NOT glossy plastic, NOT 3D render. Avoid artificial symmetric X-shaped folds, smooth inflated balloon shape, blobby highlights, warped label, excessive wrinkles, toy-like styling, geometric shading. No text anywhere. No props, no hands, no canister, no environment, no border, no checkerboard baked into image. Transparent background is essential. Photographic quality and material believability are the priority.

## Matched open-image prompt

Use case: precise-object-edit. Asset type: matching second animation state of this exact product photograph. Edit target: the attached closed silver food pouch. Change ONLY the upper seal/mouth area so this exact same photographed pouch is now opened at its resealable zipper, with a narrow naturally elliptical mouth and a visible little bed of fine green matcha powder inside. Keep the lower body, gusset, side creases, metal texture, lighting, shadows, camera viewpoint, overall position, width, canvas size1024x1536, alpha silhouette margins and especially the blank paper label pixel-identical to reference. The front of the mouth may lean forward slightly to reveal powder; no dramatic tilt or overhead camera. It must be a credible opened flexible foil pouch. The same blank rectangular paper at x225..800,y436..1233 must remain exactly in place, no words or symbols. Remove the torn heat-sealed strip above zipper rather than leave a floating strip. Keep the photographic satin laminate material; do not create plastic, chrome, CGI, cartoon folds, or fake glows. Genuine transparent alpha background exactly like input: no background, no ground, no props, no hands. Output one open-pouch photograph only.
