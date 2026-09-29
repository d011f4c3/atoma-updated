# ATOMA storefront v3

Separate local frontend repository for the third ATOMA pass. Task 0016 provides
three comparisons grounded in the client brief:

- [Homepage](http://127.0.0.1:3100/) / [light](http://127.0.0.1:3100/light): the
  preferred split composition with a visible appearance switcher, compact square
  navigation at the right, a larger staggered type reveal, responsive lighting,
  a slow reflection across the tray, and recurring hover text resolution.
- [Concept 06](http://127.0.0.1:3100/concept-06) /
  [light](http://127.0.0.1:3100/concept-06/light): an evolution of Concept 03 with
  an elliptical chamber and circular controls in the hero. Overview and Texture
  switch between the complete tray and a crop of its powder. Escape restores the
  overview. The original Concept 03 routes remain unchanged.
- [Concept 07](http://127.0.0.1:3100/concept-07): a cool silver-blue inspection
  stage. Object, Powder, and Surface reveal the suspended vessel, tray, and macro
  image with coordinated framing. The surface position slider and About dialog
  work with keyboard and touch.

Explore matcha remains unlinked as a shop destination. The new controls explore
local concept imagery only; there is no catalog, product-detail page, commerce
integration, or custom motion-off mode. System reduced motion remains supported.
Task 0017 applies Concept 07's silver-blue background to the homepage and
Concept 06 light versions only. Dark versions retain their existing palette.
Current branch: `codex/blue-light-heroes`.

## Saved comparisons

The preferred dark/light versions before this pass are committed at `b85f7af`
on `codex/light-home-and-concept-03`. Previous Concept 06 is preserved at
`b052ee2` on `codex/hero-concept-06`; only its routes are replaced by Task 0016.
Its original `optical-hero` component remains in the repository.

Other checkpoints remain intact:

- `e0608ee1b4d8` / `hero-checkpoint-01`: first vessel hero.
- `ca2b63d37b25` / `homepage-checkpoint-02`: accepted black tray homepage.
- `f0f2fffee276` / `homepage-grid-checkpoint`: right-side grid refinement.
- `50a352cc4fa7` / `hero-concept-04`: combined grid/split concept.
- `5dad6f3`: Concept 05 with its 3D scene and light comparison.

[Concept 03](http://127.0.0.1:3100/concept-03),
[Concept 03 light](http://127.0.0.1:3100/concept-03/light),
[Concept 04](http://127.0.0.1:3100/concept-04), and
[Concept 05](http://127.0.0.1:3100/concept-05) remain available unchanged.

## Local development

Use Node **24.20.0** and pnpm **11.24.0**, pinned in this repository. If using the
installed fnm version manager, select the runtime before installing or running:

```sh
fnm use 24.20.0
pnpm install --frozen-lockfile
pnpm dev
```

Open [the local app](http://127.0.0.1:3100). Port 3100 keeps this workspace apart
from existing apps on the default port. No environment file or credentials are
required. Development and start commands bind to the local machine only.

If the shell does not switch Node automatically, use
`fnm exec --using=24.20.0 pnpm validate` (or the desired pnpm command).

## Commands

| Command         | Purpose                                                 |
| --------------- | ------------------------------------------------------- |
| `pnpm dev`      | Run the local development server                        |
| `pnpm validate` | Check formatting, lint, types, and the production build |
| `pnpm build`    | Build locally; does not publish anything                |
| `pnpm start`    | Serve the local build on port 3100                      |
| `pnpm format`   | Format source, configuration, and documentation         |

## Reference notes

- [Processed client direction](docs/briefs/2026-09-28-client-direction.md)
- [Source register and recording review](docs/references/2026-09-28.md)
- [Setup task and validation](docs/tasks/0001-feedback-and-frontend-foundation.md)
- [Home hero task and validation](docs/tasks/0002-home-hero.md)
- [Hero refinement and product entry](docs/tasks/0003-hero-refinement.md)
- [Original light gradient and contrast](docs/tasks/0004-light-mineral-gradient.md)
- [Dark navigation and text transitions](docs/tasks/0005-dark-navigation-and-text-resolve.md)
- [Compact hero heading](docs/tasks/0006-compact-hero-heading.md)
- [Saved hero checkpoint](docs/tasks/0007-hero-checkpoint.md) — `hero-checkpoint-01`
- [Second hero prototype](docs/tasks/0008-second-hero-concept.md)
- [Current exploration-cue refinement](docs/tasks/0009-exploration-hero-refinement.md)
- [Portfolio-inspired concept](docs/tasks/0010-portfolio-inspired-hero.md)
- [Combined Concept 04](docs/tasks/0011-combined-hero-concept.md)
- [Main homepage grid and square header](docs/tasks/0012-homepage-grid-and-square-nav.md)
- [Final material-motion comparison](docs/tasks/0013-material-motion-hero.md)
- [Final photographic experience](docs/tasks/0014-final-photographic-hero.md)
- [Light versions of the preferred heroes](docs/tasks/0015-light-homepage-and-concept-03.md)
- [Final hero comparisons](docs/tasks/0016-final-hero-comparisons.md)
- [Blue light heroes](docs/tasks/0017-blue-light-heroes.md)
- [Hero imagery, prompts, and font provenance](docs/references/hero-assets.md)
- [Frontend boundary and dependencies](docs/adr/0001-local-frontend-foundation.md)
- [Bounded 3D rendering experiment](docs/adr/0002-local-3d-hero-experiment.md)

The Instagram reels are essential branding references. Direct access failed;
the subsequently supplied September 28 screen recording has been reviewed and
included in the notes. The setup-only restriction applied to Task 0001; the
owner's subsequent requests authorize the home hero and refinements in Tasks
0002–0016.

## Repository boundary

`SpecimenHero` serves `/` and `/light`. The right-hand image stage contains the
original SVG `specimen-field`; the headline side stays clear. CSS, pointer
lighting, and native link theme navigation are scoped to this component.

`ChamberHero` serves the unchanged `/concept-03` routes; `HybridHero` serves
`/concept-04`. Their shared capsule header and field remain unchanged.
`OrbitalHero` now serves both `/concept-06` routes through separate components;
its circular detail is a crop of the same illustrative tray image.

`InspectionStageHero` serves `/concept-07`. It reuses the generated vessel, tray,
and macro assets as separate visual studies, without asserting an actual
production sequence, specific magnification, or approved packaging. Its local
view controls and surface slider have no connection to product data. The shared
`SheetInformation` provides the existing About dialog without modifications.

The preserved `optical-hero` and `matcha-inspector` components remain available
in source, but no longer serve Concept 06. No new dependency is added by Task 0016. All current assets are illustrative, not verified product photographs.

`precision-hero` serves `/concept-05`. Its dynamically imported Three.js scene
uses procedural geometry, powder microtexture, and original studio reflection
cards. It caps render resolution, suspends hidden-tab rendering, respects live
system reduced motion, and disposes GPU resources on unmount. The previous tray
image provides a local fallback when WebGL is unavailable or lost. Continuous
subtle motion is retained at the owner's request; this experiment adds GPU work
and a route-specific renderer chunk, documented in ADR 0002.

Text resolution is isolated in `src/components/scramble-text.tsx`. Fraktion
Sans and Mono remain the owner's authorized local trial. The viewport grid keeps
the hero within one screen. Motion defaults to on, with system reduced-motion
support for both animations and pointer tracking. `--product-gradient` preserves
the original JMM blue-to-bone stops for future connected product pages; it is not
used on the home.

The source notes stay under `docs/`, outside the public app. Original client
attachments, legacy UI, environment files, and operational data were not copied
into Git. Generated concept imagery and the trial fonts are served locally.

The sibling JMM and prior atoma-storefront repositories remain unchanged.
Accepted commerce, inventory, and data contracts remain authoritative for later
integration. This repository has no remote, deployment configuration, or live
service connection.
