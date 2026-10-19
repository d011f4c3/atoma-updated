# Task 0144 — Compare two scrolling About concepts

Date: 2026-10-12
Status: Superseded after review — laboratory direction continues in Task 0145

## Authority

The owner requests multiple concepts based on the client brief and documents.
Retain the latest explicit direction: About should feel like a conventional
homepage and flow section by section, because the main storefront entrance is
unconventional. Preserve the restored homepage type scale and approved palette.

Both original DOCX documents were reread for content. Each concept must introduce
application-led selection, ATOM + MATCHA, GVJ as operator, relationships starting
in Wazuka, the harvest as the first field entry, and the forthcoming grower story
with drone and powersuit. Do not invent identities, activities, support outcomes
or product-origin connections.

## Concepts

1. **Field sequence:** a broad landscape opening, followed by a measured
   introduction to the approach and company, a harvest photograph alongside its
   story, and a paired technology spread.
2. **Working relationships:** a portrait-led opening, the selection/name/company
   presented together further down the page, a panoramic Wazuka chapter with the
   first-entry narrative beneath it, and a technology story between portraits.

Both are complete scrolling pages with all content visible. The comparison switch
is separate from the customer page content. Use the shared storefront header,
Mist/Blue hour themes and Directory footer. Typography stays within the homepage
bounds: 30px maximum desktop title, 24px mobile, 20px section headings. Existing
archive imagery remains clearly labelled as placeholder photography.

`direction=sequence` is the default and `about`/`film` fallback. The second option
is `direction=relationships`, with `desk` as a compatibility alias. Preserve four
earlier archived studies and all canonical storefront/commerce behavior. No
publishing, new dependencies, assets or external writes.

## Verification

Inspect both concepts at desktop, intermediate and phone widths in both themes.
Check continuous reading, section order, native anchors, image loading, type
bounds, keyboard comparison links, browser history, reduced motion, no-JavaScript
reading and theme/cart/Shop continuity. Run `pnpm validate` and review the final
diff.

Both proposals passed all 16 responsive/theme browser scenarios, reduced-motion
and no-JavaScript reading, comparison/history/cart continuity, and `pnpm validate`
(130 unit tests and production build). The owner rejected their visual character
as too boring and supplied the original brand notes again. Task 0145 replaces
the layouts with a stronger material-first laboratory direction.
