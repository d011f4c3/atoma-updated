# Task 0104 — Mobile navigation and interaction refinements

Date: 2026-10-06

## Brief

Fix menu actions that work in desktop browsing but fail on the owner's iPhone.
Slow the mobile glitch effect, center the product codes on mobile selector
slides, put Swipe to explore underneath the matcha swatch, add theme controls
in mobile navigation and the footer, and remove the unwanted mobile cart-close
ring on pointer opening.

## Scope

Preserve desktop presentation and timing, the shared product/cart state and
native link semantics. Do not collapse the menu when Safari blurs a tapped
control without reporting a destination; continue closing on actual outside
focus, outside taps, Escape and selected actions. Mobile glitch repetition is
5,600ms and playback 950ms; desktop remains 2,800ms and 500ms. Retain whole-text
synchronization, reduced motion and visibility guards. Reuse the existing theme
provider so all canonical controls stay synchronized without remounting content.
Keep keyboard focus indicators and the saved studies' independent themes.

## Verification

Reproduce the null-destination blur before patching, then exercise all mobile
menu actions and keyboard dismissal. Check mobile slide code/hint placement,
cart pointer opening vs keyboard focus, theme sync/persistence, mobile cadence
and desktop regressions. Run the repository gate and review the final diff.
Publish the verified correction through the already authorized main/Vercel flow.

## Results

Reproduced the menu closing immediately after a summary blur with no destination.
After the fix it stays open and Matcha, Shop, Origins and About actions work.
Escape and backward keyboard navigation still dismiss and restore normal focus.
The mobile popup regression scenario now includes this null-destination blur.
This is a browser reproduction of the Safari focus sequence, not a physical
iPhone test.

At 320px and 390px, product annotations are horizontally centered (zero measured
center offset), the swipe controls sit below the powder, and the page has no
horizontal overflow. Both palettes were reviewed. Menu and footer switches
synchronize all theme controls and preserve the selected theme across route
navigation. The new menu control is hidden on desktop; its layout remains intact.

The mobile hero was measured at a 5,593ms repeat interval, with 948ms and 946ms
playback durations. Desktop cadence and reduced-motion behavior remain covered
by the timing harness. Pointer-opened Cart retains focus on Close with no outline;
Tab and Shift+Tab restore its visible keyboard outline. The repository gate
passes formatting, lint, TypeScript, 70 tests and production build. Scoped diffs
were reviewed. No real cart mutation or checkout was used during verification.
