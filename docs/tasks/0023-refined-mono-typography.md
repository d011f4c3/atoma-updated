# Task 0023 — Refined mono typography and mineral light

Date: 2026-09-30
Status: Complete

The owner finds the site close to the intended direction but insufficiently
refined, with large sans-serif typography that feels generically modern. Use
small mono type and refine hierarchy, spacing and rhythm throughout the current
homepage and purchase journey. Continue the matcha, precision engineering and
laboratory direction established in Task 0022.

The owner's next visual references replace the flat blue light theme with an
atmospheric gradient: chalk highlights, mineral grey-green falloff and diffused
directional shadows. Neutral controls replace blue accents. The tray, matcha
powder and movable card should share a convincing light source and depth, while
retaining the clinical typography and lab-like composition.

The owner’s follow-up explicitly requests a different typeface. Replace Fraktion
Mono with locally hosted IBM Plex Mono (Regular 400 and Medium 500), using the
official IBM assets and included OFL license. Scope changes to the current homepage,
Concept 02, its label card, navigation, selection, information and cart surfaces.
Preserve the tray/powder choreography, movable label, both themes, native focus,
reduced motion and all commerce behavior. Keep earlier concept styling isolated.
Retain readable body text and full-size interaction targets while reducing
display typography. No runtime dependency, new content claims or deployment is needed.

Also complete consistent, subtle hover and keyboard-focus character resolution
on current interactive text. Keep prices and body copy stable, preserve wrapping
and accessible labels, and disable the effect for system reduced motion.

Review both themes at desktop and mobile, actual font rendering, long labels,
information/about/cart surfaces and quick purchase visibility. Reuse relevant
browser checks; run `pnpm validate` and review the scoped changes.

## Implementation

- Locally hosted IBM Plex Mono now carries the current homepage, selection headings,
  product names, instructions, prices, About, material information and cart.
  The ATOMA wordmark retains Fraktion Sans Bold as its own brand treatment.
  Global defaults and the earlier concept styles are unchanged.
- The homepage heading is approximately 24px on desktop and 20px on mobile.
  Selection headings use 15–18px, product names 13–14px, body copy 13px and
  annotations 10–11px. Prices use 16px tabular figures; the primary quantity is
  32px. Reference inputs remain 16px for mobile usability.
- More deliberate leading, tracking and group spacing establish hierarchy.
  Ruled layouts and existing generous control targets are retained. The label
  card has a 24px maximum MATCHA heading, clearer small captions and a restrained
  text scale aligned with the surrounding interface.
- The light theme uses a shared chalk-to-mineral gradient with a bright upper-right
  source. Tray, powder and card use coordinated down-left contact and cast shadows.
  Navigation, focus, About, material information and cart use neutral surfaces and
  ink, with no blue accents in the current flow. Dark styling remains intact.
- The final palette uses muted grey-green tones. Bottom captions and footer
  navigation use the same dark ink as the page; the header controls share a 5%
  white fill. The background remains continuous, without a separate image halo.
- Narrow purchase layouts use a fitted total column and restrained spacing so
  long availability actions stay visible. The expanded mobile label has more
  paper area and sits to the right of the powder, retaining legible long references.
- Palette, type scale and material lighting use CSS. Existing selection, drag,
  cart and accessibility behavior remains in place, with no new runtime dependency.

## Typography and hover verification

- Replaced the current flow’s Fraktion Mono with IBM Plex Mono Regular 400 and
  Medium 500, served locally. Official source revision, checksums and the OFL
  license are retained under `public/fonts/ibm-plex-mono/`. The existing ATOMA
  wordmark and historical concept font families remain distinct.
- Refined heading tracking, body reading widths, compact control sizes and
  medium-weight selection/action accents. Narrow layouts retain full controls;
  redundant footer branding yields space to navigation on phones.
- The same character resolution now covers navigation, mode/step buttons,
  product radios, variants, label actions, material information and cart text
  actions. Full-control hover repeats quietly; keyboard focus resolves once.
  Pointer exit restores text immediately. Prices and body copy remain stable.
  Semantic accessible labels stay intact, and reduced motion disables scrambling.
  Long labels wrap between words, with internal wrapping only for oversized tokens.
- CUA visual review covered 1440×900 desktop, 390×844 mobile and 320×568 narrow
  layouts, both homepage themes, selection, Concept 02, About, material information,
  empty cart and a long local label reference. IBM Plex Mono was confirmed via
  Chrome’s rendered-font inspection. The reference printed completely without
  overflowing the paper, and its input remains 16px.
- Fixed a 320px min-content sizing issue revealed by the new font. Rechecked
  header/control bounds and document width: no horizontal clipping or overflow.
- Verified full-control hover, keyboard focus, native radio focus, disclosure
  hover, fixed glyph widths, pointer-exit restoration and reduced motion via CUA.
  No service-backed cart write or checkout was performed. Two regression cases
  were added to `tests/experience.mjs` and passed the final browser harness.
- `fnm exec --using=24.20.0 pnpm validate` passed formatting, ESLint, strict types,
  all 15 unit tests and the production build. The login shell defaults to Node
  24.19.0; verification explicitly used the repository-pinned 24.20.0 runtime.
  Reviewed scoped changes and passed `git diff --check`.

## Final browser verification

- All 20 relevant browser cases passed cumulatively: 14 on the initial final run,
  then all six mobile quick-purchase cases after a narrow spacing correction.
  Mobile product rows retain at least 52px targets and the full 56px purchase action.
- Coverage includes both homepage themes, all nine desktop/mobile quick-purchase
  combinations, live label movement and keyboard reset, optional information,
  hover/focus text resolution, and the shared purchase action's pending/rejection
  and reduced-motion behavior. Commerce requests were intercepted locally.
- The label keyboard check now waits for the quantity heading's intended focus
  before moving focus to the card. Reset assertions remain unchanged. Decorative
  arrows are excluded from the Back to quantity action's accessible-name selector.
- Final light homepage captures confirm the added image halo was removed and
  the continuous backdrop restored. No deployment or real cart mutation occurred.
