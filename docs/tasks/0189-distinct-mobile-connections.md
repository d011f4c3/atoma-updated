# Task 0189 — Distinct mobile Connections composition

Date: 2026-10-19
Status: implemented; parent visual review pending.

## Request

The owner likes Our approach and Understanding is shared on desktop, but finds
their mobile sequences too similar. Refine only the mobile Connections section
so it reads as one connected photographic composition rather than another stack
of full-width photographs.

## Implementation

At widths up to 760 px, the existing three photographs now form a two-column
grid. Growing and Preparing occupy smaller 4:3 windows on the left; Working
with tea spans both rows on the right, making the people and their work the
visual anchor. Its existing horizontal focal position keeps the central group
in the portrait crop. The numbered captions remain visible below their images.

A fine vertical line in the column gap joins three short branches and nodes.
It preserves the existing connection motif without adding an interaction.
The heading, observation-first reading sequence, exact copy, images and alt text
are unchanged. Mobile image-size hints match the new smaller windows.

All layout changes are inside the existing `max-width: 760px` media query.
Desktop sizing, spacing, photograph positions and line animation are unchanged.
No other About section, popup, commerce behavior, asset or translation changes.

## Verification

Scoped formatting, ESLint, `pnpm exec tsc --noEmit` and `git diff --check` pass.
The parent owns visual review at 320 and 390 px, including caption fit, the
people crop, line placement and a desktop regression check. No browser session
was opened for this subtask.

## Browser review

Reviewed at 390 px: all three captions are readable, the people photograph anchors the taller right column, and the two smaller images remain connected by fine linework. No horizontal page overflow. Desktop remains the existing three-image arrangement.
