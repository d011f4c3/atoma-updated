# Task 0269 — A balanced mobile homepage entrance

Date: 2026-10-23
Status: Complete

## Owner direction

The mobile homepage now feels crowded. The owner requests a balanced layout and
composition for the first thing visitors see. The supplied screenshot shows the
canonical homepage, rather than the recently refined Wholesale collection.

## Scope

- Rebalance the canonical mobile hero. Replace the large empty band below
  navigation and tightly packed central group with a deliberate introduction,
  three complete application objects and one clear Sample Set action.
- Refine image scale and spacing while retaining all three application labels,
  product codes, exact approved crops, direct product learning and sampling.
- Keep body type readable, allow natural vertical growth on short screens and
  with enlarged/localized text, and preserve both palettes and authored motion.
- Preserve desktop geometry, all existing shopping interactions, selection,
  focus/history/scroll return and image/readiness fallbacks. No new copy, facts,
  assets, routes, dependencies or commerce changes.
- Preserve preceding changes and the user's existing study-route deletions.

## Verification

Inspect matched 390×844, 440×956 and 320×568 phones in both themes, enlarged
Japanese and short screens. Check introduction offset, breathing room between
objects/captions/action, full-object containment and first-view reachability on
normal phones. Use isolated catalog/cart fixtures for all application entrances,
sampling, retained state and motion/fallback checks. Compare desktop at
1440×900 and 1280×720. Run relevant browser checks, `pnpm validate` and final
diff review. Evidence: `.local/hero-0269/`.

## Result

The mobile introduction is anchored 59–64 px below navigation on normal phones,
instead of the previous 112–147 px. The heading is slightly smaller and capped
at 32 px. Whole-object imagery is modestly reduced, with more horizontal room
and responsive space between tea and recipe. The latte occupies that middle
space, keeping the three objects in a balanced staggered composition.

The introduction and applications have 35–40 px of separation, followed by
43–48 px before the Sample Set action. All three choices and the complete action
fit at 390×844 and 440×956. At 320×568, readable content uses a short scroll
(121 px to see the complete action). Text and controls grow naturally at 200%.

- Eight mobile browser cases passed, covering all application taps, exact
  quantity/focus/history/scroll return, responsive Sample Set learning, localized
  and enlarged text, readiness and failed images.
- Seven focused motion cases passed: desktop/mobile loader and reveal, reduced
  motion, failed images, no JavaScript and blocked-script fail-open.
- Ten matched viewport captures have no overflow or overlapping applications.
  Desktop geometry is identical at 1440 and 1280 px in both themes. Three desktop
  screenshots are pixel-identical; the fourth differs by only 27 image pixels,
  each by one color level, with unchanged layout and controls.
- `pnpm validate` passed: formatting, lint, types, all 256 unit tests and build.
  Final source diff reviewed. Fixture traffic made no real commerce writes;
  no deployment ran.

Evidence: `browser-results.json`, `final/`, `mobile-tests/`, `motion/` and
`validate.log` under `.local/hero-0269/`.
