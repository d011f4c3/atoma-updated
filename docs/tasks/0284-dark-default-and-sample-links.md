# Task 0284 — Dark default and homepage Sample Set links

Date: 2026-10-23
Status: Complete

## Owner direction

Make dark mode the default. All homepage Sample Set links, including the hero,
should lead to the canonical `/samples` page.

## Scope

- Default missing or invalid theme cookies to Blue hour dark; honor saved light
  and dark choices and retain the existing in-place theme switch.
- Route desktop/mobile hero, lower-section, ordering and application-view sample
  invitations to `/samples`, including the homepage sample reader's order action.
- Reuse shared guarded links so canonical page navigation works while application
  exploration stays in place. Preserve existing sample button sizing.
- Preserve independent study destinations, legacy selection URLs, layout, motion,
  localization and commerce state. No deployment or live commerce writes.

## Verification

Check missing, invalid and explicit theme preferences, switching and reload;
desktop/mobile sample destinations and actual page transitions; application
navigation, sample-reader dismissal/order, saved-study destinations and purchase
guards with isolated browser fixtures. Run `pnpm validate` and review the diff.

## Result

- Missing/invalid preferences now start dark; explicit light and dark preferences
  remain respected, including switching and reload.
- All ten homepage Sample Set links use `/samples`, including the responsive
  compositions and product popups. The sample reader's order action also opens
  the canonical page after closing its dialog.
- Canonical navigation retains native Back/Forward scroll restoration. Verified
  lower-page return, retained product quantities and pending-purchase guards.
- Desktop 1440 px and mobile 390 px browser flows and both focused mobile
  regressions pass. All four server theme cases pass. `pnpm validate` passes
  formatting, lint, types, 256 unit tests and production build.

Evidence: `.local/defaults-0284/`. No deployment or live commerce writes.
