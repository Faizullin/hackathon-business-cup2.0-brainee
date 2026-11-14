import { finishGameSession } from "@brainee/db";
import { type NextRequest, NextResponse } from "next/server";
import { ApiError, demoApi, readDemoJson, requireDemoToken } from "@/lib/server/demo-api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    const tokenHash = requireDemoToken(request);
    const input = await readDemoJson(request);
    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      Object.keys(input).length !== 2 ||
      !("sessionId" in input) ||
      !("result" in input) ||
      typeof input.sessionId !== "string" ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
        input.sessionId,
      )
    )
      throw new ApiError(400, "invalid-input");
    return NextResponse.json(
      await finishGameSession(db, tokenHash, input.sessionId, input.result, now),
    );
  });
}
