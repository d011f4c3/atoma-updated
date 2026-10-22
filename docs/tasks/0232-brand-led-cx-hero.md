# Task 0232 — Preserve ATOMA's identity while simplifying the hero

Date: 2026-10-21
Status: Implemented and locally verified; retained comparison

The owner found this pass too close to earlier layouts.
[Task 0233](0233-application-field-hero.md) changes the organising composition
instead of continuing to refine this introduction/object arrangement.

## Scope and evidence

The owner rejects Task 0231's food-photography hero as inconsistent with the
brand. Keep the cleaner buying journey while recovering the established visual
direction. Both October client documents and the September synthesis were reread;
the existing homepage and rejected study were captured in both themes at desktop
and phone sizes.

The October design brief asks to retain the palette, silver materials, powder,
codes and typography. It locates finished-drink/food imagery in Overview. The
hero must make the three applications and sample entry clear, but this does not
require replacing the brand's material presentation with a large food photograph.
The owner previously authorized complete layout exploration and labelled reference
imagery. Client documents remain evidence, not operational or release authority.

## Implementation

- Add a separate “Material & application” comparison, default at
  `/hero-cx-study`, retaining all prior choices and explicit links.
- Use one continuous Mist/Blue hour field with the established metal matcha tray,
  specimen linework, restrained uppercase IBM Plex Mono, precise codes and
  controlled material depth. Avoid the full-height split divider and large
  display typography of the rejected pass.
- Group the headline, explanation and immediate Sample Set action. Place three
  native application/product links in a clear lower register, supported by small
  application references. No questionnaire, selection prerequisite or animation
  gate. Each route opens the existing exact product page and retains selection
  on Back.
- Keep material motion bounded and decorative, with native pointer visibility
  and system reduced-motion support. Controls and descriptions stay settled.
- Reuse existing assets and their provenance; no new generation or production
  claims. The tray remains a material study, and application thumbnails remain
  labelled references awaiting real-product photography.
- Keep the actual homepage, existing commerce contracts and earlier studies
  independent.

## Verification

Visually compare the new result with the current homepage, not just the previous
study. Review 1440/768/390/360/320 px, both palettes and all four locales across
selected profiles; verify native entry before hydration, samples and all product
destinations, keyboard/touch, Back and cart retention, delayed/failed images,
real-operation locks and reduced motion. Use isolated local commerce fixtures.
Run `pnpm validate` and review the final diff.

## Results

- New default and explicit `?layout=material` use a single material field with
  restrained uppercase heading, connected sample action, existing translucent
  tray illustration and three direct links with small application references.
  The prior photographic layout remains at `?layout=applications`; all earlier
  options remain in the selector. The canonical homepage is unchanged by this
  pass.
- Reused `SpecimenField`, heading-only `ScrambleText`, the existing tray asset
  and exact product/application mapping. No new dependencies, photography
  generation, product claims or commerce authority were added.
- Native links remain usable from server HTML. Source-keyed image states cannot
  block navigation. Bounded pointer motion resets on pointer exit, cancellation,
  window blur and motion-preference changes; touch and reduced motion omit it.
- Main material failures have a readable message. Small thumbnail failures use
  a neutral dash with an accessible translated label, avoiding clipped text.
  Phone explanation text is 16 px, the primary action 14 px, and product names,
  sample contents and reference provenance 12 px.
- Root reviewed desktop Mist, phone Mist/Blue hour, tablet Simplified Chinese,
  320 px Traditional Chinese and failed-image captures alongside the canonical
  homepage. An independent source/visual review found no remaining material
  issues after the phone typography and failure-state corrections.
- The eight-profile browser matrix passed at 1440, 768, 390, 360 and 320 px,
  covering both themes and four locales. Supplemental 360/390 px English spots
  passed. This is selected profile coverage, not all possible combinations.
  The three links end at 708 px in the 360 × 740 English view; provenance follows
  naturally below that viewport.
- Verified exact native product/sample entry, keyboard navigation,
  Back/reload/theme selection retention, cart continuity, pre-hydration entry,
  delayed destination reads, slow/failed images, mutation locks, bounded pointer
  response and changed reduced-motion preferences. Commerce was intercepted
  locally, with no live writes. Saved Applications regression passed at
  1440 px Mist and 390 px Blue hour.
- Evidence: `.local/hero-cx-study-0232` contains 44 fixture screenshots plus the
  live in-app preview capture, with eight-profile geometry kept separately from
  supplemental spots. Browser harnesses are `tests/hero-cx-material.mjs` and
  `tests/hero-cx-applications.mjs`, using shared `hero-cx-entry.mjs` and
  `hero-cx-fixtures.mjs`.
- `pnpm validate` passed: formatting, lint, type checking, 238 unit tests and
  production build. Log: `/tmp/atoma-0232-final-validate.log`. Final diff and
  whitespace review passed. The existing browser tab was navigated to the new
  comparison and its loaded UI was verified.

The tray's [existing provenance](../references/hero-assets.md) identifies it as
an illustrative material study. The small bowl photo and AI latte/cake references
retain their visible attribution and
[image register](../design/application-imagery-register.md). These are not
verified results made with the products. Final photography and owner acceptance
remain outstanding; browser emulation does not establish physical-device
performance or production checkout.
