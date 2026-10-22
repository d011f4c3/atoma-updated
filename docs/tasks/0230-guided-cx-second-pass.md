# Task 0230 — Make the guided CX study useful from the first screen

Date: 2026-10-21
Status: Implemented and verified locally; isolated design study

Subsequent direction: the owner rejected these alternatives as insufficiently
strong heroes. [Task 0231](0231-product-led-cx-hero.md) creates a new opening
focused on finished applications. Guided remains an earlier comparison.

## Scope and authority

The owner prefers Guided decision visually but finds its current logic unclear
and requests another pass. Refine `/hero-cx-study` around that direction. The
owner previously authorized whole-layout exploration; the canonical homepage
and other saved studies remain independent. Retain Invitation and Directory as
comparisons while making the revised Guided layout the study's default.

Both October client documents were reread. Their requested application → samples
→ comparison → named 1 kg journey informs this interpretation. They are source
evidence, not authorization for live payments, deployment or invented claims.

## Change

Remove the discovery/reorder question, whose two answers led to the same
application question. Show one useful question with three visible applications
and their matching product names. Make the native Sample Set link available
immediately, without needing an answer or waiting for imagery or hydration.

An application reveals its canonical tea, code, supported usage and labelled
reference image. Explain that the Sample Set includes all three matcha and that
customers compare them before choosing a 1 kg tea. Keep samples as the single
primary action, with the exact named 1 kg product link secondary. Existing Shop
navigation serves visitors who already know their product. Do not claim a
personalized recommendation, custom sample pack or verified product photography.

Keep the centered, restrained visual direction, IBM Plex Mono and Mist/Blue
hour. Use clear two-stage progress, a Change application return and an explicit
retained choice. Preserve four locales, keyboard focus, reduced motion, natural
mobile scrolling, cart state and transaction locks. Old intent links should
still resolve valid product choices, but intent no longer changes the journey.

## Verification

Exercise all three mappings and native sample/1 kg routes, reload and Back,
remembered choice, legacy URLs, before-hydration navigation, held destination
reads, slow/failed images and transaction locks. Review desktop and phone
screenshots across four locales and both palettes; use intercepted local
commerce fixtures, with no live writes. Run `pnpm validate` and review the final
diff. Record evidence and limits below when complete.

## Local review results

The study defaults to revised Guided. Its two stages are Application and Your
matcha; both expose samples, and the result uses the shared supported usage
copy rather than repeating the customer's answer. The Sample Set explanation
states that all three teas are included. The selected tea's exact 1 kg link
remains secondary. Returning to the choices retains an outlined, checked and
programmatically pressed selection. The compact mobile reviewer toolbar leaves
more room for the customer experience.

- The browser matrix passed at 1440, 768, 390, 360 and 320 px, across eight
  profiles covering English, Japanese, simplified/traditional Chinese and both
  palettes. All three product mappings, two-stage progress, selection and
  appearance continuity, keyboard focus, reload and browser Back passed.
- Native sample navigation before hydration, legacy/invalid URLs, old reorder
  links, all three exact 1 kg handoffs, retained cart, held destination reads,
  slow/failed images and operation locks passed. Commerce fixtures intercepted
  requests; no external requests, server writes or live checkout were tested.
- After final copy refinement, fresh default and result checks passed at
  1440 English, 390 English, 360 English and 320 traditional Chinese. All three
  opening choices and the sample action fit the first viewport. The sample
  action's bottom was 682 px within an 844 px viewport at 390, 682/740 px at
  360, and 678/740 px at 320.
- Six before captures and 58 after captures are retained in
  `.local/hero-cx-study-0230`, alongside final first-screen measurements. Root
  reviewed desktop selection/result and narrow-phone compositions. An
  independent source review found no actionable state, factual-boundary,
  reference-label, focus or locale regression.
- Final `pnpm validate` passed formatting, lint, strict types, all 238 unit
  tests and the production build. The final source and whitespace review
  passed. Validation log: `/tmp/atoma-0230-final-validate.log`.

These checks use local browser emulation. They do not establish physical-device
performance or live payment/fulfilment readiness. The canonical homepage and
earlier studies remain independent; no adoption or deployment is part of this
pass.
