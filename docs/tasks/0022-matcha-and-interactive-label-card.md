# Task 0022 — Matcha and an interactive label card

Date: 2026-09-30
Status: Complete

The owner now wants to keep matcha as the visual subject, without a bag or
canister in the main flow. Build a custom label as selections are made, with
animated writing on a movable three-dimensional card. This supersedes Task
0021's main packaging reveal; retain its work as a separate study rather than
deleting it.

The owner's visual direction is matcha meeting precision engineering,
laboratory and science. Apply this through cool neutral materials, precise
ruled typography, measured spacing and controlled motion; matcha remains the
central material subject.

Apply to both homepage themes and Concept 02. Keep the immediate tray entry,
photographic powder and material-change choreography. Powder stays present
while format, quantity and an optional personal reference build the label.
Retain both shopping modes, real availability/quantity rules and existing cart
boundaries. No new packaging variant, product fact or printing service is added.

Use a restrained cool off-white paper card with clear ruled typography, small MATCHA
heading and generous group spacing. Changed words print into place with short,
coordinated animation. Pointer and touch dragging should feel weighted, with
bounded movement, responsive tilt and a settled release. Provide arrow-key
movement, reset/Home, readable accessible text and reduced-motion behavior.
Keep selection changes responsive during motion; rapid updates must finish on
the latest selection. Preserve position while moving between shopping modes.

Review desktop/mobile in both themes, card printing and dragging, focus and
keyboard/touch behavior, reduced motion, tray entry, fallback and preserved cart
behavior. Add relevant behavior coverage, run `pnpm validate` and inspect the
final diff. No production mutation or deployment is authorized.

## Implementation

- `/`, `/light` and `/concept-02` use a dedicated persistent powder scene. The
  same tray photograph and framing drive the immediate homepage handoff; no
  packaging asset loads or packaging transition runs in this path.
- A paper card joins the settled material view. Selection and application print
  first, then format/quantity and an optional reference. Fields animate only
  when their words change; fast selections always replace pending ink with the
  latest value. Existing selection state supplies all content.
- CSS 3D edges, pointer lighting and movement-driven tilt give the card depth.
  Mouse/touch dragging has bounded inertia, leaves the card where it is placed,
  and keeps that position across choices and shopping modes. Arrow keys move
  it; Shift increases the step; Home and Reset return it to its starting position.
- The compact mobile card expands through “Your label” for readable inspection
  and reference editing. Card scale and material framing ease together. System
  reduced motion disables choreography and printing while retaining controls.
- The photographic bag study remains at `/concept-02/bag`, and the canister
  remains at `/concept-02/canister`. Cart/checkout boundaries are unchanged;
  personal references are a local preview and are never sent as a print order.

## Verification

- Reviewed dark/light desktop, compact and expanded mobile, and a 32-character
  reference. Text remains inside the paper; the compact stage preserves visible
  purchase controls. Final paper is a cool neutral stock with restrained grain.
  Captures are in `.local/qa/label-card/` and `.local/qa/powder-label-card/`.
- All 29 browser cases are covered cumulatively: the full run passed 26/29;
  three test expectations needed to account for the card's semantic header and
  bounded mobile movement. The four affected homepage/card cases passed on a
  focused rerun. Ink assertions check rendered glyph opacity as well as text,
  including immediate updates under reduced motion.
- Tray timing, cold/fallback loading, cancellation/reopening, both themes,
  selection/quantity/reference changes, mouse/native touch dragging, keyboard
  movement/reset, retained placement and existing mocked cart behavior pass.
  Commerce remains intercepted in browser tests; no service-backed cart writes.
- `pnpm validate` passed: formatting, ESLint, TypeScript, 15 unit tests and the
  production build. Final test edits passed targeted formatting, lint and syntax
  checks. `git diff --check` passed; the final implementation was reviewed.
