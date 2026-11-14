import { AccountError, loginParent } from "@brainee/db";
import { type NextRequest, NextResponse } from "next/server";
import { withAccessCookie } from "@/lib/server/access-cookie";
import { demoApi, readDemoJson } from "@/lib/server/demo-api";

export const runtime = "nodejs";

/** D-24: parent email + password → this device opens the family's child, parent pages unlocked. */
export async function POST(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    try {
      const access = await loginParent(db, await readDemoJson(request), now);
      return withAccessCookie(request, { child: access.child }, access);
    } catch (error) {
      if (error instanceof AccountError)
        return NextResponse.json(
          { error: error.reason },
          { status: error.reason === "wrong-credentials" ? 401 : 400 },
        );
      throw error;
    }
  });
}
