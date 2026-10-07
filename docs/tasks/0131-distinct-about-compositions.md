# Task 0131 — Distinct About compositions

Date: 2026-10-08
Status: Complete — study only
Authority: The owner says the four About layouts still look the same.

## Scope

Replace spacing-based variations with four distinct composition trees at
`/about-study`, reusing only the concise copy, image and action primitives.
Fieldnotes remains a photographic essay. Directory has real section links and
small photographs within its reading column. Ledger uses numbered horizontal
records with media cells. Montage interleaves unequal photographs and text.

Keep meaningful differences on phones: the directory index, the ledger number
gutter and montage's uneven image sizes. Preserve restrained shared type and
palettes, the shortened client-grounded content, prospective community language,
photo captions, reader return and the existing storefront. Retain legacy query
values (`compact` for Directory and `columns` for Montage) so saved links work.

No fabricated company information, community activities, product provenance or
new assets. No homepage adoption, commerce changes or deployment.

## Verification

Compare first viewports and complete pages for all four choices on desktop and
phones in both themes. Verify meaningful structural differences, not merely
different dimensions. Check Directory anchors, focus, mobile targets, reading
order, loaded photographs, reader return and local theme continuity. Run the
focused browser suite, `pnpm validate`, preserved-file checks and scoped review.

## Completed evidence

- Four explicit compositions share only editorial and action primitives.
  Fieldnotes retains the panoramic essay; Directory has a contents rail and
  small paired photographs; Ledger uses full-width numbered records; Montage
  interleaves a large photograph, short text and a smaller image.
- Phone differences start in the opening: Directory puts its index before the
  lead, Montage puts its offset photograph before the lead, and Ledger retains
  a numbered gutter. Shared body type and concise source-grounded copy remain.
- Directory links scroll to and focus their chapter, updating the URL fragment.
  The existing scroll controller handles normal and reduced motion. Busy cart
  state prevents navigation, as with the existing study controls.
- All four settled-source browser cases pass: 1366px and 320px in both palettes,
  each exercising all four directions. Tests now distinguish semantic document
  structures and coarse first-viewport compositions, as well as readable type,
  image loading, chapter order, overflow, reader return and local theme state.
- Two additional Directory cases pass with normal motion, checking keyboard
  and touch navigation, destination focus, URL fragments and settled scroll.
  All commerce reads are mocked and writes blocked. Browsers are closed.
- Final full-page and scrolled viewport captures were visually reviewed, with
  independent design review. Evidence and browser logs are retained locally in
  `.local/about-distinct-0131/`.
- `pnpm validate` passes formatting, ESLint, TypeScript, 130 unit tests and the
  production build. Scoped source review, `git diff --check` and preserved-file
  checksums pass. The canonical homepage, header, About popup and Origins
  provider are unchanged. No deployment.
