import { createJuryFamily } from "@brainee/db";
import type { NextRequest } from "next/server";
import { withAccessCookie } from "@/lib/server/access-cookie";
import { demoApi } from "@/lib/server/demo-api";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    const created = await createJuryFamily(db, now);
    return withAccessCookie(request, { credentials: created.credentials }, created, 201);
  });
}
