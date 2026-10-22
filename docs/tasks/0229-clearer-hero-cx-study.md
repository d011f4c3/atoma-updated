# Task 0229 — Compare complete layouts for the customer journey

Date: 2026-10-21
Status: Implemented and verified locally; design comparison only

Subsequent direction: the owner preferred Guided visually but found its logic
unclear. [Task 0230](0230-guided-cx-second-pass.md) refines that flow and makes it
the default. The three-stage Guided description below records this earlier pass.

## Scope and authority

The owner requested the original six work groups before revisiting the
unaccepted imagery and left introduction at `/hero-cx-study`. Tasks 0223–0228
complete that pass: frontend implementation plus a separate commercial
readiness report. The owner approved labelled composition references for local
review. Both October source documents were reread during this pass.

The first revision connected the introduction and replaced the bag with three
application references while retaining the split composition. The owner then
clarified that the study must explore complete layouts and the simplest customer
journey, without preserving the current homepage's geometry or treating its
parts independently. This clarification supersedes the first revision's fixed
composition, visual-toggle and continuously mounted bag requirements.

Keep IBM Plex Mono, Mist/Blue hour palettes, canonical product identities,
existing sample and exact 1 kg destinations, cart locks and local-language
support. The canonical homepage remains independent; this is not adoption.

## Complete alternatives

1. **Sample invitation:** centered typography and one primary Sample Set action,
   followed by one unified photographic composition of bowl, latte and cake.
   The secondary native link opens the existing product comparison. No initial
   product or application decision is required.
2. **Application directory:** the applications form the full-width page as three
   horizontal rows. Selecting a row reveals one explanation and next-step area;
   the rest remain compact. Sample entry is available before choosing a tea.
3. **Guided decision:** one centered question at a time, beginning with discovery
   versus known needs, followed by application choice and a selected summary.
   Discovery prioritizes samples; known needs prioritize the named 1 kg path.

The reviewer toolbar switches the whole layout, with a separate appearance
control. Customer navigation is reduced to the brand, Shop and Cart; Origins,
About and language selection remain accessible in the footer. Remove the prior
independent Flow and Visual controls. The layout is free to use continuous page
scrolling; do not force every design into the prior divided hero.

Use the existing source mappings for product images. The invitation's unified
image is an AI composition reference, with its prompt, provenance and final-photo
replacement boundary in the image register. Keep reference labels visible.
Sample contents stay beside the sample action so 20 g cannot be mistaken for a
wholesale format. Do not invent product performance or commerce facts.

Validated URL state owns layout, appearance, tea, intent and step, including
reload and browser Back. Recognize older flow links as layout aliases. Keep
read-only navigation available before initial destination reads and image
loading; actual mutations and checkout retain their locks.

## Verification

Use eight browser profiles across 320/360/390/768/1440 px, four locales and both
palettes. Check distinct complete compositions, primary-action reachability,
reference mappings/captions, keyboard focus, URL validation, deep links,
reload, Back/Restart, exact 1 kg and cart continuity. Exercise held destination
reads, slow and failed images. Commerce reads use fixtures and writes are
blocked. Review representative screenshots, run `pnpm validate` and inspect
the final diff. Browser emulation is not physical-device testing.

## Historical first revision

The initial split-layout revision passed 238 unit tests, production build and
62 browser captures across eight profiles. These are retained under
`.local/hero-cx-study-0229`; the previous source is in its `previous-source`
subdirectory. Those results describe the rejected composition, not acceptance
of the complete alternatives. New evidence uses
`.local/hero-cx-study-0229-layouts`.

## Complete-layout results

The study now changes the entire page between the three alternatives. It no
longer contains the fixed split composition, persistent packaging stage or
independent visual switch. The invitation uses one unified AI reference image;
Directory makes each full row, including its photograph, a single accessible
toggle; Guided shows imagery only after a product choice.

The URL retains layout, tea, intent, step and appearance across reload and
browser Back. Directory focus remains on its stable toggle; Guided transitions
focus the new heading. In-place controls wait for actual JavaScript hydration,
then become available independently of destination and image reads. Native links
remain available in server-rendered HTML; pending commerce operations still lock
navigation. Mobile Directory captions span the row naturally, with a usable
fallback for browsers without CSS subgrid.

- Eight profiles cover 1440 light English, 1440 dark Japanese, 768 light
  simplified Chinese, 768 dark traditional Chinese, 390 light Japanese,
  390 dark English, 360 light simplified Chinese and 320 dark traditional
  Chinese. All three complete layouts passed; 59 successful screenshots are
  retained in the new evidence directory.
- Native Sample Set and all three exact 1 kg handoffs, product/expanded-row
  return, retained cart, URL validation and old flow aliases, reload, keyboard,
  Back/Restart and the appropriate primary destination passed.
- Before-hydration native navigation, held initial destination/image reads,
  failed images and intercepted mutation-lock checks passed without external
  requests or server writes. After the last Directory adjustment, 390 English
  and 320 traditional Chinese photo targets, captions, links and Back passed.
- Root reviewed desktop Invitation, Directory and Guided layouts plus phone
  Invitation and the final narrow Directory. An independent source review found
  no actionable state, focus, scope or reference-label regression.
- Final `pnpm validate` passed formatting, lint, strict types, all 238 unit tests
  and the production build. Final documentation/whitespace checks passed.

The canonical homepage and other saved studies retain their existing layouts.
These are locally reviewed alternatives for the owner to compare, not a selected
design or production release.
