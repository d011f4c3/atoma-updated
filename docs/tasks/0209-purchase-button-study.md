# Task 0209 — Purchase button study

## Request

Compare easier-on-the-eyes Add to cart treatments that still stand out. This is
an exploration; choosing a storefront replacement is a later decision.

## Scope

- Add `/purchase-button-study` with Current, Mineral, Split and Keyline.
- Keep Current as the unchanged reference. Alternatives use stable labels,
  restrained color changes and no resting animation.
- Compare Mist and Blue hour locally, with a Sample Set context and equal-width
  side-by-side examples. Use canonical sample facts and material photography;
  do not invent a price or availability.
- Preview ready, adding, price update, unavailable and locked states through the
  shared button's actual accessibility and disabled props. Clearly label the
  interaction preview; pressing it never adds to the real cart.
- Keep shared purchase behavior and canonical storefront defaults unchanged.
- Preserve keyboard focus, reduced motion, wrapping labels and 56px targets.
  Study theme changes must not overwrite the visitor's storefront preference.

## Verification

- Eighteen browser cases pass across Chrome and WebKit: 320px, 390px and 1440px
  in both themes; all five button states; keyboard activation and visible focus;
  touch/hover reset; stable alternative labels; and reduced motion.
- The context selector and comparison radios stay synchronized. Theme and
  direction changes retain the mounted button and preview state, update the
  shareable URL and leave the storefront theme cookie unchanged. The existing
  `/samples` button still uses Current. Network writes are blocked in the tests.
- Both themes were visually reviewed on desktop and mobile. Fixed Safari's
  native select height and narrow-screen clipping; matched Current's canonical
  mobile type scale; strengthened the dark footer's contrast.
- Browser harness: `tests/purchase-button-study.mjs`. Screenshots and results:
  `.local/purchase-button-study-0209/`.
- `pnpm validate` passes formatting, lint, strict TypeScript, all 213 unit tests
  and the production build. Final source and whitespace review pass. No
  deployment or production mutation was performed.
