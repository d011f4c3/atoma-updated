# Task 0016 — Final hero comparisons

Date: 2026-09-29
Status: Complete
Branch: `codex/final-hero-comparisons`
Previous preferred-hero checkpoint: `b85f7af`

## Authorized scope

The owner requests three design passes. Refine the current homepage in dark and
light with a visible theme switcher, tighter right-aligned navigation, and more
expressive choreography while retaining the preferred split tray composition.
Create an evolution of Concept 03 at `/concept-06` and `/concept-06/light`, unifying
rounded navigation with structural linework and bringing controls into the hero.
Preserve the actual Concept 03 routes. Create an original `/concept-07` exploration
experience grounded in laboratory and production engineering imagery, clean and
cool rather than bone colored. The preferred 2D tray remains available.

Use the client brief: product first, intrigue, restrained technical typography,
material specificity, and purposeful motion. No fictional specifications,
scientific claims, stock, prices, or product identities. No dependencies or live
commerce integration. Explore matcha stays unlinked as a shop destination;
real local view/inspection and theme controls may be introduced. Keep native
pointer visibility, keyboard/touch access, and system reduced motion.

## Preservation and ownership

The preceding light variants are committed before work begins. Earlier Concept 06
is preserved at `b052ee2`. Concepts 03, 04, and 05 and their shared components stay
unchanged. Root owns homepage and documentation; independent concept work uses
isolated components and assigned routes to avoid shared styling changes.

## Validation

Review every new variant on desktop and mobile, including short landscape. Check
viewport fit, image loading, legible contrast, keyboard/touch interactions, theme
navigation, reduced motion, and browser errors. Verify preserved routes. Run the
repository `pnpm validate` gate and review the final diff.

## Results

- Homepage: visible Dark/Light links, compact right-hand header grouping, larger
  staggered type reveal, pointer-responsive light and opposing tray/field motion,
  slow masked reflection, and recurring hover glyph resolution. The mobile tray
  remains fully visible. Theme focus outlines use contrasting current text color.
- Concept 06: rounded capsule header, oval chamber and circular Overview/Texture
  controls form one geometry. Texture is a crop of the same tray photograph.
  Both dark/light routes work; Escape restores Overview. Concept 03 is untouched.
- Concept 07: a cool silver-blue stage with separate Object/Powder/Surface views,
  framing transitions, suspended lid motion, a native accessible surface range,
  and the existing About dialog. The slider has a thin rule and squared thumb.
  Small secondary text was darkened after contrast review.
- `pnpm validate` passes formatting, ESLint, TypeScript, and production build.
- Root browser checks cover all five changed/new routes at 1440×900, 1024×768,
  768×1024, 390×844, 320×568, 844×390, and 568×320. No document overflow,
  out-of-viewport navigation/controls/headings, failed images, or page errors.
  Desktop and mobile screenshots were visually reviewed.
- Theme navigation, hover cue containment, view controls, Escape, slider keyboard
  Home/End and arrows, and About focus restoration pass. Independent review also
  verifies touch controls, modal focus containment, and circular texture geometry.
  Live reduced motion stops animations; hidden documents and inactive Concept 07
  image layers pause continuous animation. Tests use local Chromium and mobile
  browser emulation, not physical device or cross-browser certification.
- Preserved routes respond successfully. Source diff confirms Concept 03/04/05,
  shared header/field/glyph/dialog components, global styles, assets, dependencies,
  and lockfile are unchanged. No service, commerce integration, or release.
- Final diff reviewed. QA scripts, reports, and screenshots stay in ignored
  `.local/qa/`; the previous Concept 06 remains saved at `b052ee2`.
