# Task 0130 — About study reading flow

Date: 2026-10-07
Status: Complete — study only
Authority: The owner finds all four About concepts text-heavy and hard to follow
and requests refinement of every concept.

## Bounded implementation

Refine Fieldnotes, Compact, Ledger and Columns at `/about-study`. Shorten the
shared editorial draft, remove repeated introductory explanation and competing
side notes, bring photography forward, and create a clear approach → place →
community sequence. Keep the established palettes, restrained typography,
smaller Compact margins and four shareable layout choices. Main chapter content
stays visible; there are no nested subject tabs or hidden essential passages.

Client requirements remain the evidence: application-led selection, fieldwork,
Wazuka as the first editorial chapter and room for future community stories.
Community activity is prospective; regional photography is not evidence of
individual product origin or a completed support activity. Company identity
remains pending in review chrome. Do not invent identities or completed stories.

Preserve the canonical homepage, About popup, Origins reader, commerce state
and existing saved studies. No dependencies, new assets, adoption or deployment.

## Verification

Review all four layouts in both palettes at desktop and phone widths, including
reading order, earlier photography, visible copy reduction, consistent type,
overflow, image loading, reader focus/scroll return and keyboard/reduced-motion
behavior. Run the focused browser checks and `pnpm validate`, then review the
scoped changes and preserved-file checksums.

## Completed evidence

- Reduced shared body copy from 302 to 116 words, keeping the brief's selection,
  fieldwork and prospective community direction. Removed repeated introductory
  paragraphs and separate annotation columns. Each chapter has one main heading.
- Photography follows the introduction in every layout. A second photograph
  accompanies Place, and future intent sits directly above the Community heading.
  Body copy uses a shared 13px scale; captions and notes remain subordinate.
- Fieldnotes has open horizontal chapters; Compact is wider and shorter; Ledger
  uses an index rail and ruled selection records; Columns has three brief subjects.
  Phones use a single reading sequence with full-width chapter photography.
- All four browser cases pass at 1366px and 320px in Mist and Blue hour. They cover
  all four layouts, visible shared copy, consistent type, chapter order, Compact
  spacing, overflow, images, reduced motion, keyboard controls, reader return,
  local theme state and the existing homepage popup. Commerce is mocked.
- Desktop/phone captures in both palettes were visually reviewed; final intro
  and scrolled viewport evidence is in `.local/about-flow-0130/`.
- `pnpm validate` passes formatting, ESLint, TypeScript, all 130 unit tests and
  the production build. `git diff --check` and preserved-file checksums pass for
  the homepage, header, About popup and Origins provider. No deployment.
