# Task 0100 — Refine About around the brand brief

Date: 2026-10-06

## Brief

Replace the audience-led About copy and improve the popup's visual hierarchy.
The owner finds the existing "Matcha for what you make" text inconsistent with
the client brief. Use a precise, product-first perspective: matcha as material,
flavour, texture and performance, specific use, then deeper origin and people.

## Design and content

Use a clear title and short lead above three ruled editorial entries: Character,
Application and Origin. Preserve the established mono typography, theme system,
quiet industrial linework, and existing dialog behavior. Use plain readable body
text, avoiding repeated animated paragraph markup. Do not add claims of testing,
certifications, complete traceability or new commercial terms. No CTA or external
link is added; Close remains the only interactive dialog element.

## Verification

Review desktop and 320px/mobile, both themes, content uniqueness, scrolling,
Escape dismissal and focus restoration. Run `pnpm validate` and scoped diff
review. Preserve header, product selection, order state and the new hero motion.

## Results

- Replaced the audience-led paragraphs with a shorter material-first lead and
  three numbered entries. Body copy is rendered once and remains static.
- Inspected desktop in both palettes and 320 × 760 in dark mode. At 320px the
  dialog's content width equalled its available width (286px), with no overflow;
  its 696px content height fit the viewport. Body copy is 12px with open leading.
- Escape restores focus to About on desktop and Menu on mobile. Tab retains
  focus on Close. Existing dialog and product state logic is unchanged.
- Scoped diff review and repository validation passed. A shared product-code
  identity type was made explicitly tolerant of an absent CSS-module class name
  (empty-string default), resolving concurrent integration type errors.
