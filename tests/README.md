# Browser experience regression checks

## About page study

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/about-study.mjs
```

Compares Fieldnotes, Map, Chapters, Index, Broadside and Sequence at 1366px and
320px in both palettes. Query values are `fieldnotes`, `compact`, `ledger`,
`columns`, `broadside` and `sequence`. Fieldnotes remains continuous; Map and
Chapters use initially closed native disclosures, while Index tiles reveal an
inline passage. Broadside exposes its editorial grid together; Sequence uses
three steps with numbered jumps and previous/next controls. Checks initial
states and distinct composition, all short shared copy after activation, body
typography, keyboard/touch controls, Index close/focus return, future community
intent, and absence of horizontal overflow. Checks Sequence endpoint states,
active heading focus and shared copy. Saves first views and expanded states.
Open disclosures, Index selection and Sequence progress survive reader and
local theme changes.
The field reader retains Escape, focus and scroll return; the canonical homepage
retains its selected product and About popup with Escape/outside dismissal.
Commerce reads are mocked and writes are blocked. `ABOUT_STUDY_BASE_URL` defaults
to `http://127.0.0.1:3100`; `ABOUT_STUDY_FILTER` selects case names;
`ABOUT_STUDY_EVIDENCE` defaults to `.local/about-layouts-0133`. Run separately
from `pnpm validate` with an existing Playwright installation. Publication
eligibility has unit coverage in `tests/about-study-content.test.mjs`.

## Overview study

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/overview-study.mjs
```

Compares Original, Digest, Index and Folded at 1366px and 320px in both themes.
Checks reduced visible copy, shared tab type scale, all three product codes,
keyboard disclosures, mobile touch targets, original formats/prices/availability,
provisional product facts and selection/quantity continuity with the mounted
material scene. Three additional phone cases verify Simplified Chinese,
Traditional Chinese and Japanese copy, alongside English. The canonical Overview
uses Folded with one full introduction and three initially closed disclosures;
the study's Original option retains its inline details. Adoption checks cover
shared typography, localized copy, keyboard access, product facts and formats,
selection, quantity and scene continuity in all four languages. All commerce
reads are mocked and writes blocked.
`OVERVIEW_STUDY_BASE_URL` defaults to `http://127.0.0.1:3100`;
`OVERVIEW_STUDY_FILTER` selects case names, and `OVERVIEW_STUDY_EVIDENCE`
optionally saves screenshots. Run separately from
`pnpm validate` with an existing Playwright installation.

## Localization product identity

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/localization-product-identity.mjs
```

Task 0116 checks that translated upstream titles keep the same known product
names, application copy, powder images and codes across Home, Shop, product,
Origins and cart surfaces. The English storefront layout is compared against
an English-title baseline; selection, quantity, mounted scenes and accessible
cart controls are retained. Four cases cover 1366px/320px and both themes.
All API reads use in-memory fixtures and all writes are blocked.
`LOCALIZATION_IDENTITY_BASE_URL` defaults to `http://127.0.0.1:3100`;
`LOCALIZATION_IDENTITY_EVIDENCE` defaults to `.local/localization-0116`.
Run separately from `pnpm validate` with an existing Playwright installation.

## Mobile popups

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/mobile-popups.mjs
```

Canonical homepage checks cover About, Origins from the menu and place CTA,
specification explanations, Material & use and Cart at 320px, 390px and 1440px
in both themes. They verify close-button, Escape and outside tap/click dismissal,
inside-click and drag safety, mobile insets, scrolling, focus return, Origins
history and browser Back, retained product/quantity and mounted material scene.
The mobile Origins photograph must fill its row with a useful reading height.
Commerce requests are mocked. `MOBILE_POPUPS_BASE_URL` defaults to
`http://127.0.0.1:3100`; `MOBILE_POPUPS_FILTER` selects case names and
`MOBILE_POPUPS_EVIDENCE` optionally saves screenshots and JSON results. Run
separately from `pnpm validate` using an existing Playwright install.

## Product code placements

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/product-code-study.mjs
```

The eight `/numbering-exploration` directions are checked across Overview,
Specifications and Shop at 1440px and 320px in both themes. The suite verifies
stable handle-based WZKA/UJI codes, unchanged product names, unknown-product
fallback, keyboard study controls, no overlapping names or horizontal overflow,
retained product/quantity/view and mounted powder canvas, local theme isolation,
shareable directions and an unmarked No code comparison. Adoption checks verify
Register across the canonical homepage tabs and small codes on dedicated Shop
cards, preserving names, destinations and unknown-product fallback. Commerce
requests are mocked. `PRODUCT_CODE_BASE_URL` defaults to `http://127.0.0.1:3100`;
`PRODUCT_CODE_FILTER` selects cases and `PRODUCT_CODE_EVIDENCE` saves captures
and JSON results. The standalone browser suite is separate from `pnpm validate`.
The two handle-mapping unit checks run with the normal test command.

