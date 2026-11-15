import { getSettings, resetShowcase } from "@brainee/db";
import { type NextRequest, NextResponse } from "next/server";
import { demoApi, requireDemoToken } from "@/lib/server/demo-api";

export const runtime = "nodejs";

/** DEMO_MODE only: restore seeded tasks, gifts and leisure before a presentation or test. */
export async function POST(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    await getSettings(db, requireDemoToken(request), now);
    await resetShowcase(db, requireDemoToken(request), now);
    return NextResponse.json({ reset: true });
  });
}
