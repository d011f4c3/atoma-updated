# Task 0165 — Open Sample Set information in place

The owner requests another pass at the right side after Explore matcha. Their
latest clarification keeps the existing right-side tea information and changes
the left Sample Set entrance to open its information in place. The dedicated
`/samples` purchase page remains independently linked in navigation and
shareable. This supersedes the initial set-first default and extra context
switch from this task.

Fresh Explore keeps the established right-side tabs, type and layout. The
Quiet repetition Sample Set rail on the left now acts as a selection button.
It opens a short set introduction on the right: all three powders, names and
uses, 30 g each, total 90 g, and a route to the separate Samples page. Choosing
any tea, or the reader's Selected matcha return, restores the existing tea
information. Both contexts stay mounted; switching does not change the tea,
format, quantity, reference, cart or material renderer. Explicit product URLs
open that tea. Context persists through local navigation in homepage journey
state. The comparison remains available as `right=start` at
`/samples-entry-study`; earlier options retain their direct Samples links.

Reuse the existing homepage tab type scale, action class, palette, left
selectors and material scene. Leave the initial tray/Explore entrance, Shop
and Samples purchase flow intact. No commercial offer, price, stock or shipping
claim is introduced. Phones use normal flow with reachable controls.

Verification: desktop 1440 px light and phone 390 px dark browser checks pass.
Fresh Explore retains the original tea panel; the left set button opens the
reader without navigating. The return control and all tea choices, including
the currently selected tea, restore the previous information view and exact
format/quantity. The material DOM node stays mounted. The separate Samples
navigation and reader CTA work; Back retains the chosen context and order.
Explicit tea links take precedence over a previously opened sample reader,
including a product link from the in-place Origins dialog. Opening the set
while the catalog is pending focuses its visible heading. Keyboard controls,
viewport fit, prepared images and URL behavior pass without runtime errors,
external traffic or writes. Evidence is in `.local/homepage-sample-start-0165/`.

Scoped formatting, lint and final diff review pass. Full repository validation
passes (formatting, lint, types, 142 tests and production build) and is recorded
with Tasks 0166–0167 in `.local/validation-0165-0167.log`.
