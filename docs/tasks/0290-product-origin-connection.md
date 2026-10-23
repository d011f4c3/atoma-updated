# Task 0290 — Product origin connection

Date: 2026-10-23
Status: Complete

The owner approves the refined product layout and asks for a clearer connection
to origin. Add a compact origin link between the introduction and buying, using
existing published material provenance and designation relationships.

Ceremonial shows Grown in / Wazuka with the Uji tea-growing region, Kyoto
Prefecture and Japan path. Barista and Culinary show Tea designation / UJI with
Kyoto regional context. Their specific growing places remain unspecified.
Unknown products get no inferred origin. No provenance records are changed.

Each link opens the existing origin reader at the relevant place, with the
product as its return destination. Navigation respects pending order locks;
quantity, focus and scroll remain on return. On mobile the origin spans the
page width between the compact product introduction and order controls.
All strings use existing translations.

Targeted desktop Barista and mobile Ceremonial checks confirm correct origin
copy, reachable Add to cart, reader return with quantity and focus retained,
and no horizontal overflow. TypeScript, scoped ESLint and formatting passed.
Evidence: `.local/product-origin-0290/`. No live commerce writes or deployment.
