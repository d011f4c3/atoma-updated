# Task 0199 — Consistent mobile text hierarchy

Date: 2026-10-19

## Request and scope

Refine text scale and hierarchy across the canonical mobile storefront, including
About and the Origins popup shown in the owner's reference. Preserve the approved
desktop styling, existing photography, motion, content and commerce behavior.

## Direction

Use shared mobile roles: 24px page titles, 20px section headings, 16px item
headings, 14px prose, 12px supporting text and actions, and 11px metadata. Keep
editable fields at 16px. Use rem units with the existing locale adjustment.
Compact captions may use the supporting role when a larger heading would break
the photographic composition. Give prose natural tracking and 1.7 line height;
retain uppercase technical labels and distinct grouping.

Apply these roles only at phone widths, within canonical page scopes. Keep saved
studies, desktop layouts, selection, cart, popup dismissal and scroll continuity.
No new content, dependencies, deployment or production writes.

## Verification

- Compared computed type and element geometry before/after at 1440px across
  Home, About, Origins, Shop, Samples and a product page, plus the homepage
  sample flow and About reader. Desktop snapshots are identical.
- Reviewed mobile captures at 320, 390 and 440px; all canonical routes and the
  Origins/About popups fit without horizontal overflow. Both themes pass at
  320px. About additionally passes English/Japanese text checks at all three
  widths. Sample photographs still precede the homepage purchase panel.
- All eight `tests/about-scroll.mjs` cases pass, including phone/desktop motion,
  reduced motion, no JavaScript, dynamic preferences and popup history/focus/
  scroll restoration. Commerce requests use fixtures; writes are blocked.
- Checked all four homepage product views at 320/390px in both themes, including
  specification and Material & use popups. Origins search, clearing, country/
  region navigation, the photograph reader and return to the selected Shop view
  remain usable. Compact four-tab labels retain their existing size to fit the
  narrowest row; their 44px touch height is unchanged.
- Canonical About snapshots remain identical after scoping the new rules away
  from its saved preview; that preview keeps its earlier phone type hierarchy.
- `pnpm validate` passes formatting, lint, strict types, 202 unit tests and the
  production build. Evidence is in `.local/mobile-type-0199/`; final diff review
  and `git diff --check` pass.
