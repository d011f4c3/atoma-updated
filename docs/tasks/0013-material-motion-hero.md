# Task 0013 — Final comparison: material in motion

Date: 2026-09-28
Status: Complete — retained for comparison
Branch: `codex/hero-concept-05`
Homepage preserved: `f0f2fffee276` / `homepage-grid-checkpoint`
Concept04 preserved: `50a352cc4fa7` / `hero-concept-04`

## Authorized direction

The owner prefers the homepage and Concept03 and requests one final comparison
hero after rereading both original client briefs. Oro's website and Instagram
are inspiration, especially its hero animation; the owner expressly says not
to copy its layout and not to feel confined to it. A nine-image Instagram grid
and a 3.22-second mobile screen recording were supplied and visually reviewed.

The new routes are `/concept-05` and `/concept-05/light`. Keep `/`, `/concept-03`,
and `/concept-04` as-is.
The briefs' priorities are product as protagonist, intrigue, a clear product
entrance, quiet almost inorganic surfaces, and label/specification typography.
Matcha must remain the substance; do not create science decoration for its own
sake. The existing client phrase “Carefully specified matcha.” stays concise.

## Reference interpretation

Oro's supplied recording shows a bottle changing perspective from a close lower
view to a settled front view, with coherent reflections and scale changes. The
Instagram screenshot emphasizes controlled industrial lighting, macro material
studies, product isolation, and mechanical staging. Use those presentation
principles; do not copy water imagery, slogans, branding, claims, or layout.
The website text was accessible, but its 3D object did not render in our initial
headless capture; the owner-supplied recording is the visual animation evidence.

## Bounded implementation

- An original real-time 3D tray of fine matcha, with a brief camera reveal,
  responsive studio lighting, and bounded pointer response.
- A quieter black stage and peripheral thin Fraktion Sans/Mono typography.
  One main unlinked Explore matcha destination; retained subtle character effects.
- A code-native model and procedural texture, not a production product/SKU,
  measurement, facility, or testing claim. No copied media or models.
- Version-pinned Three.js is limited to this route, documented in ADR0002.
  Local fallback image, reduced-motion still, visibility suspension, capped
  render resolution, and full resource cleanup are required.
- A single viewport, with no new sections, scroll capture, integration, service,
  commerce action, or production deployment.

## Subsequent owner refinement

The owner likes the 3D tray but says its flat green rectangle resembles a pool
table. Powder needs a recognizable physical bank, organic edge, and fine texture.
The owner also authorizes site navigation and a separate light laboratory
version, supported by two further Oro screenshots. This extends the same bounded
hero task: Matcha returns to the current hero, About opens a keyboard-accessible
information dialog, and footer appearance links compare dark/light routes.
Explore matcha remains unlinked; no catalog or commerce pages are implied.

The light version uses a cool pale studio surface, dark typography, and stronger
silver/black material reflections. The About panel uses the client's brand
description and generic matcha/powder identifiers, with no invented composition,
certification, SKU, lot, measurement, availability, or origin claims.

## Validation

Inspect the actual WebGL render and its animation, including desktop/mobile
framing, image fallback, live reduced motion, visibility suspension, context
loss, resize, lifecycle cleanup, text effects, and existing routes. Run the
smallest relevant browser checks, `pnpm validate`, and review the final diff.

## Results

- `pnpm validate` passed formatting, ESLint, TypeScript, and production build.
- Chrome WebGL renders were inspected on both tones. Layout checks passed at
  1440×900, 768×1024, 390×844, 320×568, 844×390, and 568×320 without overflow.
- About opens/closes by pointer, touch, and keyboard. Tab/Shift+Tab remain in the
  dialog; Escape restores focus. Both information layouts fit the tested sizes.
- Hover text resolves and repeats; Explore stays unlinked. Appearance links work.
- Drawing instrumentation confirms live reduced-motion and hidden-document
  suspension, resumption, and one static redraw on reduced-motion resize.
- Forced context loss disposes the canvas and reveals the local fallback;
  blocked WebGL also uses the image. Touch DPR 3 is capped at 1.75 render ratio.
- Separate canvas captures confirm camera-reveal and pointer-response changes.
  GPU lifecycle and disposal received an independent code review; no defects found.
- The homepage, Concepts 03/04, shared styles, and existing text helpers remain
  unchanged against `f0f2fffee276`. Their routes still render. Final diff reviewed.

QA scripts, reports, and screenshots remain in ignored `.local/qa/`. Testing
used desktop Chrome plus mobile emulation, not physical-device GPU profiling.
The fallback is an alternate existing illustration, not the identical 3D frame.
The owner subsequently prefers the 2D tray and authorizes a fresh Concept 06;
retain this experiment as-is for comparison.
