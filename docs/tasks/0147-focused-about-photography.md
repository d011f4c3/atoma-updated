# Task 0147 — Focus About on photographic stories

Date: 2026-10-13
Status: Layout implemented — actual shoot photographs pending

## Authority

The owner accepts the improved About flow and asks for a more focused field-note
experience, a photograph instead of the tray, and prominent harvest and farmer
technology photography. Both shoots are confirmed by the owner. Actual files
are not yet identified in this task; existing archive images are explicit layout
placeholders, not evidence of the harvest weekend or equipment.

## Scope

The owner's follow-up requests a new composition with substantially less text and
a balance of technical character and imagery. A further correction explicitly
defines the approach as Character, Application and Origin, with the supplied
sentences used verbatim. It is not a product register.

Replace the current default with a broad photographic opening, a concise
three-principle approach section, a one-line company introduction and staggered
harvest/technology photo features. Move longer story text into an About-only
focused reader. Reuse shared modal
dismissal and scroll locking without changing the general Origins reader. Keep
the current small type scale, company attribution, themes, cart,
canonical routes and archived layouts.

Use actual shoot files once supplied. Do not identify private growers, invent
equipment results or imply that the archive depicts a drone or powersuit. Keep
community involvement separate from product provenance. No deployment.

## Verification

Check both story entrances and focused reader composition on desktop and phone,
Escape, backdrop and close-button dismissal, focus/scroll restoration, theme,
cart, keyboard behavior, image loading, no-JavaScript content and reduced motion.
Run the scoped browser suite, `pnpm validate` and final diff review.

## Implemented

The tray and product register are removed. A broad Kyoto archive photograph leads
into the owner's exact Character, Application and Origin principles. Harvest and
farmer technology now have prominent, staggered photographic features with short
captions. Their longer text opens in a dedicated inset reader with a persistent
return control; the general Origins browser is unchanged.

Archive images are visibly marked as layout placeholders. The actual harvest,
drone and powersuit files have not been supplied or identified. A folder-path
question is pending; no substitute image is claimed to depict that shoot.

Desktop and phone views in both themes were visually reviewed. Browser checks
identified and resolved initial-title Tab containment and mobile section-link
visibility. The exact three-principle wording, short main-page copy, image fit,
focused readers and current commerce boundaries are covered by the updated
About flow browser checks. Validation evidence is local under
`.local/about-stories-0147/`.
