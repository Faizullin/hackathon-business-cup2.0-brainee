import { runtimeCatalog } from "@/lib/server/remote-games";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(await runtimeCatalog(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Catalog unavailable" }, { status: 503 });
  }
}
