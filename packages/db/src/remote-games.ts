import type { RemoteRecord } from "@brainee/game-catalog/remote";
import { eq } from "drizzle-orm";
import { games } from "../schema";
import type { Database } from "./client";
/** No remote publishing process needs database credentials. Called before session start. */
export async function syncRemoteGames(db: Database, rows: RemoteRecord[]) {
  await db.transaction(async (tx) => {
    for (const id of new Set(rows.map((r) => r.id))) {
      const game = rows.find((r) => r.id === id && r.enabled)?.manifest;
      if (!game?.scored) {
        await tx.update(games).set({ enabled: false }).where(eq(games.id, id));
        continue;
      }
      const values = {
        id,
        title: game.title,
        kind: game.kind,
        mainSkill: game.skills.main,
        secondarySkill: game.skills.secondary ?? null,
        weights: game.weights,
        minAge: game.minAge,
        levels: game.levels,
        roundsPerSession: game.roundsPerSession,
        enabled: true,
        runtime: "embedded" as const,
        runtimeUrl: game.entry,
      };
      await tx.insert(games).values(values).onConflictDoUpdate({ target: games.id, set: values });
    }
  });
}
