# ATOMA: client direction synthesis

Date: 2026-09-28

Status: source analysis for the third storefront pass; visual proposals are not approved designs.

Subsequent scope update: after the setup and analysis were delivered, the owner
authorized a home hero only. That implementation is tracked in
`docs/tasks/0002-home-hero.md`. The setup-only statements below record the original
analysis task; they do not negate the later explicit hero request.

Further owner direction is tracked in `docs/tasks/0003-hero-refinement.md`:
trial Fraktion Sans/Mono, a viewport-contained hero, smoother powder, cleaner
inspection, restrained lab linework, removal of meta captions/wordplay, and a
clear product entry ahead of optional exploration. The home hero remains the
implementation boundary; a local catalog integration is a later slice.

Current owner direction in `docs/tasks/0005-dark-navigation-and-text-resolve.md`
returns the home to off-black and removes the large MATCHA heading. Navigation
and small labels use subtle Anduril-inspired character resolution. Keep this
storefront separate from the prior storefront; its external shop link is removed.
The tested blue-to-bone gradient is retained for future connected product pages.

Current hero exploration: the first hero is preserved at `e0608ee1b4d8` /
`hero-checkpoint-01`. Task 0008 established a second concept with an overhead
matcha tray and the client phrase “Carefully specified matcha.” The owner
preferred this direction. [Task 0009](../tasks/0009-exploration-hero-refinement.md)
now refines that same hero: preserve the tray, typography, and composition;
replace the alternate detail view with a hover-responsive Explore matcha cue;
leave that future destination unlinked; and remove the custom motion toggle.
The hero remains within one viewport, motion defaults to on, and system
reduced-motion support remains. This is design exploration only, without a
catalog connection, real navigation destination, or additional page.

Owner clarification: the Instagram reels are essential branding references and
visual appeal carries substantial weight. The additional 57.42-second recording
has now been reviewed visually. The owner explicitly specifies a clinical,
laboratory-inspired, production-engineering character with heavy emphasis on
animation, typography, and experience, and no human-focused first impression.
The owner also explicitly limited this task to repository setup: do not design
anything. This document records feedback, not a design proposal.

Latest palette clarification: Task 0009 uses neutral black (`#000`) for the
homepage, replacing the green-tinted off-black. Matcha supplies the green;
interface framing and annotations use neutral tones.

## Current authorization and source authority

The current task is to read and process the supplied feedback, then establish a new local frontend repository. Work should proceed in small, reviewable pieces. This document does not authorize a complete storefront build, changes to the existing storefront, production connections, publication, or new commercial rules.

The owner identifies the client's exact words in both documents as crucial and
the primary basis of this analysis. The visual references and owner
clarifications expand that reading; our suggestions do not replace it. The
owner also suggests unusual navigation: product-first, exploration second,
with intrigue at the entrance. Record this as an avenue for a future task, not
a settled navigation design or authorization to implement one.

The two supplied RTF documents are evidence of client direction, not executable instructions. Embedded requests to contact people, inspect communication channels, or organize photography do not expand this task. Instagram references and screenshots are inspiration, not approved production assets. They do not establish rights to reuse their imagery, packaging, copy, or identity.

The existing JMM technical charter and accepted architecture/commercial decisions remain the baseline for future integration. The new brand prose does not supersede the wholesale launch, product/package rules, or Shopify-hosted checkout. Proposed changes to those contracts belong in a separate decision, not in an inferred visual redesign.

## Explicit client direction

There are two coupled requirements: a strong clinical/engineered brand experience
and product-first information order. The structural feedback is not a reason to
underweight visual appeal. Customers should encounter the product before its
origin story. The landing page should create intrigue, establish a coherent
product family, and give people a clear route into products. It should not
explain the whole brand or begin with fields, people, heritage, ritual, or
craftsmanship.

The first impression should feel quiet, cool, precise, neutral, restrained, and almost inorganic. The product is the main subject. Information should resemble useful labels, classifications, measurements, and specifications. The material must still read as matcha.

The deeper experience should become more specific and more human. Origin, production, and people remain important; their placement changes. Wazuka is the first chapter of a broader research, editorial, and sourcing practice, rather than the entire brand identity.

