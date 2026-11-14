import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// T-13's minimal persistence slice. The remaining entities belong to T-50.
export const families = sqliteTable("families", {
  id: text("id").notNull().primaryKey(),
  plan: text("plan").notNull().default("demo"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const children = sqliteTable("children", {
  id: text("id").notNull().primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  birthYear: integer("birth_year").notNull(),
});

export const wallets = sqliteTable(
  "wallets",
  {
    childId: text("child_id")
      .notNull()
      .primaryKey()
      .references(() => children.id, { onDelete: "cascade" }),
    stars: integer("stars").notNull().default(0),
    suns: integer("suns").notNull().default(0),
  },
  (table) => [
    check("wallet_stars_valid", sql`${table.stars} >= 0 AND typeof(${table.stars}) = 'integer'`),
    check("wallet_suns_valid", sql`${table.suns} >= 0 AND typeof(${table.suns}) = 'integer'`),
  ],
);
