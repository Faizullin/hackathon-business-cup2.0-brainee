import { z } from "zod";
import { discoveredManifests } from "./discovered.generated";
import { remoteThumbnailPath } from "./thumbnail";

/** Every game card image is served from our own origin at this path (copied by games:build). */
export const thumbnailUrl = (id: string) => `/games/${id}/thumbnail.svg`;
/** Thumbnails stay small enough to list many cards on a phone. */
export const THUMBNAIL_MAX_BYTES = 8 * 1024;

const skill = z.enum(["attention", "logic", "memory", "speech", "reading", "motor"]);
export const manifestSchema = z
  .object({
    source: z.enum(["builtin", "remote"]).default("builtin"),
    scored: z.literal(true).default(true),
    id: z.string().regex(/^[a-z0-9-]+$/),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    kind: z.literal("dev"),
    title: z.string().min(1),
    engine: z.string().min(1),
    runtime: z.enum(["react", "embedded"]),
    entry: z.string().min(1),
    skills: z.object({ main: skill, secondary: skill.optional() }),
    weights: z
      .partialRecord(skill, z.number().positive().max(1))
      .refine((weights) => Math.abs(Object.values(weights).reduce((a, b) => a + b, 0) - 1) < 1e-9),
    minAge: z.number().int().min(4).max(10),
    levels: z.number().int().positive(),
    roundsPerSession: z.number().int().positive(),
    bridge: z.object({ protocol: z.union([z.literal(1), z.literal(2)]), contract: z.string() }),
    sizeBudgetBytes: z.number().int().positive(),
    license: z.string().min(1),
    /** Same-origin card image; the game folder ships `thumbnail.svg` (see thumbnailUrl). */
    thumbnail: z.string(),
  })
  .superRefine((game, ctx) => {
    if (
      game.source === "remote"
        ? !remoteThumbnailPath(game.id, game.version, game.thumbnail)
        : game.thumbnail !== thumbnailUrl(game.id)
    )
      ctx.addIssue({ code: "custom", message: "Thumbnail must belong to this game version" });
    if (game.bridge.contract !== `${game.id}@1`)
      ctx.addIssue({ code: "custom", message: "Contract must match game id" });
    if (
      !game.weights[game.skills.main] ||
      (game.skills.secondary && !game.weights[game.skills.secondary])
    )
      ctx.addIssue({ code: "custom", message: "Skills need weights" });
    if (game.source === "remote" && game.runtime !== "embedded")
      ctx.addIssue({ code: "custom", message: "Remote games must be embedded" });
    if (game.runtime === "react" && !/^[A-Za-z][A-Za-z0-9]*\.tsx$/.test(game.entry))
      ctx.addIssue({ code: "custom", message: "React entry must be a local component" });
    if (
      game.runtime === "embedded" &&
      game.entry !==
        (game.source === "remote"
          ? `/g/${game.id}/${game.version}/index.html`
          : `/games/${game.id}/index.html`)
    )
      ctx.addIssue({ code: "custom", message: "Embedded entry must be same-origin" });
  });
/** Discovered from each game folder by scripts/discover-games.mjs, then validated here. */
export const manifests = discoveredManifests.map((value) => manifestSchema.parse(value));

export { type Preview, previewSchema, previews } from "./previews";
