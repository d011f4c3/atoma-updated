# Task 0014 — Final photographic hero

Date: 2026-09-28
Status: Complete — ready for comparison
Branch: `codex/hero-concept-06`
Concept 05 preserved: `5dad6f3`

## Authorized scope

The owner requests one final concept, using independent ideas based on the
client brief and industrial engineering/laboratory direction, with dark and
light versions. Their only further input is a preference for the earlier 2D tray
over the 3D version. Existing routes and concepts remain preserved.

Build `/concept-06` and `/concept-06/light`, one viewport each. Use the original
photographic tray asset, thin Fraktion Sans/Mono, useful navigation,
quiet motion, and a clear unlinked Explore matcha cue. No new catalog, commerce,
production connection, external media, or dependency is needed.

## Interpretation of the brief

Product as protagonist; intrigue before explanation; quiet, precise, almost
inorganic surfaces; typography resembling a useful label or specification sheet.
The subject remains matcha, with no invented measurements, product codes, lots,
certification, or scientific claims. Human/origin storytelling remains deeper.

The owner clarifies that this must feel like a web experience. Use an immersive
optical stage with a coordinated image/typographic reveal, subtle moving light,
and original aperture linework. A real 2.5× magnifier samples the same 2D tray
image under the pointer, rather than substituting another picture or opening a
detail page. Keyboard arrows and captured touch dragging provide equivalent
inspection. No Three.js scene, downloaded media, or new dependency is involved.

Dark and light share geometry. Matcha is the active page, About opens a concise
working information sheet, and appearance links switch the two local variants.
Explore remains unlinked per the ongoing hero-only scope. System reduced motion,
hidden-tab suspension, native pointer visibility, and keyboard access remain.

## Validation

Check both tones visually, desktop/mobile/short landscape fit, image loading,
reveal and hover behavior, precise magnification alignment, keyboard/touch lens
operation, reduced motion, hidden-tab motion, About keyboard and
touch interaction, appearance navigation, preserved routes, and source diff.
Run `pnpm validate` before handoff. No physical-device profiling is implied by
browser emulation.

## Results — 2026-09-29

- `pnpm validate` passes formatting, lint, TypeScript, and production build.
- Both tones reviewed at 1440×900, 768×1024, 390×844, 320×568, 844×390,
  and 568×320. Hero, heading, navigation, and inspection hint fit one viewport.
- The inspection aperture's source-point alignment and exact 2.5× scale are
  checked numerically. Hover entry/exit, clamping, resize, keyboard arrows,
  Escape, native Tab, captured touch drag/pin, and window blur all pass.
- Initial/live reduced motion disables automatic movement and transitions;
  deliberate lens movement remains available. Hidden documents pause CSS motion
  and reset the lens; returning resumes ambient motion without replaying entry.
- About opens and closes, traps Tab/Shift+Tab, supports Escape, and restores focus.
  Its compact short-landscape layout keeps the information and close control visible.
- Explore's repeated hover resolves settle cleanly; activation stays unlinked.
  Appearance links and ATOMA home navigation work. No browser page errors.
- No new dependency, service, WebGL scene, model, or media asset. Earlier app
  routes, shared components, dependencies, and saved concepts are unchanged
  against `5dad6f3`. Source/diff review complete.

Ignored `.local/qa/` contains `check-optical.cjs`, `inspector-qa.cjs`,
`inspector-layout-qa.cjs`, responsive screenshots, and the numerical report.
Checks use Chrome and mobile emulation, not physical-device performance profiling.
