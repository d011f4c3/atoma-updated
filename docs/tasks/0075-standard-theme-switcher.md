# Task 0075 — Standard storefront theme switcher

Date: 2026-10-05
Status: Complete

## Requested outcome

Replace separate light/dark storefront pages with one persistent, accessible
theme switch. Use Mist light by default and the approved Blue hour dark palette
when selected. Use canonical `/`, `/shop`, `/shop/[handle]` and `/origins` routes.

Place the switch in the lower-right footer position previously used by the
appearance links, on desktop and mobile. Switch without changing the URL or remounting the active product/order.
Remember the visitor's preference across navigation and reloads. Legacy light
URLs redirect to their canonical route, retaining handles and query parameters.
They do not override an existing preference. Preserve independent controls in
the saved studies, product exploration and numbered concepts.

Preserve commerce locks, cart contracts, renderer, selection, reference, regional
facts and the private grower placeholder. No new dependencies or deployment.

## Implementation decision

Read a validated `atoma-theme` cookie in the server root layout and initialize a
shared client context. The fallback is always light, irrespective of OS theme.
The switch updates context and the cookie without route navigation. This uses
request-time rendering for the layout, avoiding a flash of the wrong palette
and hydration mismatch on returning visits. Palette markers remain scoped to
the regular storefront and approved comparison surfaces.

## Verification

Check light first visits, both palettes, keyboard/mobile switch access,
persistence and server-rendered preference, canonical navigation, legacy redirects
with queries, retained product/format/quantity/reference and renderer, pending
commerce state, dialogs and saved-study isolation. Use mocked commerce only.
Run relevant browser checks, `pnpm validate` and final scoped diff review.

## Result

The regular storefront defaults to Mist light. One accessible sun/moon switch
sits in the lower-right footer, in the previous appearance-control position,
and updates the approved palettes in place. Theme changes preserve the complete
URL/history and mounted product, renderer, order and reference state, including
during a pending mocked purchase. The preference survives navigation, reloads
and a new browser session. Server-rendered markup uses the saved preference.

Removed the separate regular light page implementations. Canonical navigation
uses `/`, `/shop`, `/shop/[handle]` and `/origins`; old light URLs and `/dark`
redirect with query values preserved. Saved studies and the silver-bag product
exploration retain independent appearance controls. Origins history reopens in
the current regular-site theme. Grower identities remain absent from public data
and fresh production assets.

All eight color/theme cases, four Origins cases, six retail cases, two focused
appearance cases and one selector-isolation case passed. After the footer
placement correction, reran both persistence/placement cases and the desktop
pending-purchase and 320px retail cases. Desktop/mobile screenshots in
`.local/qa/theme-switch/` show the switch in the lower right, with keyboard
focus, readable palettes and no overflow. Tests use isolated mocked commerce.

`pnpm validate` passes formatting, ESLint, TypeScript, all 60 unit tests and the
production build. Reviewed the scoped changes and `git diff --check`. No live
commerce writes or deployment occurred.
