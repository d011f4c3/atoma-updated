# Task 0129 — Four related About layouts

Date: 2026-10-07
Status: Complete — study only
Authority: The owner likes the continuous Fieldnotes style and requests replacing
the other study options with three or four related layouts, including one with
smaller margins. Copy must reflect the reattached client documents.

## Evidence and copy

Reread the October 6 Website Feedback DOCX and the original brand-notes RTF.
The feedback's About section requests application-led selection, the operating
company, relationships with places/communities and space for future accounts
of actual community activities. Its readability section calls for sentence case
and clear, legible prose while preserving the small label typography.

The brand notes describe ATOMA as an interface for understanding, selecting and
buying matcha, with information becoming more specific through origin and people.
They explicitly describe field visits, observation, conversations, photography
and writing in Wazuka, the first editorial/research chapter. Use these ideas in
shared draft copy, without claiming universal Wazuka sourcing or attaching the
existing Kyoto photographs to a particular Wazuka event.

Neither document supplies the operating-company identity or a completed support
activity. Keep missing company information in the review toolbar, community
intentions explicitly prospective, and completed-story records empty. Do not
publish source correspondence or infer identities from names in the documents.

## Bounded implementation

Replace Statement and Index with four related choices at `/about-study`:

- Fieldnotes: the accepted page structure, with its current generous margins.
- Compact: the same reading sequence with wider content and tighter spacing.
- Ledger: ruled information rows, with photography inside the Place chapter.
- Columns: a shared photographic band followed by three reading columns.

Each uses the same copy, body type, palette, original image captions and reader
actions. All sections are visible in normal page flow; no homepage-style split
inspector or nested subject tabs. Layout variants share content and components.
Retain Fieldnotes as default; retired or invalid query values fall back to it.
Preserve the canonical homepage, About popup, Origins reader and commerce flow.
No assets, dependencies, adoption or deployment are added.

## Verification

Review all four choices at desktop and 320px in both palettes. Check shared copy
and type, distinct composition, smaller Compact margins, readable stacking,
loaded photographs, focus/scroll return, local theme continuity, reduced motion
and the existing About popup. Mock commerce. Run `pnpm validate` and review the
scoped diff; retain local screenshots and logs.

## Completed evidence

- Fieldnotes, Compact, Ledger and Columns replace the earlier study choices.
  The route allowlist and review controls expose four shareable layouts, with
  Fieldnotes as the default. All four use the same component/content source.
- Copy now covers ATOMA's interface for selection, application-specific use,
  increasing context through origin/people, fieldwork and Wazuka as the first
  chapter. Community copy remains future-facing; company identity is pending
  in the review note. An independent reread found no material source issues.
- All four browser cases pass at 1366px and 320px in Mist and Blue hour. Each
  exercises all four layouts, exact shared copy and body type, tighter Compact
  margins, distinct compositions, image loading, overflow, reader return,
  local theme continuity, reduced motion and the original About popup.
- Sixteen full-page captures and direct-link viewport captures were reviewed.
  Evidence is in `.local/about-layouts-0129/`. Photo corner markers stay within
  Ledger and phone layouts; explicit palette fallbacks cover the full document.
- Homepage, header, original About content and Origins provider match the
  pre-task checksums. Scoped diff review and `git diff --check` pass.
- `pnpm validate` passes formatting, ESLint, TypeScript, 126 unit tests and
  the production build. Commerce was mocked during browser checks. No release.
