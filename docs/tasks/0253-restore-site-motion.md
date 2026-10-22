# Task 0253 — Restore site motion and refine presentation

Date: 2026-10-22
Status: Complete

## Authority and scope

The owner reports missing glitch effects, menu animation, loading feedback and
hero reveals after homepage adoption. They explicitly request those effects
across all site pages, plus a smaller desktop hero heading. Their follow-up
requests another size reduction and a calmer headline because its glitch feels
jarring, followed by lighter header text. The owner then reverted the lighter
hero heading to its original weight. This supersedes Task 0227's blanket
suppression of authored text/menu motion.

- Restore existing character resolution on menu interaction and authored display
  text across the storefront. Reuse the established animation system and retain
  stable accessible text, reduced motion, hidden-page and disabled-control guards.
- Restore authored page/image entrances on the homepage, Wholesale, Samples,
  Origins, About, product and field-note pages. Keep commerce data and controls
  usable, preserve content, routes, themes and layout.
- Restore the compact percentage loader on fresh homepage entry using actual
  hero image/font readiness, existing timings and bounded failure fallbacks.
  Start the hero reveal after the loader clears; do not replay loading on
  in-place selection, appearance changes or popup return. Direct selection
  entry and saved studies bypass the opening loader as before.
- Reduce the adopted homepage's desktop h1 by approximately 15% from the
  original study scale, preserving its mobile scale and the saved study's
  typography. Keep the hero headline settled after its entrance rather than
  periodically scrambling it.
- Use the next lighter IBM Plex Mono weight (300) for storefront header labels,
  the hero's supporting description and equivalent selection-view introductions;
  retain the hero heading's original weight (400). Add the official Light face
  from the already pinned upstream revision, preserving sizes, mono metrics
  and the wordmark. Register the Light face separately so unrelated text that
  inherits a lighter CSS weight retains its previous rendered face. The loader
  waits for the actual heading and supporting fonts as well as its existing fonts.
- Make canonical page/section/dialog titles uppercase through scoped presentation
  rules. Preserve sentence-case prose, units, values and user-entered text.
- Remove customer-facing AI/reference/photography-pending captions and provisional
  profile/product placeholders. Retain source metadata in the registry/docs,
  useful product facts, privacy boundaries and real commerce/error states.
- Replace the hero CTA's fragmented text decoration with one continuous underline.
- Align supporting text colors in the homepage selection views with the hero's
  softer text token, preserving primary action contrast and the approved palettes.
  Keep the brighter dark Sample Set eyebrow where the existing transition gradient
  requires it for contrast; the paragraph below uses the hero's softer token.
- Update the hero description to “Authentic Japanese matcha selected for tea
  service, lattes and recipes.”, with all supported translations. Keep the
  existing Japanese locale and surface it immediately after English as
  “日本語 / Japanese” in the language picker; verify switching and persistence.
- No new dependencies, commerce changes, live writes or deployment.

## Verification

Verify actual glyph mutations, loader/readiness/reveal ordering, desktop/mobile
type sizes, menu and popup function, site page entrances, reduced motion,
failed/delayed imagery, no-JavaScript fallback and no in-place replay. Use
isolated commerce fixtures. Run relevant motion tests, `pnpm validate`, and
review screenshots and the final diff.

## Results

- Restored shared menu/text motion and canonical page/image entrances. The
  homepage headline remains settled after its reveal; desktop is approximately
  15% smaller than the saved study, and mobile retains its original scale.
- Verified loader readiness, progress/fade/reveal ordering, fresh-load replay,
  no in-place replay, real hover/focus glyph changes, accessible names, reduced
  motion, image failure, no JavaScript and blocked-script CSS fail-open behavior.
- Reviewed desktop/mobile Home, Samples, Applications and native product/sample
  dialogs after the typography, caption and underline changes. Supporting text
  colors match the hero in both themes; primary actions, pricing, geometry,
  scroll return and buying controls remain intact.
- Verified the new English/Japanese copy, visible Japanese option, translated
  navigation and selection views, popup function, locale-cookie persistence and
  viewport fit on desktop and mobile.
- `pnpm validate` passes: formatting, lint, TypeScript, all 246 unit tests and
  production build. Scoped motion/localization checks and final diff review pass.
- Local evidence: `.local/homepage-0253/`,
  `.local/motion-0253/text-consistency-after/`, and
  `.local/site-motion-0253/validate-final.log`. No deployment or live commerce
  writes were performed.
