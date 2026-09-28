# Task 0010 — Final hero concept: spatial specimen chamber

Date: 2026-09-28
Status: Complete — retained for comparison alongside Concept 04
Branch: `codex/hero-concept-03`
Current homepage checkpoint: `ca2b63d37b25` / `homepage-checkpoint-02`
Current homepage branch: `codex/homepage-current`

## Authorized direction

Save the accepted black tray version as the current homepage, then explore one
final hero concept inspired by the owner's portfolio:
https://portfolio-mu-three-w4cizhzhh5.vercel.app/.

The current homepage remains at `/`; this isolated experiment is `/concept-03`.
Use the same client brief, Fraktion trial typography, product-first hierarchy,
black surface, clinical restraint, subtle text resolution, and unlinked Explore
matcha direction. The owner further emphasizes the portfolio’s rounded
navigation and curved-space lines, combined with the existing Mono/thin Sans
and subtle glitch effects. This is a hero-only design exploration, not a
catalog build.

## Reference interpretation

Inspected the public homepage in a browser at desktop and mobile sizes, after
its entrance, after scrolling, and in its Spiral mode. The web text reader could
not access it; browser inspection succeeded. The portfolio uses a central
faceted metal asterisk, a concave wireframe field, orbiting project images, a
floating header, and a compact Rings/Spiral selector.

Translate the spatial staging: an unmistakable matcha object centered in a
curved geometric field, sparse floating chrome, peripheral typography, and
restrained pointer-responsive depth. The user's client brief remains the
content authority. Do not copy the portfolio's assets, source, project cards,
branding, or project-browsing mechanics. Do not introduce speculative products
or measurements to populate the scene.

## Bounded implementation

- New isolated component and route; retain the saved home route and its styles.
- Original SVG geometry, CSS motion, and existing ATOMA concept tray imagery.
- A centered capsule header with a current-section pill and unlinked Explore
  styling. Header labels resolve on arrival and pointer entry; the actual
  ATOMA home link returns to `/`.
- One scene, no modes or detail-screen transition, no custom motion-off toggle.
- Pointer-responsive depth and an unlinked hover exploration cue; maintain a
  readable stationary label, native cursor, and system reduced-motion support.
- One viewport on desktop, mobile, and short landscape. No scroll capture,
  new dependency, storefront connection, service, or production action.

## Validation

Run relevant browser checks for image loading, pointer behavior, reduced motion,
responsive fit, unlinked semantics, runtime errors, and preservation of `/`.
Inspect screenshots, run `pnpm validate`, and review the final diff. Record the
outcome after checks are complete.

## Result

Implemented the spatial composition and capsule header at `/concept-03`.
The header is shared with Concept 04; its ATOMA link returns to the saved home.
No other destinations are wired. The prior homepage is unchanged.

Validation passed: responsive screenshots at 1440×900, 768×1024, 390×844,
320×568, 844×390, and 568×320; no document overflow or runtime errors. Pointer
tracking/clamping, touch fallback, live reduced motion, image loading, nav
hover resolves without layout shift, and keyboard home navigation passed.
`pnpm validate` passes including both concept routes. Source review found no
remaining issues. No external assets or code were copied from the portfolio.
