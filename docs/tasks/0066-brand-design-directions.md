# Task 0066 — Complete brand design directions

Superseded by Task 0068, which implements the four directions approved after
reviewing the client brief. The record below describes the earlier exploration.

## Approved brief

The owner rejected Task 0065's palette-led refinement as insufficient. Rebuild
the same exploration with genuinely distinct visual identities: typography,
composition, navigation, controls, image presentation and motion, while retaining
the regular v3 homepage's content and industrial character.

## Scope

- Replace the three palette variations with Instrument, Register and Folio.
  Keep Current as a direct comparison to the regular `/` homepage.
- Design each direction as a coherent system across tray entry, matcha selection
  and information/purchase panels. Reuse the existing source content and flows.
- Use the existing fonts and image assets. No new dependency, commerce contract,
  external API, production permission or deployment.
- Keep the same mounted homepage when switching direction. Preserve selection,
  quantities, information views and all existing keyboard/touch interactions.
- Add internal presentation hooks to shared components. All new design rules
  remain scoped to this comparison; the regular homepage retains its styling.

## Validation

Review all three directions at desktop and mobile sizes, including product entry
and information views. Verify state continuity, keyboard access and no horizontal
overflow. Run relevant checks, then `pnpm validate`, and review the task diff
against pre-edit copies to preserve the existing uncommitted work.

## Results

- Replaced palette variations with three complete design directions. Instrument
  uses a bold sans hierarchy and contained material stage; Register uses an
  oversized masthead, open catalogue composition and indexed controls; Folio
  uses serif editorial type, reversed composition and quieter reading panels.
- Each direction includes matching product selectors, information controls and
  purchase styling in both appearances. Shared content and behavior remain in
  the same mounted homepage. Current retains the original styling.
- Reviewed desktop at 1280 × 720 and 1366 × 900, and phone layouts at 390 × 844
  and 320 × 667. Confirmed no horizontal page overflow at the narrow sizes.
- Verified Barista, the active information panel and quantity 2 survive direction
  and appearance changes. Reviewed Overview, Specifications, Origins and Shop;
  verified keyboard navigation to purchase controls with visible focus.
- `fnm exec --using=24.20.0 pnpm validate` passes: formatting, lint, types,
  all 60 tests and the production build. Final control-specificity adjustments
  received a further formatting check and production build.
- Reviewed shared-component diffs against pre-edit copies: only internal
  presentation attributes were added; the previous palette-only CSS was removed.
  Direction rules are scoped to the exploration. `git diff --check` passes.
- No production write or deployment. No new dependency or commerce change.
