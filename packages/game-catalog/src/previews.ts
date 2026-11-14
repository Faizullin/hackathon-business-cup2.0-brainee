import { z } from "zod";
import magnet from "../../../games/magnet-explorer/preview.json" with { type: "json" };
import neighborhood from "../../../games/neighborhood-map-walk/preview.json" with { type: "json" };
export const previewSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    mode: z.literal("explore"),
    entry: z.string(),
    minAge: z.number().int().min(4).max(10),
    license: z.string().min(1),
    sizeBudgetBytes: z.number().int().positive(),
  })
  .strict()
  .refine((p) => p.entry === `/games/${p.id}/index.html`, "Preview must load from own origin");
export const previews = [magnet, neighborhood].map((p) => previewSchema.parse(p));
