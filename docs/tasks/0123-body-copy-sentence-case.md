# Task 0123 — Body copy in sentence case

Date: 2026-10-07
Status: Complete locally
Authority: Owner requests regular case for body copy, using the UJI description
as the example, and clarifies that this means regular sentence case rather than
literal lowercase.

## Bounded change

Let narrative text render in its authored sentence case by overriding inherited
or directly applied uppercase styling on existing body-copy selectors. Cover
Origin preview descriptions and observations, directory introductions and empty
states, origin article prose, About paragraphs, product details and specification
explanations, material descriptions, product and shop guidance, quantity notes,
cart messages and checkout notes. Keep headings, labels, codes, controls,
hierarchy and short photograph captions in
their established treatment.

This is a CSS-only presentation change. Preserve the approved layout, spacing,
font sizes, contrast, letter spacing, themes, translations, interactions and commerce
behavior. No copy rewrite, dependency, data migration or production change is
included. The broader readability task remains separate.

## Validation

Inspect the English UJI example and representative product, origin and About
body text on desktop and mobile. Confirm body copy uses authored case while
headings, labels and controls retain their existing treatment. Check that the
four-language typography and existing product interactions remain intact.
Run formatting checks and `pnpm validate`, then review the scoped diff.

## Evidence

- The exact UJI description, photograph observation and location-reader prose
  render in authored sentence case. Computed-style checks at 1366px and 390px
  confirm body overrides and preserved uppercase headings, actions and short
  captions. Reviewed preview and dialog screenshots in `.local/body-case-0123/`.
- About lead/entry paragraphs and specification explanations also pass computed
  case checks at 1366px and 390px, with headings and property labels unchanged.
  Reviewed the About and specification popup captures in the same directory.
- All four existing Origins designation browser cases pass at 1366px and 320px
  in Mist and Blue hour. They preserve the approved UJI/Wazuka layouts, country
  and product relationships, selected format/quantity, focus and dialog return.
  Log: `.local/body-case-0123/origins-browser-final.log`.
- The first browser run exposed a stale test helper that derived `origin` from
  the renamed tab label. Corrected its mapping to the unchanged `origins` mode;
  no application navigation behavior changed and no assertions were weakened.
- `pnpm validate` passed formatting, lint, types, all 109 unit tests and the
  production build. Log: `.local/body-case-0123/validation.log`. Scoped formatting
  after the test-helper correction and `git diff --check` passed. Reviewed the
  scoped CSS changes. No new tests, dependencies or deployment.
