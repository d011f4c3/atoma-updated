# Task 0033 — Refined dark storefront

Date: 2026-09-30
Status: Complete

The owner finds dark mode unsatisfying and asks for a luxurious, refined,
pristine and clean treatment. Refine the current dark homepage, Explore / Shop,
dedicated shop and their shared information/cart surfaces as one visual system.

Use neutral charcoal rather than the current green-grey base, restrained broad
studio lighting, soft silver type, quieter dividing rules and matte control
surfaces. Keep the matcha's actual photographic colour and the pale paper label.
This is an interpretation of the owner's direction, not a new brand claim.

Preserve the approved light theme, mono typography, Antro accents, six-pixel
controls, dark filled / light outlined choices, periodic text and purchase
interaction, in-place selection and desktop right-only scroll. Keep all commerce
contracts, reduced-motion behaviour and readable keyboard focus. No new assets,
dependency, service, deployment or live commerce mutation is part of this pass.

Review dark hero, Explore, Shop, material information and cart at desktop/mobile,
compare light for unintended changes, check text contrast and responsive bounds,
run `pnpm validate`, and inspect the scoped changes.

## Implementation and verification

- Shared night palette now drives the current hero, selection, collection and
  cart: neutral charcoal, soft silver text, restrained ambient light and finer
  dividing rules. The hero grid/corner marks recede, the tray receives a
  contained shadow and the entry action uses the same pale emphasis as purchase.
- Dark navigation and selection surfaces retain subtle fills and six-pixel
  corners. The collection has quiet matte cards. Material and cart drawers share
  a raised neutral finish and backdrop; pale label paper, ink and edges are
  neutralized only in dark mode. Light palettes and geometry remain unchanged.
- Reviewed hero, Explore, Shop, full material information and existing cart at
  1440×900. Reviewed the dark hero, collection and material access at 390×844,
  including reduced motion. No horizontal overflow; the home hero remains one
  viewport. Compared the light hero and verified its palette and entry treatment.
  Temporary viewport and motion overrides were restored. No cart writes occurred.
- Calculated text contrast on the brightest drawer background: primary 14.03:1,
  muted 6.95:1. On the darkest paper tone, brand 4.95:1 and application 5.27:1.
  Interactive focus retains full ink contrast rather than the quieter divider.
- `pnpm validate` passed formatting, ESLint, TypeScript, all 26 unit tests and
  production build. Reviewed the scoped CSS and `git diff --check` passed.
  Existing standalone browser regression harness was not rerun for this visual
  CSS pass; the interaction and visual checks above were performed in the browser.
