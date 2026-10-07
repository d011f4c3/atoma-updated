# Task 0105 — Deliver the October client feedback in bounded changes

Date: 2026-10-06
Status: Initial corrections and four-language storefront verified locally 2026-10-07
Authority: Owner request to create tasks, begin the small product-code and origin
corrections, preserve the current UI, and plan larger features.

## Source and working repository

Work in `/Users/d0l1f4c3/Projects/atoma-updated`, the source of
`atoma-updated.vercel.app`. The owner changed the project's primary folder from
JMM during this task. The older JMM storefront is not this site's baseline.

The source is `ATOMA_Website_Feedback_EN_2026-10-06.docx`, supplied by the owner
from Downloads, plus the owner's pasted text and explicit clarification that
product codes must also be reflected in the backend. Its SHA-256 is
`641fb38c36a1bff8b18b68af79c9c584d5a0125611f273547f96f13079e72d3c`.
The [business-only source summary](../briefs/2026-10-06-client-feedback.md)
preserves the requirements without copying correspondence or personal data.

The document supplies client direction. The current owner request authorizes
small corrections and planning; it does not authorize production writes or
silently override accepted commerce architecture.

## Work order

| Order | Task                                                                                                   | Outcome                                                                              | Readiness                                                     |
| ----- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| 1     | [0106 Product codes](0106-product-codes-and-catalog-projection.md)                                     | Correct labels and shared server catalog code projection                             | Implemented and verified locally                              |
| 2     | [0107 Origins](0107-uji-designation-and-wazuka-origins.md)                                             | UJI for Barista/Culinary; Wazuka for Ceremonial; designation separate from geography | Implemented in the approved layout and verified locally       |
| 3     | [0108 Product information](0108-confirmed-product-information.md)                                      | Add provisional details now, then confirmed supplier facts                           | Placeholders verified; actual supplier values pending         |
| 4     | [0109 Readability](0109-long-form-readability.md)                                                      | Sentence case and readable body copy within the existing design                      | Ready as a separate presentation slice                        |
| 5     | [0110 About](0110-about-atoma-and-community-stories.md)                                                | Simple company/application/community introduction                                    | Deferred by owner; company and activity evidence needed       |
| 6     | [0111 Samples and repeat orders](0111-samples-and-repeat-orders.md)                                    | Three 30 g samples, 1 kg progression, sustainable incentives and reorder path        | Deferred by owner; costs, terms and Shopify offer needed      |
| 7     | [0114 Launch boundary](0114-storefront-launch-boundary.md)                                             | Resolve independent storefront checkout against the existing Core gate               | Architectural decision before checkout implementation         |
| 8     | [0112 International selling and localization](0112-international-pricing-shipping-and-localization.md) | Destination-based prices, shipping and checkout; staged language localization        | Four languages verified; US/SG in JPY; shipping setup pending |
| 9     | [0113 Packaging](0113-common-pouch-and-product-labels.md)                                              | Common pouch plus economical product/batch labels and QR content                     | Printing costs and required label content to establish        |

The owner's follow-up adds clearly labelled product-information placeholders
under Task 0108 to this pass; actual supplier facts remain pending. The owner
explicitly defers About (0110) and Samples (0111) to their own later tasks.
Tasks 0109–0114 are planned work, not features implemented in this pass. Later
work can be reordered as factual inputs arrive. These first corrections do not
wait for localization or internal Operations.

On 2026-10-07 the owner requested proceeding with localization. Task 0112 is now
in progress, starting with [Task 0116](0116-localization-product-identity.md).
The owner approved English, Simplified Chinese, Traditional Chinese and Japanese
under [Task 0117](0117-four-language-storefront.md), with the language switcher
beside the theme toggle. US and Singapore are the initial shipping scope; keep
JPY for both for now. Any future currency change is pending client decision.
About and Samples remain deferred. Actual shop capabilities still expose only
Japan/JPY/English; US/SG shipping needs configuration and confirmed rates.

The owner's subsequent Kyoto-list correction is tracked in
[Task 0115](0115-kyoto-origins-product-aggregation.md): parent Origins pages
must include products from both the UJI and Wazuka browsing contexts. Kyoto
lists all three products, Uji City lists two, and Wazuka lists Ceremonial.

## Preservation and validation

Keep the silver pouch, powder/material scene, fine lines, Mist/Blue hour themes,
Register code treatment, page composition, mobile popups and current buying
interactions. Do not change prices, availability, shipping promises or checkout
activation in the initial pass.

The owner's explicit UI correction requires UJI to use Ceremonial's Wazuka
Panorama layout, with content-specific labels and facts in the same composition.
The two Kyoto municipalities use the original Origins directory and detail
layout. No separate designation page or replacement visual treatment is approved.

Run focused tests for each implementation slice, then `pnpm validate`. Review
the final scoped diff and browser-check affected desktop/mobile surfaces in
both themes using mocked commerce. Each task records its own evidence. No
database workflow is needed unless a later task actually changes database
behavior. No commit, push, deployment or Shopify Admin write is included.

## Evidence

Tasks 0106 and 0107 and the provisional slice of 0108 are implemented locally.
Ceremonial uses `WZKA-00`, Barista `UJI-00`, and Culinary `UJI-01` throughout
the existing code labels, product records and server catalog projection. This
does not mutate Shopify merchant SKUs or the separate Operations database.

Uji City and Wazuka Town have separate entries beneath Kyoto. Both UJI products
use the existing Wazuka Panorama composition, with designation-specific facts;
the original directory and location reader remain in use. The first separate
UJI screen was rejected by the owner and removed before this final validation.
Stylesheets, theme providers, dialog/history mechanisms and the Specifications
composition are unchanged. Product-information placeholders occupy only the
existing Product record.

Final `pnpm validate` passed formatting, lint, types, all 80 unit tests and the
production build. Log: `.local/feedback-20261006/final-validation.log`.
Browser checks passed: product codes 10/10; provisional information 4/4;
corrected Origins designation/layout flows 4/4, canonical directory flows 2/2,
and popup regressions 6/6. Desktop/mobile and both themes were covered using
mocked commerce. The corrected Origins tests compare structure, computed
colours, type and photograph geometry against Wazuka. Final diff and screenshots
were reviewed. Each implementation task records its evidence and limitations.

The larger-feature plan and subsequent language/US/SG/JPY decisions are in Task
0112; shipping arrangements and remaining commercial terms are pending. About
and Samples remain deferred. Nothing was committed, deployed or written to
Shopify Admin, and there were no database changes.

Task 0117 is now locally verified: English, Simplified Chinese, Traditional
Chinese and Japanese, with the language control next to theme toggles and a 1px
font increase for Chinese/Japanese only. Natural-language/script review, 102 unit
tests, production build, four complete localization browser profiles and six
retail regression cases pass. Task 0112 remains open for destination selling and
shipping configuration; any currency change from interim JPY is pending client
decision.
