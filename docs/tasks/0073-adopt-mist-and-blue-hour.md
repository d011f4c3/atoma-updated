# Task 0073 — Adopt Mist and Blue hour site themes

Date: 2026-10-05
Status: Complete

## Requested outcome

Adopt both approved color explorations as the regular site's new themes:
Mist for light and the darker, revised Blue hour for dark. Carry the same
palette through the homepages, collection, retail product pages, Origins,
navigation and shared dialogs. Retain the existing Dark / Light controls.

Keep one canonical palette definition shared with `/color-study`. Apply it only
to the regular site and that comparison; preserve independent concepts and saved
layout studies. Maintain tray/powder/label choreography, typography, photography,
left Slides, right Tabs, Split Origins, Current refined Shop, selection, format,
quantity, reference and cart behavior. No commerce contract or product fact
changes, new dependencies, production writes or deployment.

## Verification

Compare the adopted homepages with the approved explorations on desktop and
phone. Verify theme switching without resetting model/renderer state, dedicated
retail and Origins routes, shared dialogs, keyboard/reduced-motion behavior and
saved concept isolation. Use mocked commerce requests. Run `pnpm validate` and
review the scoped diff and `git diff --check`.

## Result

The main dark homepage uses revised Blue hour and `/light` uses Mist. Collection,
retail product pages, standalone Origins, the Origins directory/reader and shared
About/material/reference/cart surfaces follow the active theme. The existing
Dark / Light controls remain available and keep the selected order mounted.

Palette values now live in `src/app/storefront-themes.css`, shared by the regular
site and `/color-study`. Explicit page markers scope these values and leave saved
concepts and layout studies independent. Removed the old light retail overlay
and resolved hardcoded Origins/cart colors. Mist text selection uses the light
surface against dark ink for readable highlighting.

Reviewed both themes at 1440×900, 1366×768, 390×844 and 320×700. All six palette
browser cases and all six retail cases pass, covering exact parity with the
approved explorations, retained product/format/quantity/reference and renderer,
themed dialogs, Origins return, pending locks, mocked cart payloads and saved
route isolation. Screenshots are in `.local/qa/adopt-palettes/`.

`pnpm validate` passes formatting, ESLint, TypeScript, all 60 unit tests and the
production build. Reviewed scoped changes and `git diff --check`. Concurrent
silver-bag work was preserved; no live commerce writes or deployment occurred.
