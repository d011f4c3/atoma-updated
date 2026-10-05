# Task 0088 — Second hero introduction study

Date: 2026-10-05
Status: Complete

## Requested outcome

Create a separate `/hero-study-2` focused only on the current hero's left-side
introduction: “A closer look at matcha.”, “Flavour. Texture. Performance.”,
“Matcha selected for a specific application.” and the Explore matcha action.

The owner rejected the initial Centered, Offset and Columns proposals as weaker
than the existing hero study. Replace them with three distinct type hierarchies:

- Display: a large three-line sentence, split supporting copy and a connected
  Explore action.
- Cadence: three ruled headline rows paired with the three attributes, followed
  by application copy and a filled action.
- Proof: the complete introductory sentence becomes a small caption above
  prominent Flavour, Texture and Performance typography.

Use the existing IBM Plex Mono, exact copy and both approved palettes. Group
the desktop action with the statement. Preserve the first hero study and the
homepage; no new direction is adopted by this task. During implementation, the
homepage independently adopted Specimen. Reuse that introduction for Current
and its responsive text-row height for all options, retaining bag geometry.

Only the introduction slot changes. Retain the current right-side bag image,
label, geometry, lighting and pointer behavior, full-height hero, header,
selection controls and one mounted material scene. The study toolbar sits above
the hero rather than shrinking its height. On phones the existing text/material/
action order is retained. Entrance and hover motion respect reduced motion.

Layout choices have shareable `?direction=` URLs. Appearance remains local to
the study. Explore must open the existing product flow and preserve selection,
quantity, references, cart pending guards, Origins return and reduced motion.
No new dependencies, assets, product claims, live commerce writes or deployment.

## Verification

Compare all four layouts and both palettes at desktop and 320px mobile, plus
the three new directions at 844×390 and 568×320. Check exact copy, readable uncut
text, non-overlapping content, keyboard Explore/return, stable right-hand geometry
against the homepage, retained bag/renderer nodes, product and quantity
continuity, direct-link reloads, local appearance and study isolation. Use
mocked catalog/cart data, review screenshots and the scoped diff, then run
`pnpm validate`.

## Results

- Replaced the rejected layouts with Display, Cadence and Proof. Current reuses
  the adopted Specimen component. Only the optional introduction slot and this
  separate study route are involved; no shared hero styles were changed.
- Reviewed desktop, phone and short-landscape captures in both palettes under
  `.local/qa/hero-study-2-revised/`. The desktop Explore action now belongs to the
  text composition, while mobile retains the text/material/action order.
- Browser checks passed 6/6 across 28 layout/theme/viewport combinations, including
  exact copy, no clipping or overlap, canonical viewer/header geometry, keyboard
  entry, mounted renderer identity, selection and quantity continuity, Origins
  return, mocked cart pending guards, shareable URLs and isolated appearance.
- After aligning Display's arrow to the full text-column width, the desktop and
  phone cases passed again. Final `pnpm validate` passed formatting, lint,
  TypeScript, all 63 unit tests and the production build. Scoped diff review and
  `git diff --check` passed.
