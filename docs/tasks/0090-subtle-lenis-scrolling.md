# Task 0090 — Subtle Lenis scrolling

## Brief

The owner requests Lenis with a light, premium feel. Add a short wheel-scroll
settle to the storefront and the current hero study, preserving layout, product
transitions, native touch, keyboard navigation and reduced-motion preferences.

## Implementation

- Pin `lenis` to 1.3.26. This requested client-side dependency supplies wheel
  interpolation; no service, commerce change, or production permission is added.
- Use interpolation 0.18 with unchanged wheel distance, native touch and nested
  scrolling. Destroy smoothing entirely when reduced motion is enabled, including
  when that setting changes while the page is open.
- Preserve the hero-study preview container with a scoped instance. Cancel
  scrolling and detach observers/frame loops on route changes and unmount.
- Stop background inertia while existing body scroll locks are active; dialogs
  scroll natively. Route footer scroll buttons through the shared instance.
- Yield to pointer, click and keyboard input before existing native focus and
  scroll restoration, including state changes inside the Origins reader.
- Keep the Specimen introduction, right-side package and page styling intact.

## References

- [Lenis 1.3.26 documentation](https://github.com/darkroomengineering/lenis/blob/v1.3.26/README.md)
- Installed Next 16.3.6 guides: `01-getting-started/05-server-and-client-components.md`
  and `01-getting-started/11-css.md`.

## Validation

- `pnpm validate` passed: formatting, lint, types, 68 tests and production build.
- Five added behavior tests cover initial locks, lock/unlock transitions,
  duplicate mutations and observer cleanup.
- Browser review confirmed a short wheel settle, footer return/focus, scoped
  study scrolling, modal scroll isolation, restored background scrolling and
  live reduced-motion cleanup of both instances. Origins selection while
  scrolling returned to zero and stayed there throughout a 60-frame sample.
- Desktop and 390px mobile layouts retained their geometry; Explore and Shop
  transitions remained functional. Native touch is preserved with `syncTouch:
false`; physical touch gestures were not verified because this in-app browser
  does not support synthetic touch input.
- Reviewed the bounded diff against pre-task copies. No page styling or product
  content was changed.
