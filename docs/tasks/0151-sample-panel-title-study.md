# Task 0151 — Sample panel title treatments

Date: 2026-10-17
Status: Study complete; placement adoption remains a later step

## Authority and scope

The owner wants samples in multiple places, but asks to compare different ways
of presenting the panel title before implementation. This task studies the
Sample Set heading in compact and purchase contexts. Keep the canonical
homepage, current sample placement and `/samples` appearance unchanged.

Compare restrained typographic treatments using the existing mono scale,
Mist / Blue hour themes, sample photography and confirmed 3 × 30 g contents.
Provide a side-by-side title study and an in-context title control on the
existing `/samples-page-study`, preserving its three layouts and live purchase
state. Keep the current treatment as a baseline. No invented codes, prices,
availability, claims or commerce changes. Multiple-location adoption follows
the owner's choice; this task does not roll it out.

## Verification

Review all title treatments in compact and purchase sizes, both themes and
mobile/desktop. Check meaningful headings, query fallbacks, keyboard controls,
locale fit, retained purchase state and retry focus. Run the smallest relevant
checks, `pnpm validate`, and inspect the scoped diff.

## Result

`/samples-title-study` compares Current, Quiet title, Register, Ruled caption,
Edge label and Quantity first side by side. Each includes purchase and compact
examples and a link to its in-page preview. The existing `/samples-page-study`
has an independent Panel title selector across all three layouts, with query
links that can be shared. Unknown title values safely use Current.

The shared purchase component accepts an optional title treatment and preserves
its real heading ID, retry focus and state. Canonical `/samples` still renders
its original header markup. No additional sample placement was adopted.

Visual checks cover both sizes, 320px/1440px, both themes and localized Japanese
and Traditional Chinese mobile text. Browser checks cover stable purchase state,
no additional catalog requests while switching titles, query handling and
retry focus. All eight browser scenarios pass, including 72 title/layout/theme
combinations and native keyboard selection. `pnpm validate` passes formatting, lint, strict types, 142 unit
tests and the production build. Evidence is in `.local/sample-titles-0151/`.
