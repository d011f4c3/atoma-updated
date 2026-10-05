# Task 0021 — Unified tray to bag flow and themes

Date: 2026-09-30
Status: Photographic revision implemented and locally verified

The owner requests one in-place homepage experience combining the preferred
tray composition with Concept 02's product selection and purchase flow:
tray → matcha photograph → bag. The owner's latest correction explicitly chooses
the bag for this main journey and asks for more photographic material realism.
This supersedes the initial canister direction. Preserve Concept 02 and the
canister comparison route at `/concept-02/canister`.

Reuse the shared selection/configuration interface. Homepage Explore, the tray
and Matcha navigation open the material-choice step in place, without route
navigation. The tray shifts left and gives way to the selected material image;
changing matcha disperses and reforms the powder. Continue to quantity gathers
the material into the bag. Retain standard selection as an alternate mode,
optional material detail and label customization, real quantity/availability
rules, and the reviewed cart contracts. Returning to overview restores focus.

Soften the homepage dark surface to off-black. Both homepage themes must carry
through the shared configurator, material information, About and cart, including
auto-opening after Add. Powder and photographic fallbacks must not reveal a
light rectangle on dark. Preserve reduced motion and mobile purchase clarity.

The tray-to-material handoff must wait for the product renderer. Move the same
tray photograph to the product stage, dissolve the metal around its sampled
pigment, then reform that pigment into the selected material photograph. Keep
the source visible during cold loading, cancel cleanly when closed, and respect
reduced motion. Improve the existing responsive bag geometry, laminate,
reflections and paper label; this remains a packaging study, not an approved
physical package or a new purchasable variant.

Validate both themes, every entry point, in-place step transitions, state and
focus restoration, product/quantity/label changes, optional information, cart
states and graceful scene fallback. Review actual desktop/mobile composition
and motion, run the relevant browser checks and pnpm validate, and review the
final diff. No deployment, catalog mutation or checkout-boundary change.

## Implementation

- The shared homepage configurator explicitly uses BagScene in both themes;
  Concept 02 uses the same renderer, with the canister backup preserved.
- The initial sequential handoff and procedural bag were rejected in visual
  review by the owner. The revised handoff prewarms the renderer and moves the
  tray immediately when clicked. True cold loading holds the tray only at its
  destination until replacement pixels are available. Its metal dissolve and
  pigment morph overlap, without the previous fixed 1.5-second control lock.
  Reopening resets the source geometry while retaining product, format and
  quantity.
- Product choices remain responsive during the material transition. Quantity
  and standard mode become available during the powder reveal. Loading keeps the close
  control visible and focused; revealing selection focuses its heading. Escape,
  resize, reduced motion and interrupted loads resolve without trapping controls.
- The procedural foil bag is replaced by matched photographic cutouts with
  real image texture and photographed lighting. Closed and open states share
  the same paper placement. Live label ink composites over the image's paper,
  retaining its shading and grain; quantity arrangements and label inspection
  remain interactive. These generated assets are packaging studies. Their
  prompts and provenance are in [the image record](../references/bag-photographic-images.md).
- Both themes use masked powder fallback photography. A failed renderer waits
  for the photograph and mask to load before releasing the tray; image failure
  presents the existing readable material/format reference instead. Bag stages
  use the same labeled photographic assets when WebGL is unavailable.

Visual captures are local under `.local/qa/handoff-review/`,
`.local/qa/bag-realism/` and `.local/qa/tray-bag-handoff/`. Desktop and mobile
review confirmed coincident tray/pigment framing, no blank handoff or pale
photograph rectangle, and retained purchase visibility. Commerce checks use
mocked requests; no checkout or production mutation is part of this task.

The photographic revision's `pnpm validate` passed formatting, ESLint, strict
types, all 15 unit tests and the production build. The complete browser suite
passed **27/27** with all commerce requests mocked. Handoff checks now require
visible motion within 200 ms and warm completion within 1.3 seconds; they verify
that controls unlock during the overlapping reveal. They also cover cold-load
cancellation, immediate reopening, both themes, photographic label/quantity
changes and graceful fallback. Captures are in `.local/qa/tray-bag-responsive/`.
`git diff --check` passed. Existing checkout gates and the canister backup remain
intact; nothing was deployed.

The independent timing matrix passed 8/8 (warm and gated cold loads in both
themes at 1440×900 and 390×844). Warm movement was first sampled at 69–84 ms,
controls unlocked at 721–740 ms, and the handoff finished at 965–972 ms. The
gated cold cases retained visible tray pixels while waiting at the destination.
Review captures are in `.local/qa/handoff-latency/`.

Label typography follow-up: reduce the MATCHA heading from 228 to 160 drawing
units and give the main ruled groups more space above and below their content.
Rebalance the format and reference type to preserve the paper margins, while
retaining all label content, photographic texture and live customization.
`pnpm validate` passed again after this typography-only change.
Desktop/mobile captures of all three labels and a 32-character reference are
kept in `.local/qa/label-spacing/`; label content stays inside the paper margins.
