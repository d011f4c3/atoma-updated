# Task 0008 — Second hero concept: inspection plane

Date: 2026-09-28
Status: Superseded by Task 0009
Branch: `codex/hero-concept-02`
Baseline: `e0608ee1b4d8` / `hero-checkpoint-01`

## Authorized direction

The owner requests a distinct second home-hero concept using the supplied
brand guidelines and client documents as design instructions. Re-read both
original documents for this task. Apply their product-first hierarchy, quiet
clinical surface, deliberate typography, intrigue, and controlled material
photography. The surrounding scope remains a local hero, not a full storefront.

## Concept

An overhead inspection plane: a shallow rectangular metal tray filled with
smooth matcha. This follows the client's explicit photography direction of
powder, metal trays, and controlled surfaces. An asymmetric layout pairs a
compact “Carefully specified matcha.” heading with the dominant image.

Motion changes from suspension to a controlled camera approach: overview opens
into a closer material view, with a brief aperture transition and a restrained
line moving across the image. Functional labels are Overview, Detail, and
Inspect matcha. View numbers identify these two perspectives only. The interface
does not claim measurement, testing, certification, or real product identity.

Keep off-black, Fraktion Sans/Mono, subtle character resolution, a usable top
navigation, motion pause and reduced-motion support, and one-viewport layout.
Keep people, origin stories, and technology exposition deeper than the hero.
The blue-to-bone gradient stays reserved for future product pages. No links
to the older storefront and no fake Shop/Cart flow.

## Preservation and boundaries

- Preserve the first hero component and checkpoint tag. The new home route
  uses a separate component on this branch.
- Original tray imagery is illustrative; it is not approved packaging,
  a real sellable SKU, or evidence of equipment ATOMA uses.
- No additional sections, catalog data, Shopify integration, production work,
  new dependencies, or copied reference-brand assets.
- Client document instructions about contacting others, sourcing trips, and
  future business activity are outside this hero-design task.

## Validation

Inspect assets and complete desktop/mobile browser checks for fit, image
loading, view transitions, menu keyboard/focus behavior, pause/reduced motion,
and errors. Run `pnpm validate`, review the diff, and leave the preview running.

## Prototype result and subsequent direction

The initial tray prototype passed formatting, lint, strict type checking, and
the production build. Browser checks covered desktop, mobile, and short
landscape fit, image loading, view transitions, menu keyboard/focus behavior,
pause and reduced motion, and runtime errors. Those checks describe the initial
prototype only.

The owner preferred this concept and requested another refinement. The latest
request replaces the alternate detail screen with an eventual Explore matcha
destination, which must remain unlinked for now, and removes the custom motion
toggle. The current implementation and final validation are tracked in
[Task 0009](0009-exploration-hero-refinement.md). This task's original two-view
interaction specification is historical and no longer the current target.