## UJI designation and geographic origins

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/origin-designations.mjs
```

This mocked suite covers the Uji City location view and its two UJI series products,
the separate Uji City and Wazuka municipality paths, Ceremonial's Wazuka growing
link, and both UJI products' homepage/retail reader flows. Desktop and 320-pixel
cases run in both themes and preserve product, format, quantity, focus and the
mounted material scene through button, Escape and backdrop dismissal. It compares
UJI and Ceremonial Panorama DOM/classes, typography, photo dimensions and theme
colors, and checks the original shared Uji City/Wazuka location composition. Requests
use a synthetic public catalog; commerce writes are rejected.
`ORIGIN_DESIGNATIONS_BASE_URL` defaults to `http://127.0.0.1:3100`,
`ORIGIN_DESIGNATIONS_FILTER` selects viewport/theme cases, and
`ORIGIN_DESIGNATIONS_EVIDENCE` saves screenshots. The matching designation model
tests run with the normal unit-test command.

## Hero study 2

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/hero-study-2.mjs
```

Desktop and 320-pixel reduced-motion cases compare Current, Display, Cadence and
Proof in both study appearances. They verify introduction copy, keyboard entry,
unclipped copy without overlap and unchanged viewer/header geometry against the
canonical homepage. The same hero, bag image and material renderer survive layout
and appearance changes, selected Barista matcha and quantity persist through Origins
and close/reopen, and pending mocked purchases lock study controls. Separate
844×390 and 568×320 landscape cases require every new direction's full copy and
Explore action to fit between the header and hero footer without overlap while
retaining the canonical right viewer. Checks also cover shareable direction URLs,
reload, invalid query fallback, theme cookie isolation and the unchanged homepage
and saved studies. All API requests and writes are mocked.
`HERO_STUDY_2_BASE_URL` defaults to
`http://127.0.0.1:3100`; `HERO_STUDY_2_FILTER` selects case names and
`HERO_STUDY_2_SCREENSHOTS` sets an optional capture directory. Run separately
from `pnpm validate` with an existing Playwright install.

## Storefront Directory footer

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/storefront-footer.mjs
```

Desktop and 320-pixel reduced-motion cases verify the adopted Directory footer
below the unchanged homepage, collection, product and Origins content in both
persistent themes. Checks cover scrolling, horizontal fit, Back to top focus,
Origins return, retained selected matcha, quantity and material renderer, Shop
navigation, theme persistence and pending cart guards. Privacy policy, Terms and
Contact remain plain placeholder text, without a Planned links label or fake
destinations. The saved footer comparison retains all five options, and other
saved concepts and studies remain isolated. Loader checks keep footer tab stops
hidden during entry and retain the footer without JavaScript. All API requests
and writes are mocked.
`STOREFRONT_FOOTER_BASE_URL` defaults to `http://127.0.0.1:3100`;
`STOREFRONT_FOOTER_FILTER` selects case names and `STOREFRONT_FOOTER_SCREENSHOTS`
sets an optional capture directory. Run separately from `pnpm validate` with an
existing Playwright install.

## Footer study

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/footer-study.mjs
```

Desktop and 320-pixel reduced-motion cases compare all five footer layouts in
both study appearances, retain the selected matcha, quantity and mounted hero,
and verify footer focus, Origins return, Shop navigation, horizontal fit and
pending cart guards. The homepage retains its full viewport height, with the
footer below the fold at initial entry and after returning to the top. Scrolling
exposes the footer below the study toolbar and makes the full content reachable,
including taller phone layouts. Planned privacy, terms and contact entries remain
plain text outside the tab order, without a Planned links label. Study appearances must never write the storefront theme
cookie. All API requests and writes are mocked. `FOOTER_STUDY_BASE_URL` defaults
to `http://127.0.0.1:3100`; `FOOTER_STUDY_FILTER` selects case names and
`FOOTER_STUDY_SCREENSHOTS` sets an optional capture directory. Run separately
from `pnpm validate` with an existing Playwright install.

