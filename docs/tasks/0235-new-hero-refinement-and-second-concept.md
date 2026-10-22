# Task 0235 — Refine the first hero and build a second concept

Date: 2026-10-21
Status: Implemented and verified locally

## Authority and scope

The owner requests retaining the established colour themes, a different image
and slightly smaller text on `/new-hero`, followed by an entirely new concept
at `/new-hero2`. Task 0234's business positioning, application-led products,
Sample Set, supported origin and repeat-order flow remain the content basis.

- Refine `/new-hero` with a new transparent powder-and-silver composition,
  visible Mist / Blue hour surfaces, and a smaller display headline. Preserve
  readable body text and the existing purchasing flow.
- Build `/new-hero2` as an application desk: a compact introduction beside
  horizontal product rows, followed by a Sample Set band, origin and repeat
  ordering. Use the existing catalog/cart logic and exact named destinations.
- Retain four locales, keyboard/native navigation, reduced motion and visible
  mobile purchase controls. Preserve canonical routes and earlier concepts.
- Label the new generated material image as a reference. No new product facts,
  commercial promises, dependencies, services or deployment.

## Verification

Review both pages at desktop and mobile sizes in both themes. Exercise native
links, application anchors, real variant/quantity controls, cart locks/error
feedback and detail/Back continuity with isolated fixtures. Verify locale/theme
changes and image fallbacks. Run `pnpm validate` and review the final scoped diff.

## Implementation

- `/new-hero` uses a new transparent powder crescent and silver scoop, with the
  existing Mist / Blue hour gradient visible behind it. The display headline is
  reduced; body copy and touch controls retain their readable sizing.
- `/new-hero2` is a separate application desk with a sticky desktop introduction,
  three horizontal purchase rows and a compact Sample Set band. Mobile places
  the introduction before compact image/identity pairs and visible controls.
  Origin and repeat ordering follow in distinct lower sections.
- Both pages use the persistent storefront palette and locale providers. The
  second concept reuses the first page's commerce state and error handling through
  a scoped rows presentation; its anchors have independent IDs.
- The material image is a labelled AI reference. Its exact prompt, source and
  transparent encoding are documented in the [image record](../design/new-hero-material-image.md).
  The encoded WebP is served directly after local browser checks found a stalled
  WebP re-optimization request. The final direct-image checks pass.
- Browser review caught and fixed clipping in the 100 px mobile image-failure
  fallback. All purchasing controls remain independent of image readiness.

## Browser verification

- Existing `/new-hero` suite: all eight profiles and the full catalog/cart,
  selection, native navigation, keyboard and image-failure regression pass.
- New `/new-hero2` suite: nine profiles from 320 to 1440 px across both themes and
  all four locales pass, including native links before hydration, exact product
  and 1 kg destinations, theme/locale continuity, detail and Back restoration,
  isolated add requests, operation locks, rejection recovery and image fallbacks.
- Evidence is in `.local/new-hero-0235/regression/` and
  `.local/new-hero-0235/hero2/`. Desktop and mobile captures for both pages were
  visually reviewed. Browser commerce uses in-memory fixtures; no live orders
  or external mutations occurred.
- Final `pnpm validate` passed formatting, lint, strict TypeScript, all 238 unit
  tests and the production build with both routes. The final desktop decoration
  uses the existing transparent three-powder asset and was rechecked visually
  in both themes; page controls and mobile geometry are unchanged by that asset.
- Final scoped diff and whitespace checks passed. No deployment was performed.
