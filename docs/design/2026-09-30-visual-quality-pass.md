# Visual and design quality pass — 2026-09-30

The owner requested a visual and design quality pass after Task 0019. The review
uses the current product-as-material direction, latest September feedback and
supplied label references. The tray homepage remains the preferred entrance;
this is a refinement pass, not a new concept or a release.

## Review and corrections

Reviewed dark/light homepages, in-place selection, both Concept 02 modes,
material changes, powder gathering, quantity composition and label editing.
Screenshots covered 1440 × 900, 1280 × 720, 820 × 1180 and 390 × 844; browser
regressions also covered 320 pixels. An independent reviewer assessed hierarchy,
readability and navigation. All automated commerce writes were mocked.

- The homepage's nested panel hid buying controls and did not clearly invite
  further exploration. Its price and purchase action now remain visible on
  desktop. Explore material focuses the first property and brings the complete
  profile into view; Format & quantity reveals and focuses those controls.
- The central material information was too small. Values are now 13px and
  explanations 14px, with an explicit property-selection cue. At mobile widths,
  a single profile sits inside the controls before purchase. Its active
  comparison persists across product, mode and viewport changes.
- Label customization lacked visual consequence and legibility. Its scene now
  moves to a close, frontal view of one vessel. The personal reference is centered
  and larger, with two-line wrapping for longer text. Opening the vessel pulls
  back; leaving label editing restores the actual quantity arrangement. Desktop
  framing contains the complete tin; mobile focuses on the complete printed sheet.
- Unavailable builder choices now disclose availability beside their names while
  remaining explorable. The deeper profile caption no longer includes internal
  implementation wording.

The existing blue palette, typography family, tray and text-resolution behavior
remain. Contrast checks found approximately 4.72:1 for muted text and 9.38:1 for
primary text against the blue surface. No horizontal overflow or runtime errors
appeared in the reviewed desktop, tablet and mobile captures.

## Verification

The expanded browser suite passed 19/19 after the layout and label changes.
The final Explore material shortcut then passed both focused homepage cases,
including keyboard focus and unobscured access to all seven properties and
format controls. Scene checks covered normal/reduced motion, long references,
open/close, restored quantity and the existing WebGL fallback.

The final `pnpm validate` gate passed formatting, lint, strict types, 15/15
commerce tests and the optimized production build. The final diff was reviewed
and its whitespace check passed. Review captures are local
under `.local/qa/design-pass/`, `.local/qa/label-inspection/` and
`/tmp/atoma-purchase-layout-review/`; they are not production assets.
