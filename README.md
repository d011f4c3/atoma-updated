# ATOMA storefront v3

Separate local frontend repository for the third ATOMA pass. The current
concept is the **home hero only**: an overhead metal tray of matcha, an
asymmetric composition, and “Carefully specified matcha.” in Fraktion type on
a neutral black surface. Task 0009 refines this into a single view with restrained
entrance motion, character resolution, and a pointer-responsive Explore matcha
cue. That destination remains unlinked while the hero design is explored.
There is no detail screen, custom motion toggle, or commerce integration;
system reduced-motion preferences remain supported.

The first hero is preserved at commit `e0608ee1b4d8` and tag
`hero-checkpoint-01`. The second concept is developed on
`codex/hero-concept-02`. Both remain separate from the previous storefront.

The accepted black tray homepage is now saved at `ca2b63d37b25`, tag
`homepage-checkpoint-02`, and branch `codex/homepage-current`. It stays at `/`.
The final experiment at [concept 03](http://127.0.0.1:3100/concept-03) is developed
separately on `codex/hero-concept-03`: a centered specimen in curved space,
floating rounded navigation styling, and hover text resolution. Explore matcha
stays unlinked. The ATOMA wordmark returns to the saved homepage.

The latest exploration is [Concept 04](http://127.0.0.1:3100/concept-04), on
`codex/hero-concept-04`. It combines the saved homepage's split composition with
Concept 03's capsule header and curved field. Explore matcha remains unlinked;
its 500 ms glyph resolve repeats every 2.8 seconds while hovered, with system
reduced-motion and hidden-document suspension. `/` and `/concept-03` remain
available for comparison.

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
- [Hero imagery, prompts, and font provenance](docs/references/hero-assets.md)
- [Frontend boundary and dependencies](docs/adr/0001-local-frontend-foundation.md)

The Instagram reels are essential branding references. Direct access failed;
the subsequently supplied September 28 screen recording has been reviewed and
included in the notes. The setup-only restriction applied to Task 0001; the
owner's subsequent requests authorize the home hero and refinements in Tasks
0002–0011.

## Repository boundary

`src/app/` contains the App Router layout and home route. The current hero lives
in `src/components/specimen-hero.tsx` and its CSS module. The original
`material-hero` component remains preserved. `chamber-hero` and `specimen-field`
serve the isolated `/concept-03` route; its field is original SVG geometry.
`hybrid-hero` serves `/concept-04`, sharing the field and capsule header.
`use-periodic-glitch` controls hover repetition without new dependencies. The current Explore matcha cue is
display text, not a link or button; its decorative reticle responds to a fine
pointer while a stationary label remains readable. No navigation or data
connection is implied by the header typography.

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
