# Task 0102 — Mobile popups and roomier Origins

Date: 2026-10-06

## Brief

Make mobile About and Origins read as popups over the current site instead of
full-page screens. Use inset, height-limited dialogs with visible background,
internal scrolling and persistent close controls. Carry that mobile framing into
Material & use and Cart so their backdrops are also reachable. Closing by an
outside click or tap, Escape, or the close control must return to the same
underlying view.

Give the homepage Origins Panorama room to breathe on phones: a useful regional
photograph, separated geography and caption, comfortable spacing, and full-width
actions. Preserve the existing typography scale and factual content. Keep the
Overview, Specifications and Shop layouts and desktop presentation.

## Boundaries

Retain native modal semantics, keyboard focus/return, reduced motion, existing
Origins history and reader behavior, private grower information, both themes,
and the mounted product/quantity/cart state. Lock background scrolling while
open. Inside interactions and drags must not dismiss a popup accidentally.
Apply consistent outside dismissal to the current dialogs; preserve the cart's
existing close action, purchase rules and the standalone Origins route.
No dependencies, new content claims, commerce changes or deployment.

## Verification

Check mobile at 320px and a wider phone size, both themes, with a desktop
regression check. Exercise About, Origins directory and region reading,
outside mouse/touch dismissal, Escape, close buttons, inside clicks, focus,
background scroll lock, history and selection continuity. Review the roomier
Origins tab and reachable actions, then run `pnpm validate` and inspect the diff.

## Result

Mobile About, Origins, Material & use and Cart now have visible 16px side gutters,
rounded borders and an 82dvh height limit. Content scrolls internally with close
controls kept available. Specification explanations retain their compact frame.
All five dialogs share deliberate outside-click/tap dismissal; native Escape and
existing close controls remain intact. Background scrolling is locked and restored.

The mobile Origins Panorama uses a 160–272px photo, separated geography/caption,
comfortable paragraph spacing and stacked full-width actions. Type sizes, facts,
other tab layouts and desktop presentation remain unchanged.

- `tests/mobile-popups.mjs` passed all six viewport/theme cases: 320×740,
  390×844 and 1440×900 in both themes. Checks cover close/Escape/outside dismissal,
  inside clicks and outward drags, keyboard focus, reader history/browser Back,
  scroll restoration, and retained product, quantity and mounted scene.
- Reviewed popup and Origins screenshots in `.local/mobile-popups-0102/`.
  A separate populated-cart check confirms reachable close and checkout controls.
  Browser commerce requests were mocked.
- `pnpm validate` passed formatting, lint, strict types, 70 unit tests and the
  production build. Reviewed scoped diffs and `git diff --check`.
