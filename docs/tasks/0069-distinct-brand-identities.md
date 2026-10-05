# Task 0069 — Four new ATOMA home-screen identities

## Approved brief

The owner rejected Task 0068 as variations of the same identity and supplied
four new visual references. The latest clarification limits this pass to four
new home-screen heroes. Replace the existing exploration; deeper product-page
redesign is outside this task.

## Scope

- Veil: translucent mint, soft optical forms and a rounded geometric wordmark.
- Obsidian: a dark sculptural container, angular identity and narrow typography.
- Current: flowing matcha, a swept wordmark and a bolder lowercase graphic voice.
- Index: silver, controlled blur, monospace labels and strict framing.
- Each owns its wordmark, copy, type, image treatment, header and controls. A
  neutral comparison toolbar switches the four on `/brand-exploration`.
- Use original generated photographic concept assets and save them in the
  project. Reference images inform the art direction without copying marks.
- Packaging and editorial language are proposals. Product names, uses, routes
  and commerce rules stay canonical; no invented codes, certifications or facts.
- Keep the shared selection owner and existing cart. Product links open the
  existing product pages. Leave the regular homepage and other studies unchanged.
- No new dependency, production permission, production write or deployment.

## Validation and results

- Four independent hero components replace the previous entries. Each includes
  an original wordmark, image composition, type hierarchy, voice and control
  treatment. The prior entry components remain available in the source.
- Four original assets were generated with built-in imagegen and saved under
  `public/images/brand-heroes/`: `veil.png`, `obsidian.png`, `current.png` and
  `index.png`. The complete prompt set and generation mode are recorded in
  `docs/design/brand-hero-image-prompts.json`.
- Reviewed all four at 1280 × 720 and 390 × 844. The phone heroes have no
  horizontal overflow. Compact desktop rules keep their selectors visible.
- Verified selected Barista carries through concept changes and updates each
  product link. Confirmed the link opens the existing Barista product page with
  its actual unavailable state. No add-to-cart or checkout action was performed.
- Verified the notes toggle by keyboard and existing cart open/Escape/return
  focus. Reduced-motion rules are present in each direction.
- Navigation review found URL/hero divergence on Back after client-side concept
  changes. The comparison now derives its selection from Next's current search
  parameters, retaining one product-selection owner across concept changes.
  Native history replacement uses `null` state so Next updates those parameters;
  verified switching, direct reload and return from a product page in the browser.
- Reviewed task-only changes against pre-edit copies and independent review
  found no blocking canonical-data, cart or accessibility regressions.
- `fnm exec --using=24.20.0 pnpm validate` passes after the navigation fix:
  formatting, lint, types, all 60 tests and the production build. Browser Back
  now restores the correct concept, and compact desktop height is verified.
  `git diff --check` passes. No production write or deployment.
