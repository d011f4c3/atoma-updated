# Task 0137 — Three smaller About explorations

Date: 2026-10-08
Status: Implemented and verified
Authority: The owner finds Task 0136 too large and requests two or three varied
explorations while retaining the site's branding and scroll animation.

## Scope

Provide Studio, Atlas and Notes at `/about-exploration`, with direct query
links and a compact comparison selector. Studio reduces the original scale
and turns the long application sequence into a concise specimen register.
Atlas uses a photographic spread and short place essays. Notes uses a quieter
editorial notebook with margin notes and compact imagery. The original remains
accessible through `?direction=original` as a reference.

Use shared brand themes, header, cart and Origins reader. Preserve the English
study scope, verified product codes, separate product provenance, prospective
community copy and pending operating-company identity. Add no dependencies or
commerce changes. Keep scroll effects restrained, readable without JavaScript,
and static for reduced motion. Do not change the approved storefront.

## Workspace

The latest work was saved externally as `bf21ca6` and the primary checkout
was switched to `main`. Continue from that saved work in the separate
`codex/about-explorations` worktree at
`/Users/d0l1f4c3/Projects/atoma-about-explorations`, previewed on port 3101.
Preserve the primary checkout and the saved commit's other route removals.

## Validation

Review the distinct compositions on desktop and phone in both palettes.
Check direct links and switching, accessible content, actual heading scale,
image loading, no overflow, reduced motion, cart continuity and reader return.
Keep original motion coverage via its reference query. Run focused browser
checks, `pnpm validate` and scoped diff review.

## Follow-up authority — merge to main

The owner explicitly asks to merge the adjusted features, including language
switching and copy changes, back into main. After verification, commit these
variations and fast-forward the clean primary main checkout to this descendant
of the saved work, then push main. This includes the earlier client corrections,
localization and checkout fixes, not only the About variations. The repository
documents automatic Vercel publication from main. Preserve production checkout
gates and do not activate payment providers or change shipping terms.

## Verification outcome

The new comparison passes 24 browser scenarios: three directions, two widths
(1366px and 320px), both themes and normal/reduced motion. Checks include
compact heading scale, distinct content/image arrangements, image loading,
accessible product descriptions, keyboard controls, query/history navigation,
invalid query fallback, cart continuity and Origins focus/scroll restoration.
The original reference passes its existing 12 scenarios. Commerce is mocked;
these tests create no Shopify writes or payments.

Desktop and mobile compositions were visually reviewed. Studio's heading is
at most 80px (44px on phone); Atlas and Notes are at most 56px (36px on phone).
All three keep content in ordinary document flow with restrained scroll motion.
The original pinned sequence is retained only in the reference option.

`pnpm validate` passes formatting, ESLint, TypeScript, all 130 unit tests and
the production build. No database changes require Supabase validation. Review
evidence lives in `.local/about-variations-0137/` and `.local/about-atlas/`.
