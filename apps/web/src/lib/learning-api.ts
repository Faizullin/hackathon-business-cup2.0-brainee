import { type GameResult, type LearningCompletion, parseLearningGameResult } from "@brainee/core";
import { getGame } from "@brainee/games";

export type IssuedGame = { sessionId: string; gameId: string; level: number; seed: number };
export type PendingFinish = { issued: IssuedGame; result: GameResult };
const PENDING_KEY = "brainee-pending-finish-v1";

export class LearningApiError extends Error {
  constructor(public readonly status: number) {
    super(`Learning request failed (${status}).`);
  }
}
export const canRetryFinish = (error: unknown) =>
  !(error instanceof LearningApiError) || error.status >= 500 || error.status === 429;

export async function learningRequest<T>(
  path: string,
  options: { body?: unknown; post?: boolean; signal?: AbortSignal } = {},
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = setTimeout(abort, 20_000);
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await fetch(path, {
      method: options.post ? "POST" : "GET",
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
      ...(options.body === undefined
        ? {}
        : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(options.body) }),
    });
    if (!response.ok) throw new LearningApiError(response.status);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}

export type FinishReply = { replayed: boolean; completion: LearningCompletion };

/** Only unacknowledged results go into tab storage; balances always come from /api/state. */
export function readPendingFinish(): PendingFinish | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? "null");
    const issued = value?.issued;
    if (
      !issued ||
      typeof issued.sessionId !== "string" ||
      !/^[a-f0-9-]{36}$/i.test(issued.sessionId) ||
      typeof issued.gameId !== "string"
    )
      return null;
    const game = getGame(issued.gameId);
    if (
      !game ||
      !Number.isSafeInteger(issued.level) ||
      issued.level < 1 ||
      issued.level > game.levels ||
      !Number.isSafeInteger(issued.seed) ||
      issued.seed < 0 ||
      issued.seed > 0xffffffff ||
      !Number.isSafeInteger(value.result?.rounds) ||
      value.result.rounds <= 0
    )
      return null;
    // Structural check only; the API checks its catalog and ownership before rewarding.
    const result = parseLearningGameResult(value.result, {
      id: game.id,
      levels: game.levels,
      roundsPerSession: value.result.rounds,
    });
    if (!result || result.level !== issued.level) return null;
    return {
      issued: {
        sessionId: issued.sessionId,
        gameId: issued.gameId,
        level: issued.level,
        seed: issued.seed,
      },
      result,
    };
  } catch {
    return null;
  }
}

export function storePendingFinish(pending: PendingFinish | null) {
  try {
    if (pending) sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    else sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* Retry in memory when tab storage is blocked. */
  }
}

export function pendingGameHref(issued: IssuedGame) {
  return `/game/${encodeURIComponent(issued.gameId)}?level=${issued.level}&seed=${issued.seed}`;
}
