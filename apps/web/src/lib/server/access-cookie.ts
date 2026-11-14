import "server-only";

import { type NextRequest, NextResponse } from "next/server";
import { DEMO_COOKIE } from "./demo-api";

/** The same opaque httpOnly device cookie the demo session uses (D-24). */
export function withAccessCookie(
  request: NextRequest,
  body: unknown,
  access: { token: string; expiresAt: Date },
  status = 200,
) {
  const response = NextResponse.json(body, { status });
  response.cookies.set(DEMO_COOKIE, access.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    expires: access.expiresAt,
  });
  return response;
}
