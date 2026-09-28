# Task 0009 — Refine the tray hero and exploration cue

Date: 2026-09-28
Status: Complete
Branch: `codex/hero-concept-02`
Preserved first hero: `e0608ee1b4d8` / `hero-checkpoint-01`
Preceding prototype: [Task 0008](0008-second-hero-concept.md)

## Authorized direction

The owner prefers the second tray concept and requests a further design pass.
The exploration cue should respond to mouse hover. It should represent an
eventual Explore matcha destination instead of switching to another detail
screen, and must remain unlinked for now. Remove the custom motion-off mode;
keep motion on by default. The owner subsequently requests a black background
in place of the green-tinted surface. The task remains the hero design only.

Use the client's product-first hierarchy, clinical restraint, controlled
material photography, typography, and intrigue as the design basis. Preserve
the overhead tray, asymmetric layout, and “Carefully specified matcha.” heading.
The native pointer and system reduced-motion support remain available.

## Bounded implementation

- Remove the separate detail screen, view state, view navigation/pagination,
  obsolete index menu, and custom motion toggle.
- Keep a stationary Explore matcha label beneath the heading. It is display
  text with no link, click action, or navigation semantics.
- Add an aria-hidden reticle and label that respond to fine-pointer hover
  within the image stage. Keep the native cursor visible, bound the cue within
  the stage, and return it to its resting position when the pointer leaves.
- Keep the tray still. Preserve the entrance sweep and restrained character
  resolution; suppress automatic motion and pointer tracking when the system
  requests reduced motion. Touch users retain a stationary cue.
- Simplify the header to the wordmark and static section/future exploration
  typography. Do not create a fake menu or imply working navigation.
- Retain one-viewport desktop, mobile, and short landscape layouts, with the
  neutral black (`#000`) home and Fraktion Sans/Mono. Use neutral framing and
  annotation colors so the matcha supplies the green. Keep the blue-to-bone product gradient
  reserved for a later connected product-page task.

## Preservation and boundaries

The first hero component, commit, and checkpoint tag remain preserved. The
current work stays on the second-concept branch and remains separate from the
older storefronts. The existing generated tray is reused; no new imagery,
dependency, Shopify connection, commerce action, or production change is in
scope. No product codes, claims, prices, inventory, or scientific measurements
are introduced. Client requests about business activity or contacting others
remain outside this design task.

## Required validation

- Inspect desktop, mobile, and short landscape screenshots for typography,
  image prominence, cue placement, overflow, and one-viewport fit.
- Verify pointer entry, tracking, clamping, and exit behavior on a fine pointer;
  verify the resting cue remains usable on touch and reduced-motion devices.
- Confirm live system reduced-motion changes also stop pointer tracking and
  character motion, with essential content remaining visible.
- Confirm no detail screen, view switching, motion toggle, dead link, faux
  navigation, or unintended focusable exploration control remains.
- Check image loading and browser runtime errors.
- Run `pnpm validate`, review the final diff, and verify the preserved first
  hero and shared product gradient remain unchanged.

## Result

Implemented the unlinked exploration composition, pointer-led annotation, and
neutral black surface. No detail screen or user-facing motion toggle remains.

Validation passed:

- `pnpm validate`: formatting, zero-warning lint, strict types, production build.
- Browser checks: 1440×900, 768×1024, 390×844, 320×568, 844×390, 568×320; no
  document overflow, readable copy, loaded imagery, and no runtime errors.
- Pointer entry, movement, all four frame corners, exit reset, click with no
  navigation, and touch without pointer tracking.
- Live system reduced-motion changes stop tracking and character animation;
  tracking resumes when the preference is removed. Native pointer is retained.
- Source and screenshot review; first hero, shared typography, and reserved
  product gradient remain unchanged against `e0608ee1b4d8`.

The current homepage is ready to checkpoint before the separately requested
portfolio-inspired final concept. No production or commerce action was taken.
