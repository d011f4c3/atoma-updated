# Task 0141 — Replace both About concepts

Date: 2026-10-12
Status: Complete — local replacements for review

## Authority

The owner rejects both recent concepts and asks to replace them. This supersedes
preservation of the rejected Field film, Field desk and standalone restart. Keep
the canonical storefront and pre-existing earlier studies intact. No publication.

## Direction

Replace the two active concepts in place: `film` becomes Perspective, `desk`
becomes Open book. Default and the recent `about` URL open Perspective. The
comparison contains two new compositions, not a third incremental alternative.
A local ignored source snapshot retains the rejected work for recovery.

Reread the original October 6 Word feedback section 6 and the storytelling brief.
About explains application-led matcha selection, ATOM + MATCHA, the operating
company and relationships with places and communities. Wazuka is the first
field story; the owner's harvest visit is the first entry. Reserve photography
for the older grower with a drone and powersuit. Technology extends human work.
Do not infer equipment funding, results, product provenance or grower identity.
GVJ is source-backed working operator attribution; formal disclosure remains
subject to confirmation before publication.

Perspective uses typography interwoven with photographs, a landscape and portrait
story composition, and a contrasting technology section. Open book uses an
asymmetric editorial spread and a persistent contents margin. Keep natural
vertical scrolling, legible sentence-case copy, both palettes, keyboard access
and reduced motion. Placeholder captions are short, factual and subordinate.
The public narrative should explain the brand rather than the design process.

## Verification

Inspect both compositions visually on desktop and phone, in both themes. Replace
obsolete tests of rejected interactions with checks of the new reading/navigation
model, theme/cart continuity, responsive fit, image loading and no-JavaScript
content. Run `pnpm validate` and review the final diff.

## Follow-up refinement

The owner finds the new direction better but not yet resolved. Keep the two
replacement structures. Refine image crops so the large Wazuka place name stays
legible, prevent the opening portrait overlapping the mobile headline, increase
Open book's longer copy to 14px, and turn Perspective's opening portrait into a
direct introduction/link to the first harvest entry. Tighten the harvest copy
around the actual visit and distinguish later activity stories from work already
carried out. These remain design studies, not a selected or approved final page.

## Result and checks

Both active concepts are replaced in place. The recent `about` URL and default
also show Perspective. Retired About restart component/test files are removed
from the app and kept only in the ignored local source snapshot. The shared
comparison has exactly two concepts; canonical storefront behavior is unchanged.

`tests/about-stories.mjs` passes 12 desktop/phone/palette combinations, with
loaded photography, no horizontal overflow, keyboard chapter navigation,
concept/history navigation, theme and cart continuity. Both concepts also retain
their content and native chapter links without JavaScript. Desktop Perspective
respects changes to reduced motion; Open book's contents stay alongside reading.
All earlier explicit study URLs remain accessible. Commerce reads are mocked and
no external calls or cart writes occur. Evidence is in
`.local/about-replacements-0141/browser/`.

`pnpm validate` passes formatting, lint, strict types, all 130 unit tests and the
production build. Scoped diff and whitespace checks pass. No deployment, commit
or push is included.
