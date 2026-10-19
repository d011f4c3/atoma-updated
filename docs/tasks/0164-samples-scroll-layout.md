# Task 0164 — A scrolling Sample Set experience

## Request and scope

After reviewing the new About layout, the owner said it was much better and
asked to apply the same approach to `/samples`, with a new layout. This task
changes the canonical Samples page. The accepted About composition, homepage
sample entrances, right-side studies and saved Samples studies stay intact.

Read the September 28 direction, October 6 client feedback and Task 0157.
The Sample Set contains 30 g each of Ceremonial, Barista and Culinary: 90 g
in total. Application, quantity and a direct purchase route remain central.

## Composition

The opening pairs a generous view of all three powders with the real order
area. On desktop it holds briefly as the next section takes over;
the powder group recedes with scroll. Ordering is available before the story.

Inside the set becomes a continuous horizontal comparison driven by native
vertical scrolling. Each tea has a large powder photograph, its approved code,
included weight, application and existing preparation guidance. Numbered
anchors jump directly to each entry. All three remain part of one set;
viewing an entry never changes the order. No sensory or provenance claims are added.

A full-width preparation photograph opens out as it enters the viewport,
followed by the route to the 1 kg collection and a return to the set order.
The photograph is supplied general preparation context, not a documented
result made from one of these samples.

Phones, short viewports, reduced motion and no JavaScript show the same content
in ordinary vertical order. Native scroll is retained, with one scheduled
animation frame per scroll/resize update and no new motion dependency.

## Preserved contracts

Keep the approved Mist and Blue hour palettes, IBM Plex Mono, the existing
Shop title scale, 20 px section titles and 14 px body text. Primary actions
compose the actual homepage action style, including its size, weight, border,
6 px corners and arrow. Commerce still uses the reviewed catalog/cart hooks.
The sample offer remains unpublished; no price, shipping or dispatch promise
is invented and no other product is substituted for the set.

## Verification

Focused browser checks passed for 1440 px light desktop, 390 px dark Japanese
phone, desktop reduced motion and no JavaScript. The three direct shortcuts,
scroll progression, image readiness, catalog failure/retry focus and return to
ordering were checked. The mounted powder elements survive the journey. There was no horizontal page overflow, runtime error or external
write. Reviewed the opening, comparison and preparation transition visually.

`pnpm validate` passed formatting, lint, strict types, 142 unit tests and the
production build. A separate focused About regression run also passed after
its no-JavaScript fallback fixes. Evidence is in `.local/samples-scroll-0164/`
and `.local/samples-scroll-0164-validate.log`. No deployment was performed.

## Owner refinement — make the hero easier to buy from

The owner approved the page’s visual direction and asked for a simpler hero,
less text and optional information. The hero now says Sample Set and Three
matcha · 30 g each. All three powders stay visible with plain names and weights;
the four preview buttons are removed so the set cannot look like a single-tea
choice. Comparison remains in the scrolling section below.

The order area shows the set quantity and total net weight, then the actual
availability and purchase controls. Price, format, quantity and Add to cart
remain directly visible when a reviewed offer is available. Supporting ordering
information uses a native expandable disclosure; the unavailable status stays
visible. The retry action uses the existing site button. Saved purchase studies
keep their previous information order.

The final hero was checked at 1440 px light and 390 px dark English. All three
powders and labels stay mounted and visible, no preview choices remain, and the
ordering disclosure opens/closes with Enter and Space without overflow or
hiding the status and primary action. The complete order area is visible in
both opening viewports. Final screenshots use the `hero-opening` suffix;
`hero-final.log` records these checks. The full validation command passed again
after this refinement.
