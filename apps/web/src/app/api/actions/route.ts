import { applyShowcase, ShowcaseError } from "@brainee/db";
import { type NextRequest, NextResponse } from "next/server";
import { demoApi, readDemoJson, requireDemoToken } from "@/lib/server/demo-api";

export const runtime = "nodejs";

/** Demo interactions (shop, gifts, tasks, video quiz); rules live in @brainee/core (D-21). */
export async function POST(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    const tokenHash = requireDemoToken(request);
    const body = await readDemoJson(request);
    try {
      return NextResponse.json(await applyShowcase(db, tokenHash, body, now));
    } catch (error) {
      if (error instanceof ShowcaseError)
        return NextResponse.json({ error: error.reason }, { status: 409 });
      throw error;
    }
  });
}
