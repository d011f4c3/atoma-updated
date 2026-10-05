# Task 0054 — Inline origins exploration

Date: 2026-10-01
Status: Complete

## Requested outcome

Explore a clearer Origins layout within the interactive product view. Show where
the selected matcha is grown and useful place context immediately, without
requiring the visitor to open the deeper Origins reader.

Keep the existing homepage and selector study. Add `/origins-study` with Current,
Field sheet, Split view and Place index comparisons. Start on Origins with the
accepted Index product choices and Brackets information navigation. Retain the
powder scene, themes, purchase selection and existing Origins reader.

## Evidence and content

Reread both owner-supplied RTF briefs. They inform the quiet material-first
hierarchy and progression from product to information, origin and people; they
do not authorize unrelated implementation. No raw source documents enter the app.

The canonical origin graph records the owner's 2026-10-01 confirmation that the
three current matchas are grown in Wazuka, Kyoto. This preview uses only published,
material-level growing records. It does not broaden a lot-only record, infer a
growing origin from processing/shipping, or infer provenance from a product name.

The existing field photograph and observation remain captioned as Kyoto context.
They are not represented as a specific product's field or lot. The closest
documented ancestor supplies editorial photography when no local photograph exists.

The short Wazuka landscape description is independently sourced from the
[Town of Wazuka landscape plan, April 2026, chapter 1, section 1, PDF page 4](https://www.town.wazuka.lg.jp/material/files/group/3/wazuka-keikankeikakuhenkou.pdf).
It describes tea fields on slopes around the river valley and wooded hills, with
an inline source link. It makes no claims about product taste, elevation, cultivar,
harvest, certification or individual growers.

## Implementation

- Three compact, distinct photo/fact arrangements share the same canonical data.
- Country, region, locality, regional landscape and photographic observation are
  visible before opening the reader. Photos fill their frames without blank areas.
- Local layout/theme switches preserve the mounted configurator and order state.
- The existing homepage defaults and saved selector study remain unchanged.
- Unknown origins display an explicit empty state with browsing and shopping actions.
- Comparison is linked from `/homepage-study`.

## Verification

- Four helper tests pass: canonical growing records, unknown origins, processed
  and lot-only exclusions, and nearest-ancestor photographic context.
- Three isolated browser cases pass across 1366×768 and 320×700, both themes and
  all three new layouts. Location, hierarchy, photograph, context and actions fit
  without opening the reader or scrolling the information panel.
- Product, quantity, scene and URL continuity survive layout/theme changes and
  the keyboard Origins round-trip. Unknown origins and unchanged homepage/study
  defaults are verified. All commerce requests are mocked; no writes occurred.
- Sixteen visual comparisons are saved in `.local/qa/origins-study-visual/`;
  final typography captures are in `.local/qa/origins-study-final/`.
- A browser-test race was diagnosed using focus/keydown traces: the existing
  deferred view-heading focus could run between synthetic focus and Enter. The
  test now waits for the heading-focus contract before the keyboard action.
- `pnpm validate` passes: formatting, ESLint, strict TypeScript, 60 unit tests and
  production build. Final scoped review and `git diff --check` pass.
