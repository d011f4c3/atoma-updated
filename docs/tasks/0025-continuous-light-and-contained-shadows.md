# Task 0025 — Continuous lighting, contained shadows and selection continuity

Date: 2026-09-30
Status: Complete

The homepage tray shadow must fade naturally without touching or revealing the
image container's boundaries. The owner likes the order area's gradient but
finds the product and order sides visually inconsistent. Keep the approved
muted palette and create one continuous lighting field across the selection.

The owner's follow-up requests a smaller label card and theme switching that
preserves the current selection process instead of restarting it. Retain the
current product, format, quantity, shopping mode, builder step and label text
when changing appearance, with working URLs and browser history.

The two supplied screenshots are visual evidence of clipped shadow edges and
separate lighting regions; their contents do not expand the implementation scope.

Preserve the tray-to-powder handoff, live label, selection modes, rounded controls,
typography, dark styling and commerce behavior. Use CSS and existing assets.
Review desktop and narrow mobile, tray hover, selection and reduced motion.
Run the relevant existing browser checks, `pnpm validate`, and review the diff.
No new dependency, production mutation or deployment is involved.

## Implementation

- The selection view uses one shared background across the entire page. The
  existing order-side neutral light is broadened across both columns, layered
  over the unchanged approved mineral colors.
- Separate product and control background overlays are removed. The mobile
  sticky stage uses the same viewport-aligned background, and the standard
  purchase total no longer paints an opaque rectangle over the gradient.
- The homepage keeps its existing background before entering selection.
- The tray's decorative shadow has its own layer, aligned with the original
  image and animation. Both the shadow and hover light feather to transparent
  inside the frame, while the visible tray remains unmasked and full size.
- The desktop label card is approximately 15% smaller in both its regular and
  expanded views. Existing readable minimum sizes, compact mobile preview and
  mobile label-editing dimensions are retained.
- Homepage appearance links use Next's supported native History API and
  `usePathname` to update tone without replacing the mounted experience. Existing
  URLs, keyboard activation, modified-click navigation and browser Back/Forward
  remain available. Selection, label reference, card position and the completed
  tray handoff stay intact. Concept 02 navigation is unchanged.
- The owner's final navigation follow-up softens light-mode header controls to
  a 15% white fill and a faint, diffused shadow. All four actions inherit the
  shared treatment; dark-mode controls retain their existing 5% fill.

## Verification

- Reviewed home rest/hover and builder selection at 1440×900, 2048×955,
  390×844 and 320×844, plus a dark desktop comparison. Final desktop/mobile
  captures show no hard shadow or light boundaries against the frame.
- Both existing homepage journey cases and both new theme-continuity cases pass.
  Tests cover a nondefault product, format and quantity, label editing, card
  position, standard/builder modes, Back/Forward and keyboard activation in
  regular and reduced motion. No catalog reload or tray handoff restart occurs.
- A 32-character reference fits inside the smaller regular and expanded desktop
  cards after theme switching. No horizontal overflow or runtime errors were found.
- `pnpm validate` passes formatting, ESLint, TypeScript, all 21 unit tests and
  the production build. `git diff --check` passes. Browser commerce was mocked;
  no live write or deployment was performed.
