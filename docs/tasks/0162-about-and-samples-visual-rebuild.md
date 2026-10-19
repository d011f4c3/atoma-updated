# Task 0162 — Rebuild About and Samples visuals

Status: visual revision rejected by the owner; style regression correction in progress.

## Request and evidence

The owner explicitly asks to redo both canonical About and Samples. Their latest
feedback identifies inconsistent About text scale, weak Field note imagery,
round buttons, unstable animation and boxy layouts. This request supersedes the
prior compositions while retaining the approved content and commerce behavior.

Read the September client direction and October feedback as evidence. Product
selection precedes editorial depth; Wazuka is a first chapter, not the whole
brand. Harvest remains the first separate Field note and opens in a popup.
Character, Application and Origin keep the owner's exact approved copy. The
brand story should explain ATOMA's work without name etymology or material-study
filler. Private grower identities and unverified technology/provenance stay out.

## Implementation

- About: an open photographic introduction, consistent heading/body roles,
  purpose, the three approach principles, a stronger photographic Connections
  section, independent Field note entries and a direct collection invitation.
  Replace replaying text/image reveals and hydration-dependent section heights
  with stable layouts, a panorama transition inside reserved geometry and a
  secondary photograph preview on Field note hover/keyboard focus.
- Field notes: make the actual supplied story photography prominent and the
  whole entry visibly actionable. Preserve native fallback URLs, popup history,
  keyboard focus, Escape/backdrop dismissal and reader return position.
- Samples: an open, persistent three-tea gallery with local preview controls,
  adjacent purchase area, clearly listed set contents and a preparation image
  beside the route to larger formats. A preview never changes the set or the
  underlying product/order state. Images wait for their masks before appearing.
- Keep IBM Plex Mono, the existing Mist/Blue hour palettes and site button
  radii. Use bounded type roles rather than section-specific display sizes.
  Retain localized copy, readable phone layouts and system reduced motion.

The set remains three 30 g samples, 90 g total. Price, availability, shipping,
dispatch, checkout and cart use the existing reviewed adapter and resolver.
Reference prices or credits are not activated. Saved studies and canonical
homepage/Shop sample entry choices remain available.

## Asset provenance

`public/images/samples/prepared-matcha.webp` is an optimized 1600 px WebP from the
existing client asset `JMM/apps/storefront/public/images/atoma/client/ceremony-matcha.jpg`.
It is general preparation context, not a claim about the appearance or origin
of a specific sample. Original metadata is stripped; JMM files remain unchanged.
About uses existing optimized derivatives of the supplied Wazuka/farm imagery.

## Verification

Review desktop and phone layouts in both palettes. Check role-based type scale,
image bounds, click affordances, actual popup behavior and scroll stability.
Exercise gallery preview geometry and persistent images with normal/reduced
motion, all supported locales and no JavaScript. Preserve sample offer failure,
retry and unpublished-offer behavior. Run focused browser checks, repository
`pnpm validate` and review the scoped final diff. No release or deployment.

## Owner correction: preserve the existing design system

The owner rejected this visual composition and explicitly reiterated that type
scale and button styling must be preserved. Passing interaction checks do not
constitute design approval. Do not describe this composition as approved or
finished, and do not continue changing it on the assumption that it was accepted.

The correction restores About's existing responsive title scale from Task 0142:
20–30 px at 2.1vw on desktop, 20–24 px at 5.125vw on phones, with the original
tracking and leading. Approach principle headings return to 14 px. Section
headings remain 20 px and narrative text 14 px. Samples' title follows the actual
Shop title rules, including its phone breakpoint and locale increment.

About's main actions, Samples' contents/collection links, and the four new
right-side sample-study destinations reuse the existing homepage action class
and its exact stroked SVG arrow. Matching a 6 px radius alone was insufficient:
height, padding, text size, line height, tracking, border, fill and hover/focus
behavior now come from the existing implementation. No further composition or
copy changes are part of this correction. Compare computed styles directly with
the canonical homepage/Shop; do not test against another invented type scale.
