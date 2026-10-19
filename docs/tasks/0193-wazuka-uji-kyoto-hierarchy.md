# Task 0193 — Wazuka within Kyoto's Uji tea-growing region

Date: 2026-10-19
Status: implemented; scoped source checks passed, parent validation pending.

## Request and source distinction

The owner requests a clear location hierarchy:
**Kyoto Prefecture → Uji tea-growing region → Wazuka**.
Uji here describes the tea-growing region. Wazuka Town and Uji City remain
separate municipalities in Kyoto Prefecture.

Official sources reviewed on 2026-10-19:

- [Another Kyoto official travel guide](https://www.kyototourism.org/en/column/36234/)
  describes Wazuka in southern Kyoto Prefecture and within Uji's tea-growing
  region.
- [Wazuka's official tourism site](https://www.wazuka-kyoto.jp/en) places the town
  in southern Kyoto Prefecture and describes its role in Uji tea production.

The regional description is distinct from the broader Uji tea designation and
from a specific product's documented growing or processing location.

## Copy changes

- About's opening photograph now displays the requested hierarchy in order.
- The shared harvest title reads “Harvest in Wazuka, Uji tea region, Kyoto.”
  Both Community story introductions identify Wazuka's regional context, which
  carries through the cards, popup reader, standalone story and metadata.
- Wazuka's Origins field record uses the same hierarchy; its short photograph
  captions include the Uji tea region. Kyoto and Wazuka place descriptions,
  the Uji explanation and the homepage Origins context clarify the distinction.
- Every new string has Japanese, Simplified Chinese and Traditional Chinese
  translations. Historical translations remain available for saved studies.

The administrative place graph remains Japan → Kyoto → Wazuka, with Uji City
as a separate municipality. No new administrative parent, place ID, provenance
link or product attribution is introduced. Confirmed Ceremonial origin and
unpublished UJI-series growing/processing details remain as before. Product
codes, bag labels, photos, layouts, reader behavior and commerce are untouched.

## Verification

- All 46 focused Origins, preview, designation, people and localization tests
  pass, including translation-key uniqueness and product-provenance boundaries.
- Scoped ESLint, Prettier and `git diff --check` pass.
- TypeScript reports only stale generated `.next` imports for sample-study
  routes being removed in concurrent work. No errors point to the changed source
  files; parent owns regeneration and final repository validation.
- Parent visual review should confirm the longer location captions at phone
  widths. No browser session was opened for this subtask.