## Hero loading

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/hero-loading.mjs
```

Seven mocked cases cover real hero readiness, rising progress, keyboard access,
fresh entrances and brief timing, dark mobile, reduced motion, image/font failures, timeout, direct
selection, saved studies and disabled JavaScript. `HERO_LOADING_BASE_URL`
defaults to `http://127.0.0.1:3100`; `HERO_LOADING_FILTER` selects case names and
`HERO_LOADING_SCREENSHOTS` sets an optional capture directory. All commerce is
mocked. Run separately from `pnpm validate` using an existing Playwright install.

## Color explorations

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/color-study.mjs
```

Six mocked cases cover desktop/phone palette switching, retained order and
material nodes, themed dialogs, Origins return, pending purchase locks and direct
links/reload. The adopted homepage checks compare both regular themes with their
saved explorations, preserve product/format/quantity/reference and renderer
identity through appearance changes, and verify standalone Origins and saved
concept/study isolation. `COLOR_STUDY_SCREENSHOTS`
sets the optional capture directory; `COLOR_STUDY_FILTER` selects case names.
No live commerce writes or additional browser dependency.

`tests/retail-shop.mjs` checks the adopted colors throughout both collection and
product-page themes, including mobile appearance changes, retained purchases and
the themed About, cart and Origins dialogs. Run it with the same
`PLAYWRIGHT_MODULE` setting; `RETAIL_SHOP_FILTER` and `RETAIL_SHOP_SCREENSHOTS`
provide the corresponding filtering and optional captures.

## Homepage concepts

The separate Task 0039 suite covers `/concept-08`, `/concept-09` and their
comparison page:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/homepage-concepts.mjs
```

Nine cases cover product selection, profile disclosures, published format and
quantity rules, unavailable products, mocked Add to cart, focus restoration,
native chapter destinations, unpublished provenance, catalog recovery and
320/390/1440-pixel layouts. All API requests are mocked. Optional
`HOMEPAGE_CONCEPTS_FILTER` selects case names and
`HOMEPAGE_CONCEPTS_SCREENSHOTS` sets a capture directory. This suite is run
separately from `pnpm validate` and adds no browser dependency.

Four additional Task 0040 cases cover `/concept-08/focus` at 1440×900,
1366×768, 390×844 and 320×700. They require all seven Specifications to fit
together without page scrolling or clipped ancestors; verify modal keyboard
focus, product/quantity continuity, preserved purchase options and guards during
pending mocked cart submissions. Use `HOMEPAGE_CONCEPTS_FILTER='focused
specifications'` to run these four alone. There are 13 cases in the suite.

## Current storefront

Start the local app with `pnpm dev`, then run:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright node tests/experience.mjs
```

Use an existing Playwright installation and installed Google Chrome. Set
`PLAYWRIGHT_MODULE` to the package directory containing `index.mjs`; this
directory is converted to a file URL before importing. If `playwright` is
already resolvable by Node, omit `PLAYWRIGHT_MODULE`. No package
dependency is added. `PLAYWRIGHT_CHANNEL` optionally selects another supported
browser channel; `PLAYWRIGHT_EXECUTABLE_PATH` can select a specific Chrome or
Chromium executable.
`EXPERIENCE_BASE_URL` optionally overrides
`http://127.0.0.1:3100`.

`EXPERIENCE_TEST_FILTER` optionally runs check names matching a regular
expression, for example `EXPERIENCE_TEST_FILTER='concept 02|concept-02'` while
developing the second concept. Omit it for the full regression run. A filter
that matches no checks is an error.

`EXPERIENCE_SCREENSHOTS` optionally saves the suite's review captures to a local
directory. For example:

```sh
EXPERIENCE_SCREENSHOTS=.local/qa/experience node tests/experience.mjs
```

Combine this with `PLAYWRIGHT_MODULE` when Playwright is not resolvable by Node.
The directory is created if necessary; screenshots are optional review artifacts,
not a requirement to add a browser dependency or connect live commerce.

All `/api/*` requests are intercepted before navigation. Catalog and cart
responses are fulfilled in memory; unexpected API requests fail the suite.
Any unmocked network write is blocked and also fails the suite.
These checks never create, update, or remove a service-backed cart.
The deliberate WebGL-failure check also fulfills Next's development source-map
diagnostic in memory; that POST never reaches the server.

