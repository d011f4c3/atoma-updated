import type { CheckoutResult } from "./cart-application.ts";
import {
  isExpectedCheckoutUrl,
  isLocalTestCheckoutRequest,
  isSameOriginCheckoutPost,
  readCheckoutHost,
  type CheckoutHostEnvironment,
} from "./checkout-policy.ts";

const PRIVATE_HEADERS = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};

export async function handleCheckoutRequest(
  request: Request,
  dependencies: {
    environment: CheckoutHostEnvironment;
    prepareCheckout: () => Promise<CheckoutResult>;
  },
): Promise<Response> {
  if (!isLocalTestCheckoutRequest(request, dependencies.environment)) {
    return Response.json(
      { kind: "unavailable" },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }
  if (!isSameOriginCheckoutPost(request)) {
    return Response.json(
      { kind: "rejected" },
      { status: 403, headers: PRIVATE_HEADERS },
    );
  }
  if (
    new URL(request.url).search ||
    request.headers.get("content-type")?.split(";")[0] !==
      "application/x-www-form-urlencoded" ||
    !(await hasEmptyBody(request))
  ) {
    return Response.json(
      { kind: "rejected" },
      { status: 400, headers: PRIVATE_HEADERS },
    );
  }
  try {
    const result = await dependencies.prepareCheckout();
    if (
      result.kind === "ready" &&
      result.totalQuantity > 0 &&
      isExpectedCheckoutUrl(
        result.checkoutUrl,
        readCheckoutHost(dependencies.environment),
      )
    ) {
      // The sole URL disclosure is an immediate server redirect, never JSON.
      return new Response(null, {
        status: 303,
        headers: { ...PRIVATE_HEADERS, Location: result.checkoutUrl },
      });
    }
  } catch {
    // Never expose vendor responses, cart credentials, or configuration values.
  }
  return new Response(null, {
    status: 303,
    headers: { ...PRIVATE_HEADERS, Location: retryLocation(request) },
  });
}

async function hasEmptyBody(request: Request): Promise<boolean> {
  const reader = request.body?.getReader();
  if (!reader) return true;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (value?.byteLength) {
        await reader.cancel();
        return false;
      }
      if (done) return true;
    }
  } catch {
    return false;
  }
}

function retryLocation(request: Request): string {
  const origin = `${new URL(request.url).protocol}//${request.headers.get("host")}`;
  let path = "/";
  const query = new URLSearchParams();
  try {
    const referer = new URL(request.headers.get("referer") ?? "");
    if (
      referer.origin === origin &&
      /^(?:\/|\/shop(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?)$/.test(referer.pathname)
    ) {
      path = referer.pathname;
      // Preserve the homepage's explicit product selection, never arbitrary
      // query parameters or a caller-supplied return destination.
      const handles = referer.searchParams.getAll("matcha");
      const handle = handles[0];
      if (
        path === "/" &&
        handles.length === 1 &&
        handle &&
        handle.length <= 255 &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(handle)
      ) {
        query.set("matcha", handle);
      }
    }
  } catch {}
  query.set("checkout", "retry");
  return `${origin}${path}?${query}`;
}
