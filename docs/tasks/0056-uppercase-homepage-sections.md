# Task 0056 — Uppercase homepage sections

Date: 2026-10-01
Status: Complete

## Approved scope

Extend the uppercase experiment from supporting labels to the headings and copy
in the homepage Overview, Origins, Shop, Specifications and About sections, in both themes.
Preserve the selected Split Origins layout and its grower CTA, the current
selectors, product/quantity state, and existing interactions. Apply the treatment
to the associated information dialogs as well. Retain literal physical units,
entered references and input values. The main hero headline remains at its current
treatment. The owner's follow-up screenshot extends the request to the Overview
product title and description.

Use scoped CSS and existing IBM Plex Mono; avoid redesigning independent studies
or dedicated shop pages. No new content, dependencies, services or commerce changes.

## Validation

Check the requested sections on desktop and narrow mobile in both themes. Confirm
uppercase headings, specification descriptions, Origins copy and About copy;
check wrapping, imagery containment and literal `kg` units. Review the scoped
stylesheet diff and run `pnpm validate` plus `git diff --check`.

## Completed verification

- Applied scoped uppercase to the requested homepage headings, body copy and
  associated information dialogs, including the follow-up Overview screenshot.
  Kept the existing type sizes, layout and main hero headline.
- Visually reviewed the production preview at desktop and 320px widths across
  light and dark themes. Checked Overview, Shop, Specifications, the specification
  explanation dialog, About, Split Origins and the Origins reader. Narrow views
  retained their wrapping without horizontal page overflow.
- Confirmed literal `1 kg` format text and preserved selected matcha when returning
  from the Origins reader. No cart writes were performed.
- `pnpm validate` passed formatting, lint, types, all 60 tests and the production
  build. Reviewed the task stylesheet diff against the pre-task snapshots and
  ran `git diff --check`; concurrent Origins region-link work was preserved.
