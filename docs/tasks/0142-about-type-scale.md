# Task 0142 — Return About to the storefront type scale

Date: 2026-10-12
Status: Complete — local implementation and verification

## Authority

The owner says the suddenly enlarged About typography does not match the site.
Correct both active concepts without changing their copy, story order or concept
switching. The prior request for stronger composition did not authorize replacing
the established restrained type hierarchy with display-scale typography.

## Reference and scope

The canonical homepage uses `HeroStudyIntroduction` with `direction=specimen`.
Its heading is 20–30px on desktop (2.1vw within those limits), and 20–24px on
phone (5.125vw). Apply that scale to About page titles and primary display text,
with 20px section headings and readable 14px long-form copy. Keep the existing
mono family, normal weight and measured tracking. Remove giant place names,
equations, chapter numbers and closing titles on both desktop and phone.

Use shared About CSS variables for the primary/section hierarchy. Rebalance the
opening image layout and spacing where they depended on oversized text. Keep
photography, copy, navigation, themes, reduced motion and storefront/cart state.
No new content, assets, dependencies or publication.

## Verification

Inspect both concepts at desktop, phone and the current intermediate preview
width. Check computed type sizes against the homepage and verify image/text
separation and no horizontal overflow. Run the existing focused browser checks,
`pnpm validate`, and final scoped diff review.

Both concepts now share the homepage title scale. Perspective was reviewed at
1366, 675, 390 and 320px; Open book at 1366, 390 and 320px. Computed primary
titles are 28.686px at 1366px, 24px at 675px and 20px at 390/320px. Section
headings are 20px. Opening photographs and spacing were rebalanced around the
smaller type, with no horizontal overflow.

All 12 existing browser scenarios passed across both concepts, both palettes
and three viewport widths, including navigation, image loading, theme and cart
continuity. No-JavaScript reading and fallback routes also passed. `pnpm validate`
passed formatting, lint, types, all 130 unit tests and the production build.
Scoped CSS diff review and `git diff --check` passed. No deployment performed.
