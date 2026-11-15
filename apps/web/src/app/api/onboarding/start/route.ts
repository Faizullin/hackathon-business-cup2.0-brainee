import { parseStartRequest } from "@brainee/core";
import { createFunnelFamily } from "@brainee/db";
import { type NextRequest, NextResponse } from "next/server";
import { withAccessCookie } from "@/lib/server/access-cookie";
import { demoApi, readDemoJson } from "@/lib/server/demo-api";

export const runtime = "nodejs";

/**
 * D-41: the funnel's "Start plan" button. No form, no payment: it validates the quiz in core,
 * creates the family with generated credentials and opens the device like a normal signup.
 */
export async function POST(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    const start = parseStartRequest(await readDemoJson(request));
    if (!start) return NextResponse.json({ error: "invalid-input" }, { status: 400 });
    const created = await createFunnelFamily(db, start, now);
    return withAccessCookie(
      request,
      { credentials: created.credentials, child: created.child },
      created,
      201,
    );
  });
}
