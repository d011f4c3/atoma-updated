# Task 0210 — Shared storefront entrances and scroll reveals

Date: 2026-10-19

## Request and scope

Give the homepage, Samples and About a lively, coherent fade/reveal rhythm on
desktop and mobile. Make the main hero's initial entrance more distinct, then
introduce subsequent content smoothly as it enters the viewport. This extends
Task 0206's phone-only About direction to the three canonical pages.

Preserve page layouts, photography motion, product/material continuity, saved
tastings, cart behavior, themes and the separate purchase-button study. No new
loading gates, dependencies, commerce changes or deployment.

## Implementation

Use a shared one-shot IntersectionObserver enhancement and CSS entrance scale.
Initial text groups overlap short upward fades; the main headline gets a more
distinct rise. Visual groups use opacity only so existing image transforms and
sticky stages keep their geometry. Scroll groups reveal once, with smaller rises
and photographic fades. Text and controls do not wait for unrelated assets.

The homepage sequence begins as its existing loader leaves. Granular sample
content and the details action reveal after Explore; Samples stages its opening,
range cards, tasting tools and next-order content; About extends its earlier
phone rhythm to desktop. The three canonical footers join the same sequence.
Separate scopes retain completed state through selection and theme changes.

Keep visible content visible during hydration/history restoration, reveal focus
and anchor targets immediately, settle on reduced motion and preserve readable
fallbacks when JavaScript or observer support is absent. Do not add scroll
listeners, polling, per-frame layout reads or permanent layer hints for reveals.

## Verification

- 58 motion cases pass in Chrome and WebKit: 10 homepage, 16 Samples and 32
  About. Real animation traces show intermediate opacity and translation on
  both desktop and phone layouts, in both themes. Reviewed settled screenshots.
- Covered one-time playback, unchanged selection/material nodes and quantity,
  saved and unsaved tasting notes, keyboard access, anchors/history, late image
  arrival, live reduced-motion changes, no JavaScript and failed/missing observer
  support. All browser fixtures block external requests and network writes.
- Existing mobile About photo-motion checks retain zero steady-scroll layout
  reads, zero reads after writes and zero idle writes. The reserved-layout check
  now measures layout positions independently of the intentional 12px reveal.
- Safari pointer-opened About readers need an explicit return-focus target;
  focus capture now uses the activated story link. Keyboard-only rail alignment
  respects the site's input modality to avoid moving the reader's background.
  Final sequential Chrome desktop, WebKit desktop and WebKit mobile regressions
  pass exact URL, focus and scroll return, pointer focus styling and keyboard
  rail navigation.
- `pnpm validate` passes formatting, lint, TypeScript, all 213 unit tests and the
  production build. Final diff and whitespace checks pass.
- Browser evidence and traces: `.local/page-reveals-0210/`. No deployment.
