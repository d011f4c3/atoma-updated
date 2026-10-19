import { loadCurrentDestination } from "@/lib/cart-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await loadCurrentDestination();
  return Response.json(result, {
    status: result.kind === "unavailable" ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
