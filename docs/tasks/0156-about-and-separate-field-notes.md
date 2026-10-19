# Task 0156 — About ATOMA and separate field-note entries

## Request

Improve the About page's story and flow, with a clear field-notes collection.
The owner explicitly clarifies that the harvest is a separate entry, first in
that collection; it must not become the feature or central story of About.

## Evidence and direction

The October client feedback separates a simple About page—application-led
selection, the operating company and relationships with places and communities—
from evidenced activity stories and photographs. The September direction defines
ATOMA as an interface for understanding, selecting and buying matcha, with Wazuka
the first chapter of a broader field record. These documents inform the work;
the owner's request determines its scope.

Lead About with ATOMA and the exact approved Character / Application / Origin
copy. Follow with company attribution and relationships. Keep field notes as a
clearly named collection with two equally weighted photographic entries: the
Wazuka harvest first, people and technology second. Give each entry its own URL
and space for the photographs and concise observations. Avoid separate “View
story” buttons. Preserve the quiet typography, restrained scale, both themes and
all supported locales.

The opening uses a photograph of the tea hillside, not harvesting. The harvest
and technology observations belong on their separate pages, not within the About
introduction or company story. Notes describe only what the supplied photographs
support; they do not invent interviews, a timeline, producer identities, product
provenance or technology outcomes.

## Implementation

- `/about` now reads ATOMA → approach → company → relationships → field notes.
- The field-notes cards link natively to `/field-notes/wazuka-harvest` and
  `/field-notes/people-and-tools`. The harvest is the first entry.
- Separate entries show the supplied photographs in their full proportions,
  concise observational notes, captions, related-entry navigation and a return
  to the About field-notes collection.
- Persistent theme, language, cart guards and shared site navigation remain.
  Entries have localized metadata and unknown slugs return 404.
- Origins opened from an entry returns to that field note, with its reading
  position and current theme preserved.
- No dependencies, production mutations or deployment.

## Validation

Desktop and mobile About and entry screenshots reviewed in both themes. Twenty
canonical locale/navigation scenarios, two focused Origins scenarios and eight
flow viewport/theme scenarios passed, along with no-JavaScript entry navigation,
reduced motion, earlier study routes and unknown-slug 404 checks. Browser fixtures
blocked all writes and external requests.

`pnpm validate` passed formatting, lint, types, 142 unit tests and the production
build. The final browser-test helper uses bounded scroll polling so no-JavaScript
checks do not wait on disabled animation callbacks; assertions are unchanged.
Final test formatting/lint and scoped diff/whitespace checks passed. No deployment.
