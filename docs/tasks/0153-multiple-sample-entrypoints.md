# Task 0153 — Multiple Sample Set entrypoints

Date: 2026-10-17
Status: Complete — local study, not adopted

## Authority and scope

The owner requests a new study with several entrypoints into the Sample Set.
Compare combinations of simultaneous entrypoints, retaining the earlier studies.
Keep samples after Explore matcha rather than on the opening homepage.

Create `/samples-entry-study` with Connected, Sample first and Quiet repetition
directions, previewed in the opened Explore experience and Shop. Combine a
primary sample entrance near the individual teas with supporting navigation,
information-panel, workspace or collection links. Every sample entrance leads
to the existing `/samples` page. Study controls stay separate from storefront
copy. Preserve the material, selected tea and purchase state while comparing.

Reuse the approved themes, mono type, powder images and known three 30 g contents.
No invented price, offer, product identity, stock, incentive or fulfillment claim.
Canonical pages and earlier studies keep their defaults. No production writes,
dependencies, deployment or commerce changes.

## Verification

Review all directions in both contexts and themes, desktop and mobile. Check
multiple simultaneous links and their destination, keyboard/touch access,
selection continuity, local theme behavior, route fallback and canonical pages.
Run targeted browser checks, `pnpm validate` and final diff review.

## Result

The new route compares three simultaneous entrypoint combinations in two real
storefront contexts. Connected uses a first selection/collection card plus a
text invitation; Sample first uses a wide photographic feature plus a workspace
or collection reminder; Quiet repetition uses compact rail and panel entrances.
All include Samples navigation, and all sample links lead to `/samples`.

Direction, context and appearance controls retain the mounted tea renderer,
selected product, information view and quantity. Hidden previews are inert and
do not register a product with Origins. Native study controls retain focus.
The theme is local to the study, and canonical defaults are unchanged.

The browser suite covers 15 scenarios and 48 direction/context/theme/viewport
combinations at 1440, 768, 390 and 320 px. Checks passed for link destinations,
keyboard and mobile navigation, selection continuity, focus, Origins context
isolation, Japanese and Traditional Chinese, query fallback and canonical pages.
The six affected scenarios were rerun after the final context/footer refinements.
Desktop and tablet matrices also passed a final bounding-box check keeping tea
names and the MATCHA subline clear of the Register code.
Mocked browser tests block writes and external requests. Screenshots were reviewed
at `/tmp/atoma-sample-entries/`.

The live browser initially encountered a transient catalog read failure. The
existing retry controls recovered all three real catalog teas in both contexts;
the study is open in the existing browser tab. No catalog logic was changed.

`pnpm validate` passes formatting, lint, strict types, 142 unit tests and the
production build. Scoped diffs and whitespace checks passed. No deployment,
dependency or commerce change.