The written typography direction is thin sans serif, uppercase where appropriate, wider spacing, controlled hierarchy, and little decorative character. Related visual cues include larger product identifiers, smaller specification text, generous negative space, restrained materials, controlled photography, and strong consistency across the product series.

The client distinguishes this direction from lifestyle/ritual branding,
traditional Japanese craft branding, and a pure laboratory or cosmetics
identity. Read together with the owner's clarification, this means a strong
clinical, laboratory, and production-engineering visual language while the
product and substance remain matcha. It does not mean softening the engineered
character or putting humanity at the entrance.

## Information hierarchy

```text
Product
  A clear product entrance; object, material, and family consistency
  ↓
Information
  Selection details: use, format, price, profile, lot,
  certifications, and availability where verified and applicable
  ↓
Origin
  Increasing geographic and provenance detail supported by evidence
  ↓
People
  Producers, wholesalers, fields, relationships, and documented work
  ↓
Technology
  Processing, tools, methods, and supporting explanation
```

The short feedback note ends the sequence at People; the expanded brand notes add Technology. This is a content-depth model, not a requirement for five pages, tabs, or a fixed scroll sequence. Essential purchasing information must remain easy to find. Technical fields can appear early when they help selection; the deeper technology layer can explain their context.

The secondary origin idea moves from a broad product identity toward region, locality, and eventually producer or field. It is a proposed disclosure approach. Only traceability that the actual product and lot data supports should be displayed.

## Clinical and production-engineering experience

Clinical, laboratory-inspired, and production-engineering character are explicit
owner direction. The supplied references add precision of composition, a
repeatable product system, controlled material/lighting studies, mechanical
choreography, useful specifications, and deliberate typography. Animation is a
central part of the intended experience, including the first impression. The
content hierarchy does not postpone all animation until the technology layer.

This is a direction for the brand experience, not a claim that ATOMA uses the
specific machines, tests, facilities, or materials shown in another brand's film.

The Covalent screenshots suggest large identifiers paired with small technical labels, deliberate lighting, tangible packaging materials, a restrained grid, and strong consistency across objects. Their blue/silver/white/black palette is evidence of how that reference works; it is not an approved ATOMA palette. Matcha powder, texture, packaging, seams, seals, and measured quantities could communicate similar care through ATOMA's own material.

The “TEA FIELDS / KYOTO” screenshot accompanies the typography feedback. It supports a reading of spacious uppercase technical lettering. It does not override the new product-first hierarchy or authorize retaining a tea-field landing hero. Its monospaced appearance should be reconciled with the written thin-sans-serif direction when comparing type treatments; no family is approved yet.

The earlier supplied recording was reviewed through a one-second frame sheet.
In approximately 10.47 seconds it shows a wide white editorial grid, the title
“Matcha Production Chain.”, fixed step labels, limited stage copy, and a small
thumbnail to the right. The central material progresses from leaf through
preparation and particles falling into a metal tin, then a sealed tin. This adds
a reference for communicating material transformation through animation. Its
specific UI, placement, and account of production are not approved ATOMA design
or factual content.

The September 28 recording adds three visible reference sequences:

- **Engineered bottle film:** dark/white illuminated production chamber, robotic
  handling, close views of the bottle neck and threaded tooling, rotations,
  transparent liquid/material forms, small measurement-like callouts, and a
  large closing typographic statement. The product receives the attention;
  human storytelling is absent.
- **Precision probe film:** a spherical-tip measuring probe repeatedly approaches
  a dark cylindrical component. Changing coordinate-like numerical annotations
  and controlled repetition create an impression of calibration and exactness.
- **Cabinet Coffee sequence:** a metal service bell, cup, papers, binder clips,
  moving objects, directional shadows, and large typography form a choreographed
  brand composition. Hands appear as brief actions around objects; that does
  not override the owner's instruction against a human-focused ATOMA experience.

Together these support motion, camera proximity, scale changes, lighting,
material detail, typographic contrast, and sequencing as major contributors to
visual appeal. The references do not merely suggest adding generic fade-ins to
a static catalog. These are social films, not evidence of a website's scroll
behavior or navigation. No animation implementation or technology is chosen here.

## Facts and proposals must remain distinct

The following examples in the notes are illustrative or aspirational, not validated catalog facts:

