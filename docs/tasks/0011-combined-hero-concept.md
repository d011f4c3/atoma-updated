# Task 0011 — Concept 04: split composition in curved space

Date: 2026-09-28
Status: Complete
Branch: `codex/hero-concept-04`
Preserved homepage: `ca2b63d37b25` / `homepage-checkpoint-02`, still at `/`

## Authorized direction

The owner likes Concept 03's background and asks for Concept 04 to combine the
saved homepage's left-hand heading and right-hand tray with Concept 03's curved
spatial grid and rounded navigation. Keep the thin Sans/Mono pairing and text
resolution, adding periodic glitches during the Explore matcha hover state.

Implement only the hero at `/concept-04`. Retain `/concept-03` for comparison and
the saved homepage at `/`. Explore matcha remains unlinked. Use the existing
client brief and illustrative assets; do not invent products, claims, or data.

## Implementation

- Asymmetric headline/tray composition, neutral black surface, and original
  curved SVG field with restrained pointer-responsive depth.
- Shared capsule header for Concepts 03/04. ATOMA returns to `/`; Explore is
  display text. Existing Mono and thin Fraktion Sans remain in use.
- Hover cue follows the pointer within the tray frame. The existing 500 ms
  character resolve repeats every 2.8 seconds while hovered, leaving a quiet
  interval between pulses. The stationary Explore matcha label and header
  Explore treatment also repeat on hover in Concept 04.
- Repetition stops on pointer exit; timers suspend while the document is hidden
  or the system requests reduced motion. Preserve the native pointer and
  accessible stable text. No strobing or full-screen flashing is introduced.
- No new image generation, dependencies, services, store connection, detail
  screen, motion-off control, or publication.

## Validation

Check the periodic effect across multiple cycles and after exit; check reduced
motion and hidden-document suspension. Verify pointer bounds, touch fallback,
keyboard home navigation, no dead exploration links, image loading, viewport
fit, screenshots, and runtime errors. Run `pnpm validate` and review the final
diff, including preservation of the saved homepage.

## Result

Concept 04 is available at `/concept-04`. The saved black homepage and Concept
03 remain available. The owner requests keeping this concept as it is before a separate homepage
refinement. It is preserved on `codex/hero-concept-04` with tag
`hero-concept-04`. The original homepage checkpoint remains `ca2b63d37b25`.

Validation passed:

- `pnpm validate`: formatting, zero-warning lint, strict types, production build.
- Desktop/mobile/landscape checks at 1440×900, 768×1024, 390×844, 320×568,
  844×390, and 568×320; no document overflow, clipped copy, or runtime errors.
- Two recurring hover cycles; no further periodic resolves after exit; repeated
  effects on the stationary exploration label and header Explore treatment.
- Live system reduced-motion suspension/resumption, plus simulated document
  visibility events confirming timer suspension and resumption.
- Pointer bounds at all four corners, touch fallback, retained native cursor,
  image loading, unlinked exploration behavior, and keyboard home navigation.
- Screenshots and source diff reviewed. `/`, its component/styles, shared text
  effect, global typography, and reserved product gradient remain unchanged
  against the saved homepage checkpoint.

The browser checks are local QA scripts in ignored `.local/qa/`; no test/runtime
dependency was added to the project. No production or commerce action occurred.
