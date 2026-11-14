import { updateFunPlay } from "@brainee/db";
import { type NextRequest, NextResponse } from "next/server";
import { demoApi, readDemoJson, requireDemoToken } from "@/lib/server/demo-api";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  return demoApi(request, async (db, now) =>
    NextResponse.json(
      await updateFunPlay(db, requireDemoToken(request), await readDemoJson(request), now),
    ),
  );
}
