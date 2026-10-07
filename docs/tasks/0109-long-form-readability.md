# Task 0109 — Improve long-form reading within the accepted design

Date: 2026-10-06
Status: Planned — bounded presentation work
Source: [Feedback §7](../briefs/2026-10-06-client-feedback.md)

## Outcome and scope

Retain monospaced uppercase labels, product codes, fine rules, the material
scene and both themes. Give longer body passages sentence case, more comfortable
size and stronger contrast within their current panels. Do not impose a new
sitewide type system or reorganize the page.

Start with the Overview paragraph beneath “Part of the recipe,” Application &
Preparation, Product Record/Details and Origins descriptions. Rewrite the
preparation passage into short sentences or steps without changing its factual
meaning. Replace the exhaustive unpublished-facts list with a concise message
and clear published details; coordinate the actual values with Task 0108.
Preserve the current specifications as the baseline. Comparisons or additional
photos are optional follow-ups with their own supplied content.

## Acceptance and checks

- Long body text reads naturally on a 320px phone in Mist and Blue hour.
- Headings/labels remain visually distinct; codes and exact entered data retain
  their intended case and units.
- Panels, dialogs and purchase actions remain reachable without clipping.
- Typography changes preserve keyboard focus, reduced motion, selection and
  material-scene continuity; periodic text effects do not impair reading.
- No price, origin, sensory or certification claim is strengthened by rewriting.

Review before/after desktop/mobile captures and contrast for the actual body
styles; run relevant component/interaction checks and `pnpm validate`, then
review the scoped diff. No new dependency or production release is included.
