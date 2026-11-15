import { lstat, readdir, readFile } from "node:fs/promises";
import { posix, relative, resolve } from "node:path";
import { unzipSync } from "fflate";
import {
  remoteCatalogSchema,
  remoteManifestSchema,
  safePath,
} from "../packages/game-catalog/src/remote";
import {
  readRemoteCatalog,
  type StorageDriver,
  sha256,
} from "../packages/game-catalog/src/storage";
import { remoteThumbnailPath } from "../packages/game-catalog/src/thumbnail";

export async function loadBuild(input: string): Promise<Record<string, Uint8Array>> {
  const files: Record<string, Uint8Array> = Object.create(null);
  if (input.endsWith(".zip")) {
    const archive = await readFile(input);
    if (archive.length > 32 * 1024 * 1024) throw new Error("Archive exceeds 32 MiB");
    let size = 0;
    const unpacked = unzipSync(archive, {
      filter(file) {
        if (!safePath(file.name.replace(/\/$/, ""))) throw new Error("Unsafe archive path");
        size += file.originalSize;
        if (size > 64 * 1024 * 1024) throw new Error("Expanded archive exceeds 64 MiB");
        return !file.name.endsWith("/");
      },
    });
    Object.assign(files, unpacked);
  } else {
    let size = 0;
    async function walk(dir: string) {
      for (const name of await readdir(dir)) {
        const file = resolve(dir, name);
        const stat = await lstat(file);
        if (stat.isSymbolicLink()) throw new Error("Symlinks are forbidden");
        if (stat.isDirectory()) await walk(file);
        else {
          if (!stat.isFile()) throw new Error("Only regular files are allowed");
          size += stat.size;
          if (size > 64 * 1024 * 1024) throw new Error("Build exceeds 64 MiB");
          files[relative(resolve(input), file).split("\\").join("/")] = await readFile(file);
        }
      }
    }
    await walk(resolve(input));
  }
  return files;
}
export function validateBuild(files: Record<string, Uint8Array>, version?: string) {
  if (!files["manifest.json"] || !files["index.html"])
    throw new Error("Build needs manifest.json and index.html");
  const raw = JSON.parse(Buffer.from(files["manifest.json"]).toString());
  remoteManifestSchema.parse(raw);
  if (version) {
    const thumbnail = remoteThumbnailPath(raw.id, raw.version, raw.thumbnail);
    raw.version = version;
    raw.entry = `/g/${raw.id}/${version}/index.html`;
    raw.thumbnail = `/g/${raw.id}/${version}/${thumbnail}`;
  }
  const manifest = remoteManifestSchema.parse(raw);
  const total = Object.values(files).reduce((n, b) => n + b.length, 0);
  if (total > manifest.sizeBudgetBytes || total > 64 * 1024 * 1024)
    throw new Error("Build exceeds size budget");
  // Port of check-manifests asset/thumbnail checks, applied before any storage write.
  const thumbnailPath = remoteThumbnailPath(manifest.id, manifest.version, manifest.thumbnail);
  const thumbnail = thumbnailPath && files[thumbnailPath];
  if (!thumbnail || !thumbnailPath) throw new Error("Missing thumbnail asset");
  const bytes = Buffer.from(thumbnail);
  if (thumbnailPath.endsWith(".svg")) {
    const svg = bytes.toString();
    const view = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    if (
      bytes.length > 8192 ||
      !view ||
      Number(view[1]) * 3 !== Number(view[2]) * 4 ||
      /<(text|script|image|foreignObject|style)\b|href=|url\(|@import|font-family/i.test(svg)
    )
      throw new Error("Invalid self-contained 4:3 thumbnail");
  } else {
    const valid = thumbnailPath.endsWith(".png")
      ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    if (!valid || bytes.length > 256 * 1024)
      throw new Error("Invalid raster thumbnail (PNG/WebP, at most 256 KiB)");
  }
  for (const [file, data] of Object.entries(files)) {
    if (!safePath(file)) throw new Error("Unsafe file path");
    if (!/\.(html|css|svg)$/.test(file)) continue;
    const text = Buffer.from(data).toString();
    for (const match of text.matchAll(
      /(?:\b(?:src|href)\s*=\s*["']?|url\(["']?|@import\s*["'])([^"')>\s]+)/g,
    )) {
      const ref = match[1] ?? "";
      if (ref.startsWith("#")) continue;
      if (/^(?:[a-z]+:|\/|\\)/i.test(ref)) throw new Error(`Non-relative asset in ${file}`);
      const target = posix.normalize(posix.join(posix.dirname(file), ref.split(/[?#]/)[0] ?? ""));
      if (!safePath(target) || !files[target])
        throw new Error(`Missing or unsafe asset: ${target}`);
    }
  }
  files["manifest.json"] = Buffer.from(JSON.stringify(manifest));
  return manifest;
}
export async function publish(
  input: string,
  options: {
    version?: string;
    disable?: boolean;
    enable?: boolean;
    rollback?: string;
    dryRun?: boolean;
  },
  driver: StorageDriver,
) {
  const catalog = await readRemoteCatalog(driver);
  const keys: string[] = [];
  let id = input;
  if (options.disable || options.enable || options.rollback) {
    const versions = catalog.filter((r) => r.id === input);
    const chosen = options.rollback
      ? versions.find((r) => r.version === options.rollback)
      : (versions.find((r) => r.enabled) ?? versions.at(-1));
    if (!chosen) throw new Error("Unknown game/version");
    for (const row of versions) row.enabled = !options.disable && row === chosen;
  } else {
    const files = await loadBuild(input);
    const manifest = validateBuild(files, options.version);
    id = manifest.id;
    const key = `games/${manifest.id}/${manifest.version}`;
    const hashes = Object.fromEntries(
      Object.entries(files)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([p, b]) => [p, sha256(b)]),
    );
    const existing = catalog.find((r) => r.key === key);
    if (existing && JSON.stringify(existing.sha256) !== JSON.stringify(hashes))
      throw new Error("Version is immutable; publish a new version");
    if (!existing) {
      for (const r of catalog.filter((r) => r.id === manifest.id)) r.enabled = false;
      catalog.push({
        id: manifest.id,
        version: manifest.version,
        enabled: true,
        driver: driver.id,
        key,
        sha256: hashes,
        manifest,
      });
    }
    remoteCatalogSchema.parse(catalog);
    for (const [path, bytes] of Object.entries(files)) {
      const stored = await driver.get(`${key}/${path}`);
      if (stored && sha256(stored) !== sha256(bytes)) throw new Error("Immutable object conflict");
      if (!stored) {
        keys.push(`${key}/${path}`);
        if (!options.dryRun) await driver.put(`${key}/${path}`, bytes);
      }
    }
  }
  const validated = remoteCatalogSchema.parse(catalog);
  keys.push("catalog.json");
  if (!options.dryRun)
    await driver.put("catalog.json", Buffer.from(JSON.stringify(validated, null, 2)));
  return { id, keys, rows: validated.filter((row) => row.id === id) };
}
