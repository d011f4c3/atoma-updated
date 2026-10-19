# Task 0185 — Mobile About reading pass

Date: 2026-10-19
Status: implementation complete; browser review pending.

## Request and boundaries

The owner requests a mobile-first refinement of the current About page.
Canonical `/about` renders `AboutFlow`, `AboutApproach`, `AboutConnections`,
`AboutSelectionInvitation` and the existing `AboutFieldNotes` popup.
`AboutVariations` contains saved explorations and is not the current page.

Keep the accepted desktop composition, current copy and translations, the
selected Character / Application / Origin photographs, and the two Community
covers. Preserve popup history, focus return, scroll lock and dismissal. The
harvest remains a separate Community story. No new facts, image edits,
commerce behavior, dependencies or deployment belong to this pass.

## Source findings and changes

- The 541–760 px approach layout still put copy beside a square photograph.
  All phone widths now use one continuous column. Landscape photographs use
  3:2 frames; Application retains a 4:3 detail focused on the bowl and hands.
- Main sections now follow a tighter rhythm with modest 18 px section headings,
  unchanged 14 px narrative copy and existing locale increments. Company,
  approach, Connections and Community use consistent spacing and fine rules.
  Fixed background painting is disabled on phones to avoid mobile repaint jumps.
- Community previously cropped landscape covers into tall 1.25 frames. The
  selected cover photographs now retain 3:2 framing, with smaller 16 px titles
  and 44 px actions. The complete image-and-copy entry remains one tappable link.
  Touch hover does not leave a cover zoomed after a popup is dismissed.
- Connections photographs are sized from the actual phone content width. The
  existing connecting line and observation-first reading sequence are retained.
  The final selection action fills its column; product captions wrap safely.
- The native popup keeps 16 px outside gutters and the 82dvh height limit. Its
  chapter controls form a 44 px scrollable row instead of wrapping into tall
  narrow columns. Content has 16 px inner gutters, complete photographs and a
  slightly tighter editorial rhythm. All chapter labels remain available, with
  native focus scrolling and the same chapter jump behavior.

All CSS changes are scoped to `max-width: 760px`; desktop rules and JavaScript
motion/history/dismissal code remain unchanged. Reduced-motion behavior and
the non-JavaScript fallback are retained.

## Verification

Scoped Prettier checks, `pnpm exec tsc --noEmit` and `git diff --check` pass.
Source review confirms every changed rule is inside a `max-width: 760px`
media query. No JavaScript, copy, photograph mappings or commerce code changed.

Mobile visual review at 320 and 390 px, both themes, localized header fit,
popup chapter/dismiss/return behavior, and a desktop regression review remain
pending. The parent task owns browser review and final repository validation.
The horizontally scrollable chapter row is the main interaction to verify:
all labels must remain reachable by touch and keyboard without horizontal
overflow on the dialog itself.

## Completed browser review

Reviewed the phone introduction, single-column approach, Community covers and popup at 390 px, plus 320 px dialog bounds and localized content. No horizontal overflow was present. The popup retains 16 px outside gutters, independent scrolling and return dismissal. Task 0189 replaces the initially stacked Connections photographs with a distinct compact collage; desktop Connections retains its three-image composition.
