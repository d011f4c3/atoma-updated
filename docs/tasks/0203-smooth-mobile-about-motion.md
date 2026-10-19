# Task 0203 — Smooth mobile About motion

Date: 2026-10-19

## Request and scope

Make the existing mobile About animations smooth. Preserve the accepted page
layout, content, typography, native scrolling, Community reader and desktop
choreography. Keep reduced-motion and no-JavaScript reading static and complete.

## Change

The previous phone controller measured every photograph on each scroll update,
interleaved geometry reads with style writes, and also measured the hidden desktop
stages. Its image progress jumped directly to each new scroll position.

Cache mobile frame positions until layout or viewport changes, and separate the
mobile update from desktop stages. Ease nearby image and connection-line progress
with a short, time-based response; stop scheduling frames when it settles. Write
only changed values and scope the reading-progress variable to its own bar.
Desktop retains its existing motion formulas, with geometry reads batched before
style writes.

Keep photographic frames fixed and replace the animated inset with a gentler
six-percent image zoom. Only nearby photographs request a transform layer. This
reduces the work during a swipe without changing the page's geometry or hiding
copy. Layout observers, viewport and preference changes keep cached positions
current; background/resume and breakpoint changes reset the motion state.

## Verification

- The same instrumented mobile scroll recipe before and after records 364 → 0
  geometry reads, 336 → 0 reads after style writes, and 420 → 112 motion-property
  writes. Its final scroll jump now passes through 18 distinct positions across
  18 frames instead of jumping in one frame. Raw local evidence is in
  `.local/about-smoothness-0203/`.
- The regression in `tests/about-scroll.mjs` checks cached geometry during
  repeated scroll updates, monotonic easing, no idle writes, nearby-only layer
  hints, fixed photo frames and complete image coverage. Both phone themes pass
  in Chrome and WebKit, along with mobile reduced-motion and no-JavaScript cases.
- All eight Chrome cases and four targeted WebKit phone cases pass. These include
  desktop, narrow-phone, live preference/viewport changes and Community popup
  focus, dismissal, history and return-scroll checks. Commerce is mocked and
  external traffic and writes are blocked.
- Reviewed mobile Approach and Community screenshots in
  `.local/about-scroll-0203/browser/`. Browser instrumentation measures work and
  easing behavior; it does not establish a physical-device frame rate.
- `pnpm validate` passes formatting, lint, strict types, all 202 unit tests and
  the production build. Final scoped formatting and `git diff --check` pass.
