# Task 0065 — Roomier Origins and checkout explorations

Date: 2026-10-03
Status: Complete

## Requested outcome

Explore Origins and checkout again now that product selection lives on the left
and the right panel has more room. Keep the final left Slides, current storefront
header and right Tabs, while preserving the existing comparison options and
homepage defaults.

At `/origins-study`, add Panorama and Place record. Panorama leads with the
growing location and a wide landscape; Place record places the photograph beside
a structured geographic record and context. Open on Panorama. Use the existing
confirmed product/place relationships, regional context and honestly captioned
Kyoto photography. Region and grower actions open the internal Origins reader.

At `/shop-study`, add Purchase ledger and Open checkout. The ledger uses numbered
order rows and a clear total band. Open checkout exposes available format choices
and gives quantity and the purchase action separate space. Open on Open checkout.
This is an exploration of the existing in-place purchase panel, retaining the
shared catalog, selection, quantity rules, availability, cart actions and checkout
gates. No new payment flow or commercial claims.

Keep each hero mounted through layout and theme changes. Preserve selected
product, format, quantity, personal reference, label movement and material scene.
Use small mono type, restrained theme surfaces, rounded controls, keyboard access
and system reduced motion. No new dependencies, assets, production writes or
deployment.

## Verification

Check the new options and preserved alternatives in both themes at desktop and
phone sizes. Review location/context/action visibility, photography, purchase
clarity and viewport fit. Extend isolated browser checks for selection and
renderer continuity, current navigation, internal Origins return, unknown-origin
behavior, format controls, quantity and availability guards, pending locks and
exact mocked cart payloads. Confirm the homepage and other studies retain their
defaults. Run `pnpm validate`, inspect scoped changes and `git diff --check`.

## Result and verification

Both studies use the current full header, final left Slides and right Tabs.
Origins opens on Panorama with Place record alongside all four earlier choices.
Shop opens on Open checkout with Purchase ledger alongside all seven earlier
choices. The homepage and saved selector studies keep their existing defaults.

The Origins alternatives reuse the canonical confirmed growing location,
regional context and Kyoto-captioned photograph. Internal place and grower
reader actions retain the selected matcha on return. Open checkout's visible
format tiles use native radios, including arrow-key selection and focus states.
All purchase layouts retain the same selection owner and guarded cart actions.

All six isolated browser cases pass. Coverage includes both themes, retained
product/format/quantity/reference and renderer, current navigation, unknown
origins, reader return, keyboard format selection, quantity and availability
limits, pending navigation/control locks, catalog recovery and exact mocked cart
payloads. No real cart writes occurred.

Visual review covered 1366×768 and 320×700 in both themes. New Origins identity,
geography, photograph, context and actions fit the initial phone view. New
checkout format/quantity/total and purchase actions also fit the two-format bundle
fixture; longer catalogs retain natural scrolling. Mobile spacing changes are
scoped to the new layouts and preserve touch targets. Screenshots are in
`.local/qa/studies-round-3/origins/` and `.local/qa/studies-round-3/shop/`.

`pnpm validate` passed formatting, ESLint, TypeScript, all 60 unit tests and the
production build. Scoped source changes and `git diff --check` were reviewed.
