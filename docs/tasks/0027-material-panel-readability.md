# Task 0027 — Material panel readability

Date: 2026-09-30
Status: Complete

The owner likes the Material & use drawer and requests better spacing,
typography and scale so it is cleaner and easier to read. Refine only this
information experience and its material profile; preserve the entry control,
content, sample attribution, IBM Plex Mono, themes, 6px corners and interactions.

Use clearer separation between the product introduction, material profile,
selected-property explanation and preparation guidance. Provide a considered
reading width, more generous section spacing, clear heading/label/body scale
and readable narrow layouts. Preserve native disclosure, keyboard focus,
focus restoration, scroll behavior and system reduced-motion support.

Review both themes at desktop and 390px/320px, long profile values, expanded
preparation and keyboard navigation. This is a presentation-only refinement;
no commerce, new dependencies, production writes or deployment. Run the scoped
checks, repository `pnpm validate` and final diff review.

## Delivered

- Widened the drawer and increased its gutters and section spacing. Product
  headings scale from 22px to 26px; reading text is 14px with generous leading.
- Arranged the material profile in three columns on desktop and two in narrow
  containers, with roomier controls and a clearer selected-property explanation.
- Grouped preparation content with consistent heading, paragraph and list spacing.
  Preserved the existing copy, typography family, themes and interactions.

## Validation

- Visually reviewed the dark desktop drawer, expanded preparation and the light
  drawer at 390px and 320px with longer Barista profile values. No horizontal
  overflow or clipped text was found.
- Verified dismissal restores focus to Material & use. Reviewed native keyboard
  behavior, focus styles and reduced-motion handling in source; explicit Tab-key
  traversal was not exercised by the browser tool.
- `fnm exec --using=24.20.0 pnpm validate` passed: formatting, lint, types, all 21
  unit tests and production build. Final scoped source review and
  `git diff --check` passed. No commerce behavior or production services changed.
