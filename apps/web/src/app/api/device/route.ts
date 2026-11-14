import { demoTokenHash, findDemoAccess } from "@brainee/db";
import { type NextRequest, NextResponse } from "next/server";
import { DEMO_COOKIE, demoApi } from "@/lib/server/demo-api";
export async function GET(request: NextRequest) {
  const token = demoTokenHash(request.cookies.get(DEMO_COOKIE)?.value);
  if (!token || process.env.DEMO_MODE !== "1") return NextResponse.json({ paired: false });
  return demoApi(request, async (db, now) => {
    const access = await findDemoAccess(db, token, now);
    return NextResponse.json({ paired: !!access && !access.revoked });
  });
}
