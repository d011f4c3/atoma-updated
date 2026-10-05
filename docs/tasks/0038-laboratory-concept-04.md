# Task 0038 — Concept 04: material, precisely

Date: 2026-09-30
Status: Implemented; repository gate blocked by unrelated concurrent work

The owner rejects the current hero/site's visual character and asks for a
separate `/concept-04` inspired by three supplied photographs: an engineered
matcha case, cool-toned photographic product studies, and the finely ribbed
form of a dark matcha whisk. The direction is precision engineering × matcha ×
laboratory, expressed through real-looking materials, controlled reflections,
small typography and deliberate empty space.

Create a complete responsive concept with an original illustrative photographic
hero, a working matcha selection/purchase section using the reviewed catalog/cart,
and a short photographic approach section. Use native UI over the photograph;
no baked-in labels, fake measurements, lab results, lot codes or origin claims.
The case/utensils are illustrative art direction, not products offered for sale.
Use the existing mono and small Antro accents where appropriate, fine rules and
subtle corners. Preserve reduced motion, keyboard entry, actual availability and
quantity rules. Keep reference personalization outside this concept.

The requested route explicitly authorizes reusing `/concept-04`, whose old route
had already been removed from the working tree. The historical Concept 04 remains
in its documented git checkpoint. Preserve the current homepage, other studies,
shop and shared commerce implementations. Do not modify the user's source photos.
No dependency, external service, production setting or deployment change.

Use the built-in imagegen skill for original assets and record exact prompts and
provenance. Copy final files into public/images/concept-04. Review desktop and
phone layouts, nav/anchors, real catalog selection, quantity, material details and
cart read-only interactions. Run `pnpm validate`, then inspect the scoped changes.

## Delivered

- Restored `/concept-04` as an isolated laboratory direction: original silver
  case photography, small mono labels, subtle rules, matcha selection, and a
  photographic whisk study. Other routes and shared commerce remain intact.
- Added a separate portrait hero through an optimized native `picture`, keeping
  the entire case visible on phones and portrait tablets. Mobile typography
  fits a 320px viewport, and product photography retains its height in the
  stacked selection layout.
- The collection reuses catalog prices, availability, quantity constraints,
  material details and cart behavior. It guards duplicate submissions and keeps
  the unavailable subscription disclosure consistent with the current store.
- Generated assets and exact prompts are recorded in
  [the provenance note](../references/concept-04-hero.md).

## Validation

- Visually reviewed through CUA at 1440×900, 1366×768, 768×1024, 390×844 and
  320×568. No horizontal overflow in those layouts; full hero objects remain
  visible, with dedicated phone and tablet framing.
- Verified selection anchors, actual product switching and unavailable states,
  quantity totals (¥10,000 → ¥20,000 → ¥10,000), material dialog, cart opening
  and closing, and reduced-motion styling. No cart mutation or checkout action
  was performed against the live service.
- Scoped Prettier and ESLint passed. All 26 unit tests passed. Reviewed the
  route diff and new component/style files; scoped diff whitespace check passed.
- `pnpm validate` passed repository formatting and lint, then stopped at
  unrelated concurrent `focused-specifications.tsx` lines 84–86: TS18048,
  `property` is possibly undefined. The production build was not reached.
  The separate Concept 08 work was preserved without modification.
