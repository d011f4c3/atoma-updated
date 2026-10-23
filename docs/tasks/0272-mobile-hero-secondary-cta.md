# Task 0272 — Mobile hero secondary CTA

Date: 2026-10-23
Status: Complete

## Owner direction

The secondary CTA is missing from the hero on mobile. Restore the desktop's
Explore by Application action in the canonical mobile hero.

## Scope

- Place a quiet secondary action beneath Start with the Sample Set, using the
  existing localized label and `/?view=matcha` in-place destination.
- Reuse the shared navigation component and purchase/navigation guard. Keep
  keyboard focus, history, selected application and commerce state intact.
- Preserve the balanced three-application composition, primary action,
  imagery, both themes and desktop. Allow natural scrolling on short screens.

## Verification

Use isolated browser fixtures to inspect phone sizes, both themes, enlarged
localized text, navigation and history return. Check the link remains blocked
during a pending purchase. Run `pnpm validate` and final diff review. Evidence:
`.local/hero-0272/`.

## Result

Explore by Application now appears below the Sample Set button as a quiet
44 px secondary link. It opens the existing application view in place, using
the same localized label and navigation guard as the other hero actions.

- Six phone captures passed at 320, 390 and 440 px in both themes. Both CTAs
  fit the normal 390×844 and 440×956 first views; short phones scroll naturally.
- In-place navigation, Back, retained product quantity and pending-purchase
  navigation blocking passed. English and Japanese at 320 px with 200% text
  fit without horizontal overflow.
- `pnpm validate` passed formatting, lint, types, all 256 unit tests and build.
  Final diff review passed. Desktop hero code and geometry are untouched.
- Browser fixtures intercepted commerce traffic; no real order or deployment.

Evidence: `browser-results.json`, `tests/report.json`, `final/` and `validate.log`.
