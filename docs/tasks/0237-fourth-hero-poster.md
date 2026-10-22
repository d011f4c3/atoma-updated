# Task 0237 — A stronger fourth hero

Date: 2026-10-21
Status: Implemented and verified locally

## Authority and scope

The owner finds `/new-hero3` closer, but wants more from the hero and requests
another concept at `/new-hero4`. Keep the clear application-led flow and give
the entrance a stronger visual identity within Mist, Blue hour and IBM Plex Mono.

- Build a material poster: oversized typographic matcha, a new sculptural powder
  and silver image, concise positioning, immediate samples and three clear
  application links to the purchasing controls.
- Retain the third concept's open product comparison, Sample Set, supported
  origin and exact named 1 kg repeat orders. Reuse existing commerce behavior.
- Keep the image compact on phones and all controls independent of its loading
  or animation. Preserve four locales, keyboard access and reduced motion.
- Preserve all earlier routes. No study controls, new product facts, dependency,
  integration or deployment. Label the generated material image as a reference.

## Verification

Review both palettes on desktop and phones, all four locales, hero fallbacks,
native application anchors, cart locks and selection continuity. Run the scoped
browser suite, relevant existing-route regression, `pnpm validate` and diff review.

## Implementation

- `/new-hero4` uses a full-width material poster. Large decorative type sits
  behind a transparent sculptural powder sweep, followed by the complete
  positioning headline and both introductory actions. The actual heading remains
  a single accessible text heading; decorative type is hidden from assistive
  technology.
- Three labelled application links lead directly to the matching purchasing
  cards. They are native anchors before hydration and respect pending commerce
  navigation locks. The rest of the page retains the third concept's clear flow
  and unchanged shared `counter` product presentation.
- The new image has a visible AI reference caption and translated descriptive
  alt text. Its [provenance and exact prompt](../design/new-hero4-material-image.md)
  are recorded separately. It is served as an encoded WebP directly; failed or
  delayed loading cannot hide or block the page's controls.
- Only the image has a brief entrance animation. Reading copy and controls stay
  settled, and system reduced-motion preferences disable the animation. Phone
  layouts use a compact poster and retain the introductory CTAs in the first
  viewport.

## Browser verification

- `tests/new-hero4.mjs` passes all nine profiles from 320 to 1440 px across both
  palettes and all four locales, including native application anchors, all
  labelled product/reorder destinations, theme/locale/selection continuity,
  product-detail/Back restoration, cart locks and rejection recovery, keyboard
  access, reduced motion, delayed imagery and readable failure fallbacks.
- The `/new-hero3` regression passes at 1440 px Mist and 390 px Blue hour plus
  its complete interaction checks. No earlier page implementation or shared
  commerce behavior was changed.
- Desktop and phone captures were visually reviewed in both palettes. The
  new transparent asset renders cleanly without a rectangular backdrop.
  Evidence is in `.local/new-hero-0237/`, including `regression-hero3/`.
- Browser commerce used isolated fixtures. No unexpected client errors or live
  commerce mutations occurred.
- The final image uses quality-90 WebP encoding at 590,594 bytes, 60.5% smaller
  than the initial lossless version, with unchanged dimensions and exactly
  preserved alpha. Image quality was reviewed at desktop display size and full
  resolution.
- Final `pnpm validate` passed formatting, lint, strict TypeScript, all 238 unit
  tests and the production build with `/new-hero4`. Final scoped diff and
  whitespace review passed. No deployment was performed.
