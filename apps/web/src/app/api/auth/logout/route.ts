import { logoutDevice } from "@brainee/db";
import { type NextRequest, NextResponse } from "next/server";
import { DEMO_COOKIE, demoApi, requireDemoToken } from "@/lib/server/demo-api";
export async function POST(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    await logoutDevice(db, requireDemoToken(request), now);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(DEMO_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  });
}
