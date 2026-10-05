# Task 0102 — Quiet hero glitches and mobile tap feedback

Date: 2026-10-06

## Brief

Occasionally glitch the hero text and give mobile button labels approximately
one second of glitch feedback on tap. Keep the effect restrained and preserve
immediate button behavior, readable text and the existing hero entrance.

## Scope

Reuse ScrambleText and the existing Explore tag timing hook. The owner clarifies that the whole label should scramble, matching the
existing Explore tag, rather than changing just one or two letters. Apply that
full-label scramble in occasional passes to the selected Specimen heading and supporting line.
The owner's follow-up requires the complete introduction to play together:
both heading lines, the Flavour / Texture / Performance line and the application
sentence share one 2,800ms repeat cycle, matching the Explore matcha tag. The cycle
remounts only nested glyph spans, preserving the entrance-animation wrappers.
Add touch/pen tap playback to existing interactive labels and wrap the homepage
product choices, information tabs and core actions. Touch feedback lasts 950ms;
scroll/drag/cancel gestures do not activate it. Do not delay navigation or cart
operations to finish an animation. Keep quantity and icon-only controls stable.

Preserve desktop hover behavior, reduced motion, hidden/inert/disabled guards,
accessible names, text layout and cleanup. No new dependency or service.

## Verification

Browser-check actual tap event sequence, timing, scroll cancellation, repeated
inputs, reduced motion and stable accessibility/layout. Verify occasional hero
passes through the existing scheduler. Run `pnpm validate` and scoped diff review.

## Results

Full-label glyph changes and synchronized playback across all six hero passages
were observed in the browser. Touch Shop selection executes immediately,
scrambles the entire label, and settles by 1,100ms. Synthetic touch drag
cancellation and reduced-motion checks leave the label unchanged. Desktop and
mobile labels retain static accessible names and measured layout. The tap
lifecycle harness, scheduler checks, and final repository gate pass (70 tests).
The final cadence was observed at 2,792ms and 2,806ms between passes in the live
browser. Visibility, reduced motion and exploration pause the nested glyphs;
the existing entrance wrappers remain mounted throughout playback.
