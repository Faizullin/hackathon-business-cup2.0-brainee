import type {
  BrainyStats,
  LearningCompletion,
  Showcase,
  Skill,
  SkillScores,
  SkillWeights,
} from "@brainee/core";
import { sql } from "drizzle-orm";
import { check, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// T-50's connected-demo subset. Other product entities remain on the backlog.
export const families = sqliteTable(
  "families",
  {
    id: text("id").notNull().primaryKey(),
    plan: text("plan").notNull().default("demo"),
    version: integer("version").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    check(
      "family_version_valid",
      sql`${table.version} BETWEEN 0 AND 9007199254740991 AND typeof(${table.version}) = 'integer'`,
    ),
  ],
);

export const parents = sqliteTable("parents", {
  id: text("id").notNull().primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  pinHash: text("pin_hash").notNull(),
  // D-24: own minimal login (scrypt), no auth provider. Null for PIN-only demo parents.
  passwordHash: text("password_hash"),
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

export const brainyStates = sqliteTable(
  "brainy_states",
  {
    childId: text("child_id")
      .notNull()
      .primaryKey()
      .references(() => children.id, { onDelete: "cascade" }),
    brain: real("brain").notNull(),
    eyes: real("eyes").notNull(),
    mouth: real("mouth").notNull(),
    arms: real("arms").notNull(),
    legs: real("legs").notNull(),
    resp: real("resp").notNull(),
    mood: real("mood").notNull(),
    // D-23: six ability scores; learning games move them by their weights, then roll up to the body.
    skills: text("skills", { mode: "json" }).$type<SkillScores>().notNull(),
    startSnapshot: text("start_snapshot", { mode: "json" }).$type<BrainyStats>().notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    ...[table.brain, table.eyes, table.mouth, table.arms, table.legs, table.resp, table.mood].map(
      (column) => check(`brainy_${column.name}_valid`, sql`${column} BETWEEN 0 AND 100`),
    ),
    check("brainy_snapshot_valid", sql`json_valid(${table.startSnapshot})`),
  ],
);

export const games = sqliteTable(
  "games",
  {
    id: text("id").notNull().primaryKey(),
    title: text("title").notNull(),
    kind: text("kind", { enum: ["dev", "fun"] }).notNull(),
    mainSkill: text("main_skill").$type<Skill>().notNull(),
    secondarySkill: text("secondary_skill").$type<Skill>(),
    levels: integer("levels").notNull(),
    runtime: text("runtime", { enum: ["react", "embedded"] })
      .notNull()
      .default("react"),
    runtimeUrl: text("runtime_url"),
    roundsPerSession: integer("rounds_per_session").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    // D-23 per-game skill weights (sum 1); D-22 recommended minimum age (catalog spans 4–10).
    weights: text("weights", { mode: "json" }).$type<SkillWeights>().notNull(),
    minAge: integer("min_age").notNull().default(4),
  },
  (table) => [
    check("game_kind_valid", sql`${table.kind} IN ('dev', 'fun')`),
    check("game_levels_valid", sql`${table.levels} > 0 AND typeof(${table.levels}) = 'integer'`),
    check(
      "game_rounds_valid",
      sql`${table.roundsPerSession} > 0 AND typeof(${table.roundsPerSession}) = 'integer'`,
    ),
    check("game_enabled_valid", sql`${table.enabled} IN (0, 1)`),
  ],
);

// Opaque cookie tokens are hashed before storage. No process-local session state.
export const demoSessions = sqliteTable(
  "demo_sessions",
  {
    tokenHash: text("token_hash").notNull().primaryKey(),
    childId: text("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    inRow: integer("in_row").notNull().default(0),
    bonusGiven: integer("bonus_given", { mode: "boolean" }).notNull().default(false),
    // Parent PIN unlock for this device (T-40 demo barrier).
    parentUntil: integer("parent_until", { mode: "timestamp_ms" }),
  },
  (table) => [
    check("demo_session_expiry_valid", sql`${table.expiresAt} > ${table.createdAt}`),
    check(
      "demo_session_streak_valid",
      sql`${table.inRow} >= 0 AND typeof(${table.inRow}) = 'integer' AND ${table.bonusGiven} IN (0, 1)`,
    ),
  ],
);

export const gameSessions = sqliteTable(
  "game_sessions",
  {
    id: text("id").notNull().primaryKey(),
    childId: text("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    demoSessionHash: text("demo_session_hash").references(() => demoSessions.tokenHash, {
      onDelete: "set null",
    }),
    gameId: text("game_id")
      .notNull()
      .references(() => games.id),
    level: integer("level").notNull(),
    seed: integer("seed").notNull(),
    status: text("status", { enum: ["pending", "completed", "abandoned"] })
      .notNull()
      .default("pending"),
    rounds: integer("rounds"),
    mistakes: integer("mistakes"),
    corrections: integer("corrections"),
    durationMs: integer("duration_ms"),
    starsEarned: integer("stars_earned"),
    // Canonical validated payload: detect conflicting retries; retain the original receipt.
    resultKey: text("result_key"),
    completion: text("completion", { mode: "json" }).$type<LearningCompletion>(),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    check("session_status_valid", sql`${table.status} IN ('pending', 'completed', 'abandoned')`),
    check("session_level_valid", sql`${table.level} > 0 AND typeof(${table.level}) = 'integer'`),
    check(
      "session_times_valid",
      sql`(${table.status} = 'pending' AND ${table.finishedAt} IS NULL) OR (${table.status} <> 'pending' AND ${table.finishedAt} >= ${table.startedAt} AND ${table.finishedAt} IS NOT NULL)`,
    ),
    check(
      "session_result_valid",
      sql`(
    ${table.status} = 'completed' AND ${table.rounds} > 0 AND ${table.rounds} IS NOT NULL
    AND ${table.mistakes} >= 0 AND ${table.mistakes} IS NOT NULL
    AND ${table.corrections} BETWEEN 0 AND ${table.rounds} AND ${table.corrections} IS NOT NULL
    AND ${table.durationMs} >= 0 AND ${table.durationMs} IS NOT NULL
    AND ${table.starsEarned} >= 0 AND ${table.starsEarned} IS NOT NULL
    AND ${table.resultKey} IS NOT NULL AND ${table.completion} IS NOT NULL AND json_valid(${table.completion})
  ) OR (
    ${table.status} <> 'completed' AND ${table.rounds} IS NULL AND ${table.mistakes} IS NULL
    AND ${table.corrections} IS NULL AND ${table.durationMs} IS NULL AND ${table.starsEarned} IS NULL
    AND ${table.resultKey} IS NULL AND ${table.completion} IS NULL
  )`,
    ),
  ],
);

// D-21: seeded presentation data (analytics, tasks, gifts, leisure) and its demo interactions.
export const showcases = sqliteTable(
  "showcases",
  {
    childId: text("child_id")
      .notNull()
      .primaryKey()
      .references(() => children.id, { onDelete: "cascade" }),
    data: text("data", { mode: "json" }).$type<Showcase>().notNull(),
  },
  (table) => [check("showcase_data_valid", sql`json_valid(${table.data})`)],
);
