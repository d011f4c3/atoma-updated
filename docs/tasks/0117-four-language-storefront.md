# Task 0117 — Four-language storefront

Date: 2026-10-07
Status: Complete locally; verified 2026-10-07
Authority: Owner approved English, Simplified Chinese, Traditional Chinese and
Japanese, with US and Singapore as the initial shipping-country scope.
Parent: [Task 0112](0112-international-pricing-shipping-and-localization.md).

## Implementation

Add `en`, `zh-Hans`, `zh-Hant` and `ja` storefront copy using local typed
translation tables and a shared locale provider. English remains the default.
A compact native language selector beside each existing theme toggle changes
language in place, as explicitly requested by the owner. Persist an allowlisted preference in a same-site
cookie; server rendering and `html.lang` use that preference on later visits.
Keep existing URLs and product handles, and retain selection, quantities, cart,
theme, open-view state and mounted material scenes. No routing or SEO expansion
is necessary for this preview; retain noindex and localize metadata.

Translate canonical homepage/product information, Shop, Origins, cart, navigation,
existing About content, footer, accessibility labels and user-facing error states.
Translation reproduces current meaning and factual limits; it adds no origin,
supplier, sample, subscription or commercial claims. Codes, user references,
identifiers and physical units remain stable. Unknown catalog text may retain
the supplied source text. Existing studies are outside the translation rollout.

Preserve the approved composition, imagery, controls and English typography.
Use existing system CJK fallbacks. The owner additionally requested an approximately
1px global increase for non-Latin text, with English unchanged. Apply a shared
1px font increment in Chinese/Japanese at explicit storefront font-size declarations;
leave the root rem size, spacing and imagery dimensions unchanged. Allow CJK
paragraphs to wrap between characters. No new font download, dependency, service or CMS.

## Destination boundary

Record US and Singapore as the requested launch destinations, extensible later.
Use JPY for both US and Singapore for now, as explicitly directed by the owner.
Any future USD/SGD or other currency change is **pending client decision**.
Shipping services, rates and dispatch/transit estimates remain pending.
The currently configured shop exposes only Japan/JPY/English; language selection
does not change commerce context or fabricate US/Singapore prices or shipping.
Country pricing/cart synchronization and actual shop configuration remain a
separate implementation/release slice under Tasks 0112 and 0114.

## Validation

Validate locale allowlisting, fallback, dictionary completeness, placeholders,
stable product/origin identity and initial server language. Check all four
languages on canonical routes, desktop and narrow mobile, light/dark, reload
persistence, switch continuity, keyboard access, no clipping/overflow and unchanged
English presentation. Use mocked commerce; no remote mutations. Run focused
tests, `pnpm validate`, review source diff and actual screenshots.

## Evidence

- Local copy supports English, Simplified Chinese (`zh-Hans`), Traditional Chinese
  (`zh-Hant`) and Japanese. Every explicit translation key has all three translated
  values, preserves interpolation placeholders and has no case-folded collision.
- Reviewed all 519 Chinese translation pairs, including correct script forms and
  natural phrasing. Corrected two Japanese-form characters in Traditional Chinese,
  refined product-use names and long descriptions, and smoothed Chinese/Japanese
  cart, checkout, navigation and regional copy. This is an editorial AI review;
  independent native-speaker/client terminology approval has not been performed.
- The native language select sits beside every existing theme toggle. Switching
  preserves the current product, quantity, cart, open view and mounted material;
  locale persists to a same-site cookie and is server-rendered on reload. Existing
  routes, noindex metadata, JPY amounts and checkout gating are preserved.
- The new `tests/storefront-localization.mjs` passed all four profiles:
  desktop 1366px and mobile 320px, each light/dark, each exercising all four
  languages across homepage, Shop, product/cart and Origins. Verified translated
  metadata, server language/cookie, keyboard adjacency, no clipping, Kyoto's
  three-product aggregation, bilingual place search, filters and reader return.
- Measured header, paragraph and button fonts increase exactly 1px for Chinese
  and Japanese and return to the original English size. Root rem dimensions
  remain unchanged. CJK wrapped text can break without whitespace; abbreviated
  material copy recognizes Chinese/Japanese sentence endings.
- Existing retail browser regression passed 6/6, including mocked purchases,
  narrow mobile keyboard flows, unavailable products and retry. Additional
  mobile language/theme menu captures passed 2/2. Desktop/mobile screenshots
  were visually reviewed in both palettes. Evidence: `.local/localization-0117/`.
- Final `pnpm validate` passed formatting, lint, TypeScript, all 102 unit tests
  and the production build. Log: `.local/localization-0117/final-validation.log`.
  Final source and style diffs were reviewed; no dependency, database, Shopify
  configuration, live-cart, commit or deployment changes were made.

## Japanese copy follow-up — 2026-10-07

Owner correction: avoid unnecessary second-person pronouns in Japanese. Omit
subjects where natural and use context-specific wording instead of translating
English “you/your” directly as あなた or substituting another form of address.
Replaced the two remaining occurrences in Shop and the selection tagline with
「用途に合う抹茶を。」 and 「{name}。使い方に合わせて。」. Other languages,
layout and typography are unchanged. Also refined the related literal phrase
「自分の飲み物やレシピ」 to 「作りたい飲み物やレシピ」. A repository copy scan found no remaining
あなた/貴方/貴女 occurrences in storefront source.

Focused translation checks and `pnpm validate` passed again after this copy
correction, including all 102 unit tests and the production build. Final changes
were reviewed. Log: `.local/localization-0117/japanese-copy-validation.log`.
