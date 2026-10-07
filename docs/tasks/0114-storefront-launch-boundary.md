# Task 0114 — Decide the storefront's independent launch boundary

Date: 2026-10-06
Status: Decision required before production checkout; local tests permitted by ADR 0004
Source: [Feedback introduction and closing](../briefs/2026-10-06-client-feedback.md)
Related: [ADR 0003](../adr/0003-reviewed-headless-catalog-and-cart.md), accepted
JMM ADR-0015/0016 and technical charter

## Conflict to resolve

The client requests independent completion/launch of storefront, samples,
country pricing, shipping and checkout, with quality control, detailed lots and
Operations progressing separately. The current accepted architecture permits
checkout only for a reconciled Core offer; this frontend currently suppresses
checkout URLs. Client feedback is source material, not by itself an accepted
replacement for that architecture.

The current owner authorizes small corrections and a larger-feature plan.
Do not silently remove the checkout gate or add Operations data structures to
make storefront work look ready. Product-code and origin corrections can proceed.

## Deliverable for the owner

Draft a narrow ADR comparing an explicitly Shopify-led initial storefront
commercial authority with the existing Core-reconciled launch. Recommend the
smallest operable launch boundary after documenting who manages products,
inventory/overselling, pricing, destination restrictions, fulfillment, refunds,
order records and recovery during the interim. Preserve stable Shopify product
and variant IDs plus public codes for later matching; do not create a parallel
Operations inventory or invent mappings to future internal records.

Specify consequences for future reconciliation, minimum operational controls,
environment/buyer-IP protection, supported markets, safe payment testing,
monitoring and rollback. Record the accepted decision and exact superseded
clauses before changing runtime authority. Update both affected architecture
records through a separately scoped documentation change if approval spans JMM.

## Acceptance and checks

- A named owner accepts one explicit launch authority and operating process.
- Existing quality/traceability/fulfillment obligations are assigned to actual
  processes rather than assumed to disappear with deferred integration.
- Task 0112 has a concrete checkout integration boundary and release checklist.
- No production permission, service, migration or checkout activation occurs
  merely by completing the decision paper.

Review the ADR against existing contracts and feedback; run documentation checks
and `pnpm validate` for repository changes. Implementation and production release
remain separate bounded tasks.

## Local test exception — 2026-10-07

The owner's explicit request to test the complete checkout journey is accepted
in [ADR 0004](../adr/0004-local-test-checkout.md) and implemented in
[Task 0127](0127-local-checkout-end-to-end.md). It permits opted-in loopback
development checkout through a simulated gateway in the authorized test shop.
US and Singapore test orders reached confirmation in JPY. This resolves local
test authority only; the production launch decision above remains outstanding.
