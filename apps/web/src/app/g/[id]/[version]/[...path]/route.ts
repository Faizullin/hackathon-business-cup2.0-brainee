import { remoteFileUrl } from "@brainee/game-catalog/remote";
import { sha256, storageDriver } from "@brainee/game-catalog/storage";
import { remoteCatalog } from "@/lib/server/remote-games";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const types: Record<string, string> = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  mp4: "video/mp4",
  webm: "video/webm",
  woff: "font/woff",
  woff2: "font/woff2",
  wasm: "application/wasm",
};
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; version: string; path: string[] }> },
) {
  const { id, version, path } = await params;
  const file = path.join("/");
  try {
    remoteFileUrl(id, version, file);
  } catch {
    return new Response(null, { status: 404 });
  }
  try {
    const row = (await remoteCatalog()).find((r) => r.id === id && r.version === version);
    if (!row || !Object.hasOwn(row.sha256, file)) return new Response(null, { status: 404 });
    const bytes = await storageDriver(row.driver).get(`${row.key}/${file}`);
    if (!bytes || sha256(bytes) !== row.sha256[file]) return new Response(null, { status: 502 });
    // Explicit own-origin version prefix also works inside the opaque sandbox.
    // Next's request URL may use its internal localhost host behind a proxy.
    const host = request.headers.get("host") ?? new URL(request.url).host;
    if (!/^(?:[a-z0-9.-]+|\[[a-f0-9:]+\])(?::\d+)?$/i.test(host))
      return new Response(null, { status: 400 });
    const protocol =
      request.headers.get("x-forwarded-proto") === "https"
        ? "https:"
        : new URL(request.url).protocol;
    const base = `${protocol}//${host}/g/${id}/${version}/`;
    const csp = `default-src 'self'; sandbox allow-scripts; script-src ${base}; style-src ${base} 'unsafe-inline'; img-src ${base} data: blob:; connect-src ${base}; font-src ${base}; media-src ${base} blob:; worker-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'`;
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": types[file.split(".").at(-1) ?? ""] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Security-Policy": csp,
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        ETag: `"${row.sha256[file]}"`,
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
