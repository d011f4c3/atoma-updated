# Task 0180 — Wazuka harvest title

Date: 2026-10-19
Status: Implemented and verified locally

Use the owner's exact title, “Harvest in Wazuka, in Uji, Kyoto.”, in the About
Community harvest entry. Update the canonical story record so the card, popup,
standalone reader and reader metadata stay consistent. Add Japanese and Chinese
translations; preserve the earlier title's dictionary entry for saved studies.
No layout, photograph, URL, product-origin or commerce changes.

“Uji” here means the tea-growing region. Wazuka is a town in Kyoto Prefecture,
not a city inside Uji City. Kyoto's official tourism guide describes Wazuka in
the [Uji tea-growing region](https://www.kyototourism.org/en/column/36234/).
The requested English title is preserved exactly; translations make the regional
tea meaning explicit without introducing a new administrative claim.

Verify the rendered title in About and its popup, check narrow-screen wrapping,
run `pnpm validate` and review the scoped changes.

Verified the exact title in the rendered About entry and open popup at a 721 px
viewport, with no page overflow. `pnpm validate` passed formatting, lint, strict
types, all 202 tests and the production build. The change is limited to the shared
story title, its three translations and this record. No deployment.
