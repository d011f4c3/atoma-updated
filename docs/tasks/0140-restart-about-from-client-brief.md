# Task 0140 — Restart About from the original client briefs

Date: 2026-10-12
Status: Complete

## Authority and problem

The owner rejects the refined Field desk as missing the purpose of an About
page and asks to reread the client feedback and restart. The rejected desk
emphasized a photo-journal interface, repeated photography placeholders and
production notes. It did not explain the brand sufficiently.

## Source reading

Reread section 6 of `ATOMA_Website_Feedback_EN_2026-10-06.docx` and the
relevant sections of `ATOMA_Website_Storytelling_and_IA_Brief_v1.0.docx` directly
from the supplied originals in Downloads. Source documents remain outside
the app and repository. October feedback asks for a concise introduction to
application-led selection, the operating company and community relationships.
The storytelling brief explicitly assigns About the name (ATOM + MATCHA),
why the work starts in Wazuka, and the principle that technology extends
human work. Detailed regional storytelling belongs in the regional layer.

## Scope

Build one new continuous About composition at `/about-exploration`, with
`?direction=about` as a direct URL. Keep the earlier studies accessible through
their existing explicit query URLs. Preserve the canonical storefront and
commerce. No publication is included.

Lead with a useful explanation of ATOMA and application-led selection. Explain
the name as a method of understanding matcha, not a scientific claim. Give
Wazuka a concise introduction and room for the owner's harvest photographs,
then explain the people-first technology principle with space for the drone
and powersuit portraits. Photographs support the brand explanation; readers
do not need to operate a story selector to understand it.

The supplied storytelling brief identifies GVJ as the operator. Use only that
short source-backed working attribution in this private design study. Formal
legal entity wording and final public disclosure still need confirmation
before publication. No confidential suppliers, grower names, funded programs,
equipment outcomes or unverified provenance are added. Mark imagery as
placeholder; keep draft-review notes outside the customer-facing narrative.

## Verification

Review desktop and phone in both palettes, readable content order, image
placement, reduced motion, native navigation and shared theme/cart continuity.
Ensure all core About content is available without JavaScript. Run the focused
browser checks, `pnpm validate` and scoped final diff review.

## Result

Added a separate, continuous About page as the default exploration and at
`?direction=about`. Its opening explains application-led selection, followed
by the ATOM + MATCHA name, people and Wazuka, technology supporting human
work, and the source-backed company introduction. The Wazuka harvest is the
first entry. Two portrait spaces reserve the drone and powersuit photography.
Review notes remain outside the main narrative. Prior studies retain their
explicit URLs; the storefront and commerce implementation are unchanged.

## Verification completed

- Reviewed desktop and phone screenshots in Mist and Blue hour, with loaded
  archive photography and readable typography.
- `tests/about-atoma.mjs`: six viewport/palette scenarios (1366, 390 and 320 px)
  passed for layout, keyboard section links, browser history, theme, previous
  concept navigation, Shop and cart continuity. No remote requests or commerce
  writes were made; commerce reads were mocked.
- Server-rendered introduction, fallback URLs and native section links passed
  with JavaScript disabled. The shared native mobile menu remains operable.
- Updated earlier study checks for the new default route.
- `pnpm validate` passed: formatting, lint, types, all 130 unit tests and the
  production build. `git diff --check` passed and the scoped diff was reviewed.
- Browser evidence is local under `.local/about-restart-0140/browser/`.
