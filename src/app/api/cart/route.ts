import { isLocalTestCheckoutRequest } from "@/lib/cart-config";
import { parseCartRequest } from "@/lib/cart-input";
import {
  addCurrentCartLine,
  loadCurrentCart,
  removeCurrentCartLine,
  updateCurrentCartLine,
} from "@/lib/cart-server";
import type { CartResponse } from "@/lib/cart-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respond(
  request: Request,
  result: Omit<CartResponse, "checkoutEnabled">,
  status = 200,
) {
  return Response.json(
    {
      ...result,
      checkoutEnabled: isLocalTestCheckoutRequest(request, process.env),
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: Request) {
  try {
    const result = await loadCurrentCart();
    return respond(request, result, result.kind === "unavailable" ? 503 : 200);
  } catch {
    return respond(request, { kind: "unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  // SameSite cookies alone are insufficient for same-site, cross-origin calls.
  if (
    request.headers.get("origin") !==
      `${new URL(request.url).protocol}//${request.headers.get("host")}` ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return respond(request, { kind: "rejected" }, 403);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return respond(request, { kind: "rejected" }, 415);
  }
  let input: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return respond(request, { kind: "rejected" }, 400);
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 2_048) {
        await reader.cancel();
        return respond(request, { kind: "rejected" }, 413);
      }
      chunks.push(value);
    }
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return respond(request, { kind: "rejected" }, 400);
  }
  const parsed = parseCartRequest(input);
  if (!parsed) return respond(request, { kind: "rejected" }, 400);
  try {
    const result =
      parsed.action === "add"
        ? await addCurrentCartLine(parsed.command)
        : parsed.action === "update"
          ? await updateCurrentCartLine(parsed.command)
          : await removeCurrentCartLine(parsed.command);
    return respond(request, result, result.kind === "unavailable" ? 503 : 200);
  } catch {
    // A dispatched write may have committed. Never imply a failed write is safe
    // to replay; the client must refresh authoritative state before trying again.
    return respond(request, { kind: "ambiguous" }, 503);
  }
}
