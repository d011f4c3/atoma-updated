# Antro Vectra font reference

Added on 2026-09-30 for the owner's requested personal-reference treatment.

- Typeface: Antro Vectra Regular, by Youssef Habchi.
- Source: the existing local installation at `/Library/Fonts/Antro_Vectra.otf`.
- Repository asset: `public/fonts/antro-vectra/Antro_Vectra.otf`, copied without
  modifying or converting the font data. No font was downloaded or purchased.
- Official typeface reference:
  [Antro Vectra](https://youssef-habchi.com/fonts/antro-vectra).
- Official licensing reference:
  [Youssef Habchi license information](https://youssef-habchi.com/license).

The author's license page identifies separate commercial licenses and includes
website embedding in the Desktop + Webfont tier and several broader tiers.
This repository does not establish that a commercial or webfont license has
been purchased. This local reference implementation does not establish rights
for a public or commercial release.

The root layout exposes `--font-antro-vectra` through the existing `next/font/local`
integration, using weight 400, normal style and `font-display: swap`. Preloading
is disabled so the font is requested when a styled element needs it. Automatic
Arial metric adjustment is disabled; consumers supply a generic `cursive`
fallback when using the variable. No global font-family replacement is applied.
