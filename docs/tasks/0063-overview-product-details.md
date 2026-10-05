# Task 0063 — Product details in Overview

Date: 2026-10-01
Status: Complete

## Approved scope

Move the homepage Product details from the bottom of Specifications into
Overview. Display formats, availability, application/preparation and the product
record directly, without an extra disclosure. Give these details a compact,
readable hierarchy alongside the existing overview copy and purchase links.

Apply to both homepage themes and the shared selector-placement study. Keep
Specifications focused on its seven material characteristics, preserve selected
product/order state, and retain the disclosure on dedicated retail product pages.
Preserve published facts, actual formats, availability and literal physical units.
No new dependencies, product claims, commerce writes or deployment.

## Validation

Review desktop and mobile in both themes, switch products and information tabs,
and confirm the selected details update and remain visible in Overview. Check the
retail disclosure still opens independently. Update existing browser expectations,
run `pnpm validate`, and review the scoped diff.

## Result and verification

Overview now displays the shared Product details inline, with compact uppercase
section headings, clear separators and literal format units. Its existing Shop
and Specifications links remain above the added details. Specifications contains
only the material characteristics; dedicated retail pages retain the default
closed disclosure. Product facts and catalog data are unchanged.

CUA review covered the light desktop view at 1366×900, dark mobile at 390×844,
and light mobile at 320×740. Formats, prices, availability and preparation updated
across Culinary, Barista and Premium selection. Specifications retained all seven
characteristics without duplicate details; return to Overview worked. Only the
right information panel scrolls on desktop, and narrow mobile had no horizontal
overflow. The retail Product details disclosure remained closed initially and
opened normally. No cart writes were performed.

Updated existing homepage and retail browser expectations; equivalent scenarios
were reviewed through CUA, not by running those browser scripts. `pnpm validate`
passed formatting, ESLint, TypeScript, all 60 unit tests and the production build.
Reviewed the scoped source/test diff and ran `git diff --check` successfully.
