# Task 0223 — Clarify the current homepage entry

Date: 2026-10-20
Status: Implemented and verified locally

## Authority and sequence

The owner requests the original six recommended client-feedback work groups
before revisiting the CX study. Both original DOCX files were reread in full,
including their tables. Their design requests are evidence; the owner's message
authorizes this frontend pass. Production release and commercial changes remain
outside scope.

The original six groups map to the backlog as follows:

1. Homepage message and Sample Set entry: F02, this task.
2. Distinct application imagery: F03, with a source/replacement register.
3. Comparison, specifications and navigation: F04–F07.
4. Tasting cards to the named 1 kg product: F08.
5. Mobile reading, scrolling, motion and loading: F09–F11.
6. Separate commerce, analytics and operations readiness: C01–C04.

Implement and verify one bounded slice at a time. Preserve the existing CX
study as an unapproved draft until these groups have been reviewed.

## This slice

Keep the current homepage's split composition, silver bag, typography and
approved palettes. Replace its ambiguous opening copy with the client's
application-led message, a primary Sample Set link, the three 20 g contents
and a secondary application-exploration action. Make tea service, lattes and
recipes/baking visible entries using existing canonical identities.

Main actions must work before decorative imagery finishes loading. Use plain,
immediately readable action labels. Preserve the existing product explorer,
selection, cart, language and destination contracts. Saved studies retain
their independent presentation.

## Verification

Capture the current homepage before editing. Check all three application
destinations, Sample Set entry and existing explorer with controlled catalog
fixtures; block writes and external traffic. Review 360/390/768/1440 px, both
themes, keyboard focus and slow/failed imagery. Check all four locales and
retain the 320 px regression. Run focused behavior checks, `pnpm validate`
and final diff review. No deployment.

## Result

The current split hero now has the application-led copy, a Sample Set primary
action, the three 20 g contents and three direct links to canonical product
pages. The secondary action opens the existing tea Overview rather than
repeating the Sample Set entrance. The canonical loader no longer blocks
these actions; saved study loaders and the bag renderer are retained.

Before evidence covers 28 audited screens and 52 captures in
`.local/client-feedback-0223/before`. After captures and the homepage harness
cover eight profiles, including 360 × 740, 390 × 844, 320, 768 and 1440 px,
both palettes and all four languages. All entries fit the first screen; exact
product destinations, keyboard entry/return, retained selection/cart and the
primary action during slow imagery passed with isolated commerce fixtures.
Representative desktop and mobile captures were visually reviewed.

`pnpm validate` passed formatting, ESLint, strict types, all 218 unit tests and
the production build. Final diff review confirmed the new entry is canonical
only and the unapproved CX study remains unchanged. No deployment.
