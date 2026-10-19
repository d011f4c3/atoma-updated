# Task 0172 — About content and Community stories

Date: 2026-10-18
Status: Implemented and verified locally.

The owner asks that About clearly introduce application-led matcha selection,
the company behind ATOMA, and relationships with places and communities. Keep
the existing field-note stories, with Community as their visible section name.

Preserve the accepted scroll composition, typography, motion, photographs,
exact Character / Application / Origin copy, native story destinations and popup
history/focus/scroll behavior. This is a content pass, not another layout study.

Promote the source-backed GVJ operator attribution from the closing CTA into the
main company introduction. State specific applications in the supporting copy.
Connect the relationships section to field visits and photography beginning in
Wazuka. Rename the visible collection and reader labels to Community / Read story,
retaining existing `/field-notes/` routes and `#field-note=` links for compatibility.

The October feedback §6 and September direction are evidence. The supplied
Storytelling brief identifies GVJ as operator; no legal name, founders, history,
community funding, farm ownership, direct-sourcing claims or new partner
identities are inferred. Community stories remain distinct from product origins.

Localize new copy into the existing Japanese and Chinese dictionaries. Check
content coverage, desktop/mobile layout and popup continuity, then run
`pnpm validate` and inspect the final scoped diff. No deployment or commerce changes.

## Verification

The supplied `ATOMA_Website_Storytelling_and_IA_Brief_v1.0.docx` identifies GVJ as
storefront operator and Phase 1 seller of record. Only the short operator
attribution is used; formal company disclosure remains outside this copy pass.

CUA browser review passed at 1280 px desktop, 390 px phone and 320 px Japanese.
Company copy fits the existing type scale, Community retains both story entries,
and no horizontal overflow was observed. Harvest opens the existing desktop
popup, Escape returns to the same scroll position, and the technology popup
opens by keyboard on mobile and returns focus to its entry after dismissal.
Existing story hashes and standalone URLs are unchanged.

All new strings have Japanese and Simplified/Traditional Chinese translations.
`pnpm validate` passes formatting, lint, types, all 189 unit tests and the
production build. Existing About browser fixtures were updated for the country
API and renamed labels, with static syntax checks; standalone browser runners
were not run. Their historical layout assertions remain outside this content pass.
Final scoped review and `git diff --check` pass. Evidence is under
`.local/about-content-0172/`. No deployment or Shopify changes.
