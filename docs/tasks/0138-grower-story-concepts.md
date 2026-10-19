# Task 0138 — About through grower stories

Date: 2026-10-12
Status: Complete — local concepts ready for review

## Authority and scope

The owner requests one or two distinctive About concepts based on updated
client feedback, a photographed harvest weekend in Wazuka, and a story about
an older grower holding a drone and wearing a powersuit to support his limbs.
Photography is being edited; layout placeholders are explicitly authorized.

Build two local concepts at `/about-exploration`: Field film and Field desk.
Keep the earlier directions accessible through their existing query URLs.
Preserve the canonical homepage, shared commerce, language and theme controls.
The study prose is English and visibly provisional. No publication is included.

## Direction and evidence

October 6 feedback §6 supports place/community stories; the original brief
describes deeper people and technology chapters. Start these About concepts
with the people and their work, then connect that attention to ATOMA's
application-led selection. Avoid repeating the existing three-product register.

Field film uses photographic apertures, native scroll, a persistent chapter
index and an editorial change of scale from landscape to person to tool.
Field desk uses a spatial photographic table and direct chapter selection.
Both keep readable sentence-case body copy, mono labels, fine lines, Mist and
Blue hour, mobile layouts, keyboard operation and reduced-motion fallbacks.

The owner has supplied story subjects, not approved names, quotations,
equipment specifications, quantified results or ATOMA-funded programs.
Reused regional photographs are explicitly placeholders, never captions for
the new weekend. Technology placeholders do not claim to show the actual
equipment. Do not change public grower records or infer product provenance.
Company disclosure remains pending outside this composition study.

## Verification

Review desktop and phone compositions in both themes, chapter interaction,
motion/reduced motion, no-JavaScript reading, keyboard navigation, image
loading, horizontal fit, comparison/history and shared cart continuity.
Run focused browser checks, `pnpm validate` and review the final diff.

## Implementation

Field film is the new default and is directly addressable with
`?direction=film`. It opens through a landscape aperture with an inset archive
portrait, then holds the photograph while native scrolling moves through
place, work and detail. A second, asymmetric spread reserves portrait space
for the drone and powersuit story. Native Next links preserve route history.

Field desk (`?direction=desk`) gives the grower photograph the main position
on a ruled photographic table. Three print selectors bring a chapter and its
reading slip into focus. The selected story is linkable through its hash,
with browser Back/Forward support. All three stories remain readable without
JavaScript. Phone layouts keep the prints and text in a vertical sequence.

Both share the existing header, theme/language controls and cart provider.
English study copy and placeholder imagery are marked in the review frame.
The technology drawings are schematic composition placeholders, not images or
specifications of the actual equipment. Canonical public grower records and
commerce code are unchanged. Studio, Atlas, Notes and Original remain at their
existing query URLs, with a return link to the new concepts.

## Verification outcome

The 24 new browser scenarios cover 1366px, 390px and 320px, both themes and
both motion preferences. They verify images, fit, chapter/photo progression,
keyboard control, theme continuity, query/history navigation, retained mocked
cart state and the Shop destination. The earlier variations pass all 24
scenarios and the updated default/archive checks. Separate no-JavaScript
checks confirm all chapters remain visible without horizontal overflow.

Desktop and mobile screenshots were reviewed in both palettes. Browser QA
found and resolved the missing desktop appearance control and native hash
history entries that could leave the wrong concept rendered after Back.
A final phone review also prompted bringing each newly selected desk story's
photograph into view. Evidence is saved in `.local/about-stories-0138/`.
Four focused phone checks (390px and 320px, normal and reduced motion) confirm
bottom Next/Previous reveals the new chapter's opening photograph.

`pnpm validate` passes formatting, ESLint, strict TypeScript, all 130 unit
tests and the production build after the final phone interaction adjustment.
Final scoped diff review and whitespace checks pass. No dependencies,
production publication or commerce contract changes are included.
