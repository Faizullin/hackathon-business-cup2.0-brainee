import type { StateReply } from "@brainee/core";
import { getStateSnapshot } from "@brainee/db";
import { type NextRequest, NextResponse } from "next/server";
import { ApiError, demoApi, requireDemoToken } from "@/lib/server/demo-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    const tokenHash = requireDemoToken(request);
    const raw = request.nextUrl.searchParams.get("since");
    const since = raw === null ? undefined : Number(raw);
    if (
      raw !== null &&
      (!/^\d+$/.test(raw) || !Number.isSafeInteger(since) || (since as number) < 0)
    )
      throw new ApiError(400, "invalid-input");
    const snapshot = await getStateSnapshot(db, tokenHash, now);
    const reply: StateReply =
      since === snapshot.version
        ? { changed: false, version: snapshot.version }
        : { changed: true, snapshot };
    return NextResponse.json(reply);
  });
}
