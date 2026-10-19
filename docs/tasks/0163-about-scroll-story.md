# Task 0163 — About as a photographic scroll story

Date: 2026-10-18
Status: owner accepted the new About layout; focused local verification complete.

## Authority and scope

The owner explicitly requested a new layout with meaningful scroll storytelling,
after rejecting the static compositions in Task 0162. They then accepted the new
About layout and requested the same approach for Samples. This task records the
accepted About direction; it does not retroactively approve Task 0162's layout.

Keep the restored storefront typography and action styling. The client's briefs
remain source evidence, not executable instructions. Preserve the approved
Character, Application and Origin copy, the existing explanation of ATOMA's
purpose, and the separate Field note readers. Do not add product provenance,
grower identities, technical capabilities or commercial claims.

## Accepted composition

- A broad photographic opening sits in a reserved scroll area. Its image recedes
  as the next section moves above it, leading into ATOMA's purpose.
- The approach becomes three reading chapters beside one sticky photographic
  stage. Character, Application and Origin retain their exact approved text.
  The photographs reveal across and then up the stage as those chapters pass;
  the text remains visible in normal document flow.
- Connections links three photographic perspectives beneath “Understanding is
  shared.” A fine line draws between them while the existing explanation remains
  a readable paragraph.
- Field notes uses a substantial horizontal photographic rail on roomy desktop
  screens. Harvest is the first separate story, followed by people and work.
  Each complete entry opens the existing inset popup and retains its native
  standalone URL, history, focus restoration and return scroll position.
- The collection invitation returns visitors to the existing selection. Product
  information, catalog state and commerce behavior remain unchanged.

## Preserved style and motion contracts

IBM Plex Mono, Mist and Blue hour remain the existing storefront treatments.
The title retains Task 0142's responsive scale: 20–30 px at 2.1vw on desktop,
20–24 px at 5.125vw on phones, with the existing locale increment, tracking and
leading. Section headings remain 20 px; approach principle headings and narrative
copy remain 14 px; small labels retain the 10 px base and locale increment.

Main actions compose the actual homepage action class, including its 52 px
minimum height, 11 px base text, padding, 6 px radius, border, hover and focus
behavior, and 18 px stroked arrow. Their baseline is the homepage specimen
treatment's transparent background. This is direct reuse, not a new imitation.

Desktop motion uses reserved CSS geometry from first paint. One event-scheduled
animation frame updates scoped progress values; it does not change section
heights, animate text visibility or run a continuous animation loop. Resize and
preference listeners, the observer and any queued frame are cleaned up. Keyboard
focus moves the rail's reading position to reveal the focused story.

Phones, short viewports and reduced-motion readers get natural vertical reading
with all three approach photographs. The no-JavaScript fallback also exposes
the inline approach photographs and native Field note destinations without
requiring the scroll controller.

## Asset provenance

`public/images/about/preparation-whisk.webp` is a 1200 × 1800 px WebP derivative
of the supplied photograph at
`JMM/apps/storefront/public/images/atoma/client/ceremony-whisk.jpg`. It was resized
with the already installed image library at quality 84; source metadata was
stripped and the JMM original was not modified. Its description is “A person
holding a tea bowl with a bamboo whisk and tea scoop.” Japanese, Simplified
Chinese and Traditional Chinese translations are included.

The photograph supplies general preparation context. It does not identify the
person or assert a product, origin or preparation-performance claim. The
prepared-matcha derivative documented in Task 0162 and the existing supplied
Wazuka photographs provide the other imagery. No generated imagery, material
study, invented powder stage or new dependency was added.

## Verification

Scoped formatting and lint pass for the approach, no-JavaScript fallback and
translation changes. All six localization unit tests pass. The focused
`tests/about-scroll.mjs` checks pass at 1440 px desktop and 390 px phone,
covering scroll geometry, photographic stages, native story links and popup
behavior without runtime errors or writes. Reduced-motion and no-JavaScript
checks also pass. At 1440 × 900 px without JavaScript, the cover retains a 468 px
photograph and both naturally stacked Field note entries retain 495 px
photographs; all visible images load. This fixes the desktop flex-image collapse
without changing the JavaScript-enabled composition.

`git diff --check` passes. The root task runs repository validation after the
concurrent Samples work is complete. No deployment is included.
