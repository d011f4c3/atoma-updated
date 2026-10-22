# Task 0227 — Make the client flow readable and immediately usable

Date: 2026-10-20
Status: Implemented and verified locally

## Scope

Fifth client-feedback work group, following Tasks 0223–0226 and F09–F11 in the
backlog. The owner's current request adopts the client emphasis on readable
controls over the earlier periodic/tap-scramble treatment on canonical routes.

Keep scramble only for suitable display headings. Navigation, product choices,
form labels, descriptive paragraphs and order actions remain settled. Retain
independent study behavior, native pointer, keyboard focus and reduced motion.
Do not hide text or control groups behind entrance fades; visual-only imagery
may retain motion.

Use approximately 16 px mobile body text, 14 px important supporting/action text
and clear subordinate labels on the canonical customer journey. Keep fonts,
palettes, touch targets, selected-state cues, layouts and responsive imagery.
Confirm normal mobile content has continuous page scrolling, and preserve
intentional modal scrolling, dismissal and return behavior.

## Verification

Review 320, 360, 390, 768 and 1440 px across both themes and all four locales.
Check homepage entry, three Overview/Specifications views, Shop comparison,
Sample Set, tasting links and exact 1 kg product. Verify overflow, keyboard,
stable labels under pointer/touch/focus, reduced motion, selection and cart
continuity, image failure and action reachability.

Use a named simulated mobile-data profile with cold resources; record timing
and image transfer observations separately from production performance claims.
All browser commerce reads use fixtures and external writes are blocked.
Run meaningful behavior tests, `pnpm validate`, visual review and final diff.
No deployment or claim of physical-device testing.

## Result

Canonical non-heading text and controls now remain settled under touch, hover
and focus. Only suitable noninteractive headings may scramble; saved studies
retain their policy. Glyphs restore on route transitions. Text/control entrance
groups appear immediately and pure image groups may still animate.

Canonical mobile body/support/action roles are now 16/14/14 px plus existing
locale adjustment. Long Overview and retail descriptions are 16 px; narrow
next-order choices stack for readability. Existing continuous phone scrolling,
dialog containment and responsive images remain intact.

The throttled check found the initial destination read unnecessarily disabled
the homepage sample link. A separate navigation lock now covers actual pending
writes and checkout, allowing read-only homepage links and canonical header
navigation before the initial destination lookup. Purchase eligibility and
transaction locks retain their original checks.

- Eight profiles cover 1440 light English, 1440 dark Japanese, 768 light
  simplified Chinese, 768 dark traditional Chinese, 390 light Japanese,
  390 dark English, 360 light simplified Chinese and 320 dark traditional
  Chinese. All 80 principal views passed; evidence is in
  `.local/client-feedback-0227/after`.
- Checks covered overflow, mobile typography, three Overview/Specifications
  views, comparison, tasting/1 kg return, stable control text, modal Escape/focus
  return, continuous scrolling and retained cart. Supplemental English
  360 × 740, held-destination navigation, image failure and study-to-canonical
  transition checks passed.
- One before/after cold-browser measurement used 1.6 Mbps down, 750 Kbps up,
  150 ms latency and 4× CPU slowdown on the local Next development server.
  The first visible/hit-testable sample action improved from 30,092.6 ms to
  2,793.5 ms; DOMContentLoaded in the latter was 2,800.6 ms. At 13,817.5 ms the
  page load was still pending and one completed image response was 21,769 bytes.
  This demonstrates independent entry availability, not a production loading
  score or a complete image budget. Both measurement JSON files are retained.
- Five new motion-policy tests passed. `pnpm validate` passed formatting,
  lint, strict types, all 238 unit tests and the production build. Representative
  mobile layouts and final diff were reviewed. Commerce was fixture-isolated.
