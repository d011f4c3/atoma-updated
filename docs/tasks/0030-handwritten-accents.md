# Task 0030 — Small handwritten accents

Date: 2026-09-30
Status: Complete

The owner likes Antro Vectra on the personal reference and requests small
accents elsewhere. Apply it to the short Matcha powder caption on the homepage
and product-purpose captions in the shop. Preserve their copy, hierarchy,
primary headings, controls and commerce behavior. Keep both themes readable.

Maintain the requested periodic character resolution while preserving joined
script lettering: render connected words as complete measured units. Keep the
existing accessible text, visible-content scheduling and reduced-motion support.
Verify script rendering, hover/periodic playback, wrapping on mobile and the
full repository gate. No new font assets, dependencies or deployment.

Verified connected-word Antro rendering at 24px on all three shop captions;
observed a periodic pulse resolve fully without changing measured text widths.
Reviewed dark desktop and light 390px layouts without horizontal overflow.
The existing reduced-motion path and accessible copy remain intact. Added a
focused mocked-browser regression case; syntax/lint passed, standalone harness
not executed. `pnpm validate` passed all checks and 26 unit tests. Final source
review and `git diff --check` passed.
