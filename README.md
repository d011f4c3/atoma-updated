# ATOMA storefront v3

Separate local frontend repository for the third ATOMA pass. The active
experiment is the **home hero only** at [Concept 06](http://127.0.0.1:3100/concept-06):
an immersive photographic stage using the owner's preferred 2D tray, coordinated
image/type entrance, moving light, and a real pointer-responsive magnifier.
The aperture enlarges the same image at 2.5×, with keyboard and touch equivalents.
“Carefully specified matcha.” remains the client-led headline in thin Fraktion
Sans, with Mono navigation and labels.
The [main homepage](http://127.0.0.1:3100/) retains its split layout, scoped curved
field, and square header for comparison.
The [light version](http://127.0.0.1:3100/concept-06/light) uses a pale studio
surface and dark typography. Both include Matcha/About navigation and a working
About dialog. Footer appearance links switch between the two comparisons.

Explore matcha remains unlinked while the hero design is explored. There is no
product detail screen, custom motion toggle, or commerce integration; system
reduced-motion preferences remain supported. Current work is on
`codex/hero-concept-06`.

The first hero is preserved at `e0608ee1b4d8` / `hero-checkpoint-01`. The accepted
black tray homepage before this refinement is saved at `ca2b63d37b25`, tag
`homepage-checkpoint-02`, and branch `codex/homepage-current`.
The refined homepage is saved at `f0f2fffee276` / `homepage-grid-checkpoint`.
The 3D [Concept 05](http://127.0.0.1:3100/concept-05) and its
[light version](http://127.0.0.1:3100/concept-05/light) are saved at `5dad6f3`.

[Concept 03](http://127.0.0.1:3100/concept-03) remains available as a separate
centered specimen in curved space, with rounded navigation styling and hover
text resolution. [Concept 04](http://127.0.0.1:3100/concept-04) combines that
curved field and capsule header with the split composition. Its 500 ms glyph
resolve repeats every 2.8 seconds while Explore matcha is hovered, with system
reduced-motion and hidden-document suspension. Concept 04 is preserved unchanged
at `50a352cc4fa7`, tag `hero-concept-04`, and branch `codex/hero-concept-04`.
The ATOMA wordmark on the separate concepts returns to `/`.

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
- [Hero imagery, prompts, and font provenance](docs/references/hero-assets.md)
- [Frontend boundary and dependencies](docs/adr/0001-local-frontend-foundation.md)
- [Bounded 3D rendering experiment](docs/adr/0002-local-3d-hero-experiment.md)

The Instagram reels are essential branding references. Direct access failed;
the subsequently supplied September 28 screen recording has been reviewed and
included in the notes. The setup-only restriction applied to Task 0001; the
owner's subsequent requests authorize the home hero and refinements in Tasks
0002–0014.

## Repository boundary

`optical-hero` serves `/concept-06` and `/concept-06/light`, with `matcha-inspector`
handling the aligned photographic aperture and `sheet-information` handling
the About dialog. It adds no dependencies or WebGL work. The image is the prior
generated concept asset, not a verified product photograph. CSS light/line motion
stops when hidden and respects reduced motion; direct lens inspection remains
available as a user-controlled action.

`src/app/` contains the App Router layout and home route. The current hero lives
in `src/components/specimen-hero.tsx` and its CSS module; the original SVG
`specimen-field` is placed only within its right-side image stage. The original
`material-hero` component remains preserved. `chamber-hero` serves the isolated
`/concept-03` route. `hybrid-hero` serves `/concept-04`; those separate concepts
share the field and capsule header, while `/` retains its square header.
`use-periodic-glitch` controls hover repetition without new dependencies. The current Explore matcha cue is
display text, not a link or button; its decorative reticle responds to a fine
pointer while a stationary label remains readable. No navigation or data
connection is implied by the header typography.

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
