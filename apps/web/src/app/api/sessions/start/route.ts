import { startGameSession, syncRemoteGames } from "@brainee/db";
import { manifests } from "@brainee/game-catalog";
import { type NextRequest, NextResponse } from "next/server";
import { demoApi, readDemoJson, requireDemoToken } from "@/lib/server/demo-api";
import { remoteCatalog } from "@/lib/server/remote-games";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return demoApi(request, async (db, now) => {
    const tokenHash = requireDemoToken(request);
    const input = await readDemoJson(request);
    const id = input && typeof input === "object" && "gameId" in input ? input.gameId : undefined;
    if (!manifests.some((g) => g.id === id)) await syncRemoteGames(db, await remoteCatalog());
    return NextResponse.json(await startGameSession(db, tokenHash, input, now), { status: 201 });
  });
}
