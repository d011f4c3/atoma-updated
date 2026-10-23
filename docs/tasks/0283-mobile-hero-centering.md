# Task 0283 — Center the mobile hero composition

Date: 2026-10-23
Status: In progress

## Owner direction

The mobile hero still looks incorrectly centered. The supplied phone screenshot
shows substantial empty space below the actions and inconsistent left edges
between the Tea service and Recipes captions.

## Cause and change

The hero retained `align-content: start` inside a larger minimum-height box after
its content was reduced. Unequal top/bottom padding reinforced that imbalance.
The Recipes card also retained a separate 6 px left margin.

Center the introduction, applications and actions as one group. Use equal block
padding that respects the bottom safe-area inset; remove the Recipes offset.
Keep the current type, image sizes, internal gaps and height cap. Use natural
content growth on short screens and enlarged text, with no fixed-height clipping.
Preserve desktop, all labels/actions, motion and commerce/return behavior.

## Verification

Compare the actual visible group's top/bottom space, aligned caption rules and
whole images in Chrome and WebKit at representative usable phone heights. Check
both CTAs, 320 px and enlarged localized text, retained state and desktop scope.
Replace test bounds that previously enforced top anchoring with relational
centering checks. Run focused checks, full validation and final diff review.

Evidence: `.local/mobile-hero-center-0283/`.

## Result

At 440×780, the former 19.5 px above / 91.5 px below the content becomes
55.48 px on both sides. At 390×700 it is 53.64 px on both sides, and at 375×667
40.73 / 40.75 px. Tea service and Recipes now share the same 20 px left edge.
The normal-size image dimensions and type are unchanged.

All 15 mobile browser cases pass, including both CTAs, caption alignment,
320 px phones, Japanese/enlarged text, exact popup returns, readiness and image
failure. Chrome and WebKit match on the representative normal phone sizes.
