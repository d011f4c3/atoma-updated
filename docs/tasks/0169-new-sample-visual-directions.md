# Task 0169 — New visual directions for the Sample Set

Date: 2026-10-18
Status: complete.

## Request and scope

The owner requests other visual ways to show the matcha set that have not
already been explored. Extend the isolated `/samples-imagery-study` with three
new concepts beyond the existing powder-swatch arrangements. Preserve the
four earlier directions, canonical homepage, selection, material renderer,
purchase behavior and current Shopify draft state.

## Directions

- Foil trio: three compact silver sachets composed as one physical set.
- Open set: an open presentation box holding three sample sachets.
- Powder landscape: a sculptural arrangement of three loose matcha mounds.

Images are generated visual concepts using the built-in image generation tool.
Packaging is unconfirmed and explicitly labeled as a concept in the study.
The powder image is an illustrative material composition, not documentary
photography or a claim about exact tea color. Contents remain the confirmed
three 30 g matcha. No new commercial facts, price or stock are introduced.

## Implementation and assets

The three new options appear first in the same study, above the four earlier
compositions. The study defaults to Foil trio; canonical `/` still uses Set
portrait. The artwork changes in place, retaining the tea renderer and order.
Each transparent image is contained within the left stage, with sizing adjusted
to the subject's visible bounds. Both storefront palettes share these assets.

Assets saved in `public/images/samples/study/`:

- `foil-trio.png`
- `open-set.png`
- `powder-landscape.png`

Generation used the built-in `image_gen` tool, one call per asset, with no input
photographs. Originals remain in the tool's generated-image directory. Exact
[prompts](../design/sample-visual-prompts-0169.md) are recorded separately.

Transition review exposed a retained tea bag painting behind the study after
Shop → Sample Set. The hidden tea stage now also uses zero opacity so explicit
visibility on its bag descendants cannot show through. It retains measurable
bounds for initialization and remains mounted, with its existing inert state.

## Verification

- All seven options pass at 1440 px Mist and 390 px Blue hour (14 checks).
  New subjects are fully visible, descriptions readable, and no horizontal
  overflow or runtime errors occur. All six concept captures were reviewed.
- The test retains both imagery and tea DOM roots, restores Barista / 200 g /
  quantity 2 across the study changes, and confirms canonical `/` remains Set
  portrait. The hidden stage cannot paint over the concepts.
- `tests/sample-imagery-study.mjs` uses isolated local catalog/cart fixtures,
  blocks external traffic and all writes, and passes scoped formatting/lint.
- `pnpm validate` passes: formatting, lint, strict types, all 146 unit tests and
  production build. `git diff --check` passes.
- Captures and run log are under `.local/sample-imagery-0169/` and
  `.local/sample-imagery-0169-smoke-final.log`.
- A separate live read returned catalog HTTP 503 / unavailable during review.
  Visual selection works independently; commerce verification here uses the
  isolated fixtures. No catalog adapter, credentials or Shopify state changed.
