# 0173 — Adopt silver foil with interactive ATOMA stickers

Status: Implemented and verified locally.

## Owner request

Adopt the foil trio, retain silver packaging and replace the static sachet
presentation with an interactive ATOMA sticker. The supplied coffee labels and
Le Labo packet are visual references for concise typography, rules, paper and QR
placement; their brands and product claims are not ATOMA content.

## Bounded implementation

- Use one independent silver pouch asset with three live product labels on the
  canonical homepage after Explore matcha, the foil study and the Samples hero.
- Keep the selected order, all three sample contents, commerce and other saved
  imagery alternatives intact. Inspecting a pouch is not a purchase selection.
- Labels use existing product names, display codes, intended applications and
  the confirmed 30 g net content. No inferred ingredients, origins, supplier
  identities, lots, expiry or certification marks.
- Pointer lift and tilt, equivalent keyboard entry, and an inset label reader
  with product QR, close control, Escape and outside dismissal. Respect reduced
  motion, preserve focus and page position, and translate interface copy.
- QR assets point to the existing product routes on the current metadata origin.
  Confirm the final public origin before physical printing. This is a front-label
  visual direction, not a manufacturing specification or complete legal back label.

## Asset evidence

- [Foil asset and built-in ImageGen prompt](../design/foil-pouch-0173.md).
- [QR destinations and independent decode verification](../design/sample-qr-0173.md).

## Validation

- `pnpm validate`: formatting, ESLint, strict TypeScript, all 189 unit tests and
  production build pass. Final whitespace diff check passes.
- In-app browser review at desktop 1280 × 720, mobile 390 × 844 and narrow
  320 × 740. Homepage enters the foil sample view; the Samples hero uses the
  same component. No horizontal page or dialog overflow in inspected views.
- Enter opens the reader, the initial focus moves to Close, each tea updates
  the selected label/QR/product destination, and Escape or outside tap restores
  the opening control. Sample order remains unchanged. The added legend button
  also opens the reader. Desktop reader content fits without internal scrolling
  at 1280 × 720; mobile is inset with independently scrolling overflow if needed.
- Checked English/Blue hour and Japanese/Mist, then restored English/Blue hour.
  Reduced-motion CSS preserves resting pouch geometry and disables tilt/transitions.
- Three QR SVGs independently decoded to their exact current product URLs.
- Updated `tests/sample-imagery-study.mjs` with label switching, QR/destination,
  focus, scroll and order-preservation assertions. Syntax checked; this browser
  recipe was not executed. Actual UI checks above used the in-app browser.
- Screenshots and validation log: `.local/foil-labels-0173/`.
