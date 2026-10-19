# Task 0216 — Restore the original Mineral purchase surface

Date: 2026-10-20

## Request and scope

Replace the stronger blue/grey purchase-button refinements with the original
Mineral treatment from the button study. Use the original tonal surface instead
of continuing to adjust the higher-contrast gradient.

## Implementation

Use the exact study fills and borders: `#dce6d9` / `#6f8376` in Mist and
`#263a46` / `#8195a2` in Blue hour. Both the saved study and canonical purchase
buttons consume the same theme tokens, keeping their resting palettes aligned.
Remove the added directional gradient and resting shadow.

Retain the previously requested current hover styling, pointer highlight,
label animation, plus-to-arrow icon, press feedback and pending indicator.
Preserve sizing, focus, reduced motion, disabled states and commerce behavior.
Canonical scope remains homepage, Samples and retail product pages; historical
concepts and the other study treatments retain their existing appearance.

No dependencies, commerce-contract changes, production writes or deployment.

## Verification

- Eight browser scenarios pass: Chromium at 390px and 1440px in both themes,
  WebKit at 390px in both themes, plus purchase states/reduced motion and
  two-theme study isolation. Reviewed both purchase sections and hover captures.
- Compared computed canonical fill, border, ink and resting shadow directly
  with the original saved Mineral study in both themes; values match exactly,
  with no background gradient or resting shadow.
- Text contrast is 9.31:1 light and 10.12:1 dark. At the strongest retained
  pointer tint it remains 7.10:1 and 6.45:1 respectively. Existing label/icon
  behavior, pending feedback, unavailable and reduced-motion states pass.
- Browser harness: `tests/mineral-purchase-button.mjs`. Captures and results:
  `.local/mineral-original-0216/`. No production writes or deployment.
- `pnpm validate` passes formatting, lint, strict TypeScript, all 218 unit tests
  and the production build. Final source and whitespace review pass. Validation
  log: `.local/mineral-original-0216/validate.log`.
