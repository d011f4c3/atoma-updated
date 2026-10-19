# Task 0152 — Sample-first selection panels

Date: 2026-10-17
Status: Complete — local study, not adopted

## Authority

The owner clarifies that the requested study concerns the whole selection card
beside Culinary, Barista and Ceremonial, and supplies a screenshot of that row.
Create more arrangements like this, with Sample Set first and visually primary.
This supersedes the title-only interpretation of Task 0151. Keep the earlier
studies available; compare before adopting a new live storefront composition.

## Scope

Create `/samples-panel-study` in the opened Explore matcha experience. Compare
four arrangements of the left selection group: Lead card, Shared row, Feature
panel and Split group. Sample Set is selected initially and shows its three
materials and shared purchase information. The actual tea choices remain usable;
returning to a tea preserves its information tab, format, quantity and reference.
Keep both scenes and commerce state mounted while switching choices or layouts.

Use the supplied screenshot's restrained card family, existing powder imagery,
mono type scale, themes and confirmed 3 × 30 g contents. The Sample Set remains
a separate presentation selection, never a synthetic catalog offer. Preserve
the current unavailable state until an actual reviewed Sample Set offer exists.
No new price, product code, availability, provenance or commerce promises.

The canonical homepage and `/samples` remain unchanged. No deployment or
production writes. Verify desktop/mobile, both themes, keyboard access, default
sample priority, active/hidden surfaces, selection continuity and route fallback;
run `pnpm validate` and inspect the scoped diff.

## Implementation and verification

Four layouts are available through the study selector and `?layout=` links.
The sample choice uses the confirmed contents and guarded shared purchase
component; individual teas keep their original catalog, tab and order state.
Compact tea cards stack their photographs above the name when the group is
narrow. Narrow Split cards omit redundant captions to keep their type readable.

`tests/samples-panel-study.mjs` passes all 11 scenarios, including 32 combinations
of four layouts, four widths (1440, 768, 390 and 320 px), and both themes. Checks
cover keyboard focus, same-tea quantity/tab continuity, mounted surfaces, hidden
and inert controls, Japanese and Traditional Chinese, retry focus, query fallback
and unchanged canonical pages. API reads were mocked and writes blocked.
Screenshots were reviewed at `/tmp/atoma-sample-panels/`.

`pnpm validate` passes formatting, lint, strict types, 142 unit tests and the
production build. Final scoped formatting and `git diff --check` pass. No package
changes, deployment or production writes.
