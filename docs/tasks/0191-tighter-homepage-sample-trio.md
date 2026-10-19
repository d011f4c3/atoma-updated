# Task 0191 — Tighter homepage Sample Set trio

Date: 2026-10-19
Status: implemented; parent visual review pending.

## Request and scope

The owner requests less space between the three foil pouches on the homepage's
left side. Keep their existing scale, labels, rotations and inspection behavior.
The ordering study should show the same arrangement; `/samples` and mobile
presentations retain their current spacing.

## Change

For the existing contained trio at desktop widths above 760 px, move the two
outer pouch centers from 17% / 83% to 22% / 78%. The middle stays at 50%.
Each outer pouch moves inward by 5% of the stage width, creating one centered
group with clearer separation between its foil edges. This incorporates the
owner's follow-up request for a visible gap after reviewing tighter groupings.
The existing shadows remain unchanged.

`SampleSetImagery` is the only caller using the contained presentation, so the
rule covers the homepage's left material stage and its studies. The independent
Samples gallery and compact mobile trio do not match it. No component props,
dimensions, assets, sticker styles, pointer transforms, dialogs or commerce
code change.

## Verification

Scoped Prettier and `git diff --check` pass. Source inspection confirms that the
only changed declarations are the two desktop `left` positions and that the
contained presentation is used only by the material-stage imagery component.
Parent owns desktop visual review of grouping and label clearance, inspection
interaction, and mobile and `/samples` regression checks. No browser session was
opened for this subtask.

## Browser review

At 1280 × 720, all three foil outlines and labels are distinct with visible gaps; the accepted pouch scale and opposing outer rotations remain.
