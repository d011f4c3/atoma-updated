# Task 0277 — Hero and Wholesale motion

Date: 2026-10-23
Status: Complete

## Owner direction

Bring the polish of Samples' animation to the homepage hero and Wholesale, with
more reveals and especially a deliberate initial hero loading sequence.

The owner's follow-up rejects images growing toward the viewer and glitching
bottom text. Use stationary photographic mask reveals, drawn rules and settled
hero labels/actions instead; remove their character scrambling.

## Scope

- Keep the canonical hero's real image/font readiness loader and add a staged
  heading, supporting copy, application imagery, caption and action entrance.
  Keep the photographs at their final size and position, and keep all hero text
  settled after entry. Preserve the approved composition.
- Give Wholesale an immediate, nonblocking introduction and staged catalog
  arrival, followed by scroll reveals for the products and Why ATOMA section.
- Use explicit composed-group motion opt-ins instead of broadly removing
  existing control guards. Focus, anchors, reduced motion, no JavaScript and
  image failure must leave content reachable. No infinite decorative motion.
  Composed groups containing controls remain stationary during reveal so focus
  cannot move a purchase button between pointerdown and pointerup.
- Keep exact selections, quantities, search, image mode, localization, themes,
  dialog/history return and existing studies intact. No dependencies, backend
  changes, real orders or deployment.

## Verification

Use isolated commerce fixtures with normal motion to observe real animation
frames, ordering, scroll reveals and interaction during entrance. Check desktop
and mobile in both themes, reduced motion, delayed/failed imagery, no script and
no replay on theme/selection/dialog return. Run the focused motion tests and
`pnpm validate`, then review screenshots and the final diff. Evidence:
`.local/motion-0277/`.

## Delivered

- The canonical homepage releases a staged heading and copy, then uncovers
  stationary application photographs with a horizontal mask. Caption rules draw
  in, and captions and CTA labels use steady text without character scrambling.
  The existing readiness loader has a matching readout and curtain exit.
- Wholesale has separate introduction, toolbar, product and Why ATOMA reveals,
  with subtle image and hover details. Purchase hit areas stay fixed during
  entrance, including when pointer focus finishes a reveal.
- Explicit composed groups retain focus, anchor, reduced-motion and no-script
  safeguards. Late image arrival still fades in after a readiness timeout.
  Saved studies retain their existing entrance treatment.

## Verified

- Seven homepage motion cases pass: desktop/mobile loader sequencing, reduced
  motion at both widths, failed imagery, no JavaScript and delayed scripts.
- Five focused storefront cases pass: desktop/mobile hero sequencing and
  stationary image dimensions, desktop/mobile Wholesale reveals and shopping
  controls, and late-image recovery. Theme, search, dialog and in-place return
  retain state without replaying the entrance. Isolated fixtures prevent real
  commerce writes.
- Reviewed live intermediate mask frames and settled desktop/mobile captures.
- `pnpm validate` passes formatting, ESLint, TypeScript, all 256 tests and the
  production build. `git diff --check` passes.
