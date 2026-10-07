# ATOMA updated

## October client feedback

[Task 0105](docs/tasks/0105-client-feedback-delivery-plan.md) tracks the
6 October feedback: product codes and origins first, followed by product facts,
readability, About, samples, international selling/localization and packaging.
The [source summary](docs/briefs/2026-10-06-client-feedback.md) distinguishes
confirmed corrections from commercial inputs and the independent-launch decision.

## Hosted release — Task 0103

The current storefront is published from `main` to
[atoma-updated.vercel.app](https://atoma-updated.vercel.app).
Vercel uses Node 24 and pnpm 11.24.0, with installation and build commands
recorded in `vercel.json`. Run `pnpm validate` before publishing changes.

Configure `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` and
`JMM_CART_SESSION_SECRET` as server-side environment variables. Production and
preview use independent 32-byte, base64-encoded cart-session secrets. Tokens and
session secrets are sensitive Vercel variables; `.env.local` remains ignored.
`.env.example` lists the required keys without credentials. Checkout remains
disabled under the existing commerce gate.

## Social preview — Task 0096

The project is named `atoma-updated`; its intended Vercel URL is
`https://atoma-updated.vercel.app`. Root metadata uses that origin for the shared
Open Graph image and large Twitter card. The existing noindex/nofollow setting
remains in place; this change does not deploy or publish the site.

The wide studio-pour preview is `src/app/opengraph-image.png`, with descriptive
alt text beside it. The generated photograph follows the owner's reference,
with a restrained ATOMA wordmark. Prompts and asset provenance are recorded in
[the social preview reference](docs/references/social-preview.md).

The local package is named `atoma-updated`, and `origin` is connected to
`https://github.com/d011f4c3/atoma-updated.git`.

About copy addresses cafés, baristas and food professionals, drawing on the
client's product-first selection direction. See
[Task 0096](docs/tasks/0096-social-preview-and-about.md).

## Current experience — Task 0025

- `/` and `/light` preserve the tray in off-black and a muted mineral gradient. Explore matcha opens
  a concise selection in place: three uses, a short description, format, quantity,
  total and Add to cart. The buying controls fit without scrolling through detail.
- `/concept-02` starts with direct standard selection. Its optional interactive
  builder has two essential steps: Matcha, then Quantity. Format shares the
  quantity step when alternatives exist. Label editing is optional; state is
  shared between modes. Powder photographs disperse/reform on selection and
  remain visible throughout purchase.
- “Material & use” opens a separate, accessible information drawer. All seven
  sample material properties, explanations and preparation guidance remain
  available there. The image no longer carries a permanent property sheet, and
  no long editorial section interrupts purchase.
- A movable paper label prints the selected matcha, use, format, quantity and
  optional personal reference. It has pointer/touch movement, responsive 3D
  tilt, keyboard controls and reset. The label can be enlarged on mobile.
  The photographic bag and canister are preserved at `/concept-02/bag` and
  `/concept-02/canister`. Personal references remain a preview, not a print service.
- Small, locally hosted IBM Plex Mono typography carries the current experience,
  from the tray heading through selection, information and cart. Scale, ruled alignment and
  spacing establish hierarchy; the ATOMA wordmark retains its own treatment.
- The light theme moves from chalk to desaturated grey-green, with neutral controls,
  coordinated directional shadows and consistent dark-ink captions. Header
  navigation rests as plain text. Hover and keyboard focus reveal its existing
  theme-specific button surfaces and shadows.
- Selection uses one continuous lighting field across the powder, label and
  ordering controls, including the mobile sticky stage. The desktop label is
  smaller, and homepage appearance changes preserve the active selection.
- Catalog/cart still use the reviewed Shopify adapter and actual availability,
  format, money and quantity rules. Existing test products are intentional.
  The frontend never hands users to the Shopify Online Store. Checkout remains
  unconnected pending the accepted reconciliation/configuration requirements.
- See [Task 0025](docs/tasks/0025-continuous-light-and-contained-shadows.md),
  [typography and palette](docs/tasks/0023-refined-mono-typography.md),
  [original integration decision](docs/adr/0003-reviewed-headless-catalog-and-cart.md)
  and [browser checks](tests/README.md).

The latest visual review and repository gate are recorded in Task 0025. The earlier
[Task 0019 design pass](docs/design/2026-09-30-visual-quality-pass.md) records the
prior layout and is superseded where the owner's later feedback differs.

## Standalone About comparison — Task 0125

Open [the About study](http://127.0.0.1:3100/about-study) to compare Fieldnotes,
Map, Chapters and Index. These pages share copy grounded in the
client's brand notes and October feedback: application-led selection, fieldwork,
Wazuka as the first editorial chapter and prospective community work. The current
About popup and navigation remain unchanged. Company details and completed
activity stories await supplied confirmation; none are invented for the layouts.
See [Task 0125](docs/tasks/0125-standalone-about-explorations.md).

Fieldnotes is the panoramic essay reference. Map starts with connected subject
branches that expand independently. Chapters starts with three closed native
disclosures. Index uses four visual tiles to reveal passages below its contents
sheet. These models retain short copy, consistent type, palettes and field reader
behavior. Saved query values remain: `compact` opens Map, `ledger` opens Chapters
and `columns` opens Index. Study notes can be opened from the review toolbar.
See [Task 0132](docs/tasks/0132-about-reading-models.md).

## Overview comparison — Task 0119

Open [the Overview study](http://127.0.0.1:3100/overview-study) to compare Digest,
Index and Folded against the original tab. The alternatives reduce visible prose
using material qualities, ruled rows and native disclosures. All share the
existing tab type scale, translated product content, formats and product records.
Folded is now the homepage Overview in both themes: one introduction and three
expandable sections for formats, preparation and the product record. All study
options remain available; selection and the material scene stay mounted while
switching directions. See [Task 0119](docs/tasks/0119-overview-design-study.md)
and [the Folded adoption](docs/tasks/0121-adopt-folded-overview.md).

## Hero introduction comparison — Task 0086

[Product-code study](http://127.0.0.1:3100/numbering-exploration) adds Caption,
Edge note, Register and Specimen tag to the earlier placement options. It uses
the approved WZKA/UJI product identifiers consistently across the product cards,
Overview, Specifications and Quick order. Register, with an open diamond, is now
the current homepage treatment; dedicated Shop cards carry a matching small code.
The study retains all alternatives and an unmarked No code comparison.

[Hero study 02](http://127.0.0.1:3100/hero-study-2) compares Display, Cadence and
Proof alongside the current Specimen introduction. It focuses on the left-side text
and action, preserving the bag and the full-height homepage geometry. The
original comparison remains available separately. See
[Task 0088](docs/tasks/0088-second-hero-study.md).

Open [the hero study](http://127.0.0.1:3100/hero-study) to compare the retained
Current, Specimen, Margin and Register with Fieldnote, Ledger, Signal and Axis.
Only the left-side typography, hierarchy and Explore action change; the approved
bag presentation and live product flow are shared. Directions are linkable through
`?direction=specimen`, `margin`, `register`, `fieldnote`, `ledger`, `signal`,
`axis` or `current`. Specimen is now adopted on the main homepage; Current retains
the previous introduction as a comparison.

See [Task 0086](docs/tasks/0086-hero-introduction-study.md) and the
[Task 0087 refinement](docs/tasks/0087-refined-hero-study.md).

## Footer comparison — Task 0085

Directory is adopted across the canonical homepage, Shop, product pages and
Origins, below the existing content and visible on scroll. Privacy policy, Terms
and Contact appear as plain placeholder text until real destinations are provided.
See [Task 0087](docs/tasks/0087-adopt-directory-footer.md).

Open [the footer study](http://127.0.0.1:3100/footer-study) to compare Index,
Colophon, Compact, Rail and Directory below the full-height homepage. Scroll to
the footer or use View footer. The study includes Mist and Blue hour, planned
policy/contact labels, live Shop navigation and the in-place Growing places reader. Layout
and appearance changes preserve the mounted product scene and selected order.
The comparison retains all five options independently of the adopted footer.
See [Task 0085](docs/tasks/0085-footer-study.md).

## Homepage concepts — Task 0039

Open [the homepage comparison](http://127.0.0.1:3100/homepage-study) for two
additional directions: [Material index](http://127.0.0.1:3100/concept-08), a dark
specimen-led collection, and [Product folio](http://127.0.0.1:3100/concept-09), a
light editorial tray-to-collection journey. Both lead into sample material
profiles, live catalog selection and the existing cart, then unpublished origin
and people chapters. The current homepage remains unchanged.
See [Task 0039](docs/tasks/0039-product-first-homepage-concepts.md).

[The focused Concept 08](http://127.0.0.1:3100/concept-08/focus) explores the
same material index in a single viewport. All seven Specifications stay visible;
explanations open on demand, and Shop replaces the information panel while
preserving selection. See [Task 0040](docs/tasks/0040-contained-material-index.md).

## Navigation comparison — Task 0032

Open [the navigation study](http://127.0.0.1:3100/navigation-study) to compare
the four retained directions: Plain text, Index, Folio and Dial. The new round
adds Edge, a vertical navigation tab; Stack, unfolding index cards; and Shutter,
a wide central reveal. Frame places links around the page perimeter; Track
opens a fine rail with a moving indicator. Plain text is selected for the current
storefront and is the starting comparison, with button surfaces on hover/focus.
The study uses the real homepage flow;
changing navigation or appearance preserves the active selection. The main
homepage uses the chosen Plain text navigation; alternatives remain available
for later review.
See [Task 0032](docs/tasks/0032-navigation-exploration.md).

## Historical direction — Tasks 0016–0018

This separate local frontend repository preserves earlier ATOMA comparisons.
The following notes describe the state before Task 0019. Task 0018 refined
the preferred homepage using Concept 05's actual filled Matcha/About controls,
a native About dialog, subtle text theme links, and the original split tray
composition. Extra framing, decorative registration marks, and surface inspection
were excluded. Both original client briefs were reread.

[Home to catalog](docs/design/home-to-catalog.md) recorded the earlier proposed
product-selection slice: a product index, then verified specifications and
purchase options, followed by origin and people. At that point the hero did not
connect product selection. Task 0019 supersedes that restriction after the owner
confirmed the existing Shopify test products are intentional frontend products.

Retained comparisons from that period:

- [Homepage](http://127.0.0.1:3100/) / [light](http://127.0.0.1:3100/light): the
  preferred split composition with quiet appearance links, compact indexed
  Matcha/About controls at the right, a staggered type reveal, responsive lighting,
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

Task 0018's Explore control was unlinked, and its comparison controls explored
local imagery. Task 0019 now connects the homepage to in-place catalog and cart
interaction. Task 0017 applied Concept 07's silver-blue background to the
homepage and Concept 06 light versions; dark versions retained their palette.
The historical working branch was `codex/final-home-hero`.

## Historical checkpoints and saved comparisons

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
from existing apps on the default port. Development and start commands bind to
the local machine only. Visual routes render without commerce credentials, but
the live catalog and cart require the reviewed server-only local configuration:
`SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_PRIVATE_TOKEN`, and
`JMM_CART_SESSION_SECRET`. The authorized workspace has an ignored `.env.local`;
do not commit or expose its values. Missing configuration produces an explicit
catalog-unavailable state. See [ADR 0003](docs/adr/0003-reviewed-headless-catalog-and-cart.md)
for the integration boundary. Browser regression tests fulfill commerce
requests in memory and do not require a live service-backed cart.

If the shell does not switch Node automatically, use
`fnm exec --using=24.20.0 pnpm validate` (or the desired pnpm command).

## Commands

| Command         | Purpose                                                 |
| --------------- | ------------------------------------------------------- |
| `pnpm dev`      | Run the local development server                        |
| `pnpm validate` | Check formatting, lint, types, behavior tests and build |
| `pnpm test`     | Run catalog, cart and content behavior tests            |
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
- [Final homepage refinement](docs/tasks/0018-final-home-hero.md)
- [In-place selection and Concept 02](docs/tasks/0019-in-place-selection-and-concept-02.md)
- [Matcha and interactive label card](docs/tasks/0022-matcha-and-interactive-label-card.md)
- [Refined mono typography](docs/tasks/0023-refined-mono-typography.md)
- [Home-to-catalog UX](docs/design/home-to-catalog.md)
- [Hero imagery, prompts, and font provenance](docs/references/hero-assets.md)
- [Frontend boundary and dependencies](docs/adr/0001-local-frontend-foundation.md)
- [Bounded 3D rendering experiment](docs/adr/0002-local-3d-hero-experiment.md)
- [Reviewed headless catalog and cart](docs/adr/0003-reviewed-headless-catalog-and-cart.md)

The Instagram reels are essential branding references. Direct access failed;
the subsequently supplied September 28 screen recording has been reviewed and
included in the notes. The setup-only restriction applied to Task 0001; the
owner's subsequent requests authorize the home hero, refinements and headless
selection work in Tasks 0002–0019.

## Repository boundary

`SpecimenHero` serves `/` and `/light`. The right-hand image stage contains the
original SVG `specimen-field`; the headline side stays clear. CSS, pointer
lighting, and native link theme navigation are scoped to this component.
The isolated `HomeHeader` uses Concept 05's button geometry and adds a native About
dialog. Its Matcha action opens the active page's selection. Shared
`useProductSelection`, `CatalogPanel`, and cart components keep the homepage and
Concept 02 connected to the same reviewed commerce projection.

`ProductConfigurator` serves the in-place homepage journey and `/concept-02`.
`PowderScene` and `powder-morph` render the supplied native powder photographs.
`LabelCard` prints live selection text on a movable CSS 3D paper object;
system reduced motion and hidden-tab suspension apply. Mobile selection keeps
a compact material stage visible. `product-content` and `MaterialProfile`
provide explicitly labeled sample editorial profiles and detailed explanations.

The following component notes describe retained earlier comparison routes:

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
in source, but no longer serve Concept 06. Task 0016 added no dependency. Its
generated comparison imagery is illustrative. Task 0019 additionally uses the
owner's supplied native powder photographs without inferring factual product
provenance from them.

`precision-hero` serves `/concept-05`. Its dynamically imported Three.js scene
uses procedural geometry, powder microtexture, and original studio reflection
cards. It caps render resolution, suspends hidden-tab rendering, respects live
system reduced motion, and disposes GPU resources on unmount. The previous tray
image provides a local fallback when WebGL is unavailable or lost. Continuous
subtle motion is retained at the owner's request; this experiment adds GPU work
and a route-specific renderer chunk, documented in ADR 0002.

Text resolution is isolated in `src/components/scramble-text.tsx`. IBM Plex Mono
Regular/Medium is the current interface family; Fraktion remains for the wordmark
and historical comparisons. Font provenance is recorded in
`public/fonts/ibm-plex-mono/SOURCE.md`. The homepage viewport
grid keeps the hero within one screen; selection and detailed reading use
natural scrolling. Motion defaults to on, with system reduced-motion
support for both animations and pointer tracking. `--product-gradient` preserves
the original JMM blue-to-bone stops for future connected product pages; it is not
used on the home.

The source notes stay under `docs/`, outside the public app. Original client
attachments, legacy UI, environment files, and operational data are not committed.
Generated concept imagery, supplied powder photographs and the trial fonts are
served locally.

The sibling JMM and prior atoma-storefront repositories remain unchanged.
Accepted commerce, inventory, and data contracts remain authoritative. Task 0019
connects the reviewed Shopify catalog and cart for local preview, as recorded in
ADR 0003. It does not authorize a production deployment, checkout, payment or
order.
