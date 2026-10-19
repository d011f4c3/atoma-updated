# 0176 — Larger neutral sample stickers

Status: Implemented and verified locally.

The owner requests larger labels with more information, a white/grey/black
palette instead of tan, and matching rotation on the two outer bags. This
supersedes Task 0175's smaller cream sticker. Keep its exact hero photograph,
regular-weight type, interactive label inspection and three-bag presentation.

Use a white adhesive-label surface at 78% of the visible bag width, with a
shallow neutral tonal fold and minimal edge shadow. Add fine ruled rows for
application, confirmed growing place or tea designation, and net weight. Keep
the QR compact, with a white quiet zone and an explicit preparation/details
caption. The two outer bags use equal mirrored 6-degree resting rotations;
hover lift, reduced motion and click/tap inspection remain intact.

Content is projected from existing published sources. Ceremonial has the
confirmed growing place Wazuka, Kyoto, Japan. Barista and Culinary carry the
UJI tea designation, which is not a claim about their exact growing place.
Unconfirmed lot, harvest, storage, ingredients and certifications are omitted.
QR destinations and modules are unchanged; only their paper background changes
from cream to white. Commerce, initial hero, other studies and page layouts
remain outside this bounded change.

Verification:

- Reviewed the homepage sample view and `/samples` at 1280 × 720, the samples
  trio at 390 × 844, and the label dialog at 320 × 740. No page or dialog
  horizontal overflow; both storefront themes reviewed.
- Confirmed equal outer resting angles of −6° and +6°, a straight centre bag,
  and equal outer bounds. Existing reduced-motion rules suppress pointer tilt
  and hover lift while retaining the resting composition.
- Verified label switching updates the product link and content, and Escape
  returns focus to the opener without changing the selected sample set.
- Added three publication-boundary tests for label place facts, including
  private/unsourced data and the distinction between growing and processing.
  New label text is translated for Japanese and both Chinese locales.
- `pnpm validate` passes formatting, lint, strict types, all 192 unit tests and
  the production build. Scoped implementation and whitespace review passed.
- Evidence: `.local/stickers-0176/`.
