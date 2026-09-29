# Task 0015 — Light versions of the preferred heroes

Date: 2026-09-29
Status: Complete
Branch: `codex/light-home-and-concept-03`
Previous concept checkpoint: `b052ee2`

## Scope

The owner identifies the homepage and Concept 03 as the strongest contenders
and requests light versions of both. Add `/light` and `/concept-03/light`.
Keep their composition, copy, photographic tray, responsive sizing, navigation
shapes, motion, pointer cues, and unlinked Explore treatment unchanged.

Use a neutral pale studio surface, dark readable type, gray-green registration
linework, and pale opaque hover labels. The homepage keeps its square header
and grid confined to the tray side. Concept 03 keeps its capsule header and
curved full-stage field. No new design concept, media asset, dependency,
commerce integration, or release. The dark versions stay at their existing URLs.

Default shared-header styling must preserve Concept 04. Concepts 05/06 remain
untouched. Theme variants are optional props with dark defaults; light colors
must be scoped, without changing global styles or other routes.

## Validation

Inspect both light versions on desktop, portrait mobile, tablet, and short
landscape. Verify contrast, tray loading, one-viewport fit, header/cue hover,
cue containment, reduced motion, and original dark colors/layout. Check the
shared capsule header on Concept 04. Run `pnpm validate` and review the diff.

## Results

- `pnpm validate` passes formatting, ESLint, TypeScript, and production build.
- Both light routes visually reviewed at 1440×900 and portrait mobile; automated
  fit checks also cover 768×1024, 390×844, 320×568, 844×390, and 568×320.
  No viewport overflow or browser page errors; tray images load on both routes.
- Main ink and opaque hover-label text exceed 7:1 contrast against their surfaces.
  Pointer cues enter/exit, stay within their stage, and remain unlinked.
  Reduced motion suppresses automatic motion and pointer transforms.
- The homepage grid remains confined to the right-hand image stage.
  The square and capsule header geometry is preserved.
- Captured computed-style baselines confirm dark Concept 03 and Concept 04
  remain identical, including their shared header. Root checks confirm the dark
  homepage/03/04 backgrounds and type colors; source review verifies that palette
  overrides only apply to the light data attribute.
- Final diff reviewed. No changes to shared glyph/pointer logic, global styles,
  assets, dependencies, or Concepts 05/06. QA scripts and screenshots are retained
  only in ignored `.local/qa/`. Mobile checks use browser emulation.
