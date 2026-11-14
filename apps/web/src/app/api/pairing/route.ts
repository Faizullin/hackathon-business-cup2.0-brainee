import { createPairingCode, redeemPairingCode } from "@brainee/db";
import { type NextRequest, NextResponse } from "next/server";
import { withAccessCookie } from "@/lib/server/access-cookie";
import { demoApi, readDemoJson, requireDemoToken } from "@/lib/server/demo-api";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    const body = (await readDemoJson(request)) as { type?: string; code?: unknown } | null;
    if (body?.type === "create")
      return NextResponse.json(await createPairingCode(db, requireDemoToken(request), now));
    // Local direct requests share a bucket. Deployment must supply a trusted proxy address.
    const address =
      process.env.NODE_ENV === "production" && process.env.VERCEL === "1"
        ? (request.headers.get("x-vercel-forwarded-for") ?? "local")
        : "local";
    const result = await redeemPairingCode(db, address, body?.code, now);
    if (!result.access)
      return NextResponse.json(result, { status: result.error === "pairing-locked" ? 429 : 403 });
    return withAccessCookie(request, { paired: true }, result.access);
  });
}
