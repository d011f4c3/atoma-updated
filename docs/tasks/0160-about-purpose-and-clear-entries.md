# Task 0160 — About composition, scrolling and clear invitations

## Request

The owner finds the Small details section generic, asks for clearly clickable
and balanced Field notes, a better designed Find your matcha CTA, and a more
prominent Understanding is shared section while retaining its content. Further
feedback asks for distinct homepage-like sections, substantial scroll effects,
removal of the material study, stronger visual refinement and less boxy framing.

## Scope

- Replace generic material prose with a concrete introduction to ATOMA's
  selection, product information, preparation guidance and field photography.
  Draw from the September brand direction and October feedback §6; avoid name
  etymology, invented history, direct-sourcing or scientific claims.
- Present the two Field notes as equal, fully clickable cards with visible
  Read field note actions. Preserve the harvest-first order, popup behavior,
  no-JavaScript destinations, selection, focus and scroll continuity.
- Remove the material study and its illustrative macro imagery from canonical
  About. Keep the exact approved Character / Application / Origin text.
- Give Understanding is shared an open photographic composition with existing
  copy and a fine connecting line. Pair people working between the rows, tools
  in use and the landscape; reserve the path photograph for the next section.
- Use spacing, cropping and image placement instead of enclosing panels.
  Remove the hero text box, Connections frame and Field note card borders;
  retain explicit actions, visible keyboard focus and readable contrast.
- Build a deliberate closing invitation with existing product imagery and a
  clear Shop button, keeping the GVJ attribution and approach return quiet.
- Preserve the site's scale, both themes, locales, motion preferences, approved
  Character / Application / Origin text and commerce behavior. No dependencies
  or deployment.

## Composition and motion

The owner-requested reference [c6o](https://www.c6o.fun/) was reviewed live,
alongside the existing local c6o and portfolio source, read-only. Their useful
principles are whole-section handoffs, sticky compositions and photography
driven by scroll. This is an interpretation of those mechanisms, not copied
design or source.

- A broad Wazuka landscape opens the brand introduction. Its photograph moves
  within the frame while the whole cover gently recedes as the next section
  arrives. A soft gradient supports copy without a rectangular panel.
- A compact ATOMA purpose section introduces the company directly.
- The approach holds one visual stage alongside the three reading steps. The
  imagery changes with scroll, with a short crossfade so each image remains
  distinct while reading. All copy remains in normal document flow.
- Understanding is shared assembles three independent photographs with bounded
  scroll movement and subtle fine-pointer response.
- The next landscape expands horizontally on arrival, followed by relationship
  context and two equally weighted, entirely clickable Field notes.
- The harvest remains the first separate Field note, not the About feature.
  Readers retain inset mobile popups, real fallback URLs and focus/history/
  scroll restoration.

Existing Lenis remains the only smooth-scroll provider. Passive listeners and
coalesced animation frames update bounded CSS variables; no new dependency or
continuous extra rendering loop. Mobile, short viewports, reduced motion and
JavaScript-free rendering retain readable static compositions. Motion changes
are cleaned up on preference changes and unmount.

Final review also bounded photograph movement to the actual image overscan, so
no empty edges appear on compact screens. A Back/Forward regression exposed a
queued native dialog-close event: user dismissal now explicitly notifies the
parent, while history and unmount closes cannot dismiss a newly reopened reader.

## Photography

Added `public/images/about/wazuka/field-contours.webp` from owner-supplied
`R0008033.JPG`, kept in ignored `.local/about-farm-0154/source/`. The 2400 × 1600
WebP derivative applies orientation, resizes and strips camera metadata. It
does not alter photographic content. Other images reuse the source mapping in
Task 0154. No generative farm imagery, private identities or invented product
provenance is introduced.

## Validation

- Desktop and 320px mobile flow checks passed before the final framing pass,
  covering both themes, scroll choreography, full-card entry, dialog lifecycle,
  browser history, focus/scroll return and Shop navigation.
- Four mobile locales in both themes passed, along with reduced-motion,
  JavaScript-free, direct-route and native Back fallbacks.
- After the final fixes, normal-motion flows at 1440px, 320px and 390px and
  the 320px Japanese dark reduced-motion case passed. These include rapid
  Back/Forward, all dismissal paths, focus/scroll return, selection/cart
  continuity and panorama edge coverage at entrance and viewport-top positions.
- Final Connections and Field note compositions were visually reviewed in both
  palettes on desktop and mobile. Camera metadata is absent from the added
  landscape derivative.
- Final `pnpm validate` passed formatting, lint, strict types, 142 unit tests
  and production build after the visual, parallax and popup-close fixes.
- Final source review and `git diff --check` passed. Existing unrelated work
  remains intact. No commit, push or deployment was performed.

Evidence: `.local/about-scroll-redesign-0160/` and
`/tmp/atoma-0160-final-validate.log`.
