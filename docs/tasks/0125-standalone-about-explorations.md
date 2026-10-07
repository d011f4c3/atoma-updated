# Task 0125 — Standalone About explorations

Date: 2026-10-07
Status: Complete — study only; no homepage adoption
Authority: Owner requests two or three standalone About page explorations from
the client feedback, including the community direction, without replacing the
current flow. This is the design-study slice of Task 0110, not its adoption.

## Evidence and content boundaries

Reread the supplied October 6 DOCX, especially section 6, alongside the September
brand notes and current About/Origins evidence. The feedback requests an
application-led introduction, company information, and space for stories of
community activity and support work actually carried out. It explicitly
distinguishes completed activities from future intentions and community
involvement from individual product provenance.

No operating-company identity, completed community event, dates or publication
permission for such a story is supplied. Do not infer a legal operator from
Made in Kyoto or revive private grower/partner identities. The study shows the
community direction as Looking ahead, and notes missing company/activity copy
in the review toolbar rather than inventing customer-facing facts.

The existing “In the fields.” entry supplies a genuine photographic editorial
feature, labelled Field observations / Kyoto. It is regional context, not an
ATOMA community project, dated visit, precise Wazuka field identification or
proof of any product's origin. Keep its existing captions and reader. Original
source attachments remain outside the public app. No document edits or external
publication are included.

## Scope

Add `/about-study` with three independent compositions and shareable `direction`
query values. The site header, main homepage, current About popup, Origins
reader, retail/cart flows and existing studies remain intact.

- Statement: a typography-led introduction, three clear selection principles,
  a regional photographic feature and a separate community direction.
- Fieldnotes: photography and editorial reading, with margin annotations and
  space to understand the material in its regional context.
- Index: a compact opening and native disclosures for Approach, Field
  observations and Community direction.

Use the established mono typography, Mist/Blue hour palettes, fine rules and
sentence-case body copy. The comparison controls its own theme without changing
the visitor's saved preference. Draft editorial copy is English and declared as
such; existing localized navigation/dialogs keep their existing behavior.
Keep new styles isolated and original content sources reusable across variants.

A small local community-story record requires confirmed status, source, place,
date and publication permission before rendering. Its collection is empty until
real stories arrive; do not display an empty promotional grid. No CMS, dependency,
new commerce contract, fabricated metric, commit or deployment.

## Verification

Check desktop and 320px mobile in both palettes, all three directions, query
links, native keyboard/touch disclosures, real photo loading, field reader
opening/Escape/focus/scroll return and the original homepage About interaction.
Confirm a single h1, readable wrapping, no overflow, clearly labelled prospective
copy and no unapproved stories. Mock commerce; verify the publication filter,
review screenshots, run `pnpm validate`, and inspect the scoped diff.

## Completed evidence

- `/about-study` exposes Statement, Fieldnotes and Index through the study
  controls and independent query links. Each uses the shared confirmed field
  entry and clearly labels community intentions as Looking ahead.
- The content filter passes three unit tests covering the empty collection,
  unconfirmed/unapproved stories and incomplete activity records.
- Browser checks pass at 1366px and 320px in both palettes, covering all three
  directions, native disclosure interaction, photo loading, reader return,
  local theme isolation and the canonical About popup. Commerce was mocked.
- Desktop and mobile screenshots were visually reviewed in both palettes;
  evidence is saved locally in `.local/about-study-0125/`.
- The preserved homepage, header, About popup and Origins provider match the
  pre-task checksums. Scoped diff review and `git diff --check` pass.
- `pnpm validate` passes formatting, ESLint, TypeScript, all 114 unit tests and
  the production build. No dependency, deployment or commerce change.
