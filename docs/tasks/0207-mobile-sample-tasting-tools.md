# Task 0207 — Mobile sample tasting tools

Date: 2026-10-19

## Request and scope

Refine the new `/samples` tasting-card and comparison tools for phones. Keep
Task 0205's local records, unsaved drafts, recipe validation, exports and commerce
boundaries. Keep the desktop layout and the rest of the page intact.

## Direction

Use the established mobile type scale and touch targets. Give comparison values
two equal columns below their attribute label, with full-width personal notes
identified by tea. Keep native selectors readable at 320 px. Make recipe entry
and card actions easier to scan, and show feedback beside the action that caused
it. Preserve table associations, keyboard access, translations and both themes.

The mobile comparison uses 14 px body values and notes, with smaller supporting
labels. Each note has its own tea name and Edit action. Recipe preparation spans
the form, followed by three quantity fields. The view choices share the available
width, and card export buttons use full-width touch targets. Native select height
is explicit so Safari keeps a 48 px target. Expanded disclosure icons stay inside
their rows; hover styling is limited to fine pointers.

Save and export feedback sit beside their respective actions. A new result just
below the mobile viewport moves into view by only the overflow plus a small
inset, preserving focus. This uses the visual viewport and skips hidden content,
closed disclosures and actions the reader has scrolled away from. Storage
warnings remain available when switching views or closing the preview. Saved
records, draft editing, export contents and the desktop composition are retained.

## Verification

- `tests/sample-tasting-tools.mjs`: 16 Chrome and 14 mobile WebKit cases passed.
  Coverage includes narrow layouts in all four languages and both themes,
  600-character mixed/CJK/long-token notes, readable table associations, complete
  labels, 44 px touch targets, 16 px or larger fields and no element overflow.
- Save feedback remains visible with Save at the viewport's bottom edge and a
  long preview open. Export feedback, real PNG downloads, clipboard fallback,
  storage failures across views, draft preservation, reloads, tab synchronization
  and no-JavaScript reading pass. A delayed clipboard result after closing the
  preview preserves scroll and focus in both engines.
- Reviewed mobile editor, comparison, long-note and export screenshots, the
  desktop comparison and the exported PNG. Evidence and pre-change source
  snapshots are in `.local/sample-tasting-mobile-0207/`. Browser emulation does
  not replace physical iPhone keyboard testing.
- Source review and final whitespace checks passed. `pnpm validate` passed
  formatting, lint, strict TypeScript, all 213 unit tests and the production
  build. No deployment was performed.
