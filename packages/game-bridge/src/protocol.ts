/**
 * The wire format between a store page (host) and a game in its iframe.
 * Only `hello` and `welcome` travel on `window`; everything else goes over the
 * private `MessagePort` that `welcome` hands to the game.
 */

export const BRIDGE_TAG = "brainee";
export const BRIDGE_PROTOCOL = 2;

export const LOCALES = ["en", "ru", "kk"] as const;
export type Locale = (typeof LOCALES)[number];

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** Who launched the game, sent once in `init`. */
export interface LaunchContext {
  /** Opaque id of this play session; the host alone knows who is playing. */
  sessionId: string;
  gameId: string;
  version: string | null;
  locale: Locale;
  /** The host methods this session may call. */
  hostMethods: string[];
}

export const GAME_PHASES = [
  "ready",
  "started",
  "paused",
  "resumed",
  "completed",
  "exited",
  "error",
] as const;
export type GamePhase = (typeof GAME_PHASES)[number];

/** Game → host on `window`, repeated until welcomed. */
export interface HelloMessage {
  bridge: typeof BRIDGE_TAG;
  type: "hello";
  protocol: number;
  /** The game's contract id, e.g. "puzzle@1". */
  contract: string;
  /** New per page load, so a reloaded frame gets a fresh connection. */
  nonce: string;
}

/** Host → game on `window`, carrying the private port. */
export interface WelcomeMessage {
  bridge: typeof BRIDGE_TAG;
  type: "welcome";
  protocol: number;
  nonce: string;
}

export const BRIDGE_ERROR_CODES = [
  "timeout",
  "unavailable",
  "unknown-method",
  "not-allowed",
  "failed",
] as const;
export type BridgeErrorCode = (typeof BRIDGE_ERROR_CODES)[number];

export type PortMessage =
  | { kind: "init"; context: LaunchContext; config: unknown }
  | { kind: "config"; config: unknown }
  | { kind: "call"; id: number; method: string; args: unknown[] }
  | { kind: "result"; id: number; ok: true; value: unknown }
  | {
      kind: "result";
      id: number;
      ok: false;
      code: BridgeErrorCode;
      error: string;
    }
  | {
      kind: "event";
      eventId: string;
      name: string;
      payload: Record<string, unknown>;
      at: string;
    }
  | { kind: "state"; values: Record<string, unknown> }
  | {
      kind: "lifecycle";
      phase: GamePhase;
      detail?: Record<string, unknown>;
    };

export class BridgeError extends Error {
  readonly code: BridgeErrorCode;

  constructor(code: BridgeErrorCode, message: string) {
    super(message);
    this.name = "BridgeError";
    this.code = code;
  }
}

export function isHello(data: unknown): data is HelloMessage {
  const message = data as Partial<HelloMessage> | null;
  return (
    message?.bridge === BRIDGE_TAG &&
    message.type === "hello" &&
    typeof message.nonce === "string" &&
    typeof message.contract === "string"
  );
}

export function isWelcome(data: unknown): data is WelcomeMessage {
  const message = data as Partial<WelcomeMessage> | null;
  return (
    message?.bridge === BRIDGE_TAG &&
    message.type === "welcome" &&
    typeof message.nonce === "string"
  );
}

/** The slice of `window` the handshake needs; tests pass fakes. */
export interface WindowLike {
  postMessage(message: unknown, targetOrigin: string, transfer?: Transferable[]): void;
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  removeEventListener(type: "message", listener: (event: MessageEvent) => void): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function includes<T extends string>(list: readonly T[], value: unknown): value is T {
  return (list as readonly unknown[]).includes(value);
}

/**
 * Structural check of anything that arrived on a port. Returns `null` for
 * anything that isn't a well-formed `PortMessage`; payload contents are
 * validated later, per contract.
 */
export function parsePortMessage(data: unknown): PortMessage | null {
  if (!isRecord(data) || typeof data.kind !== "string") return null;
  const message = data as Record<string, unknown> & PortMessage;

  switch (data.kind) {
    case "init":
      return isRecord(data.context) &&
        typeof data.context.sessionId === "string" &&
        Array.isArray(data.context.hostMethods)
        ? message
        : null;
    case "config":
      return "config" in data ? message : null;
    case "call":
      return Number.isInteger(data.id) &&
        typeof data.method === "string" &&
        Array.isArray(data.args)
        ? message
        : null;
    case "result":
      if (!Number.isInteger(data.id) || typeof data.ok !== "boolean") return null;
      if (data.ok) return message;
      return includes(BRIDGE_ERROR_CODES, data.code) && typeof data.error === "string"
        ? message
        : null;
    case "event": {
      // N−1 used id; normalize it before validation and deduplication.
      const event = { ...data, eventId: data.eventId ?? data.id };
      return typeof event.eventId === "string" &&
        typeof data.name === "string" &&
        isRecord(data.payload) &&
        typeof data.at === "string"
        ? (event as unknown as PortMessage)
        : null;
    }
    case "state":
      return isRecord(data.values) ? message : null;
    case "lifecycle":
      return includes(GAME_PHASES, data.phase) &&
        (data.detail === undefined || isRecord(data.detail))
        ? message
        : null;
    default:
      return null;
  }
}

/** `config` patches: plain objects merge shallowly, anything else replaces. */
export function mergeConfig(current: unknown, patch: unknown): unknown {
  return isRecord(current) && isRecord(patch) ? { ...current, ...patch } : patch;
}

/** Random id that works outside secure contexts too (LAN testing over http). */
export function createId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to the non-crypto id.
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
