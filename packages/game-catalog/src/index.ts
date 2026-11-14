import { z } from "zod";
import puzzle from "../../../games/picture-puzzle/manifest.json" with { type: "json" };
import pattern from "../../games/src/continue-pattern/manifest.json" with { type: "json" };
import odd from "../../games/src/odd-one-out/manifest.json" with { type: "json" };

const skill = z.enum(["attention", "logic", "memory", "speech", "reading", "motor"]);
export const manifestSchema = z
  .object({
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
  })
  .superRefine((game, ctx) => {
    if (game.bridge.contract !== `${game.id}@1`)
      ctx.addIssue({ code: "custom", message: "Contract must match game id" });
    if (
      !game.weights[game.skills.main] ||
      (game.skills.secondary && !game.weights[game.skills.secondary])
    )
      ctx.addIssue({ code: "custom", message: "Skills need weights" });
    if (game.runtime === "react" && !/^[A-Za-z][A-Za-z0-9]*\.tsx$/.test(game.entry))
      ctx.addIssue({ code: "custom", message: "React entry must be a local component" });
    if (game.runtime === "embedded" && game.entry !== `/games/${game.id}/index.html`)
      ctx.addIssue({ code: "custom", message: "Embedded entry must be same-origin" });
  });
export const manifests = [odd, pattern, puzzle].map((value) => manifestSchema.parse(value));
