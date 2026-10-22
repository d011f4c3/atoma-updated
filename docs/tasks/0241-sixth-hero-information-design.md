# Task 0241 — A clearer sixth page with the approved hero

Date: 2026-10-21
Status: Implemented and verified locally

## Authority and scope

The owner requests rounded image corners in the current fifth page and a new
`/new-hero6` with exactly the same hero but different sections below, emphasizing
ease of information, presentation and beautiful design.

- Round and clip the application and origin photographs on `/new-hero5`.
  Preserve the transparent hero composition and existing controls.
- Share the approved first-view component and styles between the fifth and sixth
  pages. Preserve contained gradient, typography, themes and native entrances.
- Give the sixth page its own lower composition: a compact section directory,
  generous application folios with visible buying controls, a focused Sample Set
  panel, a photographic origin feature and a concise named repeat-order list.
- Reuse the canonical content, labelled reference images and catalog/cart
  authority. Keep individual product and sample selection memory scoped to the
  new page, plus existing reader, history, pending/error and focus behavior.
- Keep mobile controls readable, images bounded, corners consistent, keyboard
  navigation and reduced motion intact. Preserve all earlier concepts.
- No new facts, images, dependencies, services, deployment or live commerce writes.

## Verification

Review both themes at desktop and mobile sizes, four locales and enlarged text.
Check rounded/clipped images, complete purchase controls, native anchors, exact
1 kg links, cart guards, reader return and selection continuity using isolated
fixtures. Compare hero geometry between the fifth and sixth pages. Run relevant
regression checks, `pnpm validate` and review the final scoped diff.

## Implementation

- The fifth page's application and origin photographs clip at 12 px. Actual
  images inherit the frame radius; the transparent hero artwork is unchanged.
- `NewHeroApplicationHero` owns the exact approved opening for both routes,
  sharing its original styles while adapting native section IDs and data hooks.
  The sixth page retains the same header, artwork, text and contained gradient.
- The sixth page's small section directory leads to four distinct sections.
  Wide product folios pair rounded reference photography, application identity
  and a separate purchase panel. Tablet layouts use two columns; phone layouts
  stack the content with compact images and visible controls.
- The Sample Set uses one raised panel with its three named 20 g contents,
  canonical codes, optional pouch inspection and immediate ordering. On phones,
  ordering precedes the visual. Product and sample memory use `new-hero6`.
- The origin feature pairs a large rounded regional image with two short reading
  blocks. Wazuka remains scoped to Ceremonial. The existing reader and native
  fallback are retained. A compact repeat-order list links each exact named
  product to its canonical 1 kg format.
- All new boxed controls use the existing 6 px button token. The route joins
  the settled reading/control motion policy, and the two new phrases are
  translated for all supported locales. No new commerce authority or assets.

## Browser verification

- `tests/new-hero6.mjs` passes all ten viewport/theme/locale profiles, plus native
  links, section-directory navigation/focus, per-product and sample history,
  fixture cart additions, duplicate guards, pending locks and error recovery.
- Wazuka reader return restores scroll, focus, URL and selection. Delayed and
  failed images do not prevent ordering. All boxed purchase controls match the
  hero's 6 px radius; product and origin photographs clip at 12 px.
- A 320 px phone with 200% text retains readable headings, navigation and buying
  controls without document overflow. Long headings, directory labels and sample
  links wrap at narrow widths. Desktop and phone layouts were reviewed in both
  themes. Evidence: `.local/new-hero-0241/`.
- The complete `/new-hero5` regression suite also passes all ten profiles and
  interactions. The approved first-view and Sample/Explore geometry matches
  Task 0240 with zero pixel difference on both routes across every profile;
  gradient containment is unchanged. Fifth-page evidence is in
  `.local/new-hero-0241/regression-hero5/`.
- All browser commerce uses isolated fixtures; no live mutations occurred.
- `pnpm validate` passes formatting, lint, TypeScript, all 238 unit tests and
  the production build. Final scoped diff and whitespace checks pass. No
  deployment was performed. Log: `.local/new-hero-0241/validate.log`.
