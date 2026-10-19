# Task 0155 — Adopt the selected sample entrances

The owner selects Connected on the dedicated Shop page and Quiet repetition on
only the left side of the homepage's opened Explore experience. The right side
needs further comparison. This request takes priority before returning to the
pending About narrative refinement.

Adopt the existing sample collection card in Shop and compact rail beside the
homepage tea choices. Preserve the initial homepage, real catalog and commerce,
selection state, mounted material and persistent theme. Do not automatically
adopt the study's right panel or workspace/footer links.

Extend `/samples-entry-study` with an independent right-side comparison: current
direction, off, compact note, photographic Overview panel, or information
footnote. All sample links continue to `/samples`. The explicit comparisons keep
the left choice and suppress ancillary study entrances, making the proposed
right placement clear. Preserve earlier directions and study URLs.

Validation: targeted responsive, keyboard, state-continuity and theme checks,
then `pnpm validate` and scoped diff review. No deployment or new commerce offer.

## Result

Connected is adopted on `/shop`; Quiet repetition is adopted on the left of the
opened homepage selection. Canonical Shop keeps the persistent theme switch.
Right-side entries remain independent study options, including the adopted
left-only baseline at `?direction=quiet&context=explore&right=off`.

Eleven targeted browser scenarios passed: 24 original study combinations and
64 right-entry/view/theme combinations, canonical homepage/Shop, keyboard and
mobile use, selected tea/quantity/material continuity, locales and query fallback.
All writes were blocked in browser fixtures. Screenshots reviewed in
`.local/samples-entry-0155/`. `pnpm validate` passed formatting, lint, types,
142 unit tests and the production build. Final diff/whitespace review passed.
No commerce, deployment or dependency changes.
