import { z } from "zod";
import { manifestSchema, manifests, previewSchema, previews } from "./index";
import { remoteThumbnailPath } from "./thumbnail";

export const safePath = (value: string) =>
  value.length > 0 &&
  value
    .split("/")
    .every((part) => /^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/.test(part) && part !== "." && part !== "..");
export const remoteManifestSchema = z
  .union([manifestSchema, previewSchema])
  .refine((g) => g.source === "remote", "Remote source required");
export type RemoteManifest = z.infer<typeof remoteManifestSchema>;
export const remoteRecordSchema = z
  .object({
    id: z.string(),
    version: z.string(),
    enabled: z.boolean(),
    driver: z.enum(["fs", "r2"]),
    key: z.string(),
    sha256: z.record(z.string().refine(safePath), z.string().regex(/^[a-f0-9]{64}$/)),
    manifest: remoteManifestSchema,
  })
  .strict()
  .superRefine((r, ctx) => {
    if (
      r.id !== r.manifest.id ||
      r.version !== r.manifest.version ||
      r.key !== `games/${r.id}/${r.version}` ||
      !r.sha256["index.html"] ||
      !r.sha256[remoteThumbnailPath(r.id, r.version, r.manifest.thumbnail) ?? ""]
    )
      ctx.addIssue({ code: "custom", message: "Inconsistent remote version" });
  });
export const remoteCatalogSchema = z.array(remoteRecordSchema).superRefine((rows, ctx) => {
  const versions = new Set<string>();
  const enabled = new Set<string>();
  const scoring = new Map<string, string>();
  for (const r of rows) {
    if (
      versions.has(r.key) ||
      (r.enabled && enabled.has(r.id)) ||
      [...manifests, ...previews].some((g) => g.id === r.id)
    )
      ctx.addIssue({ code: "custom", message: "Duplicate or reserved game id/version" });
    if (r.manifest.scored) {
      const g = r.manifest;
      const signature = JSON.stringify([
        g.skills,
        Object.entries(g.weights).sort(),
        g.minAge,
        g.levels,
        g.roundsPerSession,
      ]);
      if (scoring.has(r.id) && scoring.get(r.id) !== signature)
        ctx.addIssue({
          code: "custom",
          message: "Scoring metadata is immutable per game id; use a new id for new rules",
        });
      scoring.set(r.id, signature);
    }
    versions.add(r.key);
    if (r.enabled) enabled.add(r.id);
  }
});
export type RemoteRecord = z.infer<typeof remoteRecordSchema>;
export function remoteFileUrl(id: string, version: string, file: string) {
  if (!/^[a-z0-9-]+$/.test(id) || !/^\d+\.\d+\.\d+$/.test(version) || !safePath(file))
    throw new Error("Invalid game path");
  return `/g/${id}/${version}/${file}`;
}
export const gameSandbox = (source?: string) =>
  source === "remote" ? "allow-scripts" : "allow-scripts allow-same-origin";