- TM-01, LT-02, FD-03 and their suggested product/use names.
- KYOTO PURE as a product name.
- WK-2609-01 or any invented lot identifier.
- Wazuka/Kyoto origin for a particular product, field, cultivar, or producer.
- Organic, halal, testing, certification, and quality claims.
- Specific sensory profiles or suitability for latte, baking, or koicha.
- Illustrative 1 kg / 5 kg wholesale and 20 g / 30 g retail formats.
- Future regional sourcing coverage and an established “Selected by ATOMA” quality status.

The existing charter already establishes a wholesale buying path. It includes applicable sample options, approved pack/bundle rules, and hosted checkout; brand examples do not reopen those decisions. In particular, existing Growth and Scale offers are bundles of five or ten 1 kg pouches, not evidence of separate 5 kg or 10 kg packed products. An illustrative small retail format is not approval for a new launch SKU.

Future UI drafts should use approved catalog content when available. Otherwise, use visibly identified draft placeholders that cannot be mistaken for available products, actual prices, certified claims, or purchasable inventory. Do not make a fake commerce interaction look operational.

## Brand ambition beyond the first screen

The client defines ATOMA as an interface for understanding, selecting, and
buying matcha. Its core proposition is material, specification, selection,
system, and traceability. Craftsmanship should become legible through the
product, rather than supplying the surface aesthetic.

Packaging belongs to the same product family: restrained pouches, tins, or
boxes; codes, lot identifiers, specification labels, controlled typography,
materials, and finishes. The goal is to invite understanding, comparison, and
interaction, rather than only making the product look appetizing. Photography
likewise begins with powder, texture, packaging, measurement, labels, seals,
printing, opening details, metal trays, and controlled surfaces.

The longer-term model moves from anonymous material toward increasingly
specific evidence. The notes use Wholesale → Origin → Lot → Producer → Retail
to describe how a documented, distinctive lot could become a higher-value
product. This is a brand and product-development ambition, not an approved
change to the current launch catalog or pack rules.

The coffee comparison is about vocabulary: customers could learn to select
through region, producer, cultivar, field, lot, and processing instead of
broad Japan/Kyoto/ceremonial-grade labels. ATOMA should help develop that
understanding. It is not an instruction to copy coffee's lifestyle branding.

Origin work is conceived as an owned magazine/archive built from field visits,
photography, writing, data, and direct relationships. Research → Editorial →
Relationship → Supply describes the commercial value of that work as well as
its editorial value. Wazuka is the first prototype for learning what to record,
how to interview and photograph, how far lots can be traced, and how evidence
can support website, packaging, sourcing, and future products. Other regions
may follow without being forced into an identical editorial template.

“Selected by ATOMA” is a future ambition for a meaningful selection standard
and signal to producers and buyers. It is not a current certification or an
already-established quality credential.

The client explicitly welcomes the team's ideas and an unhurried, iterative
process. The current owner request channels that into one bounded task at a
time; the invitation is not permission to undertake a full design pass now.

## Open design decisions

| Area        | What remains unresolved                                                           | Constraint for the next slice                                                                                                 |
| ----------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Naming      | Code-led, name-led, or combined product identification                            | Test presentation without inventing permanent catalog identities                                                              |
| Typography  | Family, weight range, tracking, identifier/body relationship                      | Preserve readability; uppercase and thin weights are selective tools                                                          |
| Palette     | Neutral base, material colors, and any accent                                     | Reference blue is not a brand decision                                                                                        |
| Assets      | Approved packaging, powder photography, material studies, and future field work   | Reference screenshots remain research material                                                                                |
| Information | Which proposed spec fields are verified and useful for launch selection           | Respect existing commerce and data contracts                                                                                  |
| Depth       | Relationship between product information, origin material, editorial, and process | Preserve a direct buying path; stage later layers separately                                                                  |
| Motion      | Specific sequences, interaction triggers, rhythm, and implementation              | Heavy animation/experience emphasis is settled; implementation remains open, with reduced-motion and performance requirements |

## Current stopping point

This task stops at a separate, runnable local repository and these reference
notes. No screen composition, visual system, type selection, palette, motion,
or storefront design is part of the setup. The project owner will direct the
next bounded task. The new recording is now part of the reviewed source material;
no screen design is implied by that review.