Coverage includes both homepage themes, the in-place tray → matcha photograph
journey with a movable label card, heading focus and close restoration, 320/390-pixel layouts and
reduced motion. Cold-load checks delay the actual material assets and sample
rendered frames: the tray must respond within 200ms of click even while scene
assets are blocked, and remain visible until the ready product image overlaps
it. Purchase controls unlock during the overlap; a prepared scene must complete
the handoff within 1.3 seconds, without waiting for the powder motion to finish. Closing
during load, a late readiness callback, and reopening a completed journey are
covered, including reduced motion. Header, tray and Explore entry controls all
lead to the same powder-and-label flow; `/concept-02/canister` remains the separate backup.
An unavailable-WebGL check also delays the fallback photograph and requires
the tray to stay visible until that image has decoded.
Desktop homepage Shop checks follow the Matcha and Quantity steps and keep the purchase
action reachable without opening information. Desktop overflow is contained in
the right selection pane while the page and left stage stay fixed. Mobile places
Explore / Shop before the product stage and uses normal page scrolling, with no
sticky product covering the controls or inner selection scrollbar.
Mobile checks at 320 and 390 pixels cover the single-row brand/Menu/Cart header,
44-pixel navigation targets, native disclosure keyboard access and dismissal,
About/Cart focus restoration and theme-aware Shop navigation. The tray precedes
the hero headline and primary entry. Selection focuses a visible heading, and
the stage moves with the document while material details lead to a reachable
Shop action. Mobile Shop combines grade, format and quantity without a Continue
step and leaves label/reference editing on desktop. Checks cover Previous/Next,
native touch swipes under reduced motion, reselecting an active grade without
resetting quantity, and quantity continuity through Explore/Shop and appearance.
The mobile collection has its own native horizontal-swipe regression: independent
formats and quantities survive grade navigation, swiping in both directions and
theme changes, then the mocked purchase submits the retained selection. Both
mobile purchase surfaces keep One-time checked and Subscribe unavailable.
Dedicated shop cards reveal their purchase panel on desktop hover or explicit
keyboard/touch entry. Checks require unchanged card height, hidden controls in
the resting state, native keyboard access, Escape/close focus restoration, and
retained format and quantity when reopened. The material drawer returns to the
open purchase panel. The optional Purchase options disclosure exposes the stable
One-time choice and disabled subscription. Mobile panels close before native carousel swipes; pending
purchase guards still cover sibling cards whose panels are closed. During a
pending write, Close is disabled and Escape retains the open purchase panel so
Cart can restore focus to the originating Add action.
Explore is tested as an in-place material view: choose another matcha, read its
sample profile and Material & use drawer, then continue with Shop this matcha.
The route, selected product and quantity persist. Desktop references also persist;
the desktop label is hidden during Explore and returns in Shop. One format is shown as a fact;
real alternative variants and quantity rules remain selectable.
At a short desktop viewport, Explore's right panel scrolls independently while
the page stays at the top and the left matcha stage keeps its position and height.
Both the selected heading and Shop action remain reachable within that panel.

Navigation study checks at 1440 and 320 pixels compare all nine navigation options,
retain selection and the live label through navigation and appearance changes,
and exercise Index, Folio, Dial, Edge, Stack, Shutter and Track keyboard/pointer dismissal,
About and Cart, repeated Matcha entry, and Overview
focus restoration. The mobile case uses reduced motion.

Concept 02 checks cover standard entry, two essential builder steps (Matcha,
Quantity), persistent powder, optional live reference editing, and shared state
across modes. Its Standard selection / Interactive builder labels remain
unchanged. Desktop reference checks open the shared editor from homepage Shop and
Concept 02 standard selection, the printed card reference and its caption,
then verify return to the originating
mode, step and focus. They cover input focus, clearing, the 32-character limit,
mixed-case text, loaded Antro Vectra on the input and card, and whole-text script
shaping. Clicking or focusing the reference must not drag the card; entering text
must not send commerce requests. The label card reflects the selected name,
application, format, quantity and reference. Material & use opens a
separate drawer containing all seven sample properties and preparation guidance.
Card checks at desktop and wide touch viewports cover mouse and touch dragging,
first bringing the card into view, placement persistence through selections and
mode changes, arrow-key movement, Home and explicit reset, and rapid latest-value
updates in normal and reduced motion. The powder remains visible through all
purchase steps, including the photographic WebGL fallback.
Text-resolution checks cover full-control hover, keyboard and native radio focus,
stable accessible names and control widths, pointer-exit restoration, and the
system reduced-motion preference. Keyboard focus resolves once so text stays
still while it is read.
Tests cover Tab/Shift+Tab containment, Escape/back focus restoration, retained
selection and property comparison through product/viewport changes.
The preserved `/concept-02/canister` has a separate rendering, reveal, quantity
and mocked Add check; the main flow has no packaging reveal.

Cart checks cover add/update/remove, explicit rejected-write retry, review-required
rejection and reconciliation of an ambiguous accepted write without automatic
mutation replay. Catalog empty/error states remain recoverable. Checkout is
disabled and is never exercised.
The shared purchase action is checked in both Concept 02 shopping modes, including its
disabled unavailable state, pending feedback, duplicate-click prevention,
successful and rejected responses, and reduced motion.

