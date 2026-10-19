# Task 0157 — Make the Sample Set page easier to understand

## Request and evidence

The owner requests better UX and layout on `/samples`. The client feedback
confirms one set containing 30 g each of Ceremonial, Barista and Culinary,
application-led comparison and a path to larger formats. The current mobile
page compresses the contents into three narrow columns and places ordering
information too far down the page.

## Direction

Give the set one clear product title and quantity summary. Group the existing
powder photographs into one visual, then show readable rows with each matcha's
name, application, approved product code and included weight. On desktop, pair
the visual/contents with the summary and order area; on mobile, place summary,
compact imagery and ordering status before the detailed contents.

Keep one purchase flow and the existing catalog/quantity/cart contracts. When
ordering is unavailable, offer a useful native link to the contents instead of
a disabled purchase button. Preserve catalog failure/retry focus and add an
honest no-JavaScript ordering instruction. Keep the larger-format route concise.

Scope the new purchase presentation to the canonical page. Saved studies and
the embedded sample panel retain their current presentation. Keep both themes,
all four languages, keyboard access, reduced motion and selection continuity.

The actual Sample Set offer is still unconfigured. Do not publish illustrative
prices, credits, shipping or dispatch promises, and never substitute the three
1 kg products for the set. No dependency, commerce setup or deployment changes.

## Validation

Reviewed desktop/mobile layouts, including Japanese at 320 px in the dark theme.
Ordering status is visible in the opening mobile viewport, and each contents row
uses at least 14 px for the matcha name.

All 28 canonical browser scenarios passed: four viewport sizes, both themes,
all four locales, unavailable/absent/ambiguous/failed catalog states, retry focus,
native contents-link focus, no-JavaScript reading, and navigation preserving
the selected tea/order. All three saved purchase-page study layouts passed in
both palettes at 320 px, along with the shared retry check. Browser fixtures
blocked real writes and external traffic. Evidence: `.local/samples-0157/`.

`pnpm validate` passed formatting, lint, types, 142 unit tests and the production
build. Final test formatting/lint and scoped diff/whitespace checks passed. No
commercial setup or deployment was performed.
