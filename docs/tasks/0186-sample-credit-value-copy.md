# Task 0186 — Sample credit value copy

Date: 2026-10-19
Status: implemented; visual verification pending.

## Scope

Make the Sample Set's value clearer on `/samples` and the homepage: buyers can
taste the matcha before committing to 1 kg, then use the emailed credit toward
their first eligible wholesale order of 1 kg or more. Retain the approved
¥4,500 credit, current catalog prices, quantities and purchase controls. Describe
order credit rather than a cash refund or an unconditional free sample offer.

The shared purchase value note now explains tasting first and using the code
emailed after purchase. It remains translated into Japanese, Simplified Chinese
and Traditional Chinese.

## Latest clarification

The owner requested less copy inside Ordering information and no repeated
benefit line beneath it. Remove the study-only conversion, promotion-condition
and Shopify eligibility paragraphs, and remove the unpublished dispatch/transit
sentence from the shared disclosure. Keep shipping, the credit amount, emailed
code instructions and the same-email guidance. The separate next-order guidance
on `/samples` remains unchanged.

The owner's final clarification asks the study to make its selling benefits
clear. All three layouts show the trial and credit benefits together beneath
the Sample Set heading: “Compare flavour and texture in your own drinks and
recipes. Your set includes ¥4,500 credit toward your first eligible wholesale
order of 1 kg or more.” There is no repeated benefit paragraph after Ordering
information. The return control reads “Explore individual matcha,” with matching
translations and existing browser-fixture expectations.

## Verification

Scoped formatting and lint pass. Both updated browser recipes pass syntax
checks; the 23 localization, sample-offer and sample-journey unit checks pass.
Visual review remains with the parent task. This copy change does not change
Shopify settings, publish the site or modify promotion eligibility.
