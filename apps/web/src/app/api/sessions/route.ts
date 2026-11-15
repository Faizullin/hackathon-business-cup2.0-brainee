import { finishGameSession, syncRemoteGames } from "@brainee/db";
import { manifests } from "@brainee/game-catalog";
import { type NextRequest, NextResponse } from "next/server";
import { ApiError, demoApi, readDemoJson, requireDemoToken } from "@/lib/server/demo-api";
import { remoteCatalog } from "@/lib/server/remote-games";

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
    const result = input.result;
    const id =
      result && typeof result === "object" && "gameId" in result ? result.gameId : undefined;
    if (!manifests.some((g) => g.id === id)) await syncRemoteGames(db, await remoteCatalog());
    return NextResponse.json(
      await finishGameSession(db, tokenHash, input.sessionId, input.result, now),
    );
  });
}
