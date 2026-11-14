import { stopGameRun } from "@brainee/db";
import { type NextRequest, NextResponse } from "next/server";
import { demoApi, requireDemoToken } from "@/lib/server/demo-api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    await stopGameRun(db, requireDemoToken(request), now);
    return NextResponse.json({ stopped: true });
  });
}
