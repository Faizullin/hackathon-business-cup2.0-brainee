import { setParentUnlock } from "@brainee/db";
import { type NextRequest, NextResponse } from "next/server";
import { ApiError, demoApi, readDemoJson, requireDemoToken } from "@/lib/server/demo-api";

export const runtime = "nodejs";

/** T-40 demo barrier: POST {pin} unlocks parent mode on this device; DELETE locks it. */
export async function POST(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    const tokenHash = requireDemoToken(request);
    const body = (await readDemoJson(request)) as { pin?: unknown } | null;
    if (typeof body?.pin !== "string") throw new ApiError(400, "invalid-input");
    const ok = await setParentUnlock(db, tokenHash, body.pin, now);
    return ok
      ? NextResponse.json({ unlocked: true })
      : NextResponse.json({ error: "wrong-pin" }, { status: 403 });
  });
}

export async function DELETE(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    await setParentUnlock(db, requireDemoToken(request), null, now);
    return NextResponse.json({ unlocked: false });
  });
}
