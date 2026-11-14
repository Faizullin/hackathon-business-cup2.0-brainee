import { advanceCalendar, syncCatalog } from "@brainee/core";
import { and, eq, sql } from "drizzle-orm";
import { demoSessions, families, showcases } from "../schema";
import type { Database } from "./client";
import { demoShowcase } from "./showcase-seed";

/** Called inside the same transaction as the read/action, before consuming daily state. */
export async function refreshCalendar(
  tx: Pick<Database, "select" | "update">,
  access: { childId: string; familyId: string },
  now: Date,
) {
  const row = await tx.select().from(showcases).where(eq(showcases.childId, access.childId)).get();
  if (!row) throw new Error("Missing child showcase");
  const result = advanceCalendar(row.data, now);
  // Content shipped after this family was created (e.g. films) reaches it on the next read.
  const synced = syncCatalog(result.showcase, demoShowcase);
  if (synced.changed) {
    result.showcase = synced.showcase;
    result.changed = true;
  }
  if (!row.data.calendar && result.showcase.calendar) {
    const paid = await tx
      .select({ tokenHash: demoSessions.tokenHash })
      .from(demoSessions)
      .where(and(eq(demoSessions.childId, access.childId), eq(demoSessions.bonusGiven, true)))
      .get();
    result.showcase.calendar.bonusGiven = !!paid;
  }
  if (result.changed) {
    await tx
      .update(showcases)
      .set({ data: result.showcase })
      .where(eq(showcases.childId, access.childId));
    if (result.dayChanged) {
      await tx
        .update(demoSessions)
        .set({ inRow: 0, bonusGiven: false })
        .where(eq(demoSessions.childId, access.childId));
    }
    // Initialising legacy/seed metadata has no visible effect. Rollover and new content must invalidate polling.
    if (row.data.calendar || synced.changed) {
      await tx
        .update(families)
        .set({ version: sql`${families.version} + 1` })
        .where(eq(families.id, access.familyId));
    }
  }
  return result;
}
