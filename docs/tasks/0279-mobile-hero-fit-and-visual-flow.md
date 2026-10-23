# Task 0279 — Mobile hero fit and lighter shopping sections

Date: 2026-10-23
Status: Complete

## Owner direction

The mobile hero still feels large and cut off. The supplied iPhone screenshot
shows the secondary action meeting the browser controls. The owner also asks
to remove the redundant “Three matcha · 20 g each” mobile label, simplify the
text-heavy Sample Set section, and give the closing ordering process visuals.

## Scope

- Scale the mobile heading and complete application images down. Bound image
  size and spacing by the usable small viewport height, including shorter views
  with browser controls. Keep readable 16 px text and reachable 44 px controls.
  Cap minimum hero height on tall phones so smaller imagery does not leave a
  large empty band below the actions; the new sections can enter naturally.
- Preserve the three-application composition, approved image crops, stationary
  entrance, all hero information, both CTAs and responsive enlarged-text flow.
- Simplify the mobile Sample Set to its visual, exact named contents and sizes,
  visible approved credit and action. Remove the duplicate count/weight label
  and lengthy introduction; retain desktop content.
- Make mobile Sample → Choose → Reorder visual and concise using existing
  assets. Preserve exact named 1 kg links, navigation guards and localized text.
- Preserve Task 0278's uncommitted sections, popup/history/quantity continuity,
  desktop and saved studies. No new facts, assets, dependencies, backend work,
  deployment or live commerce writes.

## Verification

Compare Chrome and WebKit at 440×780, 390×700 and 375×667 usable browser sizes,
with all three whole objects and both actions visible and at least 24 px below
the secondary action. Review 320×568 natural scrolling, tall phones, both themes,
Japanese and enlarged text. Review the lighter Sample Set and visual ordering
sections, retain popup and commerce tests, compare desktop and check motion.
Run focused checks, `pnpm validate` and final diff review. Evidence:
`.local/mobile-hero-fit-0279/`.

## Delivered

The mobile heading is capped at 28 px, and the complete application images use
height-aware limits. Smaller bounded gaps and caption padding keep the same
staggered composition together. Body and action text stay at 16 px; tighter
description tracking prevents a stranded third line on 375 px phones. Minimum
hero height is capped so tall screens reveal the next section naturally.

The mobile Sample Set now shows the trio, three named 20 g contents, visible
credit and one action. Its comparison paragraph and duplicate count label are
removed. The closing process uses Sample, Choose and Reorder visuals with a
short heading, followed by the existing exact named 1 kg links. Desktop content
and the remaining mobile sections retain their layout.

## Verified

- Chrome and WebKit agree on layout. Both actions fit with 96.5 px of bottom
  clearance at 440×780, 47 px at 390×700 and 26.4 px at 375×667. Whole objects,
  readable labels and comfortable touch targets remain intact. At 320×568,
  readable content uses natural scrolling; no horizontal overflow or clipping.
- All 15 mobile browser cases pass, including the new usable-height checks,
  section contents and visible credit, exact product links, retained quantities,
  focus/scroll/history return, pending-commerce guards, Japanese, 200% text,
  responsive resizing and loading/image failures.
- Desktop/mobile hero motion checks pass. Reviewed the final first view and
  lighter mobile sections in both engines, including enlarged-text step layouts.
  Desktop geometry is unchanged in Chrome and WebKit.
- `pnpm validate` passes formatting, lint, types, all 256 unit tests and the
  production build. Final diff review and `git diff --check` pass. Fixture
  traffic made no live commerce writes; no deployment ran.
