# Bag and purchase quality pass — Task 0020

This records the owner's later purchase-clarity and labeled-bag direction.
It supersedes the earlier Task 0019 layout review where they differ.

## Reviewed result

The tray stays on `/` and `/light`. Standard selection shows three uses and
the buying controls together. Detailed material content moves into an optional
accessible drawer. The builder has Matcha → Quantity, with label editing as
an optional extension. No permanent property sheet sits below the image.

`/concept-02` now renders a separate silver laminate bag. Its cold-paper
label interprets the owner's Tot Herba reference through monospaced type,
ruled rows, two columns, material notes, format and a personal reference.
Matcha powder remains the primary identity. Actual supplied powder images
disperse and reform across selection, then gather into the package.
`/concept-02/canister` retains the modeled metal canister and its label.

The first bag review found the opening too cylindrical and the technical text
too faint and small. The final pass narrows and pinches the pouch opening,
retains upright flexible panels, enlarges secondary text by approximately 20%,
strengthens rules and reduces the heading. The extra slogan was removed.
An independent reviewer confirmed both issues resolved in the final captures.

Mobile label editing frames the lower printed reference closely; returning
to quantity restores the complete package and quantity arrangement. Long
references wrap within the printed sheet. These are visual packaging studies;
personalization is a local preview and is not sent as a printing instruction.

## Evidence

- Full browser regression suite: 22/22, with catalog/cart responses mocked.
- After final visual tweaks: nine affected Concept 02/backup checks passed again.
- Desktop, 390px and 320px scene review: normal/reduced motion, rapid product
  changes, gather/open/close, reference editing and quantity restoration.
- WebGL loss: corresponding actual material photo and static label fields;
  canvas is disposed and the obsolete generated canister PNG is not requested.
- No horizontal overflow or browser errors in the reviewed flows.
- `pnpm validate`: formatting, lint, strict TypeScript, 15 unit tests and
  production build passed. Final diff/whitespace review passed.
- In-app browser checked against the actual local catalog; preview entered
  without adding to cart or making a service write.

Local screenshots: `.local/qa/bag-polished/` and
`.local/qa/deep-cap-final/`. Broader purchase review:
`.local/qa/design-review-0020/`. Generated evidence is ignored by Git.
