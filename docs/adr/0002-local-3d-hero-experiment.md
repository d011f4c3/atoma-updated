# ADR 0002 — A local 3D renderer for the final hero experiment

Date: 2026-09-28
Status: Accepted for the bounded local design experiment

## Context

The owner asks for one final comparison hero informed by the client's original
briefs and Oro's product-animation reference, while expressly allowing an
independent layout. The supplied 3.22-second recording shows a bottle turning
from a close, low viewpoint toward a settled front view; its perspective and
reflections change together. A static image transform cannot reproduce that
material response convincingly.

The briefs call for product-first intrigue, controlled industrial photography,
quiet precise surfaces, and thin Sans/Mono. Metal trays and matcha powder are
explicit subjects. This decision concerns presentation only; the object remains
illustrative and does not imply an available SKU or actual ATOMA equipment.

## Decision

Add exactly pinned `three@0.186.1` and development types `@types/three@0.186.0`
for `/concept-05` and its `/light` comparison only. Use the browser WebGL renderer with original procedural
geometry/materials and studio lighting. No React renderer wrapper, animation
library, remote HDR, downloaded model, external media, tracking, or new service.

Load the scene only in this isolated client route. Keep a local static image
fallback, cap pixel ratio, stop rendering while hidden, render a settled still
for reduced motion, and dispose geometries/materials/textures/render targets
and the renderer on unmount. Existing homepage and concepts remain unchanged.

## Consequences

This experiment adds a WebGL code chunk and GPU work to Concept05. It provides
actual changing perspective and specular reflections, plus bounded pointer
response. Clients without WebGL see the existing illustrative tray fallback.
Continuous ambient motion follows the owner's explicit request to retain motion
without a custom toggle. System reduced-motion renders a still; hidden documents
stop rendering. No production deployment or commerce integration is authorized. Evaluate the
visual result, local bundle, responsive performance and fallback before any
production decision; remove the route and dependency if the direction is rejected.

## Primary references

- [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) and
  [MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html).
- Pinned library source and type declarations installed in `node_modules/three`
  and `node_modules/@types/three`; use these for version-specific APIs.
- Npm registry verified versions before installation on 2026-09-28.
