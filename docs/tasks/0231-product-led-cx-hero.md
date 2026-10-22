# Task 0231 — Make finished applications the CX hero

Date: 2026-10-21
Status: Implemented and locally verified; rejected as insufficiently aligned with the brand

The owner found the finished-applications poster too far from ATOMA's visual
identity. [Task 0232](0232-brand-led-cx-hero.md) retains its simpler native entry
paths while restoring material, typography and lighting cues. This option remains
available for comparison.

## Scope and authority

The owner rejects all current CX layouts as insufficiently strong heroes and
asks for another reading of the client feedback and a new pass. Both October
DOCX documents were reread alongside the September brand synthesis. The owner
has authorized complete layout exploration; the current homepage remains
independent.

The prior studies made the interface structure dominant. The owner explicitly
clarifies that a product pouch does not explain what ATOMA does. The source
feedback asks for recognisable tea service, lattes and recipes, with restrained
colour, typography and immediate application/sample clarity. This task interprets
those together as one hero led by the finished applications.
It does not treat the source documents as instructions to release or perform
commercial operations.

## Direction

- Compose the entire hero as a continuous editorial page: prominent client
  headline, short Japanese-matcha/application copy, one Sample Set action, and
  a large photographic composition of prepared matcha, an iced latte and cake.
- Integrate three direct application/product links beneath the finished uses.
  No questionnaire, progress tracker or intermediate recommendation
  screen. Preserve the selected tea on return from its product page.
- Keep product links secondary to Sample Set, with the three 20 g contents
  stated beside the primary action. Product pages retain the existing real
  format, price and purchase controls.
- Keep IBM Plex Mono/Mist/Blue hour. Generate labelled composition references
  for both palettes, showing the finished applications. Do not invent a pack, certification,
  stock, provenance or performance claim. Actual product-result photography
  remains outstanding; generated scenes are not product proof.
- Let typography, photographic scale, lighting and spacing establish
  the first impression. Text and navigation work immediately; respect reduced
  motion and retain native links before JavaScript or image readiness.
- Place this layout's reviewer controls after the hero, so the review UI does
  not occupy the first impression. Retain earlier alternatives for comparison
  and existing deep links.

## Verification

Review actual desktop and mobile compositions before treating functional tests
as sufficient. Check 1440/768/390/360/320 px, four locales and both palettes,
native samples and all three product routes, Back/selection/cart continuity,
slow/failed images, before-hydration navigation and real-operation locks.
Use local intercepted commerce fixtures. Run `pnpm validate`, review the final
diff and record the results and limitations below.

## Implementation and review

- Added “04 — Made with matcha” as the study default and explicit
  `?layout=applications` route. Existing Invitation, Directory and Guided
  links and options remain available. This pass does not change the canonical
  homepage.
- Built one continuous photographic composition with a large headline, immediate
  Sample Set action and three native links to the existing product pages.
  Product names, codes and destinations come from the canonical sample contents.
  Native links work before hydration; returning from a product preserves the
  selected tea.
- Generated Mist and Blue hour application references through the built-in
  image-generation tool. The visible provenance caption and
  [image register](../design/application-imagery-register.md) distinguish these
  compositions from verified photography made with the teas.
- Root visually inspected the final 1440 px Mist, 390 px Mist and 320 px Blue hour
  captures. All three finished applications remain whole and legible, the sample
  action is immediately visible, and the product paths and reference caption fit
  within these first screens. Horizontal masks soften the image edges into
  the page. Reviewer controls follow the hero.
- Independent source review found no material issues with native navigation,
  image failure handling, selection/Back behavior, canonical product data or
  separation from the actual homepage.

## Verification results

- The browser matrix passed at 1440, 768, 390, 360 and 320 px across eight
  selected profiles covering both palettes and English, Japanese, Simplified
  Chinese and Traditional Chinese. This is profile coverage, not every possible
  width × locale × theme combination.
- All three product links, keyboard entry, Sample Set, Back/selection/cart
  continuity, saved alternatives, before-hydration navigation, delayed
  destination lookup, slow/failed images and real-operation navigation locks
  passed with local intercepted commerce fixtures. No live commerce writes
  were performed.
- Browser harnesses: `tests/hero-cx-applications.mjs`,
  `tests/hero-cx-study.mjs`; shared isolation in `tests/hero-cx-fixtures.mjs`.
  Screenshots and geometry: `.local/hero-cx-study-0231/after`; previous
  composition in `before`, saved-layout regression in `legacy`.
- `pnpm validate` passed: repository formatting, ESLint, TypeScript, all 238
  unit tests and the production build. Log:
  `/tmp/atoma-0231-final-validate.log`. Final source and whitespace review passed.

This remains a locally reviewed, unaccepted design study. Browser emulation does
not establish physical-device performance or production checkout operation.
The generated scenes establish composition only; final product-result photography
remains outstanding.
