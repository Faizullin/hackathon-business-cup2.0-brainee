import { z } from "zod";
import { discoveredPreviews } from "./discovered.generated";

const thumbnailUrl = (id: string) => `/games/${id}/thumbnail.svg`;

/**
 * Declarative Explore metadata, read by ExplorePlayer instead of per-game wrapper code.
 * - `family`: upstream source family, which selects the shared build adapter.
 * - `viewport`: "responsive" fills the stage; "contain" keeps `aspectRatio` and letterboxes.
 * - `orientation`: preferred orientation; the host shows a rotate hint when it differs.
 * - `audio`: the game plays sound (autoplay stays off; sound starts from a tap in the game).
 * - `readiness`: "bridge" waits for the bridge `ready` lifecycle; "load" trusts the iframe load.
 */
export const exploreMetaSchema = z
  .object({
    family: z.enum(["phaser", "qlobe", "sugarizer", "h5p", "blockly"]),
    viewport: z.enum(["responsive", "contain"]),
    aspectRatio: z
      .string()
      .regex(/^\d+ \/ \d+$/)
      .optional(),
    orientation: z.enum(["any", "landscape", "portrait"]),
    audio: z.boolean(),
    readiness: z.enum(["bridge", "load"]),
  })
  .strict()
  .refine((meta) => (meta.viewport === "contain") === Boolean(meta.aspectRatio), {
    message: "A contained viewport needs aspectRatio, and only then",
  });

export const previewSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    mode: z.literal("explore"),
    entry: z.string(),
    minAge: z.number().int().min(4).max(10),
    license: z.string().min(1),
    sizeBudgetBytes: z.number().int().positive(),
    thumbnail: z.string(),
    explore: exploreMetaSchema,
  })
  .strict()
  .refine((p) => p.entry === `/games/${p.id}/index.html`, "Preview must load from own origin")
  .refine((p) => p.thumbnail === thumbnailUrl(p.id), "Thumbnail must be the game's own svg");

export type Preview = z.infer<typeof previewSchema>;

/** Discovered from each `games/<id>/preview.json` by scripts/discover-games.mjs. */
export const previews = discoveredPreviews.map((p) => previewSchema.parse(p));
