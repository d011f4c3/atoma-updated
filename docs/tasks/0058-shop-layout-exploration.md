# Task 0058 — Interactive Shop layout exploration

Date: 2026-10-01
Status: Complete

## Requested outcome

Create a Shop section exploration alongside the saved selector and Origins
studies. Interpret this as the interactive homepage's Shop view, following the
immediately preceding Origins exploration and adoption. Keep the current
homepage, retail routes and other studies unchanged.

Add `/shop-study` with a compact comparison toolbar and four options:

- Current: the established homepage purchase panel.
- Order sheet: a restrained ruled form with compact order details.
- Counter: a quantity-led composition with adjacent format information.
- Checkout card: a contained order surface with grouped purchase controls.

Use the accepted Index/Brackets hierarchy, Split Origins and current themes,
rounded controls and small mono typography. Retain the powder and movable label
on desktop. Make essential purchase controls readable in the first view on
desktop and mobile; deeper material information and personalization stay optional.

## Engineering and evidence boundaries

Keep a single mounted configurator and selection owner as the layout/theme
changes. All variants use the reviewed catalog/cart, actual formats and prices,
existing quantity rules, availability, and the shared add-to-cart interaction.
Retain the unavailable subscription option through the existing purchase chooser.
No new commerce model, services, fabricated product claims or packaging.

The custom reference remains local label-preview text and is not sent to cart.
Respect pending cart operations, errors, keyboard focus and reduced motion.
Main homepage defaults stay unchanged; adoption requires the owner's selection.

## Verification

- Three isolated browser cases pass: desktop state/reference retention and cart
  behavior; mobile layout/theme fit; catalog loading/error/empty recovery and
  unchanged homepage/Origins study defaults.
- Verified selected format, quantity and reference survive layout/theme/view
  changes and Origins return. The material scene and label remain mounted.
  Quantity rules, unavailable items, pending locks, double-submit prevention,
  rejected-cart retry and exact cart payloads are covered with mocks only.
  Label reference is excluded from commerce payloads. No live cart writes occurred.
- Compared 1366×768 and 320×700 in both themes. New mobile layouts retain a small
  complete powder swatch above the controls; their purchase essentials fit the
  initial viewport even with bundle quantity rules. Current retains its existing
  taller mobile composition. Final framing uses a square canvas container to
  avoid distortion when rotating the shallow material preview.
- Visual captures are saved in `.local/qa/shop-study-visual/`, with final mobile
  framing in its `final-framing/` directory. The real catalog loaded in the
  user-facing `/shop-study` tab.
- `pnpm validate` passes: formatting, lint, strict TypeScript, 60 unit tests and
  production build. Scoped source review and `git diff --check` pass.
