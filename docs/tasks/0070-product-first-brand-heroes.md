# Task 0070 — Additional product-first brand heroes

## Approved brief

The owner rejected the preceding campaign-style heroes. Use the client design
brief to govern behavior: products lead, information follows, with origin and
people discovered later. Create four additional home-screen approaches with
distinct styling, typography and brand identities. Hero scope remains in place.

## Scope

- Aperture: a light optical contact sheet of actual matcha powder, extended thin
  typography and a drawn line identity. Products form the opening composition.
- Alloy: dark machined typography and a foil pouch; selected product naming,
  material image and explicit selection controls lead the view.
- Cell: a quiet translucent product family, rounded geometric identity and fine
  uppercase typography; three named products are the landing surface.
- Stack: a graphic supply catalog, asymmetric typography and flat silver packs;
  large product rows provide direct entry without campaign headlines.
- Add these to `/brand-exploration` as the default comparison. Keep the four
  previous heroes accessible in an earlier-studies selector.
- Each owns its identity, type hierarchy, imagery, product presentation and
  controls. Keep the canonical catalog, actual names/uses, links and cart.
- No invented product codes, lots, certifications, stock, price or measurements.
  Packaging is explicitly concept imagery in exploration notes, not a product fact.
- Preserve the ordinary homepage, product pages and unrelated studies. No new
  dependencies, production writes, deployment or commerce changes.

## Validation

Review all four at desktop and phone sizes, product entry and selection,
keyboard access and reduced motion. Run the smallest relevant checks and
`pnpm validate`, then review the final task diff.

## Results

- Added four independent heroes and made them the default comparison. Earlier
  Veil, Obsidian, Current and Index studies remain available from their selector.
- Aperture uses the existing three material photographs with direct specimen
  links; Cell presents three complete product entries. Alloy and Stack retain
  all product choices beside a larger selected product and direct entry.
- New packaging assets and complete built-in imagegen prompts are saved in
  `public/images/brand-products/` and `docs/design/brand-*-image-prompt.json`.
  Each photographic package carries a live label from canonical product content.
- Reviewed all four at 1280 × 720 and 390 × 844. Three-product selection remains
  visible on phone; essential use labels and entry controls were enlarged after
  review. Reduced-motion rules are present in each concept.
- Verified selection continuity between concepts, canonical product links,
  restoration of the concept after browser Back, earlier-study selection,
  keyboard notes access, and cart open/Escape/return focus. No commerce write.
- Reviewed the scoped diff against pre-edit copies. `pnpm validate` passes:
  formatting, lint, types, 60 tests and production build. `git diff --check`
  passes. No production deployment or unrelated homepage change.
