import { createDemoAccess, demoTokenHash, findDemoAccess } from "@brainee/db";
import { type NextRequest, NextResponse } from "next/server";
import { ApiError, DEMO_COOKIE, demoApi, requireDemoToken } from "@/lib/server/demo-api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    const tokenHash = demoTokenHash(request.cookies.get(DEMO_COOKIE)?.value);
    const existing = tokenHash ? await findDemoAccess(db, tokenHash, now) : undefined;
    if (existing)
      return NextResponse.json({
        child: { id: existing.childId, name: existing.childName },
        expiresAt: existing.expiresAt,
      });
    const session = await createDemoAccess(db, now);
    const response = NextResponse.json(
      { child: { id: session.child.id, name: session.child.name }, expiresAt: session.expiresAt },
      { status: 201 },
    );
    response.cookies.set(DEMO_COOKIE, session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      expires: session.expiresAt,
    });
    return response;
  });
}

export async function GET(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    const access = await findDemoAccess(db, requireDemoToken(request), now);
    if (!access) throw new ApiError(401, "unauthorized");
    return NextResponse.json({
      child: { id: access.childId, name: access.childName },
      expiresAt: access.expiresAt,
    });
  });
}
