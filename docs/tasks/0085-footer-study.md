# Task 0085 — Footer study

Date: 2026-10-05
Status: Complete — expanded comparison ready for review

## Requested outcome

Create `/footer-study` to compare footer directions before adopting one across
the site. Preview Index (numbered navigation columns), Colophon (a large closing
wordmark) and Compact (a restrained navigation band) below the current homepage.
These are design proposals, not an approved site-wide footer.

The owner prefers Compact and Index and requests two more options. Add Rail, a
compact numbered navigation row, and Directory, stacked navigation beside an
information column. Retain all three earlier options. Preview future Privacy
policy, Terms and Contact labels as ordinary text in a clearly marked Planned
links group; their destinations and content remain future work.

Keep the footer below the initial viewport, reached by normal scrolling. Remove
the study's reduced hero sizing and use the unchanged homepage component's
full-height and responsive rules. Do not adopt a footer on the canonical site or
alter its composition, navigation, themes or behavior.

Use the existing IBM Plex Mono typography, ATOMA wordmark, sourced “Carefully
specified matcha” copy, and Mist / Blue hour palettes. Footer navigation uses
the existing Shop destination and in-place Growing places reader, with a working
Back to top control. No speculative contact details, policies, social accounts,
newsletter form, product claims or private grower identities.

Keep a single mounted homepage/material scene through layout and appearance
changes, current Slides/Tabs, Panorama and Current refined controls, selection
and cart behavior. Study appearance remains local. Keep the homepage and earlier
studies unchanged. No dependencies, commerce writes or deployment.

## Verification

Review all five directions in both themes at desktop and 320px mobile. Check
native layout/appearance controls, keyboard focus, footer/top navigation,
Origins return, theme isolation and retained material state with mocked commerce.
Verify the full-height hero and below-fold footer on entry and after returning
to the top, and the planned links' noninteractive semantics.
Run the focused browser checks and `pnpm validate`, then review the scoped diff.

## Initial comparison results

- Added the isolated route and three responsive footer directions; no default
  storefront or earlier study component was changed.
- Browser checks passed 2/2 cases at 1440 × 900 and 320 × 740, covering all 12
  layout/theme combinations. Selection, quantity and material renderer identity
  survive comparison changes. Shop navigation, Origins return focus, footer/top
  scrolling, independent appearance and pending cart guards passed with mocked
  commerce only.
- Visually reviewed hero-context captures in `.local/qa/footer-review/` and
  selection-flow captures in `.local/qa/footer-study/`.
- `pnpm validate` passed: formatting, lint, types, all 63 behavior tests and the
  production build. Reviewed the scoped source changes and `git diff --check`.

## Expanded comparison results

- Added Rail and Directory while retaining Index, Colophon and Compact. All
  layouts include clearly marked noninteractive future policy/contact labels.
- Removed the study's hero height overrides. The unchanged homepage component
  sets its own dimensions; the footer follows it below the initial viewport.
- Mocked browser checks passed 2/2 cases, covering 20 layout/theme/viewport
  combinations. Initial and return-to-top geometry, scrolling to the footer,
  planned-link semantics, selection/renderer continuity, focus and cart guards
  passed. All five layouts also fit at 768px and 1000px without clipped controls.
- Visual captures are in `.local/qa/footer-expanded/`; source diff and
  `git diff --check` reviewed.
- Formatting, scoped ESLint, TypeScript, all 63 unit tests and the production
  build passed. Full `pnpm validate` stops at an unrelated `react-hooks/refs`
  lint error in `src/components/specimen-hero.tsx:495`, where separate hero work
  passes `exploreRef` to `renderIntroduction` during render. That file was not
  changed in this footer task; the final repository lint rerun confirms the same
  remaining failure.
