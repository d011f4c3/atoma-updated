# Task 0284 — Dark default and homepage Sample Set links

Date: 2026-10-23
Status: In progress

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
