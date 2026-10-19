# 0174 — About and Samples navigation

Status: Implemented and verified locally.

The owner requests About → `/about` and Samples → `/samples` in the site
navigation. Canonical About already uses the page link. Make Samples available
from the initial homepage, before Explore matcha, as well as the open selection
and other canonical routes. The same links appear in the mobile menu.

Preserve the shared navigation styles, current-page indicators, commerce busy
states, in-place Matcha/Origins behavior and saved independent study controls.
No commerce configuration or deployment is included.

Verified the initial desktop homepage shows both page links. Clicking About
opens `/about`; the mobile menu includes both links and Samples opens `/samples`
and closes the menu. Preserved typography and layout at 1280 px and 390 px.
Updated the existing navigation regression recipes; syntax and formatting pass.
`pnpm validate` passes formatting, lint, types, 189 tests and the production build.
Final diff whitespace check passes. Evidence: `.local/navigation-0174/`.
