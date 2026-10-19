# Task 0143 — A flowing About landing page

Date: 2026-10-12
Status: Complete — local implementation; comparison continues in Task 0144

## Authority and evidence

The owner rejects both concepts: Perspective feels disjointed, with strange
colours and layouts; Open book resembles Tumblr. The owner also explicitly
rejects a subsequent contained panel: About should do the work of a conventional
homepage because the storefront homepage uses an unconventional product
experience. It must flow section by section, rather than packing the introduction
and stories into one screen. That correction governs this implementation.

Reread the original October 6 feedback and storytelling/IA DOCX documents. About
must explain application-led selection, the name, GVJ as operator, relationships
beginning in Wazuka, and technology supporting human work. Wazuka harvest is the
first entry; the grower with a drone and powersuit is a story to follow.

## Implementation

Build one scrolling landing page using the actual homepage Mist/Blue hour palette,
restrained mono type, shared header, familiar rules and Directory footer. An open
introduction and broad photograph establish the page. Further scrolling introduces
the approach/name/company, then the first harvest entry, then people and
technology, followed by a shop action. Each subject gets its own space. All
sections are present together; there are no entry tabs, hidden stories or internal
reading panels.

Use the restored homepage title scale (20–30px desktop, 20–24px mobile), 20px
section headings and readable sentence-case copy. Reserve substantial photography
areas for the harvest and two future portraits. Existing archive imagery is
clearly placeholder material; no names, support outcomes, origin connections or
equipment results are invented.

Both rejected concept URLs and the interim entry URLs open the complete page.
Preserve the four earlier archived studies, canonical storefront, commerce and
selection state. Keep rejected source snapshots in the ignored local evidence
folder. No dependencies, new assets, deployment or external writes.

## Verification

Review desktop, intermediate and phone layouts in both themes. Verify all sections
are visible and sequential, native section navigation, no-JavaScript reading,
image loading, type bounds, overflow, reduced motion and cart/theme continuity.
Run `pnpm validate` and review the final scoped diff.

The flowing page passed eight responsive/theme scenarios, reduced-motion and
no-JavaScript reading, native navigation, image and overflow checks, and commerce
continuity. `pnpm validate` passed all 130 unit tests and the production build.
The owner then requested multiple concepts, continued in Task 0144.
