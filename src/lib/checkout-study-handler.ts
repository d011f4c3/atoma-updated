import type { CheckoutResult } from "./cart-application.ts";
import { handleCheckoutRequest } from "./checkout-handler.ts";
import {
  isExpectedCheckoutUrl,
  readCheckoutHost,
  type CheckoutHostEnvironment,
} from "./checkout-policy.ts";

const PRIVATE_HEADERS = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};

/** ADR 0005: an isolated local SDK handoff, never part of the public cart API. */
export async function handleCheckoutStudyRequest(
  request: Request,
  dependencies: {
    environment: CheckoutHostEnvironment;
    prepareCheckout: () => Promise<CheckoutResult>;
  },
): Promise<Response> {
  if (dependencies.environment.ATOMA_CHECKOUT_STUDY_ENABLED !== "true") {
    return Response.json(
      { kind: "unavailable" },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }

  // Reuse every gate, request/body check and authoritative lookup of the
  // existing redirect flow. Convert only its successful exact-shop redirect.
  const handoff = await handleCheckoutRequest(request, dependencies);
  if (handoff.status !== 303) return handoff;
  const checkoutUrl = handoff.headers.get("location");
  if (
    !checkoutUrl ||
    !isExpectedCheckoutUrl(
      checkoutUrl,
      readCheckoutHost(dependencies.environment),
    )
  ) {
    return Response.json(
      { kind: "unavailable" },
      { status: 409, headers: PRIVATE_HEADERS },
    );
  }
  return Response.json(
    { kind: "ready", checkoutUrl },
    { headers: PRIVATE_HEADERS },
  );
}
