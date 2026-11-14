import { children, families, wallets } from "../schema";
import type { Database } from "./client";

export const demo = {
  family: { id: "demo-family", plan: "demo", createdAt: new Date("2026-11-14T00:00:00Z") },
  child: { id: "demo-child", familyId: "demo-family", name: "Саша", birthYear: 2020 },
  wallet: { childId: "demo-child", stars: 340, suns: 6 },
} as const;

// Fixture data only. Economy and stat calculations stay in packages/core.
export async function seedDemo(db: Database) {
  await db.transaction(async (transaction) => {
    await transaction.insert(families).values(demo.family).onConflictDoNothing();
    await transaction.insert(children).values(demo.child).onConflictDoNothing();
    await transaction.insert(wallets).values(demo.wallet).onConflictDoNothing();
  });
}
