# Task 0201 — Mobile Sample Set exploration and Compact adoption

Date: 2026-10-19

## Request and scope

Explore a cleaner way to view the Sample Set on phones. The current homepage
flow repeats the three contents beneath the pouch captions, then combines
tasting, credit and ordering text into a long stack. Use the accepted individual
matcha flow as a reference for clear sections and optional detail.

Create `/samples-mobile-study`, with shareable `layout` and `tone` parameters.
Compare the original layout with three phone-only treatments: Tabs, Compact
and Reveal. The owner selected Compact. Apply it to the canonical homepage's
mobile Sample Set view in both themes, and make it the default study choice.
Keep `/samples`, desktop and earlier studies unchanged. No release is included.

## Design and implementation

- Keep the existing pouch photography first, with working label inspection.
- Tabs separates Overview, In the set and Order, echoing individual matcha.
- Compact keeps the order visible beneath the credit summary.
- On the homepage, Compact removes the repeated contents list and long
  introduction. Pouch captions, the short credit summary and visible purchase
  controls provide the main flow; the underlined details link remains available.
- Reveal opens the order in place when requested, keeping browsing brief.
- Present the contents once in the new treatments. Keep the approved ¥4,500
  credit, first eligible wholesale order of at least 1 kg, shipping, emailed
  code and same-email terms accessible through the existing details surfaces.
- Preserve one mounted purchase model, imagery and purchase component when
  comparing options. Quantity, availability, catalog failure/retry, refresh,
  destination review and cart rules still come from the existing commerce path.
- Use native buttons, visible focus and 44px touch targets. Hidden content is
  excluded from keyboard navigation. Respect reduced motion and maintain
  popup focus/scroll return. Study appearance stays independent of the site.
- Keep Reveal's purchase heading stable when retrying a failed catalog load,
  so its focus target remains visible and quantity controls do not move on blur.
- No new assets, dependencies, product claims, Shopify settings or deployment.

## Verification

- `pnpm validate` passed: formatting, lint, strict TypeScript, all 202 unit
  tests and the production build.
- `tests/samples-mobile-study.mjs` passed all 11 isolated browser scenarios:
  canonical Compact at 320px in both themes; canonical desktop at 1440px;
  study layouts at 320px and 390px in both themes, 440px Japanese and 1440px;
  failed catalog recovery with pending-add protection; and unavailable offers.
- Verified quantity, totals, selected tea/format and mounted purchase, imagery
  and material nodes survive study navigation. Study appearance does not change
  the saved storefront theme. Hidden panes stay out of the keyboard/role tree;
  details and label popups restore focus. Reveal retry retains a visible focus
  target and the first quantity click works after recovery.
- Browser checks cover normal and reduced motion, no horizontal overflow,
  visible button labels, desktop type/layout preservation and 44px study
  controls. All commerce requests use fixtures; no external writes were made.
- Reviewed final mobile screenshots and diff. Evidence is under
  `.local/samples-mobile-study-0201/browser/`; validation output is
  `.local/samples-mobile-0201-validate.log`.
