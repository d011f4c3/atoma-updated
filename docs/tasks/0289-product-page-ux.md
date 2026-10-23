# Task 0289 — Product page buying and learning

Date: 2026-10-23
Status: Complete

The owner identifies the canonical desktop product page as awkward to use.
The gallery and profile were separated from a distant buying column; price was
repeated and profile facts resembled selectable product options.

Pair a contained gallery with a compact buying column. Follow purchasing with
Profile / Preparation / Origin in that same column, retaining mobile product
learning disclosure. Show a single current order price with quantity and format
context, and group Quantity beside Add to cart where space allows. Name desktop
image choices Application and Powder. Only disclose purchase choices when real
selling plans or a retained selection require them.

Make all seven profile values readable facts, with the existing flavour summary
and optional full explanations. Preserve authored values, preparations and
origin records, localization, themes, motion, exact URL/format selection,
verified plans, quantities and commerce guards. No backend or live orders.

Verification is limited to the affected product view, ordering behavior,
learning/return state, responsive fit and translations. No broad validation
pass or deployment, following the owner's request for prompt focused changes.

## Result

The gallery now sits beside a narrower, continuous buying-and-details column.
Its Application / Powder controls remain in place while the buyer reads the
product details. Quantity and Add to cart share an aligned row and stack when
space requires it. One price shows the selected order total, with format and
quantity context; the redundant one-time-purchase note is omitted when there
is no alternative. Actual selling plans retain their disclosure and terms.

Profile facts use a semantic description list, with all existing explanations
retained. Profile details is translated into Japanese and both Chinese variants.
Existing browser assertions were updated for the new static facts and native
disclosure instead of the former selected-property buttons.

Eight focused product checks passed: two desktop first views, mobile buying,
verified-plan pricing, desktop and mobile learning, Origins return with retained
quantity, exact-format guarded purchase, and 320 px enlarged Japanese. TypeScript,
scoped ESLint, formatting and all seven localization tests passed. Reviewed
screenshots of desktop and mobile buying, including the requested Barista page.
Evidence: `.local/product-0289/`. All commerce writes used isolated fixtures.
