// Server/scripts only. Port of GSP's driver-id + storage-key boundary; no browser URLs or PECS API.
import { createHash, createHmac, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { remoteCatalogSchema, safePath } from "./remote";

export const sha256 = (bytes: Uint8Array | string) =>
  createHash("sha256").update(bytes).digest("hex");
export interface StorageDriver {
  id: "fs" | "r2";
  get(key: string): Promise<Buffer | null>;
  put(key: string, bytes: Uint8Array): Promise<void>;
}
export function fsDriver(root: string): StorageDriver {
  const path = (key: string) => {
    if (!safePath(key)) throw new Error("Invalid storage key");
    return resolve(root, key);
  };
  return {
    id: "fs",
    async get(key) {
      try {
        return await readFile(path(key));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
      }
    },
    async put(key, bytes) {
      const file = path(key);
      await mkdir(dirname(file), { recursive: true });
      const temp = `${file}.${randomUUID()}.tmp`;
      await writeFile(temp, bytes);
      await rename(temp, file);
    },
  };
}
const hmac = (key: string | Buffer, data: string) =>
  createHmac("sha256", key).update(data).digest();
export function signedHeaders(
  method: string,
  url: URL,
  bytes: Uint8Array,
  access: string,
  secret: string,
  now = new Date(),
) {
  const date = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const day = date.slice(0, 8);
  const hash = sha256(bytes);
  const scope = `${day}/auto/s3/aws4_request`;
  const names = "host;x-amz-content-sha256;x-amz-date";
  const canonical = `${method}\n${url.pathname}\n${url.searchParams.toString()}\nhost:${url.host}\nx-amz-content-sha256:${hash}\nx-amz-date:${date}\n\n${names}\n${hash}`;
  const key = hmac(hmac(hmac(hmac(`AWS4${secret}`, day), "auto"), "s3"), "aws4_request");
  const signature = hmac(key, `AWS4-HMAC-SHA256\n${date}\n${scope}\n${sha256(canonical)}`).toString(
    "hex",
  );
  return {
    "x-amz-date": date,
    "x-amz-content-sha256": hash,
    Authorization: `AWS4-HMAC-SHA256 Credential=${access}/${scope}, SignedHeaders=${names}, Signature=${signature}`,
  };
}
/** Hard namespace boundary: never write another project's bucket objects. */
export function r2ObjectKey(key: string) {
  if (!safePath(key) || (key !== "catalog.json" && !key.startsWith("games/")))
    throw new Error("Invalid Brainy storage key");
  return `brainy/${key}`;
}
export function storageDriver(
  id = process.env.REMOTE_GAMES_DRIVER ?? "fs",
  env: NodeJS.ProcessEnv = process.env,
): StorageDriver {
  if (id === "fs")
    return fsDriver(
      env.REMOTE_GAMES_DIR ??
        resolve(
          process.cwd(),
          process.cwd().endsWith("apps/web") ? "../../data/remote-games" : "data/remote-games",
        ),
    );
  if (id !== "r2") throw new Error("Unknown storage driver");
  const {
    R2_ACCOUNT_ID: account,
    R2_ACCESS_KEY_ID: access,
    R2_SECRET_ACCESS_KEY: secret,
    R2_BUCKET: primaryBucket,
  } = env;
  const bucket = primaryBucket ?? env.R2_BUCKET_NAME;
  if (!account || !access || !secret || !bucket) throw new Error("Missing server R2 configuration");
  const credentials = { bucket, access, secret };
  const endpoint =
    env.R2_ENDPOINT ?? env.R2_ENDPOINT_URL ?? `https://${account}.r2.cloudflarestorage.com`;
  async function request(method: string, key: string, bytes: Uint8Array = new Uint8Array()) {
    if (!safePath(key) || !/^[a-zA-Z0-9._-]+$/.test(credentials.bucket))
      throw new Error("Invalid storage key/bucket");
    const url = new URL(`${endpoint.replace(/\/$/, "")}/${bucket}/${r2ObjectKey(key)}`);
    if (url.protocol !== "https:" || url.username || url.password || url.search)
      throw new Error("Invalid R2 endpoint");
    const response = await fetch(url, {
      method,
      headers: signedHeaders(method, url, bytes, credentials.access, credentials.secret),
      ...(method === "PUT" ? { body: Buffer.from(bytes) } : {}),
      redirect: "error",

      signal: AbortSignal.timeout(30000),
    });
    if (method === "GET" && response.status === 404) return null;
    if (!response.ok) throw new Error(`R2 ${method} failed (${response.status})`);
    return Buffer.from(await response.arrayBuffer());
  }
  return {
    id: "r2",
    get: (key) => request("GET", key),
    async put(key, bytes) {
      await request("PUT", key, bytes);
    },
  };
}
export async function readRemoteCatalog(driver = storageDriver()) {
  const bytes = await driver.get("catalog.json");
  return bytes ? remoteCatalogSchema.parse(JSON.parse(bytes.toString("utf8"))) : [];
}
