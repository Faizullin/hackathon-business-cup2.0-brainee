import "server-only";

import { type Database, demoTokenHash, LearningStoreError, openDatabase } from "@brainee/db";
import { type NextRequest, NextResponse } from "next/server";

export const DEMO_COOKIE = "brainee_demo";
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}

export function requireDemoToken(request: NextRequest) {
  const hash = demoTokenHash(request.cookies.get(DEMO_COOKIE)?.value);
  if (!hash) throw new ApiError(401, "unauthorized");
  return hash;
}

/** Small JSON-only contract, bounded even when Content-Length is absent. */
export async function readDemoJson(request: NextRequest): Promise<unknown> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? ""))
    throw new ApiError(415, "json-required");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "invalid-json");
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > 4096) {
      await reader.cancel();
      throw new ApiError(413, "body-too-large");
    }
    text += decoder.decode(chunk.value, { stream: true });
  }
  text += decoder.decode();
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "invalid-json");
  }
}

/** No implicit seeding, process-wide connection or client-supplied family identity. */
export async function demoApi(
  request: NextRequest,
  handle: (db: Database, now: Date) => Promise<NextResponse>,
) {
  let connection: Awaited<ReturnType<typeof openDatabase>> | undefined;
  let response: NextResponse;
  try {
    if (process.env.DEMO_MODE !== "1") throw new ApiError(404, "not-found");
    // NextURL normalizes loopback names; compare against the actual HTTP host.
    const origin = new URL(request.url);
    origin.host = request.headers.get("host") ?? origin.host;
    if (request.method !== "GET" && request.headers.get("origin") !== origin.origin)
      throw new ApiError(403, "origin-not-allowed");
    connection = await openDatabase();
    response = await handle(connection.db, new Date());
  } catch (error) {
    const statuses = {
      unauthorized: 401,
      "invalid-input": 400,
      "not-found": 404,
      conflict: 409,
      expired: 410,
    } as const;
    const status =
      error instanceof ApiError
        ? error.status
        : error instanceof LearningStoreError
          ? statuses[error.code]
          : 503;
    const code =
      error instanceof ApiError || error instanceof LearningStoreError ? error.code : "unavailable";
    if (status === 503)
      console.error("Demo data request failed", error instanceof Error ? error.name : "unknown");
    response = NextResponse.json({ error: code }, { status });
  } finally {
    connection?.client.close();
  }
  response.headers.set("Cache-Control", "no-store");
  return response;
}
