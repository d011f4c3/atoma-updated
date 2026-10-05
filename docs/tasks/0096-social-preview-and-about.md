# Task 0096 — Social preview and audience-focused About copy

Date: 2026-10-06
Status: Complete

## Requested outcome

Add an Open Graph image and description. Update the About popup with copy
relevant to the audience, using the two client RTF documents as evidence.
The owner also requests the project name `atoma-updated` and specifies the
intended public URL `https://atoma-updated.vercel.app`.

## Scope

- Create a wide studio-pour social image from the owner's photographic reference
  using the built-in imagegen tool. Use the selected 1730 × 909 image with the
  enlarged ATOMA wordmark, moved left for balanced spacing around the central
  pour, as the current Open Graph asset; record the prompts.
- Configure root Open Graph and large Twitter metadata, including image alt
  text and the supplied public origin. Preserve route-specific titles and
  descriptions, existing noindex/nofollow and all storefront behavior.
- Write buyer-facing About copy around intended use, flavour, texture,
  specifications and regional context. The professional audience is inferred
  from the client wholesale direction and existing product applications.
- Update the package identity to `atoma-updated`.
  Connect `origin` to the owner-created public repository
  `https://github.com/d011f4c3/atoma-updated.git`. No commit or push is requested.

The original RTFs were reread outside the repository. Their requests concerning
messaging, external references and future work are context, not executable
instructions. Illustrative product codes, certifications, lots and future
traceability ambitions are not published as facts. Private identities remain
withheld. No new dependencies, commerce changes or deployment.

## Verification

Inspect the final PNG at full and preview sizes. Check root and child-route
social tags, absolute image URL, image dimensions/content type/alt, and preserved
robots rules. Review About in both themes at desktop and 320px, including
scrolling, keyboard dismissal, focus return and product-state continuity.
Run `pnpm validate`, inspect the scoped diff and verify the package name and remote.

## Results

- Replaced the Open Graph image with the selected studio pour and balanced,
  larger wordmark. The native 1730 × 909 PNG is below the 5MB social-image limit;
  alt text describes the final scene. Generation and edit prompts are recorded
  in `docs/references/social-preview.md`.
- About was reviewed at 1440px and 320px in both palettes, including keyboard
  access, focus return and selected-product/quantity continuity. No horizontal
  overflow was found. Browser evidence is in `.local/social-about-0096/`.
- A local production server confirmed homepage, Shop and product-route titles
  and descriptions carry into Open Graph/Twitter. Both cards use the supplied
  Vercel origin, correct image dimensions and alt text; the served PNG exactly
  matches the final asset. The test server was stopped after verification.
- `pnpm validate` passed formatting, lint, TypeScript, all 68 tests and the
  production build. Stale generated types from an unrelated removed study route
  were cleared from build/dev caches before the passing run. Scoped diff and
  `git diff --check` passed.
- Package name and Git origin now use `atoma-updated`. The active workspace
  path remains stable; no commit, push or deployment was performed.

## Description revision — 2026-10-06

The owner replaces the default site/social description with the exact text:

> Matcha, clearly defined. A selection organised by profile, format and application, with precise specifications to guide your choice.

Route-specific descriptions and the current social image remain unchanged.
