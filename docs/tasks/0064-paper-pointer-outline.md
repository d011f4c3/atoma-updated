# Task 0064 — Remove the paper outline on pointer interaction

Date: 2026-10-01
Status: Complete

## Approved scope

Remove the unwanted outline when clicking or dragging the label paper. Preserve
keyboard focus visibility, arrow-key movement, dragging, reference editing and
the paper's existing appearance. Apply the shared fix to the homepage and studies.
No dependencies, commerce changes or deployment.

## Validation

Reproduce clicking the card after keyboard movement, then confirm pointer use
clears its outline and keyboard navigation still shows focus and moves the card.
Review the resulting appearance, run `pnpm validate`, and inspect the scoped diff.

## Result and verification

Pointer interaction now suppresses the paper's outline even when the browser
retains `:focus-visible` from earlier keyboard movement. Keyboard events and
blur clear that pointer flag, preserving the existing focus indicator and all
movement behavior. The change is local to the shared paper component.

Reproduced the sticky outline on `/selector-study/left` before the fix. CUA checks
then confirmed no computed or visible paper outline after clicking, a visible
outline and changed position after Arrow Right, restored focus after Tab and
Shift+Tab, and a clean paper after Home and another click. Reviewed the final
appearance at 1366×900. No cart writes were performed.

`pnpm validate` passed formatting, ESLint, TypeScript, unit tests and the
production build. Reviewed the scoped diff and ran `git diff --check`.
