import { readCatalog } from "@/lib/catalog-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await readCatalog();
  return Response.json(catalog, {
    status: catalog.status === "unavailable" ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
