# Task 0278 — Complete mobile homepage content

Date: 2026-10-23
Status: Complete

## Owner direction

The desktop homepage contains information and sections missing from mobile.
Create considered mobile versions of those sections. This supersedes Task
0263's removal of the mobile Sample Set and ordering sections, while retaining
the owner's preference for concise content and a balanced first impression.

## Scope

- Restore the audience line in the mobile hero, preserving the approved imagery,
  heading position, both CTAs and stationary mask entrance.
- Add dedicated mobile Sample Set, application directory, product/origin and
  ordering sections. Use concise vertical layouts and existing approved copy,
  product identities, sample contents, imagery and exact 1 kg destinations.
- Make product names, application guidance, preparation/profile access and the
  Sample → Choose → Reorder journey visible. Keep the existing sample-credit
  eligibility language visible beside the Sample Set invitation.
- Reuse in-place sample/product views, preserving the actual trigger, scroll,
  history, quantity, theme, locale and commerce navigation guards. Give new
  content one-shot reveals with stationary control hit areas and reduced-motion
  support. Keep desktop and saved studies unchanged.
- No new claims, assets, dependencies, backend changes, orders or deployment.

## Verification

Use isolated browser fixtures to review narrow/normal/large phones, both themes,
Japanese and enlarged text. Verify all restored information and exact product
destinations, Sample Set navigation, and product popup quantity/focus/scroll
return. Retain hero first-view and motion checks; compare desktop geometry.
Run focused browser checks, `pnpm validate` and final diff review. Evidence:
`.local/mobile-parity-0278/`.

## Delivered

The mobile hero now includes the business audience line within its existing
introduction space. Four dedicated sections follow it: the Sample Set with
three named 20 g contents and visible credit; compact powder/name/code/use rows;
preparation guidance and the supported Ceremonial origin; and Sample → Choose →
Reorder with exact named 1 kg product links. Text and controls remain steady,
with one-shot reveals and natural vertical scrolling.

The product reader captures the new directory's actual trigger, preserving
focus and scroll when it closes. Narrow and enlarged text layouts wrap headings
and CTA labels, stack sample weights and reorder formats, and retain complete
product names. Desktop and saved studies are unchanged.

## Verified

- All 12 mobile homepage browser cases pass, including complete content,
  visible credit, exact destinations, independent quantities, Sample Set return,
  Close/Escape/Back restoration and guards during simulated pending commerce.
- Phone checks cover 320, 390, 430 and 440 px, both themes, Japanese, 200% text,
  responsive popup resizing, readiness and failed images. No horizontal overflow
  remains; the original hero first-view bounds are retained.
- Desktop/mobile hero motion checks pass. All four new section headings show
  real intermediate scroll-reveal frames, settle on focus and do not replay.
- Reviewed each mobile section and localized captures. Desktop before/after
  geometry is identical for the hero, headings, sections, actions and page height.
- `pnpm validate` passes formatting, lint, TypeScript, all 256 unit tests and
  production build. Final diff and `git diff --check` pass. Browser fixtures
  intercepted commerce traffic; no live writes or deployment occurred.
