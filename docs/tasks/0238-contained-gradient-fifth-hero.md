# Task 0238 — A fifth hero with a contained gradient

Date: 2026-10-21
Status: Implemented and verified locally

## Authority and scope

The owner values the current hero's gradient contained within the first view
and requests another concept. Build `/new-hero5` with that explicit boundary,
retaining the established Mist / Blue hour palettes and IBM Plex Mono type.

- Include the header in a dedicated first-view gradient. Its backdrop ends at
  one small viewport height, without a page-wide fade or fixed attachment.
  Subsequent content uses the solid theme surface.
- Present a calm application gallery: clear positioning and sample action above
  a continuous transparent composition of prepared tea, latte and baking, with
  named application entrances leading directly to purchase controls.
- Preserve the clear product comparison, Sample Set, supported origin and exact
  named 1 kg repeat orders. Reuse existing catalog and cart behavior.
- Keep mobile actions before the compact image. Allow content to grow on short
  screens or with larger text without enlarging the gradient beyond its first
  view. Preserve four locales, keyboard access and reduced motion.
- Keep earlier pages unchanged. Label reference imagery; no new product facts,
  integrations, dependencies, study controls or deployment.

## Verification

Review both palettes, nine standard viewport/locale profiles, short landscape
and enlarged text. Assert the gradient's measured first-view boundary, visible
actions, image fallbacks, native anchors and commerce continuity. Run relevant
regression checks, `pnpm validate` and final scoped diff review.

## Implementation

- The opening view includes the header and hero within one viewport-sized
  gradient. Its dedicated, unmasked backdrop uses the existing theme variable
  at `100svh`; it does not extend into the solid product section or attach to
  the viewport during scrolling.
- Clear positioning and both actions precede a transparent composition of tea,
  latte and baking. The three application links remain native entrances to the
  existing purchasing cards. The new image's [prompt and provenance](../design/new-hero5-application-image.md)
  are recorded; its visible caption identifies it as an AI composition reference.
- The image has a brief reduced-motion-aware entrance. Text and controls are
  always available independently of image readiness. Later content retains the
  shared product comparison, Sample Set, supported origin and exact repeat links.
- Phone layouts keep the main actions before the image. The application links
  can stack when text is enlarged; short screens grow naturally while the
  gradient remains limited to its initial view.
- The small application codes use the foreground colour so they retain readable
  contrast at the lighter end of the desktop Blue hour gradient.

## Browser verification

- `tests/new-hero5.mjs` passes ten viewport/theme/locale profiles, including
  844 × 390 landscape. It verifies the exact unmasked viewport-height gradient,
  solid later surfaces, first-screen actions, labelled application entrances,
  canonical product/1 kg destinations and readable product codes.
- Native links before hydration, theme/locale/selection continuity, product
  detail and Back, cart locks/rejection recovery, keyboard access, delayed
  images and readable failure fallbacks pass. Enlarged text at 200% on a 320 px
  viewport remains readable without horizontal overflow or overlapping links.
- `/new-hero4` passes desktop Mist and mobile Blue hour regression profiles and
  its full interaction checks. Earlier implementations remain unchanged.
- Final screenshots were reviewed in both palettes. Evidence and measurements
  are in `.local/new-hero-0238/`, with earlier-route evidence in its
  `regression-hero4/` directory. All commerce requests used isolated fixtures;
  no live mutations or unexpected client errors occurred.
- `pnpm validate` passes formatting, lint, TypeScript, all 238 unit tests and
  the production build, including `/new-hero5`. Final scoped diff review and
  `git diff --check` pass. No dependencies were added and no deployment occurred.
