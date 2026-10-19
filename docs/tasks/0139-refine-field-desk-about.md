# Task 0139 — Refine Field desk around the client’s About brief

Date: 2026-10-12
Status: Complete — refined local concept ready for review

## Authority

The owner selects Field desk for further refinement and asks to use the
client's About direction, preserving room for the discussed grower/technology
photography and making the Wazuka harvest the first entry.

## Scope and content

Refine only Field desk at `/about-exploration?direction=desk`, retaining its
photographic table, shared appearance/cart controls and working navigation.
Keep Field film and the earlier studies available, and preserve the canonical
storefront. This remains a local English design study, not a publication.

Use October 6 feedback §6 and the original brand-direction synthesis: ATOMA
helps visitors understand, select and buy matcha for specific applications;
deeper fieldwork brings places, communities and people into view. A growing
editorial archive begins with Wazuka, rather than making Wazuka the entire
brand identity. Visitor-facing prose is an adaptation of that direction,
not invented quotations from the client or growers.

Introduce ATOMA’s purpose before the first journal entry. Frame the harvest
as Entry 01, with drone and support suit as two views of a follow-on story
in preparation. Do not assign that story a location not supplied by the owner.
Reserve a wider photographic
sequence for the harvest images while preserving the overlapping prints and
reading slip. Include a place for the operating-company introduction requested
by the client; the supplied brief does not confirm its identity. The user has
been asked for the name/description without blocking composition work.

Keep supplied regional images marked as placeholders. No grower identity,
equipment specification, outcome, ATOMA-funded program, quotation, or product
provenance is inferred. Separate documented activity from intended work.

## Verification

Review desktop and phone, both palettes, image positions, readable copy,
chapter controls, deep links, back navigation and reduced motion. Retain the
existing no-JavaScript reading fallback and commerce continuity. Run focused
browser checks, `pnpm validate` and a scoped final diff review.

## Outcome

The opening now introduces ATOMA as an interface for understanding, selecting
and buying matcha, with application, flavour, texture and performance as the
starting point. The copy adapts the client's direction rather than presenting
editorial prose as a quotation. The retained photographic table follows a
short introduction to the field journal.

Wazuka is explicitly Entry 01, titled “The harvest, up close.” A portrait leads
the table, with a separate harvest contact sheet reserving landscape, work and
detail photographs. The drone and powersuit prints are marked as two views of
a next story in preparation; neither is assigned an unsupported location or
promoted into a completed community-support project. Their existing direct
links and selection controls still work.

A compact company introduction area is reserved with explicit study-only
placeholder wording. The brief does not supply approved public company
wording, and no name has been inferred from internal operational context.
The canonical homepage, Field film, earlier concepts and commerce code are
unchanged by this refinement.

## Verification outcome

All 12 Field desk browser scenarios pass across 1366px, 390px and 320px,
both palettes and both motion preferences, including chapter navigation,
mobile Next/Previous, theme/history/cart continuity and image loading.
Four additional no-JavaScript desktop/phone checks confirm all stories remain
readable with working native anchors. The harvest contact sheet and the
reserved company introduction were checked separately. Desktop and phone
screenshots in both themes were reviewed; a phone contact-sheet grid override
was corrected so the landscape leads and portrait/detail follow side by side.

`pnpm validate` passes formatting, ESLint, strict TypeScript, all 130 unit
tests and the production build. Scoped source and final whitespace review
pass. Evidence is in `.local/about-desk-0139/`. No dependencies, backend
changes, commit, push or deployment are included.
