# Task 0166 — Field note popup composition

Date: 2026-10-18
Status: implemented; visual, source and focused behavior checks complete.

## Authority and scope

The owner requested a stronger design for the About Field note popups after
accepting Task 0163's photographic scroll layout. This bounded pass changes only
the canonical `field-record` presentation of `AboutFieldNotes`. The earlier
gallery presentation, About story routing, standalone Field note pages and
commerce remain unchanged.

The September 28 direction and October 6 client feedback remain evidence, not
instructions to add facts. Community activity stays separate from product
provenance. All titles, introductions, observations, captions, alt text and the
closing distinction come from the existing approved story content. No grower
identities, visit dates, equipment benefits or product-origin claims are added.

## Composition

- A permanent compact reader header retains Back to About and adds three local
  chapter controls. A fine active marker identifies the current chapter.
- The title and introduction sit directly above the broad opening photograph.
  Harvest then moves from a hillside photograph and observation to shared work,
  staggered details of people and collection bags, and the path at the field's
  edge. People & technology moves from the harvester to the person using the
  powersuit, then the wider viewpoint represented by the drone photograph.
- Photograph sizes and alignment vary with the story rather than repeating one
  text/image row. A fine vertical rule connects the chapters and follows the
  reader's existing scroll progress. Photography remains uncropped at its actual
  aspect ratio; all text stays visible in normal flow.
- Typography uses the existing 20 px heading, 14 px body and 10 px label bases,
  including locale increments. Mist, Blue hour and the existing surfaces remain
  unchanged. Chapter controls have 6 px corners and at least 44 px targets.
- Phones retain 16 px exterior gutters and the 82dvh height limit. Observations
  and photographs stack naturally; paired detail photographs become separate
  readable images. The close control and chapter navigation remain reachable.

## Interaction and lifecycle

Chapter buttons use `scrollTo` on the dialog, accounting for the sticky header.
They do not change the URL hash or browser history. An IntersectionObserver
rooted in the dialog updates `aria-current="step"`; a ResizeObserver refreshes
its reading region when the header changes size. Both observers and the pending
animation frame are cleaned up on unmount. Reduced motion uses immediate chapter
jumps and removes the marker transition and existing dialog entrance animation.

The native dialog, initial title focus, focus trap and restoration, close timer,
Escape handling, backdrop drag protection and background scroll lock are retained.
The existing history-driven close/reopen protection is untouched. Additional
chapter controls participate in the existing focus loop. Saved gallery readers
retain their original sticky navigation and composition.

## Verification

Scoped Prettier and ESLint pass. `tsc --noEmit --incremental false` passes.
Fresh browser contexts reviewed both stories at 1440 px, Harvest at 320 px and
People & technology at 390 px, across Mist/Blue hour and both motion preferences.
A Japanese Blue hour check at 320 px also passes. All images load at their full
aspect ratio; there is no horizontal overflow and chapter targets remain at
least 44 px high. Local jumps keep the story hash unchanged and update the
active marker, including the short final chapter at the bottom of a phone reader.

Evidence is in `.local/field-notes-0166/`. Focused desktop and phone behavior
checks pass for local chapter scrolling, unchanged hashes, active markers,
keyboard focus, Escape, outside dismissal, close controls and immediate
Back→Forward reopening. Background scroll and entry focus restore correctly.
Full repository validation is recorded with Tasks 0165–0167 in
`.local/validation-0165-0167.log`. No deployment is included.
