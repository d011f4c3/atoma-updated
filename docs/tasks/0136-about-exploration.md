# Task 0136 — About as a visual scroll essay

Date: 2026-10-08
Status: Complete — local exploration ready for review
Authority: The owner asks to commit/push current changes, then create an
About exploration with ATOMA branding, a distinct composition and scroll motion.

## Scope

The existing work is checkpointed at `67e2c4c` and pushed to
`origin/codex/final-home-hero`. Build a separate `/about-exploration` route.
Preserve the approved homepage, About popup and six existing About studies.

Use the site's Mist and Blue hour themes, wordmark, fine rules, mono labels and
existing imagery. Explore larger editorial type, a floating powder opening,
a scroll-driven application sequence, panoramic place photography and a quiet
prospective community section. Use native scrolling and the existing smooth
scroll provider, with no new dependency. Support keyboard use, responsive
layouts, progressive content visibility and reduced motion. Mobile and reduced
motion readers receive all application content in normal document flow.

Reuse confirmed editorial boundaries: application precedes origin, Kyoto
photography does not establish an individual product's provenance, company
identity remains pending, and community intentions do not become completed
activities. This is an English design exploration, like the existing studies;
the shared header retains its current language/theme controls. Translation of
the selected design is a later adoption step.

## Validation

Check desktop and mobile in both themes, image loading, scroll motion and
reduced-motion fallback, keyboard links, Origins reader return, cart continuity
and horizontal overflow. Verify the existing storefront/study files remain
unchanged. Run focused browser checks, `pnpm validate` and final diff review.
No production deployment or checkout changes are included.

## Outcome

The separate route presents an oversized typographic opening with the existing
masked powder photograph, an asymmetric introduction, a pinned three-part
application sequence, panoramic Kyoto photography and a prospective community
section. Scroll updates drive the powder position, application progress and
image movement, with restrained section reveals. The existing macro image is
an illustrative texture study, not documentary production evidence.

Phone and reduced-motion layouts show all application content in normal flow.
All three descriptions also remain in the desktop accessibility tree, even
when only the current paragraph is visually shown. Without JavaScript, content
remains visible and the original powder image has a CSS fallback. Shared theme,
language, cart and Origins controls remain intact. Study body copy is English.

`tests/about-exploration.mjs` passes all 12 combinations of 1366px, 390px and
320px; Mist and Blue hour; normal and reduced motion. It verifies all images,
mask loading, horizontal fit, application progress and accessible descriptions,
reduced-motion stability, keyboard theme control, reader focus/scroll return,
Shop links and cart continuity. A separate no-JavaScript check verifies the
three application descriptions remain visible. Desktop and phone captures were
visually reviewed, including the place/community sections.

`pnpm validate` passes formatting, ESLint, TypeScript, all 130 unit tests and
the production build. Final scoped source/diff review passes. No database work
requires Supabase checks. Evidence is in `.local/about-exploration-0136/` and
`.local/about-exploration/`. The canonical storefront and earlier study files
are unchanged from the pushed checkpoint. This exploration is not yet committed
or deployed; the user requested the checkpoint before starting this new work.
