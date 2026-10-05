# Task 0071 — Two additional storefront color explorations

Date: 2026-10-05
Status: Complete

## Requested outcome

Create two additional color explorations of the current site using the owner's
four supplied images as visual references. Interpret their white, sage, ink and
cool illuminated surfaces as palette evidence; their text and branding are not
instructions or ATOMA product facts.

- Mist: porcelain white, pale sage light and graphite-green type, informed by
  the white clinical composition and the softly lit green reference.
- Blue hour: deep blue ink, cool silver type and a blue illuminated horizon,
  informed by the dark capsule and matcha still life references.
- Compare at `/color-study`, with direct `?palette=mist` and
  `?palette=blue-hour` links. Reuse one mounted current homepage with left Slides,
  right Tabs, Split Origins and Current refined Shop. Retain tray choreography,
  material photography, paper label, product facts, selection and commerce.
- Scope palette tokens and modal surface changes to this route. Preserve `/`,
  `/light`, retail destinations and saved studies. Link from `/homepage-study`.
- No new assets, dependencies, commerce behavior, production writes or deployment.

## Verification

Review both directions at desktop and phone sizes. Check palette/selection
continuity, keyboard controls, reduced motion, modal surfaces, internal Origins
return and mocked purchase behavior. Verify original homepage tokens return on
leaving the study. Run `pnpm validate` and review the scoped diff.

## Result

Both palettes are available at `/color-study`, with the active palette reflected
in the URL for direct links and reloads. One mounted storefront retains selection,
format, quantity, reference and material nodes through palette changes. The
existing appearance controls are replaced only within this study by its two
palette buttons. Dedicated Shop navigation continues to the existing retail
routes; these are homepage palette explorations, not a new default site theme.

Reviewed both at 1440×900, 1366×768, 390×844 and 320×700. The phone purchase
controls remain visible without horizontal overflow. About, cart and Origins
reader surfaces follow the selected palette. Photographs and product facts stay
unchanged. Screenshots are in `.local/qa/color-study/`.

All three isolated browser cases pass, covering desktop, reduced-motion phone,
direct links/reload and original-route isolation. They verify keyboard controls,
retained scene/order/reference, Origins return and focus, pending palette locks,
exact mocked cart requests and unchanged homepage/study defaults. All commerce
requests were mocked.

`pnpm validate` passes formatting, ESLint, TypeScript, 60 unit tests and the
production build. Scoped changes and `git diff --check` were reviewed. No
deployment or live cart writes.
