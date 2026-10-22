# Matching application photographs

Date: 2026-10-23
Task: [0257](../tasks/0257-realistic-hero-applications.md)

## Direction and delivery

These three photographs follow the [approved hero composition](realistic-hero-applications.md):
the same warm-ivory matcha bowl, layered latte in a thin glass, and matcha wagashi
on a dark ceramic saucer. They share a quiet stone surface and soft window light.

Canonical homepage application cards, the application directory and their product
popups opt into these images. Saved studies retain the previous bowl, latte and
cake references. No product facts or commerce behavior change. These remain
generated application illustrations, rather than verified photographs made with
the sale products. Provenance stays internal.

| Application | Workspace asset                                             | Dimensions  | Bytes   |
| ----------- | ----------------------------------------------------------- | ----------- | ------- |
| Tea service | `public/images/applications/prepared-matcha-hero-v3.webp`   | 1536 × 1024 | 266,622 |
| Lattes      | `public/images/applications/iced-matcha-latte-hero-v3.webp` | 1536 × 1024 | 204,784 |
| Recipes     | `public/images/applications/matcha-wagashi-hero-v3.webp`    | 1536 × 1024 | 320,414 |

Generation used the built-in `image_gen` tool, one call per image, with opaque
backgrounds and `.local/hero-images-0257/approved-source.png` as the sole visual
reference. Selected sources are saved in `.local/hero-images-0257/cards/`.
The WebP files use quality 92 and effort 6, at original dimensions. Encoding only;
no generated content was retouched, resized or composited.

Cards retain their existing centered cover treatment. The mobile popup media uses
a 1.85:1 frame so the latte rim and base remain visible; its purchase area stays
pinned. Desktop popups request a 960 px source to keep the taller cover crop crisp.

SHA-256:

- Tea: `2a2915d2c1157f5b1fa79d21b011014669936ac418a89f6ead88bdd458f69146`
- Latte: `2f49fc9653e1f227923027c92965e7158bfe0787f492a0aea65785076607f18a`
- Wagashi: `bcdeee0cac6fb30c0ef0f4e0038f45b8895e40f8444ef6d217bfa53862abc3a1`

## Final prompt set

### tea

```text
Use case: photorealistic-natural.
Asset type: one landscape application photograph for a premium Japanese matcha website card and purchase popup.
Input image: the approved three-object hero composition is the exact subject and material reference. Recreate ONLY the specified subject from it as a natural photographic scene, preserving its identity, color and vessel. Do not include the other two subjects.
Format and setting: landscape 3:2 photograph, quiet warm light-grey stone tabletop and matching softly blurred plaster background. Single subject centered, all vessel edges visible. Subject occupies the central 65% of image width and central 65% of image height, with enough breathing space to survive a centered 16:9 crop. Slightly elevated frontal camera. Soft diffused daylight from upper left, gentle natural contact shadow. Calm, appetizing, believable food photography matching the approved hero. Subtle natural material detail; no aggressive sharpness, exaggerated grain, HDR or CGI sheen.
No text, branding, watermark, people, utensils, napkins, plants, extra props or extra food. This is an opaque photographic scene, not transparent.
Subject: ONLY the left subject of the reference: a simple handmade warm-ivory ceramic chawan, subtle fine speckling and small foot, filled with freshly whisked natural green matcha. Keep the same bowl proportions and material as the hero. See the full rounded bowl and enough of the green surface from above. A velvety fine foam with only a few tiny bubbles near the edge, not coarse clustered bubbles. Matcha appears fresh and smooth, not unnaturally saturated.
```

### latte

```text
Use case: photorealistic-natural.
Asset type: one landscape application photograph for a premium Japanese matcha website card and purchase popup.
Input image: the approved three-object hero composition is the exact subject and material reference. Recreate ONLY the specified subject from it as a natural photographic scene, preserving its identity, color and vessel. Do not include the other two subjects.
Format and setting: landscape 3:2 photograph, quiet warm light-grey stone tabletop and matching softly blurred plaster background. Single subject centered, all vessel edges visible. Subject occupies the central 65% of image width and central 65% of image height, with enough breathing space to survive a centered 16:9 crop. Slightly elevated frontal camera. Soft diffused daylight from upper left, gentle natural contact shadow. Calm, appetizing, believable food photography matching the approved hero. Subtle natural material detail; no aggressive sharpness, exaggerated grain, HDR or CGI sheen.
No text, branding, watermark, people, utensils, napkins, plants, extra props or extra food. This is an opaque photographic scene, not transparent.
Subject: ONLY the middle subject of the reference: an elegant thin-walled straight-sided clear tumbler of iced matcha latte. Preserve the simple slim rim and thin glass base. Natural deep green matcha above ivory milk, with a few broad soft plumes gently flowing downward through the milk, matching the hero's beautiful mixing. Two or three ordinary clear wet ice cubes mostly submerged, a thin ring of natural foam. No giant ice peaks, no crystalline green ice, no fine branching veins. A believable freshly poured drink. Glass fully visible from rim to base with no cropping. It should occupy about 65% of the image height and about 30% of the image width, so it still fits the wide card crop.
```

### wagashi

```text
Use case: photorealistic-natural.
Asset type: one landscape application photograph for a premium Japanese matcha website card and purchase popup.
Input image: the approved three-object hero composition is the exact subject and material reference. Recreate ONLY the specified subject from it as a natural photographic scene, preserving its identity, color and vessel. Do not include the other two subjects.
Format and setting: landscape 3:2 photograph, quiet warm light-grey stone tabletop and matching softly blurred plaster background. Single subject centered, all vessel edges visible. Subject occupies the central 65% of image width and central 65% of image height, with enough breathing space to survive a centered 16:9 crop. Slightly elevated frontal camera. Soft diffused daylight from upper left, gentle natural contact shadow. Calm, appetizing, believable food photography matching the approved hero. Subtle natural material detail; no aggressive sharpness, exaggerated grain, HDR or CGI sheen.
No text, branding, watermark, people, utensils, napkins, plants, extra props or extra food. This is an opaque photographic scene, not transparent.
Subject: ONLY the right subject of the reference: a single soft matcha nerikiri wagashi with delicate chrysanthemum petal folds, muted fresh matcha green, on the same shallow traditional Japanese square ceramic saucer with earthy dark brown iron glaze and subtly irregular edges. Entire saucer visible. Preserve the smooth supple confection surface and rounded carved folds of the approved hero. No cut cake, no crumb, no coarse powder, no moss texture, no glaze on the confection. Camera looks slightly down, revealing the petal pattern and the beautiful ceramic surface.
```
