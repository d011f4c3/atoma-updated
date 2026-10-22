# Approved hero application imagery

Date: 2026-10-23
Task: [0257](../tasks/0257-realistic-hero-applications.md)
Status: Owner approved the generated composition in this session.

## Asset and use

- Public asset: `public/images/hero/matcha-applications-cutout-v3.webp`
- Source: `.local/hero-images-0257/approved-source.png`
- Dimensions: 2172 × 724; sRGB; genuine alpha transparency.
- Encoding: WebP quality 92, alpha quality 100, effort 6. No resizing,
  retouching or compositing after generation. All source alpha values preserved.
- Size: 340,616 bytes.
- SHA-256: `b2ebe54338ec7acaa2e85d2df8f6253717e9bea008fa6a9db84732b72705e71c`
- Generation mode: built-in `image_gen`, transparent background enabled,
  five user-supplied visual references included.
- Canonical desktop hero, three mobile application previews and ordering
  illustration use this asset. Saved hero studies retain the original v1.
- The earlier v2 revision was rejected and remains only in local work evidence.

The subjects illustrate preparation and application: a bowl of matcha, an iced
latte and matcha wagashi on a traditional ceramic saucer. They are generated
application imagery, not verified photographs of sale products. The reference
images guided the vessel, mixing and confection presentation; no reference text,
branding or surrounding scenes were retained.

## Final prompt

```text
Use case: photorealistic-natural.
Asset type: floating transparent food photograph for a premium Japanese matcha homepage.
Input images: the five user-attached photographs are visual references. Reference 1 is the precise direction for the iced latte: a simple thin-walled straight-sided clear tumbler, natural dark green matcha flowing slowly into ivory milk. References 2–4 guide authentic Japanese wagashi and traditional ceramic presentation. Reference 5 supports restrained Japanese dessert photography. Do not reproduce their backgrounds, words or extra props.

Create a NEW cohesive ultra-wide 3:1 horizontal photograph of three separated food subjects, all fully visible, on genuine transparent alpha. Left: freshly whisked matcha in a simple warm-ivory low ceramic tea bowl. Middle: an iced matcha latte closely following reference 1. Right: one elegant small matcha nerikiri wagashi with gently carved chrysanthemum folds, like reference 2, on a shallow traditional Japanese square ceramic saucer with subtly irregular edges and an earthy dark brown iron glaze, inspired by references 3 and 4. Replace cake entirely with this wagashi: no baked cake, no cut crumb.

Composition for the existing website: left bowl center around 19% canvas width, middle glass at 50%, right ceramic plate at 81%. A shared baseline at 93% canvas height. Bowl and saucer each fit within their own third; no overlap. Glass is tallest at roughly 82% canvas height, bowl roughly 47%, wagashi with saucer roughly 46%. Small transparent margins below and generous separation between the three. Slightly elevated frontal camera so we see the drink and ceramic surfaces.

Latte: understated high-end glass, slim smooth rim, simple cylindrical sides and a thin clear base, no thick decorative foot. Follow the reference's realistic mixing: ivory milk fills the lower half, deep natural matcha green the upper half, with a few wide soft plumes of green descending into the milk. Fluid feathered transitions, not fine veins or dramatic tendrils. Two or three ordinary clear wet ice cubes mostly submerged, not green crystalline mountain peaks. Thin natural foam only near the liquid edge. No dense bubbles or aggressive condensation. The drink should look freshly poured and delicious.

Wagashi: soft smooth moist confection, a muted fresh matcha green with broad delicately carved petal folds. Fine, supple surface rather than dry rough powder. Tiny natural handmade imperfections. On its small traditional dark ceramic saucer, with no extraneous cutlery, cup, napkin, garnish or crumbs. No coarse granules, porous sponge, cut cake crumb, exaggerated powder or moss texture. It should be recognizably edible Japanese confectionery.

Photographic style: the quiet natural realism of the user references, soft diffused window light from the upper left, gentle shadows, restrained contrast, believable color. No glossy 3D rendering, hyper-detail, sharpening halos or neon greens. Bowl's tea surface velvety with a faint microfoam at the edge.

Background must be TRUE TRANSPARENT ALPHA, no table, backdrop, white rectangle, black rectangle or checkerboard. Food, ceramic and milk opaque. Glass contains realistically transparent clear regions. Tiny soft translucent contact shadows directly beneath subjects only. No text, watermark, branding, extra props or people.
```
