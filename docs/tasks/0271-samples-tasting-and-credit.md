# Task 0271 — Clear sample credit and useful tasting tools

Date: 2026-10-23
Status: Complete

## Owner direction

Refine `/samples` on mobile, show the price once with a small per-set label,
and make the first-wholesale-order credit visible before purchase. The owner
clarifies that Inside the set is already satisfactory: focus the lower-page
refinement on tasting tools and what follows. Tasting tools should be apparent
and easier to use on both desktop and mobile; remove the awkward bottom mobile
“Order the set” callout.

## Scope

- Keep the approved Inside the set presentation unchanged.
- Remove the canonical gallery's inspection prompt at the owner's request;
  retain direct pouch interaction, keyboard access and label-dialog return as
  a discoverable extra.
- Put the approved ¥4,500 first-eligible-order credit and 1 kg minimum in plain
  view near purchase, with emailed-code guidance. Preserve the existing credit
  rules and live catalog price; do not promise a cash refund, an unconditional
  free set or an exact fixed credit in every currency.
- Show the unit price once with a small per-set label. A meaningful total may
  appear when more than one set is selected. Retain quantity and stock guards.
- Remove the mobile gate hiding tasting tools. Use a focused note editor with
  clear matcha choices, saved progress, immediate save and a next-matcha action.
  Keep recipes, comparison and export accessible without competing with notes.
- Preserve unsaved drafts, explicit local saves, clearing, validation, exports,
  exact product links and navigation/purchase guards.
- Simplify the mobile next-order section with a short introduction and readable
  vertical choices. Remove its decorative image interruption and bottom
  set-order callout on phones. Retain saved-choice and exact 1 kg behavior.
- Preserve both themes, localization, reduced motion and earlier studies.

## Verification

Use isolated commerce fixtures for ready/unavailable/failure states, quantity
and price behavior, visible credit, label-dialog return, note continuity,
comparison/export and pending-navigation guards. Review mobile/desktop in both
themes plus narrow localized/enlarged-text layouts. Run focused browser checks,
`pnpm validate` and final diff review. No real orders or deployment.

Evidence: `.local/samples-0271/`.

## Result

The canonical Sample Set now presents its wholesale credit above the price,
with the first-eligible-order minimum and emailed-code guidance visible. The
price appears once with a smaller per-set label; selecting multiple sets adds
the exact total. Pouches remain accessible label readers without an inspection
prompt. Inside the set is unchanged.

Tasting tools are directly visible on both screen sizes. One selected-matcha
workspace contains notes, Save and Next matcha, with saved progress and optional
recipe/preview/export controls. Comparison puts application and sample size in
the matcha headings, bringing saved recipes and notes closer. Narrow or enlarged
layouts stack the controls to keep labels readable.

Mobile continues into a concise Ready for 1 kg section with vertical choices,
the exact selected product link and optional device save. Its decorative photo
and bottom Order the set callout no longer interrupt the flow.

- All 19 focused browser cases passed: responsive layouts, visible credit,
  unit/total pricing, USD handling, pouch focus and quantity return, unavailable
  and pending states, unsaved drafts, save/clear, comparison and PNG export.
- Reviewed desktop and phone layouts in both themes, plus 320 px English and
  Japanese at 200% text. Final narrow controls fit the configured viewport and
  their content bounds. The approved contents section is unchanged.
- Formatting, lint, types, all 256 unit tests and the production build passed.
  Final diff review found no outstanding issue. All commerce writes were
  intercepted by browser fixtures; no real order or deployment ran.

Evidence includes `browser-results.json`, `final-tests/`, `final-tasting-rest/`,
`final-tasting-small/`, `final-small/`, `review/`, `tasting/stacked-*.png`,
`final/` and `validate.log`.
