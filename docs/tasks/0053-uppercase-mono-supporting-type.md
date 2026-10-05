# Task 0053 — Uppercase mono supporting type

Date: 2026-10-01
Status: Complete

## Approved scope

The owner requests uppercase for “Matcha selected for a specific application.”
and a consistent small uppercase mono treatment throughout the regular website.
Apply this to short supporting copy, annotations, captions, metadata, interface
labels and compact actions across the homepage, product experience, shop, retail
pages, Origins and shared commerce panels. Preserve larger editorial headings,
long reading passages, entered references and case-sensitive data/units.

Use the existing locally hosted IBM Plex Mono. Retain layout, themes, controls,
hover/periodic text resolution and actual copy. This is a CSS typography pass;
no dependencies, new services, business behavior or independent concept redesign.

## Validation

Review CSS against the pre-change snapshot. Check desktop and narrow mobile in
both themes, headline/subtext hierarchy, text-resolution inheritance, purchase
controls, Origins labels and image containment. Run `pnpm validate` and
`git diff --check`. No new behavior tests are needed for this CSS-only change.

## Delivered and verified

- Homepage introductory subtext now uses uppercase IBM Plex Mono at 11px on
  desktop, with 0.04em tracking and the existing mobile size. The treatment
  inherits through both the measured and animated text-resolution layers.
- Applied matching uppercase support styling to navigation and selectors,
  shop/retail metadata, short product introductions, specifications labels,
  Origins captions and controls, purchase choices and cart actions. Larger
  names and headings, longer prose, handwritten references and physical units
  retain their case.
- Reviewed each scoped CSS change against the saved pre-task stylesheet
  snapshot. No text, image, layout component or commerce behavior was replaced.
- Browser checks covered light/dark views, desktop and 320px mobile: homepage
  subtext, product selectors, shop cards, retail formats, Origins photo entry
  and modal. No horizontal overflow or overflowing modal buttons were found.
  Image containment is intact; `1 kg` remains correctly cased. Also checked
  the optimized production CSS, and corrected breadcrumb button inheritance.
- Final `pnpm validate` passed formatting, lint, TypeScript, all 60 current
  repository tests and the production build. `git diff --check` passed. No new
  tests were added for this presentation-only change and no cart writes occurred.
