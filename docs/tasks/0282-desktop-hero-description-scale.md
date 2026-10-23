# Task 0282 — Smaller desktop hero supporting copy

Date: 2026-10-23
Status: Complete

The owner requests smaller desktop text for “Authentic Japanese matcha selected
for tea service, lattes and recipes.” Reduce only that canonical homepage line
from 16 px to 14 px above 760 px. Retain the locale increment, light font weight,
line height, heading, imagery, mobile typography and saved studies.

Verify computed desktop/mobile sizes, formatting and full validation. No content,
commerce, routing or deployment changes are in scope.

Verified the line computes to 14 px at 1440 px and remains 15 px on the dedicated
390 px mobile hero. Reviewed the desktop screenshot. `pnpm validate` passes
formatting, lint, types, all 256 unit tests and the production build; final diff
checks pass. Evidence: `.local/hero-description-0282/`.
