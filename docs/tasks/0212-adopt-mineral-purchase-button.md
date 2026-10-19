# Task 0212 — Adopt Mineral with the current purchase interaction

Date: 2026-10-19

## Request and scope

Adopt Mineral from the purchase-button study, with a more dramatic presence,
while keeping the current button's hover styling, animations and iconography.
Apply to canonical homepage purchase paths, Samples and retail product pages.

## Implementation

Retain the existing shared button, label scramble, pointer-following highlight,
hover lift, label shift, plus-to-arrow action square, press feedback, resting
scan and real pending spinner. No purchase events, labels, locks or state change.

Strengthen Mineral's sage fill in Mist and slate-blue fill in Blue hour. Use a
broad directional gradient for more depth, a defined edge and the normal theme
ink for clear labels. Keyboard focus uses the contrasting text color. Preserve
disabled transparency, pending feedback and system reduced-motion behavior.

Canonical page roots opt into the surface explicitly. All original study
treatments and historical concepts retain their presentation. No dependencies,
commerce-contract changes, production writes or deployment.

## Verification

- Eighteen browser cases pass: nine each in Chrome and WebKit. Reviewed
  320px, 390px and 1440px in both themes, plus desktop hover captures.
- Original label scramble, pointer tracking, highlight, lift, action icons,
  ready scan and keyboard focus remain intact. All labels fit and retain the
  existing 56px minimum purchase target.
- Gradient text contrast is at least 6.81:1 in Mist and 6.93:1 in Blue hour.
  With the strongest existing pointer tint, minima remain 5.32:1 and 4.72:1.
- Intercepted repricing, pending add/rejection recovery, unavailable and
  reduced-motion states pass. Homepage and retail routes use Mineral; original
  Current and Mineral study treatments remain unchanged. No real writes.
- `pnpm validate` passes formatting, lint, strict TypeScript, all 217 unit tests
  and the production build. Final source and whitespace review pass.
- Browser harness: `tests/mineral-purchase-button.mjs`. Screenshots, results
  and validation log: `.local/mineral-purchase-button-0212/`. No deployment.