All commerce requests stay mocked, including the homepage selection-to-cart checks.
Separate scene review covers normal/reduced motion, rapid changes, long
references, open/close and context loss. Browser checks use the command above
and are not included in `pnpm validate`; the current task records validation
results and local visual-review captures.

Current powder-and-label review captures are in `.local/qa/powder-label-card/`.
[Task 0022](../docs/tasks/0022-matcha-and-interactive-label-card.md) records
repository validation and visual review results.

On 2026-09-30 the full run passed **26/29**. The three failures were test
expectations: counting the card's semantic header as a second site header, and
requiring vertical travel when the compact mobile stage had no spare height.
After correcting those expectations and adding visible-glyph opacity checks,
the two home journeys and two card interaction cases passed **4/4** against the
final palette. All **29 cases** are covered cumulatively; no live commerce
requests were sent.

The final typography/mineral-light review on 2026-09-30 ran **20 relevant cases**.
The first run passed **14/20**; six mobile quick-purchase cases exposed clipped
purchase actions after the shared button changed. After the mobile row-spacing
fix, all six unchanged checks passed **6/6**. All **20 cases** are covered
cumulatively, including the two text-resolution checks and shared purchase-action
check. Card keyboard checks wait for the quantity heading's navigation focus
before focusing the card, so the visitor's keypresses reach the intended control.
Captures are in `.local/qa/mineral-final/`, including the 320-pixel light layout
and final 1440-pixel homepages in both themes. A final palette probe verified the
5% white fill on all three header controls and solid dark light-theme footer and
powder-caption ink. All commerce remained mocked.

Four-language storefront regression (Task 0117):

```bash
PLAYWRIGHT_MODULE=/path/to/playwright node --experimental-strip-types tests/storefront-localization.mjs
```

This uses only mocked catalog/cart reads. It covers English, Simplified Chinese,
Traditional Chinese and Japanese on desktop and 320px mobile in both themes:
language/theme control adjacency, cookie and server rendering, metadata, selected
product/quantity and mounted scene continuity, Shop, cart, Origins, JPY totals
and wrapping. Captures are written to `.local/localization-0117/`. Translations
and locale validation also have unit coverage in `pnpm test`.

Localized text glitch regression (Task 0118):

```bash
PLAYWRIGHT_MODULE=/path/to/playwright node tests/localized-text-glitch.mjs
```

The test observes real glyph mutations and restoration in English, Simplified
Chinese, Traditional Chinese and Japanese. It checks desktop hover, keyboard
focus, mobile tap and hero playback; accessible source text and measured layout
stay fixed. Reduced motion must produce no scrambling. CJK wrapping and line
starts are checked on 320px mobile. All commerce is mocked. Use
`LOCALIZED_GLITCH_WIDTHS=1366` or `320` for a targeted rerun; default covers both.
Evidence goes to `.local/localized-text-glitch/`. Character grouping, script
handling and the unchanged scheduler have focused unit tests in `pnpm test`.

Native Shopify popup and same-tab fallback regression (Tasks 0131 and 0134):

```bash
PLAYWRIGHT_MODULE=/path/to/playwright node --experimental-strip-types tests/checkout-popup.mjs
PLAYWRIGHT_MODULE=/path/to/playwright node --experimental-strip-types tests/checkout-flow.mjs
```

Run against the local development server; `CHECKOUT_BASE_URL` defaults to
`http://127.0.0.1:3100`. Commerce responses are mocked. The popup suite starts
an inert second loopback origin to verify native form targeting, opener
isolation and COOP behavior without contacting a payment provider. Both
suites cover all four languages, cart guards and deliberate return/recovery.
The popup suite also checks automatic authoritative cart clearing, cancellation
and failure preservation, hidden-page pause, serialized reads and stale-response
rejection. Popup captures go to `.local/checkout-0134/browser/`. These tests do not prove
wallet onboarding or a real payment; record those separately in the task.

About scroll exploration (Task 0136):

```bash
PLAYWRIGHT_MODULE=/path/to/playwright node --experimental-strip-types tests/about-exploration.mjs
```

Run against the local development server on port 3100. The suite checks the
isolated `/about-exploration` in both palettes, desktop/phone layouts, scroll
progress, reduced motion, accessible application descriptions, image loading,
navigation and Origins reader return. Commerce is mocked. Captures are saved
under `.local/about-exploration-0136/browser/`.
